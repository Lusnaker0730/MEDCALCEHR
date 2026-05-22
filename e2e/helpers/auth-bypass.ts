import { Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.resolve(__dirname, '..', 'fixtures');

function loadFixture(name: string) {
    return JSON.parse(fs.readFileSync(path.join(fixturesDir, name), 'utf-8'));
}

const patient = loadFixture('fhir-patient.json');
const observations = loadFixture('fhir-observations.json');
const practitioner = loadFixture('fhir-practitioner.json');

interface AuthOptions {
    sessionTimeoutMinutes?: number;
    sessionWarningMinutes?: number;
}

// fhirclient resolves a session via:
//   1. sessionStorage[SMART_KEY] → state-key (string)
//   2. sessionStorage[state-key] → full state object
// Mock both keys in this order so `FHIR.oauth2.ready()` resolves naturally
// using the bundled fhirclient module instead of relying on `window.FHIR`
// (which is unreachable from bundled code under vite preview / production).
//
// Use a real-looking https URL (Playwright `page.route` will intercept it
// before any DNS lookup) — fhirclient's URL parsing chokes on schemes that
// look invalid.
const MOCK_SERVER = 'https://mock-fhir.test.local/fhir';
const STATE_KEY = 'mock-e2e-state';

// Build an unsigned JWT (header.payload.signature) with only the fhirUser
// claim. fhirclient's `client.user.read()` resolves the practitioner ID by
// JWT-decoding tokenResponse.id_token's payload; the signature is never
// verified, so 'alg:none' with an empty signature is sufficient for tests.
function buildIdToken(fhirUser: string): string {
    const b64url = (obj: object) =>
        Buffer.from(JSON.stringify(obj))
            .toString('base64')
            .replace(/=+$/, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');
    const header = b64url({ alg: 'none', typ: 'JWT' });
    const payload = b64url({ fhirUser, profile: fhirUser });
    return `${header}.${payload}.`;
}

function smartStateScript(stateOverrides: Partial<Record<string, unknown>> = {}) {
    const fhirUser = `Practitioner/${practitioner.id}`;
    const state = {
        serverUrl: MOCK_SERVER,
        clientId: 'test-client',
        scope: 'launch/patient openid fhirUser',
        tokenResponse: {
            access_token: 'mock-token-e2e',
            token_type: 'Bearer',
            expires_in: 3600,
            scope: 'launch/patient openid fhirUser',
            patient: patient.id,
            fhirUser,
            // id_token is required for `client.user.read()` — fhirclient
            // reads the practitioner ID from this JWT's fhirUser claim.
            id_token: buildIdToken(fhirUser),
            ...((stateOverrides as Record<string, unknown>).tokenResponse as object)
        },
        ...stateOverrides
    };
    return `
        sessionStorage.setItem('SMART_KEY', JSON.stringify(${JSON.stringify(STATE_KEY)}));
        sessionStorage.setItem(${JSON.stringify(STATE_KEY)}, JSON.stringify(${JSON.stringify(state)}));
    `;
}

/**
 * Strip the CSP `upgrade-insecure-requests` directive from served HTML.
 *
 * Production index.html ships with `upgrade-insecure-requests` in its CSP
 * meta tag, which webkit honors even when Playwright sets `bypassCSP: true`
 * (the directive is a security-positive transform, not a restriction).
 * Webkit then upgrades every script/asset fetch from
 * `http://localhost:4173/...` to `https://localhost:4173/...`, and the vite
 * preview server — serving HTTP only — fails the TLS handshake. The result
 * is a page that loads index.html but executes zero JS.
 *
 * Chromium/firefox don't auto-upgrade in the test context, so they're
 * unaffected. Stripping the directive only affects the e2e environment;
 * production behavior is preserved.
 */
async function stripUpgradeInsecureCSP(page: Page) {
    await page.route(/\.html(\?.*)?$/, async route => {
        try {
            const response = await route.fetch();
            const body = (await response.text()).replace(
                /\s*upgrade-insecure-requests;?/gi,
                ''
            );
            await route.fulfill({
                response,
                body,
                headers: response.headers()
            });
        } catch {
            // Fall back to the original response if interception fails.
            await route.continue();
        }
    });
}

async function mockAppConfig(
    page: Page,
    timeoutMinutes: number,
    warningMinutes: number
) {
    await stripUpgradeInsecureCSP(page);

    await page.route('**/cdn.jsdelivr.net/**', route =>
        route.fulfill({
            status: 200,
            contentType: 'text/javascript',
            body: '/* blocked by e2e */'
        })
    );

    await page.route('**/js/app-config.js', route =>
        route.fulfill({
            status: 200,
            contentType: 'text/javascript',
            body: `window.MEDCALC_CONFIG = {
                fhir: { clientId: 'test-client', scope: 'launch/patient openid', redirectUri: 'http://localhost:4173/index.html' },
                session: { timeoutMinutes: ${timeoutMinutes}, warningMinutes: ${warningMinutes} }
            };`
        })
    );
}

/**
 * Intercept FHIR REST calls so the bundled fhirclient gets fixture data
 * back from the mock server URL stored in the SMART session.
 *
 * Routes handled (all relative to MOCK_SERVER):
 *   GET /Patient/{id}           → patient fixture
 *   GET /Practitioner/{id}      → practitioner fixture
 *   GET /Observation?code=...   → observation Bundle by LOINC code (or empty)
 *   GET /metadata               → minimal CapabilityStatement
 *   *   /Condition|MedReq|...   → empty Bundle
 */
async function mockFhirEndpoints(page: Page, withObservations: boolean) {
    // Match the FHIR base path. `MOCK_SERVER` includes the `/fhir` prefix, so
    // strip it from the pathname before matching resource types.
    const basePath = new URL(MOCK_SERVER).pathname.replace(/^\//, '').replace(/\/$/, '');

    await page.route(`${MOCK_SERVER}/**`, async route => {
        const url = new URL(route.request().url());
        let pathname = url.pathname.replace(/^\//, '');
        if (basePath && pathname.startsWith(basePath + '/')) {
            pathname = pathname.slice(basePath.length + 1);
        } else if (pathname === basePath) {
            pathname = '';
        }
        const respond = (body: unknown) =>
            route.fulfill({
                status: 200,
                contentType: 'application/fhir+json',
                headers: {
                    // CORS: tests run from http://localhost:4173 to a different
                    // origin (https://mock-fhir.test.local). Without these
                    // headers fetch is blocked and fhirclient throws.
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept'
                },
                body: JSON.stringify(body)
            });

        // Handle CORS preflight
        if (route.request().method() === 'OPTIONS') {
            return route.fulfill({
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept'
                }
            });
        }

        // Patient/{id}
        if (pathname.startsWith('Patient/')) {
            return respond(patient);
        }

        // Practitioner/{id}
        if (pathname.startsWith('Practitioner/')) {
            return respond(practitioner);
        }

        // CapabilityStatement — must list every resource fhirDataService
        // queries AND the search parameters it uses, otherwise fhirclient
        // pre-flights and refuses with "Resource X is not supported" /
        // "No search parameters supported for X".
        if (pathname === 'metadata') {
            const commonSearchParams = [
                { name: 'patient', type: 'reference' as const },
                { name: 'subject', type: 'reference' as const },
                { name: 'code', type: 'token' as const },
                { name: 'category', type: 'token' as const },
                { name: 'date', type: 'date' as const },
                { name: 'status', type: 'token' as const },
                { name: '_sort', type: 'string' as const },
                { name: '_count', type: 'number' as const }
            ];
            const supportedResources = [
                'Patient',
                'Practitioner',
                'Observation',
                'Condition',
                'MedicationRequest',
                'MedicationStatement',
                'AllergyIntolerance',
                'Procedure',
                'Encounter',
                'DiagnosticReport',
                'DocumentReference'
            ];
            return respond({
                resourceType: 'CapabilityStatement',
                status: 'active',
                kind: 'instance',
                fhirVersion: '4.0.1',
                format: ['json'],
                rest: [
                    {
                        mode: 'server',
                        resource: supportedResources.map(type => ({
                            type,
                            interaction: [{ code: 'read' }, { code: 'search-type' }],
                            searchParam: commonSearchParams
                        }))
                    }
                ]
            });
        }

        // Observation?code=<LOINC>
        if (pathname === 'Observation' && url.searchParams.has('code')) {
            if (!withObservations) {
                return respond({
                    resourceType: 'Bundle',
                    type: 'searchset',
                    total: 0,
                    entry: []
                });
            }
            const codes = (url.searchParams.get('code') || '').split(',');
            for (const code of codes) {
                const hit = observations[code.trim()];
                if (hit) return respond(hit);
            }
            return respond({
                resourceType: 'Bundle',
                type: 'searchset',
                total: 0,
                entry: []
            });
        }

        // Conditions, MedicationRequests, AllergyIntolerances, etc — empty
        return respond({
            resourceType: 'Bundle',
            type: 'searchset',
            total: 0,
            entry: []
        });
    });
}

/**
 * Set up authenticated FHIR context for E2E tests.
 *
 * 1. Mocks `app-config.js` and blocks CDN scripts.
 * 2. Pre-populates sessionStorage in fhirclient's expected `SMART_KEY` →
 *    state-key → state format so `FHIR.oauth2.ready()` resolves with a
 *    real client pointing at `http://mock-fhir-server`.
 * 3. Intercepts all `mock-fhir-server` REST calls and returns fixture data.
 */
export async function setupAuthenticatedContext(page: Page, options?: AuthOptions) {
    const timeoutMinutes = options?.sessionTimeoutMinutes ?? 15;
    const warningMinutes = options?.sessionWarningMinutes ?? 2;

    await mockAppConfig(page, timeoutMinutes, warningMinutes);
    await mockFhirEndpoints(page, /* withObservations */ true);

    await page.addInitScript({ content: smartStateScript() });
}

/**
 * Set up an unauthenticated context (no SMART_KEY). Auth-redirect.js will
 * push the page to launch.html.
 */
export async function setupUnauthenticatedContext(page: Page) {
    await mockAppConfig(page, 15, 2);
    // Do NOT set sessionStorage — let auth-redirect.js do its thing
}

/**
 * Set up authenticated context but with empty FHIR data (no observations).
 * Useful for testing manual input flows.
 */
export async function setupAuthenticatedEmptyFhir(page: Page) {
    await mockAppConfig(page, 15, 2);
    await mockFhirEndpoints(page, /* withObservations */ false);
    await page.addInitScript({ content: smartStateScript() });
}

export { patient, observations, practitioner };
