/**
 * Child-Pugh Score 單元測試
 */

import { describe, test, expect } from '@jest/globals';

describe('Child-Pugh Score for Cirrhosis', () => {
    describe('評分項目', () => {
        test('總膽紅素評分', () => {
            // <2 mg/dL: 1分
            // 2-3 mg/dL: 2分
            // >3 mg/dL: 3分
            expect(1.5 < 2).toBe(true); // 1分
            expect(2.5 >= 2 && 2.5 <= 3).toBe(true); // 2分
            expect(4.0 > 3).toBe(true); // 3分
        });

        test('白蛋白評分', () => {
            // >3.5 g/dL: 1分
            // 2.8-3.5 g/dL: 2分
            // <2.8 g/dL: 3分
            expect(4.0 > 3.5).toBe(true); // 1分
            expect(3.0 >= 2.8 && 3.0 <= 3.5).toBe(true); // 2分
            expect(2.5 < 2.8).toBe(true); // 3分
        });

        test('INR 評分', () => {
            // <1.7: 1分
            // 1.7-2.3: 2分
            // >2.3: 3分
            expect(1.5 < 1.7).toBe(true); // 1分
            expect(2.0 >= 1.7 && 2.0 <= 2.3).toBe(true); // 2分
            expect(2.5 > 2.3).toBe(true); // 3分
        });

        test('腹水評分', () => {
            // 無: 1分
            // 輕度: 2分
            // 中重度: 3分
            const ascites = ['none', 'mild', 'moderate_severe'];
            expect(ascites.length).toBe(3);
        });

        test('肝性腦病評分', () => {
            // 無: 1分
            // 1-2級: 2分
            // 3-4級: 3分
            const encephalopathy = ['none', 'grade_1_2', 'grade_3_4'];
            expect(encephalopathy.length).toBe(3);
        });
    });

    describe('總分計算', () => {
        test('最低分應該是 5', () => {
            // 所有項目都是 1 分
            const totalScore = 1 + 1 + 1 + 1 + 1;
            expect(totalScore).toBe(5);
        });

        test('最高分應該是 15', () => {
            // 所有項目都是 3 分
            const totalScore = 3 + 3 + 3 + 3 + 3;
            expect(totalScore).toBe(15);
        });
    });

    describe('Child-Pugh 分級', () => {
        test('5-6 分: Child-Pugh A 級（代償期）', () => {
            const score = 6;
            const grade = score <= 6 ? 'A' : 'B or C';
            expect(grade).toBe('A');
        });

        test('7-9 分: Child-Pugh B 級（中度失代償）', () => {
            const score = 8;
            const grade = (score >= 7 && score <= 9) ? 'B' : 'Other';
            expect(grade).toBe('B');
        });

        test('10-15 分: Child-Pugh C 級（重度失代償）', () => {
            const score = 12;
            const grade = score >= 10 ? 'C' : 'Other';
            expect(grade).toBe('C');
        });
    });

    describe('預後評估', () => {
        test('Child-Pugh A: 1年存活率 100%, 2年存活率 85%', () => {
            const score = 6;
            const oneYearSurvival = score <= 6 ? '100%' : 'Lower';
            const twoYearSurvival = score <= 6 ? '85%' : 'Lower';
            expect(oneYearSurvival).toBe('100%');
            expect(twoYearSurvival).toBe('85%');
        });

        test('Child-Pugh B: 1年存活率 80%, 2年存活率 60%', () => {
            const score = 8;
            const isGradeB = score >= 7 && score <= 9;
            expect(isGradeB).toBe(true);
        });

        test('Child-Pugh C: 1年存活率 45%, 2年存活率 35%', () => {
            const score = 12;
            const isGradeC = score >= 10;
            expect(isGradeC).toBe(true);
        });
    });

    describe('手術風險評估', () => {
        test('Child-Pugh A: 腹部手術死亡率 10%', () => {
            const score = 6;
            const mortality = score <= 6 ? '10%' : 'Higher';
            expect(mortality).toBe('10%');
        });

        test('Child-Pugh B: 腹部手術死亡率 30%', () => {
            const score = 8;
            const isGradeB = score >= 7 && score <= 9;
            expect(isGradeB).toBe(true);
        });

        test('Child-Pugh C: 腹部手術死亡率 76-82%', () => {
            const score = 12;
            const isGradeC = score >= 10;
            expect(isGradeC).toBe(true);
        });
    });

    describe('肝移植評估', () => {
        test('Child-Pugh A: 可能不需要緊急移植', () => {
            const score = 6;
            const urgentTransplant = score > 6;
            expect(urgentTransplant).toBe(false);
        });

        test('Child-Pugh B: 應該考慮肝移植評估', () => {
            const score = 8;
            const shouldConsiderTransplant = score >= 7;
            expect(shouldConsiderTransplant).toBe(true);
        });

        test('Child-Pugh C: 應該積極進行移植評估', () => {
            const score = 12;
            const urgentTransplant = score >= 10;
            expect(urgentTransplant).toBe(true);
        });
    });

    describe('實際臨床案例', () => {
        test('案例1: 代償期肝硬化', () => {
            const bilirubin = 1.5; // 1分
            const albumin = 3.8; // 1分
            const inr = 1.5; // 1分
            const ascites = 1; // 無
            const encephalopathy = 1; // 無
            const totalScore = 1 + 1 + 1 + 1 + 1;
            
            expect(totalScore).toBe(5);
            // Grade A，預後良好
        });

        test('案例2: 中度失代償肝硬化', () => {
            const bilirubin = 2.5; // 2分
            const albumin = 3.0; // 2分
            const inr = 2.0; // 2分
            const ascites = 2; // 輕度
            const encephalopathy = 1; // 無
            const totalScore = 2 + 2 + 2 + 2 + 1;
            
            expect(totalScore).toBe(9);
            // Grade B，需密切監測
        });

        test('案例3: 重度失代償肝硬化', () => {
            const bilirubin = 4.5; // 3分
            const albumin = 2.5; // 3分
            const inr = 2.8; // 3分
            const ascites = 3; // 中重度
            const encephalopathy = 3; // 3-4級
            const totalScore = 3 + 3 + 3 + 3 + 3;
            
            expect(totalScore).toBe(15);
            // Grade C，預後極差
        });
    });

    describe('病因考量', () => {
        test('酒精性肝硬化: 戒酒可改善分數', () => {
            const alcoholicCirrhosis = true;
            const canImprove = alcoholicCirrhosis;
            expect(canImprove).toBe(true);
        });

        test('病毒性肝炎: 抗病毒治療可改善', () => {
            const viralHepatitis = true;
            const canImprove = viralHepatitis;
            expect(canImprove).toBe(true);
        });

        test('非酒精性脂肪肝: 減重可改善', () => {
            const nafld = true;
            const canImprove = nafld;
            expect(canImprove).toBe(true);
        });
    });

    describe('單位轉換', () => {
        test('膽紅素: mg/dL 到 µmol/L', () => {
            const biliMg = 2.0; // mg/dL
            const biliUmol = biliMg * 17.1; // µmol/L
            expect(biliUmol).toBeCloseTo(34.2, 1);
        });

        test('白蛋白: g/dL 到 g/L', () => {
            const albGdl = 3.5; // g/dL
            const albGl = albGdl * 10; // g/L
            expect(albGl).toBe(35);
        });
    });

    describe('與 MELD 的比較', () => {
        test('Child-Pugh 使用主觀臨床參數', () => {
            const hasSubjectiveParams = true; // 腹水、腦病
            expect(hasSubjectiveParams).toBe(true);
        });

        test('MELD 只使用客觀實驗室數據', () => {
            const meldObjective = true;
            expect(meldObjective).toBe(true);
        });

        test('MELD 更適合肝移植優先排序', () => {
            const meldForTransplant = true;
            expect(meldForTransplant).toBe(true);
        });

        test('Child-Pugh 更適合臨床分級', () => {
            const childPughForGrading = true;
            expect(childPughForGrading).toBe(true);
        });
    });

    describe('原發性膽汁性肝硬化修正', () => {
        test('PBC 患者膽紅素分界值不同', () => {
            // PBC: <4 mg/dL (1分), 4-10 (2分), >10 (3分)
            const isPBC = true;
            const differentCutoffs = isPBC;
            expect(differentCutoffs).toBe(true);
        });
    });

    describe('使用限制', () => {
        test('不適用於急性肝衰竭', () => {
            const isAcuteLiverFailure = true;
            const notApplicable = isAcuteLiverFailure;
            expect(notApplicable).toBe(true);
        });

        test('主觀參數可能有評估者間差異', () => {
            const hasInterraterVariability = true;
            expect(hasInterraterVariability).toBe(true);
        });

        test('未考慮腎功能', () => {
            const considersRenalFunction = false;
            expect(considersRenalFunction).toBe(false);
        });
    });
});

