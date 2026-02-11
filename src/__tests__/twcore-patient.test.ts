/**
 * TW Core Patient Tests
 * Tests for patient identifier extraction, age extension, and conformance
 */

import { describe, expect, test, beforeEach } from '@jest/globals';
import { FHIRDataService } from '../fhir-data-service.js';
import { TW_CORE_PROFILES } from '../twcore/profiles.js';
import { TW_IDENTIFIER_SYSTEMS } from '../twcore/identifier-systems.js';
import { checkPatientConformance } from '../twcore/validation.js';

// Mock dependencies
jest.mock('../logger.js', () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));
jest.mock('../sentry.js', () => ({ initSentry: jest.fn() }));

// Load fixture
import patientExample from './fixtures/twcore/patient-example.json';

describe('TW Core Patient', () => {
    let service: FHIRDataService;

    beforeEach(() => {
        service = new FHIRDataService();
    });

    describe('getPatientIdentifiers()', () => {
        test('should extract National ID from TW Core patient', () => {
            const mockClient = { patient: { id: 'pat-example', read: jest.fn(), request: jest.fn() }, request: jest.fn() };
            const container = document.createElement('div');
            service.initialize(mockClient, patientExample, container);

            const identifiers = service.getPatientIdentifiers();
            const nationalId = identifiers.find(id => id.type === 'NATIONAL_ID');

            expect(nationalId).toBeDefined();
            expect(nationalId!.system).toBe(TW_IDENTIFIER_SYSTEMS.NATIONAL_ID);
            expect(nationalId!.value).toBe('A123456789');
            expect(nationalId!.label).toBe('國民身分證');
        });

        test('should extract Medical Record Number', () => {
            const mockClient = { patient: { id: 'pat-example', read: jest.fn(), request: jest.fn() }, request: jest.fn() };
            const container = document.createElement('div');
            service.initialize(mockClient, patientExample, container);

            const identifiers = service.getPatientIdentifiers();
            const mrn = identifiers.find(id => id.type === 'MEDICAL_RECORD');

            expect(mrn).toBeDefined();
            expect(mrn!.value).toBe('12345678');
        });

        test('should return empty array when patient has no identifiers', () => {
            const mockClient = { patient: { id: 'p1', read: jest.fn(), request: jest.fn() }, request: jest.fn() };
            const container = document.createElement('div');
            service.initialize(mockClient, { id: 'p1', gender: 'male' }, container);

            const identifiers = service.getPatientIdentifiers();
            expect(identifiers).toHaveLength(0);
        });

        test('should detect MR type from type.coding when system is unknown', () => {
            const patient = {
                id: 'p1',
                identifier: [{
                    type: {
                        coding: [{ system: 'http://terminology.hl7.org/CodeSystem/v2-0203', code: 'MR' }],
                    },
                    system: 'http://hospital.example.com/mrn',
                    value: 'MRN001',
                }],
            };
            const mockClient = { patient: { id: 'p1', read: jest.fn(), request: jest.fn() }, request: jest.fn() };
            const container = document.createElement('div');
            service.initialize(mockClient, patient, container);

            const identifiers = service.getPatientIdentifiers();
            expect(identifiers).toHaveLength(1);
            expect(identifiers[0].type).toBe('MEDICAL_RECORD');
        });

        test('should handle passport and resident certificate', () => {
            const patient = {
                id: 'p1',
                identifier: [
                    { system: 'http://www.boca.gov.tw', value: 'P12345678' },
                    { system: 'http://www.immigration.gov.tw', value: 'RC12345678' },
                ],
            };
            const mockClient = { patient: { id: 'p1', read: jest.fn(), request: jest.fn() }, request: jest.fn() };
            const container = document.createElement('div');
            service.initialize(mockClient, patient, container);

            const identifiers = service.getPatientIdentifiers();
            expect(identifiers).toHaveLength(2);
            expect(identifiers[0].type).toBe('PASSPORT');
            expect(identifiers[1].type).toBe('RESIDENT_CERTIFICATE');
        });
    });

    describe('getPatientAgeTWCore()', () => {
        test('should prefer person-age extension value', () => {
            const mockClient = { patient: { id: 'pat-example', read: jest.fn(), request: jest.fn() }, request: jest.fn() };
            const container = document.createElement('div');
            service.initialize(mockClient, patientExample, container);

            const age = service.getPatientAgeTWCore();
            expect(age).toBe(36); // From extension
        });

        test('should fallback to calculateAge when no extension', () => {
            const patient = { id: 'p1', birthDate: '2000-01-01' };
            const mockClient = { patient: { id: 'p1', read: jest.fn(), request: jest.fn() }, request: jest.fn() };
            const container = document.createElement('div');
            service.initialize(mockClient, patient, container);

            const age = service.getPatientAgeTWCore();
            expect(age).toBeGreaterThan(0);
            expect(age).not.toBeNull();
        });

        test('should return null when no extension and no birthDate', () => {
            const patient = { id: 'p1' };
            const mockClient = { patient: { id: 'p1', read: jest.fn(), request: jest.fn() }, request: jest.fn() };
            const container = document.createElement('div');
            service.initialize(mockClient, patient, container);

            const age = service.getPatientAgeTWCore();
            expect(age).toBeNull();
        });
    });

    describe('isTWCorePatient()', () => {
        test('should return true for patient with TW Core profile', () => {
            const mockClient = { patient: { id: 'pat-example', read: jest.fn(), request: jest.fn() }, request: jest.fn() };
            const container = document.createElement('div');
            service.initialize(mockClient, patientExample, container);

            expect(service.isTWCorePatient()).toBe(true);
        });

        test('should return false for patient without TW Core profile', () => {
            const patient = { id: 'p1', gender: 'male' };
            const mockClient = { patient: { id: 'p1', read: jest.fn(), request: jest.fn() }, request: jest.fn() };
            const container = document.createElement('div');
            service.initialize(mockClient, patient, container);

            expect(service.isTWCorePatient()).toBe(false);
        });

        test('should return false for patient with empty meta', () => {
            const patient = { id: 'p1', meta: {} };
            const mockClient = { patient: { id: 'p1', read: jest.fn(), request: jest.fn() }, request: jest.fn() };
            const container = document.createElement('div');
            service.initialize(mockClient, patient, container);

            expect(service.isTWCorePatient()).toBe(false);
        });
    });

    describe('checkPatientConformance()', () => {
        test('should pass for TW Core conformant patient', () => {
            const result = checkPatientConformance(patientExample);
            expect(result.isConformant).toBe(true);
            expect(result.issues.filter(i => i.severity === 'error')).toHaveLength(0);
        });

        test('should fail when identifier is missing', () => {
            const patient = { id: 'p1', gender: 'male', birthDate: '1990-01-01' };
            const result = checkPatientConformance(patient);
            expect(result.isConformant).toBe(false);
            expect(result.issues.some(i => i.path === 'Patient.identifier' && i.severity === 'error')).toBe(true);
        });

        test('should warn when gender is missing', () => {
            const patient = {
                id: 'p1',
                identifier: [{ system: 'http://www.moi.gov.tw', value: 'A123456789' }],
                birthDate: '1990-01-01',
            };
            const result = checkPatientConformance(patient);
            expect(result.isConformant).toBe(true); // gender is warning, not error
            expect(result.issues.some(i => i.path === 'Patient.gender')).toBe(true);
        });

        test('should warn when birthDate is missing', () => {
            const patient = {
                id: 'p1',
                identifier: [{ system: 'http://www.moi.gov.tw', value: 'A123456789' }],
                gender: 'male',
            };
            const result = checkPatientConformance(patient);
            expect(result.isConformant).toBe(true);
            expect(result.issues.some(i => i.path === 'Patient.birthDate')).toBe(true);
        });

        test('should fail for null patient', () => {
            const result = checkPatientConformance(null);
            expect(result.isConformant).toBe(false);
        });

        test('should fail for empty identifier array', () => {
            const patient = { id: 'p1', identifier: [], gender: 'male', birthDate: '1990-01-01' };
            const result = checkPatientConformance(patient);
            expect(result.isConformant).toBe(false);
        });
    });
});
