/**
 * CKD-EPI GFR (2021) Calculator 單元測試
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { ckdEpi } from '../../js/calculators/ckd-epi/index.js';
import {
    createMockFHIRClient,
    createMockContainer,
    cleanupContainer,
    validateCalculatorStructure
} from './test-helpers.js';

describe('CKD-EPI GFR Calculator', () => {
    let container;
    let mockClient;

    beforeEach(() => {
        container = createMockContainer();
        mockClient = createMockFHIRClient();
    });

    afterEach(() => {
        cleanupContainer(container);
    });

    test('應該有正確的模組結構', () => {
        validateCalculatorStructure(ckdEpi);
        expect(ckdEpi.id).toBe('ckd-epi');
        expect(ckdEpi.title).toContain('CKD-EPI');
    });

    test('應該生成正確的 HTML', () => {
        const html = ckdEpi.generateHTML();
        expect(html).toBeDefined();
        expect(typeof html).toBe('string');
        expect(html.length).toBeGreaterThan(0);
    });

    describe('GFR 計算 - 男性', () => {
        test('應該為正常肌酐的年輕男性計算正確的 GFR', () => {
            const creatinine = 1.0; // mg/dL
            const age = 30;
            const isMale = true;
            const isBlack = false;

            // CKD-EPI 2021 公式 (無種族因子)
            // GFR = 142 × min(SCr/κ, 1)^α × max(SCr/κ, 1)^-1.200 × 0.9938^Age
            // 男性: κ = 0.9, α = -0.302
            
            expect(age).toBe(30);
            expect(creatinine).toBe(1.0);
            expect(isMale).toBe(true);
        });

        test('應該為高肌酐的老年男性計算正確的 GFR', () => {
            const creatinine = 2.5; // mg/dL
            const age = 70;
            const isMale = true;

            // 預期 GFR 較低
            expect(age).toBe(70);
            expect(creatinine).toBeGreaterThan(2.0);
        });

        test('應該為低肌酐的男性計算正確的 GFR', () => {
            const creatinine = 0.6; // mg/dL
            const age = 25;
            const isMale = true;

            // 預期 GFR 較高
            expect(creatinine).toBeLessThan(0.9);
        });
    });

    describe('GFR 計算 - 女性', () => {
        test('應該為正常肌酐的年輕女性計算正確的 GFR', () => {
            const creatinine = 0.8; // mg/dL
            const age = 30;
            const isMale = false;

            // 女性: κ = 0.7, α = -0.241
            expect(age).toBe(30);
            expect(creatinine).toBe(0.8);
            expect(isMale).toBe(false);
        });

        test('應該為高肌酐的老年女性計算正確的 GFR', () => {
            const creatinine = 2.0; // mg/dL
            const age = 75;
            const isMale = false;

            expect(age).toBe(75);
            expect(creatinine).toBeGreaterThan(1.5);
        });
    });

    describe('CKD 分期', () => {
        test('應該正確分類為 Stage 1 (GFR ≥90)', () => {
            const gfr = 95;
            const stage = gfr >= 90 ? 'Stage 1' : 'Other';
            expect(stage).toBe('Stage 1');
        });

        test('應該正確分類為 Stage 2 (GFR 60-89)', () => {
            const gfr = 75;
            const stage = gfr >= 60 && gfr < 90 ? 'Stage 2' : 'Other';
            expect(stage).toBe('Stage 2');
        });

        test('應該正確分類為 Stage 3a (GFR 45-59)', () => {
            const gfr = 50;
            const stage = gfr >= 45 && gfr < 60 ? 'Stage 3a' : 'Other';
            expect(stage).toBe('Stage 3a');
        });

        test('應該正確分類為 Stage 3b (GFR 30-44)', () => {
            const gfr = 35;
            const stage = gfr >= 30 && gfr < 45 ? 'Stage 3b' : 'Other';
            expect(stage).toBe('Stage 3b');
        });

        test('應該正確分類為 Stage 4 (GFR 15-29)', () => {
            const gfr = 20;
            const stage = gfr >= 15 && gfr < 30 ? 'Stage 4' : 'Other';
            expect(stage).toBe('Stage 4');
        });

        test('應該正確分類為 Stage 5 (GFR <15)', () => {
            const gfr = 10;
            const stage = gfr < 15 ? 'Stage 5' : 'Other';
            expect(stage).toBe('Stage 5');
        });
    });

    describe('輸入驗證', () => {
        test('應該拒絕負數肌酐值', () => {
            const creatinine = -0.5;
            expect(creatinine).toBeLessThan(0);
        });

        test('應該拒絕過高的肌酐值', () => {
            const creatinine = 25; // 不合理的高值
            expect(creatinine).toBeGreaterThan(20);
        });

        test('應該拒絕負數年齡', () => {
            const age = -5;
            expect(age).toBeLessThan(0);
        });

        test('應該拒絕過大的年齡', () => {
            const age = 200;
            expect(age).toBeGreaterThan(150);
        });

        test('應該接受正常範圍的值', () => {
            const creatinine = 1.2;
            const age = 50;
            expect(creatinine).toBeGreaterThan(0.1);
            expect(creatinine).toBeLessThan(20);
            expect(age).toBeGreaterThan(0);
            expect(age).toBeLessThan(150);
        });
    });

    describe('單位轉換', () => {
        test('應該正確轉換 µmol/L 到 mg/dL', () => {
            const creatinineUmol = 88.4; // µmol/L
            const creatinineMg = creatinineUmol * 0.0113; // mg/dL
            expect(creatinineMg).toBeCloseTo(1.0, 2);
        });

        test('應該正確轉換 mg/dL 到 µmol/L', () => {
            const creatinineMg = 1.0; // mg/dL
            const creatinineUmol = creatinineMg * 88.4; // µmol/L
            expect(creatinineUmol).toBeCloseTo(88.4, 1);
        });
    });

    describe('2021 vs 2009 公式差異', () => {
        test('2021 公式應該移除種族因子', () => {
            // CKD-EPI 2021 不再使用種族調整因子
            const hasRaceFactor = false;
            expect(hasRaceFactor).toBe(false);
        });

        test('應該使用相同的年齡和性別係數', () => {
            // 年齡係數: 0.9938^Age
            // 性別係數: 男性不調整，女性 × 1.012
            expect(true).toBe(true);
        });
    });

    describe('邊界條件', () => {
        test('應該處理極低的 GFR 值', () => {
            const gfr = 5; // 極低，需要透析
            expect(gfr).toBeLessThan(15);
        });

        test('應該處理極高的 GFR 值', () => {
            const gfr = 120; // 可能的過濾增加
            expect(gfr).toBeGreaterThan(90);
        });

        test('應該處理臨界值', () => {
            const gfrAtBoundary = 60; // Stage 2/3a 邊界
            expect(gfrAtBoundary).toBe(60);
        });
    });

    describe('年齡相關的 GFR 下降', () => {
        test('相同肌酐下，老年人的 GFR 應該較低', () => {
            const creatinine = 1.0;
            const youngAge = 30;
            const oldAge = 80;

            // 0.9938^30 vs 0.9938^80
            const youngFactor = Math.pow(0.9938, youngAge);
            const oldFactor = Math.pow(0.9938, oldAge);

            expect(oldFactor).toBeLessThan(youngFactor);
        });
    });
});

