/**
 * @jest-environment jsdom
 */
import { describe, expect, test } from '@jest/globals';
import { validateCalculatorInput, validateOrThrow, ValidationRules } from '../validator';
import { ValidationError } from '../errorHandler';
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
        test('should handle custom validation function returning error string', () => {
            const input = {
                password: 'short'
            };
            const schema = {
                password: {
                    custom: (value) => {
                        if (value.length < 8)
                            return 'Password too short';
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
                    custom: (value) => value.length >= 8
                }
            };
            const result = validateCalculatorInput(input, schema);
            expect(result.isValid).toBe(true);
        });
        test('should skip validation for empty non-required fields', () => {
            const input = {
                optional: ''
            };
            const schema = {
                optional: { min: 10 } // Not required, should skip min check
            };
            const result = validateCalculatorInput(input, schema);
            expect(result.isValid).toBe(true);
        });
        test('should handle empty string as missing for required', () => {
            const input = {
                name: ''
            };
            const schema = {
                name: { required: true }
            };
            const result = validateCalculatorInput(input, schema);
            expect(result.isValid).toBe(false);
        });
    });
    describe('ValidationRules', () => {
        test('should have predefined validation rules', () => {
            expect(ValidationRules).toBeDefined();
            expect(typeof ValidationRules).toBe('object');
        });
    });
});
// ---------------------------------------------------------------------------
// Comprehensive tests added below
// ---------------------------------------------------------------------------
/**
 * Full catalogue of all predefined ValidationRules with their expected boundaries.
 * Each entry carries: ruleName, min, max, warnMin (or undefined), warnMax (or undefined),
 * required flag, and the exact message / warningMessage strings.
 */
