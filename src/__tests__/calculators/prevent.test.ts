/**
 * PREVENT Risk Calculator — unit tests.
 *
 * Reference values are taken from the test suite of the open-source `preventr`
 * R package (github.com/martingmayer/preventr), which is itself validated
 * against the supplementary tables of Khan SS et al., Circulation 2024.
 */

import { describe, expect, test } from '@jest/globals';
import {
    calculatePrevent,
    calculatePreventOnce,
    calculateEgfr,
    selectModel,
    preventCalculationFromValues,
    type PreventPatient
} from '../../calculators/prevent/calculation.js';
import { ValidationError } from '../../errorHandler.js';

// Shared baseline patient — mirrors preventr's `estimate_risk_partial()` defaults
const basePatient: PreventPatient = {
    age: 50,
    sex: 'female',
    sbp: 160,
    onAntihypertensive: true,
    totalCholesterol: 200,
    hdl: 45,
    onStatin: false,
    diabetes: true,
    smoking: false,
    egfr: 90,
    bmi: 35
};

describe('PREVENT — base model, female reference patient', () => {
    test('matches Khan 2024 reference 10-year risks', () => {
        const risks = calculatePreventOnce(basePatient, 'base', '10yr');
        // Expected from preventr test suite (rounded to 3dp)
        expect(risks.totalCvd).toBeCloseTo(0.147, 2);
        expect(risks.ascvd).toBeCloseTo(0.092, 2);
        expect(risks.heartFailure).toBeCloseTo(0.081, 2);
        expect(risks.chd).toBeCloseTo(0.044, 2);
        expect(risks.stroke).toBeCloseTo(0.054, 2);
    });

    test('matches Khan 2024 reference 30-year risks', () => {
        const risks = calculatePreventOnce(basePatient, 'base', '30yr');
        expect(risks.totalCvd).toBeCloseTo(0.53, 2);
        expect(risks.ascvd).toBeCloseTo(0.354, 2);
        expect(risks.heartFailure).toBeCloseTo(0.39, 2);
        expect(risks.chd).toBeCloseTo(0.198, 2);
        expect(risks.stroke).toBeCloseTo(0.221, 2);
    });
});

describe('PREVENT — HbA1c add-on', () => {
    test('female, hba1c=9.2 → 10-year risks match reference', () => {
        const p = { ...basePatient, hba1c: 9.2 };
        const risks = calculatePreventOnce(p, 'hba1c', '10yr');
        expect(risks.totalCvd).toBeCloseTo(0.165, 2);
        expect(risks.ascvd).toBeCloseTo(0.103, 2);
        expect(risks.heartFailure).toBeCloseTo(0.107, 2);
    });

    test('selectModel chooses hba1c when only HbA1c present', () => {
        expect(selectModel(true, false)).toBe('hba1c');
    });
});

describe('PREVENT — UACR add-on', () => {
    test('female, uacr=92 → 10-year risks match reference', () => {
        const p = { ...basePatient, uacr: 92 };
        const risks = calculatePreventOnce(p, 'uacr', '10yr');
        expect(risks.totalCvd).toBeCloseTo(0.181, 2);
        expect(risks.ascvd).toBeCloseTo(0.111, 2);
        expect(risks.heartFailure).toBeCloseTo(0.105, 2);
    });

    test('selectModel chooses uacr when only UACR present', () => {
        expect(selectModel(false, true)).toBe('uacr');
    });
});

describe('PREVENT — model selection', () => {
    test('base when no optional inputs', () => {
        expect(selectModel(false, false)).toBe('base');
    });

    test('full when both HbA1c and UACR present', () => {
        expect(selectModel(true, true)).toBe('full');
    });
});

describe('PREVENT — calculatePrevent auto-selects model', () => {
    test('selects base model when no optionals', () => {
        const out = calculatePrevent(basePatient);
        expect(out.model).toBe('base');
        expect(out.tenYear.totalCvd).toBeCloseTo(0.147, 2);
        expect(out.thirtyYear.totalCvd).toBeCloseTo(0.53, 2);
    });

    test('selects hba1c model when hba1c provided', () => {
        const out = calculatePrevent({ ...basePatient, hba1c: 9.2 });
        expect(out.model).toBe('hba1c');
        expect(out.tenYear.totalCvd).toBeCloseTo(0.165, 2);
    });
});

