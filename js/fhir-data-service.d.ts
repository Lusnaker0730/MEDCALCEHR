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
    /** Skip cache and fetch fresh data */
    skipCache?: boolean;
    /** Track staleness for this observation */
    trackStaleness?: boolean;
    /** Custom label for staleness tracking */
    stalenessLabel?: string;
    /** Target unit for automatic conversion */
    targetUnit?: string;
    /** Unit type for conversion (e.g., 'creatinine', 'weight', 'height') */
    unitType?: string;
}
/**
 * Result of an observation fetch
 */
export interface ObservationResult {
    /** Raw FHIR Observation resource */
    observation: any | null;
    /** Extracted numeric value */
    value: number | null;
    /** Unit of the value */
    unit: string | null;
    /** Original value before conversion */
    originalValue: number | null;
    /** Original unit before conversion */
    originalUnit: string | null;
    /** Date of the observation */
    date: Date | null;
    /** Whether the observation is stale */
    isStale: boolean;
    /** Age in days if stale */
    ageInDays: number | null;
    /** LOINC code */
    code: string;
}
/**
 * Options for auto-populating an input field
 */
export interface AutoPopulateOptions {
    /** Transform the value before setting */
    transform?: (value: number) => number;
    /** Number of decimal places */
    decimals?: number;
    /** Target unit for the input */
    targetUnit?: string;
    /** Custom label for staleness warning */
    label?: string;
    /** Skip staleness tracking */
    skipStaleness?: boolean;
}
/**
 * Data requirement for a calculator field
 */
export interface FieldDataRequirement {
    /** LOINC code(s) - can be comma-separated for alternatives */
    code: string;
    /** ID of the input element (CSS selector) */
    inputId: string;
    /** Display label */
    label: string;
    /** Target unit for conversion */
    targetUnit?: string;
    /** Number of decimal places */
    decimals?: number;
    /** Value transform function */
    transform?: (value: number) => number;
}
/**
 * Complete data requirements for a calculator
 */
export interface CalculatorDataRequirements {
    /** Observation requirements */
    observations: FieldDataRequirement[];
    /** Condition codes to check */
    conditions?: string[];
    /** Medication codes to check */
    medications?: string[];
}
/**
 * Unified FHIR Data Service
 * Provides a centralized API for all FHIR data operations
 */
export declare class FHIRDataService {
    private client;
    private patient;
    private container;
    private stalenessTracker;
    private patientId;
    private isInitialized;
    /**
     * Initialize the service with FHIR client and patient
     */
    initialize(client: any, patient: any, container: HTMLElement): void;
    /**
     * Check if service is properly initialized
     */
    isReady(): boolean;
    /**
     * Get patient information
     */
    getPatient(): Patient | null;
    /**
     * Get patient ID
     */
    getPatientId(): string | null;
    /**
     * Get staleness tracker instance
     */
    getStalenessTracker(): DataStalenessTracker | null;
    /**
     * Get the most recent observation for a LOINC code
     * Includes caching, staleness tracking, and unit conversion
     */
    getObservation(code: string, options?: GetObservationOptions): Promise<ObservationResult>;
    /**
     * Process an observation and extract values
     */
    private processObservation;
    /**
     * Get multiple observations at once
     */
    getObservations(codes: string[], options?: GetObservationOptions): Promise<Map<string, ObservationResult>>;
    /**
     * Result of blood pressure fetch
     */
    /**
     * Get blood pressure (systolic and diastolic)
     * Blood pressure is stored as a panel with components
     */
    getBloodPressure(options?: {
        trackStaleness?: boolean;
        skipCache?: boolean;
    }): Promise<{
        systolic: number | null;
        diastolic: number | null;
        observation: any | null;
        date: Date | null;
        isStale: boolean;
    }>;
    /**
     * Auto-populate a single input field from FHIR data
     */
    autoPopulateInput(inputId: string, code: string, options?: AutoPopulateOptions): Promise<ObservationResult>;
    /**
     * Auto-populate multiple inputs based on field requirements
     */
    autoPopulateFields(fields: FieldDataRequirement[]): Promise<Map<string, ObservationResult>>;
    /**
     * Auto-populate based on calculator data requirements
     */
    autoPopulateFromRequirements(requirements: CalculatorDataRequirements): Promise<void>;
    /**
     * Get patient conditions by SNOMED codes
     */
    getConditions(snomedCodes: string[]): Promise<any[]>;
    /**
     * Check if patient has any of the specified conditions
     */
    hasCondition(snomedCodes: string[]): Promise<boolean>;
    /**
     * Get patient medications by RxNorm codes
     */
    getMedications(rxnormCodes: string[]): Promise<any[]>;
    /**
     * Check if patient is on any of the specified medications
     */
    isOnMedication(rxnormCodes: string[]): Promise<boolean>;
    /**
     * Clear all cached data for the current patient
     */
    clearCache(): void;
    /**
     * Prefetch common observations for faster access
     */
    prefetch(codes: string[]): Promise<void>;
    /**
     * Calculate age from patient birthDate
     */
    getPatientAge(): number | null;
    /**
     * Get patient gender
     */
    getPatientGender(): 'male' | 'female' | null;
    /**
     * Determine measurement type from LOINC code for unit conversion
     * Maps LOINC codes to UnitConverter measurement types
     */
    private getMeasurementTypeFromCode;
}
/**
 * Default singleton instance
 */
export declare const fhirDataService: FHIRDataService;
/**
 * Create a new FHIRDataService instance
 * Use this when you need isolated service instances
 */
export declare function createFHIRDataService(): FHIRDataService;
declare const _default: {
    FHIRDataService: typeof FHIRDataService;
    fhirDataService: FHIRDataService;
    createFHIRDataService: typeof createFHIRDataService;
};
export default _default;
//# sourceMappingURL=fhir-data-service.d.ts.map