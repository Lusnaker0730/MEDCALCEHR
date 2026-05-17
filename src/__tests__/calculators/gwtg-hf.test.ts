/**
 * GWTG-HF Calculator - SaMD Verification Tests
 *
 * Formula: Sum of points from SBP, BUN, Na, Age, HR, COPD, Race.
 */

import { calculateGwtgHf } from '../../calculators/gwtg-hf/calculation';

describe('GWTG-HF Calculator', () => {
    // ===========================================
    // TC-001: Standard Calculation Tests
    // ===========================================

    // Case 1: Low Risk (score < 34 → "Low Risk", mortality '<1%' when ≤33)
    // SBP 150 (9), BUN 10 (2), Na 130 (4), Age 35 (6), HR 65 (0),
    // COPD No (0), Race No (0)
    // Total: 21
    test('Low Risk Case', () => {
        const result = calculateGwtgHf({
            'gwtg-sbp': '150',
            'gwtg-bun': '10',
            'gwtg-sodium': '130',
            'gwtg-age': '35',
            'gwtg-hr': '65',
            copd: '0',
            race: '0'
        });

        expect(result).not.toBeNull();
        const scoreItem = result!.find(r => r.label === 'GWTG-HF Score');
        const score = parseInt(scoreItem!.value as string, 10);
        expect(score).toBe(21);
        const mortItem = result!.find(r => r.label === 'In-hospital Mortality');
        expect(mortItem!.value).toBe('<1%');
        expect(scoreItem!.interpretation).toBe('Low Risk');
    });

    // Case 2: High Risk (score ≥75 → "High Risk", mortality '>50%' when ≥79)
    // SBP 50 (28), BUN 150 (28), Na 130 (4), Age 100 (25), HR 150 (8),
    // COPD Yes (2), Race No (0)
    // Total: 28+28+4+25+8+2 = 95
    test('High Risk Case', () => {
        const result = calculateGwtgHf({
            'gwtg-sbp': '50',
            'gwtg-bun': '150',
            'gwtg-sodium': '130',
            'gwtg-age': '100',
            'gwtg-hr': '150',
            copd: '2',
            race: '0'
        });

        expect(result).not.toBeNull();
        const scoreItem = result!.find(r => r.label === 'GWTG-HF Score');
        const score = parseInt(scoreItem!.value as string, 10);
        expect(score).toBe(95);
        const mortItem = result!.find(r => r.label === 'In-hospital Mortality');
        expect(mortItem!.value).toBe('>50%');
        expect(scoreItem!.interpretation).toBe('High Risk');
    });

    // ===========================================
    // TC-002: Validation
    // ===========================================
    test('Should return empty for missing inputs', () => {
        const result = calculateGwtgHf({
            'gwtg-sbp': '150'
            // Partial inputs
        });
        expect(result).toHaveLength(0);
    });
});
