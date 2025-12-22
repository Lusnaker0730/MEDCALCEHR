// src/fhir-data-service.ts
// Unified FHIR Data Management Layer
// Consolidates data fetching, caching, staleness tracking, and UI feedback
import { getMostRecentObservation, getObservationValue, getPatientConditions, getMedicationRequests } from './utils.js';
import { getLoincName } from './fhir-codes.js';
// @ts-ignore - no type declarations
import { fhirCache } from './cache-manager.js';
import { createStalenessTracker } from './data-staleness.js';
import { UnitConverter } from './unit-converter.js';
// @ts-ignore - no type declarations
import { fhirFeedback } from './fhir-feedback.js';
// ============================================================================
// FHIR Data Service Class
// ============================================================================
/**
 * Unified FHIR Data Service
 * Provides a centralized API for all FHIR data operations
 */
export class FHIRDataService {
    constructor() {
        this.client = null;
        this.patient = null;
        this.container = null;
        this.stalenessTracker = null;
        this.patientId = null;
        this.isInitialized = false;
    }
    /**
     * Initialize the service with FHIR client and patient
     */
    initialize(client, patient, container) {
        this.client = client;
        this.patient = patient;
        this.container = container;
        this.patientId = patient?.id || client?.patient?.id || null;
        // Create staleness tracker
        this.stalenessTracker = createStalenessTracker();
        this.stalenessTracker.setContainer(container);
        this.isInitialized = true;
    }
    /**
     * Check if service is properly initialized
     */
    isReady() {
        return this.isInitialized && this.client !== null;
    }
    /**
     * Get patient information
     */
    getPatient() {
        return this.patient;
    }
    /**
     * Get patient ID
     */
    getPatientId() {
        return this.patientId;
    }
    /**
     * Get staleness tracker instance
     */
    getStalenessTracker() {
        return this.stalenessTracker;
    }
    // ========================================================================
    // Observation Fetching
    // ========================================================================
    /**
     * Get the most recent observation for a LOINC code
     * Includes caching, staleness tracking, and unit conversion
     */
    async getObservation(code, options = {}) {
        const result = {
            observation: null,
            value: null,
            unit: null,
            originalValue: null,
            originalUnit: null,
            date: null,
            isStale: false,
            ageInDays: null,
            code
        };
        if (!this.client) {
            return result;
        }
        try {
            // Check cache first
            if (!options.skipCache && this.patientId) {
                const cached = fhirCache.getCachedObservation(this.patientId, code);
                if (cached) {
                    return this.processObservation(cached, code, options);
                }
            }
            // Fetch from FHIR server
            const observation = await getMostRecentObservation(this.client, code);
            // Cache the result
            if (observation && this.patientId) {
                fhirCache.cacheObservation(this.patientId, code, observation);
            }
            return this.processObservation(observation, code, options);
        }
        catch (error) {
            console.error(`Error fetching observation ${code}:`, error);
            return result;
        }
    }
    /**
     * Process an observation and extract values
     */
    processObservation(observation, code, options) {
        const result = {
            observation,
            value: null,
            unit: null,
            originalValue: null,
            originalUnit: null,
            date: null,
            isStale: false,
            ageInDays: null,
            code
        };
        if (!observation) {
            return result;
        }
        // Extract value using getObservationValue for proper component handling
        const value = getObservationValue(observation, code);
        if (value !== null) {
            result.value = value;
            result.originalValue = value;
        }
        else if (observation.valueQuantity) {
            result.value = observation.valueQuantity.value;
            result.originalValue = result.value;
        }
        // Extract unit
        if (observation.valueQuantity?.unit) {
            result.unit = observation.valueQuantity.unit;
            result.originalUnit = result.unit;
        }
        // Extract date
        const dateStr = observation.effectiveDateTime || observation.issued;
        if (dateStr) {
            result.date = new Date(dateStr);
        }
        // Check staleness
        if (options.trackStaleness && this.stalenessTracker) {
            const stalenessInfo = this.stalenessTracker.checkStaleness(observation);
            if (stalenessInfo) {
                result.isStale = stalenessInfo.isStale;
                result.ageInDays = stalenessInfo.ageInDays;
            }
        }
        // Unit conversion
        if (options.targetUnit && result.value !== null && result.unit) {
            // Use provided unitType or determine measurement type from LOINC code
            const measurementType = options.unitType || this.getMeasurementTypeFromCode(code);
            const converted = UnitConverter.convert(result.value, result.unit, options.targetUnit, measurementType);
            if (converted !== null) {
                result.value = converted;
                result.unit = options.targetUnit;
            }
        }
        return result;
    }
    /**
     * Get multiple observations at once
     */
    async getObservations(codes, options = {}) {
        const results = new Map();
        const promises = codes.map(async (code) => {
            const result = await this.getObservation(code, options);
            results.set(code, result);
        });
        await Promise.all(promises);
        return results;
    }
    // ========================================================================
    // Auto-Population
    // ========================================================================
    /**
     * Auto-populate a single input field from FHIR data
     */
    async autoPopulateInput(inputId, code, options = {}) {
        const obsOptions = {
            trackStaleness: !options.skipStaleness,
            stalenessLabel: options.label,
            targetUnit: options.targetUnit
        };
        const result = await this.getObservation(code, obsOptions);
        if (result.value !== null && this.container) {
            const input = this.container.querySelector(inputId);
            if (input) {
                let value = result.value;
                // Apply transform if provided
                if (options.transform) {
                    value = options.transform(value);
                }
                // Format with decimals
                const decimals = options.decimals ?? 1;
                input.value = value.toFixed(decimals);
                // Track staleness
                if (!options.skipStaleness && this.stalenessTracker && result.observation) {
                    this.stalenessTracker.trackObservation(inputId, result.observation, code, options.label || getLoincName(code) || code);
                }
                // Use UnitConverter.setInputValue for proper unit handling
                if (options.targetUnit && result.originalValue !== null && result.originalUnit) {
                    UnitConverter.setInputValue(input, result.originalValue, result.originalUnit);
                }
                // Dispatch input event to trigger recalculation
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
        return result;
    }
    /**
     * Auto-populate multiple inputs based on field requirements
     */
    async autoPopulateFields(fields) {
        const results = new Map();
        // Show loading banner if container exists
        if (this.container) {
            fhirFeedback.createLoadingBanner(this.container);
        }
        try {
            const promises = fields.map(async (field) => {
                const result = await this.autoPopulateInput(field.inputId, field.code, {
                    label: field.label,
                    targetUnit: field.targetUnit,
                    decimals: field.decimals,
                    transform: field.transform
                });
                results.set(field.code, result);
            });
            await Promise.all(promises);
            // Show summary
            if (this.container) {
                const loaded = fields.filter(f => results.get(f.code)?.value !== null).map(f => f.label);
                const missing = fields.filter(f => results.get(f.code)?.value === null).map(f => f.label);
                fhirFeedback.createDataSummary(this.container, {
                    loaded,
                    missing,
                    failed: []
                });
            }
        }
        finally {
            // Remove loading banner
            if (this.container) {
                fhirFeedback.removeLoadingBanner(this.container);
            }
        }
        return results;
    }
    /**
     * Auto-populate based on calculator data requirements
     */
    async autoPopulateFromRequirements(requirements) {
        if (requirements.observations && requirements.observations.length > 0) {
            await this.autoPopulateFields(requirements.observations);
        }
    }
    // ========================================================================
    // Condition and Medication Fetching
    // ========================================================================
    /**
     * Get patient conditions by SNOMED codes
     */
    async getConditions(snomedCodes) {
        if (!this.client) {
            return [];
        }
        try {
            return await getPatientConditions(this.client, snomedCodes);
        }
        catch (error) {
            console.error('Error fetching conditions:', error);
            return [];
        }
    }
    /**
     * Check if patient has any of the specified conditions
     */
    async hasCondition(snomedCodes) {
        const conditions = await this.getConditions(snomedCodes);
        return conditions.length > 0;
    }
    /**
     * Get patient medications by RxNorm codes
     */
    async getMedications(rxnormCodes) {
        if (!this.client) {
            return [];
        }
        try {
            return await getMedicationRequests(this.client, rxnormCodes);
        }
        catch (error) {
            console.error('Error fetching medications:', error);
            return [];
        }
    }
    /**
     * Check if patient is on any of the specified medications
     */
    async isOnMedication(rxnormCodes) {
        const medications = await this.getMedications(rxnormCodes);
        return medications.length > 0;
    }
    // ========================================================================
    // Cache Management
    // ========================================================================
    /**
     * Clear all cached data for the current patient
     */
    clearCache() {
        if (this.patientId) {
            fhirCache.clearPatientCache(this.patientId);
        }
    }
    /**
     * Prefetch common observations for faster access
     */
    async prefetch(codes) {
        const promises = codes.map(code => this.getObservation(code));
        await Promise.all(promises);
    }
    // ========================================================================
    // Utility Methods
    // ========================================================================
    /**
     * Calculate age from patient birthDate
     */
    getPatientAge() {
        if (!this.patient?.birthDate) {
            return null;
        }
        const today = new Date();
        const birthDate = new Date(this.patient.birthDate);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    }
    /**
     * Get patient gender
     */
    getPatientGender() {
        if (!this.patient?.gender) {
            return null;
        }
        return this.patient.gender.toLowerCase() === 'female' ? 'female' : 'male';
    }
    /**
     * Determine measurement type from LOINC code for unit conversion
     * Maps LOINC codes to UnitConverter measurement types
     */
    getMeasurementTypeFromCode(code) {
        // Handle comma-separated codes (take first)
        const primaryCode = code.split(',')[0].trim();
        // Map LOINC codes to measurement types
        const codeMap = {
            // Vital Signs
            '8310-5': 'temperature', // Body temperature
            '8331-1': 'temperature', // Oral temperature
            // Cholesterol/Lipids
            '2093-3': 'cholesterol', // Total cholesterol
            '2085-9': 'hdl', // HDL
            '2089-1': 'ldl', // LDL  
            '2571-8': 'triglycerides', // Triglycerides
            // Glucose
            '2345-7': 'glucose', // Glucose
            '2339-0': 'glucose', // Fasting glucose
            // Creatinine
            '2160-0': 'creatinine', // Creatinine
            '38483-4': 'creatinine', // Creatinine (blood)
            // Calcium
            '17861-6': 'calcium', // Calcium
            // Albumin
            '1751-7': 'albumin', // Albumin
            // Bilirubin
            '1975-2': 'bilirubin', // Bilirubin total
            '1968-7': 'bilirubin', // Bilirubin direct
            // Hemoglobin
            '718-7': 'hemoglobin', // Hemoglobin
            // BUN
            '6299-2': 'bun', // BUN
            // Electrolytes (Na, K)
            '2951-2': 'electrolyte', // Sodium
            '2823-3': 'electrolyte', // Potassium
            // Weight/Height
            '29463-7': 'weight', // Body weight
            '8302-2': 'height', // Body height
        };
        return codeMap[primaryCode] || 'concentration';
    }
}
// ============================================================================
// Singleton Instance
// ============================================================================
/**
 * Default singleton instance
 */
export const fhirDataService = new FHIRDataService();
// ============================================================================
// Factory Function
// ============================================================================
/**
 * Create a new FHIRDataService instance
 * Use this when you need isolated service instances
 */
export function createFHIRDataService() {
    return new FHIRDataService();
}
// ============================================================================
// Exports
// ============================================================================
export default {
    FHIRDataService,
    fhirDataService,
    createFHIRDataService
};
