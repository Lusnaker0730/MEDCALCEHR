// src/fhir-data-service.d.ts
// Type definitions for FHIR Data Service

import { DataStalenessTracker } from './data-staleness.js';

/**
 * FHIR Client interface (from fhirclient library)
 */
export interface FHIRClient {
    patient: {
        id: string;
        read: () => Promise<Patient>;
        request: (url: string, options?: any) => Promise<any>;
    };
    request: (url: string, options?: any) => Promise<any>;
}

/**
 * FHIR Patient resource
 */
export interface Patient {
    id: string;
    birthDate?: string;
    gender?: string;
    name?: Array<{
        given?: string[];
        family?: string;
    }>;
}

/**
 * Options for fetching observations
 */
export interface GetObservationOptions {
    skipCache?: boolean;
    trackStaleness?: boolean;
    stalenessLabel?: string;
    targetUnit?: string;
}

/**
 * Result of an observation fetch
 */
export interface ObservationResult {
    observation: any | null;
    value: number | null;
    unit: string | null;
    originalValue: number | null;
    originalUnit: string | null;
    date: Date | null;
    isStale: boolean;
    ageInDays: number | null;
    code: string;
}

/**
 * Options for auto-populating an input field
 */
export interface AutoPopulateOptions {
    transform?: (value: number) => number;
    decimals?: number;
    targetUnit?: string;
    label?: string;
    skipStaleness?: boolean;
}

/**
 * Data requirement for a calculator field
 */
export interface FieldDataRequirement {
    code: string;
    inputId: string;
    label: string;
    targetUnit?: string;
    decimals?: number;
    transform?: (value: number) => number;
}

/**
 * Complete data requirements for a calculator
 */
export interface CalculatorDataRequirements {
    observations: FieldDataRequirement[];
    conditions?: string[];
    medications?: string[];
}

/**
 * Unified FHIR Data Service
 */
export declare class FHIRDataService {
    initialize(client: FHIRClient | null, patient: Patient | null, container: HTMLElement): void;
    isReady(): boolean;
    getPatient(): Patient | null;
    getPatientId(): string | null;
    getStalenessTracker(): DataStalenessTracker | null;
    getObservation(code: string, options?: GetObservationOptions): Promise<ObservationResult>;
    getObservations(codes: string[], options?: GetObservationOptions): Promise<Map<string, ObservationResult>>;
    autoPopulateInput(inputId: string, code: string, options?: AutoPopulateOptions): Promise<ObservationResult>;
    autoPopulateFields(fields: FieldDataRequirement[]): Promise<Map<string, ObservationResult>>;
    autoPopulateFromRequirements(requirements: CalculatorDataRequirements): Promise<void>;
    getConditions(snomedCodes: string[]): Promise<any[]>;
    hasCondition(snomedCodes: string[]): Promise<boolean>;
    getMedications(rxnormCodes: string[]): Promise<any[]>;
    isOnMedication(rxnormCodes: string[]): Promise<boolean>;
    clearCache(): void;
    prefetch(codes: string[]): Promise<void>;
    getPatientAge(): number | null;
    getPatientGender(): 'male' | 'female' | null;
}

/**
 * Default singleton instance
 */
export declare const fhirDataService: FHIRDataService;

/**
 * Factory function to create new instances
 */
export declare function createFHIRDataService(): FHIRDataService;
