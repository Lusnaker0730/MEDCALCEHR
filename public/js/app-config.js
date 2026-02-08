// Placeholder: overwritten by docker-entrypoint.sh at runtime.
// For local development, copy js/app-config.example.js to public/js/app-config.js
// and fill in your values.
window.MEDCALC_CONFIG = {
    fhir: {
        clientId: 'e1b41914-e2b5-4475-90ba-29022b57f820',
        scope: 'openid fhirUser launch profile user/Patient.rs user/Observation.rs user/Condition.rs user/MedicationRequest.rs offline_access',
        redirectUri: './index.html'
    },
    session: {
        timeoutMinutes: 15,
        warningMinutes: 2
    }
};
