import { BaseEHRAdapter } from './base-adapter.js';
/**
 * Cerner (Oracle Health) EHR adapter stub.
 * TODO: Implement Cerner-specific FHIR R4 behaviors.
 */
export class CernerEHRAdapter extends BaseEHRAdapter {
    constructor() {
        super(...arguments);
        this.vendor = 'cerner';
    }
    getDefaultScopes() {
        return 'openid fhirUser launch profile user/Patient.read user/Observation.read user/Condition.read user/MedicationRequest.read online_access';
    }
    supportsFeature(feature) {
        switch (feature) {
            case 'bulk-data':
                return false;
            default:
                return true;
        }
    }
}
