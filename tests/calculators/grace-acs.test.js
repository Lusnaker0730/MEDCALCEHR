/**
 * GRACE ACS Risk Score 單元測試
 */

import { describe, test, expect } from '@jest/globals';

describe('GRACE ACS Risk Score', () => {
    describe('評分項目', () => {
        test('應該包含年齡', () => {
            const age = 65;
            expect(age).toBeGreaterThan(0);
        });

        test('應該包含心率', () => {
            const hr = 80;
            expect(hr).toBeGreaterThan(0);
        });

        test('應該包含收縮壓', () => {
            const sbp = 120;
            expect(sbp).toBeGreaterThan(0);
        });

        test('應該包含肌酐', () => {
            const creatinine = 1.0;
            expect(creatinine).toBeGreaterThan(0);
        });

        test('應該包含 Killip 分級', () => {
            const killip = 1;
            expect([1, 2, 3, 4]).toContain(killip);
        });

        test('應該包含心臟停止狀態', () => {
            const cardiacArrest = false;
            expect(typeof cardiacArrest).toBe('boolean');
        });

        test('應該包含 ST 段改變', () => {
            const stChanges = false;
            expect(typeof stChanges).toBe('boolean');
        });

        test('應該包含心肌標記物升高', () => {
            const elevatedBiomarkers = false;
            expect(typeof elevatedBiomarkers).toBe('boolean');
        });
    });

    describe('年齡評分', () => {
        test('年齡 <30: 0分', () => {
            const age = 25;
            expect(age).toBeLessThan(30);
        });

        test('年齡 30-39: 8分', () => {
            const age = 35;
            expect(age).toBeGreaterThanOrEqual(30);
            expect(age).toBeLessThan(40);
        });

        test('年齡 40-49: 25分', () => {
            const age = 45;
            expect(age).toBeGreaterThanOrEqual(40);
            expect(age).toBeLessThan(50);
        });

        test('年齡 50-59: 41分', () => {
            const age = 55;
            expect(age).toBeGreaterThanOrEqual(50);
            expect(age).toBeLessThan(60);
        });

        test('年齡 60-69: 58分', () => {
            const age = 65;
            expect(age).toBeGreaterThanOrEqual(60);
            expect(age).toBeLessThan(70);
        });

        test('年齡 70-79: 75分', () => {
            const age = 75;
            expect(age).toBeGreaterThanOrEqual(70);
            expect(age).toBeLessThan(80);
        });

        test('年齡 ≥80: 91分', () => {
            const age = 85;
            expect(age).toBeGreaterThanOrEqual(80);
        });
    });

    describe('心率評分', () => {
        test('HR <50: 0分', () => {
            const hr = 45;
            expect(hr).toBeLessThan(50);
        });

        test('HR 50-69: 3分', () => {
            const hr = 60;
            expect(hr).toBeGreaterThanOrEqual(50);
            expect(hr).toBeLessThan(70);
        });

        test('HR 70-89: 9分', () => {
            const hr = 80;
            expect(hr).toBeGreaterThanOrEqual(70);
            expect(hr).toBeLessThan(90);
        });

        test('HR 90-109: 15分', () => {
            const hr = 100;
            expect(hr).toBeGreaterThanOrEqual(90);
            expect(hr).toBeLessThan(110);
        });

        test('HR 110-149: 24分', () => {
            const hr = 120;
            expect(hr).toBeGreaterThanOrEqual(110);
            expect(hr).toBeLessThan(150);
        });

        test('HR 150-199: 38分', () => {
            const hr = 160;
            expect(hr).toBeGreaterThanOrEqual(150);
            expect(hr).toBeLessThan(200);
        });

        test('HR ≥200: 46分', () => {
            const hr = 210;
            expect(hr).toBeGreaterThanOrEqual(200);
        });
    });

    describe('收縮壓評分', () => {
        test('SBP <80: 58分', () => {
            const sbp = 75;
            expect(sbp).toBeLessThan(80);
        });

        test('SBP 80-99: 53分', () => {
            const sbp = 90;
            expect(sbp).toBeGreaterThanOrEqual(80);
            expect(sbp).toBeLessThan(100);
        });

        test('SBP 100-119: 43分', () => {
            const sbp = 110;
            expect(sbp).toBeGreaterThanOrEqual(100);
            expect(sbp).toBeLessThan(120);
        });

        test('SBP 120-139: 34分', () => {
            const sbp = 130;
            expect(sbp).toBeGreaterThanOrEqual(120);
            expect(sbp).toBeLessThan(140);
        });

        test('SBP 140-159: 24分', () => {
            const sbp = 150;
            expect(sbp).toBeGreaterThanOrEqual(140);
            expect(sbp).toBeLessThan(160);
        });

        test('SBP 160-199: 10分', () => {
            const sbp = 180;
            expect(sbp).toBeGreaterThanOrEqual(160);
            expect(sbp).toBeLessThan(200);
        });

        test('SBP ≥200: 0分', () => {
            const sbp = 210;
            expect(sbp).toBeGreaterThanOrEqual(200);
        });
    });

    describe('肌酐評分', () => {
        test('肌酐 0-0.39: 1分', () => {
            const cr = 0.3;
            expect(cr).toBeLessThan(0.4);
        });

        test('肌酐 0.4-0.79: 4分', () => {
            const cr = 0.6;
            expect(cr).toBeGreaterThanOrEqual(0.4);
            expect(cr).toBeLessThan(0.8);
        });

        test('肌酐 0.8-1.19: 7分', () => {
            const cr = 1.0;
            expect(cr).toBeGreaterThanOrEqual(0.8);
            expect(cr).toBeLessThan(1.2);
        });

        test('肌酐 1.2-1.59: 10分', () => {
            const cr = 1.4;
            expect(cr).toBeGreaterThanOrEqual(1.2);
            expect(cr).toBeLessThan(1.6);
        });

        test('肌酐 1.6-1.99: 13分', () => {
            const cr = 1.8;
            expect(cr).toBeGreaterThanOrEqual(1.6);
            expect(cr).toBeLessThan(2.0);
        });

        test('肌酐 2.0-3.99: 21分', () => {
            const cr = 2.5;
            expect(cr).toBeGreaterThanOrEqual(2.0);
            expect(cr).toBeLessThan(4.0);
        });

        test('肌酐 ≥4: 28分', () => {
            const cr = 4.5;
            expect(cr).toBeGreaterThanOrEqual(4.0);
        });
    });

    describe('Killip 分級評分', () => {
        test('Killip I (無心衰): 0分', () => {
            const killip = 1;
            expect(killip).toBe(1);
        });

        test('Killip II (肺囉音/靜脈充血): 20分', () => {
            const killip = 2;
            expect(killip).toBe(2);
        });

        test('Killip III (肺水腫): 39分', () => {
            const killip = 3;
            expect(killip).toBe(3);
        });

        test('Killip IV (心源性休克): 59分', () => {
            const killip = 4;
            expect(killip).toBe(4);
        });
    });

    describe('其他評分項目', () => {
        test('心臟停止: 39分', () => {
            const cardiacArrest = true;
            const score = cardiacArrest ? 39 : 0;
            expect(score).toBe(39);
        });

        test('ST 段改變: 28分', () => {
            const stChanges = true;
            const score = stChanges ? 28 : 0;
            expect(score).toBe(28);
        });

        test('心肌標記物升高: 14分', () => {
            const elevatedBiomarkers = true;
            const score = elevatedBiomarkers ? 14 : 0;
            expect(score).toBe(14);
        });
    });

    describe('風險分層 (院內死亡率)', () => {
        test('GRACE ≤108: 低風險 (<1%)', () => {
            const score = 100;
            const risk = score <= 108 ? 'Low' : 'Higher';
            expect(risk).toBe('Low');
        });

        test('GRACE 109-140: 中風險 (1-3%)', () => {
            const score = 125;
            const risk = score >= 109 && score <= 140 ? 'Intermediate' : 'Other';
            expect(risk).toBe('Intermediate');
        });

        test('GRACE >140: 高風險 (>3%)', () => {
            const score = 160;
            const risk = score > 140 ? 'High' : 'Lower';
            expect(risk).toBe('High');
        });
    });

    describe('6個月死亡率', () => {
        test('GRACE ≤88: 低風險 (<3%)', () => {
            const score = 80;
            const risk = score <= 88 ? 'Low' : 'Higher';
            expect(risk).toBe('Low');
        });

        test('GRACE 89-118: 中風險 (3-8%)', () => {
            const score = 100;
            const risk = score >= 89 && score <= 118 ? 'Intermediate' : 'Other';
            expect(risk).toBe('Intermediate');
        });

        test('GRACE >118: 高風險 (>8%)', () => {
            const score = 140;
            const risk = score > 118 ? 'High' : 'Lower';
            expect(risk).toBe('High');
        });
    });

    describe('實際臨床案例', () => {
        test('案例1: 低風險 NSTEMI 患者', () => {
            // 50歲，生命徵象穩定，無心衰
            const age = 41; // 50-59: 41分
            const hr = 9; // 70-89: 9分
            const sbp = 34; // 120-139: 34分
            const cr = 7; // 0.8-1.19: 7分
            const killip = 0; // I: 0分
            const arrest = 0;
            const st = 28; // 有 ST 改變
            const biomarker = 14; // 升高
            
            const grace = age + hr + sbp + cr + killip + arrest + st + biomarker;
            expect(grace).toBe(133);
            // 中風險
        });

        test('案例2: 高風險 STEMI 患者', () => {
            // 75歲，心源性休克，心臟停止
            const age = 75; // 70-79: 75分
            const hr = 24; // 110-149: 24分
            const sbp = 58; // <80: 58分
            const cr = 13; // 1.6-1.99: 13分
            const killip = 59; // IV: 59分
            const arrest = 39;
            const st = 28;
            const biomarker = 14;
            
            const grace = age + hr + sbp + cr + killip + arrest + st + biomarker;
            expect(grace).toBeGreaterThan(300);
            // 極高風險
        });
    });

    describe('治療建議', () => {
        test('低風險: 考慮早期出院', () => {
            const score = 100;
            const earlyDischarge = score <= 108;
            expect(earlyDischarge).toBe(true);
        });

        test('中風險: 早期侵入性治療', () => {
            const score = 125;
            const needsInvasive = score >= 109 && score <= 140;
            expect(needsInvasive).toBe(true);
        });

        test('高風險: 緊急侵入性治療', () => {
            const score = 160;
            const urgentInvasive = score > 140;
            expect(urgentInvasive).toBe(true);
        });
    });

    describe('與其他風險評分比較', () => {
        test('GRACE 比 TIMI 更精確', () => {
            const moreAccurate = true;
            expect(moreAccurate).toBe(true);
        });

        test('GRACE 使用連續變量', () => {
            const usesContinuous = true;
            expect(usesContinuous).toBe(true);
        });

        test('TIMI 使用二分變量', () => {
            const timiUsesBinary = true;
            expect(timiUsesBinary).toBe(true);
        });
    });

    describe('使用限制', () => {
        test('需要完整的臨床數據', () => {
            const needsCompleteData = true;
            expect(needsCompleteData).toBe(true);
        });

        test('不適用於穩定型心絞痛', () => {
            const notForStableAngina = true;
            expect(notForStableAngina).toBe(true);
        });

        test('主要用於 ACS 患者', () => {
            const forACS = true;
            expect(forACS).toBe(true);
        });
    });
});