const ALL_RULES = [
    { name: 'age', min: 0, max: 150, warnMin: 1, warnMax: 120, required: true, message: 'Age must be between 0-150 years', warningMessage: 'Age is unusual; double-check.' },
    { name: 'temperature', min: 20, max: 45, warnMin: 35, warnMax: 40, required: true, message: 'Temperature must be between 20-45\u00B0C', warningMessage: 'Temperature is extreme; double-check.' },
    { name: 'systolicBP', min: 50, max: 250, warnMin: 70, warnMax: 200, required: true, message: 'Systolic BP must be between 50-250 mmHg', warningMessage: 'Systolic BP is extreme; double-check.' },
    { name: 'diastolicBP', min: 30, max: 150, warnMin: 40, warnMax: 110, required: true, message: 'Diastolic BP must be between 30-150 mmHg', warningMessage: 'Diastolic BP is extreme; double-check.' },
    { name: 'heartRate', min: 20, max: 250, warnMin: 40, warnMax: 150, required: true, message: 'Heart rate must be between 20-250 bpm', warningMessage: 'Heart rate is extreme; double-check.' },
    { name: 'pH', min: 6.5, max: 8.0, warnMin: 7.25, warnMax: 7.55, required: true, message: 'Too low/high; please change to proceed.', warningMessage: 'Extreme value; double-check.' },
    { name: 'weight', min: 0.5, max: 500, warnMin: 30, warnMax: 200, required: true, message: 'Weight must be between 0.5-500 kg', warningMessage: 'Weight is unusual; double-check.' },
    { name: 'height', min: 30, max: 250, warnMin: 100, warnMax: 220, required: true, message: 'Height must be between 30-250 cm', warningMessage: 'Height is unusual; double-check.' },
    { name: 'gcs', min: 3, max: 15, warnMin: undefined, warnMax: undefined, required: true, message: 'GCS score must be between 3-15', warningMessage: undefined },
    { name: 'glucose', min: 10, max: 2000, warnMin: 50, warnMax: 400, required: true, message: 'Glucose must be between 10-2000 mg/dL', warningMessage: 'Glucose is extreme; double-check.' },
    { name: 'bun', min: 1, max: 200, warnMin: 5, warnMax: 80, required: true, message: 'BUN must be between 1-200 mg/dL', warningMessage: 'BUN is extreme; double-check.' },
    { name: 'urineSodium', min: 1, max: 1000, warnMin: 10, warnMax: 200, required: true, message: 'Urine sodium must be between 1-1000 mEq/L', warningMessage: 'Urine sodium is unusual; double-check.' },
    { name: 'urinePotassium', min: 1, max: 500, warnMin: 15, warnMax: 150, required: true, message: 'Urine potassium must be between 1-500 mEq/L', warningMessage: 'Urine potassium is unusual; double-check.' },
    { name: 'urineCreatinine', min: 1, max: 2000, warnMin: 20, warnMax: 400, required: true, message: 'Urine creatinine must be between 1-2000 mg/dL', warningMessage: 'Urine creatinine is unusual; double-check.' },
    { name: 'creatinine', min: 0.1, max: 20, warnMin: 0.4, warnMax: 10, required: true, message: 'Creatinine must be between 0.1-20 mg/dL', warningMessage: 'Creatinine is extreme; double-check.' },
    { name: 'egfr', min: 1, max: 200, warnMin: 15, warnMax: 120, required: true, message: 'eGFR must be between 1-200 mL/min/1.73m\u00B2', warningMessage: 'eGFR is unusual; double-check.' },
    { name: 'sodium', min: 100, max: 200, warnMin: 120, warnMax: 160, required: true, message: 'Too low/high; please change to proceed.', warningMessage: 'Very low/high; double-check.' },
    { name: 'potassium', min: 1.5, max: 10, warnMin: 2.5, warnMax: 6.5, required: true, message: 'Potassium must be between 1.5-10 mEq/L', warningMessage: 'Potassium is extreme; double-check.' },
    { name: 'bilirubin', min: 0.1, max: 80, warnMin: 0.2, warnMax: 30, required: true, message: 'Bilirubin must be between 0.1-80 mg/dL', warningMessage: 'Bilirubin is extreme; double-check.' },
    { name: 'calcium', min: 2.0, max: 20.0, warnMin: 7.0, warnMax: 12.0, required: true, message: 'Calcium must be between 2.0-20.0 mg/dL', warningMessage: 'Calcium is extreme; double-check.' },
    { name: 'inr', min: 0.5, max: 20, warnMin: 0.8, warnMax: 6, required: true, message: 'INR must be between 0.5-20', warningMessage: 'INR is extreme; double-check.' },
    { name: 'albumin', min: 0.5, max: 8.0, warnMin: 2.0, warnMax: 5.5, required: true, message: 'Albumin must be between 0.5-8.0 g/dL', warningMessage: 'Albumin is unusual; double-check.' },
    { name: 'liverEnzyme', min: 1, max: 5000, warnMin: 5, warnMax: 500, required: true, message: 'Enzyme level must be between 1-5000 U/L', warningMessage: 'Enzyme level is extreme; double-check.' },
    { name: 'platelets', min: 1, max: 2000, warnMin: 50, warnMax: 500, required: true, message: 'Platelets must be between 1-2000 \u00D710\u2079/L', warningMessage: 'Platelet count is extreme; double-check.' },
    { name: 'map', min: 20, max: 300, warnMin: 50, warnMax: 150, required: true, message: 'Too low/high; please change to proceed.', warningMessage: 'Very low/high; double-check.' },
    { name: 'respiratoryRate', min: 0, max: 100, warnMin: 8, warnMax: 40, required: true, message: 'Respiratory rate must be between 0-100 breaths/min', warningMessage: 'Respiratory rate is extreme; double-check.' },
    { name: 'hematocrit', min: 5, max: 80, warnMin: 20, warnMax: 55, required: true, message: 'Hematocrit must be between 5-80%', warningMessage: 'Hematocrit is extreme; double-check.' },
    { name: 'wbc', min: 0, max: 500, warnMin: 2, warnMax: 30, required: true, message: 'WBC must be between 0-500 \u00D710\u2079/L', warningMessage: 'WBC count is extreme; double-check.' },
    { name: 'qtInterval', min: 200, max: 800, warnMin: 350, warnMax: 500, required: true, message: 'QT interval must be between 200-800 ms', warningMessage: 'QT interval is unusual; double-check.' },
    { name: 'paO2', min: 10, max: 800, warnMin: 40, warnMax: 500, required: true, message: 'PaO\u2082 must be between 10-800 mmHg', warningMessage: 'PaO\u2082 is extreme; double-check.' },
    { name: 'paCO2', min: 5, max: 200, warnMin: 25, warnMax: 80, required: true, message: 'PaCO\u2082 must be between 5-200 mmHg', warningMessage: 'PaCO\u2082 is extreme; double-check.' },
    { name: 'fiO2', min: 0.21, max: 1.0, warnMin: undefined, warnMax: undefined, required: true, message: 'FiO\u2082 must be between 0.21-1.0', warningMessage: undefined },
    { name: 'phenytoin', min: 0, max: 100, warnMin: 5, warnMax: 30, required: true, message: 'Phenytoin level must be between 0-100 mcg/mL', warningMessage: 'Phenytoin level is unusual; double-check.' },
    { name: 'bicarbonate', min: 2, max: 60, warnMin: 15, warnMax: 35, required: true, message: 'HCO\u2083\u207B must be between 2-60 mEq/L', warningMessage: 'Bicarbonate is extreme; double-check.' },
    { name: 'chloride', min: 50, max: 150, warnMin: 90, warnMax: 115, required: true, message: 'Chloride must be between 50-150 mEq/L', warningMessage: 'Chloride is extreme; double-check.' },
    { name: 'insulin', min: 0.1, max: 500, warnMin: 2, warnMax: 100, required: true, message: 'Insulin must be between 0.1-500 \u00B5U/mL', warningMessage: 'Insulin level is unusual; double-check.' },
    { name: 'ethanol', min: 0, max: 1000, warnMin: undefined, warnMax: 400, required: false, message: 'Ethanol concentration must be between 0-1000 mg/dL', warningMessage: 'Ethanol level is very high; double-check.' },
    { name: 'totalCholesterol', min: 50, max: 1000, warnMin: 100, warnMax: 350, required: true, message: 'Total cholesterol must be between 50-1000 mg/dL', warningMessage: 'Cholesterol is unusual; double-check.' },
    { name: 'hdl', min: 10, max: 200, warnMin: 25, warnMax: 100, required: true, message: 'HDL must be between 10-200 mg/dL', warningMessage: 'HDL is unusual; double-check.' },
    { name: 'triglycerides', min: 10, max: 3000, warnMin: 30, warnMax: 500, required: true, message: 'Triglycerides must be between 10-3000 mg/dL', warningMessage: 'Triglycerides are unusual; double-check.' },
    { name: 'osmolality', min: 0, max: 2000, warnMin: 250, warnMax: 350, required: true, message: 'Osmolality must be between 0-2000 mOsm/kg', warningMessage: 'Osmolality is unusual; double-check.' },
    { name: 'hours', min: 0, max: 168, warnMin: undefined, warnMax: 72, required: true, message: 'Time must be between 0-168 hours', warningMessage: 'Time duration is very long; double-check.' },
    { name: 'volume', min: 0, max: 5000, warnMin: undefined, warnMax: 2000, required: true, message: 'Volume must be between 0-5000 mL', warningMessage: 'Volume is very large; double-check.' },
    { name: 'abv', min: 0, max: 100, warnMin: undefined, warnMax: 60, required: true, message: 'ABV must be between 0-100%', warningMessage: 'ABV is very high; double-check.' },
    { name: 'hemoglobin', min: 1, max: 25, warnMin: 6, warnMax: 18, required: true, message: 'Hemoglobin must be between 1-25 g/dL', warningMessage: 'Hemoglobin is extreme; double-check.' },
];
// ---------------------------------------------------------------------------
// Helper: run validateCalculatorInput for a single rule with a given value
// ---------------------------------------------------------------------------
function validateSingleField(fieldName, value, rule) {
    return validateCalculatorInput({ [fieldName]: value }, { [fieldName]: rule });
}
// ===========================================================================
// 1. Structural tests -- every predefined rule has the right shape
// ===========================================================================
describe('ValidationRules - structural checks', () => {
    const ruleNames = Object.keys(ValidationRules);
    test('should contain all expected rule names', () => {
        const expected = ALL_RULES.map(r => r.name);
        for (const name of expected) {
            expect(ruleNames).toContain(name);
        }
    });
    test.each(ruleNames)('rule "%s" should have min and max defined', (name) => {
        const rule = ValidationRules[name];
        expect(rule.min).toBeDefined();
        expect(typeof rule.min).toBe('number');
        expect(rule.max).toBeDefined();
        expect(typeof rule.max).toBe('number');
        expect(rule.min).toBeLessThan(rule.max);
    });
    test.each(ruleNames)('rule "%s" should have a non-empty message string', (name) => {
        const rule = ValidationRules[name];
        expect(rule.message).toBeDefined();
        expect(typeof rule.message).toBe('string');
        expect(rule.message.length).toBeGreaterThan(0);
    });
    test.each(ruleNames)('rule "%s" warnMin < warnMax when both exist, and both lie within [min, max]', (name) => {
        const rule = ValidationRules[name];
        if (rule.warnMin !== undefined && rule.warnMax !== undefined) {
            expect(rule.warnMin).toBeLessThanOrEqual(rule.warnMax);
            expect(rule.warnMin).toBeGreaterThanOrEqual(rule.min);
            expect(rule.warnMax).toBeLessThanOrEqual(rule.max);
        }
    });
    test.each(ruleNames)('rule "%s" should have warningMessage when any warn boundary exists', (name) => {
        const rule = ValidationRules[name];
        if (rule.warnMin !== undefined || rule.warnMax !== undefined) {
            expect(rule.warningMessage).toBeDefined();
            expect(typeof rule.warningMessage).toBe('string');
            expect(rule.warningMessage.length).toBeGreaterThan(0);
        }
    });
});
// ===========================================================================
// 2. Catalogue-driven boundary tests for ALL_RULES
// ===========================================================================
describe('ValidationRules - three-zone boundary tests (describe.each)', () => {
    // Rules that have both warnMin and warnMax (full four-boundary rules)
    const fullZoneRules = ALL_RULES.filter(r => r.warnMin !== undefined && r.warnMax !== undefined);
    // Rules that have only warnMax (no low-warning zone)
    const warnMaxOnlyRules = ALL_RULES.filter(r => r.warnMin === undefined && r.warnMax !== undefined);
    // Rules that have no warning zone at all
    const noWarnRules = ALL_RULES.filter(r => r.warnMin === undefined && r.warnMax === undefined);
    // ------------------------------------------------------------------
    // 2a. Full-zone rules: min < warnMin < warnMax < max
    // ------------------------------------------------------------------
    describe.each(fullZoneRules.map(r => [r.name, r]))('Full-zone rule: %s', (_name, ruleSpec) => {
        const rule = ValidationRules[ruleSpec.name];
        test('value exactly at min => valid (green), no error', () => {
            const res = validateSingleField(ruleSpec.name, ruleSpec.min, rule);
            // At min but below warnMin => warning, not error
            if (ruleSpec.warnMin !== undefined && ruleSpec.min < ruleSpec.warnMin) {
                expect(res.isValid).toBe(true);
                expect(res.hasWarnings).toBe(true);
                expect(res.fieldStatus[ruleSpec.name]).toBe('warning');
            }
            else {
                expect(res.isValid).toBe(true);
                expect(res.fieldStatus[ruleSpec.name]).toBe('valid');
            }
        });
        test('value exactly at max => valid (green), no error', () => {
            const res = validateSingleField(ruleSpec.name, ruleSpec.max, rule);
            if (ruleSpec.warnMax !== undefined && ruleSpec.max > ruleSpec.warnMax) {
                expect(res.isValid).toBe(true);
                expect(res.hasWarnings).toBe(true);
                expect(res.fieldStatus[ruleSpec.name]).toBe('warning');
            }
            else {
                expect(res.isValid).toBe(true);
                expect(res.fieldStatus[ruleSpec.name]).toBe('valid');
            }
        });
        test('value below min => error (red)', () => {
            const res = validateSingleField(ruleSpec.name, ruleSpec.min - 1, rule);
            expect(res.isValid).toBe(false);
            expect(res.fieldStatus[ruleSpec.name]).toBe('error');
            expect(res.errors.length).toBeGreaterThan(0);
        });
        test('value above max => error (red)', () => {
            const res = validateSingleField(ruleSpec.name, ruleSpec.max + 1, rule);
            expect(res.isValid).toBe(false);
            expect(res.fieldStatus[ruleSpec.name]).toBe('error');
            expect(res.errors.length).toBeGreaterThan(0);
        });
        test('value exactly at warnMin => valid/green (no warning)', () => {
            const res = validateSingleField(ruleSpec.name, ruleSpec.warnMin, rule);
            expect(res.isValid).toBe(true);
            expect(res.fieldStatus[ruleSpec.name]).toBe('valid');
        });
        test('value exactly at warnMax => valid/green (no warning)', () => {
            const res = validateSingleField(ruleSpec.name, ruleSpec.warnMax, rule);
            expect(res.isValid).toBe(true);
            expect(res.fieldStatus[ruleSpec.name]).toBe('valid');
        });
        test('value between warnMin and warnMax => green zone', () => {
            const mid = (ruleSpec.warnMin + ruleSpec.warnMax) / 2;
            const res = validateSingleField(ruleSpec.name, mid, rule);
            expect(res.isValid).toBe(true);
            expect(res.hasWarnings).toBe(false);
            expect(res.fieldStatus[ruleSpec.name]).toBe('valid');
        });
        test('value between min and warnMin => yellow (warning) zone', () => {
            if (ruleSpec.min < ruleSpec.warnMin) {
                const val = (ruleSpec.min + ruleSpec.warnMin) / 2;
                const res = validateSingleField(ruleSpec.name, val, rule);
                expect(res.isValid).toBe(true);
                expect(res.hasWarnings).toBe(true);
                expect(res.fieldStatus[ruleSpec.name]).toBe('warning');
            }
        });
        test('value between warnMax and max => yellow (warning) zone', () => {
            if (ruleSpec.warnMax < ruleSpec.max) {
                const val = (ruleSpec.warnMax + ruleSpec.max) / 2;
                const res = validateSingleField(ruleSpec.name, val, rule);
                expect(res.isValid).toBe(true);
                expect(res.hasWarnings).toBe(true);
                expect(res.fieldStatus[ruleSpec.name]).toBe('warning');
            }
        });
        test('error message matches rule.message for below-min', () => {
            const res = validateSingleField(ruleSpec.name, ruleSpec.min - 1, rule);
            expect(res.errors[0]).toBe(ruleSpec.message);
        });
        test('error message matches rule.message for above-max', () => {
            const res = validateSingleField(ruleSpec.name, ruleSpec.max + 1, rule);
            expect(res.errors[0]).toBe(ruleSpec.message);
        });
        test('warning message matches rule.warningMessage for below-warnMin', () => {
            if (ruleSpec.min < ruleSpec.warnMin) {
                const val = (ruleSpec.min + ruleSpec.warnMin) / 2;
                const res = validateSingleField(ruleSpec.name, val, rule);
                expect(res.warnings[0]).toBe(ruleSpec.warningMessage);
            }
        });
        test('warning message matches rule.warningMessage for above-warnMax', () => {
            if (ruleSpec.warnMax < ruleSpec.max) {
                const val = (ruleSpec.warnMax + ruleSpec.max) / 2;
                const res = validateSingleField(ruleSpec.name, val, rule);
                expect(res.warnings[0]).toBe(ruleSpec.warningMessage);
            }
        });
    });
    // ------------------------------------------------------------------
    // 2b. warnMax-only rules (ethanol, hours, volume, abv)
    // ------------------------------------------------------------------
    describe.each(warnMaxOnlyRules.map(r => [r.name, r]))('WarnMax-only rule: %s', (_name, ruleSpec) => {
        const rule = ValidationRules[ruleSpec.name];
        test('value at min => valid', () => {
            const res = validateSingleField(ruleSpec.name, ruleSpec.min, rule);
            expect(res.isValid).toBe(true);
            expect(res.fieldStatus[ruleSpec.name]).toBe('valid');
        });
        test('value at max => warning (above warnMax)', () => {
            const res = validateSingleField(ruleSpec.name, ruleSpec.max, rule);
            if (ruleSpec.max > ruleSpec.warnMax) {
                expect(res.isValid).toBe(true);
                expect(res.hasWarnings).toBe(true);
                expect(res.fieldStatus[ruleSpec.name]).toBe('warning');
            }
            else {
                expect(res.isValid).toBe(true);
                expect(res.fieldStatus[ruleSpec.name]).toBe('valid');
            }
        });
        test('value below min => error', () => {
            const res = validateSingleField(ruleSpec.name, ruleSpec.min - 1, rule);
            expect(res.isValid).toBe(false);
            expect(res.fieldStatus[ruleSpec.name]).toBe('error');
        });
        test('value above max => error', () => {
            const res = validateSingleField(ruleSpec.name, ruleSpec.max + 1, rule);
            expect(res.isValid).toBe(false);
            expect(res.fieldStatus[ruleSpec.name]).toBe('error');
        });
        test('value at warnMax => valid/green', () => {
            const res = validateSingleField(ruleSpec.name, ruleSpec.warnMax, rule);
            expect(res.isValid).toBe(true);
            expect(res.fieldStatus[ruleSpec.name]).toBe('valid');
        });
        test('value between warnMax and max => warning', () => {
            if (ruleSpec.warnMax < ruleSpec.max) {
                const val = (ruleSpec.warnMax + ruleSpec.max) / 2;
                const res = validateSingleField(ruleSpec.name, val, rule);
                expect(res.isValid).toBe(true);
                expect(res.hasWarnings).toBe(true);
                expect(res.fieldStatus[ruleSpec.name]).toBe('warning');
            }
        });
        test('value between min and warnMax => green', () => {
            const val = (ruleSpec.min + ruleSpec.warnMax) / 2;
            const res = validateSingleField(ruleSpec.name, val, rule);
            expect(res.isValid).toBe(true);
            expect(res.hasWarnings).toBe(false);
            expect(res.fieldStatus[ruleSpec.name]).toBe('valid');
        });
    });
    // ------------------------------------------------------------------
    // 2c. No-warning-zone rules (gcs, fiO2)
    // ------------------------------------------------------------------
    describe.each(noWarnRules.map(r => [r.name, r]))('No-warning-zone rule: %s', (_name, ruleSpec) => {
        const rule = ValidationRules[ruleSpec.name];
        test('value at min => valid', () => {
            const res = validateSingleField(ruleSpec.name, ruleSpec.min, rule);
            expect(res.isValid).toBe(true);
            expect(res.hasWarnings).toBe(false);
            expect(res.fieldStatus[ruleSpec.name]).toBe('valid');
        });
        test('value at max => valid', () => {
            const res = validateSingleField(ruleSpec.name, ruleSpec.max, rule);
            expect(res.isValid).toBe(true);
            expect(res.hasWarnings).toBe(false);
            expect(res.fieldStatus[ruleSpec.name]).toBe('valid');
        });
        test('midpoint value => valid', () => {
            const mid = (ruleSpec.min + ruleSpec.max) / 2;
            const res = validateSingleField(ruleSpec.name, mid, rule);
            expect(res.isValid).toBe(true);
            expect(res.hasWarnings).toBe(false);
            expect(res.fieldStatus[ruleSpec.name]).toBe('valid');
        });
        test('value below min => error', () => {
            const res = validateSingleField(ruleSpec.name, ruleSpec.min - 1, rule);
            expect(res.isValid).toBe(false);
            expect(res.fieldStatus[ruleSpec.name]).toBe('error');
        });
        test('value above max => error', () => {
            const res = validateSingleField(ruleSpec.name, ruleSpec.max + 1, rule);
            expect(res.isValid).toBe(false);
            expect(res.fieldStatus[ruleSpec.name]).toBe('error');
        });
        test('should never produce warnings', () => {
            // Sweep a few values across the valid range
            const values = [ruleSpec.min, ruleSpec.max, (ruleSpec.min + ruleSpec.max) / 2];
            for (const v of values) {
                const res = validateSingleField(ruleSpec.name, v, rule);
                expect(res.hasWarnings).toBe(false);
                expect(res.warnings.length).toBe(0);
            }
        });
    });
});
// ===========================================================================
// 3. Edge-case inputs
// ===========================================================================
describe('validateCalculatorInput - edge cases', () => {
    test('null value for required field => error with fieldStatus "error"', () => {
        const res = validateCalculatorInput({ age: null }, { age: ValidationRules.age });
        expect(res.isValid).toBe(false);
        expect(res.fieldStatus.age).toBe('error');
    });
    test('undefined value for required field => error', () => {
        const res = validateCalculatorInput({ age: undefined }, { age: ValidationRules.age });
        expect(res.isValid).toBe(false);
        expect(res.fieldStatus.age).toBe('error');
    });
    test('NaN value for required field => error', () => {
        const res = validateCalculatorInput({ age: NaN }, { age: ValidationRules.age });
        expect(res.isValid).toBe(false);
        expect(res.fieldStatus.age).toBe('error');
    });
    test('empty string for required field => error', () => {
        const res = validateCalculatorInput({ age: '' }, { age: ValidationRules.age });
        expect(res.isValid).toBe(false);
        expect(res.fieldStatus.age).toBe('error');
    });
    test('null value for non-required field => valid (skipped)', () => {
        const res = validateCalculatorInput({ ethanol: null }, { ethanol: ValidationRules.ethanol });
        expect(res.isValid).toBe(true);
        expect(res.fieldStatus.ethanol).toBe('valid');
    });
    test('undefined value for non-required field => valid (skipped)', () => {
        const res = validateCalculatorInput({ ethanol: undefined }, { ethanol: ValidationRules.ethanol });
        expect(res.isValid).toBe(true);
        expect(res.fieldStatus.ethanol).toBe('valid');
    });
    test('NaN for non-required field => valid (skipped)', () => {
        const res = validateCalculatorInput({ ethanol: NaN }, { ethanol: ValidationRules.ethanol });
        expect(res.isValid).toBe(true);
        expect(res.fieldStatus.ethanol).toBe('valid');
    });
    test('empty string for non-required field => valid (skipped)', () => {
        const res = validateCalculatorInput({ ethanol: '' }, { ethanol: ValidationRules.ethanol });
        expect(res.isValid).toBe(true);
        expect(res.fieldStatus.ethanol).toBe('valid');
    });
    test('string numeric value is coerced via Number()', () => {
        const res = validateCalculatorInput({ age: '30' }, { age: ValidationRules.age });
        expect(res.isValid).toBe(true);
        expect(res.fieldStatus.age).toBe('valid');
    });
    test('string "0" for a field with min=0 is valid', () => {
        const res = validateCalculatorInput({ respiratoryRate: '0' }, { respiratoryRate: ValidationRules.respiratoryRate });
        // 0 is at min, and warnMin is 8, so 0 < 8 => warning
        expect(res.isValid).toBe(true);
        expect(res.fieldStatus.respiratoryRate).toBe('warning');
    });
    test('field not present in input but present in schema (required) => error', () => {
        const res = validateCalculatorInput({}, { age: ValidationRules.age });
        expect(res.isValid).toBe(false);
        expect(res.fieldStatus.age).toBe('error');
    });
    test('field not present in input but present in schema (non-required) => valid', () => {
        const res = validateCalculatorInput({}, { ethanol: ValidationRules.ethanol });
        expect(res.isValid).toBe(true);
        expect(res.fieldStatus.ethanol).toBe('valid');
    });
    test('extra fields in input that are not in schema are ignored', () => {
        const res = validateCalculatorInput({ age: 30, extraField: 999 }, { age: ValidationRules.age });
        expect(res.isValid).toBe(true);
        expect(res.fieldStatus.age).toBe('valid');
        expect(res.fieldStatus['extraField']).toBeUndefined();
    });
    test('empty schema with any input => valid (no rules to check)', () => {
        const res = validateCalculatorInput({ foo: 'bar' }, {});
        expect(res.isValid).toBe(true);
        expect(res.errors.length).toBe(0);
        expect(res.warnings.length).toBe(0);
    });
    test('empty input with empty schema => valid', () => {
        const res = validateCalculatorInput({}, {});
        expect(res.isValid).toBe(true);
    });
    test('negative zero is treated as 0', () => {
        const res = validateCalculatorInput({ respiratoryRate: -0 }, { respiratoryRate: ValidationRules.respiratoryRate });
        // -0 === 0, and 0 is at min (0), below warnMin (8) => warning
        expect(res.isValid).toBe(true);
    });
    test('Infinity is treated as above max => error', () => {
        const res = validateCalculatorInput({ age: Infinity }, { age: ValidationRules.age });
        expect(res.isValid).toBe(false);
        expect(res.fieldStatus.age).toBe('error');
    });
    test('-Infinity is treated as below min => error', () => {
        const res = validateCalculatorInput({ age: -Infinity }, { age: ValidationRules.age });
        expect(res.isValid).toBe(false);
        expect(res.fieldStatus.age).toBe('error');
    });
});
// ===========================================================================
// 4. ValidationResult structure
// ===========================================================================
describe('ValidationResult structure', () => {
    test('result always has isValid, errors, hasWarnings, warnings, fieldStatus', () => {
        const res = validateCalculatorInput({ x: 5 }, { x: { min: 0, max: 10 } });
        expect(res).toHaveProperty('isValid');
        expect(res).toHaveProperty('errors');
        expect(res).toHaveProperty('hasWarnings');
        expect(res).toHaveProperty('warnings');
        expect(res).toHaveProperty('fieldStatus');
        expect(Array.isArray(res.errors)).toBe(true);
        expect(Array.isArray(res.warnings)).toBe(true);
        expect(typeof res.fieldStatus).toBe('object');
    });
    test('isValid is true when errors array is empty', () => {
        const res = validateCalculatorInput({ x: 5 }, { x: { min: 0, max: 10 } });
        expect(res.isValid).toBe(true);
        expect(res.errors.length).toBe(0);
    });
    test('isValid is false when errors array has entries', () => {
        const res = validateCalculatorInput({ x: 15 }, { x: { min: 0, max: 10 } });
        expect(res.isValid).toBe(false);
        expect(res.errors.length).toBeGreaterThan(0);
    });
    test('hasWarnings is true when warnings array has entries', () => {
        const res = validateCalculatorInput({ age: 0.5 }, { age: ValidationRules.age });
        // 0.5 is >= min(0) but < warnMin(1) => warning
        expect(res.hasWarnings).toBe(true);
        expect(res.warnings.length).toBeGreaterThan(0);
    });
    test('hasWarnings is false when warnings array is empty', () => {
        const res = validateCalculatorInput({ age: 30 }, { age: ValidationRules.age });
        expect(res.hasWarnings).toBe(false);
        expect(res.warnings.length).toBe(0);
    });
    test('fieldStatus keys match schema keys', () => {
        const schema = {
            age: ValidationRules.age,
            weight: ValidationRules.weight,
            height: ValidationRules.height
        };
        const res = validateCalculatorInput({ age: 30, weight: 70, height: 170 }, schema);
        expect(Object.keys(res.fieldStatus).sort()).toEqual(['age', 'height', 'weight']);
    });
});
// ===========================================================================
// 5. Multiple fields validated together
// ===========================================================================
describe('validateCalculatorInput - multiple fields', () => {
    test('all valid => isValid true, no errors, no warnings', () => {
        const res = validateCalculatorInput({ age: 30, weight: 70, height: 170, heartRate: 72 }, {
            age: ValidationRules.age,
            weight: ValidationRules.weight,
            height: ValidationRules.height,
            heartRate: ValidationRules.heartRate
        });
        expect(res.isValid).toBe(true);
        expect(res.hasWarnings).toBe(false);
        expect(res.errors.length).toBe(0);
        expect(res.warnings.length).toBe(0);
    });
    test('one field error does not prevent other fields from being checked', () => {
        const res = validateCalculatorInput({ age: -5, weight: 70 }, {
            age: ValidationRules.age,
            weight: ValidationRules.weight
        });
        expect(res.isValid).toBe(false);
        expect(res.fieldStatus.age).toBe('error');
        expect(res.fieldStatus.weight).toBe('valid');
    });
    test('mix of errors and warnings', () => {
        const res = validateCalculatorInput({ age: -5, weight: 15 }, {
            age: ValidationRules.age, // -5 < 0 => error
            weight: ValidationRules.weight // 15 >= 0.5 but < 30 => warning
        });
        expect(res.isValid).toBe(false);
        expect(res.hasWarnings).toBe(true);
        expect(res.fieldStatus.age).toBe('error');
        expect(res.fieldStatus.weight).toBe('warning');
    });
    test('multiple errors accumulate in errors array', () => {
        const res = validateCalculatorInput({ age: -5, weight: -1, height: 999 }, {
            age: ValidationRules.age,
            weight: ValidationRules.weight,
            height: ValidationRules.height
        });
        expect(res.isValid).toBe(false);
        expect(res.errors.length).toBe(3);
    });
    test('multiple warnings accumulate in warnings array', () => {
        const res = validateCalculatorInput({ age: 0.5, weight: 15 }, {
            age: ValidationRules.age, // 0.5 < warnMin(1) => warning
            weight: ValidationRules.weight // 15 < warnMin(30) => warning
        });
        expect(res.isValid).toBe(true);
        expect(res.hasWarnings).toBe(true);
        expect(res.warnings.length).toBe(2);
    });
});
// ===========================================================================
// 6. Custom validator function - advanced scenarios
// ===========================================================================
describe('validateCalculatorInput - custom validators', () => {
    test('custom validator returning false uses rule.message as fallback', () => {
        const res = validateCalculatorInput({ x: 5 }, { x: { custom: () => false, message: 'Custom fail msg' } });
        expect(res.isValid).toBe(false);
        expect(res.errors).toContain('Custom fail msg');
    });
    test('custom validator returning false with no message uses default', () => {
        const res = validateCalculatorInput({ x: 5 }, { x: { custom: () => false } });
        expect(res.isValid).toBe(false);
        expect(res.errors[0]).toBe('x validation failed');
    });
    test('custom validator returning empty string uses rule.message fallback', () => {
        const res = validateCalculatorInput({ x: 5 }, { x: { custom: () => '', message: 'Fallback' } });
        expect(res.isValid).toBe(false);
        expect(res.errors).toContain('Fallback');
    });
    test('custom validator receives the full input object as second argument', () => {
        let receivedInput = null;
        const schema = {
            systolic: {
                custom: (_value, input) => {
                    receivedInput = input;
                    return true;
                }
            }
        };
        const fullInput = { systolic: 120, diastolic: 80 };
        validateCalculatorInput(fullInput, schema);
        expect(receivedInput).toEqual(fullInput);
    });
    test('custom validator can cross-reference fields', () => {
        const schema = {
            diastolic: {
                custom: (value, input) => {
                    if (input.systolic !== undefined && value >= input.systolic) {
                        return 'Diastolic must be less than systolic';
                    }
                    return true;
                }
            }
        };
        const res = validateCalculatorInput({ systolic: 120, diastolic: 130 }, schema);
        expect(res.isValid).toBe(false);
        expect(res.errors).toContain('Diastolic must be less than systolic');
    });
    test('custom validator combined with min/max -- both can produce errors', () => {
        const schema = {
            value: {
                min: 0,
                max: 100,
                custom: (v) => (v % 2 === 0 ? true : 'Must be even')
            }
        };
        // Value is within range but odd => custom error only
        const res1 = validateCalculatorInput({ value: 5 }, schema);
        expect(res1.isValid).toBe(false);
        expect(res1.errors).toContain('Must be even');
        // Value is out of range AND odd => both errors (min/max error + custom error)
        const res2 = validateCalculatorInput({ value: -3 }, schema);
        expect(res2.isValid).toBe(false);
        expect(res2.errors.length).toBe(2);
    });
    test('custom validator is not invoked for null/undefined on non-required field', () => {
        let called = false;
        const schema = {
            x: {
                custom: () => {
                    called = true;
                    return true;
                }
            }
        };
        validateCalculatorInput({ x: null }, schema);
        expect(called).toBe(false);
    });
    test('custom validator is not invoked for empty string on non-required field', () => {
        let called = false;
        const schema = {
            x: {
                custom: () => {
                    called = true;
                    return true;
                }
            }
        };
        validateCalculatorInput({ x: '' }, schema);
        expect(called).toBe(false);
    });
});
// ===========================================================================
// 7. Pattern validation - advanced
// ===========================================================================
describe('validateCalculatorInput - pattern validation', () => {
    test('pattern combined with min/max: pattern fail adds error even if range valid', () => {
        const schema = {
            code: {
                min: 0,
                max: 9999,
                pattern: /^\d{4}$/,
                message: 'Must be 4-digit code'
            }
        };
        // "12" converts to number 12 (in range) but fails /^\d{4}$/ pattern
        const res = validateCalculatorInput({ code: '12' }, schema);
        expect(res.isValid).toBe(false);
        expect(res.errors).toContain('Must be 4-digit code');
    });
    test('pattern is not checked for null/undefined/empty on non-required field', () => {
        const schema = {
            code: { pattern: /^\d{4}$/ }
        };
        const res1 = validateCalculatorInput({ code: null }, schema);
        expect(res1.isValid).toBe(true);
        const res2 = validateCalculatorInput({ code: '' }, schema);
        expect(res2.isValid).toBe(true);
    });
    test('pattern passes and value in range => fully valid', () => {
        const schema = {
            code: {
                min: 1000,
                max: 9999,
                pattern: /^\d{4}$/
            }
        };
        const res = validateCalculatorInput({ code: '1234' }, schema);
        expect(res.isValid).toBe(true);
        expect(res.fieldStatus.code).toBe('valid');
    });
});
// ===========================================================================
// 8. validateOrThrow
// ===========================================================================
describe('validateOrThrow', () => {
    test('does not throw when validation passes', () => {
        expect(() => {
            validateOrThrow({ age: 30 }, { age: ValidationRules.age });
        }).not.toThrow();
    });
    test('throws ValidationError when validation fails', () => {
        expect(() => {
            validateOrThrow({ age: -5 }, { age: ValidationRules.age });
        }).toThrow(ValidationError);
    });
    test('thrown error message contains all errors joined by semicolon', () => {
        try {
            validateOrThrow({ age: -5, weight: -1 }, { age: ValidationRules.age, weight: ValidationRules.weight });
            // Should not reach here
            expect(true).toBe(false);
        }
        catch (e) {
            expect(e).toBeInstanceOf(ValidationError);
            expect(e.message).toContain(';');
            expect(e.message).toContain(ValidationRules.age.message);
            expect(e.message).toContain(ValidationRules.weight.message);
        }
    });
    test('thrown error has details with input and errors', () => {
        try {
            validateOrThrow({ age: 999 }, { age: ValidationRules.age });
            expect(true).toBe(false);
        }
        catch (e) {
            expect(e.details).toBeDefined();
            expect(e.details.input).toEqual({ age: 999 });
            expect(Array.isArray(e.details.errors)).toBe(true);
            expect(e.details.errors.length).toBeGreaterThan(0);
        }
    });
    test('does not throw for warnings (only errors trigger throw)', () => {
        // 0.5 is in the warning zone (>= min 0, < warnMin 1) but not an error
        expect(() => {
            validateOrThrow({ age: 0.5 }, { age: ValidationRules.age });
        }).not.toThrow();
    });
    test('thrown error has code VALIDATION_ERROR', () => {
        try {
            validateOrThrow({ age: -5 }, { age: ValidationRules.age });
            expect(true).toBe(false);
        }
        catch (e) {
            expect(e.code).toBe('VALIDATION_ERROR');
        }
    });
});
// ===========================================================================
// 9. Default message generation
// ===========================================================================
describe('validateCalculatorInput - default messages', () => {
    test('required field with no custom message uses "<key> is required"', () => {
        const res = validateCalculatorInput({ myField: null }, { myField: { required: true } });
        expect(res.errors[0]).toBe('myField is required');
    });
    test('min violation with no custom message uses "must be at least <min>"', () => {
        const res = validateCalculatorInput({ myField: -1 }, { myField: { min: 0 } });
        expect(res.errors[0]).toBe('myField must be at least 0');
    });
    test('max violation with no custom message uses "must be at most <max>"', () => {
        const res = validateCalculatorInput({ myField: 200 }, { myField: { max: 100 } });
        expect(res.errors[0]).toBe('myField must be at most 100');
    });
    test('warnMin violation with no custom warningMessage uses default', () => {
        const res = validateCalculatorInput({ myField: 1 }, { myField: { min: 0, max: 100, warnMin: 5 } });
        expect(res.warnings[0]).toBe('myField is very low; double-check.');
    });
    test('warnMax violation with no custom warningMessage uses default', () => {
        const res = validateCalculatorInput({ myField: 90 }, { myField: { min: 0, max: 100, warnMax: 80 } });
        expect(res.warnings[0]).toBe('myField is very high; double-check.');
    });
    test('pattern failure with no custom message uses "format is incorrect"', () => {
        const res = validateCalculatorInput({ myField: 'abc' }, { myField: { pattern: /^\d+$/ } });
        expect(res.errors[0]).toBe('myField format is incorrect');
    });
});
// ===========================================================================
// 10. Ethanol rule (special: required=false)
// ===========================================================================
describe('ValidationRules.ethanol - non-required rule', () => {
    const rule = ValidationRules.ethanol;
    test('rule has required=false', () => {
        expect(rule.required).toBe(false);
    });
    test('missing value is valid (not required)', () => {
        const res = validateSingleField('ethanol', undefined, rule);
        expect(res.isValid).toBe(true);
    });
    test('value 0 is at min and valid', () => {
        const res = validateSingleField('ethanol', 0, rule);
        expect(res.isValid).toBe(true);
        expect(res.fieldStatus.ethanol).toBe('valid');
    });
    test('value 100 is valid, below warnMax', () => {
        const res = validateSingleField('ethanol', 100, rule);
        expect(res.isValid).toBe(true);
        expect(res.hasWarnings).toBe(false);
    });
    test('value 500 is above warnMax(400) => warning', () => {
        const res = validateSingleField('ethanol', 500, rule);
        expect(res.isValid).toBe(true);
        expect(res.hasWarnings).toBe(true);
        expect(res.fieldStatus.ethanol).toBe('warning');
    });
    test('value 1001 is above max(1000) => error', () => {
        const res = validateSingleField('ethanol', 1001, rule);
        expect(res.isValid).toBe(false);
        expect(res.fieldStatus.ethanol).toBe('error');
    });
    test('value -1 is below min(0) => error', () => {
        const res = validateSingleField('ethanol', -1, rule);
        expect(res.isValid).toBe(false);
        expect(res.fieldStatus.ethanol).toBe('error');
    });
});
// ===========================================================================
// 11. GCS rule (special: no warning zone)
// ===========================================================================
describe('ValidationRules.gcs - no warning zone', () => {
    const rule = ValidationRules.gcs;
    test('has no warnMin or warnMax', () => {
        expect(rule.warnMin).toBeUndefined();
        expect(rule.warnMax).toBeUndefined();
    });
    test('has no warningMessage', () => {
        expect(rule.warningMessage).toBeUndefined();
    });
    test.each([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15])('GCS %i is valid with no warning', (value) => {
        const res = validateSingleField('gcs', value, rule);
        expect(res.isValid).toBe(true);
        expect(res.hasWarnings).toBe(false);
        expect(res.fieldStatus.gcs).toBe('valid');
    });
    test('GCS 2 is below min => error', () => {
        const res = validateSingleField('gcs', 2, rule);
        expect(res.isValid).toBe(false);
        expect(res.fieldStatus.gcs).toBe('error');
    });
    test('GCS 16 is above max => error', () => {
        const res = validateSingleField('gcs', 16, rule);
        expect(res.isValid).toBe(false);
        expect(res.fieldStatus.gcs).toBe('error');
    });
});
// ===========================================================================
// 12. FiO2 rule (special: no warning zone, fractional range)
// ===========================================================================
describe('ValidationRules.fiO2 - fractional range, no warning zone', () => {
    const rule = ValidationRules.fiO2;
    test('0.21 (room air) is valid', () => {
        const res = validateSingleField('fiO2', 0.21, rule);
        expect(res.isValid).toBe(true);
        expect(res.fieldStatus.fiO2).toBe('valid');
    });
    test('1.0 (100% O2) is valid', () => {
        const res = validateSingleField('fiO2', 1.0, rule);
        expect(res.isValid).toBe(true);
        expect(res.fieldStatus.fiO2).toBe('valid');
    });
    test('0.5 is valid', () => {
        const res = validateSingleField('fiO2', 0.5, rule);
        expect(res.isValid).toBe(true);
    });
    test('0.20 is below min => error', () => {
        const res = validateSingleField('fiO2', 0.20, rule);
        expect(res.isValid).toBe(false);
    });
    test('1.01 is above max => error', () => {
        const res = validateSingleField('fiO2', 1.01, rule);
        expect(res.isValid).toBe(false);
    });
    test('0 is below min => error', () => {
        const res = validateSingleField('fiO2', 0, rule);
        expect(res.isValid).toBe(false);
    });
});
// ===========================================================================
// 13. pH rule (special: tight fractional ranges)
// ===========================================================================
describe('ValidationRules.pH - tight fractional ranges', () => {
    const rule = ValidationRules.pH;
    test('pH 7.4 (normal) is in green zone', () => {
        const res = validateSingleField('pH', 7.4, rule);
        expect(res.isValid).toBe(true);
        expect(res.hasWarnings).toBe(false);
        expect(res.fieldStatus.pH).toBe('valid');
    });
    test('pH 7.0 is in yellow zone (below warnMin 7.25)', () => {
        const res = validateSingleField('pH', 7.0, rule);
        expect(res.isValid).toBe(true);
        expect(res.hasWarnings).toBe(true);
        expect(res.fieldStatus.pH).toBe('warning');
    });
    test('pH 7.6 is in yellow zone (above warnMax 7.55)', () => {
        const res = validateSingleField('pH', 7.6, rule);
        expect(res.isValid).toBe(true);
        expect(res.hasWarnings).toBe(true);
        expect(res.fieldStatus.pH).toBe('warning');
    });
    test('pH 6.4 is in red zone (below min 6.5)', () => {
        const res = validateSingleField('pH', 6.4, rule);
        expect(res.isValid).toBe(false);
        expect(res.fieldStatus.pH).toBe('error');
    });
    test('pH 8.1 is in red zone (above max 8.0)', () => {
        const res = validateSingleField('pH', 8.1, rule);
        expect(res.isValid).toBe(false);
        expect(res.fieldStatus.pH).toBe('error');
    });
    test('pH 7.25 (exactly at warnMin) is green', () => {
        const res = validateSingleField('pH', 7.25, rule);
        expect(res.isValid).toBe(true);
        expect(res.fieldStatus.pH).toBe('valid');
    });
    test('pH 7.55 (exactly at warnMax) is green', () => {
        const res = validateSingleField('pH', 7.55, rule);
        expect(res.isValid).toBe(true);
        expect(res.fieldStatus.pH).toBe('valid');
    });
});
// ===========================================================================
// 14. fieldStatus correctness across zones using test.each
// ===========================================================================
describe('fieldStatus correctness - test.each across zones', () => {
    // Pick a representative rule with all four boundaries for detailed boundary probing
    // age: min=0, warnMin=1, warnMax=120, max=150
    const rule = ValidationRules.age;
    test.each([
        // [value, expectedStatus, description]
        [-1, 'error', 'below min'],
        [0, 'warning', 'exactly at min, below warnMin'],
        [0.5, 'warning', 'between min and warnMin'],
        [1, 'valid', 'exactly at warnMin'],
        [30, 'valid', 'mid-range green zone'],
        [120, 'valid', 'exactly at warnMax'],
        [121, 'warning', 'just above warnMax'],
        [135, 'warning', 'between warnMax and max'],
        [150, 'warning', 'exactly at max, above warnMax'],
        [151, 'error', 'above max'],
    ])('age=%s => fieldStatus="%s" (%s)', (value, expectedStatus, _desc) => {
        const res = validateSingleField('age', value, rule);
        expect(res.fieldStatus.age).toBe(expectedStatus);
    });
});
// ===========================================================================
// 15. Comprehensive count - ensure ALL_RULES covers every key in ValidationRules
// ===========================================================================
describe('ALL_RULES test catalogue completeness', () => {
    test('ALL_RULES covers every key in ValidationRules', () => {
        const cataloguedNames = new Set(ALL_RULES.map(r => r.name));
        const actualNames = Object.keys(ValidationRules);
        for (const name of actualNames) {
            expect(cataloguedNames.has(name)).toBe(true);
        }
    });
    test('ALL_RULES has no extra entries not in ValidationRules', () => {
        const actualNames = new Set(Object.keys(ValidationRules));
        for (const entry of ALL_RULES) {
            expect(actualNames.has(entry.name)).toBe(true);
        }
    });
    test('ALL_RULES min/max/warnMin/warnMax match the actual rule values', () => {
        for (const entry of ALL_RULES) {
            const rule = ValidationRules[entry.name];
            expect(rule.min).toBe(entry.min);
            expect(rule.max).toBe(entry.max);
            expect(rule.warnMin).toBe(entry.warnMin);
            expect(rule.warnMax).toBe(entry.warnMax);
        }
    });
});
