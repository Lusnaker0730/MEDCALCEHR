/**
 * Unit Tests for FHIR Data Service
 * Tests the unified FHIR data management layer
 */

// Mock dependencies
jest.mock('../../js/utils.js', () => ({
    getMostRecentObservation: jest.fn(),
    getObservationValue: jest.fn(),
    getPatientConditions: jest.fn(),
    getMedicationRequests: jest.fn()
}));

jest.mock('../../js/fhir-codes.js', () => ({
    LOINC_CODES: {
        TEMPERATURE: '8310-5',
        HEART_RATE: '8867-4',
        CREATININE: '2160-0',
        SODIUM: '2951-2',
        HDL: '2085-9',
        CHOLESTEROL_TOTAL: '2093-3'
    },
    SNOMED_CODES: {
        DIABETES: '73211009',
        HYPERTENSION: '38341003'
    },
    getLoincName: jest.fn(code => `Lab ${code}`)
}));

jest.mock('../../js/cache-manager.js', () => ({
    fhirCache: {
        getCachedObservation: jest.fn(),
        cacheObservation: jest.fn(),
        clearPatientCache: jest.fn()
    }
}));

jest.mock('../../js/data-staleness.js', () => ({
    createStalenessTracker: jest.fn(() => ({
        setContainer: jest.fn(),
        checkStaleness: jest.fn(() => ({ isStale: false, ageInDays: 10 })),
        trackObservation: jest.fn()
    })),
    DataStalenessTracker: class { }
}));

jest.mock('../../js/unit-converter.js', () => ({
    UnitConverter: {
        convert: jest.fn((value, from, to, type) => {
            // Simple mock conversion
            if (from === to) return value;
            if (from === 'mmol/L' && to === 'mg/dL' && type === 'cholesterol') {
                return value * 38.67;
            }
            return value;
        }),
        setInputValue: jest.fn()
    }
}));

jest.mock('../../js/fhir-feedback.js', () => ({
    fhirFeedback: {
        createLoadingBanner: jest.fn(),
        removeLoadingBanner: jest.fn(),
        createDataSummary: jest.fn()
    }
}));

// Import after mocks
import { FHIRDataService, createFHIRDataService } from '../src/fhir-data-service';
import { getMostRecentObservation, getObservationValue } from '../../js/utils.js';
import { fhirCache } from '../../js/cache-manager.js';
import { createStalenessTracker } from '../../js/data-staleness.js';

