/**
 * Growth Chart Calculator - Verification Tests
 *
 * Tests for pediatric growth calculations using Taiwan reference data.
 */

import { describe, expect, test } from '@jest/globals';
import {
    calculateZScore,
    estimatePercentile,
    calculateBmiData,
    calculateVelocity,
    formatAge,
    GrowthDataPoint
} from '../../calculators/growth-chart/calculation.js';

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
            const result = calculateZScore(12, 75, null as any);
            expect(result).toBeNull();
        });

        test('Should return null when age is outside reference range', () => {
            const refData = [
                { Agemos: 24, P3: 80, P15: 83, P25: 84, P50: 86, P75: 89, P85: 90, P97: 93 }
            ] as any[];
            // Age 12 is more than 3 months before the earliest data point (24)
            const result = calculateZScore(12, 75, refData);
            expect(result).toBeNull();
        });

        test('Should calculate Z-score using LMS method when available', () => {
            const refData = [
                {
                    Agemos: 12,
                    L: 1,
                    M: 75,
                    S: 0.04,
                    P3: 70, P15: 72, P25: 73, P50: 75, P75: 77, P85: 78, P97: 80
                }
            ] as any[];
            const result = calculateZScore(12, 75, refData);
            expect(result).toBe(0); // At median
        });

        test('Should calculate Z-score using percentile-based fallback (P3/P97)', () => {
            const refData = [
                {
                    Agemos: 12,
                    P3: 70, P15: 72, P25: 73, P50: 75, P75: 77, P85: 78, P97: 80
                }
            ] as any[];
            const result = calculateZScore(12, 75, refData);
            expect(result).toBeCloseTo(0, 1); // At P50, Z-score ≈ 0
        });

        test('Should return null for value <= 0', () => {
            const refData = [
                {
                    Agemos: 12,
                    L: 1, M: 75, S: 0.04,
                    P3: 70, P15: 72, P25: 73, P50: 75, P75: 77, P85: 78, P97: 80
                }
            ] as any[];
            expect(calculateZScore(12, 0, refData)).toBeNull();
            expect(calculateZScore(12, -5, refData)).toBeNull();
        });

        test('Should use log formula when L is close to 0', () => {
            const refData = [
                {
                    Agemos: 12,
                    L: 0.001, // Very close to 0
                    M: 75,
                    S: 0.04,
                    P3: 70, P15: 72, P25: 73, P50: 75, P75: 77, P85: 78, P97: 80
                }
            ] as any[];
            const result = calculateZScore(12, 75, refData);
            // When L ≈ 0, Z = log(value/M) / S = log(75/75) / 0.04 = 0
            expect(result).toBeCloseTo(0, 1);
        });

        test('Should calculate positive Z-score for above median value', () => {
            const refData = [
                {
                    Agemos: 12,
                    L: 1, M: 75, S: 0.04,
                    P3: 70, P15: 72, P25: 73, P50: 75, P75: 77, P85: 78, P97: 80
                }
            ] as any[];
            const result = calculateZScore(12, 80, refData);
            expect(result).toBeGreaterThan(0);
        });

        test('Should calculate negative Z-score for below median value', () => {
            const refData = [
                {
                    Agemos: 12,
                    L: 1, M: 75, S: 0.04,
                    P3: 70, P15: 72, P25: 73, P50: 75, P75: 77, P85: 78, P97: 80
                }
            ] as any[];
            const result = calculateZScore(12, 70, refData);
            expect(result).toBeLessThan(0);
        });

        test('Should return null when P50/P3/P97 are missing for fallback', () => {
            const refData = [
                {
                    Agemos: 12
                    // No L, M, S and no P values
                }
            ] as any[];
            const result = calculateZScore(12, 75, refData);
            expect(result).toBeNull();
        });

        test('Should interpolate between data points', () => {
            const refData = [
                { Agemos: 0, P3: 2.5, P15: 2.9, P25: 3.0, P50: 3.3, P75: 3.7, P85: 3.9, P97: 4.3 },
                { Agemos: 6, P3: 6.4, P15: 7.1, P25: 7.4, P50: 7.9, P75: 8.5, P85: 8.9, P97: 9.7 }
            ] as any[];
            // At 3 months (midpoint), P50 should be interpolated to ~5.6
            const result = calculateZScore(3, 5.6, refData);
            expect(result).not.toBeNull();
            expect(result).toBeCloseTo(0, 0); // Near median
        });

        test('Should handle ages near data boundaries', () => {
            const refData = [
                { Agemos: 12, P3: 70, P15: 72, P25: 73, P50: 75, P75: 77, P85: 78, P97: 80 },
                { Agemos: 18, P3: 72, P15: 74, P25: 76, P50: 78, P75: 80, P85: 82, P97: 84 }
            ] as any[];
            // Should work within range
            const result = calculateZScore(15, 76.5, refData);
            expect(result).not.toBeNull();
        });
    });

    // ===========================================
    // TC-002: Percentile Estimation (Taiwan)
    // ===========================================

    describe('Percentile Estimation', () => {
        test('Should return empty string for null Z-score', () => {
            expect(estimatePercentile(null)).toBe('');
        });

        test('Z-score 0 should be near 25th-50th percentile', () => {
            // Z=0 maps to '25' (between P25 z=-0.674 and P50 z=0)
            expect(estimatePercentile(0)).toBe('25');
        });

        test('Z-score -2.0 = <3rd percentile', () => {
            expect(estimatePercentile(-2.0)).toBe('<3');
        });

        test('Z-score 2.0 = >97th percentile', () => {
            expect(estimatePercentile(2.0)).toBe('>97');
        });

        test('Z-score -1.5 = 3rd percentile range', () => {
            // Between -1.881 and -1.036
            expect(estimatePercentile(-1.5)).toBe('3');
        });

        test('Z-score -0.8 = 15th percentile range', () => {
            // Between -1.036 and -0.674
            expect(estimatePercentile(-0.8)).toBe('15');
        });

        test('Z-score -0.5 = 25th percentile range', () => {
            // Between -0.674 and 0
            expect(estimatePercentile(-0.5)).toBe('25');
        });

        test('Z-score 0.3 = 50th percentile range', () => {
            // Between 0 and 0.674
            expect(estimatePercentile(0.3)).toBe('50');
        });

        test('Z-score 0.8 = 75th percentile range', () => {
            // Between 0.674 and 1.036
            expect(estimatePercentile(0.8)).toBe('75');
        });

        test('Z-score 1.5 = 85th percentile range', () => {
            // Between 1.036 and 1.881
            expect(estimatePercentile(1.5)).toBe('85');
        });

        test('Taiwan percentile boundary values', () => {
            expect(estimatePercentile(-1.881)).toBe('<3');   // Exactly at P3 z-score
            expect(estimatePercentile(-1.036)).toBe('3');    // Exactly at P15 z-score
            expect(estimatePercentile(-0.674)).toBe('15');   // Exactly at P25 z-score
            expect(estimatePercentile(0.674)).toBe('50');    // Exactly at P75 z-score
            expect(estimatePercentile(1.036)).toBe('75');    // Exactly at P85 z-score
            expect(estimatePercentile(1.881)).toBe('85');    // Exactly at P97 z-score
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
            const heightData: GrowthDataPoint[] = [{ ageMonths: 24, value: 86 }]; // 86 cm
            const weightData: GrowthDataPoint[] = [{ ageMonths: 24, value: 12 }]; // 12 kg

            const bmiData = calculateBmiData(heightData, weightData);

            expect(bmiData.length).toBe(1);
            // BMI = 12 / (0.86)^2 = 12 / 0.7396 = 16.22
            expect(bmiData[0].value).toBeCloseTo(16.22, 1);
        });

        test('Should match closest height measurement', () => {
            const heightData: GrowthDataPoint[] = [
                { ageMonths: 12, value: 75 },
                { ageMonths: 24, value: 86 }
            ];
            const weightData: GrowthDataPoint[] = [{ ageMonths: 23.8, value: 12 }];

            const bmiData = calculateBmiData(heightData, weightData);
            expect(bmiData.length).toBe(1);
        });

        test('Should skip BMI when height and weight ages are too far apart', () => {
            const heightData: GrowthDataPoint[] = [{ ageMonths: 12, value: 75 }];
            const weightData: GrowthDataPoint[] = [{ ageMonths: 24, value: 12 }];

            const bmiData = calculateBmiData(heightData, weightData);
            expect(bmiData.length).toBe(0); // Age difference > 0.5 months
        });

        test('Should calculate multiple BMI points', () => {
            const heightData: GrowthDataPoint[] = [
                { ageMonths: 12, value: 75 },
                { ageMonths: 24, value: 86 },
                { ageMonths: 36, value: 95 }
            ];
            const weightData: GrowthDataPoint[] = [
                { ageMonths: 12, value: 10 },
                { ageMonths: 24, value: 12 },
                { ageMonths: 36, value: 14 }
            ];

            const bmiData = calculateBmiData(heightData, weightData);
            expect(bmiData.length).toBe(3);
        });

        test('Should handle zero height gracefully', () => {
            const heightData: GrowthDataPoint[] = [{ ageMonths: 12, value: 0 }];
            const weightData: GrowthDataPoint[] = [{ ageMonths: 12, value: 10 }];

            const bmiData = calculateBmiData(heightData, weightData);
            expect(bmiData.length).toBe(0); // Division by zero avoided
        });
    });

    // ===========================================
    // TC-004: Velocity Calculation
    // ===========================================

    describe('Growth Velocity Calculation', () => {
        test('Should return empty string for insufficient data', () => {
            expect(calculateVelocity('Height', [], 'cm/month')).toBe('');
            expect(calculateVelocity('Height', [{ ageMonths: 12, value: 75 }], 'cm/month')).toBe(
                ''
            );
        });

        test('Should calculate positive velocity', () => {
            const measurements: GrowthDataPoint[] = [
                { ageMonths: 12, value: 75 },
                { ageMonths: 18, value: 81 }
            ];

            const result = calculateVelocity('Height', measurements, 'cm/month');

            expect(result).toContain('Height Velocity');
            expect(result).toContain('+'); // Positive growth
            expect(result).toContain('months'); // Time period
        });

        test('Should calculate negative velocity (weight loss)', () => {
            const measurements: GrowthDataPoint[] = [
                { ageMonths: 12, value: 10 },
                { ageMonths: 14, value: 9.5 }
            ];

            const result = calculateVelocity('Weight', measurements, 'kg/month');

            expect(result).toContain('Weight Velocity');
            expect(result).toContain('text-danger'); // Negative growth shown in danger color
        });

        test('Should use singular "month" for short time periods', () => {
            const measurements: GrowthDataPoint[] = [
                { ageMonths: 12, value: 75 },
                { ageMonths: 13, value: 76 }
            ];

            const result = calculateVelocity('Height', measurements, 'cm/month');
            expect(result).toContain('month');
        });

        test('Should return empty for zero time difference', () => {
            const measurements: GrowthDataPoint[] = [
                { ageMonths: 12, value: 75 },
                { ageMonths: 12, value: 76 }
            ];

            const result = calculateVelocity('Height', measurements, 'cm/month');
            expect(result).toBe('');
        });

        test('Should return empty for negative time difference', () => {
            const measurements: GrowthDataPoint[] = [
                { ageMonths: 14, value: 75 },
                { ageMonths: 12, value: 76 }
            ];

            const result = calculateVelocity('Height', measurements, 'cm/month');
            expect(result).toBe('');
        });

        test('Should apply multiplier correctly', () => {
            const measurements: GrowthDataPoint[] = [
                { ageMonths: 12, value: 10 },
                { ageMonths: 14, value: 11 }
            ];

            // Using multiplier 1000 to convert kg to g
            const result = calculateVelocity('Weight', measurements, 'g/month', 1000);
            expect(result).toContain('500.0'); // (11-10)*1000 / 2 months = 500 g/month
        });

        test('Should only use last two measurements', () => {
            const measurements: GrowthDataPoint[] = [
                { ageMonths: 6, value: 68 },
                { ageMonths: 12, value: 75 },
                { ageMonths: 18, value: 81 }
            ];

            const result = calculateVelocity('Height', measurements, 'cm/month');
            // Should calculate from 12-18 months, not 6-18
            expect(result).toContain('6.0 months'); // 18-12 = 6 months
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

    // ===========================================
    // TC-006: Taiwan Reference Data Validation
    // ===========================================

    describe('Taiwan Reference Data Integration', () => {
        test('Should calculate Z-score with actual Taiwan male weight data', () => {
            // Taiwan male weight P50 at birth = 3.3 kg
            const taiwanWeightMale = [
                { Agemos: 0, P3: 2.5, P15: 2.9, P25: 3.0, P50: 3.3, P75: 3.7, P85: 3.9, P97: 4.3 },
                { Agemos: 6, P3: 6.4, P15: 7.1, P25: 7.4, P50: 7.9, P75: 8.5, P85: 8.9, P97: 9.7 }
            ] as any[];

            // At median weight at birth
            const atMedian = calculateZScore(0, 3.3, taiwanWeightMale);
            expect(atMedian).toBeCloseTo(0, 1);

            // Above median
            const aboveMedian = calculateZScore(0, 4.0, taiwanWeightMale);
            expect(aboveMedian).toBeGreaterThan(0);

            // Below median
            const belowMedian = calculateZScore(0, 2.7, taiwanWeightMale);
            expect(belowMedian).toBeLessThan(0);
        });

        test('Should calculate Z-score with Taiwan female height data', () => {
            const taiwanHeightFemale = [
                { Agemos: 12, P3: 69.2, P15: 71.3, P25: 72.3, P50: 74.0, P75: 75.8, P85: 76.7, P97: 78.9 }
            ] as any[];

            const result = calculateZScore(12, 74.0, taiwanHeightFemale);
            expect(result).toBeCloseTo(0, 1); // At P50
        });

        test('Should handle older age ranges (school age)', () => {
            const taiwanHeightMale = [
                { Agemos: 120, P3: 126.0, P15: 130.5, P25: 132.5, P50: 136.5, P75: 140.5, P85: 142.8, P97: 148.3 },
                { Agemos: 132, P3: 130.5, P15: 135.6, P25: 137.8, P50: 142.0, P75: 146.7, P85: 149.4, P97: 156.1 }
            ] as any[];

            // 10-year-old boy at P50 height
            const result = calculateZScore(120, 136.5, taiwanHeightMale);
            expect(result).toBeCloseTo(0, 1);
        });
    });
});
