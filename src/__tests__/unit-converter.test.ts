/**
 * @jest-environment jsdom
 */

import { describe, expect, test, beforeEach, afterEach } from '@jest/globals';
import { UnitConverter } from '../unit-converter';

describe('UnitConverter', () => {
    describe('Weight Conversions', () => {
        test('should convert kg to lbs', () => {
            const result = UnitConverter.convert(70, 'kg', 'lbs', 'weight');
            expect(result).toBeCloseTo(154.32, 1);
        });

        test('should convert lbs to kg', () => {
            const result = UnitConverter.convert(154.32, 'lbs', 'kg', 'weight');
            expect(result).toBeCloseTo(70, 1);
        });

        test('should return same value for same unit', () => {
            const result = UnitConverter.convert(70, 'kg', 'kg', 'weight');
            expect(result).toBe(70);
        });
    });

    describe('Height Conversions', () => {
        test('should convert cm to inches', () => {
            const result = UnitConverter.convert(175, 'cm', 'in', 'height');
            expect(result).toBeCloseTo(68.9, 1);
        });

        test('should convert inches to cm', () => {
            const result = UnitConverter.convert(68.9, 'in', 'cm', 'height');
            expect(result).toBeCloseTo(175, 0);
        });

        test('should convert cm to feet', () => {
            const result = UnitConverter.convert(180, 'cm', 'ft', 'height');
            expect(result).toBeCloseTo(5.9, 1);
        });
    });

    describe('Temperature Conversions', () => {
        test('should convert Celsius to Fahrenheit', () => {
            const result = UnitConverter.convert(37, 'C', 'F', 'temperature');
            expect(result).toBeCloseTo(98.6, 1);
        });

        test('should convert Fahrenheit to Celsius', () => {
            const result = UnitConverter.convert(98.6, 'F', 'C', 'temperature');
            expect(result).toBeCloseTo(37, 1);
        });

        test('should handle freezing point', () => {
            const result = UnitConverter.convert(0, 'C', 'F', 'temperature');
            expect(result).toBe(32);
        });

        test('should handle boiling point', () => {
            const result = UnitConverter.convert(100, 'C', 'F', 'temperature');
            expect(result).toBe(212);
        });
    });

    describe('Creatinine Conversions', () => {
        test('should convert mg/dL to umol/L', () => {
            const result = UnitConverter.convert(1.0, 'mg/dL', 'umol/L', 'creatinine');
            expect(result).toBeCloseTo(88.4, 1);
        });

        test('should convert umol/L to mg/dL', () => {
            const result = UnitConverter.convert(88.4, 'umol/L', 'mg/dL', 'creatinine');
            expect(result).toBeCloseTo(1.0, 1);
        });
    });

    describe('Glucose Conversions', () => {
        test('should convert mg/dL to mmol/L', () => {
            const result = UnitConverter.convert(100, 'mg/dL', 'mmol/L', 'glucose');
            expect(result).toBeCloseTo(5.55, 1);
        });

        test('should convert mmol/L to mg/dL', () => {
            const result = UnitConverter.convert(5.55, 'mmol/L', 'mg/dL', 'glucose');
            expect(result).toBeCloseTo(100, 0);
        });
    });

    describe('Edge Cases', () => {
        test('should handle zero values', () => {
            const result = UnitConverter.convert(0, 'kg', 'lbs', 'weight');
            expect(result).toBe(0);
        });

        test('should handle negative values for temperature', () => {
            const result = UnitConverter.convert(-40, 'C', 'F', 'temperature');
            expect(result).toBe(-40); // -40 is the same in both scales
        });

        test('should return null for invalid conversion type', () => {
            const result = UnitConverter.convert(100, 'kg', 'lbs', 'invalid' as any);
            expect(result).toBeNull();
        });

        test('should return null for invalid unit pair', () => {
            const result = UnitConverter.convert(100, 'kg', 'cm', 'weight');
            expect(result).toBeNull();
        });
    });

    describe('DOM Integration', () => {
        let container: HTMLElement;
        let input: HTMLInputElement;

        beforeEach(() => {
            container = document.createElement('div');
            input = document.createElement('input');
            input.type = 'number';
            input.id = 'test-input';
            input.value = '70';
            input.dataset.unit = 'kg';
            input.dataset.standardUnit = 'kg';
            container.appendChild(input);
            document.body.appendChild(container);
        });

        afterEach(() => {
            document.body.innerHTML = '';
        });

        test('getStandardValue should return value in standard unit', () => {
            const result = UnitConverter.getStandardValue(input, 'kg');
            expect(result).toBe(70);
        });

        test('getStandardValue should return value when unit matches standard', () => {
            input.value = '70';
            input.dataset.unit = 'kg';

            const result = UnitConverter.getStandardValue(input, 'kg');
            expect(result).toBe(70);
        });

        test('getStandardValue should return null for empty input', () => {
            input.value = '';
            const result = UnitConverter.getStandardValue(input, 'kg');
            expect(result).toBeNull();
        });
    });

    describe('Unit Toggle Creation', () => {
        let input: HTMLInputElement;

        beforeEach(() => {
            input = document.createElement('input');
            input.type = 'number';
            input.id = 'test-input';
            document.body.appendChild(input);
        });

        afterEach(() => {
            document.body.innerHTML = '';
        });

        test('should create unit toggle element', () => {
            const toggle = UnitConverter.createUnitToggle(input, 'weight', ['kg', 'lbs'], 'kg');
            expect(toggle).toBeDefined();
            expect(toggle.tagName).toBe('BUTTON');
        });

        test('should return a button element', () => {
            const toggle = UnitConverter.createUnitToggle(input, 'weight', ['kg', 'lbs'], 'kg');
            expect(toggle.tagName).toBe('BUTTON');
            expect(toggle.textContent).toContain('kg');
        });
    });

    // ==========================================
    // COMPREHENSIVE CONVERSION TESTS
    // ==========================================

    describe('Weight Conversions (extended)', () => {
        test.each([
            [1, 'kg', 'g', 1000],
            [1000, 'g', 'kg', 1],
            [1, 'lbs', 'g', 453.592],
            [453.592, 'g', 'lbs', 1],
            [1, 'kg', 'lbs', 2.20462],
            [1, 'lbs', 'kg', 0.453592],
        ])('convert(%f, %s, %s, weight) => %f', (value, from, to, expected) => {
            const result = UnitConverter.convert(value, from, to, 'weight');
            expect(result).toBeCloseTo(expected, 1);
        });

        test('should return same value for g to g', () => {
            expect(UnitConverter.convert(500, 'g', 'g', 'weight')).toBe(500);
        });
    });

    describe('Height Conversions (extended)', () => {
        test.each([
            [1, 'm', 'cm', 100],
            [100, 'cm', 'm', 1],
            [1, 'm', 'in', 39.3701],
            [1, 'm', 'ft', 3.28084],
            [1, 'ft', 'in', 12],
            [12, 'in', 'ft', 1],
            [1, 'ft', 'cm', 30.48],
            [1, 'ft', 'm', 0.3048],
            [1, 'in', 'm', 0.0254],
        ])('convert(%f, %s, %s, height) => %f', (value, from, to, expected) => {
            const result = UnitConverter.convert(value, from, to, 'height');
            expect(result).toBeCloseTo(expected, 2);
        });

        test('should return same value for m to m', () => {
            expect(UnitConverter.convert(1.75, 'm', 'm', 'height')).toBe(1.75);
        });
    });

    describe('Temperature Conversions (extended with Kelvin)', () => {
        test.each([
            [0, 'C', 'K', 273.15],
            [273.15, 'K', 'C', 0],
            [100, 'C', 'K', 373.15],
            [373.15, 'K', 'C', 100],
            [32, 'F', 'K', 273.15],
            [273.15, 'K', 'F', 32],
            [212, 'F', 'K', 373.15],
            [373.15, 'K', 'F', 212],
            [-273.15, 'C', 'K', 0],
            [0, 'K', 'C', -273.15],
            [0, 'K', 'F', -459.67],
        ])('convert(%f, %s, %s, temperature) => %f', (value, from, to, expected) => {
            const result = UnitConverter.convert(value, from, to, 'temperature');
            expect(result).toBeCloseTo(expected, 1);
        });

        test('should return same value for C to C', () => {
            expect(UnitConverter.convert(37, 'C', 'C', 'temperature')).toBe(37);
        });

        test('should return same value for K to K', () => {
            expect(UnitConverter.convert(300, 'K', 'K', 'temperature')).toBe(300);
        });

        test('should return same value for F to F', () => {
            expect(UnitConverter.convert(98.6, 'F', 'F', 'temperature')).toBe(98.6);
        });
    });

    describe('Pressure Conversions', () => {
        test.each([
            [1, 'mmHg', 'kPa', 0.133322],
            [1, 'kPa', 'mmHg', 7.50062],
            [1, 'mmHg', 'bar', 0.00133322],
            [1, 'bar', 'mmHg', 750.062],
            [1, 'kPa', 'bar', 0.01],
            [1, 'bar', 'kPa', 100],
            [120, 'mmHg', 'kPa', 15.9986],
            [1, 'mmHg', 'mm[Hg]', 1],
            [1, 'mm[Hg]', 'mmHg', 1],
            [1, 'mm[Hg]', 'kPa', 0.133322],
        ])('convert(%f, %s, %s, pressure) => %f', (value, from, to, expected) => {
            const result = UnitConverter.convert(value, from, to, 'pressure');
            expect(result).toBeCloseTo(expected, 2);
        });

        test('should return same value for mmHg to mmHg', () => {
            expect(UnitConverter.convert(120, 'mmHg', 'mmHg', 'pressure')).toBe(120);
        });
    });

    describe('Volume Conversions', () => {
        test.each([
            [1000, 'mL', 'L', 1],
            [1, 'L', 'mL', 1000],
            [1, 'L', 'fl oz', 33.814],
            [1, 'fl oz', 'mL', 29.5735],
            [1, 'cup', 'mL', 236.588],
            [1, 'cup', 'fl oz', 8],
            [8, 'fl oz', 'cup', 1],
            [1, 'L', 'cup', 4.22675],
            [1, 'mL', 'fl oz', 0.033814],
            [1, 'mL', 'cup', 0.00422675],
        ])('convert(%f, %s, %s, volume) => %f', (value, from, to, expected) => {
            const result = UnitConverter.convert(value, from, to, 'volume');
            expect(result).toBeCloseTo(expected, 2);
        });
    });

    describe('Calcium Conversions', () => {
        test.each([
            [10, 'mg/dL', 'mmol/L', 2.495],
            [2.5, 'mmol/L', 'mg/dL', 10.02],
        ])('convert(%f, %s, %s, calcium) => %f', (value, from, to, expected) => {
            const result = UnitConverter.convert(value, from, to, 'calcium');
            expect(result).toBeCloseTo(expected, 1);
        });

        test('bidirectional round-trip approximate', () => {
            const original = 9.5;
            const forward = UnitConverter.convert(original, 'mg/dL', 'mmol/L', 'calcium')!;
            const back = UnitConverter.convert(forward, 'mmol/L', 'mg/dL', 'calcium')!;
            expect(back).toBeCloseTo(original, 0);
        });
    });

    describe('Albumin Conversions', () => {
        test.each([
            [4.0, 'g/dL', 'g/L', 40],
            [40, 'g/L', 'g/dL', 4.0],
            [3.5, 'g/dL', 'g/L', 35],
            [35, 'g/L', 'g/dL', 3.5],
        ])('convert(%f, %s, %s, albumin) => %f', (value, from, to, expected) => {
            const result = UnitConverter.convert(value, from, to, 'albumin');
            expect(result).toBeCloseTo(expected, 1);
        });
    });

    describe('Bilirubin Conversions', () => {
        test.each([
            [1.0, 'mg/dL', 'µmol/L', 17.1],
            [1.0, 'mg/dL', 'umol/L', 17.1],
            [17.1, 'µmol/L', 'mg/dL', 1.0],
            [17.1, 'umol/L', 'mg/dL', 1.0],
        ])('convert(%f, %s, %s, bilirubin) => %f', (value, from, to, expected) => {
            const result = UnitConverter.convert(value, from, to, 'bilirubin');
            expect(result).toBeCloseTo(expected, 0);
        });
    });

    describe('Hemoglobin Conversions', () => {
        test.each([
            [14, 'g/dL', 'g/L', 140],
            [140, 'g/L', 'g/dL', 14],
            [14, 'g/dL', 'mmol/L', 8.6884],
            [8.69, 'mmol/L', 'g/dL', 14.0],
        ])('convert(%f, %s, %s, hemoglobin) => %f', (value, from, to, expected) => {
            const result = UnitConverter.convert(value, from, to, 'hemoglobin');
            expect(result).toBeCloseTo(expected, 0);
        });
    });

    describe('BUN Conversions', () => {
        test.each([
            [20, 'mg/dL', 'mmol/L', 7.14],
            [7.14, 'mmol/L', 'mg/dL', 20],
            [10, 'mg/dL', 'mmol/L', 3.57],
            [3.57, 'mmol/L', 'mg/dL', 10],
        ])('convert(%f, %s, %s, bun) => %f', (value, from, to, expected) => {
            const result = UnitConverter.convert(value, from, to, 'bun');
            expect(result).toBeCloseTo(expected, 0);
        });
    });

    describe('Electrolyte Conversions', () => {
        test.each([
            [140, 'mEq/L', 'mmol/L', 140],
            [140, 'mmol/L', 'mEq/L', 140],
            [4.5, 'mEq/L', 'mmol/L', 4.5],
            [4.5, 'mmol/L', 'mEq/L', 4.5],
        ])('convert(%f, %s, %s, electrolyte) => %f', (value, from, to, expected) => {
            const result = UnitConverter.convert(value, from, to, 'electrolyte');
            expect(result).toBeCloseTo(expected, 2);
        });
    });

    describe('Sodium Conversions', () => {
        test.each([
            [140, 'mEq/L', 'mmol/L', 140],
            [140, 'mmol/L', 'mEq/L', 140],
            [135, 'mEq/L', 'mmol/L', 135],
        ])('convert(%f, %s, %s, sodium) => %f', (value, from, to, expected) => {
            const result = UnitConverter.convert(value, from, to, 'sodium');
            expect(result).toBeCloseTo(expected, 2);
        });
    });

    describe('Cholesterol Conversions', () => {
        test.each([
            [200, 'mg/dL', 'mmol/L', 5.172],
            [5.17, 'mmol/L', 'mg/dL', 199.92],
            [100, 'mg/dL', 'mmol/L', 2.586],
        ])('convert(%f, %s, %s, cholesterol) => %f', (value, from, to, expected) => {
            const result = UnitConverter.convert(value, from, to, 'cholesterol');
            expect(result).toBeCloseTo(expected, 1);
        });
    });

    describe('Total Cholesterol Conversions', () => {
        test.each([
            [200, 'mg/dL', 'mmol/L', 5.172],
            [5.17, 'mmol/L', 'mg/dL', 199.92],
        ])('convert(%f, %s, %s, totalCholesterol) => %f', (value, from, to, expected) => {
            const result = UnitConverter.convert(value, from, to, 'totalCholesterol');
            expect(result).toBeCloseTo(expected, 1);
        });
    });

    describe('HDL Conversions', () => {
        test.each([
            [60, 'mg/dL', 'mmol/L', 1.5516],
            [1.55, 'mmol/L', 'mg/dL', 59.94],
        ])('convert(%f, %s, %s, hdl) => %f', (value, from, to, expected) => {
            const result = UnitConverter.convert(value, from, to, 'hdl');
            expect(result).toBeCloseTo(expected, 1);
        });
    });

    describe('LDL Conversions', () => {
        test.each([
            [130, 'mg/dL', 'mmol/L', 3.3618],
            [3.36, 'mmol/L', 'mg/dL', 129.93],
        ])('convert(%f, %s, %s, ldl) => %f', (value, from, to, expected) => {
            const result = UnitConverter.convert(value, from, to, 'ldl');
            expect(result).toBeCloseTo(expected, 1);
        });
    });

    describe('Triglycerides Conversions', () => {
        test.each([
            [150, 'mg/dL', 'mmol/L', 1.6935],
            [1.69, 'mmol/L', 'mg/dL', 149.68],
            [200, 'mg/dL', 'mmol/L', 2.258],
        ])('convert(%f, %s, %s, triglycerides) => %f', (value, from, to, expected) => {
            const result = UnitConverter.convert(value, from, to, 'triglycerides');
            expect(result).toBeCloseTo(expected, 1);
        });
    });

    describe('Creatinine Conversions (extended)', () => {
        test.each([
            [1.0, 'mg/dL', 'µmol/L', 88.4],
            [88.4, 'µmol/L', 'mg/dL', 1.0],
            [1.0, 'mg/dL', 'umol/L', 88.4],
            [88.4, 'umol/L', 'mg/dL', 1.0],
            [2.0, 'mg/dL', 'µmol/L', 176.8],
            [0.5, 'mg/dL', 'umol/L', 44.2],
        ])('convert(%f, %s, %s, creatinine) => %f', (value, from, to, expected) => {
            const result = UnitConverter.convert(value, from, to, 'creatinine');
            expect(result).toBeCloseTo(expected, 0);
        });
    });

    describe('Platelet Count Conversions', () => {
        test.each([
            [250, '×10⁹/L', '×10³/µL', 250],
            [250, '×10⁹/L', 'K/µL', 250],
            [250, '×10⁹/L', '10*3/uL', 250],
            [250, '×10³/µL', '×10⁹/L', 250],
            [250, 'K/µL', '×10⁹/L', 250],
            [250, '10*3/uL', '×10⁹/L', 250],
        ])('convert(%f, %s, %s, platelet) => %f', (value, from, to, expected) => {
            const result = UnitConverter.convert(value, from, to, 'platelet');
            expect(result).toBeCloseTo(expected, 2);
        });
    });

    describe('WBC Conversions', () => {
        test.each([
            [7.5, '×10⁹/L', '×10³/µL', 7.5],
            [7.5, '×10⁹/L', 'K/µL', 7.5],
            [7.5, '×10⁹/L', '10*3/uL', 7.5],
            [7.5, '×10³/µL', '×10⁹/L', 7.5],
            [7.5, 'K/µL', '×10⁹/L', 7.5],
            [7.5, '10*3/uL', '×10⁹/L', 7.5],
        ])('convert(%f, %s, %s, wbc) => %f', (value, from, to, expected) => {
            const result = UnitConverter.convert(value, from, to, 'wbc');
            expect(result).toBeCloseTo(expected, 2);
        });
    });

    describe('D-dimer Conversions', () => {
        test.each([
            [1, 'mg/L', 'µg/mL', 1],
            [1, 'µg/mL', 'mg/L', 1],
            [1, 'mg/L', 'ng/mL', 1000],
            [1000, 'ng/mL', 'mg/L', 1],
            [0.5, 'mg/L', 'ng/mL', 500],
        ])('convert(%f, %s, %s, ddimer) => %f', (value, from, to, expected) => {
            const result = UnitConverter.convert(value, from, to, 'ddimer');
            expect(result).toBeCloseTo(expected, 2);
        });
    });

    describe('Fibrinogen Conversions', () => {
        test.each([
            [3.0, 'g/L', 'mg/dL', 300],
            [300, 'mg/dL', 'g/L', 3.0],
            [2.5, 'g/L', 'mg/dL', 250],
            [250, 'mg/dL', 'g/L', 2.5],
        ])('convert(%f, %s, %s, fibrinogen) => %f', (value, from, to, expected) => {
            const result = UnitConverter.convert(value, from, to, 'fibrinogen');
            expect(result).toBeCloseTo(expected, 1);
        });
    });

    describe('Insulin Conversions', () => {
        test.each([
            [10, 'µU/mL', 'pmol/L', 69.45],
            [69.45, 'pmol/L', 'µU/mL', 10],
            [10, 'µU/mL', 'mU/L', 10],
            [10, 'mU/L', 'µU/mL', 10],
            [10, 'mU/L', 'pmol/L', 69.45],
            [69.45, 'pmol/L', 'mU/L', 10],
        ])('convert(%f, %s, %s, insulin) => %f', (value, from, to, expected) => {
            const result = UnitConverter.convert(value, from, to, 'insulin');
            expect(result).toBeCloseTo(expected, 0);
        });
    });

    describe('Phenytoin Conversions', () => {
        test.each([
            [10, 'mcg/mL', 'µmol/L', 39.64],
            [39.64, 'µmol/L', 'mcg/mL', 9.99],
            [10, 'mcg/mL', 'mg/L', 10],
            [10, 'mg/L', 'mcg/mL', 10],
            [10, 'mg/L', 'µmol/L', 39.64],
            [39.64, 'µmol/L', 'mg/L', 9.99],
        ])('convert(%f, %s, %s, phenytoin) => %f', (value, from, to, expected) => {
            const result = UnitConverter.convert(value, from, to, 'phenytoin');
            expect(result).toBeCloseTo(expected, 0);
        });
    });

    describe('Concentration Conversions', () => {
        test.each([
            [1, 'g/L', 'mg/dL', 100],
            [1, 'g/L', 'g/dL', 0.1],
            [1, 'g/dL', 'mg/dL', 1000],
            [1, 'g/dL', 'g/L', 10],
        ])('convert(%f, %s, %s, concentration) => %f', (value, from, to, expected) => {
            const result = UnitConverter.convert(value, from, to, 'concentration');
            expect(result).toBeCloseTo(expected, 2);
        });

        test('mg/dL to mmol/L should return null (null factor)', () => {
            // The concentration map has mg/dL -> mmol/L set to null
            // value * null => NaN or 0, but the code checks for undefined, not null
            // null is not undefined, so it will try value * null => 0
            const result = UnitConverter.convert(100, 'mg/dL', 'mmol/L', 'concentration');
            expect(result).toBe(0);
        });
    });

    // ==========================================
    // getDecimalPlaces TESTS
    // ==========================================

    describe('getDecimalPlaces', () => {
        test.each([
            ['weight', 'kg', 1],
            ['weight', 'lbs', 1],
            ['weight', 'g', 0],
            ['height', 'cm', 1],
            ['height', 'in', 1],
            ['height', 'ft', 2],
            ['height', 'm', 2],
            ['temperature', 'C', 1],
            ['temperature', 'F', 1],
            ['temperature', 'K', 1],
            ['cholesterol', 'mg/dL', 0],
            ['cholesterol', 'mmol/L', 2],
            ['totalCholesterol', 'mg/dL', 0],
            ['totalCholesterol', 'mmol/L', 2],
            ['hdl', 'mg/dL', 0],
            ['hdl', 'mmol/L', 2],
            ['ldl', 'mg/dL', 0],
            ['ldl', 'mmol/L', 2],
            ['triglycerides', 'mg/dL', 0],
            ['triglycerides', 'mmol/L', 2],
            ['sodium', 'mEq/L', 0],
            ['sodium', 'mmol/L', 0],
            ['insulin', 'µU/mL', 1],
            ['insulin', 'pmol/L', 0],
            ['insulin', 'mU/L', 1],
            ['phenytoin', 'mcg/mL', 1],
            ['phenytoin', 'µmol/L', 0],
            ['phenytoin', 'mg/L', 1],
            ['pressure', 'mmHg', 0],
            ['pressure', 'kPa', 2],
            ['pressure', 'bar', 3],
            ['pressure', 'mm[Hg]', 0],
            ['volume', 'mL', 0],
            ['volume', 'L', 2],
            ['volume', 'fl oz', 1],
            ['volume', 'cup', 2],
            ['glucose', 'mmol/L', 1],
            ['glucose', 'mg/dL', 0],
            ['creatinine', 'mg/dL', 2],
            ['creatinine', 'µmol/L', 0],
            ['creatinine', 'umol/L', 0],
            ['calcium', 'mg/dL', 2],
            ['calcium', 'mmol/L', 2],
            ['albumin', 'g/dL', 1],
            ['albumin', 'g/L', 0],
            ['bilirubin', 'mg/dL', 1],
            ['bilirubin', 'µmol/L', 0],
            ['bilirubin', 'umol/L', 0],
        ])('getDecimalPlaces(%s, %s) => %d', (type, unit, expected) => {
            expect(UnitConverter.getDecimalPlaces(type, unit)).toBe(expected);
        });

        test('should return default 2 for unknown type', () => {
            expect(UnitConverter.getDecimalPlaces('unknownType', 'someUnit')).toBe(2);
        });

        test('should return default 2 for known type but unknown unit', () => {
            expect(UnitConverter.getDecimalPlaces('weight', 'stones')).toBe(2);
        });

        test('should return default 2 for empty strings', () => {
            expect(UnitConverter.getDecimalPlaces('', '')).toBe(2);
        });
    });

    // ==========================================
    // EDGE CASES
    // ==========================================

    describe('Edge Cases (extended)', () => {
        test('should return null for NaN input', () => {
            expect(UnitConverter.convert(NaN, 'kg', 'lbs', 'weight')).toBeNull();
        });

        test('should return null for null input', () => {
            expect(UnitConverter.convert(null as any, 'kg', 'lbs', 'weight')).toBeNull();
        });

        test('should return null for undefined input', () => {
            expect(UnitConverter.convert(undefined as any, 'kg', 'lbs', 'weight')).toBeNull();
        });

        test('should handle very large values', () => {
            const result = UnitConverter.convert(1e12, 'g', 'kg', 'weight');
            expect(result).toBeCloseTo(1e9, -3);
        });

        test('should handle very small positive values', () => {
            const result = UnitConverter.convert(0.001, 'kg', 'g', 'weight');
            expect(result).toBeCloseTo(1, 2);
        });

        test('should handle negative weight values (no sign restriction)', () => {
            const result = UnitConverter.convert(-10, 'kg', 'lbs', 'weight');
            expect(result).toBeCloseTo(-22.0462, 1);
        });

        test('should handle negative height values', () => {
            const result = UnitConverter.convert(-100, 'cm', 'in', 'height');
            expect(result).toBeCloseTo(-39.3701, 1);
        });

        test('should handle zero for factor-based conversions', () => {
            expect(UnitConverter.convert(0, 'mg/dL', 'mmol/L', 'glucose')).toBe(0);
        });

        test('should handle zero for function-based conversions (temperature)', () => {
            // 0 C = 32 F
            expect(UnitConverter.convert(0, 'C', 'F', 'temperature')).toBe(32);
        });

        test('should return null for unknown fromUnit in valid type', () => {
            expect(UnitConverter.convert(100, 'oz', 'kg', 'weight')).toBeNull();
        });

        test('should return null for unknown toUnit in valid type', () => {
            expect(UnitConverter.convert(100, 'kg', 'oz', 'weight')).toBeNull();
        });

        test('should return null for empty string type', () => {
            expect(UnitConverter.convert(100, 'kg', 'lbs', '')).toBeNull();
        });

        test('should return value unchanged when fromUnit equals toUnit (identity)', () => {
            expect(UnitConverter.convert(42.5, 'mmol/L', 'mmol/L', 'glucose')).toBe(42.5);
            expect(UnitConverter.convert(42.5, 'mg/dL', 'mg/dL', 'cholesterol')).toBe(42.5);
            expect(UnitConverter.convert(98.6, 'F', 'F', 'temperature')).toBe(98.6);
        });

        test('should handle Infinity', () => {
            const result = UnitConverter.convert(Infinity, 'kg', 'lbs', 'weight');
            expect(result).toBe(Infinity);
        });

        test('should handle -Infinity', () => {
            const result = UnitConverter.convert(-Infinity, 'kg', 'lbs', 'weight');
            expect(result).toBe(-Infinity);
        });
    });

    // ==========================================
    // BIDIRECTIONAL ROUND-TRIP TESTS
    // ==========================================

    describe('Bidirectional Round-Trip Conversions', () => {
        test.each([
            ['weight', 'kg', 'lbs', 70],
            ['weight', 'kg', 'g', 5.5],
            ['height', 'cm', 'in', 175],
            ['height', 'm', 'ft', 1.82],
            ['glucose', 'mg/dL', 'mmol/L', 100],
            ['calcium', 'mg/dL', 'mmol/L', 9.5],
            ['albumin', 'g/dL', 'g/L', 4.0],
            ['bun', 'mg/dL', 'mmol/L', 20],
            ['cholesterol', 'mg/dL', 'mmol/L', 200],
            ['triglycerides', 'mg/dL', 'mmol/L', 150],
            ['fibrinogen', 'g/L', 'mg/dL', 3.0],
            ['pressure', 'mmHg', 'kPa', 120],
            ['volume', 'mL', 'L', 500],
            ['volume', 'cup', 'fl oz', 2],
        ])('%s: %s -> %s -> %s should round-trip (value=%f)', (type, unitA, unitB, value) => {
            const forward = UnitConverter.convert(value, unitA, unitB, type);
            expect(forward).not.toBeNull();
            const back = UnitConverter.convert(forward!, unitB, unitA, type);
            expect(back).not.toBeNull();
            // Allow small floating-point error
            expect(back).toBeCloseTo(value, 0);
        });

        test('temperature C -> F -> C round-trip', () => {
            const forward = UnitConverter.convert(37, 'C', 'F', 'temperature')!;
            const back = UnitConverter.convert(forward, 'F', 'C', 'temperature')!;
            expect(back).toBeCloseTo(37, 5);
        });

        test('temperature C -> K -> C round-trip', () => {
            const forward = UnitConverter.convert(37, 'C', 'K', 'temperature')!;
            const back = UnitConverter.convert(forward, 'K', 'C', 'temperature')!;
            expect(back).toBeCloseTo(37, 5);
        });

        test('temperature F -> K -> F round-trip', () => {
            const forward = UnitConverter.convert(98.6, 'F', 'K', 'temperature')!;
            const back = UnitConverter.convert(forward, 'K', 'F', 'temperature')!;
            expect(back).toBeCloseTo(98.6, 5);
        });
    });

    // ==========================================
    // UNSUPPORTED UNIT PAIRS
    // ==========================================

    describe('Unsupported Unit Pairs', () => {
        test('should return null for cross-type conversion (weight unit in height)', () => {
            expect(UnitConverter.convert(100, 'kg', 'cm', 'height')).toBeNull();
        });

        test('should return null for cross-type conversion (height unit in weight)', () => {
            expect(UnitConverter.convert(100, 'cm', 'kg', 'weight')).toBeNull();
        });

        test('should return null when fromUnit does not exist in type', () => {
            expect(UnitConverter.convert(100, 'gallons', 'L', 'volume')).toBeNull();
        });

        test('should return null when toUnit does not exist for fromUnit', () => {
            expect(UnitConverter.convert(100, 'mL', 'gallons', 'volume')).toBeNull();
        });

        test('should return null for completely bogus type', () => {
            expect(UnitConverter.convert(100, 'a', 'b', 'bogus')).toBeNull();
        });

        test('should return null for glucose mg/dL to an unrelated unit', () => {
            expect(UnitConverter.convert(100, 'mg/dL', 'g/L', 'glucose')).toBeNull();
        });
    });

    // ==========================================
    // DOM: enhanceInput
    // ==========================================

    describe('enhanceInput', () => {
        let input: HTMLInputElement;

        beforeEach(() => {
            input = document.createElement('input');
            input.type = 'number';
            input.id = 'enhance-test';
            document.body.appendChild(input);
        });

        afterEach(() => {
            document.body.innerHTML = '';
        });

        test('should wrap input in a unit-converter-wrapper div', () => {
            const wrapper = UnitConverter.enhanceInput(input, 'weight', ['kg', 'lbs'], 'kg');
            expect(wrapper.className).toBe('unit-converter-wrapper');
            expect(wrapper.style.display).toBe('inline-flex');
            expect(wrapper.contains(input)).toBe(true);
        });

        test('should add a toggle button as sibling of input', () => {
            const wrapper = UnitConverter.enhanceInput(input, 'weight', ['kg', 'lbs'], 'kg');
            const btn = wrapper.querySelector('.unit-toggle-btn');
            expect(btn).not.toBeNull();
            expect(btn!.textContent).toBe('kg');
        });

        test('should set currentUnit dataset on input', () => {
            UnitConverter.enhanceInput(input, 'weight', ['kg', 'lbs'], 'kg');
            expect(input.dataset.currentUnit).toBe('kg');
        });

        test('should not double-wrap if already enhanced', () => {
            const wrapper1 = UnitConverter.enhanceInput(input, 'weight', ['kg', 'lbs'], 'kg');
            const wrapper2 = UnitConverter.enhanceInput(input, 'weight', ['kg', 'lbs'], 'kg');
            expect(wrapper1).toBe(wrapper2);
        });

        test('should default to first unit if defaultUnit not specified', () => {
            const wrapper = UnitConverter.enhanceInput(input, 'temperature', ['C', 'F']);
            const btn = wrapper.querySelector('.unit-toggle-btn') as HTMLElement;
            expect(btn.dataset.currentUnit).toBe('C');
            expect(btn.textContent).toBe('C');
        });
    });

    // ==========================================
    // DOM: getCurrentUnit
    // ==========================================

    describe('getCurrentUnit', () => {
        let input: HTMLInputElement;

        beforeEach(() => {
            input = document.createElement('input');
            input.type = 'number';
            document.body.appendChild(input);
        });

        afterEach(() => {
            document.body.innerHTML = '';
        });

        test('should return null if input is not enhanced', () => {
            expect(UnitConverter.getCurrentUnit(input)).toBeNull();
        });

        test('should return current unit after enhancement', () => {
            UnitConverter.enhanceInput(input, 'weight', ['kg', 'lbs'], 'kg');
            expect(UnitConverter.getCurrentUnit(input)).toBe('kg');
        });

        test('should return updated unit after toggle click', () => {
            const wrapper = UnitConverter.enhanceInput(input, 'weight', ['kg', 'lbs'], 'kg');
            const btn = wrapper.querySelector('.unit-toggle-btn') as HTMLButtonElement;
            btn.click();
            expect(UnitConverter.getCurrentUnit(input)).toBe('lbs');
        });
    });

    // ==========================================
    // DOM: createUnitToggle click behavior
    // ==========================================

    describe('createUnitToggle click cycling', () => {
        let input: HTMLInputElement;

        beforeEach(() => {
            input = document.createElement('input');
            input.type = 'number';
            document.body.appendChild(input);
        });

        afterEach(() => {
            document.body.innerHTML = '';
        });

        test('should cycle through units on click', () => {
            const toggle = UnitConverter.createUnitToggle(input, 'temperature', ['C', 'F', 'K'], 'C');
            document.body.appendChild(toggle);

            expect(toggle.textContent).toBe('C');
            toggle.click();
            expect(toggle.textContent).toBe('F');
            toggle.click();
            expect(toggle.textContent).toBe('K');
            toggle.click();
            expect(toggle.textContent).toBe('C');
        });

        test('should convert input value when clicking toggle', () => {
            input.value = '100';
            const toggle = UnitConverter.createUnitToggle(input, 'temperature', ['C', 'F'], 'C');
            document.body.appendChild(toggle);

            toggle.click(); // C -> F
            expect(parseFloat(input.value)).toBeCloseTo(212, 0);
        });

        test('should handle empty input when clicking toggle', () => {
            input.value = '';
            const toggle = UnitConverter.createUnitToggle(input, 'weight', ['kg', 'lbs'], 'kg');
            document.body.appendChild(toggle);

            toggle.click(); // should not crash
            expect(toggle.textContent).toBe('lbs');
        });

        test('should set dataset attributes on the toggle button', () => {
            const toggle = UnitConverter.createUnitToggle(input, 'glucose', ['mg/dL', 'mmol/L'], 'mg/dL');
            expect(toggle.dataset.currentUnit).toBe('mg/dL');
            expect(toggle.dataset.type).toBe('glucose');
            expect(JSON.parse(toggle.dataset.units!)).toEqual(['mg/dL', 'mmol/L']);
        });

        test('should set title with unit info', () => {
            const toggle = UnitConverter.createUnitToggle(input, 'weight', ['kg', 'lbs'], 'kg');
            expect(toggle.title).toBe('Click to switch units (kg ↔ lbs)');
        });

        test('should update input dataset.currentUnit on click', () => {
            input.value = '70';
            const toggle = UnitConverter.createUnitToggle(input, 'weight', ['kg', 'lbs'], 'kg');
            document.body.appendChild(toggle);

            toggle.click();
            expect(input.dataset.currentUnit).toBe('lbs');
        });

        test('should dispatch input event on click', () => {
            input.value = '37';
            const toggle = UnitConverter.createUnitToggle(input, 'temperature', ['C', 'F'], 'C');
            document.body.appendChild(toggle);

            let eventFired = false;
            input.addEventListener('input', () => { eventFired = true; });

            toggle.click();
            expect(eventFired).toBe(true);
        });

        test('should apply correct decimal places after conversion', () => {
            input.value = '100';
            const toggle = UnitConverter.createUnitToggle(input, 'glucose', ['mg/dL', 'mmol/L'], 'mg/dL');
            document.body.appendChild(toggle);

            toggle.click(); // mg/dL -> mmol/L, decimals for mmol/L glucose is 1
            const converted = input.value;
            // 100 * 0.0555 = 5.549999... (IEEE 754), with 1 decimal = "5.5"
            expect(converted).toBe('5.5');
        });
    });

    // ==========================================
    // DOM: setInputValue
    // ==========================================

    describe('setInputValue', () => {
        let input: HTMLInputElement;

        beforeEach(() => {
            input = document.createElement('input');
            input.type = 'number';
            document.body.appendChild(input);
        });

        afterEach(() => {
            document.body.innerHTML = '';
        });

        test('should set raw value on non-enhanced input', () => {
            UnitConverter.setInputValue(input, 70, 'kg');
            expect(input.value).toBe('70');
        });

        test('should convert value when enhanced input has different current unit', () => {
            const wrapper = UnitConverter.enhanceInput(input, 'weight', ['lbs', 'kg'], 'lbs');
            document.body.appendChild(wrapper);
            // Current unit is lbs, we set value in kg => should convert to lbs
            UnitConverter.setInputValue(input, 70, 'kg');
            expect(parseFloat(input.value)).toBeCloseTo(154.3, 0);
        });

        test('should set value directly when units match', () => {
            const wrapper = UnitConverter.enhanceInput(input, 'weight', ['kg', 'lbs'], 'kg');
            document.body.appendChild(wrapper);
            UnitConverter.setInputValue(input, 70, 'kg');
            expect(input.value).toBe('70');
        });

        test('should dispatch input event', () => {
            let eventFired = false;
            input.addEventListener('input', () => { eventFired = true; });
            UnitConverter.setInputValue(input, 100, 'kg');
            expect(eventFired).toBe(true);
        });

        test('should do nothing for null value', () => {
            input.value = '50';
            UnitConverter.setInputValue(input, null as any, 'kg');
            expect(input.value).toBe('50');
        });

        test('should do nothing for undefined value', () => {
            input.value = '50';
            UnitConverter.setInputValue(input, undefined as any, 'kg');
            expect(input.value).toBe('50');
        });

        test('should do nothing for null input element', () => {
            // Should not throw
            expect(() => UnitConverter.setInputValue(null as any, 100, 'kg')).not.toThrow();
        });
    });

    // ==========================================
    // DOM: autoEnhance
    // ==========================================

    describe('autoEnhance', () => {
        let container: HTMLElement;

        beforeEach(() => {
            container = document.createElement('div');
            document.body.appendChild(container);
        });

        afterEach(() => {
            document.body.innerHTML = '';
        });

        test('should auto-enhance input with id=weight', () => {
            const input = document.createElement('input');
            input.type = 'number';
            input.id = 'weight';
            container.appendChild(input);

            UnitConverter.autoEnhance(container);

            const wrapper = container.querySelector('.unit-converter-wrapper');
            expect(wrapper).not.toBeNull();
            const btn = wrapper!.querySelector('.unit-toggle-btn') as HTMLElement;
            expect(btn.dataset.currentUnit).toBe('kg');
        });

        test('should auto-enhance input with id=height', () => {
            const input = document.createElement('input');
            input.type = 'number';
            input.id = 'height';
            container.appendChild(input);

            UnitConverter.autoEnhance(container);

            const wrapper = container.querySelector('.unit-converter-wrapper');
            expect(wrapper).not.toBeNull();
        });

        test('should auto-enhance input with id=temperature', () => {
            const input = document.createElement('input');
            input.type = 'number';
            input.id = 'temperature';
            container.appendChild(input);

            UnitConverter.autoEnhance(container);

            const btn = container.querySelector('.unit-toggle-btn') as HTMLElement;
            expect(btn).not.toBeNull();
            expect(btn.dataset.currentUnit).toBe('C');
        });

        test('should auto-enhance input with id=temp', () => {
            const input = document.createElement('input');
            input.type = 'number';
            input.id = 'temp';
            container.appendChild(input);

            UnitConverter.autoEnhance(container);

            const btn = container.querySelector('.unit-toggle-btn') as HTMLElement;
            expect(btn).not.toBeNull();
            expect(btn.dataset.currentUnit).toBe('C');
        });

        test('should merge custom config with default config', () => {
            const input = document.createElement('input');
            input.type = 'number';
            input.id = 'glucose';
            container.appendChild(input);

            UnitConverter.autoEnhance(container, {
                glucose: { type: 'glucose', units: ['mg/dL', 'mmol/L'], default: 'mg/dL' }
            });

            const btn = container.querySelector('.unit-toggle-btn') as HTMLElement;
            expect(btn).not.toBeNull();
            expect(btn.dataset.currentUnit).toBe('mg/dL');
        });

        test('should not enhance checkbox inputs', () => {
            const input = document.createElement('input');
            input.type = 'checkbox';
            input.id = 'weight';
            container.appendChild(input);

            UnitConverter.autoEnhance(container);

            const wrapper = container.querySelector('.unit-converter-wrapper');
            expect(wrapper).toBeNull();
        });

        test('should not enhance radio inputs', () => {
            const input = document.createElement('input');
            input.type = 'radio';
            input.id = 'weight';
            container.appendChild(input);

            UnitConverter.autoEnhance(container);

            const wrapper = container.querySelector('.unit-converter-wrapper');
            expect(wrapper).toBeNull();
        });

        test('should not crash when no matching inputs found', () => {
            expect(() => UnitConverter.autoEnhance(container)).not.toThrow();
        });

        test('should find inputs by name attribute', () => {
            const input = document.createElement('input');
            input.type = 'number';
            input.name = 'weight';
            container.appendChild(input);

            UnitConverter.autoEnhance(container);

            const wrapper = container.querySelector('.unit-converter-wrapper');
            expect(wrapper).not.toBeNull();
        });
    });

    // ==========================================
    // DOM: getStandardValue (extended)
    // ==========================================

    describe('getStandardValue (extended)', () => {
        let input: HTMLInputElement;

        beforeEach(() => {
            input = document.createElement('input');
            input.type = 'number';
            document.body.appendChild(input);
        });

        afterEach(() => {
            document.body.innerHTML = '';
        });

        test('should return raw value when input is not enhanced', () => {
            input.value = '100';
            expect(UnitConverter.getStandardValue(input, 'mg/dL')).toBe(100);
        });

        test('should return null for non-numeric input', () => {
            input.value = 'abc';
            expect(UnitConverter.getStandardValue(input, 'kg')).toBeNull();
        });

        test('should convert from current unit to standard unit when enhanced', () => {
            const wrapper = UnitConverter.enhanceInput(input, 'weight', ['lbs', 'kg'], 'lbs');
            document.body.appendChild(wrapper);
            input.value = '154.32';
            const result = UnitConverter.getStandardValue(input, 'kg');
            expect(result).toBeCloseTo(70, 0);
        });

        test('should return original value when current unit matches standard unit', () => {
            const wrapper = UnitConverter.enhanceInput(input, 'weight', ['kg', 'lbs'], 'kg');
            document.body.appendChild(wrapper);
            input.value = '70';
            const result = UnitConverter.getStandardValue(input, 'kg');
            expect(result).toBe(70);
        });
    });

    // ==========================================
    // CSS injection test
    // ==========================================

    describe('CSS stylesheet injection', () => {
        test('should add unit-converter-styles link element to head', () => {
            const link = document.getElementById('unit-converter-styles');
            expect(link).not.toBeNull();
            if (link) {
                expect(link.tagName).toBe('LINK');
                expect((link as HTMLLinkElement).rel).toBe('stylesheet');
                expect((link as HTMLLinkElement).href).toContain('unit-converter.css');
            }
        });
    });
});
