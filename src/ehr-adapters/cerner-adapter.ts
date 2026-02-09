import { BaseEHRAdapter } from './base-adapter.js';
import { EHRFeature, EHRVendor } from './types.js';

/**
 * Cerner (Oracle Health) EHR adapter stub.
 * TODO: Implement Cerner-specific FHIR R4 behaviors.
 */
export class CernerEHRAdapter extends BaseEHRAdapter {
    readonly vendor: EHRVendor = 'cerner';

    getDefaultScopes(): string {
        return 'openid fhirUser launch profile user/Patient.read user/Observation.read user/Condition.read user/MedicationRequest.read online_access';
    }

    supportsFeature(feature: EHRFeature): boolean {
        switch (feature) {
            case 'bulk-data':
                return false;
            default:
                return true;
        }
    }
}
