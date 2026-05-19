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

function smartStateScript(stateOverrides: Partial<Record<string, unknown>> = {}) {
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
            fhirUser: `Practitioner/${practitioner.id}`,
            ...((stateOverrides as Record<string, unknown>).tokenResponse as object)
        },
        ...stateOverrides
    };
    return `
        sessionStorage.setItem('SMART_KEY', JSON.stringify(${JSON.stringify(STATE_KEY)}));
        sessionStorage.setItem(${JSON.stringify(STATE_KEY)}, JSON.stringify(${JSON.stringify(state)}));
    `;
}

async function mockAppConfig(
    page: Page,
    timeoutMinutes: number,
    warningMinutes: number
) {
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
                fhir: { clientId: 'test-client', scope: 'launch/patient openid', redirectUri: 'http://localhost:8000/index.html' },
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
                    // CORS: tests run from http://localhost:8000 to a different
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

        // CapabilityStatement
        if (pathname === 'metadata') {
            return respond({
                resourceType: 'CapabilityStatement',
                status: 'active',
                kind: 'instance',
                fhirVersion: '4.0.1',
                format: ['json']
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
