/**
 * TW Core Observation Tests
 * Tests for processObservation TW Core profile detection
 */

import { describe, expect, test, beforeEach, jest } from '@jest/globals';

// Pre-declared mock functions
const mockLoggerInfo = jest.fn<any>();
const mockLoggerWarn = jest.fn<any>();
const mockLoggerError = jest.fn<any>();
const mockLoggerDebug = jest.fn<any>();
const mockInitSentry = jest.fn<any>();
const mockGetCachedObservation = jest.fn<any>();
const mockCacheObservation = jest.fn<any>();
const mockClearPatientCache = jest.fn<any>();
const mockSetContainer = jest.fn<any>();
const mockCheckStaleness = jest.fn<any>().mockReturnValue(null);
const mockTrackObservation = jest.fn<any>();
const mockDataStalenessTracker = jest.fn<any>();
const mockLogResourceRead = jest.fn<any>().mockResolvedValue(undefined);
const mockRecordCalculation = jest.fn<any>().mockResolvedValue({});
const mockRecordDerivation = jest.fn<any>().mockResolvedValue({});
const mockGetProvenanceForTarget = jest.fn<any>().mockReturnValue([]);
const mockGenerateLineageReport = jest.fn<any>().mockReturnValue({});
const mockCreateLoadingBanner = jest.fn<any>();
const mockRemoveLoadingBanner = jest.fn<any>();
const mockCreateDataSummary = jest.fn<any>();
const mockSetupDynamicTracking = jest.fn<any>();
const mockGetMostRecentObservation = jest.fn<any>();
const mockGetObservationValue = jest.fn<any>().mockReturnValue(null);
const mockGetPatientConditions = jest.fn<any>().mockResolvedValue([]);
const mockGetMedicationRequests = jest.fn<any>().mockResolvedValue([]);
const mockCalculateAge = jest.fn<any>().mockReturnValue(30);
const mockIsRestrictedResource = jest.fn<any>().mockReturnValue(false);
const mockGetLoincName = jest.fn<any>();
const mockGetMeasurementType = jest.fn<any>().mockReturnValue('concentration');
const mockIsValidLoincCode = jest.fn<any>().mockReturnValue(true);
const mockGetTextNameByLoinc = jest.fn<any>().mockReturnValue(null);
const mockUnitConvert = jest.fn<any>().mockReturnValue(null);
const mockSetInputValue = jest.fn<any>();
const mockGetActiveAdapter = jest.fn<any>().mockReturnValue(null);

// Mock dependencies
jest.mock('../logger.js', () => ({
    logger: { info: mockLoggerInfo, warn: mockLoggerWarn, error: mockLoggerError, debug: mockLoggerDebug },
}));
jest.mock('../sentry.js', () => ({ initSentry: mockInitSentry }));
jest.mock('../cache-manager.js', () => ({
    fhirCache: { getCachedObservation: mockGetCachedObservation, cacheObservation: mockCacheObservation, clearPatientCache: mockClearPatientCache },
}));
jest.mock('../data-staleness.js', () => ({
    createStalenessTracker: () => ({
        setContainer: mockSetContainer,
        checkStaleness: mockCheckStaleness,
        trackObservation: mockTrackObservation,
    }),
    DataStalenessTracker: mockDataStalenessTracker,
}));
jest.mock('../audit-event-service.js', () => ({
    auditEventService: { logResourceRead: mockLogResourceRead },
}));
jest.mock('../provenance-service.js', () => ({
    provenanceService: {
        recordCalculation: mockRecordCalculation,
        recordDerivation: mockRecordDerivation,
        getProvenanceForTarget: mockGetProvenanceForTarget,
        generateLineageReport: mockGenerateLineageReport,
    },
    CalculationResult: {},
}));
jest.mock('../fhir-feedback.js', () => ({
    fhirFeedback: {
        createLoadingBanner: mockCreateLoadingBanner,
        removeLoadingBanner: mockRemoveLoadingBanner,
        createDataSummary: mockCreateDataSummary,
        setupDynamicTracking: mockSetupDynamicTracking,
    },
}));
jest.mock('../utils.js', () => ({
    getMostRecentObservation: mockGetMostRecentObservation,
    getObservationValue: mockGetObservationValue,
    getPatientConditions: mockGetPatientConditions,
    getMedicationRequests: mockGetMedicationRequests,
    calculateAge: mockCalculateAge,
    isRestrictedResource: mockIsRestrictedResource,
}));
jest.mock('../fhir-codes.js', () => ({
    LOINC_CODES: { BP_PANEL: '85354-9,55284-4', SYSTOLIC_BP: '8480-6', DIASTOLIC_BP: '8462-4' },
    SNOMED_CODES: {},
    getLoincName: mockGetLoincName,
    getMeasurementType: mockGetMeasurementType,
    isValidLoincCode: mockIsValidLoincCode,
}));
jest.mock('../lab-name-mapping.js', () => ({
    getTextNameByLoinc: mockGetTextNameByLoinc,
}));
jest.mock('../unit-converter.js', () => ({
    UnitConverter: { convert: mockUnitConvert, setInputValue: mockSetInputValue },
}));
jest.mock('../ehr-adapters/index.js', () => ({
    getActiveAdapter: mockGetActiveAdapter,
}));

import { FHIRDataService } from '../fhir-data-service.js';
import { TW_OBSERVATION_PROFILES } from '../twcore/observation-profiles.js';
import { checkObservationConformance } from '../twcore/validation.js';

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
