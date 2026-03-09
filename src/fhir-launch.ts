// src/fhir-launch.ts — SMART on FHIR OAuth2 launch
import FHIR from 'fhirclient';
import { initializeAdapter, getActiveAdapter } from './ehr-adapters/index.js';

// Window.MEDCALC_CONFIG type declared in src/types/global.d.ts

const config = window.MEDCALC_CONFIG?.fhir || {};
const ehrConfig = window.MEDCALC_CONFIG?.ehr;

// H-11: Require client ID from configuration — no hardcoded fallback
const clientId = config.clientId;
if (!clientId) {
    throw new Error('FHIR client ID is required. Configure it in app-config.js or MEDCALC_CONFIG.');
}

// Initialize the EHR adapter based on configuration
if (ehrConfig?.vendor) {
    initializeAdapter({
        vendor: ehrConfig.vendor,
        clientId,
        fhirBaseUrl: ehrConfig.fhirBaseUrl,
        scope: config.scope,
        redirectUri: config.redirectUri,
        vendorConfig: ehrConfig.vendorConfig as Record<string, unknown> | undefined
    });
}

// Build authorization params — delegate to adapter if available
const adapter = getActiveAdapter();
const authParams = adapter
    ? adapter.getAuthorizationParams({
        vendor: ehrConfig?.vendor || 'generic',
        clientId,
        scope: config.scope,
        redirectUri: config.redirectUri
    })
    : null;

// H-11: Use validated clientId from config (no hardcoded fallback)
const resolvedClientId = authParams?.clientId || clientId;
if (!resolvedClientId) {
    throw new Error('FHIR client ID is required. Configure it in app-config.js or MEDCALC_CONFIG.');
}

// PT-11/H-12: Validate redirect URI against strict allowlist only (no same-origin prefix fallback)
const rawRedirectUri = authParams?.redirectUri || config.redirectUri || './index.html';
const ALLOWED_REDIRECTS = ['./index.html', '/index.html', 'index.html'];
const redirectUri = ALLOWED_REDIRECTS.includes(rawRedirectUri)
    ? rawRedirectUri
    : './index.html';

// M-06: Use online_access instead of offline_access
const authorizeOptions: Record<string, string> = {
    client_id: resolvedClientId,
    scope: authParams?.scope || config.scope || 'openid fhirUser launch profile user/Patient.rs user/Observation.rs user/Condition.rs user/MedicationRequest.rs online_access',
    redirect_uri: redirectUri,
};

// Standalone launch: if no `iss` in URL query, use fhirBaseUrl from config
const urlParams = new URLSearchParams(window.location.search);
if (!urlParams.has('iss') && !urlParams.has('fhirServiceUrl')) {
    const fhirBaseUrl = ehrConfig?.fhirBaseUrl || config.fhirServiceUrl;
    if (fhirBaseUrl) {
        authorizeOptions.fhirServiceUrl = fhirBaseUrl;
    }
}

// M-07: Merge extra params from the adapter, but prevent overriding critical fields
if (authParams?.extraParams) {
    const safeParams = { ...authParams.extraParams };
    delete safeParams.client_id;
    delete safeParams.redirect_uri;
    delete safeParams.scope;
    Object.assign(authorizeOptions, safeParams);
}

FHIR.oauth2.authorize(authorizeOptions);
