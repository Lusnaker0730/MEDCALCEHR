import { BaseEHRAdapter } from './base-adapter.js';
import {
    EHRAdapterConfig,
    EHRFeature,
    EHRVendor,
    AuthorizationParams,
    ObservationQuery
} from './types.js';
import { FHIR_CODE_SYSTEMS } from '../fhir-codes.js';

export class EpicEHRAdapter extends BaseEHRAdapter {
    readonly vendor: EHRVendor = 'epic';

    getDefaultScopes(): string {
        return 'openid fhirUser launch launch/patient patient/Patient.read patient/Observation.read patient/Condition.read patient/MedicationRequest.read';
    }

    getAuthorizationParams(config: EHRAdapterConfig): AuthorizationParams {
        const params = super.getAuthorizationParams(config);
        if (config.fhirBaseUrl) {
            params.extraParams = { aud: config.fhirBaseUrl };
        }
        return params;
    }

    buildObservationQuery(query: ObservationQuery): string {
        const code = query.code.includes('|')
            ? query.code
            : `${FHIR_CODE_SYSTEMS.LOINC}|${query.code}`;
        let url = `Observation?code=${code}`;
        url += `&_sort=${query.sort || '-date'}`;
        url += `&_count=${query.count || 1}`;
        if (query.dateFilter) {
            url += `&date=${query.dateFilter}`;
        }
        return url;
    }

    supportsFeature(feature: EHRFeature): boolean {
        switch (feature) {
            case 'text-search':
            case 'offline-access':
            case 'audit-event':
            case 'bulk-data':
                return false;
            default:
                return true;
        }
    }

    transformCode(loincCode: string): string {
        if (loincCode.includes('|')) return loincCode;
        return `${FHIR_CODE_SYSTEMS.LOINC}|${loincCode}`;
    }
}
