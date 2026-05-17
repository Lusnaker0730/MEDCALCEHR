/**
 * Gupta MICA Calculator — SaMD Verification Tests
 *
 * Formula: Cardiac risk, % = [1/(1+e^-x)] × 100
 * x = -5.25 + Age*0.02 + Functional Status + ASA + Creatinine + Procedure
 *
 * Reference: Gupta PK, Gupta H, Sundaram A, et al. Development and validation
 * of a risk calculator for prediction of cardiac risk after surgery. Circulation.
 * 2011;124(4):381-387.
 *
 * Creatinine coefficients:
 *   <1.5 mg/dL  →  0
 *   ≥1.5 mg/dL  → +0.61
 *   Unknown     → −0.10
 */

import { calculateGuptaMica } from '../../calculators/gupta-mica/calculation';

describe('Gupta MICA Calculator', () => {
    // ===========================================
    // TC-001: Standard calculation — published ASA coefficients
    // ===========================================

    // Case 1: Low risk
    //   Age 40 (× 0.02 = 0.80), Independent (0), ASA 1 (-5.17), Cr 1.0 (0), Hernia (0)
    //   x = -5.25 + 0.80 + 0 + (-5.17) + 0 + 0 = -9.62
    //   risk = 1 / (1 + e^9.62) × 100 ≈ 0.0066 %
    test('Low risk — healthy adult, hernia repair', () => {
        const result = calculateGuptaMica({
            'mica-age': '40',
            'mica-status': '0',
            'mica-asa': '-5.17',
            'mica-creat': '1.0',
            'mica-procedure': '0'
        });

        expect(result).not.toHaveLength(0);
        const riskItem = result!.find(r => r.label === 'Cardiac Risk');
        const risk = parseFloat(riskItem!.value as string);
        expect(risk).toBeLessThan(0.1);
        expect(riskItem!.interpretation).toBe('Low Risk');
    });

    // Case 2: High risk
    //   Age 80 (1.60), Totally dependent (1.03), ASA 4 (-0.95), Cr 2.0 (+0.61), Aortic (+1.60)
    //   x = -5.25 + 1.60 + 1.03 + (-0.95) + 0.61 + 1.60 = -1.36
    //   risk = 1 / (1 + e^1.36) × 100 ≈ 20.4 %
    test('High risk — elderly, dependent, aortic surgery', () => {
        const result = calculateGuptaMica({
            'mica-age': '80',
            'mica-status': '1.03',
            'mica-asa': '-0.95',
            'mica-creat': '2.0',
            'mica-procedure': '1.60'
        });

        const riskItem = result!.find(r => r.label === 'Cardiac Risk');
        const risk = parseFloat(riskItem!.value as string);
        expect(risk).toBeGreaterThan(15);
        expect(risk).toBeLessThan(30);
        expect(riskItem!.interpretation).toBe('High Risk');
    });

    // ===========================================
    // TC-002: Creatinine Unknown path (audit-driven)
    // ===========================================

    test('Unknown creatinine — applies −0.10 coefficient (no creat value provided)', () => {
        const result = calculateGuptaMica({
            'mica-age': '60',
            'mica-status': '0',
            'mica-asa': '-1.92', // ASA 3
            'mica-creat-unknown': true,
            'mica-procedure': '1.13' // Other abdominal
        });

        expect(result).not.toHaveLength(0);
        const componentsItem = result!.find(r => r.label === 'Formula Components');
        expect(componentsItem).toBeDefined();
        // The components display should show the Unknown label and -0.10 coefficient
        expect(componentsItem!.alertPayload!.message).toContain('Unknown');
        expect(componentsItem!.alertPayload!.message).toContain('-0.10');

        // Sanity-check the math: x = -5.25 + 1.20 + 0 + -1.92 + -0.10 + 1.13 = -4.94
        // risk = 1/(1+e^4.94) × 100 ≈ 0.71 %
        const risk = parseFloat(result!.find(r => r.label === 'Cardiac Risk')!.value as string);
        expect(risk).toBeCloseTo(0.71, 1);
    });

    test('Unknown flag overrides a stale creatinine value', () => {
        // If both are present, explicit "Unknown" should win (defensive)
        const result = calculateGuptaMica({
            'mica-age': '60',
            'mica-status': '0',
            'mica-asa': '-1.92',
            'mica-creat': '2.5', // Would normally give +0.61
            'mica-creat-unknown': true, // But user marked Unknown
            'mica-procedure': '1.13'
        });

        const componentsItem = result!.find(r => r.label === 'Formula Components');
        expect(componentsItem!.alertPayload!.message).toContain('-0.10');
        expect(componentsItem!.alertPayload!.message).not.toContain('0.61');
    });

    // ===========================================
    // TC-003: Validation
    // ===========================================

    test('Returns empty when age is missing', () => {
        const result = calculateGuptaMica({
            'mica-creat': '1.0'
        });
        expect(result).toHaveLength(0);
    });

    test('Returns empty when neither creatinine nor Unknown flag are set', () => {
        const result = calculateGuptaMica({
            'mica-age': '50',
            'mica-asa': '-5.17'
            // No creat, no creat-unknown — should block
        });
        expect(result).toHaveLength(0);
    });

    test('Calculates when creatinine missing but Unknown flag set', () => {
        const result = calculateGuptaMica({
            'mica-age': '50',
            'mica-asa': '-5.17',
            'mica-creat-unknown': true
        });
        expect(result).not.toHaveLength(0);
    });
});
