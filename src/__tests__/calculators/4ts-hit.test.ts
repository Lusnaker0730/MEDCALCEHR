/**
 * 4Ts HIT Score Calculator Tests
 */

import { describe, expect, test } from '@jest/globals';
import { fourTsHitConfig } from '../../calculators/4ts-hit/index.js';
import { calculateScoringResult } from '../../test-utils/scoring-test-utils.js';

describe('4Ts HIT Calculator', () => {
    test('Config Structure', () => {
        expect(fourTsHitConfig.id).toBe('4ts-hit');
    });

    // Scenario 1: Low Probability (0-3)
    test('Low Probability Case (Score 0)', () => {
        const result = calculateScoringResult(fourTsHitConfig, {
            '4ts-thrombocytopenia': '0',
            '4ts-timing': '0',
            '4ts-thrombosis': '0',
            '4ts-other_causes': '0'
        });
        expect(result.totalScore).toBe(0);
        expect(result.riskLevel?.category).toBe('Low Probability');
        expect(result.riskLevel?.severity).toBe('success');
    });

    // Scenario 2: Intermediate Probability (4-5)
    // Fall 30-50% (+1) + Clear Timing (+2) + Other Causes None (+2) = 5
    test('Intermediate Probability Case (Score 5)', () => {
        const result = calculateScoringResult(fourTsHitConfig, {
            '4ts-thrombocytopenia': '1',
            '4ts-timing': '2',
            '4ts-thrombosis': '0',
            '4ts-other_causes': '2'
        });
        expect(result.totalScore).toBe(5);
        expect(result.riskLevel?.category).toBe('Intermediate Probability');
        expect(result.riskLevel?.severity).toBe('warning');
    });

    // Scenario 3: High Probability (6-8)
    // Fall >50% (+2) + Clear Timing (+2) + New Thrombosis (+2) + Other Causes None (+2) = 8
    test('High Probability Case (Score 8)', () => {
        const result = calculateScoringResult(fourTsHitConfig, {
            '4ts-thrombocytopenia': '2',
            '4ts-timing': '2',
            '4ts-thrombosis': '2',
            '4ts-other_causes': '2'
        });
        expect(result.totalScore).toBe(8);
        expect(result.riskLevel?.category).toBe('High Probability');
        expect(result.riskLevel?.severity).toBe('danger');
    });

    // Verification of Fall/Nadir logic (as per labels in image)
    test('Thrombocytopenia 2 points (Fall >50% AND Nadir >= 20)', () => {
        const result = calculateScoringResult(fourTsHitConfig, {
            '4ts-thrombocytopenia': '2'
        });
        expect(result.totalScore).toBe(2);
    });

    test('Thrombocytopenia 1 point (Fall 30-50% OR Nadir 10-19)', () => {
        const result = calculateScoringResult(fourTsHitConfig, {
            '4ts-thrombocytopenia': '1'
        });
        expect(result.totalScore).toBe(1);
    });
});
