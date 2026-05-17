/**
 * GAD-7 Calculator Tests
 */

import { describe, expect, test } from '@jest/globals';
import { gad7Config } from '../../calculators/gad-7/index.js';
import { calculateScoringResult } from '../../test-utils/scoring-test-utils.js';

describe('GAD-7 Calculator', () => {
    test('Config Structure', () => {
        expect(gad7Config.id).toBe('gad-7');
        // GAD-7 standard instrument: 7 scored anxiety items + 1 optional
        // functional impairment item (Q8). Q8's option values are all 0 so
        // it never contributes to the score; it is reported separately.
        expect(gad7Config.sections).toHaveLength(8);

        const scoredSections = gad7Config.sections!.filter(s =>
            s.options.some(o => Number(o.value) > 0)
        );
        expect(scoredSections).toHaveLength(7);

        const unscoredSections = gad7Config.sections!.filter(s =>
            s.options.every(o => Number(o.value) === 0)
        );
        expect(unscoredSections).toHaveLength(1);
        expect(unscoredSections[0].id).toBe('gad7-q7');
    });

    // Scenario 1: Minimal Anxiety (0-4)
    test('Minimal Anxiety (0)', () => {
        const result = calculateScoringResult(gad7Config, {});
        expect(result.totalScore).toBe(0);
        expect(result.riskLevel?.label).toBe('Minimal anxiety');
    });

    test('Minimal Anxiety (4)', () => {
        // Q1=2, Q2=2, others 0
        const result = calculateScoringResult(gad7Config, {
            'gad7-q0': '2',
            'gad7-q1': '2'
        });
        expect(result.totalScore).toBe(4);
        expect(result.riskLevel?.label).toBe('Minimal anxiety');
    });

    // Scenario 2: Severe Anxiety (15-21)
    test('Severe Anxiety (21)', () => {
        // All 3
        const result = calculateScoringResult(gad7Config, {
            'gad7-q0': '3',
            'gad7-q1': '3',
            'gad7-q2': '3',
            'gad7-q3': '3',
            'gad7-q4': '3',
            'gad7-q5': '3',
            'gad7-q6': '3'
        });
        expect(result.totalScore).toBe(21);
        expect(result.riskLevel?.label).toBe('Severe anxiety');
    });

    // Custom Renderer
    test('Custom Renderer Output', () => {
        const renderer = gad7Config.customResultRenderer!;

        const output0 = renderer(0, {});
        expect(output0).toContain('Minimal anxiety');

        const output15 = renderer(15, {});
        expect(output15).toContain('Severe anxiety');
        expect(output15).toContain('Active treatment');
    });
});
