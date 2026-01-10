import { describe, expect, test } from '@jest/globals';
import { ascvdCalculationPure } from '../../calculators/ascvd/calculation.js';
import { ValidationError } from '../../errorHandler.js';

const ascvdCalculation = (input: any) => ascvdCalculationPure(input).results;

describe('ASCVD Risk Calculator', () => {

    // Test Case 1: White Male, High Risk similar to example in 2013 guidelines
    // Age 55, TC 213, HDL 50, SBP 120, No Tx, No DM, Smoker
    test('Calculates Risk for White Male Smoker', () => {
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

        // Expected roughly 9-10%? Let's check the logic validity, not exact medical precision down to decimal
        // unless we have a gold standard. 
        // 2013 guidelines calculator: 
        // ~9.6% (approximate known value for these stats)

        const result = ascvdCalculation(input);
        console.log('White Male Result:', JSON.stringify(result, null, 2));
        expect(result).toHaveLength(1);
        const risk = parseFloat(result[0].value);
        expect(risk).toBeGreaterThan(5);
        expect(risk).toBeLessThan(15);
        expect(result[0].unit).toBe('%');
    });

    test('Calculates Risk for AA Female', () => {
        const input = {
            'ascvd-age': 55,
            'ascvd-gender': 'female',
            'ascvd-race': 'aa', // African American
            'ascvd-tc': 213,
            'ascvd-hdl': 50,
            'ascvd-sbp': 120,
            'ascvd-htn': 'no', // No Tx
            'ascvd-dm': 'yes', // Diabetic
            'ascvd-smoker': 'no'
        };

        const result = ascvdCalculation(input);
        const risk = parseFloat(result[0].value);
        expect(risk).toBeGreaterThan(0);
        // AA female logic is different, ensuring it runs
    });

    test('Determines High Risk Category', () => {
        // Force high risk inputs
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

    test('Throws Error for Missing Data', () => {
        const input = {
            'ascvd-age': 55
            // Missing others
        };

        expect(() => ascvdCalculation(input)).toThrow(ValidationError);
        expect(() => ascvdCalculation(input)).toThrow('Please complete all fields');
    });

    test('Throws Error for Out of Range Age', () => {
        const input = {
            'ascvd-age': 30, // Too young (<40)
            'ascvd-tc': 200,
            'ascvd-hdl': 50,
            'ascvd-sbp': 120
        };

        expect(() => ascvdCalculation(input)).toThrow('Valid for ages 40-79');
    });

    test('Handles Known ASCVD Immediately', () => {
        const input = {
            'known-ascvd': true,
            'ascvd-age': 55 // Even if data is partial, known ASCVD should return immediatenly?
            // Actually the function checks known-ascvd FIRST, before validating required fields.
        };

        const result = ascvdCalculation(input);
        expect(result).toHaveLength(2);
        expect(result[0].value).toBe('High Risk');
    });
});
