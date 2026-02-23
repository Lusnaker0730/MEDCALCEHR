import { BaseEHRAdapter } from './base-adapter.js';
import { FHIR_CODE_SYSTEMS } from '../fhir-codes.js';
export class EpicEHRAdapter extends BaseEHRAdapter {
    constructor() {
        super(...arguments);
        this.vendor = 'epic';
    }
    getDefaultScopes() {
        return 'openid fhirUser launch launch/patient patient/Patient.read patient/Observation.read patient/Condition.read patient/MedicationRequest.read';
    }
    getAuthorizationParams(config) {
        const params = super.getAuthorizationParams(config);
        if (config.fhirBaseUrl) {
            params.extraParams = { aud: config.fhirBaseUrl };
        }
        return params;
    }
    buildObservationQuery(query) {
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
    supportsFeature(feature) {
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
    transformCode(loincCode) {
        if (loincCode.includes('|'))
            return loincCode;
        return `${FHIR_CODE_SYSTEMS.LOINC}|${loincCode}`;
    }
}
