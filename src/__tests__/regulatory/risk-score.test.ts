/**
 * Risk Score Calculation Tests
 * Validates risk score computation and classification consistency
 * with ISO 14971 risk matrix.
 */

import { parseRisk } from '../../../scripts/regulatory/issue-parser';
import { RegulatoryIssue } from '../../../scripts/regulatory/types';
import { getRiskCategory, getRiskColor } from '../../../scripts/regulatory/document-header';

function makeRiskIssue(severity: number, probability: number): RegulatoryIssue {
    return {
        number: 1,
        title: `Risk S${severity}P${probability}`,
        body: `### 危害情境\n\n測試情境\n\n### 嚴重度 (Severity)\n\n${severity} — Test\n\n### 發生機率 (Probability)\n\n${probability} — Test\n\n### 風險控制措施\n\n控制\n\n### 殘餘風險\n\n殘餘\n\n### 驗證方法\n\n驗證`,
        labels: ['ISO14971:風險'],
        state: 'open',
        createdAt: '2026-03-12T00:00:00Z',
        updatedAt: '2026-03-12T00:00:00Z',
        closedAt: null,
        author: 'test',
        url: 'https://github.com/test/test/issues/1'
    };
}

describe('Risk Score Calculation', () => {
    it('should correctly compute score as severity × probability', () => {
        const testCases = [
            { s: 1, p: 1, expected: 1 },
            { s: 2, p: 3, expected: 6 },
            { s: 3, p: 3, expected: 9 },
            { s: 4, p: 3, expected: 12 },
            { s: 5, p: 5, expected: 25 }
        ];

        for (const tc of testCases) {
            const risk = parseRisk(makeRiskIssue(tc.s, tc.p));
            expect(risk.riskScore).toBe(tc.expected);
        }
    });
});

describe('Risk Classification', () => {
    it('should classify all S×P combinations correctly', () => {
        for (let s = 1; s <= 5; s++) {
            for (let p = 1; p <= 5; p++) {
                const score = s * p;
                const risk = parseRisk(makeRiskIssue(s, p));

                if (score <= 4) {
                    expect(risk.riskLevel).toBe('acceptable');
                } else if (score <= 9) {
                    expect(risk.riskLevel).toBe('alarp');
                } else {
                    expect(risk.riskLevel).toBe('unacceptable');
                }
            }
        }
    });

    it('should have consistent category labels and colors', () => {
        // Acceptable range
        for (let score = 1; score <= 4; score++) {
            expect(getRiskCategory(score)).toContain('可接受');
            expect(getRiskColor(score)).toBe('🟢');
        }

        // ALARP range
        for (let score = 5; score <= 9; score++) {
            expect(getRiskCategory(score)).toContain('ALARP');
            expect(getRiskColor(score)).toBe('🟡');
        }

        // Unacceptable range
        for (let score = 10; score <= 25; score++) {
            expect(getRiskCategory(score)).toContain('不可接受');
            expect(getRiskColor(score)).toBe('🔴');
        }
    });
});

describe('Risk Matrix Boundary Cases', () => {
    it('score 4 (boundary) should be acceptable', () => {
        // S=2, P=2 = 4 (last acceptable)
        const risk = parseRisk(makeRiskIssue(2, 2));
        expect(risk.riskScore).toBe(4);
        expect(risk.riskLevel).toBe('acceptable');
    });

    it('score 5 (boundary) should be ALARP', () => {
        // S=1, P=5 = 5 (first ALARP)
        const risk = parseRisk(makeRiskIssue(1, 5));
        expect(risk.riskScore).toBe(5);
        expect(risk.riskLevel).toBe('alarp');
    });

    it('score 9 (boundary) should be ALARP', () => {
        // S=3, P=3 = 9 (last ALARP)
        const risk = parseRisk(makeRiskIssue(3, 3));
        expect(risk.riskScore).toBe(9);
        expect(risk.riskLevel).toBe('alarp');
    });

    it('score 10 (boundary) should be unacceptable', () => {
        // S=2, P=5 = 10 (first unacceptable)
        const risk = parseRisk(makeRiskIssue(2, 5));
        expect(risk.riskScore).toBe(10);
        expect(risk.riskLevel).toBe('unacceptable');
    });
});
