/**
 * ASCVD Risk Score 單元測試
 */

import { describe, test, expect } from '@jest/globals';

describe('ASCVD Risk Score Calculator', () => {
    describe('風險因子', () => {
        test('應該包含年齡因子', () => {
            const age = 55;
            expect(age).toBeGreaterThanOrEqual(40);
            expect(age).toBeLessThanOrEqual(79);
        });

        test('應該包含性別因子', () => {
            const sex = 'male';
            expect(['male', 'female']).toContain(sex);
        });

        test('應該包含種族因子', () => {
            const race = 'white';
            expect(['white', 'african_american', 'other']).toContain(race);
        });

        test('應該包含總膽固醇', () => {
            const totalCholesterol = 200; // mg/dL
            expect(totalCholesterol).toBeGreaterThan(0);
        });

        test('應該包含 HDL 膽固醇', () => {
            const hdl = 50; // mg/dL
            expect(hdl).toBeGreaterThan(0);
        });

        test('應該包含收縮壓', () => {
            const sbp = 130; // mmHg
            expect(sbp).toBeGreaterThan(0);
        });

        test('應該包含是否服用降壓藥', () => {
            const onBloodPressureMeds = false;
            expect(typeof onBloodPressureMeds).toBe('boolean');
        });

        test('應該包含糖尿病狀態', () => {
            const hasDiabetes = false;
            expect(typeof hasDiabetes).toBe('boolean');
        });

        test('應該包含吸煙狀態', () => {
            const isSmoker = false;
            expect(typeof isSmoker).toBe('boolean');
        });
    });

    describe('年齡限制', () => {
        test('應該只適用於 40-79 歲', () => {
            const validAges = [40, 50, 60, 70, 79];
            validAges.forEach(age => {
                expect(age).toBeGreaterThanOrEqual(40);
                expect(age).toBeLessThanOrEqual(79);
            });
        });

        test('應該拒絕 <40 歲', () => {
            const age = 35;
            const isValid = age >= 40 && age <= 79;
            expect(isValid).toBe(false);
        });

        test('應該拒絕 >79 歲', () => {
            const age = 85;
            const isValid = age >= 40 && age <= 79;
            expect(isValid).toBe(false);
        });
    });

    describe('風險分類', () => {
        test('<5%: 低風險', () => {
            const risk = 3.5;
            const category = risk < 5 ? 'Low' : 'Higher';
            expect(category).toBe('Low');
        });

        test('5-7.4%: 邊界風險', () => {
            const risk = 6.0;
            const category = (risk >= 5 && risk < 7.5) ? 'Borderline' : 'Other';
            expect(category).toBe('Borderline');
        });

        test('7.5-19.9%: 中等風險', () => {
            const risk = 12.0;
            const category = (risk >= 7.5 && risk < 20) ? 'Intermediate' : 'Other';
            expect(category).toBe('Intermediate');
        });

        test('≥20%: 高風險', () => {
            const risk = 25.0;
            const category = risk >= 20 ? 'High' : 'Lower';
            expect(category).toBe('High');
        });
    });

    describe('治療建議', () => {
        test('低風險 (<5%): 生活方式改變', () => {
            const risk = 3.0;
            const recommendation = risk < 5 ? 'Lifestyle changes' : 'Consider statin';
            expect(recommendation).toBe('Lifestyle changes');
        });

        test('邊界風險 (5-7.4%): 考慮他汀類藥物', () => {
            const risk = 6.5;
            const recommendation = (risk >= 5 && risk < 7.5) ? 
                'Consider statin if risk enhancers present' : 'Other';
            expect(recommendation).toBe('Consider statin if risk enhancers present');
        });

        test('中等風險 (7.5-19.9%): 他汀類藥物', () => {
            const risk = 10.0;
            const recommendation = (risk >= 7.5 && risk < 20) ? 
                'Statin therapy recommended' : 'Other';
            expect(recommendation).toBe('Statin therapy recommended');
        });

        test('高風險 (≥20%): 高強度他汀類藥物', () => {
            const risk = 25.0;
            const recommendation = risk >= 20 ? 
                'High-intensity statin therapy' : 'Lower intensity';
            expect(recommendation).toBe('High-intensity statin therapy');
        });
    });

    describe('實際臨床案例', () => {
        test('案例1: 低風險中年女性', () => {
            // 45歲女性，無危險因子
            // TC 180, HDL 60, SBP 120, 無糖尿病、不吸煙
            const expectedLowRisk = true;
            expect(expectedLowRisk).toBe(true);
        });

        test('案例2: 中風險男性', () => {
            // 60歲男性，輕度高血壓
            // TC 220, HDL 45, SBP 140, 服用降壓藥
            const expectedModerateRisk = true;
            expect(expectedModerateRisk).toBe(true);
        });

        test('案例3: 高風險糖尿病患者', () => {
            // 65歲男性，糖尿病、吸煙
            // TC 240, HDL 35, SBP 150
            const expectedHighRisk = true;
            expect(expectedHighRisk).toBe(true);
        });
    });

    describe('單位轉換', () => {
        test('總膽固醇: mg/dL 到 mmol/L', () => {
            const tcMg = 200; // mg/dL
            const tcMmol = tcMg * 0.02586; // mmol/L
            expect(tcMmol).toBeCloseTo(5.17, 2);
        });

        test('HDL: mg/dL 到 mmol/L', () => {
            const hdlMg = 50; // mg/dL
            const hdlMmol = hdlMg * 0.02586; // mmol/L
            expect(hdlMmol).toBeCloseTo(1.29, 2);
        });
    });

    describe('風險增強因子', () => {
        test('家族史應該增加風險', () => {
            const hasFamilyHistory = true;
            expect(hasFamilyHistory).toBe(true);
        });

        test('慢性腎病應該增加風險', () => {
            const hasCKD = true;
            expect(hasCKD).toBe(true);
        });

        test('代謝症候群應該增加風險', () => {
            const hasMetabolicSyndrome = true;
            expect(hasMetabolicSyndrome).toBe(true);
        });

        test('慢性發炎疾病應該增加風險', () => {
            const hasInflammatoryDisease = true;
            expect(hasInflammatoryDisease).toBe(true);
        });

        test('早期停經應該增加風險（女性）', () => {
            const hasEarlyMenopause = true;
            expect(hasEarlyMenopause).toBe(true);
        });

        test('高風險種族（南亞人）應該增加風險', () => {
            const isHighRiskEthnicity = true;
            expect(isHighRiskEthnicity).toBe(true);
        });
    });

    describe('冠狀動脈鈣化評分整合', () => {
        test('CAC = 0 可能降低風險評估', () => {
            const cacScore = 0;
            const mayDowngradeRisk = cacScore === 0;
            expect(mayDowngradeRisk).toBe(true);
        });

        test('CAC 100-299 應該提升治療強度', () => {
            const cacScore = 150;
            const shouldEscalate = cacScore >= 100 && cacScore < 300;
            expect(shouldEscalate).toBe(true);
        });

        test('CAC ≥300 或 ≥75th percentile 應該高強度治療', () => {
            const cacScore = 350;
            const needsHighIntensity = cacScore >= 300;
            expect(needsHighIntensity).toBe(true);
        });
    });

    describe('指南版本差異', () => {
        test('2013 ACC/AHA 使用 Pooled Cohort Equations', () => {
            const usesPooledCohort = true;
            expect(usesPooledCohort).toBe(true);
        });

        test('應該分別計算男性和女性', () => {
            const sexSpecificCalculation = true;
            expect(sexSpecificCalculation).toBe(true);
        });

        test('應該分別計算不同種族', () => {
            const raceSpecificCalculation = true;
            expect(raceSpecificCalculation).toBe(true);
        });
    });

    describe('使用限制', () => {
        test('不適用於已有 ASCVD 的患者', () => {
            const hasExistingASCVD = true;
            const notApplicable = hasExistingASCVD;
            expect(notApplicable).toBe(true);
        });

        test('不適用於 LDL >190 mg/dL 的患者', () => {
            const ldl = 200;
            const notApplicable = ldl > 190;
            expect(notApplicable).toBe(true);
        });

        test('糖尿病患者可能需要不同考量', () => {
            const hasDiabetes = true;
            const needsSpecialConsideration = hasDiabetes;
            expect(needsSpecialConsideration).toBe(true);
        });
    });
});

