/**
 * @jest-environment jsdom
 */

import { describe, expect, test } from '@jest/globals';
import { 
    validateCalculatorInput, 
    ValidationRules,
    validateNumberRange,
    validateRequired,
    validatePattern,
    validateCustom
} from '../validator';

describe('Validator Module', () => {
    describe('validateCalculatorInput', () => {
        test('should pass validation for valid input', () => {
            const input = {
                weight: 70,
                height: 175,
                age: 30
            };

            const schema = {
                weight: { required: true, min: 0, max: 500 },
                height: { required: true, min: 0, max: 300 },
                age: { required: true, min: 0, max: 150 }
            };

            const result = validateCalculatorInput(input, schema);
            expect(result.isValid).toBe(true);
            expect(result.errors.length).toBe(0);
        });

        test('should fail for missing required field', () => {
            const input = {
                weight: 70
            };

            const schema = {
                weight: { required: true },
                height: { required: true, message: 'Height is required' }
            };

            const result = validateCalculatorInput(input, schema);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Height is required');
        });

        test('should fail for value below minimum', () => {
            const input = {
                age: -5
            };

            const schema = {
                age: { min: 0, message: 'Age must be positive' }
            };

            const result = validateCalculatorInput(input, schema);
            expect(result.isValid).toBe(false);
        });

        test('should fail for value above maximum', () => {
            const input = {
                score: 150
            };

            const schema = {
                score: { max: 100, message: 'Score must be 100 or less' }
            };

            const result = validateCalculatorInput(input, schema);
            expect(result.isValid).toBe(false);
        });

        test('should handle null and undefined values', () => {
            const input = {
                value1: null,
                value2: undefined
            };

            const schema = {
                value1: { required: true },
                value2: { required: true }
            };

            const result = validateCalculatorInput(input, schema);
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBe(2);
        });

        test('should handle NaN values', () => {
            const input = {
                value: NaN
            };

            const schema = {
                value: { required: true }
            };

            const result = validateCalculatorInput(input, schema);
            expect(result.isValid).toBe(false);
        });

        test('should validate with pattern', () => {
            const input = {
                email: 'test@example.com'
            };

            const schema = {
                email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
            };

            const result = validateCalculatorInput(input, schema);
            expect(result.isValid).toBe(true);
        });

        test('should fail pattern validation', () => {
            const input = {
                email: 'invalid-email'
            };

            const schema = {
                email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' }
            };

            const result = validateCalculatorInput(input, schema);
            expect(result.isValid).toBe(false);
        });

        test('should handle custom validation function', () => {
            const input = {
                password: 'short'
            };

            const schema = {
                password: {
                    custom: (value: any) => {
                        if (value.length < 8) return 'Password too short';
                        return true;
                    }
                }
            };

            const result = validateCalculatorInput(input, schema);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password too short');
        });

        test('should handle custom validation returning true', () => {
            const input = {
                password: 'longEnoughPassword123'
            };

            const schema = {
                password: {
                    custom: (value: any) => value.length >= 8
                }
            };

            const result = validateCalculatorInput(input, schema);
            expect(result.isValid).toBe(true);
        });
    });

    describe('ValidationRules', () => {
        test('should have predefined validation rules', () => {
            expect(ValidationRules).toBeDefined();
            
            // Check common rules exist
            if (ValidationRules.POSITIVE_NUMBER) {
                expect(ValidationRules.POSITIVE_NUMBER.min).toBe(0);
            }
        });
    });

    describe('Individual Validators', () => {
        test('validateNumberRange should validate range', () => {
            expect(validateNumberRange(50, 0, 100)).toBe(true);
            expect(validateNumberRange(-1, 0, 100)).toBe(false);
            expect(validateNumberRange(101, 0, 100)).toBe(false);
        });

        test('validateRequired should check for required values', () => {
            expect(validateRequired('test')).toBe(true);
            expect(validateRequired(0)).toBe(true);
            expect(validateRequired(null)).toBe(false);
            expect(validateRequired(undefined)).toBe(false);
            expect(validateRequired('')).toBe(false);
        });

        test('validatePattern should check regex patterns', () => {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            expect(validatePattern('test@example.com', emailPattern)).toBe(true);
            expect(validatePattern('invalid', emailPattern)).toBe(false);
        });
    });
});

