import {
    EHRAdapter,
    EHRAdapterConfig,
    EHRFeature,
    EHRVendor,
    AuthorizationParams,
    ObservationQuery,
    ObservationQueryResult
} from './types.js';

export abstract class BaseEHRAdapter implements EHRAdapter {
    abstract readonly vendor: EHRVendor;

    buildObservationQuery(query: ObservationQuery): string {
        let url = `Observation?code=${query.code}`;
        url += `&_sort=${query.sort || '-date'}`;
        url += `&_count=${query.count || 1}`;
        if (query.dateFilter) {
            url += `&date=${query.dateFilter}`;
        }
        return url;
    }

    processObservationResponse(response: unknown): ObservationQueryResult {
        const bundle = response as { entry?: Array<{ resource: unknown }> };
        const entries = bundle?.entry?.map(e => e.resource) || [];
        return { rawResponse: response, entries };
    }

    getAuthorizationParams(config: EHRAdapterConfig): AuthorizationParams {
        return {
            clientId: config.clientId,
            scope: config.scope || this.getDefaultScopes(),
            redirectUri: config.redirectUri || './index.html'
        };
    }

    getDefaultScopes(): string {
        return 'openid fhirUser launch profile user/Patient.rs user/Observation.rs user/Condition.rs user/MedicationRequest.rs offline_access';
    }

    supportsFeature(_feature: EHRFeature): boolean {
        return true;
    }

    transformCode(loincCode: string): string {
        return loincCode;
    }

    getPatientRequestUrl(baseUrl: string): string {
        return baseUrl;
    }
}
