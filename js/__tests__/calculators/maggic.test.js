/**
 * MAGGIC Risk Score Calculator - SaMD Verification Tests
 *
 * Formula involves linear predictor and survival probability.
 */
import { calculateMaggic } from '../../calculators/maggic/calculation';
describe('MAGGIC Risk Calculator', () => {
    // ===========================================
    // TC-001: Standard Calculation Tests
    // ===========================================
    // Case 1: Low Risk
    // Total integer score = 3
    // Linear Predictor = 0.047 * (3 - 21.6) = -0.8742
    // Prob 1yr = 1 - 0.92^exp(-0.8742) = ~3.4%
    test('Low Risk Female Case', () => {
        const result = calculateMaggic({
            'maggic-age': '50',
            'maggic-gender': '0',
            'maggic-bmi': '27',
            'maggic-smoker': '0',
            'maggic-ef': '50',
            'maggic-sbp': '120',
            'maggic-creatinine': '0.8',
            'maggic-nyha': '0',
            'maggic-diabetes': '0',
            'maggic-copd': '0',
            'maggic-hfdx': '0',
            'maggic-bb': '0',
            'maggic-acei': '0'
        });
        expect(result).not.toBeNull();
        expect(result).toHaveLength(3);
        const points = parseFloat(result[0].value);
        expect(points).toBeCloseTo(3, 1);
        const prob1 = parseFloat(result[1].value);
        expect(prob1).toBeCloseTo(3.4, 1);
    });
    // Case 2: High Risk
    // Total discrete points = 40
    // LP = 0.047 * (40 - 21.6) = 0.8648
    // Prob 1yr = 1 - 0.92^exp(0.8648) = ~18.0%
    test('High Risk Male Case', () => {
        const result = calculateMaggic({
            'maggic-age': '70',
            'maggic-gender': '1',
            'maggic-bmi': '32',
            'maggic-smoker': '1',
            'maggic-ef': '25',
            'maggic-sbp': '100',
            'maggic-creatinine': '1.5',
            'maggic-nyha': '8',
            'maggic-diabetes': '3',
            'maggic-copd': '2',
            'maggic-hfdx': '2',
            'maggic-bb': '3',
            'maggic-acei': '1'
        });
        const points = parseFloat(result[0].value);
        expect(points).toBeCloseTo(40, 1);
        const prob1 = parseFloat(result[1].value);
        expect(prob1).toBeCloseTo(18.0, 1);
    });
    // ===========================================
    // TC-002: Validation
    // ===========================================
    test('Should return empty for missing inputs', () => {
        const result = calculateMaggic({});
        expect(result).toHaveLength(0);
    });
});
