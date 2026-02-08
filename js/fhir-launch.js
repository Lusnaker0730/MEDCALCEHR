// SMART on FHIR OAuth2 launch configuration
// Reads from window.MEDCALC_CONFIG (set by js/app-config.js).
// Falls back to defaults if config is not loaded.
(function () {
    var config = (window.MEDCALC_CONFIG && window.MEDCALC_CONFIG.fhir) || {};

    FHIR.oauth2.authorize({
        client_id: config.clientId || 'e1b41914-e2b5-4475-90ba-29022b57f820',
        scope: config.scope || 'openid fhirUser launch profile user/Patient.rs user/Observation.rs user/Condition.rs user/MedicationRequest.rs offline_access',
        redirect_uri: config.redirectUri || './index.html'
    });
})();
