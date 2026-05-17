import { serumAnionGapCalculation } from '../../calculators/serum-anion-gap/calculation.js';

describe('Serum Anion Gap Calculator', () => {
    // Calculator now returns Anion Gap + Delta Gap + Delta Ratio (3 items)
    // when no albumin provided. Helper to locate the AG item by label.
    const findAnionGap = (result: ReturnType<typeof serumAnionGapCalculation>) =>
        result.find(r => r.label === 'Anion Gap')!;

    test('Should calculate Normal Anion Gap (6-12)', () => {
        // Na 140, Cl 105, HCO3 25 -> 140 - 130 = 10 (Normal)
        const result = serumAnionGapCalculation({
            'sag-na': 140,
            'sag-cl': 105,
            'sag-hco3': 25
        });

        const ag = findAnionGap(result);
        expect(ag.value).toBe(10);
        expect(ag.interpretation).toBe('Normal');
        expect(ag.alertClass).toBe('success');
    });

    test('Should calculate High Anion Gap (>12)', () => {
        // Na 140, Cl 100, HCO3 20 -> 140 - 120 = 20
        const result = serumAnionGapCalculation({
            'sag-na': 140,
            'sag-cl': 100,
            'sag-hco3': 20
        });

        const ag = findAnionGap(result);
        expect(ag.value).toBe(20);
        expect(ag.interpretation).toBe('High Anion Gap');
        expect(ag.alertClass).toBe('danger');
    });

    test('Should calculate Low Anion Gap (<6)', () => {
        // Na 130, Cl 100, HCO3 26 -> 130 - 126 = 4
        const result = serumAnionGapCalculation({
            'sag-na': 130,
            'sag-cl': 100,
            'sag-hco3': 26
        });

        const ag = findAnionGap(result);
        expect(ag.value).toBe(4);
        expect(ag.interpretation).toBe('Low Anion Gap');
        expect(ag.alertClass).toBe('warning');
    });

    test('Should handle boundary cases', () => {
        // Na 140, Cl 104, HCO3 24 -> 140 - 128 = 12 (Normal)
        const result12 = serumAnionGapCalculation({
            'sag-na': 140,
            'sag-cl': 104,
            'sag-hco3': 24
        });
        expect(findAnionGap(result12).interpretation).toBe('Normal');

        // Na 140, Cl 110, HCO3 24 -> 140 - 134 = 6 (Normal)
        const result6 = serumAnionGapCalculation({
            'sag-na': 140,
            'sag-cl': 110,
            'sag-hco3': 24
        });
        expect(findAnionGap(result6).interpretation).toBe('Normal');
    });

    test('Should return empty for missing inputs', () => {
        const result = serumAnionGapCalculation({
            'sag-na': 140,
            'sag-cl': 100,
            'sag-hco3': null as any
        });
        expect(result).toHaveLength(0);
    });
});
