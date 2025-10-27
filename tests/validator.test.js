/**
 * Unit tests for validator.js
 */

import { describe, test, expect } from '@jest/globals';
import { ValidationRules, validateCalculatorInput } from '../js/validator.js';

describe('ValidationRules - Predefined Rules', () => {
    test('age rule should have correct constraints', () => {
        expect(ValidationRules.age.required).toBe(true);
        expect(ValidationRules.age.min).toBe(0);
        expect(ValidationRules.age.max).toBe(150);
    });

    test('weight rule should have correct constraints', () => {
        expect(ValidationRules.weight.required).toBe(true);
        expect(ValidationRules.weight.min).toBe(0.5);
        expect(ValidationRules.weight.max).toBe(500);
    });

    test('height rule should have correct constraints', () => {
        expect(ValidationRules.height.required).toBe(true);
        expect(ValidationRules.height.min).toBe(30);
        expect(ValidationRules.height.max).toBe(250);
    });

    test('bloodPressure rule should have systolic and diastolic', () => {
        expect(ValidationRules.bloodPressure.systolic.required).toBe(true);
        expect(ValidationRules.bloodPressure.systolic.min).toBe(50);
        expect(ValidationRules.bloodPressure.systolic.max).toBe(250);
        expect(ValidationRules.bloodPressure.diastolic.required).toBe(true);
        expect(ValidationRules.bloodPressure.diastolic.min).toBe(30);
        expect(ValidationRules.bloodPressure.diastolic.max).toBe(150);
    });

    test('temperature rule should have correct constraints', () => {
        expect(ValidationRules.temperature.required).toBe(true);
        expect(ValidationRules.temperature.min).toBe(20);
        expect(ValidationRules.temperature.max).toBe(45);
    });
});

describe('validateCalculatorInput - Basic Validation', () => {
    test('should validate inputs that meet all requirements', () => {
        const inputs = {
            age: '35',
            weight: '70',
        };
        const schema = {
            age: { required: true, min: 0, max: 150 },
            weight: { required: true, min: 0, max: 500 },
        };
        const result = validateCalculatorInput(inputs, schema);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    test('should detect missing required fields', () => {
        const inputs = {
            age: '',
            weight: '70',
        };
        const schema = {
            age: { required: true, min: 0, max: 150, message: '年龄是必需的' },
            weight: { required: true, min: 0, max: 500 },
        };
        const result = validateCalculatorInput(inputs, schema);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0]).toContain('年龄');
    });

    test('should detect values below minimum', () => {
        const inputs = {
            age: '-5',
            weight: '70',
        };
        const schema = {
            age: { required: true, min: 0, max: 150 },
            weight: { required: true, min: 0, max: 500 },
        };
        const result = validateCalculatorInput(inputs, schema);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should detect values above maximum', () => {
        const inputs = {
            age: '200',
            weight: '70',
        };
        const schema = {
            age: { required: true, min: 0, max: 150 },
            weight: { required: true, min: 0, max: 500 },
        };
        const result = validateCalculatorInput(inputs, schema);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should detect multiple validation errors', () => {
        const inputs = {
            age: '',
            weight: '-10',
        };
        const schema = {
            age: { required: true, min: 0, max: 150 },
            weight: { required: true, min: 0, max: 500 },
        };
        const result = validateCalculatorInput(inputs, schema);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should skip validation for non-required empty fields', () => {
        const inputs = {
            age: '35',
            notes: '',
        };
        const schema = {
            age: { required: true, min: 0, max: 150 },
            notes: { required: false, min: 0 },
        };
        const result = validateCalculatorInput(inputs, schema);
        expect(result.isValid).toBe(true);
    });

    test('should validate with pattern (regex)', () => {
        const inputs = {
            phone: '123-456-7890',
        };
        const schema = {
            phone: { required: true, pattern: /^\d{3}-\d{3}-\d{4}$/, message: '电话号码格式不正确' },
        };
        const result = validateCalculatorInput(inputs, schema);
        expect(result.isValid).toBe(true);
    });

    test('should reject invalid pattern', () => {
        const inputs = {
            phone: 'invalid-phone',
        };
        const schema = {
            phone: { required: true, pattern: /^\d{3}-\d{3}-\d{4}$/, message: '电话号码格式不正确' },
        };
        const result = validateCalculatorInput(inputs, schema);
        expect(result.isValid).toBe(false);
        expect(result.errors[0]).toContain('电话号码格式不正确');
    });

    test('should handle custom validation functions', () => {
        const inputs = {
            password: 'weak',
        };
        const schema = {
            password: {
                required: true,
                custom: (value) => {
                    if (value.length < 8) {
                        return '密码必须至少8个字符';
                    }
                    return true;
                },
            },
        };
        const result = validateCalculatorInput(inputs, schema);
        expect(result.isValid).toBe(false);
        expect(result.errors[0]).toContain('密码必须至少8个字符');
    });

    test('should pass custom validation when valid', () => {
        const inputs = {
            password: 'strongPassword123',
        };
        const schema = {
            password: {
                required: true,
                custom: (value) => {
                    if (value.length < 8) {
                        return '密码必须至少8个字符';
                    }
                    return true;
                },
            },
        };
        const result = validateCalculatorInput(inputs, schema);
        expect(result.isValid).toBe(true);
    });
});
