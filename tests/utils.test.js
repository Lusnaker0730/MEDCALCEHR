/**
 * Unit tests for utils.js
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import {
    calculateAge,
    getMostRecentObservation,
} from '../js/utils.js';

describe('Utils - Age Calculation', () => {
    test('calculateAge should calculate correct age from birth date', () => {
        const birthDate = '1990-01-15';
        const age = calculateAge(birthDate);
        // Age should be around 35 (current year - 1990)
        expect(age).toBeGreaterThanOrEqual(34);
        expect(age).toBeLessThanOrEqual(36);
    });

    test('calculateAge should handle birthday not yet passed this year', () => {
        const birthDate = '1990-12-31';
        const age = calculateAge(birthDate);
        expect(age).toBeGreaterThanOrEqual(33);
        expect(age).toBeLessThanOrEqual(35);
    });

    test('calculateAge should return negative for future dates', () => {
        const birthDate = '2030-01-01';
        const age = calculateAge(birthDate);
        expect(age).toBeLessThan(0);
    });

    test('calculateAge should handle various date formats', () => {
        const birthDate = '2000-06-15';
        const age = calculateAge(birthDate);
        expect(age).toBeGreaterThanOrEqual(24);
        expect(age).toBeLessThanOrEqual(26);
    });
});

describe('Utils - Observation Retrieval', () => {
    let mockClient;

    beforeEach(() => {
        mockClient = {
            patient: {
                request: jest.fn(),
            },
        };
    });

    test('getMostRecentObservation should return observation when found', async () => {
        const mockResponse = {
            entry: [
                {
                    resource: {
                        code: {
                            coding: [{ system: 'http://loinc.org', code: '85354-9' }],
                        },
                        effectiveDateTime: '2025-10-25T10:00:00Z',
                        valueQuantity: { value: 125, unit: 'mmHg' },
                    },
                },
            ],
        };

        mockClient.patient.request.mockResolvedValue(mockResponse);

        const obs = await getMostRecentObservation(mockClient, '85354-9');
        expect(obs).not.toBeNull();
        expect(obs.valueQuantity.value).toBe(125);
        expect(mockClient.patient.request).toHaveBeenCalledWith('Observation?code=85354-9&_sort=-date&_count=1');
    });

    test('getMostRecentObservation should return null if no observations found', async () => {
        const mockResponse = {
            entry: [],
        };

        mockClient.patient.request.mockResolvedValue(mockResponse);

        const obs = await getMostRecentObservation(mockClient, '99999-9');
        expect(obs).toBeNull();
    });

    test('getMostRecentObservation should return null if response has no entry', async () => {
        const mockResponse = {};

        mockClient.patient.request.mockResolvedValue(mockResponse);

        const obs = await getMostRecentObservation(mockClient, '85354-9');
        expect(obs).toBeNull();
    });

    test('getMostRecentObservation should handle errors gracefully', async () => {
        mockClient.patient.request.mockRejectedValue(new Error('Network error'));

        await expect(getMostRecentObservation(mockClient, '85354-9')).rejects.toThrow('Network error');
    });
});
