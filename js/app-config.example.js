/**
 * MEDCALCEHR Runtime Configuration — Example
 *
 * Copy this file to js/app-config.js and fill in your environment-specific values.
 * For Docker deployments, the entrypoint script generates this file automatically
 * from environment variables (see docker-entrypoint.sh).
 *
 * DO NOT commit js/app-config.js with real credentials to version control.
 */
window.MEDCALC_CONFIG = {
    fhir: {
        // SMART on FHIR OAuth2 client ID registered with your EHR vendor
        clientId: 'YOUR_CLIENT_ID_HERE',

        // OAuth2 scopes — adjust based on your EHR's supported scopes
        scope: 'openid fhirUser launch profile user/Patient.rs user/Observation.rs user/Condition.rs user/MedicationRequest.rs offline_access',

        // Redirect URI after OAuth2 authorization completes
        redirectUri: './index.html'
    },
    session: {
        // Minutes of inactivity before auto-logout (0 to disable)
        timeoutMinutes: 15,

        // Minutes before timeout to show warning overlay
        warningMinutes: 2
    },

    // EHR vendor adapter (optional — omit for generic FHIR R4 behavior)
    ehr: {
        // Vendor: 'epic', 'cerner', 'meditech', or 'generic' (default)
        vendor: 'generic',

        // FHIR base URL (optional, auto-detected from SMART launch if omitted)
        // fhirBaseUrl: 'https://fhir.example.com/R4',

        // Vendor-specific overrides (optional)
        // vendorConfig: {}
    },

    // Sentry error tracking (optional — omit or leave dsn empty to disable)
    sentry: {
        // Sentry DSN from your project settings
        dsn: '',

        // Environment tag for filtering in Sentry dashboard
        environment: 'development',

        // Error sample rate (0.0 to 1.0)
        sampleRate: 1.0
    }
};
