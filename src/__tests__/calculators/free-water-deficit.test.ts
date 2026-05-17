import { freeWaterDeficitConfig } from '../../calculators/free-water-deficit/index.js';
import { calculateFreeWaterDeficit } from '../../calculators/free-water-deficit/calculation.js';

describe('Free Water Deficit Calculator', () => {
    describe('Calculation Logic', () => {
        // Formula: TBW * (Na/140 - 1)
        // TBW = Weight * Factor

        // Inputs: fwd-weight, fwd-sodium, fwd-sex (male/female), fwd-age-range
        // (child/adult/elderly). fwd-desired-sodium defaults to 140.
        // TBW factor: child 0.6, adult male 0.6, adult female 0.5,
        //             elderly male 0.5, elderly female 0.45.

        test('Adult Male with Hypernatremia: Na 160', () => {
            const result = calculateFreeWaterDeficit({
                'fwd-weight': 70,
                'fwd-sodium': 160,
                'fwd-sex': 'male',
                'fwd-age-range': 'adult'
            });
            expect(result).not.toBeNull();
            // TBW = 70 × 0.6 = 42L
            // Deficit = 42 × (160/140 − 1) = 6.0L
            const deficit = parseFloat(result![0].value as string);
            expect(deficit).toBeCloseTo(6.0, 1);
            expect(result![0].interpretation).toContain('Hypernatremia');
        });

        test('Adult Female with Hypernatremia: Na 155', () => {
            const result = calculateFreeWaterDeficit({
                'fwd-weight': 60,
                'fwd-sodium': 155,
                'fwd-sex': 'female',
                'fwd-age-range': 'adult'
            });
            // TBW = 60 × 0.5 = 30L
            // Deficit = 30 × (155/140 − 1) = 3.2L
            const deficit = parseFloat(result![0].value as string);
            expect(deficit).toBeCloseTo(3.2, 1);
        });

        test('Elderly Female with Hypernatremia: Na 150', () => {
            const result = calculateFreeWaterDeficit({
                'fwd-weight': 55,
                'fwd-sodium': 150,
                'fwd-sex': 'female',
                'fwd-age-range': 'elderly'
            });
            // TBW = 55 × 0.45 = 24.75L
            // Deficit = 24.75 × (150/140 − 1) = 1.77L
            const deficit = parseFloat(result![0].value as string);
            expect(deficit).toBeCloseTo(1.8, 1);
        });

        test('Normal Sodium (Not Indicated): Na 140', () => {
            const result = calculateFreeWaterDeficit({
                'fwd-weight': 70,
                'fwd-sodium': 140,
                'fwd-sex': 'male',
                'fwd-age-range': 'adult'
            });
            // Deficit = 42 × (140/140 − 1) = 0
            const deficit = parseFloat(result![0].value as string);
            expect(deficit).toBe(0);
            expect(result![0].interpretation).toContain('Not Indicated');
        });

        test('Missing inputs should return null', () => {
            expect(
                calculateFreeWaterDeficit({
                    'fwd-weight': 70,
                    'fwd-sodium': 160
                    // missing fwd-sex + fwd-age-range
                } as any)
            ).toBeNull();
        });
    });
});
