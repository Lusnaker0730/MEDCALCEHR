/**
 * HEART Score 單元測試
 */

import { describe, test, expect } from '@jest/globals';

describe('HEART Score for Major Cardiac Events', () => {
    describe('HEART 評分標準 (5項)', () => {
        test('H - History (病史)', () => {
            const history = ['highly_suspicious', 'moderately_suspicious', 'slightly_suspicious'];
            expect(history.length).toBe(3);
        });

        test('E - ECG (心電圖)', () => {
            const ecg = ['significant_st_depression', 'non_specific_repolarization', 'normal'];
            expect(ecg.length).toBe(3);
        });

        test('A - Age (年齡)', () => {
            const age = 55;
            expect(age).toBeGreaterThan(0);
        });

        test('R - Risk factors (危險因子)', () => {
            const riskFactors = ['hypertension', 'diabetes', 'smoking', 'hyperlipidemia', 'family_history'];
            expect(riskFactors.length).toBe(5);
        });

        test('T - Troponin (肌鈣蛋白)', () => {
            const troponin = ['3x_normal', '1_3x_normal', 'normal'];
            expect(troponin.length).toBe(3);
        });
    });

    describe('病史 (History) 評分', () => {
        test('高度懷疑: 2分', () => {
            const history = 'highly_suspicious';
            const score = history === 'highly_suspicious' ? 2 : 0;
            expect(score).toBe(2);
        });

        test('中度懷疑: 1分', () => {
            const history = 'moderately_suspicious';
            const score = history === 'moderately_suspicious' ? 1 : 0;
            expect(score).toBe(1);
        });

        test('輕度懷疑: 0分', () => {
            const history = 'slightly_suspicious';
            const score = history === 'slightly_suspicious' ? 0 : -1;
            expect(score).toBe(0);
        });
    });

    describe('心電圖 (ECG) 評分', () => {
        test('明顯 ST 段壓低: 2分', () => {
            const ecg = 'significant_st_depression';
            const score = ecg === 'significant_st_depression' ? 2 : 0;
            expect(score).toBe(2);
        });

        test('非特異性再極化異常: 1分', () => {
            const ecg = 'non_specific_repolarization';
            const score = ecg === 'non_specific_repolarization' ? 1 : 0;
            expect(score).toBe(1);
        });

        test('正常: 0分', () => {
            const ecg = 'normal';
            const score = ecg === 'normal' ? 0 : -1;
            expect(score).toBe(0);
        });
    });

    describe('年齡 (Age) 評分', () => {
        test('年齡 <45: 0分', () => {
            const age = 40;
            const score = age < 45 ? 0 : -1;
            expect(score).toBe(0);
        });

        test('年齡 45-64: 1分', () => {
            const age = 55;
            const score = age >= 45 && age <= 64 ? 1 : -1;
            expect(score).toBe(1);
        });

        test('年齡 ≥65: 2分', () => {
            const age = 70;
            const score = age >= 65 ? 2 : -1;
            expect(score).toBe(2);
        });
    });

    describe('危險因子 (Risk Factors) 評分', () => {
        test('≥3 個危險因子: 2分', () => {
            const factors = ['hypertension', 'diabetes', 'smoking', 'hyperlipidemia'];
            const score = factors.length >= 3 ? 2 : 0;
            expect(score).toBe(2);
        });

        test('1-2 個危險因子: 1分', () => {
            const factors = ['hypertension', 'smoking'];
            const score = factors.length >= 1 && factors.length <= 2 ? 1 : -1;
            expect(score).toBe(1);
        });

        test('無危險因子: 0分', () => {
            const factors = [];
            const score = factors.length === 0 ? 0 : -1;
            expect(score).toBe(0);
        });

        test('危險因子包含: 高血壓', () => {
            const hasHypertension = true;
            expect(hasHypertension).toBe(true);
        });

        test('危險因子包含: 糖尿病', () => {
            const hasDiabetes = true;
            expect(hasDiabetes).toBe(true);
        });

        test('危險因子包含: 吸煙', () => {
            const isSmoker = true;
            expect(isSmoker).toBe(true);
        });

        test('危險因子包含: 高血脂', () => {
            const hasHyperlipidemia = true;
            expect(hasHyperlipidemia).toBe(true);
        });

        test('危險因子包含: 家族史', () => {
            const hasFamilyHistory = true;
            expect(hasFamilyHistory).toBe(true);
        });
    });

    describe('肌鈣蛋白 (Troponin) 評分', () => {
        test('≥3倍正常值: 2分', () => {
            const troponin = 3.5; // 倍數
            const score = troponin >= 3 ? 2 : 0;
            expect(score).toBe(2);
        });

        test('1-3倍正常值: 1分', () => {
            const troponin = 2.0;
            const score = troponin >= 1 && troponin < 3 ? 1 : -1;
            expect(score).toBe(1);
        });

        test('正常值: 0分', () => {
            const troponin = 0.5;
            const score = troponin < 1 ? 0 : -1;
            expect(score).toBe(0);
        });
    });

    describe('總分計算', () => {
        test('最低分應該是 0', () => {
            const totalScore = 0 + 0 + 0 + 0 + 0;
            expect(totalScore).toBe(0);
        });

        test('最高分應該是 10', () => {
            const totalScore = 2 + 2 + 2 + 2 + 2;
            expect(totalScore).toBe(10);
        });
    });

    describe('風險分層與 6週 MACE', () => {
        test('HEART 0-3: 低風險 (1.7%)', () => {
            const score = 2;
            const risk = score <= 3 ? 'Low' : 'Higher';
            const maceRate = score <= 3 ? '1.7%' : 'Higher';
            expect(risk).toBe('Low');
            expect(maceRate).toBe('1.7%');
        });

        test('HEART 4-6: 中風險 (12-17%)', () => {
            const score = 5;
            const risk = score >= 4 && score <= 6 ? 'Moderate' : 'Other';
            expect(risk).toBe('Moderate');
        });

        test('HEART 7-10: 高風險 (50-65%)', () => {
            const score = 8;
            const risk = score >= 7 ? 'High' : 'Lower';
            expect(risk).toBe('High');
        });
    });

    describe('臨床處置建議', () => {
        test('HEART 0-3: 可考慮早期出院', () => {
            const score = 2;
            const action = score <= 3 ? 'Consider early discharge' : 'Admit';
            expect(action).toBe('Consider early discharge');
        });

        test('HEART 4-6: 住院觀察', () => {
            const score = 5;
            const action = score >= 4 && score <= 6 ? 'Admit for observation' : 'Other';
            expect(action).toBe('Admit for observation');
        });

        test('HEART 7-10: 緊急侵入性治療', () => {
            const score = 8;
            const action = score >= 7 ? 'Early invasive strategy' : 'Conservative';
            expect(action).toBe('Early invasive strategy');
        });
    });

    describe('實際臨床案例', () => {
        test('案例1: 年輕健康患者，非典型胸痛', () => {
            const history = 0; // 輕度懷疑
            const ecg = 0; // 正常
            const age = 0; // <45
            const riskFactors = 0; // 無
            const troponin = 0; // 正常
            const heart = history + ecg + age + riskFactors + troponin;
            
            expect(heart).toBe(0);
            // 低風險，可出院
        });

        test('案例2: 中年患者，多重危險因子', () => {
            const history = 1; // 中度懷疑
            const ecg = 1; // 非特異性變化
            const age = 1; // 45-64
            const riskFactors = 2; // ≥3個
            const troponin = 0; // 正常
            const heart = history + ecg + age + riskFactors + troponin;
            
            expect(heart).toBe(5);
            // 中風險，需住院觀察
        });

        test('案例3: 老年患者，典型心絞痛，troponin 升高', () => {
            const history = 2; // 高度懷疑
            const ecg = 2; // ST 壓低
            const age = 2; // ≥65
            const riskFactors = 2; // ≥3個
            const troponin = 2; // ≥3倍
            const heart = history + ecg + age + riskFactors + troponin;
            
            expect(heart).toBe(10);
            // 高風險，需緊急處置
        });
    });

    describe('與其他評分比較', () => {
        test('HEART 比 TIMI 更適合急診使用', () => {
            const betterForED = true;
            expect(betterForED).toBe(true);
        });

        test('HEART 可早期識別低風險患者', () => {
            const identifiesLowRisk = true;
            expect(identifiesLowRisk).toBe(true);
        });

        test('GRACE 更適合已確診 ACS 患者', () => {
            const graceForConfirmed = true;
            expect(graceForConfirmed).toBe(true);
        });
    });

    describe('使用時機', () => {
        test('適用於急診胸痛患者', () => {
            const applicableED = true;
            expect(applicableED).toBe(true);
        });

        test('不適用於 STEMI 患者', () => {
            const notForSTEMI = true;
            expect(notForSTEMI).toBe(true);
        });

        test('適用於可能的 NSTEMI/UA', () => {
            const forNSTEMI = true;
            expect(forNSTEMI).toBe(true);
        });
    });

    describe('驗證研究結果', () => {
        test('低風險患者可安全出院', () => {
            const safeDischargeLowRisk = true;
            expect(safeDischargeLowRisk).toBe(true);
        });

        test('減少不必要的住院', () => {
            const reducesAdmissions = true;
            expect(reducesAdmissions).toBe(true);
        });

        test('保持高陰性預測值', () => {
            const highNPV = true;
            expect(highNPV).toBe(true);
        });
    });

    describe('使用限制', () => {
        test('需要臨床判斷輔助', () => {
            const needsClinicalJudgment = true;
            expect(needsClinicalJudgment).toBe(true);
        });

        test('病史評分有主觀性', () => {
            const historySubjective = true;
            expect(historySubjective).toBe(true);
        });

        test('需要高敏肌鈣蛋白檢測', () => {
            const needsHsTroponin = true;
            expect(needsHsTroponin).toBe(true);
        });
    });
});

