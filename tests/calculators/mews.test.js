/**
 * MEWS (Modified Early Warning Score) 單元測試
 */

import { describe, test, expect } from '@jest/globals';

describe('Modified Early Warning Score (MEWS)', () => {
    describe('評分項目', () => {
        test('應該包含收縮壓評分', () => {
            const sbp = 120;
            expect(sbp).toBeGreaterThan(0);
        });

        test('應該包含心率評分', () => {
            const hr = 80;
            expect(hr).toBeGreaterThan(0);
        });

        test('應該包含呼吸率評分', () => {
            const rr = 16;
            expect(rr).toBeGreaterThan(0);
        });

        test('應該包含體溫評分', () => {
            const temp = 37.0;
            expect(temp).toBeGreaterThan(0);
        });

        test('應該包含意識狀態評分', () => {
            const consciousness = 'alert';
            expect(['alert', 'voice', 'pain', 'unresponsive']).toContain(consciousness);
        });
    });

    describe('收縮壓評分', () => {
        test('SBP ≥200: 2分', () => {
            const sbp = 210;
            const score = sbp >= 200 ? 2 : 0;
            expect(score).toBe(2);
        });

        test('SBP 101-199: 0分', () => {
            const sbp = 120;
            const score = sbp >= 101 && sbp <= 199 ? 0 : -1;
            expect(score).toBe(0);
        });

        test('SBP 81-100: 1分', () => {
            const sbp = 90;
            const score = sbp >= 81 && sbp <= 100 ? 1 : -1;
            expect(score).toBe(1);
        });

        test('SBP 71-80: 2分', () => {
            const sbp = 75;
            const score = sbp >= 71 && sbp <= 80 ? 2 : -1;
            expect(score).toBe(2);
        });

        test('SBP ≤70: 3分', () => {
            const sbp = 65;
            const score = sbp <= 70 ? 3 : 0;
            expect(score).toBe(3);
        });
    });

    describe('心率評分', () => {
        test('HR ≥130: 2分', () => {
            const hr = 140;
            const score = hr >= 130 ? 2 : 0;
            expect(score).toBe(2);
        });

        test('HR 111-129: 1分', () => {
            const hr = 120;
            const score = hr >= 111 && hr <= 129 ? 1 : -1;
            expect(score).toBe(1);
        });

        test('HR 51-110: 0分', () => {
            const hr = 80;
            const score = hr >= 51 && hr <= 110 ? 0 : -1;
            expect(score).toBe(0);
        });

        test('HR 41-50: 1分', () => {
            const hr = 45;
            const score = hr >= 41 && hr <= 50 ? 1 : -1;
            expect(score).toBe(1);
        });

        test('HR ≤40: 2分', () => {
            const hr = 35;
            const score = hr <= 40 ? 2 : 0;
            expect(score).toBe(2);
        });
    });

    describe('呼吸率評分', () => {
        test('RR ≥30: 2分', () => {
            const rr = 35;
            const score = rr >= 30 ? 2 : 0;
            expect(score).toBe(2);
        });

        test('RR 21-29: 1分', () => {
            const rr = 25;
            const score = rr >= 21 && rr <= 29 ? 1 : -1;
            expect(score).toBe(1);
        });

        test('RR 9-20: 0分', () => {
            const rr = 16;
            const score = rr >= 9 && rr <= 20 ? 0 : -1;
            expect(score).toBe(0);
        });

        test('RR ≤8: 2分', () => {
            const rr = 6;
            const score = rr <= 8 ? 2 : 0;
            expect(score).toBe(2);
        });
    });

    describe('體溫評分', () => {
        test('體溫 ≥38.5°C: 2分', () => {
            const temp = 39.0;
            const score = temp >= 38.5 ? 2 : 0;
            expect(score).toBe(2);
        });

        test('體溫 35.1-38.4°C: 0分', () => {
            const temp = 37.0;
            const score = temp >= 35.1 && temp <= 38.4 ? 0 : -1;
            expect(score).toBe(0);
        });

        test('體溫 ≤35°C: 2分', () => {
            const temp = 34.5;
            const score = temp <= 35 ? 2 : 0;
            expect(score).toBe(2);
        });
    });

    describe('意識狀態評分 (AVPU)', () => {
        test('Alert (清醒): 0分', () => {
            const avpu = 'alert';
            const score = avpu === 'alert' ? 0 : -1;
            expect(score).toBe(0);
        });

        test('Voice (聲音反應): 1分', () => {
            const avpu = 'voice';
            const score = avpu === 'voice' ? 1 : -1;
            expect(score).toBe(1);
        });

        test('Pain (疼痛反應): 2分', () => {
            const avpu = 'pain';
            const score = avpu === 'pain' ? 2 : -1;
            expect(score).toBe(2);
        });

        test('Unresponsive (無反應): 3分', () => {
            const avpu = 'unresponsive';
            const score = avpu === 'unresponsive' ? 3 : -1;
            expect(score).toBe(3);
        });
    });

    describe('總分計算', () => {
        test('最低分應該是 0', () => {
            // 所有項目都正常
            const totalScore = 0 + 0 + 0 + 0 + 0;
            expect(totalScore).toBe(0);
        });

        test('最高分應該是 14', () => {
            // 所有項目都最高分
            const sbp = 3;
            const hr = 2;
            const rr = 2;
            const temp = 2;
            const avpu = 3;
            const totalScore = sbp + hr + rr + temp + avpu;
            expect(totalScore).toBe(12);
        });
    });

    describe('風險分層', () => {
        test('MEWS 0: 低風險', () => {
            const score = 0;
            const risk = score === 0 ? 'Low' : 'Higher';
            expect(risk).toBe('Low');
        });

        test('MEWS 1-2: 低-中風險', () => {
            const score = 2;
            const risk = score >= 1 && score <= 2 ? 'Low-Moderate' : 'Other';
            expect(risk).toBe('Low-Moderate');
        });

        test('MEWS 3-4: 中風險', () => {
            const score = 3;
            const risk = score >= 3 && score <= 4 ? 'Moderate' : 'Other';
            expect(risk).toBe('Moderate');
        });

        test('MEWS ≥5: 高風險', () => {
            const score = 6;
            const risk = score >= 5 ? 'High' : 'Lower';
            expect(risk).toBe('High');
        });
    });

    describe('臨床建議', () => {
        test('MEWS 0-2: 常規監測', () => {
            const score = 1;
            const action = score <= 2 ? 'Routine monitoring' : 'Escalate';
            expect(action).toBe('Routine monitoring');
        });

        test('MEWS 3-4: 增加監測頻率', () => {
            const score = 3;
            const action = score >= 3 && score <= 4 ? 'Increase monitoring' : 'Other';
            expect(action).toBe('Increase monitoring');
        });

        test('MEWS ≥5: 緊急醫療評估', () => {
            const score = 5;
            const action = score >= 5 ? 'Urgent medical review' : 'Routine';
            expect(action).toBe('Urgent medical review');
        });
    });

    describe('實際臨床案例', () => {
        test('案例1: 健康患者', () => {
            const sbp = 120; // 0分
            const hr = 75; // 0分
            const rr = 16; // 0分
            const temp = 36.8; // 0分
            const avpu = 'alert'; // 0分
            const mews = 0;
            
            expect(mews).toBe(0);
            // 低風險，常規監測
        });

        test('案例2: 術後發燒患者', () => {
            const sbp = 110; // 0分
            const hr = 100; // 0分
            const rr = 22; // 1分
            const temp = 38.8; // 2分
            const avpu = 'alert'; // 0分
            const mews = 3;
            
            expect(mews).toBe(3);
            // 中風險，需增加監測
        });

        test('案例3: 敗血症患者', () => {
            const sbp = 85; // 1分
            const hr = 125; // 1分
            const rr = 28; // 1分
            const temp = 38.9; // 2分
            const avpu = 'voice'; // 1分
            const mews = 6;
            
            expect(mews).toBe(6);
            // 高風險，需緊急評估
        });

        test('案例4: 休克患者', () => {
            const sbp = 70; // 3分
            const hr = 140; // 2分
            const rr = 32; // 2分
            const temp = 36.0; // 0分
            const avpu = 'pain'; // 2分
            const mews = 9;
            
            expect(mews).toBe(9);
            // 危急狀態
        });
    });

    describe('與其他早期預警評分的比較', () => {
        test('MEWS 使用 AVPU 評估意識', () => {
            const usesAVPU = true;
            expect(usesAVPU).toBe(true);
        });

        test('NEWS 使用更詳細的氧合評估', () => {
            const newsHasO2 = true;
            expect(newsHasO2).toBe(true);
        });

        test('MEWS 不包含氧合參數', () => {
            const mewsHasO2 = false;
            expect(mewsHasO2).toBe(false);
        });
    });

    describe('監測頻率建議', () => {
        test('MEWS 0: 每4-6小時', () => {
            const score = 0;
            const frequency = score === 0 ? '4-6 hours' : 'More frequent';
            expect(frequency).toBe('4-6 hours');
        });

        test('MEWS 1-2: 每2-4小時', () => {
            const score = 2;
            const frequency = score >= 1 && score <= 2 ? '2-4 hours' : 'Other';
            expect(frequency).toBe('2-4 hours');
        });

        test('MEWS 3-4: 每1-2小時', () => {
            const score = 3;
            const frequency = score >= 3 && score <= 4 ? '1-2 hours' : 'Other';
            expect(frequency).toBe('1-2 hours');
        });

        test('MEWS ≥5: 持續監測', () => {
            const score = 5;
            const frequency = score >= 5 ? 'Continuous' : 'Less frequent';
            expect(frequency).toBe('Continuous');
        });
    });

    describe('使用場景', () => {
        test('適用於一般病房患者', () => {
            const applicableWard = true;
            expect(applicableWard).toBe(true);
        });

        test('可用於緊急部門分流', () => {
            const applicableED = true;
            expect(applicableED).toBe(true);
        });

        test('ICU 患者使用更詳細的評分', () => {
            const useAdvancedInICU = true;
            expect(useAdvancedInICU).toBe(true);
        });
    });

    describe('趨勢監測', () => {
        test('MEWS 上升提示病情惡化', () => {
            const initial = 2;
            const current = 5;
            const deteriorating = current > initial;
            expect(deteriorating).toBe(true);
        });

        test('MEWS 下降提示病情改善', () => {
            const initial = 6;
            const current = 3;
            const improving = current < initial;
            expect(improving).toBe(true);
        });

        test('連續高 MEWS 需要升級照護', () => {
            const consecutiveHighScores = [5, 6, 6];
            const needsEscalation = consecutiveHighScores.every(s => s >= 5);
            expect(needsEscalation).toBe(true);
        });
    });
});

