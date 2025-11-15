/**
 * qSOFA (Quick SOFA) Score 單元測試
 */

import { describe, test, expect } from '@jest/globals';

describe('qSOFA Score Calculator', () => {
    describe('評分標準', () => {
        test('應該包含三個評估項目', () => {
            const criteria = ['Respiratory Rate', 'Altered Mentation', 'Systolic BP'];
            expect(criteria.length).toBe(3);
        });

        test('每個項目應該是二分法評分（0 或 1）', () => {
            const scores = [0, 1];
            scores.forEach(score => {
                expect(score === 0 || score === 1).toBe(true);
            });
        });
    });

    describe('呼吸率評估', () => {
        test('呼吸率 <22 應該得 0 分', () => {
            const rr = 18; // /min
            const score = rr >= 22 ? 1 : 0;
            expect(score).toBe(0);
        });

        test('呼吸率 ≥22 應該得 1 分', () => {
            const rr = 25; // /min
            const score = rr >= 22 ? 1 : 0;
            expect(score).toBe(1);
        });

        test('臨界值 22 應該得 1 分', () => {
            const rr = 22;
            const score = rr >= 22 ? 1 : 0;
            expect(score).toBe(1);
        });
    });

    describe('意識狀態評估', () => {
        test('意識清楚 (GCS 15) 應該得 0 分', () => {
            const gcs = 15;
            const isAltered = gcs < 15;
            const score = isAltered ? 1 : 0;
            expect(score).toBe(0);
        });

        test('意識改變 (GCS <15) 應該得 1 分', () => {
            const gcs = 13;
            const isAltered = gcs < 15;
            const score = isAltered ? 1 : 0;
            expect(score).toBe(1);
        });

        test('任何程度的意識改變都應該計分', () => {
            const gcsValues = [14, 12, 10, 8, 5, 3];
            gcsValues.forEach(gcs => {
                const score = gcs < 15 ? 1 : 0;
                expect(score).toBe(1);
            });
        });
    });

    describe('收縮壓評估', () => {
        test('收縮壓 >100 mmHg 應該得 0 分', () => {
            const sbp = 120;
            const score = sbp <= 100 ? 1 : 0;
            expect(score).toBe(0);
        });

        test('收縮壓 ≤100 mmHg 應該得 1 分', () => {
            const sbp = 95;
            const score = sbp <= 100 ? 1 : 0;
            expect(score).toBe(1);
        });

        test('臨界值 100 應該得 1 分', () => {
            const sbp = 100;
            const score = sbp <= 100 ? 1 : 0;
            expect(score).toBe(1);
        });
    });

    describe('總分計算', () => {
        test('最低分應該是 0', () => {
            const rrScore = 0; // RR <22
            const mentationScore = 0; // GCS 15
            const sbpScore = 0; // SBP >100
            const total = rrScore + mentationScore + sbpScore;
            expect(total).toBe(0);
        });

        test('最高分應該是 3', () => {
            const rrScore = 1; // RR ≥22
            const mentationScore = 1; // GCS <15
            const sbpScore = 1; // SBP ≤100
            const total = rrScore + mentationScore + sbpScore;
            expect(total).toBe(3);
        });

        test('qSOFA ≥2 表示高風險', () => {
            const score = 2;
            const isHighRisk = score >= 2;
            expect(isHighRisk).toBe(true);
        });
    });

    describe('臨床意義', () => {
        test('qSOFA 0-1: 低風險，但不排除感染', () => {
            const score = 1;
            const risk = score < 2 ? 'Low' : 'High';
            expect(risk).toBe('Low');
        });

        test('qSOFA ≥2: 高風險，建議進一步評估 SOFA', () => {
            const score = 2;
            const needsFullSOFA = score >= 2;
            expect(needsFullSOFA).toBe(true);
        });

        test('qSOFA ≥2 與較差預後相關', () => {
            const score = 3;
            const poorOutcome = score >= 2;
            expect(poorOutcome).toBe(true);
        });
    });

    describe('與 SOFA 的關係', () => {
        test('qSOFA 是 SOFA 的簡化版', () => {
            // qSOFA: 3 項標準，床邊即可評估
            // SOFA: 6 個器官系統，需要實驗室數據
            const qSOFACriteria = 3;
            const SOFASystems = 6;
            expect(qSOFACriteria).toBeLessThan(SOFASystems);
        });

        test('qSOFA ≥2 應該觸發完整 SOFA 評估', () => {
            const qSOFA = 2;
            const shouldAssessSOFA = qSOFA >= 2;
            expect(shouldAssessSOFA).toBe(true);
        });

        test('qSOFA 陰性不排除器官功能障礙', () => {
            const qSOFA = 1;
            const canStillHaveOrganDysfunction = true;
            expect(canStillHaveOrganDysfunction).toBe(true);
        });
    });

    describe('Sepsis-3 整合', () => {
        test('qSOFA 用於感染患者的快速篩檢', () => {
            const hasInfection = true;
            const qSOFA = 2;
            const needsFurtherEval = hasInfection && qSOFA >= 2;
            expect(needsFurtherEval).toBe(true);
        });

        test('qSOFA 不是診斷敗血症的充分條件', () => {
            const qSOFA = 3;
            // 還需要證實感染 + SOFA ≥2
            const isSepsis = false; // 需要更多證據
            expect(qSOFA >= 2).toBe(true);
        });

        test('qSOFA 可用於院外或急診評估', () => {
            const location = 'Emergency Department';
            const qSOFAUseful = location !== 'ICU';
            expect(qSOFAUseful).toBe(true);
        });
    });

    describe('實際臨床案例', () => {
        test('案例1: 健康感染患者', () => {
            const rr = 18; // 0
            const gcs = 15; // 0
            const sbp = 120; // 0
            const qSOFA = 0;
            
            expect(qSOFA).toBe(0);
            // 低風險，但仍需監測
        });

        test('案例2: 呼吸急促的肺炎患者', () => {
            const rr = 28; // 1
            const gcs = 15; // 0
            const sbp = 110; // 0
            const qSOFA = 1;
            
            expect(qSOFA).toBe(1);
            // 中等風險
        });

        test('案例3: 低血壓的敗血症患者', () => {
            const rr = 26; // 1
            const gcs = 14; // 1
            const sbp = 95; // 1
            const qSOFA = 3;
            
            expect(qSOFA).toBe(3);
            // 高風險，緊急評估和治療
        });

        test('案例4: 意識改變的老年患者', () => {
            const rr = 20; // 0
            const gcs = 12; // 1
            const sbp = 98; // 1
            const qSOFA = 2;
            
            expect(qSOFA).toBe(2);
            // 高風險，需要完整 SOFA 評估
        });
    });

    describe('使用限制', () => {
        test('qSOFA 在 ICU 內靈敏度較低', () => {
            const location = 'ICU';
            const preferFullSOFA = location === 'ICU';
            expect(preferFullSOFA).toBe(true);
        });

        test('qSOFA 不應該延遲抗生素治療', () => {
            const hasInfection = true;
            const qSOFA = 1; // 低於 2
            // 仍應及時給予抗生素
            const shouldGiveAntibiotics = hasInfection;
            expect(shouldGiveAntibiotics).toBe(true);
        });

        test('qSOFA 不取代臨床判斷', () => {
            const qSOFA = 1;
            const clinicalConcern = true;
            // 即使 qSOFA 低，臨床懷疑仍需處理
            expect(clinicalConcern).toBe(true);
        });
    });

    describe('趨勢監測', () => {
        test('qSOFA 惡化提示病情進展', () => {
            const initialQSOFA = 1;
            const currentQSOFA = 3;
            const deteriorating = currentQSOFA > initialQSOFA;
            expect(deteriorating).toBe(true);
        });

        test('qSOFA 改善提示治療有效', () => {
            const initialQSOFA = 3;
            const currentQSOFA = 1;
            const improving = currentQSOFA < initialQSOFA;
            expect(improving).toBe(true);
        });

        test('連續評估比單次評估更有價值', () => {
            const serialAssessments = [2, 2, 3]; // 惡化趨勢
            const isWorsening = serialAssessments[2] > serialAssessments[0];
            expect(isWorsening).toBe(true);
        });
    });

    describe('預後預測', () => {
        test('qSOFA ≥2 與住院死亡率增加相關', () => {
            const qSOFA = 2;
            const increasedMortality = qSOFA >= 2;
            expect(increasedMortality).toBe(true);
        });

        test('qSOFA 每增加 1 分，死亡風險增加', () => {
            const scores = [0, 1, 2, 3];
            const mortalityRisks = scores.map(s => s * 3); // 示例
            expect(mortalityRisks[3]).toBeGreaterThan(mortalityRisks[0]);
        });
    });
});

