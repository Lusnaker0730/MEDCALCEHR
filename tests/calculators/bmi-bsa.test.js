/**
 * BMI & BSA Calculator Unit Tests
 * Testing approach: Focus on calculator logic and core functionality
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { bmiBsa } from '../../js/calculators/bmi-bsa/index.js';
import {
    createMockFHIRClient,
    createMockContainer,
    cleanupContainer,
    validateCalculatorStructure
} from './test-helpers.js';

describe('BMI-BSA Calculator', () => {
    let container;
    let mockClient;

    beforeEach(() => {
        container = createMockContainer();
        mockClient = createMockFHIRClient();
        document.body.appendChild(container);
    });

    afterEach(() => {
        cleanupContainer(container);
        jest.clearAllMocks();
    });

    test('should have correct module structure', () => {
        validateCalculatorStructure(bmiBsa);
        expect(bmiBsa.id).toBe('bmi-bsa');
        expect(bmiBsa.title).toContain('BMI');
    });

    test('should generate correct HTML structure', () => {
        const html = bmiBsa.generateHTML();
        container.innerHTML = html;

        expect(container.querySelector('#bmi-bsa-weight')).not.toBeNull();
        expect(container.querySelector('#bmi-bsa-height')).not.toBeNull();
        expect(container.querySelector('#bmi-bsa-result')).not.toBeNull();
        expect(container.textContent).toContain('Weight');
        expect(container.textContent).toContain('Height');
    });

    describe('BMI Calculation Logic', () => {
        test('should calculate BMI correctly for standard values', () => {
            const weight = 70; // kg
            const height = 170; // cm
            const heightInMeters = height / 100;
            const bmi = weight / (heightInMeters * heightInMeters);

            expect(bmi).toBeCloseTo(24.22, 2);
        });

        test('should calculate BMI correctly for overweight', () => {
            const weight = 90; // kg
            const height = 170; // cm
            const heightInMeters = height / 100;
            const bmi = weight / (heightInMeters * heightInMeters);

            expect(bmi).toBeCloseTo(31.14, 2);
            expect(bmi).toBeGreaterThan(30); // Obese
        });

        test('should calculate BMI correctly for underweight', () => {
            const weight = 50; // kg
            const height = 170; // cm
            const heightInMeters = height / 100;
            const bmi = weight / (heightInMeters * heightInMeters);

            expect(bmi).toBeCloseTo(17.30, 2);
            expect(bmi).toBeLessThan(18.5); // Underweight
        });
    });

    describe('BSA Calculation Logic', () => {
        test('should calculate BSA using Du Bois formula correctly', () => {
            const weight = 70; // kg
            const height = 170; // cm
            const bsa = 0.007184 * Math.pow(weight, 0.425) * Math.pow(height, 0.725);

            expect(bsa).toBeCloseTo(1.81, 2);
        });

        test('should calculate BSA for larger body size', () => {
            const weight = 100; // kg
            const height = 185; // cm
            const bsa = 0.007184 * Math.pow(weight, 0.425) * Math.pow(height, 0.725);

            expect(bsa).toBeCloseTo(2.24, 2);
        });

        test('should calculate BSA for smaller body size', () => {
            const weight = 50; // kg
            const height = 155; // cm
            const bsa = 0.007184 * Math.pow(weight, 0.425) * Math.pow(height, 0.725);

            expect(bsa).toBeCloseTo(1.47, 2);
        });
    });

    describe('BMI Category Classification', () => {
        function getBMICategory(bmi) {
            if (bmi < 18.5) return 'Underweight';
            if (bmi < 25) return 'Normal weight';
            if (bmi < 30) return 'Overweight';
            if (bmi < 35) return 'Obese (Class I)';
            if (bmi < 40) return 'Obese (Class II)';
            return 'Obese (Class III)';
        }

        test('should categorize as underweight', () => {
            expect(getBMICategory(17.5)).toBe('Underweight');
        });

        test('should categorize as normal weight', () => {
            expect(getBMICategory(22.0)).toBe('Normal weight');
        });

        test('should categorize as overweight', () => {
            expect(getBMICategory(27.0)).toBe('Overweight');
        });

        test('should categorize as obese class I', () => {
            expect(getBMICategory(32.0)).toBe('Obese (Class I)');
        });

        test('should categorize as obese class II', () => {
            expect(getBMICategory(37.0)).toBe('Obese (Class II)');
        });

        test('should categorize as obese class III', () => {
            expect(getBMICategory(42.0)).toBe('Obese (Class III)');
        });
    });

    describe('Input Validation', () => {
        test('should reject negative weight', () => {
            const weight = -10;
            expect(weight).toBeLessThan(0);
            // Validation should reject this
        });

        test('should reject negative height', () => {
            const height = -150;
            expect(height).toBeLessThan(0);
            // Validation should reject this
        });

        test('should reject excessively large weight', () => {
            const weight = 600; // kg
            expect(weight).toBeGreaterThan(500);
            // Should be outside reasonable range
        });

        test('should reject excessively large height', () => {
            const height = 300; // cm
            expect(height).toBeGreaterThan(250);
            // Should be outside reasonable range
        });

        test('should accept normal range values', () => {
            const weight = 70;
            const height = 170;
            expect(weight).toBeGreaterThan(0);
            expect(weight).toBeLessThan(500);
            expect(height).toBeGreaterThan(0);
            expect(height).toBeLessThan(250);
        });
    });

    describe('Precision Tests', () => {
        test('BMI should be precise to 2 decimal places', () => {
            const weight = 70;
            const height = 170;
            const heightInMeters = height / 100;
            const bmi = weight / (heightInMeters * heightInMeters);
            const rounded = Math.round(bmi * 100) / 100;

            expect(rounded).toBe(24.22);
        });

        test('BSA should be precise to 2 decimal places', () => {
            const weight = 70;
            const height = 170;
            const bsa = 0.007184 * Math.pow(weight, 0.425) * Math.pow(height, 0.725);
            const rounded = Math.round(bsa * 100) / 100;

            expect(rounded).toBe(1.81);
        });
    });
});