describe('PREVENT — male reference patient (sex symmetry)', () => {
    test('produces plausible non-zero risk for low-risk male', () => {
        const p: PreventPatient = {
            age: 45,
            sex: 'male',
            sbp: 120,
            onAntihypertensive: false,
            totalCholesterol: 180,
            hdl: 55,
            onStatin: false,
            diabetes: false,
            smoking: false,
            egfr: 95,
            bmi: 24
        };
        const out = calculatePrevent(p);
        expect(out.tenYear.totalCvd).toBeGreaterThan(0);
        expect(out.tenYear.totalCvd).toBeLessThan(0.1);
        expect(out.thirtyYear.totalCvd).toBeGreaterThan(out.tenYear.totalCvd);
    });

    test('high-risk male: diabetes + smoking + elevated SBP → markedly higher risk', () => {
        const p: PreventPatient = {
            age: 65,
            sex: 'male',
            sbp: 165,
            onAntihypertensive: true,
            totalCholesterol: 250,
            hdl: 35,
            onStatin: false,
            diabetes: true,
            smoking: true,
            egfr: 55,
            bmi: 32
        };
        const out = calculatePrevent(p);
        expect(out.tenYear.totalCvd).toBeGreaterThan(0.3);
        expect(out.tenYear.ascvd).toBeGreaterThan(0.2);
    });
});

describe('PREVENT — input validation', () => {
    test('rejects age < 30', () => {
        expect(() => calculatePrevent({ ...basePatient, age: 25 })).toThrow(ValidationError);
    });
    test('rejects age > 79', () => {
        expect(() => calculatePrevent({ ...basePatient, age: 85 })).toThrow(ValidationError);
    });
    test('rejects SBP out of 90-180', () => {
        expect(() => calculatePrevent({ ...basePatient, sbp: 60 })).toThrow(ValidationError);
        expect(() => calculatePrevent({ ...basePatient, sbp: 220 })).toThrow(ValidationError);
    });
    test('rejects HDL >= TC', () => {
        expect(() => calculatePrevent({ ...basePatient, totalCholesterol: 200, hdl: 200 })).toThrow(
            ValidationError
        );
    });
    test('rejects BMI out of 18.5-39.9', () => {
        expect(() => calculatePrevent({ ...basePatient, bmi: 15 })).toThrow(ValidationError);
        expect(() => calculatePrevent({ ...basePatient, bmi: 50 })).toThrow(ValidationError);
    });
    test('rejects eGFR out of 15-140', () => {
        expect(() => calculatePrevent({ ...basePatient, egfr: 10 })).toThrow(ValidationError);
        expect(() => calculatePrevent({ ...basePatient, egfr: 200 })).toThrow(ValidationError);
    });
});

describe('CKD-EPI 2021 (race-free) — eGFR derivation', () => {
    // Inker et al. NEJM 2021;385:1737 — published table examples
    test('female, age 50, Cr 1.0 mg/dL → ~70-72', () => {
        const v = calculateEgfr(1.0, 50, 'female');
        expect(v).toBeGreaterThan(67);
        expect(v).toBeLessThan(75);
    });
    test('male, age 50, Cr 1.0 mg/dL → ~92', () => {
        const v = calculateEgfr(1.0, 50, 'male');
        expect(v).toBeGreaterThan(85);
        expect(v).toBeLessThan(100);
    });
});

describe('PREVENT — UI value pipeline (preventCalculationFromValues)', () => {
    test('builds correct results array from form values', () => {
        const result = preventCalculationFromValues({
            'prevent-age': 50,
            'prevent-sex': 'female',
            'prevent-sbp': 160,
            'prevent-htn-tx': 'yes',
            'prevent-tc': 200,
            'prevent-hdl': 45,
            'prevent-statin': 'no',
            'prevent-dm': 'yes',
            'prevent-smoking': 'no',
            'prevent-egfr': 90,
            'prevent-bmi': 35
        });
        expect(result.results.length).toBeGreaterThanOrEqual(3);
        expect(result.results[0].label).toContain('10-Year Total CVD');
        // Value is a string formatted as "14.7"
        expect(parseFloat(result.results[0].value)).toBeCloseTo(14.7, 1);
        expect(result.estimate.model).toBe('base');
    });

    test('derives eGFR from creatinine when eGFR not given', () => {
        const result = preventCalculationFromValues({
            'prevent-age': 50,
            'prevent-sex': 'female',
            'prevent-sbp': 160,
            'prevent-htn-tx': 'yes',
            'prevent-tc': 200,
            'prevent-hdl': 45,
            'prevent-statin': 'no',
            'prevent-dm': 'yes',
            'prevent-smoking': 'no',
            // No eGFR — provide creatinine instead
            'prevent-creatinine': 0.7,
            'prevent-bmi': 35
        });
        // CKD-EPI 2021 for female, age 50, Cr 0.7 → ~96
        expect(result.patient.egfr).toBeGreaterThan(85);
        expect(result.patient.egfr).toBeLessThan(110);
    });

    test('throws when neither eGFR nor creatinine present', () => {
        expect(() =>
            preventCalculationFromValues({
                'prevent-age': 50,
                'prevent-sex': 'female',
                'prevent-sbp': 160,
                'prevent-htn-tx': 'yes',
                'prevent-tc': 200,
                'prevent-hdl': 45,
                'prevent-statin': 'no',
                'prevent-dm': 'yes',
                'prevent-smoking': 'no',
                'prevent-bmi': 35
                // no eGFR, no creatinine
            })
        ).toThrow(ValidationError);
    });
});
