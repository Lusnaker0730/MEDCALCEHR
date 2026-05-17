// import { sodiumCorrection } from '../../calculators/sodium-correction/index.js';
import { sodiumCorrectionConfig } from '../../calculators/sodium-correction/index.js';
import { calculateSodiumCorrection } from '../../calculators/sodium-correction/calculation.js';

describe('Sodium Correction Calculator', () => {
    describe('Calculation Logic', () => {
        // The calculator returns BOTH reference corrections in a fixed order:
        //   result[0] = Katz (1973), factor 1.6
        //   result[1] = Hillier (1999), factor 2.4
        // Formula: corrected = Na + factor × (glucose − 100) / 100

        test('Katz factor 1.6: Na 135, glucose 200', () => {
            const result = calculateSodiumCorrection({
                'measured-sodium': 135,
                glucose: 200
            });
            expect(result).not.toBeNull();
            // 135 + 1.6 × (100/100) = 136.6
            expect(result![0].label).toContain('Katz');
            expect(result![0].value).toBe(136.6);
            expect(result![0].interpretation).toBe('Normal');
        });

        test('Katz factor 1.6: Na 130, glucose 500', () => {
            const result = calculateSodiumCorrection({
                'measured-sodium': 130,
                glucose: 500
            });
            expect(result).not.toBeNull();
            // 130 + 1.6 × (400/100) = 136.4
            expect(result![0].value).toBe(136.4);
            expect(result![0].interpretation).toBe('Normal');
        });

        test('Hillier factor 2.4: Na 125, glucose 600 (result[1])', () => {
            const result = calculateSodiumCorrection({
                'measured-sodium': 125,
                glucose: 600
            });
            expect(result).not.toBeNull();
            // Hillier: 125 + 2.4 × (500/100) = 137
            expect(result![1].label).toContain('Hillier');
            expect(result![1].value).toBe(137);
            expect(result![1].interpretation).toBe('Normal');
        });

        test('Hyponatremia (corrected < 136)', () => {
            const result = calculateSodiumCorrection({
                'measured-sodium': 120,
                glucose: 200
            });
            // Katz: 120 + 1.6 = 121.6 → Hyponatremia
            expect(result![0].interpretation).toBe('Hyponatremia');
            expect(result![0].alertClass).toBe('warning');
        });

        test('Hypernatremia (corrected > 145)', () => {
            const result = calculateSodiumCorrection({
                'measured-sodium': 145,
                glucose: 300
            });
            // Katz: 145 + 1.6 × 2 = 148.2 → Hypernatremia
            expect(result![0].interpretation).toBe('Hypernatremia');
            expect(result![0].alertClass).toBe('danger');
        });

        test('Missing inputs should return null', () => {
            const result = calculateSodiumCorrection({
                'measured-sodium': 135
            } as any);
            expect(result).toBeNull();
        });
    });

    /*
    describe('Calculator Configuration', () => {
        test('Should use correct ValidationTypes', () => {
            expect(sodiumCorrectionConfig).toBeDefined();
            // ...
        });
    });
    */
});
