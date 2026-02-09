// src/fhir-launch.ts — SMART on FHIR OAuth2 launch
import FHIR from 'fhirclient';
import { initializeAdapter, getActiveAdapter } from './ehr-adapters/index.js';

// Window.MEDCALC_CONFIG type declared in src/types/global.d.ts

const config = window.MEDCALC_CONFIG?.fhir || {};
const ehrConfig = window.MEDCALC_CONFIG?.ehr;

// Initialize the EHR adapter based on configuration
if (ehrConfig?.vendor) {
    initializeAdapter({
        vendor: ehrConfig.vendor,
        clientId: config.clientId || 'e1b41914-e2b5-4475-90ba-29022b57f820',
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
        clientId: config.clientId || 'e1b41914-e2b5-4475-90ba-29022b57f820',
        scope: config.scope,
        redirectUri: config.redirectUri
    })
    : null;

const authorizeOptions: Record<string, string> = {
    client_id: authParams?.clientId || config.clientId || 'e1b41914-e2b5-4475-90ba-29022b57f820',
    scope: authParams?.scope || config.scope || 'openid fhirUser launch profile user/Patient.rs user/Observation.rs user/Condition.rs user/MedicationRequest.rs offline_access',
    redirect_uri: authParams?.redirectUri || config.redirectUri || './index.html',
};

// Merge any extra params from the adapter (e.g., Epic's 'aud' parameter)
if (authParams?.extraParams) {
    Object.assign(authorizeOptions, authParams.extraParams);
}

FHIR.oauth2.authorize(authorizeOptions);
