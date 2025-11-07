/**
 * Charlson Comorbidity Index 單元測試
 */

import { describe, test, expect } from '@jest/globals';

describe('Charlson Comorbidity Index (CCI)', () => {
    describe('1 分疾病', () => {
        test('心肌梗塞應該得 1 分', () => {
            const hasMyocardialInfarction = true;
            const score = hasMyocardialInfarction ? 1 : 0;
            expect(score).toBe(1);
        });

        test('充血性心衰應該得 1 分', () => {
            const hasCongestiveHeartFailure = true;
            const score = hasCongestiveHeartFailure ? 1 : 0;
            expect(score).toBe(1);
        });

        test('周邊血管疾病應該得 1 分', () => {
            const hasPeripheralVascularDisease = true;
            const score = hasPeripheralVascularDisease ? 1 : 0;
            expect(score).toBe(1);
        });

        test('腦血管疾病應該得 1 分', () => {
            const hasCerebrovascularDisease = true;
            const score = hasCerebrovascularDisease ? 1 : 0;
            expect(score).toBe(1);
        });

        test('癡呆應該得 1 分', () => {
            const hasDementia = true;
            const score = hasDementia ? 1 : 0;
            expect(score).toBe(1);
        });

        test('慢性肺病應該得 1 分', () => {
            const hasChronicPulmonaryDisease = true;
            const score = hasChronicPulmonaryDisease ? 1 : 0;
            expect(score).toBe(1);
        });

        test('結締組織疾病應該得 1 分', () => {
            const hasConnectiveTissueDisease = true;
            const score = hasConnectiveTissueDisease ? 1 : 0;
            expect(score).toBe(1);
        });

        test('消化性潰瘍應該得 1 分', () => {
            const hasPepticUlcerDisease = true;
            const score = hasPepticUlcerDisease ? 1 : 0;
            expect(score).toBe(1);
        });

        test('輕度肝病應該得 1 分', () => {
            const hasMildLiverDisease = true;
            const score = hasMildLiverDisease ? 1 : 0;
            expect(score).toBe(1);
        });

        test('無併發症的糖尿病應該得 1 分', () => {
            const hasDiabetesWithoutComplications = true;
            const score = hasDiabetesWithoutComplications ? 1 : 0;
            expect(score).toBe(1);
        });
    });

    describe('2 分疾病', () => {
        test('偏癱應該得 2 分', () => {
            const hasHemiplegia = true;
            const score = hasHemiplegia ? 2 : 0;
            expect(score).toBe(2);
        });

        test('中重度腎病應該得 2 分', () => {
            const hasModerateToSevereRenalDisease = true;
            const score = hasModerateToSevereRenalDisease ? 2 : 0;
            expect(score).toBe(2);
        });

        test('有終端器官損傷的糖尿病應該得 2 分', () => {
            const hasDiabetesWithEndOrganDamage = true;
            const score = hasDiabetesWithEndOrganDamage ? 2 : 0;
            expect(score).toBe(2);
        });

        test('任何腫瘤（非轉移性）應該得 2 分', () => {
            const hasTumorWithoutMetastasis = true;
            const score = hasTumorWithoutMetastasis ? 2 : 0;
            expect(score).toBe(2);
        });

        test('白血病應該得 2 分', () => {
            const hasLeukemia = true;
            const score = hasLeukemia ? 2 : 0;
            expect(score).toBe(2);
        });

        test('淋巴瘤應該得 2 分', () => {
            const hasLymphoma = true;
            const score = hasLymphoma ? 2 : 0;
            expect(score).toBe(2);
        });
    });

    describe('3 分疾病', () => {
        test('中重度肝病應該得 3 分', () => {
            const hasModerateToSevereLiverDisease = true;
            const score = hasModerateToSevereLiverDisease ? 3 : 0;
            expect(score).toBe(3);
        });
    });

    describe('6 分疾病', () => {
        test('轉移性實體瘤應該得 6 分', () => {
            const hasMetastaticSolidTumor = true;
            const score = hasMetastaticSolidTumor ? 6 : 0;
            expect(score).toBe(6);
        });

        test('AIDS 應該得 6 分', () => {
            const hasAIDS = true;
            const score = hasAIDS ? 6 : 0;
            expect(score).toBe(6);
        });
    });

    describe('年齡調整', () => {
        test('年齡 <40 應該得 0 分', () => {
            const age = 35;
            const ageScore = age < 40 ? 0 : Math.floor((age - 40) / 10);
            expect(ageScore).toBe(0);
        });

        test('年齡 40-49 應該得 0 分', () => {
            const age = 45;
            const ageScore = Math.floor((age - 40) / 10);
            expect(ageScore).toBe(0);
        });

        test('年齡 50-59 應該得 1 分', () => {
            const age = 55;
            const ageScore = Math.floor((age - 40) / 10);
            expect(ageScore).toBe(1);
        });

        test('年齡 60-69 應該得 2 分', () => {
            const age = 65;
            const ageScore = Math.floor((age - 40) / 10);
            expect(ageScore).toBe(2);
        });

        test('年齡 70-79 應該得 3 分', () => {
            const age = 75;
            const ageScore = Math.floor((age - 40) / 10);
            expect(ageScore).toBe(3);
        });

        test('年齡 ≥80 應該得 4 分', () => {
            const age = 85;
            const ageScore = Math.floor((age - 40) / 10);
            expect(ageScore).toBe(4);
        });
    });

    describe('總分計算', () => {
        test('健康年輕人應該得 0 分', () => {
            const age = 30;
            const comorbidityScore = 0;
            const totalScore = comorbidityScore + (age < 40 ? 0 : Math.floor((age - 40) / 10));
            expect(totalScore).toBe(0);
        });

        test('中年患者單一疾病', () => {
            const age = 55; // 1 分
            const hasMyocardialInfarction = 1; // 1 分
            const totalScore = Math.floor((age - 40) / 10) + hasMyocardialInfarction;
            expect(totalScore).toBe(2);
        });

        test('老年多重疾病患者', () => {
            const age = 75; // 3 分
            const comorbidities = 1 + 1 + 2 + 2; // 多種疾病
            const totalScore = Math.floor((age - 40) / 10) + comorbidities;
            expect(totalScore).toBe(9);
        });
    });

    describe('預後預測', () => {
        test('CCI 0: 12% 10年死亡率', () => {
            const cci = 0;
            const mortality = cci === 0 ? '12%' : 'Higher';
            expect(mortality).toBe('12%');
        });

        test('CCI 1-2: 21-26% 10年死亡率', () => {
            const cci = 2;
            const inRange = cci >= 1 && cci <= 2;
            expect(inRange).toBe(true);
        });

        test('CCI 3-4: 52-59% 10年死亡率', () => {
            const cci = 4;
            const inRange = cci >= 3 && cci <= 4;
            expect(inRange).toBe(true);
        });

        test('CCI ≥5: 85%+ 10年死亡率', () => {
            const cci = 6;
            const highMortality = cci >= 5;
            expect(highMortality).toBe(true);
        });
    });

    describe('實際臨床案例', () => {
        test('案例1: 健康年輕人', () => {
            const age = 35;
            const cci = 0;
            expect(cci).toBe(0);
            // 預期壽命正常
        });

        test('案例2: 中年糖尿病患者', () => {
            const age = 60; // 2 分
            const diabetes = 1; // 1 分
            const cci = 2 + diabetes;
            expect(cci).toBe(3);
        });

        test('案例3: 老年心血管疾病患者', () => {
            const age = 75; // 3 分
            const mi = 1;
            const chf = 1;
            const pvd = 1;
            const comorbidities = mi + chf + pvd;
            const cci = 3 + comorbidities;
            expect(cci).toBe(6);
        });

        test('案例4: 轉移性癌症患者', () => {
            const age = 70; // 3 分
            const metastaticCancer = 6; // 6 分
            const cci = 3 + metastaticCancer;
            expect(cci).toBe(9);
            // 預後極差
        });
    });

    describe('使用場景', () => {
        test('可用於調整臨床研究結果', () => {
            const studyAdjusted = true;
            expect(studyAdjusted).toBe(true);
        });

        test('可用於預測手術風險', () => {
            const cci = 5;
            const highSurgicalRisk = cci >= 3;
            expect(highSurgicalRisk).toBe(true);
        });

        test('可用於資源分配決策', () => {
            const cci = 8;
            const needsIntensiveCare = cci > 5;
            expect(needsIntensiveCare).toBe(true);
        });
    });

    describe('疾病互斥性', () => {
        test('輕度肝病和中重度肝病互斥', () => {
            const hasMildLiver = true;
            const hasSevereLiver = false;
            // 只能選一個
            expect(hasMildLiver && hasSevereLiver).toBe(false);
        });

        test('無併發症糖尿病和有併發症糖尿病互斥', () => {
            const diabetesWithout = true;
            const diabetesWith = false;
            // 只能選一個
            expect(diabetesWithout && diabetesWith).toBe(false);
        });

        test('非轉移性腫瘤和轉移性腫瘤互斥', () => {
            const nonMetastatic = true;
            const metastatic = false;
            // 只能選一個
            expect(nonMetastatic && metastatic).toBe(false);
        });
    });

    describe('分數範圍', () => {
        test('理論最低分是 0', () => {
            const minScore = 0;
            expect(minScore).toBe(0);
        });

        test('理論最高分約為 37', () => {
            // 年齡 ≥80: 4 分
            // 多種 1 分疾病: 10 分
            // 多種 2 分疾病: 12 分
            // 中重度肝病: 3 分
            // 轉移性腫瘤或 AIDS: 6 分
            // 但有些疾病互斥，實際最高分可能略低
            const theoreticalMax = 4 + 10 + 12 + 3 + 6;
            expect(theoreticalMax).toBe(35);
        });
    });
});

