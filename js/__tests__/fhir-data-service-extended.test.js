/**
 * Extended Tests for FHIRDataService (src/fhir-data-service.ts)
 *
 * Covers methods NOT tested in fhir-service.test.ts:
 *   - processObservation (value extraction, staleness, unit conversion)
 *   - getBloodPressure (BP panel parsing, component extraction)
 *   - autoPopulateInput (DOM updates, transforms, decimals, events)
 *   - autoPopulateFields (BP special case, loading/summary banners)
 *   - getObservations, getAllObservations, getObservationsInWindow
 *   - getAggregatedObservation (min/max within time window)
 *   - getRawObservation
 *   - getConditions, hasCondition, getMedications, isOnMedication
 *   - clearCache, prefetch
 *   - getPatientAge, getPatientGender
 *   - recordCalculationProvenance, getProvenance, generateLineageReport
 *   - initialize, isReady, getPatient, getPatientId, getStalenessTracker
 *   - autoPopulateFromRequirements
 *   - createFHIRDataService factory
 *
 * Mock strategy: jest.unstable_mockModule() for ESM dependencies,
 * re-registered after jest.resetModules() with dynamic import of module under test.
 */
import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
// ---------------------------------------------------------------------------
// Mock function declarations (stable references across resetModules)
// ---------------------------------------------------------------------------
const mockGetMostRecentObservation = jest.fn();
const mockGetObservationValue = jest.fn();
const mockGetPatientConditions = jest.fn();
const mockGetMedicationRequests = jest.fn();
const mockCalculateAge = jest.fn();
const mockIsRestrictedResource = jest.fn();
const mockGetLoincName = jest.fn();
const mockGetMeasurementType = jest.fn();
const mockIsValidLoincCode = jest.fn();
const mockGetTextNameByLoinc = jest.fn();
const mockGetCachedObservation = jest.fn();
const mockCacheObservation = jest.fn();
const mockClearPatientCache = jest.fn();
const mockCheckStaleness = jest.fn();
const mockTrackObservation = jest.fn();
const mockSetContainer = jest.fn();
const mockStalenessTracker = {
    checkStaleness: mockCheckStaleness,
    trackObservation: mockTrackObservation,
    setContainer: mockSetContainer,
};
const mockCreateStalenessTracker = jest.fn().mockReturnValue(mockStalenessTracker);
const mockUnitConvert = jest.fn();
const mockSetInputValue = jest.fn();
const mockCreateLoadingBanner = jest.fn();
const mockRemoveLoadingBanner = jest.fn();
const mockCreateDataSummary = jest.fn();
const mockSetupDynamicTracking = jest.fn();
const mockLogResourceRead = jest.fn().mockResolvedValue(undefined);
const mockRecordCalculation = jest.fn();
const mockRecordDerivation = jest.fn();
const mockGetProvenanceForTarget = jest.fn();
const mockGenerateLineageReport = jest.fn();
// LOINC code constants used by the service
const MOCK_LOINC_CODES = {
    SYSTOLIC_BP: '8480-6',
    DIASTOLIC_BP: '8462-4',
    BP_PANEL: '85354-9,55284-4',
    WEIGHT: '29463-7',
    HEIGHT: '8302-2',
    CREATININE: '2160-0',
};
// ---------------------------------------------------------------------------
// Register mocks function -- called at module scope and after resetModules
// ---------------------------------------------------------------------------
function registerMocks() {
    jest.unstable_mockModule('../utils.js', () => ({
        getMostRecentObservation: mockGetMostRecentObservation,
        getObservationValue: mockGetObservationValue,
        getPatientConditions: mockGetPatientConditions,
        getMedicationRequests: mockGetMedicationRequests,
        calculateAge: mockCalculateAge,
        isRestrictedResource: mockIsRestrictedResource,
    }));
    jest.unstable_mockModule('../fhir-codes.js', () => ({
        LOINC_CODES: MOCK_LOINC_CODES,
        SNOMED_CODES: {},
        getLoincName: mockGetLoincName,
        getMeasurementType: mockGetMeasurementType,
        isValidLoincCode: mockIsValidLoincCode,
    }));
    jest.unstable_mockModule('../lab-name-mapping.js', () => ({
        getTextNameByLoinc: mockGetTextNameByLoinc,
    }));
    jest.unstable_mockModule('../cache-manager.js', () => ({
        fhirCache: {
            getCachedObservation: mockGetCachedObservation,
            cacheObservation: mockCacheObservation,
            clearPatientCache: mockClearPatientCache,
        },
    }));
    jest.unstable_mockModule('../data-staleness.js', () => ({
        createStalenessTracker: mockCreateStalenessTracker,
        DataStalenessTracker: jest.fn(),
    }));
    jest.unstable_mockModule('../unit-converter.js', () => ({
        UnitConverter: {
            convert: mockUnitConvert,
            setInputValue: mockSetInputValue,
        },
    }));
    jest.unstable_mockModule('../fhir-feedback.js', () => ({
        fhirFeedback: {
            createLoadingBanner: mockCreateLoadingBanner,
            removeLoadingBanner: mockRemoveLoadingBanner,
            createDataSummary: mockCreateDataSummary,
            setupDynamicTracking: mockSetupDynamicTracking,
        },
    }));
    jest.unstable_mockModule('../audit-event-service.js', () => ({
        auditEventService: {
            logResourceRead: mockLogResourceRead,
        },
    }));
    jest.unstable_mockModule('../provenance-service.js', () => ({
        provenanceService: {
            recordCalculation: mockRecordCalculation,
            recordDerivation: mockRecordDerivation,
            getProvenanceForTarget: mockGetProvenanceForTarget,
            generateLineageReport: mockGenerateLineageReport,
        },
        CalculationResult: {},
    }));
}
// Initial registration at module scope
registerMocks();
// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------
function createMockClient(requestFn) {
    const req = requestFn || jest.fn();
    return {
        patient: {
            id: 'test-patient',
            read: jest.fn(),
            request: req,
        },
        request: req,
    };
}
function makeBPPanelObservation(systolic, diastolic, dateStr) {
    return {
        resourceType: 'Observation',
        id: 'bp-obs-1',
        code: {
            coding: [{ system: 'http://loinc.org', code: '85354-9' }],
        },
        effectiveDateTime: dateStr || '2025-01-15T10:00:00Z',
        component: [
            {
                code: { coding: [{ system: 'http://loinc.org', code: '8480-6' }] },
                valueQuantity: { value: systolic, unit: 'mmHg' },
            },
            {
                code: { coding: [{ system: 'http://loinc.org', code: '8462-4' }] },
                valueQuantity: { value: diastolic, unit: 'mmHg' },
            },
        ],
    };
}
function makeObservation(value, unit, code, dateStr) {
    return {
        resourceType: 'Observation',
        id: `obs-${code}`,
        code: { coding: [{ system: 'http://loinc.org', code }] },
        valueQuantity: { value, unit },
        effectiveDateTime: dateStr || '2025-01-15T10:00:00Z',
    };
}
// ---------------------------------------------------------------------------
// Reset mocks helper
// ---------------------------------------------------------------------------
function resetAllMocks() {
    mockGetMostRecentObservation.mockReset();
    mockGetObservationValue.mockReset();
    mockGetPatientConditions.mockReset();
    mockGetMedicationRequests.mockReset();
    mockCalculateAge.mockReset();
    mockIsRestrictedResource.mockReset();
    mockGetLoincName.mockReset();
    mockGetMeasurementType.mockReset();
    mockIsValidLoincCode.mockReset();
    mockGetTextNameByLoinc.mockReset();
    mockGetCachedObservation.mockReset();
    mockCacheObservation.mockReset();
    mockClearPatientCache.mockReset();
    mockCheckStaleness.mockReset();
    mockTrackObservation.mockReset();
    mockSetContainer.mockReset();
    mockCreateStalenessTracker.mockReset();
    mockUnitConvert.mockReset();
    mockSetInputValue.mockReset();
    mockCreateLoadingBanner.mockReset();
    mockRemoveLoadingBanner.mockReset();
    mockCreateDataSummary.mockReset();
    mockSetupDynamicTracking.mockReset();
    mockLogResourceRead.mockReset();
    mockRecordCalculation.mockReset();
    mockRecordDerivation.mockReset();
    mockGetProvenanceForTarget.mockReset();
    mockGenerateLineageReport.mockReset();
}
function setDefaultMockBehaviors() {
    mockCreateStalenessTracker.mockReturnValue(mockStalenessTracker);
    mockGetCachedObservation.mockResolvedValue(null);
    mockCacheObservation.mockResolvedValue(undefined);
    mockIsValidLoincCode.mockReturnValue(true);
    mockIsRestrictedResource.mockReturnValue(false);
    mockGetObservationValue.mockReturnValue(null);
    mockGetMostRecentObservation.mockResolvedValue(null);
    mockGetLoincName.mockReturnValue(null);
    mockGetMeasurementType.mockReturnValue('unknown');
    mockGetTextNameByLoinc.mockReturnValue(null);
    mockCheckStaleness.mockReturnValue(null);
    mockUnitConvert.mockReturnValue(null);
    mockCalculateAge.mockReturnValue(35);
    mockGetPatientConditions.mockResolvedValue([]);
    mockGetMedicationRequests.mockResolvedValue([]);
    mockLogResourceRead.mockResolvedValue(undefined);
    mockRecordCalculation.mockResolvedValue({});
    mockRecordDerivation.mockResolvedValue({});
    mockGetProvenanceForTarget.mockReturnValue([]);
    mockGenerateLineageReport.mockReturnValue({
        target: '',
        records: [],
        sources: [],
        agents: [],
        activities: [],
    });
}
// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------
describe('FHIRDataService -- extended coverage', () => {
    let FHIRDataService;
    let createFHIRDataService;
    beforeEach(async () => {
        // 1. Reset module registry so dynamic import returns a fresh module
        jest.resetModules();
        // 2. Re-register all mocks (required after resetModules for ESM)
        registerMocks();
        // 3. Reset and configure mocks
        resetAllMocks();
        setDefaultMockBehaviors();
        // Suppress console noise during tests
        jest.spyOn(console, 'error').mockImplementation(() => { });
        jest.spyOn(console, 'warn').mockImplementation(() => { });
        jest.spyOn(console, 'log').mockImplementation(() => { });
        // 4. Dynamic import (fresh module with mocks applied)
        const mod = await import('../fhir-data-service.js');
        FHIRDataService = mod.FHIRDataService;
        createFHIRDataService = mod.createFHIRDataService;
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    // ========================================================================
    // Initialization & basic accessors
    // ========================================================================
    describe('initialize / isReady / accessors', () => {
        test('isReady returns false before initialization', () => {
            const svc = new FHIRDataService();
            expect(svc.isReady()).toBe(false);
        });
        test('isReady returns true after initialization with client', () => {
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            expect(svc.isReady()).toBe(true);
        });
        test('getPatient returns patient object', () => {
            const svc = new FHIRDataService();
            const patient = { id: 'p1', gender: 'male', birthDate: '1990-01-01' };
            svc.initialize(createMockClient(), patient, document.createElement('div'));
            expect(svc.getPatient()).toEqual(patient);
        });
        test('getPatientId returns patient id', () => {
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p123' }, document.createElement('div'));
            expect(svc.getPatientId()).toBe('p123');
        });
        test('getPatientId falls back to client.patient.id when patient has no id', () => {
            const svc = new FHIRDataService();
            const client = createMockClient();
            svc.initialize(client, null, document.createElement('div'));
            expect(svc.getPatientId()).toBe('test-patient');
        });
        test('getStalenessTracker returns tracker after initialization', () => {
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            expect(svc.getStalenessTracker()).toBe(mockStalenessTracker);
        });
        test('createFHIRDataService returns new instance', () => {
            const svc = createFHIRDataService();
            expect(svc).toBeInstanceOf(FHIRDataService);
            expect(svc.isReady()).toBe(false);
        });
    });
    // ========================================================================
    // processObservation (tested indirectly through getObservation)
    // ========================================================================
    describe('processObservation (via getObservation)', () => {
        test('extracts value via getObservationValue when available', async () => {
            const obs = makeObservation(7.2, 'mg/dL', '2160-0');
            mockGetMostRecentObservation.mockResolvedValue(obs);
            mockGetObservationValue.mockReturnValue(7.2);
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            const result = await svc.getObservation('2160-0');
            expect(result.value).toBe(7.2);
            expect(result.originalValue).toBe(7.2);
            expect(result.code).toBe('2160-0');
        });
        test('falls back to valueQuantity when getObservationValue returns null', async () => {
            const obs = makeObservation(120, 'mg/dL', '2345-7');
            mockGetMostRecentObservation.mockResolvedValue(obs);
            mockGetObservationValue.mockReturnValue(null);
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            const result = await svc.getObservation('2345-7');
            expect(result.value).toBe(120);
            expect(result.originalValue).toBe(120);
        });
        test('extracts unit from observation.valueQuantity.unit', async () => {
            const obs = makeObservation(70, 'kg', '29463-7');
            mockGetMostRecentObservation.mockResolvedValue(obs);
            mockGetObservationValue.mockReturnValue(70);
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            const result = await svc.getObservation('29463-7');
            expect(result.unit).toBe('kg');
            expect(result.originalUnit).toBe('kg');
        });
        test('extracts effectiveDateTime as date', async () => {
            const obs = makeObservation(70, 'kg', '29463-7', '2025-03-10T08:30:00Z');
            mockGetMostRecentObservation.mockResolvedValue(obs);
            mockGetObservationValue.mockReturnValue(70);
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            const result = await svc.getObservation('29463-7');
            expect(result.date).toBeInstanceOf(Date);
            expect(result.date.toISOString()).toBe('2025-03-10T08:30:00.000Z');
        });
        test('extracts issued date as fallback when effectiveDateTime missing', async () => {
            const obs = {
                resourceType: 'Observation',
                id: 'obs-1',
                issued: '2025-02-20T12:00:00Z',
                valueQuantity: { value: 5.0, unit: 'mg/dL' },
            };
            mockGetMostRecentObservation.mockResolvedValue(obs);
            mockGetObservationValue.mockReturnValue(null);
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            const result = await svc.getObservation('2160-0');
            expect(result.date).toBeInstanceOf(Date);
            expect(result.date.toISOString()).toBe('2025-02-20T12:00:00.000Z');
        });
        test('tracks staleness when option enabled', async () => {
            const obs = makeObservation(3.5, 'g/dL', '1751-7');
            mockGetMostRecentObservation.mockResolvedValue(obs);
            mockGetObservationValue.mockReturnValue(3.5);
            mockCheckStaleness.mockReturnValue({ isStale: true, ageInDays: 120 });
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            const result = await svc.getObservation('1751-7', { trackStaleness: true });
            expect(result.isStale).toBe(true);
            expect(result.ageInDays).toBe(120);
            expect(mockCheckStaleness).toHaveBeenCalledWith(obs);
        });
        test('does not track staleness when option disabled', async () => {
            const obs = makeObservation(3.5, 'g/dL', '1751-7');
            mockGetMostRecentObservation.mockResolvedValue(obs);
            mockGetObservationValue.mockReturnValue(3.5);
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            const result = await svc.getObservation('1751-7', { trackStaleness: false });
            expect(result.isStale).toBe(false);
            expect(mockCheckStaleness).not.toHaveBeenCalled();
        });
        test('performs unit conversion when targetUnit specified', async () => {
            const obs = makeObservation(154, 'lbs', '29463-7');
            mockGetMostRecentObservation.mockResolvedValue(obs);
            mockGetObservationValue.mockReturnValue(154);
            mockGetMeasurementType.mockReturnValue('weight');
            mockUnitConvert.mockReturnValue(69.85);
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            const result = await svc.getObservation('29463-7', { targetUnit: 'kg' });
            expect(mockUnitConvert).toHaveBeenCalledWith(154, 'lbs', 'kg', 'weight');
            expect(result.value).toBe(69.85);
            expect(result.unit).toBe('kg');
            expect(result.originalValue).toBe(154);
            expect(result.originalUnit).toBe('lbs');
        });
        test('uses provided unitType over getMeasurementType', async () => {
            const obs = makeObservation(1.2, 'mg/dL', '2160-0');
            mockGetMostRecentObservation.mockResolvedValue(obs);
            mockGetObservationValue.mockReturnValue(1.2);
            mockUnitConvert.mockReturnValue(106.1);
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            const result = await svc.getObservation('2160-0', {
                targetUnit: 'umol/L',
                unitType: 'creatinine',
            });
            expect(mockUnitConvert).toHaveBeenCalledWith(1.2, 'mg/dL', 'umol/L', 'creatinine');
            expect(result.value).toBe(106.1);
        });
        test('does not convert when UnitConverter returns null', async () => {
            const obs = makeObservation(7.2, 'mg/dL', '2160-0');
            mockGetMostRecentObservation.mockResolvedValue(obs);
            mockGetObservationValue.mockReturnValue(7.2);
            mockUnitConvert.mockReturnValue(null);
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            const result = await svc.getObservation('2160-0', { targetUnit: 'umol/L' });
            expect(result.value).toBe(7.2);
            expect(result.unit).toBe('mg/dL');
        });
        test('returns null result when observation is null', async () => {
            mockGetMostRecentObservation.mockResolvedValue(null);
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            const result = await svc.getObservation('29463-7');
            expect(result.value).toBeNull();
            expect(result.observation).toBeNull();
            expect(result.date).toBeNull();
        });
    });
    // ========================================================================
    // getObservation -- caching and text query
    // ========================================================================
    describe('getObservation -- caching', () => {
        test('returns cached observation when available', async () => {
            const obs = makeObservation(70, 'kg', '29463-7');
            mockGetCachedObservation.mockResolvedValue(obs);
            mockGetObservationValue.mockReturnValue(70);
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            const result = await svc.getObservation('29463-7');
            expect(result.value).toBe(70);
            expect(mockGetMostRecentObservation).not.toHaveBeenCalled();
        });
        test('skips cache when skipCache is true', async () => {
            const obs = makeObservation(70, 'kg', '29463-7');
            mockGetMostRecentObservation.mockResolvedValue(obs);
            mockGetObservationValue.mockReturnValue(70);
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            await svc.getObservation('29463-7', { skipCache: true });
            expect(mockGetCachedObservation).not.toHaveBeenCalled();
            expect(mockGetMostRecentObservation).toHaveBeenCalled();
        });
        test('caches observation after successful fetch', async () => {
            const obs = makeObservation(70, 'kg', '29463-7');
            mockGetMostRecentObservation.mockResolvedValue(obs);
            mockGetObservationValue.mockReturnValue(70);
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            await svc.getObservation('29463-7');
            expect(mockCacheObservation).toHaveBeenCalledWith('p1', '29463-7', obs);
        });
        test('logs audit event after successful fetch', async () => {
            const obs = makeObservation(70, 'kg', '29463-7');
            obs.id = 'obs-weight-1';
            mockGetMostRecentObservation.mockResolvedValue(obs);
            mockGetObservationValue.mockReturnValue(70);
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            await svc.getObservation('29463-7');
            expect(mockLogResourceRead).toHaveBeenCalledWith('Observation', 'obs-weight-1', 'code=29463-7');
        });
    });
    describe('getObservation -- text query', () => {
        test('uses text query when useTextQuery option is true', async () => {
            const mockReq = jest.fn().mockResolvedValue({
                entry: [{ resource: makeObservation(120, 'mg/dL', '2345-7') }],
            });
            const client = createMockClient(mockReq);
            mockGetObservationValue.mockReturnValue(null);
            mockGetTextNameByLoinc.mockReturnValue('Glucose');
            const svc = new FHIRDataService();
            svc.initialize(client, { id: 'p1' }, document.createElement('div'));
            const result = await svc.getObservation('2345-7', { useTextQuery: true });
            expect(mockReq).toHaveBeenCalledWith(expect.stringContaining('code:text=Glucose'));
            expect(result.value).toBe(120);
        });
        test('uses text query when code is not a valid LOINC code', async () => {
            mockIsValidLoincCode.mockReturnValue(false);
            const mockReq = jest.fn().mockResolvedValue({
                entry: [{ resource: makeObservation(100, 'mg/dL', 'custom-code') }],
            });
            const client = createMockClient(mockReq);
            mockGetObservationValue.mockReturnValue(null);
            mockGetTextNameByLoinc.mockReturnValue(null);
            const svc = new FHIRDataService();
            svc.initialize(client, { id: 'p1' }, document.createElement('div'));
            await svc.getObservation('custom-code');
            expect(mockReq).toHaveBeenCalledWith(expect.stringContaining('code:text=custom-code'));
        });
        test('blocks restricted resources in text query path', async () => {
            mockIsRestrictedResource.mockReturnValue(true);
            mockIsValidLoincCode.mockReturnValue(true);
            const obs = makeObservation(120, 'mg/dL', '2345-7');
            const mockReq = jest.fn().mockResolvedValue({
                entry: [{ resource: obs }],
            });
            const client = createMockClient(mockReq);
            const svc = new FHIRDataService();
            svc.initialize(client, { id: 'p1' }, document.createElement('div'));
            const result = await svc.getObservation('2345-7', { useTextQuery: true });
            expect(result.observation).toBeNull();
        });
        test('handles empty entry in text query response', async () => {
            mockIsValidLoincCode.mockReturnValue(true);
            const mockReq = jest.fn().mockResolvedValue({ entry: [] });
            const client = createMockClient(mockReq);
            const svc = new FHIRDataService();
            svc.initialize(client, { id: 'p1' }, document.createElement('div'));
            const result = await svc.getObservation('2345-7', { useTextQuery: true });
            expect(result.value).toBeNull();
        });
    });
    describe('getObservation -- error handling', () => {
        test('returns default result when client is null', async () => {
            const svc = new FHIRDataService();
            const result = await svc.getObservation('29463-7');
            expect(result.value).toBeNull();
            expect(result.code).toBe('29463-7');
        });
        test('catches and returns default result on fetch error', async () => {
            mockGetMostRecentObservation.mockRejectedValue(new Error('Network error'));
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            const result = await svc.getObservation('29463-7');
            expect(result.value).toBeNull();
        });
    });
    // ========================================================================
    // getBloodPressure
    // ========================================================================
    describe('getBloodPressure', () => {
        test('extracts systolic and diastolic from BP panel', async () => {
            const bpObs = makeBPPanelObservation(120, 80);
            mockGetMostRecentObservation.mockResolvedValue(bpObs);
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            const bp = await svc.getBloodPressure();
            expect(bp.systolic).toBe(120);
            expect(bp.diastolic).toBe(80);
            expect(bp.observation).toBe(bpObs);
        });
        test('extracts date from BP observation', async () => {
            const bpObs = makeBPPanelObservation(130, 85, '2025-04-01T14:30:00Z');
            mockGetMostRecentObservation.mockResolvedValue(bpObs);
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            const bp = await svc.getBloodPressure();
            expect(bp.date).toBeInstanceOf(Date);
            expect(bp.date.toISOString()).toBe('2025-04-01T14:30:00.000Z');
        });
        test('tracks staleness for BP components when enabled', async () => {
            const bpObs = makeBPPanelObservation(140, 90);
            mockGetMostRecentObservation.mockResolvedValue(bpObs);
            mockCheckStaleness.mockReturnValue({ isStale: true, ageInDays: 100 });
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            const bp = await svc.getBloodPressure({ trackStaleness: true });
            expect(bp.isStale).toBe(true);
            expect(mockTrackObservation).toHaveBeenCalledWith('#map-sbp', bpObs, '8480-6', 'Systolic BP');
            expect(mockTrackObservation).toHaveBeenCalledWith('#map-dbp', bpObs, '8462-4', 'Diastolic BP');
        });
        test('returns nulls when no BP panel found', async () => {
            mockGetMostRecentObservation.mockResolvedValue(null);
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            const bp = await svc.getBloodPressure();
            expect(bp.systolic).toBeNull();
            expect(bp.diastolic).toBeNull();
            expect(bp.observation).toBeNull();
        });
        test('returns nulls when BP panel has no components', async () => {
            mockGetMostRecentObservation.mockResolvedValue({
                resourceType: 'Observation',
                code: { coding: [{ code: '85354-9' }] },
            });
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            const bp = await svc.getBloodPressure();
            expect(bp.systolic).toBeNull();
            expect(bp.diastolic).toBeNull();
        });
        test('returns default result when client is null', async () => {
            const svc = new FHIRDataService();
            const bp = await svc.getBloodPressure();
            expect(bp.systolic).toBeNull();
            expect(bp.diastolic).toBeNull();
        });
        test('handles errors gracefully', async () => {
            mockGetMostRecentObservation.mockRejectedValue(new Error('FHIR error'));
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            const bp = await svc.getBloodPressure();
            expect(bp.systolic).toBeNull();
            expect(bp.diastolic).toBeNull();
        });
        test('extracts date from issued field as fallback', async () => {
            const bpObs = makeBPPanelObservation(120, 80);
            bpObs.effectiveDateTime = undefined;
            bpObs.issued = '2025-05-01T09:00:00Z';
            mockGetMostRecentObservation.mockResolvedValue(bpObs);
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            const bp = await svc.getBloodPressure();
            expect(bp.date.toISOString()).toBe('2025-05-01T09:00:00.000Z');
        });
    });
    // ========================================================================
    // autoPopulateInput -- SAFETY CRITICAL for FHIR auto-fill
    // ========================================================================
    describe('autoPopulateInput', () => {
        let svc;
        let container;
        beforeEach(() => {
            document.body.innerHTML =
                '<div id="calculator-container">' +
                    '<input id="age" />' +
                    '<input id="weight" />' +
                    '<input id="systolic" />' +
                    '<input id="diastolic" />' +
                    '<input id="creatinine" />' +
                    '</div>';
            container = document.getElementById('calculator-container');
            svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, container);
        });
        test('dispatches input event after setting value', async () => {
            const obs = makeObservation(70, 'kg', '29463-7');
            mockGetMostRecentObservation.mockResolvedValue(obs);
            mockGetObservationValue.mockReturnValue(70);
            const inputEl = container.querySelector('#weight');
            const eventSpy = jest.fn();
            inputEl.addEventListener('input', eventSpy);
            await svc.autoPopulateInput('#weight', '29463-7');
            expect(inputEl.value).toBe('70.0');
            expect(eventSpy).toHaveBeenCalledTimes(1);
        });
        test('returns early without modifying DOM when observation value is null', async () => {
            mockGetMostRecentObservation.mockResolvedValue(null);
            const inputEl = container.querySelector('#weight');
            inputEl.value = 'original';
            await svc.autoPopulateInput('#weight', '29463-7');
            expect(inputEl.value).toBe('original');
        });
        test('applies transform function before setting value', async () => {
            const obs = makeObservation(70, 'kg', '29463-7');
            mockGetMostRecentObservation.mockResolvedValue(obs);
            mockGetObservationValue.mockReturnValue(70);
            await svc.autoPopulateInput('#weight', '29463-7', {
                transform: (v) => v * 2.20462,
            });
            const inputEl = container.querySelector('#weight');
            expect(parseFloat(inputEl.value)).toBeCloseTo(154.3, 0);
        });
        test('formats to specified decimal places', async () => {
            const obs = makeObservation(1.234, 'mg/dL', '2160-0');
            mockGetMostRecentObservation.mockResolvedValue(obs);
            mockGetObservationValue.mockReturnValue(1.234);
            await svc.autoPopulateInput('#creatinine', '2160-0', { decimals: 2 });
            const inputEl = container.querySelector('#creatinine');
            expect(inputEl.value).toBe('1.23');
        });
        test('defaults to 1 decimal place when decimals not specified', async () => {
            const obs = makeObservation(70.456, 'kg', '29463-7');
            mockGetMostRecentObservation.mockResolvedValue(obs);
            mockGetObservationValue.mockReturnValue(70.456);
            await svc.autoPopulateInput('#weight', '29463-7');
            const inputEl = container.querySelector('#weight');
            expect(inputEl.value).toBe('70.5');
        });
        test('tracks staleness for populated field', async () => {
            const obs = makeObservation(70, 'kg', '29463-7');
            mockGetMostRecentObservation.mockResolvedValue(obs);
            mockGetObservationValue.mockReturnValue(70);
            mockGetLoincName.mockReturnValue('weight');
            await svc.autoPopulateInput('#weight', '29463-7');
            expect(mockTrackObservation).toHaveBeenCalledWith('#weight', obs, '29463-7', 'weight');
        });
        test('uses custom label for staleness tracking', async () => {
            const obs = makeObservation(70, 'kg', '29463-7');
            mockGetMostRecentObservation.mockResolvedValue(obs);
            mockGetObservationValue.mockReturnValue(70);
            await svc.autoPopulateInput('#weight', '29463-7', { label: 'Body Weight' });
            expect(mockTrackObservation).toHaveBeenCalledWith('#weight', obs, '29463-7', 'Body Weight');
        });
        test('skips staleness tracking when skipStaleness is true', async () => {
            const obs = makeObservation(70, 'kg', '29463-7');
            mockGetMostRecentObservation.mockResolvedValue(obs);
            mockGetObservationValue.mockReturnValue(70);
            await svc.autoPopulateInput('#weight', '29463-7', { skipStaleness: true });
            expect(mockTrackObservation).not.toHaveBeenCalled();
        });
        test('calls UnitConverter.setInputValue when targetUnit and originalValue present', async () => {
            const obs = makeObservation(154, 'lbs', '29463-7');
            mockGetMostRecentObservation.mockResolvedValue(obs);
            mockGetObservationValue.mockReturnValue(154);
            mockUnitConvert.mockReturnValue(69.85);
            await svc.autoPopulateInput('#weight', '29463-7', { targetUnit: 'kg' });
            expect(mockSetInputValue).toHaveBeenCalled();
        });
        test('returns the observation result', async () => {
            const obs = makeObservation(70, 'kg', '29463-7');
            mockGetMostRecentObservation.mockResolvedValue(obs);
            mockGetObservationValue.mockReturnValue(70);
            const result = await svc.autoPopulateInput('#weight', '29463-7');
            expect(result.value).toBe(70);
            expect(result.code).toBe('29463-7');
        });
        test('handles missing DOM element gracefully', async () => {
            const obs = makeObservation(70, 'kg', '29463-7');
            mockGetMostRecentObservation.mockResolvedValue(obs);
            mockGetObservationValue.mockReturnValue(70);
            const result = await svc.autoPopulateInput('#nonexistent', '29463-7');
            expect(result.value).toBe(70);
        });
    });
    // ========================================================================
    // autoPopulateFields -- BP special case, loading/summary banners
    // ========================================================================
    describe('autoPopulateFields', () => {
        let svc;
        let container;
        beforeEach(() => {
            document.body.innerHTML =
                '<div id="calculator-container">' +
                    '<input id="age" />' +
                    '<input id="weight" />' +
                    '<input id="systolic" />' +
                    '<input id="diastolic" />' +
                    '</div>';
            container = document.getElementById('calculator-container');
            svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, container);
        });
        test('handles BP special case: populates systolic and diastolic from panel', async () => {
            const bpObs = makeBPPanelObservation(130, 85);
            mockGetMostRecentObservation.mockResolvedValue(bpObs);
            const fields = [
                { code: '8480-6', inputId: '#systolic', label: 'Systolic BP', decimals: 0 },
                { code: '8462-4', inputId: '#diastolic', label: 'Diastolic BP', decimals: 0 },
            ];
            const results = await svc.autoPopulateFields(fields);
            const systolicInput = container.querySelector('#systolic');
            const diastolicInput = container.querySelector('#diastolic');
            expect(systolicInput.value).toBe('130');
            expect(diastolicInput.value).toBe('85');
            expect(results.get('8480-6')?.value).toBe(130);
            expect(results.get('8462-4')?.value).toBe(85);
        });
        test('BP fields dispatch input events for recalculation', async () => {
            const bpObs = makeBPPanelObservation(120, 80);
            mockGetMostRecentObservation.mockResolvedValue(bpObs);
            const systolicInput = container.querySelector('#systolic');
            const diastolicInput = container.querySelector('#diastolic');
            const systolicSpy = jest.fn();
            const diastolicSpy = jest.fn();
            systolicInput.addEventListener('input', systolicSpy);
            diastolicInput.addEventListener('input', diastolicSpy);
            await svc.autoPopulateFields([
                { code: '8480-6', inputId: '#systolic', label: 'Systolic BP' },
                { code: '8462-4', inputId: '#diastolic', label: 'Diastolic BP' },
            ]);
            expect(systolicSpy).toHaveBeenCalledTimes(1);
            expect(diastolicSpy).toHaveBeenCalledTimes(1);
        });
        test('creates loading banner at start and removes on completion', async () => {
            mockGetMostRecentObservation.mockResolvedValue(null);
            await svc.autoPopulateFields([
                { code: '29463-7', inputId: '#weight', label: 'Weight' },
            ]);
            expect(mockCreateLoadingBanner).toHaveBeenCalledWith(container);
            expect(mockRemoveLoadingBanner).toHaveBeenCalledWith(container);
        });
        test('removes loading banner even when errors occur', async () => {
            mockGetMostRecentObservation.mockRejectedValue(new Error('Network error'));
            await svc.autoPopulateFields([
                { code: '29463-7', inputId: '#weight', label: 'Weight' },
            ]);
            expect(mockRemoveLoadingBanner).toHaveBeenCalledWith(container);
        });
        test('generates correct loaded/missing summary', async () => {
            const weightObs = makeObservation(70, 'kg', '29463-7');
            mockGetMostRecentObservation.mockImplementation(async (_client, code) => {
                if (code === '29463-7')
                    return weightObs;
                return null;
            });
            mockGetObservationValue.mockImplementation((obs) => {
                if (obs && obs.valueQuantity)
                    return obs.valueQuantity.value;
                return null;
            });
            await svc.autoPopulateFields([
                { code: '29463-7', inputId: '#weight', label: 'Weight' },
                { code: '8302-2', inputId: '#age', label: 'Height' },
            ]);
            expect(mockCreateDataSummary).toHaveBeenCalledWith(container, {
                loaded: ['Weight'],
                missing: [{ id: 'age', label: 'Height' }],
                failed: [],
            });
        });
        test('sets up dynamic tracking when missing fields exist', async () => {
            mockGetMostRecentObservation.mockResolvedValue(null);
            await svc.autoPopulateFields([
                { code: '29463-7', inputId: '#weight', label: 'Weight' },
            ]);
            expect(mockSetupDynamicTracking).toHaveBeenCalledWith(container, [
                { id: 'weight', label: 'Weight' },
            ]);
        });
        test('does not set up dynamic tracking when no missing fields', async () => {
            const obs = makeObservation(70, 'kg', '29463-7');
            mockGetMostRecentObservation.mockResolvedValue(obs);
            mockGetObservationValue.mockReturnValue(70);
            await svc.autoPopulateFields([
                { code: '29463-7', inputId: '#weight', label: 'Weight' },
            ]);
            expect(mockSetupDynamicTracking).not.toHaveBeenCalled();
        });
        test('processes non-BP fields via autoPopulateInput', async () => {
            const obs = makeObservation(70, 'kg', '29463-7');
            mockGetMostRecentObservation.mockResolvedValue(obs);
            mockGetObservationValue.mockReturnValue(70);
            const results = await svc.autoPopulateFields([
                { code: '29463-7', inputId: '#weight', label: 'Weight', decimals: 1 },
            ]);
            const weightInput = container.querySelector('#weight');
            expect(weightInput.value).toBe('70.0');
            expect(results.get('29463-7')?.value).toBe(70);
        });
        test('BP panel failure does not block remaining fields', async () => {
            mockGetMostRecentObservation.mockImplementation(async (_client, code) => {
                if (code === MOCK_LOINC_CODES.BP_PANEL) {
                    throw new Error('BP fetch failed');
                }
                return makeObservation(70, 'kg', '29463-7');
            });
            mockGetObservationValue.mockReturnValue(70);
            const results = await svc.autoPopulateFields([
                { code: '8480-6', inputId: '#systolic', label: 'Systolic BP' },
                { code: '29463-7', inputId: '#weight', label: 'Weight' },
            ]);
            const weightInput = container.querySelector('#weight');
            expect(weightInput.value).toBe('70.0');
        });
        test('tracks staleness for BP panel fields', async () => {
            const bpObs = makeBPPanelObservation(120, 80);
            mockGetMostRecentObservation.mockResolvedValue(bpObs);
            await svc.autoPopulateFields([
                { code: '8480-6', inputId: '#systolic', label: 'Systolic BP' },
                { code: '8462-4', inputId: '#diastolic', label: 'Diastolic BP' },
            ]);
            expect(mockTrackObservation).toHaveBeenCalledWith('#systolic', bpObs, '8480-6', 'Systolic BP');
            expect(mockTrackObservation).toHaveBeenCalledWith('#diastolic', bpObs, '8462-4', 'Diastolic BP');
        });
        test('strips leading # from inputId for missing field IDs', async () => {
            mockGetMostRecentObservation.mockResolvedValue(null);
            await svc.autoPopulateFields([
                { code: '29463-7', inputId: '#weight', label: 'Weight' },
            ]);
            expect(mockCreateDataSummary).toHaveBeenCalledWith(container, expect.objectContaining({
                missing: [{ id: 'weight', label: 'Weight' }],
            }));
        });
    });
    // ========================================================================
    // autoPopulateFromRequirements
    // ========================================================================
    describe('autoPopulateFromRequirements', () => {
        test('delegates to autoPopulateFields with observations', async () => {
            document.body.innerHTML = '<div id="c"><input id="weight" /></div>';
            const container = document.getElementById('c');
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, container);
            const obs = makeObservation(70, 'kg', '29463-7');
            mockGetMostRecentObservation.mockResolvedValue(obs);
            mockGetObservationValue.mockReturnValue(70);
            await svc.autoPopulateFromRequirements({
                observations: [
                    { code: '29463-7', inputId: '#weight', label: 'Weight' },
                ],
            });
            const input = container.querySelector('#weight');
            expect(input.value).toBe('70.0');
        });
        test('does nothing when observations array is empty', async () => {
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            await svc.autoPopulateFromRequirements({ observations: [] });
            expect(mockCreateLoadingBanner).not.toHaveBeenCalled();
        });
    });
    // ========================================================================
    // getObservations (multiple codes)
    // ========================================================================
    describe('getObservations', () => {
        test('fetches multiple observations and returns a Map', async () => {
            mockGetMostRecentObservation.mockImplementation(async (_client, code) => {
                if (code === '29463-7')
                    return makeObservation(70, 'kg', '29463-7');
                if (code === '8302-2')
                    return makeObservation(170, 'cm', '8302-2');
                return null;
            });
            mockGetObservationValue.mockImplementation((obs) => {
                return obs?.valueQuantity?.value ?? null;
            });
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            const results = await svc.getObservations(['29463-7', '8302-2']);
            expect(results.size).toBe(2);
            expect(results.get('29463-7')?.value).toBe(70);
            expect(results.get('8302-2')?.value).toBe(170);
        });
        test('handles partial failures gracefully', async () => {
            mockGetMostRecentObservation.mockImplementation(async (_client, code) => {
                if (code === '29463-7')
                    return makeObservation(70, 'kg', '29463-7');
                return null;
            });
            mockGetObservationValue.mockReturnValue(null);
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            const results = await svc.getObservations(['29463-7', '8302-2']);
            expect(results.size).toBe(2);
            expect(results.get('8302-2')?.value).toBeNull();
        });
    });
    // ========================================================================
    // getAllObservations
    // ========================================================================
    describe('getAllObservations', () => {
        test('returns all observations sorted ascending by default', async () => {
            const mockReq = jest.fn().mockResolvedValue({
                entry: [
                    { resource: makeObservation(65, 'kg', '29463-7', '2024-01-01T00:00:00Z') },
                    { resource: makeObservation(70, 'kg', '29463-7', '2025-01-01T00:00:00Z') },
                ],
            });
            const client = createMockClient(mockReq);
            const svc = new FHIRDataService();
            svc.initialize(client, { id: 'p1' }, document.createElement('div'));
            const results = await svc.getAllObservations('29463-7');
            expect(results.length).toBe(2);
            expect(results[0].valueQuantity.value).toBe(65);
            expect(mockReq).toHaveBeenCalledWith(expect.stringContaining('_sort=date'));
        });
        test('sorts descending when specified', async () => {
            const mockReq = jest.fn().mockResolvedValue({
                entry: [{ resource: makeObservation(70, 'kg', '29463-7') }],
            });
            const client = createMockClient(mockReq);
            const svc = new FHIRDataService();
            svc.initialize(client, { id: 'p1' }, document.createElement('div'));
            await svc.getAllObservations('29463-7', { sortOrder: 'desc' });
            expect(mockReq).toHaveBeenCalledWith(expect.stringContaining('_sort=-date'));
        });
        test('returns empty array when no entries', async () => {
            const mockReq = jest.fn().mockResolvedValue({});
            const client = createMockClient(mockReq);
            const svc = new FHIRDataService();
            svc.initialize(client, { id: 'p1' }, document.createElement('div'));
            const results = await svc.getAllObservations('29463-7');
            expect(results).toEqual([]);
        });
        test('returns empty array when client is null', async () => {
            const svc = new FHIRDataService();
            const results = await svc.getAllObservations('29463-7');
            expect(results).toEqual([]);
        });
        test('returns empty array on error', async () => {
            const mockReq = jest.fn().mockRejectedValue(new Error('Server error'));
            const client = createMockClient(mockReq);
            const svc = new FHIRDataService();
            svc.initialize(client, { id: 'p1' }, document.createElement('div'));
            const results = await svc.getAllObservations('29463-7');
            expect(results).toEqual([]);
        });
    });
    // ========================================================================
    // getRawObservation
    // ========================================================================
    describe('getRawObservation', () => {
        test('returns raw observation resource', async () => {
            const obs = makeObservation(7.2, 'mg/dL', '2160-0');
            mockGetMostRecentObservation.mockResolvedValue(obs);
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            const result = await svc.getRawObservation('2160-0');
            expect(result).toEqual(obs);
        });
        test('returns null when client is null', async () => {
            const svc = new FHIRDataService();
            const result = await svc.getRawObservation('2160-0');
            expect(result).toBeNull();
        });
        test('returns null on error', async () => {
            mockGetMostRecentObservation.mockRejectedValue(new Error('Fetch error'));
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            const result = await svc.getRawObservation('2160-0');
            expect(result).toBeNull();
        });
    });
    // ========================================================================
    // getObservationsInWindow
    // ========================================================================
    describe('getObservationsInWindow', () => {
        test('returns observations within time window', async () => {
            const now = new Date();
            const recentDate = new Date(now.getTime() - 2 * 60 * 60 * 1000);
            const obs = makeObservation(120, 'mg/dL', '2345-7', recentDate.toISOString());
            const mockReq = jest.fn().mockResolvedValue({
                entry: [{ resource: obs }],
            });
            const client = createMockClient(mockReq);
            mockGetObservationValue.mockReturnValue(null);
            const svc = new FHIRDataService();
            svc.initialize(client, { id: 'p1' }, document.createElement('div'));
            const results = await svc.getObservationsInWindow('2345-7', 24);
            expect(results.length).toBe(1);
            expect(results[0].value).toBe(120);
        });
        test('filters out observations outside the strict time window', async () => {
            const now = new Date();
            const oldDate = new Date(now.getTime() - 48 * 60 * 60 * 1000);
            const mockReq = jest.fn().mockResolvedValue({
                entry: [{
                        resource: makeObservation(120, 'mg/dL', '2345-7', oldDate.toISOString()),
                    }],
            });
            const client = createMockClient(mockReq);
            const svc = new FHIRDataService();
            svc.initialize(client, { id: 'p1' }, document.createElement('div'));
            const results = await svc.getObservationsInWindow('2345-7', 24);
            expect(results.length).toBe(0);
        });
        test('returns empty array when no entries in response', async () => {
            const mockReq = jest.fn().mockResolvedValue({});
            const client = createMockClient(mockReq);
            const svc = new FHIRDataService();
            svc.initialize(client, { id: 'p1' }, document.createElement('div'));
            const results = await svc.getObservationsInWindow('2345-7', 24);
            expect(results).toEqual([]);
        });
        test('returns empty array when client is null', async () => {
            const svc = new FHIRDataService();
            const results = await svc.getObservationsInWindow('2345-7', 24);
            expect(results).toEqual([]);
        });
        test('returns empty array on error', async () => {
            const mockReq = jest.fn().mockRejectedValue(new Error('err'));
            const client = createMockClient(mockReq);
            const svc = new FHIRDataService();
            svc.initialize(client, { id: 'p1' }, document.createElement('div'));
            const results = await svc.getObservationsInWindow('2345-7', 24);
            expect(results).toEqual([]);
        });
        test('skips entries without date', async () => {
            const obsNoDate = {
                resourceType: 'Observation',
                valueQuantity: { value: 100, unit: 'mg/dL' },
            };
            const mockReq = jest.fn().mockResolvedValue({
                entry: [{ resource: obsNoDate }],
            });
            const client = createMockClient(mockReq);
            const svc = new FHIRDataService();
            svc.initialize(client, { id: 'p1' }, document.createElement('div'));
            const results = await svc.getObservationsInWindow('2345-7', 24);
            expect(results.length).toBe(0);
        });
    });
    // ========================================================================
    // getAggregatedObservation
    // ========================================================================
    describe('getAggregatedObservation', () => {
        test('returns min value from observations in window', async () => {
            const now = new Date();
            const date1 = new Date(now.getTime() - 1 * 60 * 60 * 1000);
            const date2 = new Date(now.getTime() - 2 * 60 * 60 * 1000);
            const obs1 = makeObservation(150, 'mg/dL', '2345-7', date1.toISOString());
            const obs2 = makeObservation(100, 'mg/dL', '2345-7', date2.toISOString());
            const mockReq = jest.fn().mockResolvedValue({
                entry: [{ resource: obs1 }, { resource: obs2 }],
            });
            const client = createMockClient(mockReq);
            mockGetObservationValue.mockReturnValue(null);
            const svc = new FHIRDataService();
            svc.initialize(client, { id: 'p1' }, document.createElement('div'));
            const result = await svc.getAggregatedObservation('2345-7', 'min', 24);
            expect(result.value).toBe(100);
        });
        test('returns max value from observations in window', async () => {
            const now = new Date();
            const date1 = new Date(now.getTime() - 1 * 60 * 60 * 1000);
            const date2 = new Date(now.getTime() - 2 * 60 * 60 * 1000);
            const obs1 = makeObservation(150, 'mg/dL', '2345-7', date1.toISOString());
            const obs2 = makeObservation(100, 'mg/dL', '2345-7', date2.toISOString());
            const mockReq = jest.fn().mockResolvedValue({
                entry: [{ resource: obs1 }, { resource: obs2 }],
            });
            const client = createMockClient(mockReq);
            mockGetObservationValue.mockReturnValue(null);
            const svc = new FHIRDataService();
            svc.initialize(client, { id: 'p1' }, document.createElement('div'));
            const result = await svc.getAggregatedObservation('2345-7', 'max', 24);
            expect(result.value).toBe(150);
        });
        test('returns empty result when no observations in window', async () => {
            const mockReq = jest.fn().mockResolvedValue({});
            const client = createMockClient(mockReq);
            const svc = new FHIRDataService();
            svc.initialize(client, { id: 'p1' }, document.createElement('div'));
            const result = await svc.getAggregatedObservation('2345-7', 'min', 24);
            expect(result.value).toBeNull();
            expect(result.observation).toBeNull();
        });
        test('handles null values in aggregation', async () => {
            const now = new Date();
            const date1 = new Date(now.getTime() - 1 * 60 * 60 * 1000);
            const date2 = new Date(now.getTime() - 2 * 60 * 60 * 1000);
            const obsNoValue = {
                resourceType: 'Observation',
                id: 'obs-no-val',
                effectiveDateTime: date1.toISOString(),
            };
            const obsWithValue = makeObservation(100, 'mg/dL', '2345-7', date2.toISOString());
            const mockReq = jest.fn().mockResolvedValue({
                entry: [{ resource: obsNoValue }, { resource: obsWithValue }],
            });
            const client = createMockClient(mockReq);
            mockGetObservationValue.mockReturnValue(null);
            const svc = new FHIRDataService();
            svc.initialize(client, { id: 'p1' }, document.createElement('div'));
            const result = await svc.getAggregatedObservation('2345-7', 'max', 48);
            expect(result.value).toBe(100);
        });
    });
    // ========================================================================
    // Conditions & Medications
    // ========================================================================
    describe('getConditions / hasCondition', () => {
        test('getConditions returns conditions from FHIR', async () => {
            const conditions = [
                { resourceType: 'Condition', id: 'c1', code: { coding: [{ code: '44054006' }] } },
            ];
            mockGetPatientConditions.mockResolvedValue(conditions);
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            const result = await svc.getConditions(['44054006']);
            expect(result).toEqual(conditions);
            expect(mockGetPatientConditions).toHaveBeenCalled();
        });
        test('getConditions returns empty array when client is null', async () => {
            const svc = new FHIRDataService();
            const result = await svc.getConditions(['44054006']);
            expect(result).toEqual([]);
        });
        test('getConditions returns empty array on error', async () => {
            mockGetPatientConditions.mockRejectedValue(new Error('Error'));
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            const result = await svc.getConditions(['44054006']);
            expect(result).toEqual([]);
        });
        test('hasCondition returns true when conditions exist', async () => {
            mockGetPatientConditions.mockResolvedValue([{ id: 'c1' }]);
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            const result = await svc.hasCondition(['44054006']);
            expect(result).toBe(true);
        });
        test('hasCondition returns false when no conditions found', async () => {
            mockGetPatientConditions.mockResolvedValue([]);
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            const result = await svc.hasCondition(['44054006']);
            expect(result).toBe(false);
        });
    });
    describe('getMedications / isOnMedication', () => {
        test('getMedications returns medication requests', async () => {
            const meds = [{ resourceType: 'MedicationRequest', id: 'm1' }];
            mockGetMedicationRequests.mockResolvedValue(meds);
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            const result = await svc.getMedications(['12345']);
            expect(result).toEqual(meds);
        });
        test('getMedications returns empty array when client is null', async () => {
            const svc = new FHIRDataService();
            const result = await svc.getMedications(['12345']);
            expect(result).toEqual([]);
        });
        test('getMedications returns empty array on error', async () => {
            mockGetMedicationRequests.mockRejectedValue(new Error('Error'));
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            const result = await svc.getMedications(['12345']);
            expect(result).toEqual([]);
        });
        test('isOnMedication returns true when medications exist', async () => {
            mockGetMedicationRequests.mockResolvedValue([{ id: 'm1' }]);
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            const result = await svc.isOnMedication(['12345']);
            expect(result).toBe(true);
        });
        test('isOnMedication returns false when no medications found', async () => {
            mockGetMedicationRequests.mockResolvedValue([]);
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            const result = await svc.isOnMedication(['12345']);
            expect(result).toBe(false);
        });
    });
    // ========================================================================
    // Cache Management
    // ========================================================================
    describe('clearCache', () => {
        test('clears patient cache when patientId is set', () => {
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            svc.clearCache();
            expect(mockClearPatientCache).toHaveBeenCalledWith('p1');
        });
        test('does nothing when patientId is null', () => {
            const svc = new FHIRDataService();
            svc.clearCache();
            expect(mockClearPatientCache).not.toHaveBeenCalled();
        });
    });
    describe('prefetch', () => {
        test('fetches all provided codes concurrently', async () => {
            mockGetMostRecentObservation.mockResolvedValue(null);
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            await svc.prefetch(['29463-7', '8302-2', '2160-0']);
            // prefetch calls getObservation which calls getMostRecentObservation for each code
            expect(mockGetMostRecentObservation).toHaveBeenCalledTimes(3);
        });
    });
    // ========================================================================
    // Utility methods
    // ========================================================================
    describe('getPatientAge', () => {
        test('returns calculated age from patient birthDate', () => {
            mockCalculateAge.mockReturnValue(35);
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1', birthDate: '1990-01-01' }, document.createElement('div'));
            const age = svc.getPatientAge();
            expect(age).toBe(35);
            expect(mockCalculateAge).toHaveBeenCalledWith('1990-01-01');
        });
        test('returns null when patient has no birthDate', () => {
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            const age = svc.getPatientAge();
            expect(age).toBeNull();
        });
        test('returns null when patient is null', () => {
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), null, document.createElement('div'));
            const age = svc.getPatientAge();
            expect(age).toBeNull();
        });
    });
    describe('getPatientGender', () => {
        test('returns male for male gender', () => {
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1', gender: 'male' }, document.createElement('div'));
            expect(svc.getPatientGender()).toBe('male');
        });
        test('returns female for female gender', () => {
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1', gender: 'female' }, document.createElement('div'));
            expect(svc.getPatientGender()).toBe('female');
        });
        test('returns female for Female (case-insensitive)', () => {
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1', gender: 'Female' }, document.createElement('div'));
            expect(svc.getPatientGender()).toBe('female');
        });
        test('returns male for unknown gender strings', () => {
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1', gender: 'other' }, document.createElement('div'));
            expect(svc.getPatientGender()).toBe('male');
        });
        test('returns null when gender is not set', () => {
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            expect(svc.getPatientGender()).toBeNull();
        });
        test('returns null when patient is null', () => {
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), null, document.createElement('div'));
            expect(svc.getPatientGender()).toBeNull();
        });
    });
    // ========================================================================
    // Patient Name (edge cases not covered in fhir-service.test.ts)
    // ========================================================================
    describe('getPatientName -- edge cases', () => {
        test('returns null for empty name array', () => {
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1', name: [] }, document.createElement('div'));
            expect(svc.getPatientName()).toBeNull();
        });
        test('returns null when name parts produce no display', () => {
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), {
                id: 'p1',
                name: [{ use: 'official' }],
            }, document.createElement('div'));
            expect(svc.getPatientName()).toBeNull();
        });
        test('uses first name entry when no official name exists', () => {
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), {
                id: 'p1',
                name: [{ family: 'Doe', given: ['Jane'] }],
            }, document.createElement('div'));
            const name = svc.getPatientName();
            expect(name?.display).toBe('Jane Doe');
        });
    });
    // ========================================================================
    // Provenance Tracking
    // ========================================================================
    describe('recordCalculationProvenance', () => {
        test('records calculation provenance', async () => {
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            await svc.recordCalculationProvenance('calc-1', 'BMI Calculator', { weight: 70, height: 170 }, { bmi: 24.2 });
            expect(mockRecordCalculation).toHaveBeenCalledWith(expect.objectContaining({
                calculatorId: 'calc-1',
                calculatorName: 'BMI Calculator',
                inputs: { weight: 70, height: 170 },
                outputs: { bmi: 24.2 },
                patientId: 'p1',
            }));
        });
        test('records derivation when source observations provided', async () => {
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            await svc.recordCalculationProvenance('calc-1', 'BMI Calculator', { weight: 70 }, { bmi: 24.2 }, ['Observation/obs-weight-1']);
            expect(mockRecordDerivation).toHaveBeenCalledWith(expect.stringContaining('#calculation-calc-1-'), 'BMI Calculator Result', [{ reference: 'Observation/obs-weight-1', display: 'Source observation' }], 'Calculated using BMI Calculator');
        });
        test('does not record derivation when no source observations', async () => {
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            await svc.recordCalculationProvenance('calc-1', 'BMI Calculator', {}, {});
            expect(mockRecordDerivation).not.toHaveBeenCalled();
        });
        test('handles errors gracefully', async () => {
            mockRecordCalculation.mockRejectedValue(new Error('Provenance error'));
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            // Should not throw
            await svc.recordCalculationProvenance('calc-1', 'BMI Calculator', {}, {});
            expect(console.warn).toHaveBeenCalled();
        });
        test('uses client.patient.id when patient is null', async () => {
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), null, document.createElement('div'));
            await svc.recordCalculationProvenance('calc-1', 'Test', {}, {});
            expect(mockRecordCalculation).toHaveBeenCalledWith(expect.objectContaining({
                patientId: 'test-patient',
            }));
        });
    });
    describe('getProvenance', () => {
        test('delegates to provenanceService.getProvenanceForTarget', () => {
            mockGetProvenanceForTarget.mockReturnValue([{ id: 'prov-1' }]);
            const svc = new FHIRDataService();
            const result = svc.getProvenance('target-ref');
            expect(mockGetProvenanceForTarget).toHaveBeenCalledWith('target-ref');
            expect(result).toEqual([{ id: 'prov-1' }]);
        });
    });
    describe('generateLineageReport', () => {
        test('delegates to provenanceService.generateLineageReport', () => {
            const mockReport = {
                target: 'ref',
                records: [],
                sources: [],
                agents: [],
                activities: [],
            };
            mockGenerateLineageReport.mockReturnValue(mockReport);
            const svc = new FHIRDataService();
            const result = svc.generateLineageReport('ref');
            expect(mockGenerateLineageReport).toHaveBeenCalledWith('ref');
            expect(result).toEqual(mockReport);
        });
    });
    // ========================================================================
    // getPatientBirthDate / getPatientBirthDateString / getPatientDemographics
    // ========================================================================
    describe('getPatientBirthDate', () => {
        test('returns Date object for valid birthDate', () => {
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1', birthDate: '1985-06-15' }, document.createElement('div'));
            const date = svc.getPatientBirthDate();
            expect(date).toBeInstanceOf(Date);
            expect(date.getFullYear()).toBe(1985);
        });
        test('returns null when no birthDate', () => {
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            expect(svc.getPatientBirthDate()).toBeNull();
        });
    });
    describe('getPatientBirthDateString', () => {
        test('returns birthDate string', () => {
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1', birthDate: '1985-06-15' }, document.createElement('div'));
            expect(svc.getPatientBirthDateString()).toBe('1985-06-15');
        });
        test('returns null when no birthDate', () => {
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            expect(svc.getPatientBirthDateString()).toBeNull();
        });
    });
    describe('getPatientDemographics', () => {
        test('returns complete demographics', () => {
            mockCalculateAge.mockReturnValue(40);
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), {
                id: 'p1',
                name: [{ text: 'John Doe' }],
                birthDate: '1985-06-15',
                gender: 'male',
            }, document.createElement('div'));
            const demo = svc.getPatientDemographics();
            expect(demo).toEqual({
                name: 'John Doe',
                age: 40,
                gender: 'male',
                birthDate: '1985-06-15',
            });
        });
        test('returns nulls for missing patient data', () => {
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            const demo = svc.getPatientDemographics();
            expect(demo.name).toBeNull();
            expect(demo.age).toBeNull();
            expect(demo.gender).toBeNull();
            expect(demo.birthDate).toBeNull();
        });
    });
    // ========================================================================
    // getPatientDisplayName
    // ========================================================================
    describe('getPatientDisplayName', () => {
        test('returns display name string', () => {
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), {
                id: 'p1',
                name: [{ family: 'Smith', given: ['Alice'] }],
            }, document.createElement('div'));
            expect(svc.getPatientDisplayName()).toBe('Alice Smith');
        });
        test('returns null for patient without name', () => {
            const svc = new FHIRDataService();
            svc.initialize(createMockClient(), { id: 'p1' }, document.createElement('div'));
            expect(svc.getPatientDisplayName()).toBeNull();
        });
    });
    // ========================================================================
    // Default export and singleton
    // ========================================================================
    describe('module exports', () => {
        test('default export contains FHIRDataService, fhirDataService, createFHIRDataService', async () => {
            const mod = await import('../fhir-data-service.js');
            expect(mod.default).toBeDefined();
            expect(mod.default.FHIRDataService).toBe(FHIRDataService);
            expect(mod.default.createFHIRDataService).toBe(createFHIRDataService);
            expect(mod.default.fhirDataService).toBeDefined();
        });
        test('fhirDataService singleton is an instance of FHIRDataService', async () => {
            const mod = await import('../fhir-data-service.js');
            expect(mod.fhirDataService).toBeInstanceOf(FHIRDataService);
        });
    });
});
