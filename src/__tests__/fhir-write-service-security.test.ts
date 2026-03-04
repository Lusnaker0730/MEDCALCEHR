// src/__tests__/fhir-write-service-security.test.ts
import { describe, expect, test, jest, beforeEach } from '@jest/globals';

// Mock dependencies before importing the module under test
jest.mock('../logger', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    },
}));

jest.mock('../fhir-auth-interceptor', () => ({
    isAuthError: jest.fn(() => false),
}));

jest.mock('../token-lifecycle-manager', () => ({
    tokenLifecycleManager: {
        handleAuthFailure: jest.fn(),
    },
}));

jest.mock('../provenance-service', () => ({
    provenanceService: {
        recordCalculation: jest.fn<() => Promise<any>>().mockResolvedValue({ id: 'prov-1' }),
    },
}));

// We do NOT mock security-labels-service — we use the real implementation
// to verify end-to-end label application
jest.mock('../audit-event-service', () => ({
    auditEventService: {
        logSecurityAlert: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    },
}));

import { fhirWriteService } from '../fhir-write-service';

describe('FHIRWriteService — Security Labels Integration', () => {
    const mockCreate = jest.fn<(...args: any[]) => Promise<any>>();

    beforeEach(() => {
        jest.clearAllMocks();
        mockCreate.mockReset();
        // Configure the service with a mock client
        (window as any).MEDCALC_CONFIG = { enableWriteBack: true };
        fhirWriteService.setClient({
            patient: { id: 'patient-1' },
            create: mockCreate.mockResolvedValue({ id: 'obs-1' }),
        });
    });

    test('buildObservation produces a resource with meta.security containing Confidentiality label', () => {
        // Access the private method via any cast
        const service = fhirWriteService as any;
        const observation = service.buildObservation(
            {
                calculatorId: 'ckd-epi',
                calculatorTitle: 'CKD-EPI',
                patientId: 'patient-1',
                results: [],
            },
            { label: 'eGFR', value: 60, unit: 'mL/min/1.73m2', loincCode: '48642-3' }
        );

        expect(observation.meta).toBeDefined();
        expect(observation.meta.security).toBeDefined();
        expect(Array.isArray(observation.meta.security)).toBe(true);

        // Should have at least a Confidentiality label
        const confLabel = observation.meta.security.find(
            (s: any) => s.system === 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality'
        );
        expect(confLabel).toBeDefined();
        expect(confLabel.code).toBeDefined();
    });

    test('default confidentiality is N (Normal) for non-sensitive observations', () => {
        const service = fhirWriteService as any;
        const observation = service.buildObservation(
            {
                calculatorId: 'bmi',
                calculatorTitle: 'BMI Calculator',
                patientId: 'patient-1',
                results: [],
            },
            { label: 'BMI', value: 24.5, unit: 'kg/m2' }
        );

        const confLabel = observation.meta.security.find(
            (s: any) => s.system === 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality'
        );
        expect(confLabel.code).toBe('N');
    });

    test('writeResults sends observations with security labels and completes successfully', async () => {
        const result = await fhirWriteService.writeResults({
            calculatorId: 'ascvd',
            calculatorTitle: 'ASCVD Risk',
            patientId: 'patient-1',
            results: [
                { label: '10-Year Risk', value: 12.5, unit: '%', loincCode: '79423-0' },
            ],
        });

        expect(result.success).toBe(true);
        expect(result.observationIds).toContain('obs-1');

        // Verify the observation passed to client.create has meta.security
        const createdResource = mockCreate.mock.calls[0][0];
        expect(createdResource.meta).toBeDefined();
        expect(createdResource.meta.security).toBeDefined();
        expect(createdResource.meta.security.length).toBeGreaterThan(0);
    });

    test('addSecurityLabel returns a deep clone, not mutating the original', () => {
        const service = fhirWriteService as any;
        const obs1 = service.buildObservation(
            {
                calculatorId: 'test',
                calculatorTitle: 'Test',
                patientId: 'patient-1',
                results: [],
            },
            { label: 'Score', value: 5, unit: 'score' }
        );

        // Build a second one — should be independent
        const obs2 = service.buildObservation(
            {
                calculatorId: 'test2',
                calculatorTitle: 'Test2',
                patientId: 'patient-1',
                results: [],
            },
            { label: 'Score2', value: 10, unit: 'score' }
        );

        // Each should have its own meta.security, not sharing references
        expect(obs1.meta.security).not.toBe(obs2.meta.security);
    });
});
