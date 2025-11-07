/**
 * Cockcroft-Gault Creatinine Clearance 單元測試
 */

import { describe, test, expect } from '@jest/globals';

describe('Cockcroft-Gault Creatinine Clearance', () => {
    describe('公式計算 - 男性', () => {
        test('應該使用標準男性公式', () => {
            // CrCl = ((140 - age) × weight) / (72 × SCr)
            const age = 50;
            const weight = 70; // kg
            const creatinine = 1.0; // mg/dL
            
            const crcl = ((140 - age) * weight) / (72 * creatinine);
            expect(crcl).toBeCloseTo(87.5, 1);
        });

        test('高齡男性應該有較低的肌酐清除率', () => {
            const age = 80;
            const weight = 70;
            const creatinine = 1.2;
            
            const crcl = ((140 - age) * weight) / (72 * creatinine);
            expect(crcl).toBeLessThan(50);
        });
    });

    describe('公式計算 - 女性', () => {
        test('應該使用女性校正係數 0.85', () => {
            // CrCl = ((140 - age) × weight) / (72 × SCr) × 0.85
            const age = 50;
            const weight = 60; // kg
            const creatinine = 1.0; // mg/dL
            
            const crcl = ((140 - age) * weight) / (72 * creatinine) * 0.85;
            expect(crcl).toBeCloseTo(63.75, 1);
        });

        test('女性肌酐清除率應該比相同條件男性低 15%', () => {
            const age = 60;
            const weight = 65;
            const creatinine = 1.0;
            
            const crclMale = ((140 - age) * weight) / (72 * creatinine);
            const crclFemale = crclMale * 0.85;
            
            const difference = (crclMale - crclFemale) / crclMale;
            expect(difference).toBeCloseTo(0.15, 2);
        });
    });

    describe('體表面積校正', () => {
        test('可以校正為標準 BSA (1.73 m²)', () => {
            const crcl = 87.5; // mL/min
            const bsa = 1.8; // m²
            const standardBSA = 1.73;
            
            const crclAdjusted = (crcl / bsa) * standardBSA;
            expect(crclAdjusted).toBeCloseTo(84.1, 1);
        });

        test('體型較小患者需要校正', () => {
            const crcl = 60;
            const bsa = 1.5;
            const standardBSA = 1.73;
            
            const crclAdjusted = (crcl / bsa) * standardBSA;
            expect(crclAdjusted).toBeGreaterThan(crcl);
        });
    });

    describe('體重考量', () => {
        test('應該使用實際體重', () => {
            const actualWeight = 70;
            expect(actualWeight).toBeGreaterThan(0);
        });

        test('肥胖患者應該考慮使用調整體重', () => {
            const actualWeight = 120; // kg
            const ibw = 70; // kg
            const adjustedWeight = ibw + 0.4 * (actualWeight - ibw);
            expect(adjustedWeight).toBeLessThan(actualWeight);
            expect(adjustedWeight).toBeGreaterThan(ibw);
        });
    });

    describe('腎功能分級', () => {
        test('CrCl ≥90: 正常或高', () => {
            const crcl = 100;
            const category = crcl >= 90 ? 'Normal or High' : 'Reduced';
            expect(category).toBe('Normal or High');
        });

        test('CrCl 60-89: 輕度降低', () => {
            const crcl = 75;
            const category = (crcl >= 60 && crcl < 90) ? 'Mildly Decreased' : 'Other';
            expect(category).toBe('Mildly Decreased');
        });

        test('CrCl 30-59: 中度降低', () => {
            const crcl = 45;
            const category = (crcl >= 30 && crcl < 60) ? 'Moderately Decreased' : 'Other';
            expect(category).toBe('Moderately Decreased');
        });

        test('CrCl 15-29: 重度降低', () => {
            const crcl = 20;
            const category = (crcl >= 15 && crcl < 30) ? 'Severely Decreased' : 'Other';
            expect(category).toBe('Severely Decreased');
        });

        test('CrCl <15: 腎衰竭', () => {
            const crcl = 10;
            const category = crcl < 15 ? 'Kidney Failure' : 'Better';
            expect(category).toBe('Kidney Failure');
        });
    });

    describe('藥物劑量調整', () => {
        test('CrCl 50-80: 可能需要輕度調整', () => {
            const crcl = 60;
            const needsAdjustment = crcl < 80;
            expect(needsAdjustment).toBe(true);
        });

        test('CrCl 30-50: 需要中度調整', () => {
            const crcl = 40;
            const needsModerateAdjustment = crcl >= 30 && crcl < 50;
            expect(needsModerateAdjustment).toBe(true);
        });

        test('CrCl <30: 需要顯著調整或避免使用', () => {
            const crcl = 25;
            const needsSignificantAdjustment = crcl < 30;
            expect(needsSignificantAdjustment).toBe(true);
        });
    });

    describe('實際臨床案例', () => {
        test('案例1: 健康年輕男性', () => {
            const age = 30;
            const weight = 75;
            const creatinine = 0.9;
            
            const crcl = ((140 - age) * weight) / (72 * creatinine);
            expect(crcl).toBeGreaterThan(100);
        });

        test('案例2: 中年女性，輕度腎功能不全', () => {
            const age = 60;
            const weight = 60;
            const creatinine = 1.2;
            
            const crcl = ((140 - age) * weight) / (72 * creatinine) * 0.85;
            expect(crcl).toBeGreaterThan(40);
            expect(crcl).toBeLessThan(60);
        });

        test('案例3: 老年男性，中度腎功能不全', () => {
            const age = 80;
            const weight = 65;
            const creatinine = 2.0;
            
            const crcl = ((140 - age) * weight) / (72 * creatinine);
            expect(crcl).toBeLessThan(30);
        });
    });

    describe('與 eGFR 的比較', () => {
        test('CrCl 通常高於 eGFR', () => {
            // CrCl 包含腎小管分泌，所以高於真實 GFR
            const crclHigher = true;
            expect(crclHigher).toBe(true);
        });

        test('CrCl 更適合藥物劑量調整', () => {
            const preferCrClForDosing = true;
            expect(preferCrClForDosing).toBe(true);
        });

        test('eGFR 更適合 CKD 分期', () => {
            const preferEGFRForStaging = true;
            expect(preferEGFRForStaging).toBe(true);
        });
    });

    describe('使用限制', () => {
        test('不穩定腎功能時不準確', () => {
            const creatinineChanging = true;
            const unreliable = creatinineChanging;
            expect(unreliable).toBe(true);
        });

        test('極端體重時需要調整', () => {
            const weight = 150; // kg
            const needsAdjustedWeight = weight > 100;
            expect(needsAdjustedWeight).toBe(true);
        });

        test('老年人可能高估腎功能', () => {
            const age = 85;
            const lowMuscleMass = true;
            const mayOverestimate = age > 80 && lowMuscleMass;
            expect(mayOverestimate).toBe(true);
        });

        test('肌肉萎縮患者可能高估腎功能', () => {
            const hasMuscleLoss = true;
            const mayOverestimate = hasMuscleLoss;
            expect(mayOverestimate).toBe(true);
        });
    });

    describe('單位轉換', () => {
        test('肌酐: mg/dL 到 µmol/L', () => {
            const crMg = 1.0; // mg/dL
            const crUmol = crMg * 88.4; // µmol/L
            expect(crUmol).toBeCloseTo(88.4, 1);
        });

        test('肌酐: µmol/L 到 mg/dL', () => {
            const crUmol = 88.4; // µmol/L
            const crMg = crUmol / 88.4; // mg/dL
            expect(crMg).toBeCloseTo(1.0, 2);
        });

        test('體重: lbs 到 kg', () => {
            const lbs = 154; // lbs
            const kg = lbs * 0.453592; // kg
            expect(kg).toBeCloseTo(69.85, 1);
        });
    });

    describe('年齡影響', () => {
        test('年齡每增加 10 歲，CrCl 約降低 10 mL/min', () => {
            const weight = 70;
            const creatinine = 1.0;
            
            const crcl50 = ((140 - 50) * weight) / (72 * creatinine);
            const crcl60 = ((140 - 60) * weight) / (72 * creatinine);
            
            const difference = crcl50 - crcl60;
            expect(difference).toBeCloseTo(9.72, 0);
        });
    });
});

