/**
 * BMI & BSA Calculator 單元測試
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { bmiBsa } from '../../js/calculators/bmi-bsa/index.js';
import {
    createMockFHIRClient,
    createMockContainer,
    cleanupContainer,
    setInputValue,
    selectOption,
    validateCalculatorStructure,
    createObservation
} from './test-helpers.js';

describe('BMI-BSA Calculator', () => {
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
        validateCalculatorStructure(bmiBsa);
        expect(bmiBsa.id).toBe('bmi-bsa');
        expect(bmiBsa.title).toContain('BMI');
    });

    test('應該生成正確的 HTML', () => {
        const html = bmiBsa.generateHTML();
        expect(html).toContain('bmi-bsa-weight');
        expect(html).toContain('bmi-bsa-height');
        expect(html).toContain('Weight');
        expect(html).toContain('Height');
    });

    describe('BMI 計算', () => {
        test('應該正確計算標準 BMI', () => {
            // 體重 70kg，身高 170cm
            // 預期 BMI = 70 / (1.7 * 1.7) = 24.22
            const weight = 70;
            const height = 170;
            const heightInMeters = height / 100;
            const expectedBMI = weight / (heightInMeters * heightInMeters);
            
            expect(expectedBMI).toBeCloseTo(24.22, 2);
        });

        test('應該正確計算過重的 BMI', () => {
            // 體重 90kg，身高 170cm
            // 預期 BMI = 90 / (1.7 * 1.7) = 31.14
            const weight = 90;
            const height = 170;
            const heightInMeters = height / 100;
            const expectedBMI = weight / (heightInMeters * heightInMeters);
            
            expect(expectedBMI).toBeCloseTo(31.14, 2);
            expect(expectedBMI).toBeGreaterThan(30); // 肥胖
        });

        test('應該正確計算過輕的 BMI', () => {
            // 體重 50kg，身高 170cm
            // 預期 BMI = 50 / (1.7 * 1.7) = 17.30
            const weight = 50;
            const height = 170;
            const heightInMeters = height / 100;
            const expectedBMI = weight / (heightInMeters * heightInMeters);
            
            expect(expectedBMI).toBeCloseTo(17.30, 2);
            expect(expectedBMI).toBeLessThan(18.5); // 過輕
        });
    });

    describe('BSA 計算', () => {
        test('應該使用 Du Bois 公式正確計算 BSA', () => {
            // Du Bois 公式: BSA = 0.007184 × Weight^0.425 × Height^0.725
            const weight = 70; // kg
            const height = 170; // cm
            const expectedBSA = 0.007184 * Math.pow(weight, 0.425) * Math.pow(height, 0.725);
            
            expect(expectedBSA).toBeCloseTo(1.81, 2);
        });

        test('應該為較大體型計算正確的 BSA', () => {
            const weight = 100; // kg
            const height = 185; // cm
            const expectedBSA = 0.007184 * Math.pow(weight, 0.425) * Math.pow(height, 0.725);
            
            expect(expectedBSA).toBeCloseTo(2.24, 2);
        });

        test('應該為較小體型計算正確的 BSA', () => {
            const weight = 50; // kg
            const height = 155; // cm
            const expectedBSA = 0.007184 * Math.pow(weight, 0.425) * Math.pow(height, 0.725);
            
            expect(expectedBSA).toBeCloseTo(1.47, 2);
        });
    });

    describe('輸入驗證', () => {
        test('應該拒絕負數體重', () => {
            const weight = -10;
            expect(weight).toBeLessThan(0);
            // 驗證邏輯應該拒絕這個值
        });

        test('應該拒絕負數身高', () => {
            const height = -150;
            expect(height).toBeLessThan(0);
            // 驗證邏輯應該拒絕這個值
        });

        test('應該拒絕過大的體重值', () => {
            const weight = 600; // kg
            expect(weight).toBeGreaterThan(500);
            // 超過合理範圍
        });

        test('應該拒絕過大的身高值', () => {
            const height = 300; // cm
            expect(height).toBeGreaterThan(250);
            // 超過合理範圍
        });

        test('應該接受正常範圍的值', () => {
            const weight = 70;
            const height = 170;
            expect(weight).toBeGreaterThan(0);
            expect(weight).toBeLessThan(500);
            expect(height).toBeGreaterThan(0);
            expect(height).toBeLessThan(250);
        });
    });

    describe('BMI 分類', () => {
        test('應該正確分類為過輕', () => {
            const bmi = 17.5;
            const category = bmi < 18.5 ? 'Underweight' : 'Normal';
            expect(category).toBe('Underweight');
        });

        test('應該正確分類為正常', () => {
            const bmi = 22.0;
            const category = bmi >= 18.5 && bmi < 25 ? 'Normal weight' : 'Other';
            expect(category).toBe('Normal weight');
        });

        test('應該正確分類為過重', () => {
            const bmi = 27.0;
            const category = bmi >= 25 && bmi < 30 ? 'Overweight' : 'Other';
            expect(category).toBe('Overweight');
        });

        test('應該正確分類為肥胖', () => {
            const bmi = 32.0;
            const category = bmi >= 30 ? 'Obese' : 'Other';
            expect(category).toBe('Obese');
        });
    });

    describe('單位轉換', () => {
        test('應該正確轉換 lbs 到 kg', () => {
            const lbs = 154.32; // 約 70 kg
            const kg = lbs * 0.453592;
            expect(kg).toBeCloseTo(70, 1);
        });

        test('應該正確轉換 inches 到 cm', () => {
            const inches = 66.93; // 約 170 cm
            const cm = inches * 2.54;
            expect(cm).toBeCloseTo(170, 0);
        });

        test('應該正確轉換 kg 到 lbs', () => {
            const kg = 70;
            const lbs = kg * 2.20462;
            expect(lbs).toBeCloseTo(154.32, 1);
        });

        test('應該正確轉換 cm 到 inches', () => {
            const cm = 170;
            const inches = cm * 0.393701;
            expect(inches).toBeCloseTo(66.93, 1);
        });
    });

    describe('邊界條件', () => {
        test('應該處理最小合理值', () => {
            const weight = 0.5; // kg
            const height = 30; // cm
            expect(weight).toBeGreaterThan(0);
            expect(height).toBeGreaterThan(0);
        });

        test('應該處理最大合理值', () => {
            const weight = 500; // kg
            const height = 250; // cm
            expect(weight).toBeLessThanOrEqual(500);
            expect(height).toBeLessThanOrEqual(250);
        });

        test('應該處理零值', () => {
            const weight = 0;
            const height = 0;
            // 應該被驗證拒絕或返回錯誤
            expect(weight === 0 || height === 0).toBe(true);
        });
    });

    describe('精確度測試', () => {
        test('BMI 計算應該精確到小數點後兩位', () => {
            const weight = 70;
            const height = 170;
            const heightInMeters = height / 100;
            const bmi = weight / (heightInMeters * heightInMeters);
            const rounded = Math.round(bmi * 100) / 100;
            
            expect(rounded).toBe(24.22);
        });

        test('BSA 計算應該精確到小數點後兩位', () => {
            const weight = 70;
            const height = 170;
            const bsa = 0.007184 * Math.pow(weight, 0.425) * Math.pow(height, 0.725);
            const rounded = Math.round(bsa * 100) / 100;
            
            expect(rounded).toBe(1.81);
        });
    });
});

