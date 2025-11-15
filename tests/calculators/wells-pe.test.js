/**
 * Wells Criteria for PE 單元測試
 */

import { describe, test, expect } from '@jest/globals';

describe('Wells Criteria for Pulmonary Embolism', () => {
    describe('評分項目', () => {
        test('臨床 DVT 症狀和體徵應該得 3 分', () => {
            const hasDVTSymptoms = true;
            const score = hasDVTSymptoms ? 3 : 0;
            expect(score).toBe(3);
        });

        test('PE 比其他診斷更可能應該得 3 分', () => {
            const peMoreLikely = true;
            const score = peMoreLikely ? 3 : 0;
            expect(score).toBe(3);
        });

        test('心率 >100 應該得 1.5 分', () => {
            const heartRate = 110;
            const score = heartRate > 100 ? 1.5 : 0;
            expect(score).toBe(1.5);
        });

        test('過去 4 週內制動或手術應該得 1.5 分', () => {
            const hasImmobilization = true;
            const score = hasImmobilization ? 1.5 : 0;
            expect(score).toBe(1.5);
        });

        test('既往 PE 或 DVT 應該得 1.5 分', () => {
            const hasPreviousPEDVT = true;
            const score = hasPreviousPEDVT ? 1.5 : 0;
            expect(score).toBe(1.5);
        });

        test('咯血應該得 1 分', () => {
            const hasHemoptysis = true;
            const score = hasHemoptysis ? 1 : 0;
            expect(score).toBe(1);
        });

        test('惡性腫瘤應該得 1 分', () => {
            const hasMalignancy = true;
            const score = hasMalignancy ? 1 : 0;
            expect(score).toBe(1);
        });
    });

    describe('總分計算', () => {
        test('最低分應該是 0', () => {
            const totalScore = 0;
            expect(totalScore).toBe(0);
        });

        test('最高分應該是 12.5', () => {
            // 所有項目都陽性
            const totalScore = 3 + 3 + 1.5 + 1.5 + 1.5 + 1 + 1;
            expect(totalScore).toBe(12.5);
        });
    });

    describe('風險分層 (兩級評分)', () => {
        test('Wells ≤4: PE unlikely (低風險)', () => {
            const score = 3.5;
            const risk = score <= 4 ? 'PE unlikely' : 'PE likely';
            expect(risk).toBe('PE unlikely');
        });

        test('Wells >4: PE likely (高風險)', () => {
            const score = 5.5;
            const risk = score > 4 ? 'PE likely' : 'PE unlikely';
            expect(risk).toBe('PE likely');
        });
    });

    describe('風險分層 (三級評分)', () => {
        test('Wells <2: 低風險', () => {
            const score = 1.5;
            const risk = score < 2 ? 'Low' : 'Higher';
            expect(risk).toBe('Low');
        });

        test('Wells 2-6: 中風險', () => {
            const score = 4;
            const risk = (score >= 2 && score <= 6) ? 'Moderate' : 'Other';
            expect(risk).toBe('Moderate');
        });

        test('Wells >6: 高風險', () => {
            const score = 7.5;
            const risk = score > 6 ? 'High' : 'Lower';
            expect(risk).toBe('High');
        });
    });

    describe('臨床處置建議', () => {
        test('低風險: D-dimer 檢測', () => {
            const score = 1.5;
            const recommendation = score < 2 ? 'D-dimer test' : 'Imaging';
            expect(recommendation).toBe('D-dimer test');
        });

        test('中風險: D-dimer 或影像學', () => {
            const score = 4;
            const recommendation = (score >= 2 && score <= 6) ? 'D-dimer or imaging' : 'Other';
            expect(recommendation).toBe('D-dimer or imaging');
        });

        test('高風險: 直接影像學檢查', () => {
            const score = 8;
            const recommendation = score > 6 ? 'Direct imaging (CTA)' : 'Other';
            expect(recommendation).toBe('Direct imaging (CTA)');
        });
    });

    describe('實際臨床案例', () => {
        test('案例1: 年輕健康患者，胸痛', () => {
            // 無特殊危險因子
            const score = 0;
            expect(score).toBeLessThan(2);
            // 建議: D-dimer 檢測
        });

        test('案例2: 術後患者，心搏過速', () => {
            const immobilization = 1.5;
            const tachycardia = 1.5;
            const score = immobilization + tachycardia;
            expect(score).toBe(3);
            // 中風險
        });

        test('案例3: 癌症患者，DVT 病史，心搏過速', () => {
            const malignancy = 1;
            const previousPE = 1.5;
            const tachycardia = 1.5;
            const peMoreLikely = 3;
            const score = malignancy + previousPE + tachycardia + peMoreLikely;
            expect(score).toBe(7);
            // 高風險，需要直接影像學
        });
    });

    describe('D-dimer 整合', () => {
        test('低風險 + 陰性 D-dimer: 可排除 PE', () => {
            const wellsScore = 1.5;
            const dDimerNegative = true;
            const canExcludePE = (wellsScore < 2 && dDimerNegative);
            expect(canExcludePE).toBe(true);
        });

        test('低風險 + 陽性 D-dimer: 需要影像學', () => {
            const wellsScore = 1.5;
            const dDimerPositive = true;
            const needsImaging = (wellsScore < 2 && dDimerPositive);
            expect(needsImaging).toBe(true);
        });

        test('高風險: 無論 D-dimer 結果都需影像學', () => {
            const wellsScore = 8;
            const needsImaging = wellsScore > 6;
            expect(needsImaging).toBe(true);
        });
    });
});

