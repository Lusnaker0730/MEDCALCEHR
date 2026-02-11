/**
 * TW Core Observation Tests
 * Tests for processObservation TW Core profile detection
 */

import { describe, expect, test, beforeEach } from '@jest/globals';
import { FHIRDataService } from '../fhir-data-service.js';
import { TW_OBSERVATION_PROFILES } from '../twcore/observation-profiles.js';
import { checkObservationConformance } from '../twcore/validation.js';

// Mock dependencies
jest.mock('../logger.js', () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));
jest.mock('../sentry.js', () => ({ initSentry: jest.fn() }));
jest.mock('../cache-manager.js', () => ({
    fhirCache: { getCachedObservation: jest.fn(), cacheObservation: jest.fn(), clearPatientCache: jest.fn() },
}));
jest.mock('../data-staleness.js', () => ({
    createStalenessTracker: () => ({
        setContainer: jest.fn(),
        checkStaleness: jest.fn(() => null),
        trackObservation: jest.fn(),
    }),
    DataStalenessTracker: jest.fn(),
}));
jest.mock('../audit-event-service.js', () => ({
    auditEventService: { logResourceRead: jest.fn(() => Promise.resolve()) },
}));
jest.mock('../provenance-service.js', () => ({
    provenanceService: {
        recordCalculation: jest.fn(() => Promise.resolve({})),
        recordDerivation: jest.fn(() => Promise.resolve({})),
        getProvenanceForTarget: jest.fn(() => []),
        generateLineageReport: jest.fn(() => ({})),
    },
    CalculationResult: {},
}));
jest.mock('../fhir-feedback.js', () => ({
    fhirFeedback: {
        createLoadingBanner: jest.fn(),
        removeLoadingBanner: jest.fn(),
        createDataSummary: jest.fn(),
        setupDynamicTracking: jest.fn(),
    },
}));
jest.mock('../utils.js', () => ({
    getMostRecentObservation: jest.fn(),
    getObservationValue: jest.fn(() => null),
    getPatientConditions: jest.fn(() => []),
    getMedicationRequests: jest.fn(() => []),
    calculateAge: jest.fn(() => 30),
    isRestrictedResource: jest.fn(() => false),
}));
jest.mock('../fhir-codes.js', () => ({
    LOINC_CODES: { BP_PANEL: '85354-9,55284-4', SYSTOLIC_BP: '8480-6', DIASTOLIC_BP: '8462-4' },
    SNOMED_CODES: {},
    getLoincName: jest.fn(),
    getMeasurementType: jest.fn(() => 'concentration'),
    isValidLoincCode: jest.fn(() => true),
}));
jest.mock('../lab-name-mapping.js', () => ({
    getTextNameByLoinc: jest.fn(() => null),
}));
jest.mock('../unit-converter.js', () => ({
    UnitConverter: { convert: jest.fn(() => null), setInputValue: jest.fn() },
}));
jest.mock('../ehr-adapters/index.js', () => ({
    getActiveAdapter: jest.fn(() => null),
}));

// Load fixtures
import bmiExample from './fixtures/twcore/observation-bmi-example.json';
import bpExample from './fixtures/twcore/observation-bp-example.json';
import labExample from './fixtures/twcore/observation-lab-example.json';

