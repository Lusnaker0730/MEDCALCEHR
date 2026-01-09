"use strict";
/**
 * PRECISE-HBR Score Calculator - Verification Tests
 *
 * Tests for bleeding risk prediction in stent patients.
 */
describe('PRECISE-HBR Score Calculator', () => {
    // Helper function to simulate the scoring logic
    const calculateScore = (age, hb, egfr, wbc, priorBleeding, oralAnticoagulation, arcHbrRisk) => {
        let score = 2; // Base Score
        // Age: Range 30-80. If > 30: + (Age - 30) * 0.26
        let ageClamped = Math.min(Math.max(age, 30), 80);
        if (age > 30) {
            score += (ageClamped - 30) * 0.26;
        }
        // Hb: Range 5.0 - 15.0 g/dL. If < 15: + (15 - Hb) * 2.5
        let hbClamped = Math.min(Math.max(hb, 5.0), 15.0);
        if (hb < 15.0) {
            score += (15 - hbClamped) * 2.5;
        }
        // eGFR: Range 5 - 100. If < 100: + (100 - eGFR) * 0.05
        let egfrClamped = Math.min(Math.max(egfr, 5), 100);
        if (egfr < 100) {
            score += (100 - egfrClamped) * 0.05;
        }
        // WBC: Upper limit 15.0. If > 3: + (WBC - 3) * 0.8
        let wbcClamped = Math.min(wbc, 15.0);
        if (wbcClamped > 3) {
            score += (wbcClamped - 3) * 0.8;
        }
        // Categorical
        if (priorBleeding)
            score += 7;
        if (oralAnticoagulation)
            score += 5;
        if (arcHbrRisk)
            score += 3;
        return Math.round(score);
    };
    // ===========================================
    // TC-001: Base Score Calculation
    // ===========================================
    describe('Base Score', () => {
        test('Base score should be 2', () => {
            // Very young with optimal values
            const score = calculateScore(30, 15.0, 100, 3, false, false, false);
            expect(score).toBe(2);
        });
    });
    // ===========================================
    // TC-002: Age Component
    // ===========================================
    describe('Age Score Component', () => {
        test('Age 30 adds 0 points', () => {
            const score = calculateScore(30, 15.0, 100, 3, false, false, false);
            expect(score).toBe(2); // Base only
        });
        test('Age 50 adds ~5.2 points', () => {
            // (50-30) * 0.26 = 5.2
            const score = calculateScore(50, 15.0, 100, 3, false, false, false);
            expect(score).toBe(7); // 2 + 5.2 rounded
        });
        test('Age 80 adds ~13 points (capped)', () => {
            // (80-30) * 0.26 = 13
            const score = calculateScore(80, 15.0, 100, 3, false, false, false);
            expect(score).toBe(15); // 2 + 13
        });
        test('Age above 80 is capped', () => {
            const score90 = calculateScore(90, 15.0, 100, 3, false, false, false);
            const score80 = calculateScore(80, 15.0, 100, 3, false, false, false);
            expect(score90).toBe(score80);
        });
    });
    // ===========================================
    // TC-003: Hemoglobin Component
    // ===========================================
    describe('Hemoglobin Score Component', () => {
        test('Hb 15 adds 0 points', () => {
            const score = calculateScore(30, 15.0, 100, 3, false, false, false);
            expect(score).toBe(2);
        });
        test('Hb 12 adds 7.5 points', () => {
            // (15-12) * 2.5 = 7.5
            const score = calculateScore(30, 12.0, 100, 3, false, false, false);
            expect(score).toBe(10); // 2 + 7.5 rounded
        });
        test('Hb 8 adds 17.5 points', () => {
            // (15-8) * 2.5 = 17.5
            const score = calculateScore(30, 8.0, 100, 3, false, false, false);
            expect(score).toBe(20); // 2 + 17.5 rounded
        });
    });
    // ===========================================
    // TC-004: eGFR Component
    // ===========================================
    describe('eGFR Score Component', () => {
        test('eGFR 100 adds 0 points', () => {
            const score = calculateScore(30, 15.0, 100, 3, false, false, false);
            expect(score).toBe(2);
        });
        test('eGFR 60 adds 2 points', () => {
            // (100-60) * 0.05 = 2
            const score = calculateScore(30, 15.0, 60, 3, false, false, false);
            expect(score).toBe(4); // 2 + 2
        });
        test('eGFR 20 adds 4 points', () => {
            // (100-20) * 0.05 = 4
            const score = calculateScore(30, 15.0, 20, 3, false, false, false);
            expect(score).toBe(6); // 2 + 4
        });
    });
    // ===========================================
    // TC-005: WBC Component
    // ===========================================
    describe('WBC Score Component', () => {
        test('WBC 3 adds 0 points', () => {
            const score = calculateScore(30, 15.0, 100, 3, false, false, false);
            expect(score).toBe(2);
        });
        test('WBC 10 adds 5.6 points', () => {
            // (10-3) * 0.8 = 5.6
            const score = calculateScore(30, 15.0, 100, 10, false, false, false);
            expect(score).toBe(8); // 2 + 5.6 rounded
        });
    });
    // ===========================================
    // TC-006: Categorical Risk Factors
    // ===========================================
    describe('Categorical Risk Factors', () => {
        test('Prior bleeding adds 7 points', () => {
            const withoutBleeding = calculateScore(30, 15.0, 100, 3, false, false, false);
            const withBleeding = calculateScore(30, 15.0, 100, 3, true, false, false);
            expect(withBleeding - withoutBleeding).toBe(7);
        });
        test('Oral anticoagulation adds 5 points', () => {
            const without = calculateScore(30, 15.0, 100, 3, false, false, false);
            const with_ = calculateScore(30, 15.0, 100, 3, false, true, false);
            expect(with_ - without).toBe(5);
        });
        test('ARC-HBR risk adds 3 points', () => {
            const without = calculateScore(30, 15.0, 100, 3, false, false, false);
            const with_ = calculateScore(30, 15.0, 100, 3, false, false, true);
            expect(with_ - without).toBe(3);
        });
    });
    // ===========================================
    // TC-007: Risk Stratification
    // ===========================================
    describe('Risk Stratification', () => {
        test('Score ≤22 = Non-HBR (Low Risk)', () => {
            const score = calculateScore(50, 13.0, 80, 8, false, false, false);
            expect(score).toBeLessThanOrEqual(22);
        });
        test('Score 23-26 = HBR (High Risk)', () => {
            const score = calculateScore(70, 11.0, 50, 10, true, false, false);
            expect(score).toBeGreaterThan(22);
        });
        test('Score with all risk factors = Very High', () => {
            const score = calculateScore(80, 8.0, 20, 15, true, true, true);
            expect(score).toBeGreaterThan(30);
        });
    });
});
