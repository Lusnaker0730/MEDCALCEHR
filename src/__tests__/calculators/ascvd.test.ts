import { describe, expect, test } from '@jest/globals';
import { ascvdCalculationPure, PCE_COEFFICIENTS } from '../../calculators/ascvd/calculation.js';
import { ValidationError } from '../../errorHandler.js';

const ascvdCalculation = (input: any) => ascvdCalculationPure(input).results;

describe('ASCVD Risk Calculator', () => {
    // TC-001: Verify PCE Coefficients match 2013 ACC/AHA publication
    test('TC-001: PCE Coefficients match published values', () => {
        // White Male coefficients from Goff et al. Circulation 2014
        expect(PCE_COEFFICIENTS.whiteMale.lnAge).toBeCloseTo(12.344, 3);
        expect(PCE_COEFFICIENTS.whiteMale.lnTC).toBeCloseTo(11.853, 3);
        expect(PCE_COEFFICIENTS.whiteMale.lnAgeLnTC).toBeCloseTo(-2.664, 3);
        expect(PCE_COEFFICIENTS.whiteMale.lnHDL).toBeCloseTo(-7.99, 2);
        expect(PCE_COEFFICIENTS.whiteMale.baselineSurvival).toBeCloseTo(0.9144, 4);

        // White Female coefficients
        expect(PCE_COEFFICIENTS.whiteFemale.lnAge).toBeCloseTo(-29.799, 3);
        expect(PCE_COEFFICIENTS.whiteFemale.baselineSurvival).toBeCloseTo(0.9665, 4);

        // AA Male coefficients
        expect(PCE_COEFFICIENTS.aaMale.lnAge).toBeCloseTo(2.469, 3);
        expect(PCE_COEFFICIENTS.aaMale.baselineSurvival).toBeCloseTo(0.8954, 4);

        // AA Female coefficients
        expect(PCE_COEFFICIENTS.aaFemale.lnAge).toBeCloseTo(17.114, 3);
        expect(PCE_COEFFICIENTS.aaFemale.baselineSurvival).toBeCloseTo(0.9533, 4);
    });

    // TC-002: Standard Calculation - White Male Smoker
    test('TC-002: Calculates Risk for White Male Smoker', () => {
        const input = {
            'ascvd-age': 55,
            'ascvd-gender': 'male',
            'ascvd-race': 'white',
            'ascvd-tc': 213,
            'ascvd-hdl': 50,
            'ascvd-sbp': 120,
            'ascvd-htn': 'no',
            'ascvd-dm': 'no',
            'ascvd-smoker': 'yes'
        };

        const result = ascvdCalculation(input);
        expect(result).toHaveLength(1);
        const risk = parseFloat(result[0].value);
        expect(risk).toBeGreaterThan(5);
        expect(risk).toBeLessThan(15);
        expect(result[0].unit).toBe('%');
    });

    // TC-002b: Standard Calculation - AA Female Diabetic
    test('TC-002b: Calculates Risk for AA Female', () => {
        const input = {
            'ascvd-age': 55,
            'ascvd-gender': 'female',
            'ascvd-race': 'aa',
            'ascvd-tc': 213,
            'ascvd-hdl': 50,
            'ascvd-sbp': 120,
            'ascvd-htn': 'no',
            'ascvd-dm': 'yes',
            'ascvd-smoker': 'no'
        };

        const result = ascvdCalculation(input);
        const risk = parseFloat(result[0].value);
        expect(risk).toBeGreaterThan(0);
    });

    // TC-003: Risk Level Classification
    test('TC-003: Determines High Risk Category', () => {
        const input = {
            'ascvd-age': 70,
            'ascvd-gender': 'male',
            'ascvd-race': 'white',
            'ascvd-tc': 280,
            'ascvd-hdl': 30,
            'ascvd-sbp': 160,
            'ascvd-htn': 'yes',
            'ascvd-dm': 'yes',
            'ascvd-smoker': 'yes'
        };

        const result = ascvdCalculation(input);
        expect(result[0].alertClass).toBe('danger');
        expect(result[0].interpretation).toContain('High Risk');
    });

    // TC-005: Missing Required Data
    test('TC-005: Throws Error for Missing Data', () => {
        const input = {
            'ascvd-age': 55
        };

        expect(() => ascvdCalculation(input)).toThrow(ValidationError);
        expect(() => ascvdCalculation(input)).toThrow('Please complete all fields');
    });

    // TC-004: Boundary - Age Out of Range
    test('TC-004: Throws Error for Out of Range Age', () => {
        const input = {
            'ascvd-age': 30,
            'ascvd-gender': 'male',
            'ascvd-race': 'white',
            'ascvd-tc': 200,
            'ascvd-hdl': 50,
            'ascvd-sbp': 120,
            'ascvd-htn': 'no',
            'ascvd-dm': 'no',
            'ascvd-smoker': 'no'
        };

        expect(() => ascvdCalculation(input)).toThrow('Valid for ages 40-79');
    });

    // TC-006: Known ASCVD Short-Circuit
    test('TC-006: Handles Known ASCVD Immediately', () => {
        const input = {
            'known-ascvd': true,
            'ascvd-age': 55
        };

        const result = ascvdCalculation(input);
        expect(result).toHaveLength(2);
        expect(result[0].value).toBe('High Risk');
    });
});
