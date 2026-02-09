import { BaseEHRAdapter } from './base-adapter.js';
import { EHRFeature, EHRVendor } from './types.js';

/**
 * MEDITECH EHR adapter stub.
 * TODO: Implement MEDITECH-specific FHIR behaviors.
 */
export class MeditechEHRAdapter extends BaseEHRAdapter {
    readonly vendor: EHRVendor = 'meditech';

    supportsFeature(feature: EHRFeature): boolean {
        switch (feature) {
            case 'text-search':
            case 'offline-access':
            case 'audit-event':
            case 'provenance':
            case 'bulk-data':
                return false;
            default:
                return true;
        }
    }
}
