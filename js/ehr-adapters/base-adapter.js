export class BaseEHRAdapter {
    buildObservationQuery(query) {
        let url = `Observation?code=${query.code}`;
        url += `&_sort=${query.sort || '-date'}`;
        url += `&_count=${query.count || 1}`;
        if (query.dateFilter) {
            url += `&date=${query.dateFilter}`;
        }
        return url;
    }
    processObservationResponse(response) {
        const bundle = response;
        const entries = bundle?.entry?.map(e => e.resource) || [];
        return { rawResponse: response, entries };
    }
    getAuthorizationParams(config) {
        return {
            clientId: config.clientId,
            scope: config.scope || this.getDefaultScopes(),
            redirectUri: config.redirectUri || './index.html'
        };
    }
    getDefaultScopes() {
        return 'openid fhirUser launch profile user/Patient.rs user/Observation.rs user/Condition.rs user/MedicationRequest.rs offline_access';
    }
    supportsFeature(_feature) {
        return true;
    }
    transformCode(loincCode) {
        return loincCode;
    }
    getPatientRequestUrl(baseUrl) {
        return baseUrl;
    }
}
