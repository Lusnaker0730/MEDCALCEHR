/**
 * GRACE ACS Calculator - SaMD Verification Tests
 *
 * Formula: Sum of age, HR, SBP, Cr, Killip, Arrest, ST, Enzymes points.
 */

import { calculateGraceAcs } from '../../calculators/grace-acs/calculation';

describe('GRACE ACS Calculator', () => {
    // ===========================================
    // TC-001: Standard Calculation Tests
    // ===========================================

    // Case 1: Low Risk
    // Age 30 (0)
    // HR 60 (3)
    // SBP 130 (34)
    // Cr 1.0 (7)
    // Killip I (0)
    // Others 0
    // Total: 0 + 3 + 34 + 7 = 44
    // Risk <= 108 -> Low
    test('Low Risk Case', () => {
        const result = calculateGraceAcs({
            'grace-age': '30',
            'grace-hr': '60',
            'grace-sbp': '130',
            'grace-creatinine': '1.0',
            'grace-killip': '0',
            'grace-cardiac-arrest': '0',
            'grace-st-deviation': '0',
            'grace-cardiac-enzymes': '0'
        });

        expect(result).not.toBeNull();
        const scoreItem = result!.find(r => r.label === 'Total GRACE Score');
        const score = parseInt(scoreItem!.value as string, 10);
        expect(score).toBe(44);
        expect(scoreItem!.interpretation).toBe('Low Risk');
    });

    // Case 2: High Risk
    // Age 80 (91)
    // HR 200 (46)
    // SBP 70 (58)
    // Cr 4.0 (28)
    // Killip IV (64)
    // Arrest Yes (39)
    // ST Yes (28)
    // Enzymes Yes (14)
    // Total: 91 + 46 + 58 + 28 + 64 + 39 + 28 + 14 = 368
    // Risk > 140 -> High
    test('High Risk Case', () => {
        const result = calculateGraceAcs({
            'grace-age': '80',
            'grace-hr': '200',
            'grace-sbp': '70',
            'grace-creatinine': '4.0',
            'grace-killip': '64',
            'grace-cardiac-arrest': '39',
            'grace-st-deviation': '28',
            'grace-cardiac-enzymes': '14'
        });

        expect(result).not.toBeNull();
        const scoreItem = result!.find(r => r.label === 'Total GRACE Score');
        const score = parseInt(scoreItem!.value as string, 10);
        expect(score).toBe(368);
        expect(scoreItem!.interpretation).toBe('High Risk');
    });

    // Case 3: Intermediate Risk - regression test for threshold fix
    // Score 110 should be Intermediate (109-140 per Granger 2003)
    // Age 60 (58) + HR 75 (9) + SBP 130 (34) + Cr 0.5 (4) = 105 ... need 5 more
    // Make it: Age 60 (58) + HR 75 (9) + SBP 130 (34) + Cr 1.0 (7) + Killip II (21) = 129
    test('Intermediate Risk - score in 109-140 range', () => {
        const result = calculateGraceAcs({
            'grace-age': '60',
            'grace-hr': '75',
            'grace-sbp': '130',
            'grace-creatinine': '1.0',
            'grace-killip': '21',
            'grace-cardiac-arrest': '0',
            'grace-st-deviation': '0',
            'grace-cardiac-enzymes': '0'
        });

        expect(result).not.toBeNull();
        const scoreItem = result!.find(r => r.label === 'Total GRACE Score');
        const score = parseInt(scoreItem!.value as string, 10);
        expect(score).toBe(129);
        expect(scoreItem!.interpretation).toBe('Intermediate Risk');
    });

    // ===========================================
    // TC-002: Validation
    // ===========================================
    test('Should return empty for missing numeric inputs', () => {
        const result = calculateGraceAcs({
            'grace-age': '50'
            // Missing others
        });
        expect(result).toHaveLength(0);
    });
});
