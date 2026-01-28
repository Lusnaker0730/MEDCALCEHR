// SMART on FHIR OAuth2 launch configuration
FHIR.oauth2.authorize({
    // Cerner Registered Application
    client_id: 'e1b41914-e2b5-4475-90ba-29022b57f820',
    // Do NOT hardcode iss - let the launcher provide it via URL parameter
    // iss will be provided by the EHR launch context
    scope: 'openid fhirUser launch profile user/Patient.rs user/Observation.rs user/Condition.rs user/MedicationRequest.rs offline_access',
    redirect_uri: './index.html'
});
