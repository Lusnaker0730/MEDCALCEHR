import { phenytoinCorrectionCalculation } from '../../calculators/phenytoin-correction/calculation.js';

describe('Phenytoin Correction Calculator', () => {
    // Winter-Tozer: corrected = total / (adj × albumin + 0.1)
    // adj = 0.275 (normal renal), 0.2 (CrCl < 20 mL/min)
    // Albumin > 3.2 g/dL: no correction needed (returns total as-is)

    test('Should calculate for Normal Renal Function (adj=0.275, albumin 3.0)', () => {
        // total 8.0, albumin 3.0 (≤3.2, formula applies), renal 'no' → adj 0.275
        // denom = 0.275 × 3.0 + 0.1 = 0.925
        // corrected = 8.0 / 0.925 = 8.65 → 8.6
        const result = phenytoinCorrectionCalculation({
            'pheny-total': 8.0,
            'pheny-albumin': 3.0,
            'pheny-renal': 'no'
        });

        expect(result).toHaveLength(1);
        expect(result[0].value).toBe(8.6);
        expect(result[0].interpretation).toBe('Subtherapeutic');
        expect(result[0].alertClass).toBe('info');
    });

    test('Should calculate for Renal Failure (adj=0.2, albumin 3.0)', () => {
        // total 8.0, albumin 3.0, renal 'yes' → adj 0.2
        // denom = 0.2 × 3.0 + 0.1 = 0.7
        // corrected = 8.0 / 0.7 = 11.43 → 11.4
        const result = phenytoinCorrectionCalculation({
            'pheny-total': 8.0,
            'pheny-albumin': 3.0,
            'pheny-renal': 'yes'
        });

        expect(result).toHaveLength(1);
        expect(result[0].value).toBe(11.4);
        expect(result[0].interpretation).toBe('Therapeutic');
    });

    test('Should detect Subtherapeutic levels (formula applied)', () => {
        // total 5.0, albumin 3.0, renal 'no'
        // corrected = 5.0 / 0.925 = 5.41 → 5.4 (well below 10)
        const result = phenytoinCorrectionCalculation({
            'pheny-total': 5.0,
            'pheny-albumin': 3.0,
            'pheny-renal': 'no'
        });

        expect(result).toHaveLength(1);
        expect(result[0].value).toBe(5.4);
        expect(result[0].interpretation).toBe('Subtherapeutic');
        expect(result[0].alertClass).toBe('info');
    });

    test('Should detect Toxic levels (formula applied)', () => {
        // total 25.0, albumin 3.0, renal 'no'
        // corrected = 25.0 / 0.925 = 27.03 → 27.0 (>20)
        const result = phenytoinCorrectionCalculation({
            'pheny-total': 25.0,
            'pheny-albumin': 3.0,
            'pheny-renal': 'no'
        });

        expect(result).toHaveLength(1);
        expect(result[0].value).toBe(27.0);
        expect(result[0].interpretation).toBe('Potentially Toxic');
        expect(result[0].alertClass).toBe('danger');
    });

    test('Should skip correction when albumin > 3.2 (No correction needed)', () => {
        // albumin 4.4 > 3.2: returns measured total unchanged
        const result = phenytoinCorrectionCalculation({
            'pheny-total': 15.0,
            'pheny-albumin': 4.4,
            'pheny-renal': 'no'
        });
        expect(result).toHaveLength(1);
        expect(result[0].value).toBe(15.0);
        expect(result[0].interpretation).toBe('No correction needed');
        expect(result[0].alertClass).toBe('info');
    });

    test('Should returned empty for missing inputs', () => {
        const result = phenytoinCorrectionCalculation({
            'pheny-total': 8.0,
            'pheny-albumin': null as any,
            'pheny-renal': 'no'
        });
        expect(result).toHaveLength(0);
    });
});
