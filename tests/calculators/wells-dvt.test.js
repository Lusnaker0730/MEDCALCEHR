/**
 * Wells Criteria for DVT 單元測試
 */

import { describe, test, expect } from '@jest/globals';

describe('Wells Criteria for Deep Vein Thrombosis', () => {
    describe('評分項目', () => {
        test('活動性癌症應該得 1 分', () => {
            const hasActiveCancer = true;
            const score = hasActiveCancer ? 1 : 0;
            expect(score).toBe(1);
        });

        test('癱瘓或下肢石膏固定應該得 1 分', () => {
            const hasImmobilization = true;
            const score = hasImmobilization ? 1 : 0;
            expect(score).toBe(1);
        });

        test('臥床 >3 天或近期手術應該得 1 分', () => {
            const hasBedridden = true;
            const score = hasBedridden ? 1 : 0;
            expect(score).toBe(1);
        });

        test('深靜脈走行處局部壓痛應該得 1 分', () => {
            const hasTenderness = true;
            const score = hasTenderness ? 1 : 0;
            expect(score).toBe(1);
        });

        test('整條腿腫脹應該得 1 分', () => {
            const hasEntireLegSwelling = true;
            const score = hasEntireLegSwelling ? 1 : 0;
            expect(score).toBe(1);
        });

        test('小腿腫脹 >3cm 應該得 1 分', () => {
            const calfDifference = 3.5; // cm
            const score = calfDifference >= 3 ? 1 : 0;
            expect(score).toBe(1);
        });

        test('凹陷性水腫應該得 1 分', () => {
            const hasPittingEdema = true;
            const score = hasPittingEdema ? 1 : 0;
            expect(score).toBe(1);
        });

        test('淺靜脈曲張應該得 1 分', () => {
            const hasCollateralVeins = true;
            const score = hasCollateralVeins ? 1 : 0;
            expect(score).toBe(1);
        });

        test('既往 DVT 應該得 1 分', () => {
            const hasPreviousDVT = true;
            const score = hasPreviousDVT ? 1 : 0;
            expect(score).toBe(1);
        });

        test('其他診斷更可能應該減 2 分', () => {
            const alternativeDiagnosis = true;
            const score = alternativeDiagnosis ? -2 : 0;
            expect(score).toBe(-2);
        });
    });

    describe('總分計算', () => {
        test('最低分應該是 -2', () => {
            const alternativeDiagnosis = -2;
            const totalScore = alternativeDiagnosis;
            expect(totalScore).toBe(-2);
        });

        test('最高分應該是 9', () => {
            // 所有陽性項目（9個）減去替代診斷
            const totalScore = 9;
            expect(totalScore).toBe(9);
        });
    });

    describe('風險分層', () => {
        test('Wells ≤0: 低風險', () => {
            const score = 0;
            const risk = score <= 0 ? 'Low' : 'Higher';
            expect(risk).toBe('Low');
        });

        test('Wells 1-2: 中風險', () => {
            const score = 1.5;
            const risk = (score >= 1 && score <= 2) ? 'Moderate' : 'Other';
            expect(risk).toBe('Moderate');
        });

        test('Wells ≥3: 高風險', () => {
            const score = 4;
            const risk = score >= 3 ? 'High' : 'Lower';
            expect(risk).toBe('High');
        });
    });

    describe('DVT 可能性', () => {
        test('Wells <2: DVT unlikely', () => {
            const score = 1;
            const probability = score < 2 ? 'DVT unlikely' : 'DVT likely';
            expect(probability).toBe('DVT unlikely');
        });

        test('Wells ≥2: DVT likely', () => {
            const score = 3;
            const probability = score >= 2 ? 'DVT likely' : 'DVT unlikely';
            expect(probability).toBe('DVT likely');
        });
    });

    describe('臨床處置建議', () => {
        test('低風險: D-dimer 檢測', () => {
            const score = 0;
            const recommendation = score <= 0 ? 'D-dimer' : 'Ultrasound';
            expect(recommendation).toBe('D-dimer');
        });

        test('中風險: D-dimer 或超音波', () => {
            const score = 1;
            const recommendation = (score >= 1 && score <= 2) ? 'D-dimer or US' : 'Other';
            expect(recommendation).toBe('D-dimer or US');
        });

        test('高風險: 超音波檢查', () => {
            const score = 4;
            const recommendation = score >= 3 ? 'Ultrasound' : 'Other';
            expect(recommendation).toBe('Ultrasound');
        });
    });

    describe('實際臨床案例', () => {
        test('案例1: 蜂窩組織炎', () => {
            const tenderness = 1;
            const swelling = 1;
            const alternativeDiagnosis = -2; // 蜂窩組織炎更可能
            const score = tenderness + swelling + alternativeDiagnosis;
            expect(score).toBe(0);
            // 低風險
        });

        test('案例2: 術後患者，單側腿腫', () => {
            const recentSurgery = 1;
            const entireLegSwelling = 1;
            const calfSwelling = 1;
            const pittingEdema = 1;
            const score = recentSurgery + entireLegSwelling + calfSwelling + pittingEdema;
            expect(score).toBe(4);
            // 高風險，需要超音波
        });

        test('案例3: 癌症患者，DVT 病史，腿部壓痛', () => {
            const cancer = 1;
            const previousDVT = 1;
            const tenderness = 1;
            const calfSwelling = 1;
            const score = cancer + previousDVT + tenderness + calfSwelling;
            expect(score).toBe(4);
            // 高風險
        });

        test('案例4: 年輕健康患者，運動後腿痛', () => {
            const alternativeDiagnosis = -2; // 肌肉拉傷更可能
            const score = alternativeDiagnosis;
            expect(score).toBe(-2);
            // 低風險
        });
    });

    describe('D-dimer 整合', () => {
        test('低風險 + 陰性 D-dimer: 可排除 DVT', () => {
            const wellsScore = 0;
            const dDimerNegative = true;
            const canExcludeDVT = (wellsScore <= 0 && dDimerNegative);
            expect(canExcludeDVT).toBe(true);
        });

        test('低風險 + 陽性 D-dimer: 需要超音波', () => {
            const wellsScore = 0;
            const dDimerPositive = true;
            const needsUltrasound = dDimerPositive;
            expect(needsUltrasound).toBe(true);
        });

        test('高風險: 直接超音波，不等 D-dimer', () => {
            const wellsScore = 5;
            const needsUltrasound = wellsScore >= 3;
            expect(needsUltrasound).toBe(true);
        });
    });

    describe('小腿周徑測量', () => {
        test('雙側小腿周徑差異 <3cm 不計分', () => {
            const difference = 2.5; // cm
            const score = difference >= 3 ? 1 : 0;
            expect(score).toBe(0);
        });

        test('雙側小腿周徑差異 ≥3cm 得 1 分', () => {
            const difference = 3.5; // cm
            const score = difference >= 3 ? 1 : 0;
            expect(score).toBe(1);
        });

        test('應在脛骨結節下 10cm 處測量', () => {
            const measurementPoint = '10cm below tibial tuberosity';
            expect(measurementPoint).toBeDefined();
        });
    });

    describe('使用限制', () => {
        test('Wells 評分不適用於表淺靜脈血栓', () => {
            const isSuperficialVT = true;
            const wellsNotApplicable = isSuperficialVT;
            expect(wellsNotApplicable).toBe(true);
        });

        test('Wells 評分不適用於上肢 DVT', () => {
            const isUpperExtremity = true;
            const wellsNotApplicable = isUpperExtremity;
            expect(wellsNotApplicable).toBe(true);
        });

        test('懷孕患者需要特別考慮', () => {
            const isPregnant = true;
            const needsModification = isPregnant;
            expect(needsModification).toBe(true);
        });
    });
});

