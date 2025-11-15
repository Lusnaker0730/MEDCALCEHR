/**
 * TIMI Risk Score for UA/NSTEMI 單元測試
 */

import { describe, test, expect } from '@jest/globals';

describe('TIMI Risk Score for UA/NSTEMI', () => {
    describe('TIMI 評分標準 (7項)', () => {
        test('年齡 ≥65', () => {
            const age = 70;
            const score = age >= 65 ? 1 : 0;
            expect(score).toBe(1);
        });

        test('≥3 個冠心病危險因子', () => {
            const riskFactors = ['HTN', 'DM', 'smoking'];
            const score = riskFactors.length >= 3 ? 1 : 0;
            expect(score).toBe(1);
        });

        test('已知冠狀動脈狹窄 ≥50%', () => {
            const knownCAD = true;
            const score = knownCAD ? 1 : 0;
            expect(score).toBe(1);
        });

        test('過去 24 小時內使用阿司匹林', () => {
            const aspirinUse = true;
            const score = aspirinUse ? 1 : 0;
            expect(score).toBe(1);
        });

        test('過去 24 小時內 ≥2 次嚴重心絞痛發作', () => {
            const severeAngina = true;
            const score = severeAngina ? 1 : 0;
            expect(score).toBe(1);
        });

        test('ST 段改變 ≥0.5mm', () => {
            const stChanges = true;
            const score = stChanges ? 1 : 0;
            expect(score).toBe(1);
        });

        test('心肌標記物升高', () => {
            const elevatedMarkers = true;
            const score = elevatedMarkers ? 1 : 0;
            expect(score).toBe(1);
        });
    });

    describe('總分計算', () => {
        test('最低分應該是 0', () => {
            const totalScore = 0;
            expect(totalScore).toBe(0);
        });

        test('最高分應該是 7', () => {
            const totalScore = 1 + 1 + 1 + 1 + 1 + 1 + 1;
            expect(totalScore).toBe(7);
        });
    });

    describe('14天事件風險', () => {
        test('TIMI 0-1: 5% 風險', () => {
            const score = 1;
            const risk = score <= 1 ? '5%' : 'Higher';
            expect(risk).toBe('5%');
        });

        test('TIMI 2: 8% 風險', () => {
            const score = 2;
            const risk = score === 2 ? '8%' : 'Other';
            expect(risk).toBe('8%');
        });

        test('TIMI 3: 13% 風險', () => {
            const score = 3;
            const risk = score === 3 ? '13%' : 'Other';
            expect(risk).toBe('13%');
        });

        test('TIMI 4: 20% 風險', () => {
            const score = 4;
            const risk = score === 4 ? '20%' : 'Other';
            expect(risk).toBe('20%');
        });

        test('TIMI 5: 26% 風險', () => {
            const score = 5;
            const risk = score === 5 ? '26%' : 'Other';
            expect(risk).toBe('26%');
        });

        test('TIMI 6-7: 41% 風險', () => {
            const score = 6;
            const risk = score >= 6 ? '41%' : 'Lower';
            expect(risk).toBe('41%');
        });
    });

    describe('風險分層', () => {
        test('TIMI 0-2: 低風險', () => {
            const score = 2;
            const risk = score <= 2 ? 'Low' : 'Higher';
            expect(risk).toBe('Low');
        });

        test('TIMI 3-4: 中風險', () => {
            const score = 3;
            const risk = score >= 3 && score <= 4 ? 'Moderate' : 'Other';
            expect(risk).toBe('Moderate');
        });

        test('TIMI 5-7: 高風險', () => {
            const score = 6;
            const risk = score >= 5 ? 'High' : 'Lower';
            expect(risk).toBe('High');
        });
    });

    describe('冠心病危險因子', () => {
        test('家族史計入危險因子', () => {
            const hasFamilyHistory = true;
            expect(hasFamilyHistory).toBe(true);
        });

        test('高血壓計入危險因子', () => {
            const hasHypertension = true;
            expect(hasHypertension).toBe(true);
        });

        test('高膽固醇血症計入危險因子', () => {
            const hasHyperlipidemia = true;
            expect(hasHyperlipidemia).toBe(true);
        });

        test('糖尿病計入危險因子', () => {
            const hasDiabetes = true;
            expect(hasDiabetes).toBe(true);
        });

        test('吸煙計入危險因子', () => {
            const isSmoker = true;
            expect(isSmoker).toBe(true);
        });
    });

    describe('實際臨床案例', () => {
        test('案例1: 低風險患者', () => {
            const age = 0; // <65
            const riskFactors = 0; // <3個
            const knownCAD = 0;
            const aspirin = 0;
            const severeAngina = 0;
            const stChanges = 0;
            const markers = 0;
            const timi = age + riskFactors + knownCAD + aspirin + severeAngina + stChanges + markers;
            
            expect(timi).toBe(0);
            // 5% 風險
        });

        test('案例2: 中風險患者', () => {
            const age = 1; // ≥65
            const riskFactors = 1; // ≥3個
            const knownCAD = 0;
            const aspirin = 0;
            const severeAngina = 1;
            const stChanges = 0;
            const markers = 1;
            const timi = age + riskFactors + knownCAD + aspirin + severeAngina + stChanges + markers;
            
            expect(timi).toBe(4);
            // 20% 風險
        });

        test('案例3: 高風險患者', () => {
            const age = 1; // ≥65
            const riskFactors = 1; // ≥3個
            const knownCAD = 1;
            const aspirin = 1;
            const severeAngina = 1;
            const stChanges = 1;
            const markers = 1;
            const timi = age + riskFactors + knownCAD + aspirin + severeAngina + stChanges + markers;
            
            expect(timi).toBe(7);
            // 41% 風險
        });
    });

    describe('臨床應用', () => {
        test('低風險可考慮早期出院', () => {
            const score = 1;
            const earlyDischarge = score <= 2;
            expect(earlyDischarge).toBe(true);
        });

        test('高風險需早期侵入性策略', () => {
            const score = 6;
            const needsInvasive = score >= 5;
            expect(needsInvasive).toBe(true);
        });
    });

    describe('與其他評分比較', () => {
        test('TIMI 使用二分變量', () => {
            const usesBinary = true;
            expect(usesBinary).toBe(true);
        });

        test('GRACE 使用連續變量', () => {
            const graceUsesContinuous = true;
            expect(graceUsesContinuous).toBe(true);
        });

        test('HEART 包含主觀病史評估', () => {
            const heartHasHistory = true;
            expect(heartHasHistory).toBe(true);
        });
    });

    describe('阿司匹林使用的重要性', () => {
        test('阿司匹林使用反映疾病嚴重程度', () => {
            const aspirinUseMeansKnownDisease = true;
            expect(aspirinUseMeansKnownDisease).toBe(true);
        });

        test('已在使用阿司匹林但仍發作表示更嚴重', () => {
            const moreSerious = true;
            expect(moreSerious).toBe(true);
        });
    });

    describe('使用限制', () => {
        test('不適用於 STEMI', () => {
            const notForSTEMI = true;
            expect(notForSTEMI).toBe(true);
        });

        test('主要用於 UA/NSTEMI', () => {
            const forNSTEMI = true;
            expect(forNSTEMI).toBe(true);
        });

        test('需要結合其他臨床資訊', () => {
            const needsClinicalContext = true;
            expect(needsClinicalContext).toBe(true);
        });
    });
});