describe('TW Core Observation', () => {
    let service: FHIRDataService;

    beforeEach(() => {
        service = new FHIRDataService();
        const mockClient = { patient: { id: 'p1', read: jest.fn(), request: jest.fn() }, request: jest.fn() };
        const container = document.createElement('div');
        service.initialize(mockClient, { id: 'p1' }, container);
    });

    describe('processObservation TW Core profile detection', () => {
        // Access private method via type assertion for testing
        function callProcessObservation(obs: any, code: string) {
            return (service as any).processObservation(obs, code, {});
        }

        test('should detect server-side TW Core BMI profile', () => {
            const result = callProcessObservation(bmiExample, '39156-5');
            expect(result.twcoreProfile).toBe(TW_OBSERVATION_PROFILES.bmi);
        });

        test('should detect server-side TW Core BP profile', () => {
            const result = callProcessObservation(bpExample, '85354-9');
            expect(result.twcoreProfile).toBe(TW_OBSERVATION_PROFILES.bloodPressure);
        });

        test('should detect server-side TW Core lab profile', () => {
            const result = callProcessObservation(labExample, '2160-0');
            expect(result.twcoreProfile).toBe(TW_OBSERVATION_PROFILES.laboratoryResult);
        });

        test('should use local lookup when no server-side profile', () => {
            const obs = {
                status: 'final',
                code: { coding: [{ system: 'http://loinc.org', code: '8867-4' }] },
                valueQuantity: { value: 72, unit: 'bpm' },
            };
            const result = callProcessObservation(obs, '8867-4');
            expect(result.twcoreProfile).toBe(TW_OBSERVATION_PROFILES.heartRate);
        });

        test('server-side profile takes priority over local lookup', () => {
            const customProfile = 'https://twcore.mohw.gov.tw/ig/twcore/StructureDefinition/Observation-vitalSigns-twcore';
            const obs = {
                meta: { profile: [customProfile] },
                status: 'final',
                code: { coding: [{ system: 'http://loinc.org', code: '8867-4' }] },
                valueQuantity: { value: 72, unit: 'bpm' },
            };
            const result = callProcessObservation(obs, '8867-4');
            // Server profile should be used (vitalSigns instead of heartRate)
            expect(result.twcoreProfile).toBe(customProfile);
        });

        test('should not set twcoreProfile for unknown codes without server profile', () => {
            const obs = {
                status: 'final',
                code: { coding: [{ system: 'http://loinc.org', code: '99999-9' }] },
                valueQuantity: { value: 5, unit: 'mg' },
            };
            const result = callProcessObservation(obs, '99999-9');
            expect(result.twcoreProfile).toBeUndefined();
        });

        test('should return null observation result when observation is null', () => {
            const result = callProcessObservation(null, '8867-4');
            expect(result.observation).toBeNull();
            expect(result.twcoreProfile).toBeUndefined();
        });

        test('should detect average blood pressure profile for avg BP panel code', () => {
            const obs = {
                status: 'final',
                code: { coding: [{ system: 'http://loinc.org', code: '96607-7' }] },
                component: [
                    { code: { coding: [{ system: 'http://loinc.org', code: '96608-5' }] }, valueQuantity: { value: 120, unit: 'mmHg' } },
                    { code: { coding: [{ system: 'http://loinc.org', code: '96609-3' }] }, valueQuantity: { value: 80, unit: 'mmHg' } },
                ],
            };
            const result = callProcessObservation(obs, '96607-7');
            expect(result.twcoreProfile).toBe(TW_OBSERVATION_PROFILES.averageBloodPressure);
        });
    });

    describe('checkObservationConformance()', () => {
        test('should pass for conformant observation', () => {
            const result = checkObservationConformance(bmiExample);
            expect(result.isConformant).toBe(true);
        });

        test('should pass for lab observation with effectiveDateTime', () => {
            const result = checkObservationConformance(labExample);
            expect(result.isConformant).toBe(true);
        });

        test('should fail when status is missing', () => {
            const obs = {
                code: { coding: [{ system: 'http://loinc.org', code: '2160-0' }] },
                subject: { reference: 'Patient/p1' },
            };
            const result = checkObservationConformance(obs);
            expect(result.isConformant).toBe(false);
            expect(result.issues.some(i => i.path === 'Observation.status')).toBe(true);
        });

        test('should fail when code.coding is missing', () => {
            const obs = {
                status: 'final',
                code: {},
                subject: { reference: 'Patient/p1' },
            };
            const result = checkObservationConformance(obs);
            expect(result.isConformant).toBe(false);
            expect(result.issues.some(i => i.path === 'Observation.code.coding')).toBe(true);
        });

        test('should fail when subject is missing', () => {
            const obs = {
                status: 'final',
                code: { coding: [{ system: 'http://loinc.org', code: '2160-0' }] },
            };
            const result = checkObservationConformance(obs);
            expect(result.isConformant).toBe(false);
            expect(result.issues.some(i => i.path === 'Observation.subject')).toBe(true);
        });

        test('should warn for lab observation without effective[x]', () => {
            const obs = {
                status: 'final',
                category: [{ coding: [{ code: 'laboratory' }] }],
                code: { coding: [{ system: 'http://loinc.org', code: '2160-0' }] },
                subject: { reference: 'Patient/p1' },
            };
            const result = checkObservationConformance(obs);
            expect(result.isConformant).toBe(true); // warning, not error
            expect(result.issues.some(i => i.path === 'Observation.effective[x]')).toBe(true);
        });

        test('should fail for null observation', () => {
            const result = checkObservationConformance(null);
            expect(result.isConformant).toBe(false);
        });
    });
});
