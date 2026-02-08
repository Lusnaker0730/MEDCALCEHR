// src/fhir-launch.ts — SMART on FHIR OAuth2 launch
import FHIR from 'fhirclient';

// Window.MEDCALC_CONFIG type declared in src/types/global.d.ts

const config = window.MEDCALC_CONFIG?.fhir || {};

FHIR.oauth2.authorize({
    client_id: config.clientId || 'e1b41914-e2b5-4475-90ba-29022b57f820',
    scope: config.scope || 'openid fhirUser launch profile user/Patient.rs user/Observation.rs user/Condition.rs user/MedicationRequest.rs offline_access',
    redirect_uri: config.redirectUri || './index.html',
});
