/**
 * TW Core Profiles Tests
 * Tests for profile URLs, observation profile mapping, and vital sign detection
 */

import { describe, expect, test } from '@jest/globals';
import { TW_CORE_PROFILES } from '../twcore/profiles.js';
import {
    TW_OBSERVATION_PROFILES,
    getTWCoreObservationProfile,
    isVitalSignCode,
    getTWCoreObservationCategory,
} from '../twcore/observation-profiles.js';

const TW_CORE_BASE = 'https://twcore.mohw.gov.tw/ig/twcore/StructureDefinition';

describe('TW Core Profiles', () => {
    describe('TW_CORE_PROFILES URLs', () => {
        test('should have correct base URL for all profiles', () => {
            for (const [key, url] of Object.entries(TW_CORE_PROFILES)) {
                expect(url).toMatch(/^https:\/\/twcore\.mohw\.gov\.tw\/ig\/twcore\/StructureDefinition\//);
            }
        });

        test('should have Patient profile URL', () => {
            expect(TW_CORE_PROFILES.Patient).toBe(`${TW_CORE_BASE}/Patient-twcore`);
        });

        test('should have Condition profile URL', () => {
            expect(TW_CORE_PROFILES.Condition).toBe(`${TW_CORE_BASE}/Condition-twcore`);
        });

        test('should have MedicationRequest profile URL', () => {
            expect(TW_CORE_PROFILES.MedicationRequest).toBe(`${TW_CORE_BASE}/MedicationRequest-twcore`);
        });

        test('should have Provenance profile URL', () => {
            expect(TW_CORE_PROFILES.Provenance).toBe(`${TW_CORE_BASE}/Provenance-twcore`);
        });

        test('should have 20+ Observation profile URLs', () => {
            const obsKeys = Object.keys(TW_CORE_PROFILES).filter(k => k.startsWith('Observation'));
            // Observation (alias) + 19 specific profiles
            expect(obsKeys.length).toBeGreaterThanOrEqual(19);
        });
    });

    describe('TW_OBSERVATION_PROFILES', () => {
        test('should have 19 observation profile entries', () => {
            expect(Object.keys(TW_OBSERVATION_PROFILES)).toHaveLength(19);
        });

        test('should include laboratoryResult profile', () => {
            expect(TW_OBSERVATION_PROFILES.laboratoryResult).toBe(
                `${TW_CORE_BASE}/Observation-laboratoryResult-twcore`
            );
        });

        test('should include vitalSigns profile', () => {
            expect(TW_OBSERVATION_PROFILES.vitalSigns).toBe(
                `${TW_CORE_BASE}/Observation-vitalSigns-twcore`
            );
        });

        test('should include bloodPressure profile', () => {
            expect(TW_OBSERVATION_PROFILES.bloodPressure).toBe(
                `${TW_CORE_BASE}/Observation-bloodPressure-twcore`
            );
        });

        test('should include bmi profile', () => {
            expect(TW_OBSERVATION_PROFILES.bmi).toBe(
                `${TW_CORE_BASE}/Observation-bmi-twcore`
            );
        });
    });

    describe('getTWCoreObservationProfile()', () => {
        // Vital signs with specific profiles
        test.each([
            ['85354-9', TW_OBSERVATION_PROFILES.bloodPressure],
            ['8480-6', TW_OBSERVATION_PROFILES.bloodPressure],
            ['8462-4', TW_OBSERVATION_PROFILES.bloodPressure],
            ['39156-5', TW_OBSERVATION_PROFILES.bmi],
            ['8302-2', TW_OBSERVATION_PROFILES.bodyHeight],
            ['29463-7', TW_OBSERVATION_PROFILES.bodyWeight],
            ['8310-5', TW_OBSERVATION_PROFILES.bodyTemperature],
            ['8331-1', TW_OBSERVATION_PROFILES.bodyTemperature],
            ['9843-4', TW_OBSERVATION_PROFILES.headCircumference],
            ['8867-4', TW_OBSERVATION_PROFILES.heartRate],
            ['59408-5', TW_OBSERVATION_PROFILES.pulseOximetry],
            ['2708-6', TW_OBSERVATION_PROFILES.pulseOximetry],
            ['9279-1', TW_OBSERVATION_PROFILES.respiratoryRate],
            ['59576-9', TW_OBSERVATION_PROFILES.pediatricBMIForAge],
            ['77606-2', TW_OBSERVATION_PROFILES.pediatricWeightForHeight],
        ])('LOINC %s → specific profile', (loincCode, expectedProfile) => {
            expect(getTWCoreObservationProfile(loincCode)).toBe(expectedProfile);
        });

        // Laboratory codes
        test.each([
            '2160-0',  // Creatinine
            '2951-2',  // Sodium
            '2823-3',  // Potassium
            '718-7',   // Hemoglobin
            '4544-3',  // Hematocrit
            '2093-3',  // Total cholesterol
            '4548-4',  // HbA1c
        ])('LOINC %s → laboratoryResult profile', (loincCode) => {
            expect(getTWCoreObservationProfile(loincCode)).toBe(TW_OBSERVATION_PROFILES.laboratoryResult);
        });

        test('should return null for unknown LOINC codes', () => {
            expect(getTWCoreObservationProfile('99999-9')).toBeNull();
        });

        test('should handle comma-separated codes (take first)', () => {
            expect(getTWCoreObservationProfile('85354-9,55284-4')).toBe(TW_OBSERVATION_PROFILES.bloodPressure);
        });
    });

    describe('isVitalSignCode()', () => {
        const vitalSignCodes = [
            '85354-9', '55284-4', '8480-6', '8462-4', '8478-0',
            '39156-5', '8302-2', '29463-7', '8310-5',
            '8331-1', '9843-4', '8867-4', '59408-5',
            '2708-6', '9279-1', '85353-1', '59576-9', '77606-2',
            '8287-5', '8289-1',
        ];

        test.each(vitalSignCodes)('LOINC %s is a vital sign', (code) => {
            expect(isVitalSignCode(code)).toBe(true);
        });

        test('lab codes are not vital signs', () => {
            expect(isVitalSignCode('2160-0')).toBe(false);
            expect(isVitalSignCode('718-7')).toBe(false);
        });

        test('handles comma-separated codes', () => {
            expect(isVitalSignCode('85354-9,55284-4')).toBe(true);
        });
    });

    describe('getTWCoreObservationCategory()', () => {
        test('vital sign codes return vital-signs', () => {
            expect(getTWCoreObservationCategory('8867-4')).toBe('vital-signs');
            expect(getTWCoreObservationCategory('85354-9')).toBe('vital-signs');
        });

        test('lab codes return laboratory', () => {
            expect(getTWCoreObservationCategory('2160-0')).toBe('laboratory');
            expect(getTWCoreObservationCategory('718-7')).toBe('laboratory');
        });

        test('unknown codes return exam', () => {
            expect(getTWCoreObservationCategory('99999-9')).toBe('exam');
        });
    });
});
