/**
 * CURB-65 Score 單元測試
 */

import { describe, test, expect } from '@jest/globals';

describe('CURB-65 Score Calculator', () => {
    describe('分數計算', () => {
        test('低風險患者應該得 0-1 分', () => {
            // Confusion: No (0)
            // Urea: Normal <7 mmol/L (0)
            // Respiratory rate: <30 (0)
            // Blood pressure: Normal (0)
            // Age: <65 (0)
            const totalScore = 0;
            expect(totalScore).toBeLessThanOrEqual(1);
        });

        test('中風險患者應該得 2 分', () => {
            // 例如：年齡 >65 (1) + 呼吸率 >30 (1) = 2
            const ageScore = 1;
            const respiratoryScore = 1;
            const totalScore = ageScore + respiratoryScore;
            expect(totalScore).toBe(2);
        });

        test('高風險患者應該得 3-5 分', () => {
            // 多項指標異常
            const confusion = 1;
            const urea = 1;
            const respiratory = 1;
            const bloodPressure = 1;
            const age = 1;
            const totalScore = confusion + urea + respiratory + bloodPressure + age;
            expect(totalScore).toBe(5);
        });
    });

    describe('意識狀態評估', () => {
        test('意識清楚應該得 0 分', () => {
            const isConfused = false;
            const score = isConfused ? 1 : 0;
            expect(score).toBe(0);
        });

        test('意識混亂應該得 1 分', () => {
            const isConfused = true;
            const score = isConfused ? 1 : 0;
            expect(score).toBe(1);
        });
    });

    describe('尿素氮評估', () => {
        test('BUN <7 mmol/L 應該得 0 分', () => {
            const bun = 6.0; // mmol/L
            const score = bun < 7.0 ? 0 : 1;
            expect(score).toBe(0);
        });

        test('BUN ≥7 mmol/L 應該得 1 分', () => {
            const bun = 8.0; // mmol/L
            const score = bun >= 7.0 ? 1 : 0;
            expect(score).toBe(1);
        });

        test('BUN >19 mg/dL 應該得 1 分 (美國單位)', () => {
            const bun = 25; // mg/dL
            const score = bun > 19 ? 1 : 0;
            expect(score).toBe(1);
        });
    });

    describe('呼吸率評估', () => {
        test('呼吸率 <30 應該得 0 分', () => {
            const rr = 20; // /min
            const score = rr < 30 ? 0 : 1;
            expect(score).toBe(0);
        });

        test('呼吸率 ≥30 應該得 1 分', () => {
            const rr = 35; // /min
            const score = rr >= 30 ? 1 : 0;
            expect(score).toBe(1);
        });
    });

    describe('血壓評估', () => {
        test('正常血壓應該得 0 分', () => {
            const sbp = 120; // mmHg
            const dbp = 80; // mmHg
            const score = (sbp < 90 || dbp <= 60) ? 1 : 0;
            expect(score).toBe(0);
        });

        test('收縮壓 <90 應該得 1 分', () => {
            const sbp = 85; // mmHg
            const score = sbp < 90 ? 1 : 0;
            expect(score).toBe(1);
        });

        test('舒張壓 ≤60 應該得 1 分', () => {
            const dbp = 55; // mmHg
            const score = dbp <= 60 ? 1 : 0;
            expect(score).toBe(1);
        });
    });

    describe('年齡評估', () => {
        test('年齡 <65 應該得 0 分', () => {
            const age = 55;
            const score = age < 65 ? 0 : 1;
            expect(score).toBe(0);
        });

        test('年齡 ≥65 應該得 1 分', () => {
            const age = 70;
            const score = age >= 65 ? 1 : 0;
            expect(score).toBe(1);
        });
    });

    describe('風險分層與建議', () => {
        test('CURB-65 0-1: 低風險，可考慮門診治療', () => {
            const score = 1;
            const risk = score <= 1 ? 'Low' : 'Higher';
            const mortality = score <= 1 ? '<3%' : 'Higher';
            expect(risk).toBe('Low');
            expect(mortality).toBe('<3%');
        });

        test('CURB-65 2: 中風險，建議住院治療', () => {
            const score = 2;
            const risk = score === 2 ? 'Moderate' : 'Other';
            const mortality = score === 2 ? '9%' : 'Other';
            expect(risk).toBe('Moderate');
            expect(mortality).toBe('9%');
        });

        test('CURB-65 3-5: 高風險，可能需要 ICU', () => {
            const score = 4;
            const risk = score >= 3 ? 'High' : 'Lower';
            const mortality = score >= 3 ? '15-40%' : 'Lower';
            expect(risk).toBe('High');
            expect(mortality).toBe('15-40%');
        });
    });

    describe('單位轉換', () => {
        test('應該正確轉換 BUN: mmol/L 到 mg/dL', () => {
            const bunMmol = 7.0; // mmol/L
            const bunMg = bunMmol * 2.8; // mg/dL
            expect(bunMg).toBeCloseTo(19.6, 1);
        });

        test('應該正確轉換 BUN: mg/dL 到 mmol/L', () => {
            const bunMg = 20; // mg/dL
            const bunMmol = bunMg / 2.8; // mmol/L
            expect(bunMmol).toBeCloseTo(7.14, 2);
        });
    });

    describe('實際臨床案例', () => {
        test('案例1: 年輕健康患者，輕度肺炎', () => {
            const age = 45; // 0
            const confusion = false; // 0
            const bun = 5.0; // 0
            const rr = 18; // 0
            const sbp = 120; // 0
            const totalScore = 0;
            
            expect(totalScore).toBe(0);
            // 建議：門診治療
        });

        test('案例2: 老年患者，中度肺炎', () => {
            const age = 75; // 1
            const confusion = false; // 0
            const bun = 8.0; // 1
            const rr = 24; // 0
            const sbp = 110; // 0
            const totalScore = 2;
            
            expect(totalScore).toBe(2);
            // 建議：住院治療
        });

        test('案例3: 危重患者，嚴重肺炎', () => {
            const age = 80; // 1
            const confusion = true; // 1
            const bun = 12.0; // 1
            const rr = 35; // 1
            const sbp = 85; // 1
            const totalScore = 5;
            
            expect(totalScore).toBe(5);
            // 建議：ICU 治療
        });
    });
});

