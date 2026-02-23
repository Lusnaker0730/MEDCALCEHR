/**
 * Bacterial Meningitis Score Calculator Tests
 */
import { describe, expect, test } from '@jest/globals';
import { bacterialMeningitisScoreConfig } from '../../calculators/bacterial-meningitis-score/index.js';
import { calculateScoringResult } from '../../test-utils/scoring-test-utils.js';
describe('Bacterial Meningitis Score Calculator', () => {
    test('Config Structure', () => {
        expect(bacterialMeningitisScoreConfig.id).toBe('bacterial-meningitis-score');
    });
    // Scenario 1: Very Low Risk (0)
    test('Very Low Risk Case', () => {
        const result = calculateScoringResult(bacterialMeningitisScoreConfig, {});
        expect(result.totalScore).toBe(0);
        expect(result.riskLevel?.label).toBe('Very Low Risk');
    });
    // Scenario 2: Not Low Risk (>0)
    // CSF Gram Stain (+1)
    test('Not Low Risk Case (Gram Stain)', () => {
        const result = calculateScoringResult(bacterialMeningitisScoreConfig, {
            gram_stain: '1'
        });
        expect(result.totalScore).toBe(1);
        expect(result.riskLevel?.label).toBe('Not Low Risk');
    });
    // Seizure (+1)
    test('Not Low Risk Case (Seizure)', () => {
        const result = calculateScoringResult(bacterialMeningitisScoreConfig, {
            seizure: '1'
        });
        expect(result.totalScore).toBe(1);
        expect(result.riskLevel?.label).toBe('Not Low Risk');
    });
    // Max Score
    // 1+1+1+1+1 = 5
    test('Max Score Case', () => {
        const result = calculateScoringResult(bacterialMeningitisScoreConfig, {
            gram_stain: '1',
            csf_anc: '1',
            csf_protein: '1',
            blood_anc: '1',
            seizure: '1'
        });
        expect(result.totalScore).toBe(5);
        expect(result.riskLevel?.label).toBe('Not Low Risk');
    });
    // Custom Renderer
    test('Custom Renderer Output', () => {
        const renderer = bacterialMeningitisScoreConfig.customResultRenderer;
        const output0 = renderer(0, {});
        expect(output0).toContain('Very Low Risk');
        expect(output0).toContain('Very low risk for bacterial meningitis');
        const output5 = renderer(5, {});
        expect(output5).toContain('Not Low Risk');
    });
});
