/**
 * Growth Chart Calculator - Verification Tests
 *
 * Tests for pediatric growth calculations.
 */
import { calculateZScore, estimatePercentile, calculateBmiData, calculateVelocity, formatAge } from '../../calculators/growth-chart/calculation';
describe('Growth Chart Calculator', () => {
    // ===========================================
    // TC-001: Z-Score Calculation
    // ===========================================
    describe('Z-Score Calculation', () => {
        test('Should return null for empty data array', () => {
            const result = calculateZScore(12, 75, []);
            expect(result).toBeNull();
        });
        test('Should return null for null/undefined data', () => {
            const result = calculateZScore(12, 75, null);
            expect(result).toBeNull();
        });
        test('Should return null when age is too far from reference point', () => {
            const cdcData = [{ Agemos: 24, P5: 80, P50: 86, P95: 92 }];
            const result = calculateZScore(12, 75, cdcData);
            expect(result).toBeNull();
        });
        test('Should calculate Z-score using LMS method when available', () => {
            const cdcData = [
                {
                    Agemos: 12,
                    L: 1,
                    M: 75,
                    S: 0.04,
                    P5: 70,
                    P50: 75,
                    P95: 80
                }
            ];
            const result = calculateZScore(12, 75, cdcData);
            expect(result).toBe(0); // At median
        });
        test('Should calculate Z-score using percentile fallback', () => {
            const cdcData = [
                {
                    Agemos: 12,
                    P5: 70,
                    P50: 75,
                    P95: 80
                }
            ];
            const result = calculateZScore(12, 75, cdcData);
            expect(result).toBeCloseTo(0, 1); // At P50, Z-score ≈ 0
        });
    });
    // ===========================================
    // TC-002: Percentile Estimation
    // ===========================================
    describe('Percentile Estimation', () => {
        test('Should return empty string for null Z-score', () => {
            expect(estimatePercentile(null)).toBe('');
        });
        test('Z-score 0 = 50th percentile', () => {
            expect(estimatePercentile(0)).toBe('50');
        });
        test('Z-score -2.5 = 3rd percentile', () => {
            expect(estimatePercentile(-2.5)).toBe('3');
        });
        test('Z-score 2.5 = >97th percentile', () => {
            expect(estimatePercentile(2.5)).toBe('>97');
        });
        test('Z-score -1.645 = 5th percentile', () => {
            expect(estimatePercentile(-1.645)).toBe('5');
        });
        test('Z-score 1.645 = 95th percentile', () => {
            expect(estimatePercentile(1.645)).toBe('95');
        });
    });
    // ===========================================
    // TC-003: BMI Data Calculation
    // ===========================================
    describe('BMI Data Calculation', () => {
        test('Should return empty array for empty inputs', () => {
            expect(calculateBmiData([], [])).toEqual([]);
            expect(calculateBmiData([{ ageMonths: 12, value: 75 }], [])).toEqual([]);
            expect(calculateBmiData([], [{ ageMonths: 12, value: 10 }])).toEqual([]);
        });
        test('Should calculate BMI correctly', () => {
            const heightData = [{ ageMonths: 24, value: 86 }]; // 86 cm
            const weightData = [{ ageMonths: 24, value: 12 }]; // 12 kg
            const bmiData = calculateBmiData(heightData, weightData);
            expect(bmiData.length).toBe(1);
            // BMI = 12 / (0.86)^2 = 12 / 0.7396 = 16.22
            expect(bmiData[0].value).toBeCloseTo(16.22, 1);
        });
        test('Should match closest height measurement', () => {
            const heightData = [
                { ageMonths: 12, value: 75 },
                { ageMonths: 24, value: 86 }
            ];
            const weightData = [{ ageMonths: 23.8, value: 12 }];
            const bmiData = calculateBmiData(heightData, weightData);
            expect(bmiData.length).toBe(1);
        });
    });
    // ===========================================
    // TC-004: Velocity Calculation
    // ===========================================
    describe('Growth Velocity Calculation', () => {
        test('Should return empty string for insufficient data', () => {
            expect(calculateVelocity('Height', [], 'cm/month')).toBe('');
            expect(calculateVelocity('Height', [{ ageMonths: 12, value: 75 }], 'cm/month')).toBe('');
        });
        test('Should calculate positive velocity', () => {
            const measurements = [
                { ageMonths: 12, value: 75 },
                { ageMonths: 18, value: 81 }
            ];
            const result = calculateVelocity('Height', measurements, 'cm/month');
            expect(result).toContain('Height Velocity');
            expect(result).toContain('+'); // Positive growth
            expect(result).toContain('months'); // Time period
        });
    });
    // ===========================================
    // TC-005: Age Formatting
    // ===========================================
    describe('Age Formatting', () => {
        test('Should format months only', () => {
            expect(formatAge(5)).toBe('5m');
            expect(formatAge(11)).toBe('11m');
        });
        test('Should format years and months', () => {
            expect(formatAge(24)).toBe('2y 0m');
            expect(formatAge(30)).toBe('2y 6m');
            expect(formatAge(36)).toBe('3y 0m');
        });
        test('Should handle edge cases', () => {
            expect(formatAge(0)).toBe('0m');
            expect(formatAge(12)).toBe('1y 0m');
        });
    });
});
