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

/**
 * Set up authenticated FHIR context for E2E tests.
 *
 * 1. Sets sessionStorage SMART_KEY to bypass auth-redirect.js guard
 * 2. Overrides window.FHIR via addInitScript so oauth2.ready() resolves
 *    with a mock client backed by fixture data
 * 3. Blocks CDN scripts (fhirclient, chart.js) to eliminate network deps
 */
interface AuthOptions {
    sessionTimeoutMinutes?: number;
    sessionWarningMinutes?: number;
}

export async function setupAuthenticatedContext(page: Page, options?: AuthOptions) {
    const timeoutMinutes = options?.sessionTimeoutMinutes ?? 15;
    const warningMinutes = options?.sessionWarningMinutes ?? 2;

    // Block CDN scripts — our addInitScript already provides window.FHIR
    await page.route('**/cdn.jsdelivr.net/**', route => route.fulfill({
        status: 200,
        contentType: 'text/javascript',
        body: '/* blocked by e2e */',
    }));

    // Block app-config.js and provide mock config
    await page.route('**/js/app-config.js', route => route.fulfill({
        status: 200,
        contentType: 'text/javascript',
        body: `window.MEDCALC_CONFIG = {
            fhir: { clientId: 'test-client', scope: 'launch/patient openid', redirectUri: 'http://localhost:8000/index.html' },
            session: { timeoutMinutes: ${timeoutMinutes}, warningMinutes: ${warningMinutes} }
        };`,
    }));

    // Inject FHIR mock BEFORE any page script runs
    await page.addInitScript({
        content: `
        // 1. Bypass auth-redirect.js guard
        sessionStorage.setItem('SMART_KEY', JSON.stringify({
            serverUrl: 'http://mock-fhir-server',
            tokenResponse: {
                access_token: 'mock-token-e2e',
                patient: '${patient.id}',
                expires_in: 3600
            }
        }));

        // 2. Fixture data (embedded)
        const __PATIENT__ = ${JSON.stringify(patient)};
        const __OBSERVATIONS__ = ${JSON.stringify(observations)};
        const __PRACTITIONER__ = ${JSON.stringify(practitioner)};

        // 3. Mock FHIR client
        const mockClient = {
            patient: {
                id: __PATIENT__.id,
                read: function() { return Promise.resolve(__PATIENT__); },
                request: function(url) {
                    // Extract LOINC code from Observation?code=XXXX
                    const match = url.match(/Observation\\?code=([^&]+)/);
                    if (match) {
                        const codes = match[1].split(',');
                        for (const code of codes) {
                            if (__OBSERVATIONS__[code.trim()]) {
                                return Promise.resolve(__OBSERVATIONS__[code.trim()]);
                            }
                        }
                        return Promise.resolve({ resourceType: 'Bundle', type: 'searchset', total: 0, entry: [] });
                    }
                    // Condition, MedicationRequest, etc — return empty bundle
                    return Promise.resolve({ resourceType: 'Bundle', type: 'searchset', total: 0, entry: [] });
                }
            },
            user: {
                read: function() { return Promise.resolve(__PRACTITIONER__); }
            },
            request: function(url) {
                return mockClient.patient.request(url);
            }
        };

        // 4. Override window.FHIR
        Object.defineProperty(window, 'FHIR', {
            configurable: true,
            get: function() {
                return {
                    oauth2: {
                        ready: function() { return Promise.resolve(mockClient); }
                    }
                };
            }
        });
        `
    });
}

/**
 * Set up an unauthenticated context where no SMART_KEY exists.
 * Blocks CDN scripts and provides a stub window.FHIR that rejects.
 */
export async function setupUnauthenticatedContext(page: Page) {
    await page.route('**/cdn.jsdelivr.net/**', route => route.fulfill({
        status: 200,
        contentType: 'text/javascript',
        body: '/* blocked by e2e */',
    }));

    await page.route('**/js/app-config.js', route => route.fulfill({
        status: 200,
        contentType: 'text/javascript',
        body: `window.MEDCALC_CONFIG = {
            fhir: { clientId: 'test-client', scope: 'launch/patient openid', redirectUri: 'http://localhost:8000/index.html' },
            session: { timeoutMinutes: 15, warningMinutes: 2 }
        };`,
    }));

    // Do NOT set sessionStorage — let auth-redirect.js do its thing
}

/**
 * Set up authenticated context but with empty FHIR data (no observations).
 * Useful for testing manual input flows.
 */
export async function setupAuthenticatedEmptyFhir(page: Page) {
    await page.route('**/cdn.jsdelivr.net/**', route => route.fulfill({
        status: 200,
        contentType: 'text/javascript',
        body: '/* blocked by e2e */',
    }));

    await page.route('**/js/app-config.js', route => route.fulfill({
        status: 200,
        contentType: 'text/javascript',
        body: `window.MEDCALC_CONFIG = {
            fhir: { clientId: 'test-client', scope: 'launch/patient openid', redirectUri: 'http://localhost:8000/index.html' },
            session: { timeoutMinutes: 15, warningMinutes: 2 }
        };`,
    }));

    await page.addInitScript({
        content: `
        sessionStorage.setItem('SMART_KEY', JSON.stringify({
            serverUrl: 'http://mock-fhir-server',
            tokenResponse: {
                access_token: 'mock-token-e2e',
                patient: '${patient.id}',
                expires_in: 3600
            }
        }));

        const __PATIENT__ = ${JSON.stringify(patient)};

        const mockClient = {
            patient: {
                id: __PATIENT__.id,
                read: function() { return Promise.resolve(__PATIENT__); },
                request: function() {
                    return Promise.resolve({ resourceType: 'Bundle', type: 'searchset', total: 0, entry: [] });
                }
            },
            user: {
                read: function() { return Promise.resolve(${JSON.stringify(practitioner)}); }
            },
            request: function(url) {
                return mockClient.patient.request(url);
            }
        };

        Object.defineProperty(window, 'FHIR', {
            configurable: true,
            get: function() {
                return {
                    oauth2: {
                        ready: function() { return Promise.resolve(mockClient); }
                    }
                };
            }
        });
        `
    });
}

export { patient, observations, practitioner };
