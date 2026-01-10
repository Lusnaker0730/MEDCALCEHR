/**
 * FHIR Codes Module Tests
 * Tests for LOINC/SNOMED code utilities
 */
import { describe, expect, test } from '@jest/globals';
import { LOINC_CODES, SNOMED_CODES, RXNORM_CODES, getLoincCode, getSnomedCode, getLoincName, getSnomedName, isValidLoincCode, isValidSnomedCode, getVitalSignsCodes, getMeasurementType } from '../fhir-codes.js';
describe('FHIR Codes Module', () => {
    // =========================================
    // LOINC_CODES Registry Tests
    // =========================================
    describe('LOINC_CODES Registry', () => {
        test('should contain common vital signs codes', () => {
            expect(LOINC_CODES.SYSTOLIC_BP).toContain('8480-6');
            expect(LOINC_CODES.DIASTOLIC_BP).toContain('8462-4');
            expect(LOINC_CODES.HEART_RATE).toContain('8867-4');
            expect(LOINC_CODES.TEMPERATURE).toContain('8310-5');
            expect(LOINC_CODES.RESPIRATORY_RATE).toContain('9279-1');
            expect(LOINC_CODES.OXYGEN_SATURATION).toContain('59408-5');
        });
        test('should contain common lab codes', () => {
            expect(LOINC_CODES.HEMOGLOBIN).toContain('718-7');
            expect(LOINC_CODES.CREATININE).toContain('2160-0');
            expect(LOINC_CODES.SODIUM).toContain('2951-2');
            expect(LOINC_CODES.POTASSIUM).toContain('2823-3');
            expect(LOINC_CODES.GLUCOSE).toContain('2345-7');
        });
        test('should contain anthropometric codes', () => {
            expect(LOINC_CODES.HEIGHT).toBeDefined();
            expect(LOINC_CODES.WEIGHT).toBeDefined();
            expect(LOINC_CODES.BMI).toBeDefined();
        });
    });
    // =========================================
    // SNOMED_CODES Registry Tests
    // =========================================
    describe('SNOMED_CODES Registry', () => {
        test('should contain cardiovascular conditions', () => {
            expect(SNOMED_CODES.HYPERTENSION).toBe('38341003');
            expect(SNOMED_CODES.HEART_FAILURE).toBe('84114007');
            expect(SNOMED_CODES.ATRIAL_FIBRILLATION).toBe('49436004');
        });
        test('should contain metabolic conditions', () => {
            expect(SNOMED_CODES.DIABETES_TYPE_2).toBeDefined();
            expect(SNOMED_CODES.DIABETES_TYPE_1).toBeDefined();
        });
    });
    // =========================================
    // RXNORM_CODES Registry Tests
    // =========================================
    describe('RXNORM_CODES Registry', () => {
        test('should contain common medications', () => {
            expect(RXNORM_CODES.ASPIRIN).toBe('1191');
            expect(RXNORM_CODES.CLOPIDOGREL).toBe('32968');
            expect(RXNORM_CODES.WARFARIN).toBe('11289');
        });
    });
    // =========================================
    // getLoincCode Function Tests
    // =========================================
    describe('getLoincCode', () => {
        test('should return LOINC code for valid name', () => {
            expect(getLoincCode('SYSTOLIC_BP')).toContain('8480-6');
            expect(getLoincCode('HEMOGLOBIN')).toContain('718-7');
        });
        test('should return null for invalid name', () => {
            expect(getLoincCode('INVALID_CODE')).toBeNull();
            expect(getLoincCode('')).toBeNull();
        });
        test('should be case-insensitive', () => {
            expect(getLoincCode('systolic_bp')).toContain('8480-6');
            expect(getLoincCode('Systolic_BP')).toContain('8480-6');
        });
    });
    // =========================================
    // getSnomedCode Function Tests
    // =========================================
    describe('getSnomedCode', () => {
        test('should return SNOMED code for valid name', () => {
            expect(getSnomedCode('HYPERTENSION')).toBe('38341003');
        });
        test('should return null for invalid name', () => {
            expect(getSnomedCode('INVALID_CONDITION')).toBeNull();
        });
    });
    // =========================================
    // getLoincName Function Tests
    // =========================================
    describe('getLoincName', () => {
        test('should return name for valid LOINC code', () => {
            const name = getLoincName('8480-6');
            expect(name).toBe('systolic bp');
        });
        test('should return null for invalid LOINC code', () => {
            expect(getLoincName('0000-0')).toBeNull();
            expect(getLoincName('')).toBeNull();
        });
    });
    // =========================================
    // getSnomedName Function Tests
    // =========================================
    describe('getSnomedName', () => {
        test('should return name for valid SNOMED code', () => {
            const name = getSnomedName('38341003');
            expect(name).toBe('hypertension');
        });
        test('should return null for invalid SNOMED code', () => {
            expect(getSnomedName('0000000')).toBeNull();
        });
    });
    // =========================================
    // isValidLoincCode Function Tests
    // =========================================
    describe('isValidLoincCode', () => {
        test('should return true for valid LOINC format (4-5 digits)', () => {
            expect(isValidLoincCode('8480-6')).toBe(true);
            expect(isValidLoincCode('2160-0')).toBe(true);
            expect(isValidLoincCode('29463-7')).toBe(true); // 5-digit code
        });
        test('should return false for invalid LOINC format', () => {
            expect(isValidLoincCode('invalid')).toBe(false);
            expect(isValidLoincCode('')).toBe(false);
            expect(isValidLoincCode('12345')).toBe(false);
        });
    });
    // =========================================
    // isValidSnomedCode Function Tests
    // =========================================
    describe('isValidSnomedCode', () => {
        test('should return true for valid SNOMED format', () => {
            expect(isValidSnomedCode('38341003')).toBe(true);
            expect(isValidSnomedCode('84114007')).toBe(true);
        });
        test('should return false for invalid SNOMED format', () => {
            expect(isValidSnomedCode('invalid')).toBe(false);
            expect(isValidSnomedCode('')).toBe(false);
        });
    });
    // =========================================
    // getVitalSignsCodes Function Tests
    // =========================================
    describe('getVitalSignsCodes', () => {
        test('should return object with vital signs codes', () => {
            const vitalCodes = getVitalSignsCodes();
            expect(vitalCodes).toHaveProperty('systolicBP');
            expect(vitalCodes).toHaveProperty('diastolicBP');
            expect(vitalCodes).toHaveProperty('heartRate');
            expect(vitalCodes).toHaveProperty('temperature');
        });
    });
    // =========================================
    // getMeasurementType Function Tests
    // =========================================
    describe('getMeasurementType', () => {
        test('should return correct measurement type for LOINC codes', () => {
            expect(getMeasurementType('2160-0')).toBe('creatinine'); // Creatinine
            expect(getMeasurementType('8302-2')).toBe('height'); // Height
            expect(getMeasurementType('29463-7')).toBe('weight'); // Weight
        });
        test('should return default concentration for unknown LOINC codes', () => {
            expect(getMeasurementType('0000-0')).toBe('concentration');
        });
    });
});