describe('FHIRDataService', () => {
    let service;
    let mockClient;
    let mockPatient;
    let mockContainer;

    beforeEach(() => {
        jest.clearAllMocks();

        service = createFHIRDataService();

        mockClient = {
            patient: {
                id: 'patient-123',
                read: jest.fn().mockResolvedValue({ id: 'patient-123' }),
                request: jest.fn()
            },
            request: jest.fn()
        };

        mockPatient = {
            id: 'patient-123',
            birthDate: '1970-01-01',
            gender: 'male',
            name: [{ given: ['John'], family: 'Doe' }]
        };

        mockContainer = document.createElement('div');
    });

    describe('initialize', () => {
        it('should initialize with client, patient, and container', () => {
            service.initialize(mockClient, mockPatient, mockContainer);

            expect(service.isReady()).toBe(true);
            expect(service.getPatient()).toBe(mockPatient);
            expect(service.getPatientId()).toBe('patient-123');
        });

        it('should create staleness tracker', () => {
            service.initialize(mockClient, mockPatient, mockContainer);

            expect(createStalenessTracker).toHaveBeenCalled();
            expect(service.getStalenessTracker()).toBeDefined();
        });

        it('should handle null client gracefully', () => {
            service.initialize(null, mockPatient, mockContainer);

            expect(service.isReady()).toBe(false);
        });
    });

    describe('getObservation', () => {
        beforeEach(() => {
            service.initialize(mockClient, mockPatient, mockContainer);
        });

        it('should fetch observation from FHIR server', async () => {
            const mockObservation = {
                valueQuantity: { value: 98.6, unit: 'F' },
                effectiveDateTime: '2024-01-01T10:00:00Z'
            };
            getMostRecentObservation.mockResolvedValue(mockObservation);

            const result = await service.getObservation('8310-5');

            expect(getMostRecentObservation).toHaveBeenCalledWith(mockClient, '8310-5');
            expect(result.value).toBe(98.6);
            expect(result.unit).toBe('F');
            expect(result.observation).toBe(mockObservation);
        });

        it('should use cached observation when available', async () => {
            const cachedObs = { valueQuantity: { value: 100, unit: 'mg/dL' } };
            fhirCache.getCachedObservation.mockReturnValue(cachedObs);

            const result = await service.getObservation('2160-0');

            expect(fhirCache.getCachedObservation).toHaveBeenCalled();
            expect(getMostRecentObservation).not.toHaveBeenCalled();
            expect(result.value).toBe(100);
        });

        it('should skip cache when option is set', async () => {
            fhirCache.getCachedObservation.mockReturnValue({ valueQuantity: { value: 50 } });
            getMostRecentObservation.mockResolvedValue({ valueQuantity: { value: 60, unit: 'mg/dL' } });

            const result = await service.getObservation('2160-0', { skipCache: true });

            expect(getMostRecentObservation).toHaveBeenCalled();
            expect(result.value).toBe(60);
        });

        it('should cache fetched observation', async () => {
            const mockObs = { valueQuantity: { value: 140, unit: 'mmol/L' } };
            getMostRecentObservation.mockResolvedValue(mockObs);

            await service.getObservation('2951-2');

            expect(fhirCache.cacheObservation).toHaveBeenCalledWith(
                'patient-123',
                '2951-2',
                mockObs
            );
        });

        it('should handle null observation', async () => {
            getMostRecentObservation.mockResolvedValue(null);

            const result = await service.getObservation('unknown-code');

            expect(result.value).toBeNull();
            expect(result.observation).toBeNull();
        });

        it('should extract date from effectiveDateTime', async () => {
            getMostRecentObservation.mockResolvedValue({
                valueQuantity: { value: 100 },
                effectiveDateTime: '2024-06-15T14:30:00Z'
            });

            const result = await service.getObservation('test-code');

            expect(result.date).toBeInstanceOf(Date);
            expect(result.date.getFullYear()).toBe(2024);
        });
    });

    describe('getPatientAge', () => {
        it('should calculate age correctly', () => {
            const birthYear = new Date().getFullYear() - 50;
            mockPatient.birthDate = `${birthYear}-01-01`;

            service.initialize(mockClient, mockPatient, mockContainer);

            const age = service.getPatientAge();
            expect(age).toBe(50);
        });

        it('should return null when no birthDate', () => {
            delete mockPatient.birthDate;
            service.initialize(mockClient, mockPatient, mockContainer);

            expect(service.getPatientAge()).toBeNull();
        });
    });

    describe('getPatientGender', () => {
        it('should return male for male patient', () => {
            mockPatient.gender = 'male';
            service.initialize(mockClient, mockPatient, mockContainer);

            expect(service.getPatientGender()).toBe('male');
        });

        it('should return female for female patient', () => {
            mockPatient.gender = 'Female';
            service.initialize(mockClient, mockPatient, mockContainer);

            expect(service.getPatientGender()).toBe('female');
        });

        it('should return null when no gender', () => {
            delete mockPatient.gender;
            service.initialize(mockClient, mockPatient, mockContainer);

            expect(service.getPatientGender()).toBeNull();
        });
    });

    describe('clearCache', () => {
        it('should clear patient cache', () => {
            service.initialize(mockClient, mockPatient, mockContainer);
            service.clearCache();

            expect(fhirCache.clearPatientCache).toHaveBeenCalledWith('patient-123');
        });
    });

    describe('autoPopulateInput', () => {
        beforeEach(() => {
            service.initialize(mockClient, mockPatient, mockContainer);
            // Add test input to container
            const input = document.createElement('input');
            input.id = 'test-input';
            mockContainer.appendChild(input);
        });

        it('should populate input with fetched value', async () => {
            getMostRecentObservation.mockResolvedValue({
                valueQuantity: { value: 140, unit: 'mmol/L' }
            });

            await service.autoPopulateInput('#test-input', '2951-2', {
                label: 'Sodium',
                decimals: 0
            });

            const input = mockContainer.querySelector('#test-input');
            expect(input.value).toBe('140');
        });

        it('should apply transform function', async () => {
            getMostRecentObservation.mockResolvedValue({
                valueQuantity: { value: 100, unit: 'mg/dL' }
            });

            await service.autoPopulateInput('#test-input', '2160-0', {
                transform: v => v / 10,
                decimals: 1
            });

            const input = mockContainer.querySelector('#test-input');
            expect(input.value).toBe('10.0');
        });
    });

    describe('getConditions', () => {
        it('should return empty array when no client', async () => {
            service.initialize(null, mockPatient, mockContainer);

            const result = await service.getConditions(['73211009']);
            expect(result).toEqual([]);
        });
    });

    describe('hasCondition', () => {
        beforeEach(() => {
            service.initialize(mockClient, mockPatient, mockContainer);
        });

        it('should return true when conditions exist', async () => {
            const mockConditions = [{ id: 'cond-1', code: { coding: [{ code: '73211009' }] } }];
            const { getPatientConditions } = require('../../js/utils.js');
            getPatientConditions.mockResolvedValue(mockConditions);

            const result = await service.hasCondition(['73211009']);
            expect(result).toBe(true);
        });
    });
});

describe('createFHIRDataService', () => {
    it('should create new service instance', () => {
        const service1 = createFHIRDataService();
        const service2 = createFHIRDataService();

        expect(service1).not.toBe(service2);
        expect(service1).toBeInstanceOf(FHIRDataService);
    });
});
