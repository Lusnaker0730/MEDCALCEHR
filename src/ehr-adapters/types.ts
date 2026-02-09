export type EHRVendor = 'epic' | 'cerner' | 'meditech' | 'generic';

export interface EHRAdapterConfig {
    vendor: EHRVendor;
    fhirBaseUrl?: string;
    clientId: string;
    scope?: string;
    redirectUri?: string;
    vendorConfig?: Record<string, unknown>;
}

export interface ObservationQuery {
    code: string;
    count?: number;
    sort?: string;
    dateFilter?: string;
}

export interface ObservationQueryResult {
    rawResponse: unknown;
    entries: unknown[];
}

export interface AuthorizationParams {
    clientId: string;
    scope: string;
    redirectUri: string;
    extraParams?: Record<string, string>;
}

export type EHRFeature =
    | 'text-search'
    | 'date-filter'
    | 'component-observation'
    | 'provenance'
    | 'audit-event'
    | 'offline-access'
    | 'medication-request'
    | 'condition'
    | 'bulk-data';

export interface EHRAdapter {
    readonly vendor: EHRVendor;
    buildObservationQuery(query: ObservationQuery): string;
    processObservationResponse(response: unknown): ObservationQueryResult;
    getAuthorizationParams(config: EHRAdapterConfig): AuthorizationParams;
    getDefaultScopes(): string;
    supportsFeature(feature: EHRFeature): boolean;
    transformCode(loincCode: string): string;
    getPatientRequestUrl(baseUrl: string): string;
}
