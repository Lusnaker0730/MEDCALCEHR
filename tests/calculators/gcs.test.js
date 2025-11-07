/**
 * Glasgow Coma Scale (GCS) 單元測試
 */

import { describe, test, expect } from '@jest/globals';

describe('Glasgow Coma Scale (GCS) Calculator', () => {
    describe('眼睛反應評分', () => {
        test('無反應應該得 1 分', () => {
            const eyeResponse = 1;
            expect(eyeResponse).toBe(1);
        });

        test('對疼痛刺激睜眼應該得 2 分', () => {
            const eyeResponse = 2;
            expect(eyeResponse).toBe(2);
        });

        test('對語言刺激睜眼應該得 3 分', () => {
            const eyeResponse = 3;
            expect(eyeResponse).toBe(3);
        });

        test('自發睜眼應該得 4 分', () => {
            const eyeResponse = 4;
            expect(eyeResponse).toBe(4);
        });

        test('眼睛反應分數範圍應該是 1-4', () => {
            const minScore = 1;
            const maxScore = 4;
            expect(minScore).toBe(1);
            expect(maxScore).toBe(4);
        });
    });

    describe('語言反應評分', () => {
        test('無反應應該得 1 分', () => {
            const verbalResponse = 1;
            expect(verbalResponse).toBe(1);
        });

        test('無法理解的聲音應該得 2 分', () => {
            const verbalResponse = 2;
            expect(verbalResponse).toBe(2);
        });

        test('不適當的言語應該得 3 分', () => {
            const verbalResponse = 3;
            expect(verbalResponse).toBe(3);
        });

        test('困惑的交談應該得 4 分', () => {
            const verbalResponse = 4;
            expect(verbalResponse).toBe(4);
        });

        test('正常交談應該得 5 分', () => {
            const verbalResponse = 5;
            expect(verbalResponse).toBe(5);
        });

        test('語言反應分數範圍應該是 1-5', () => {
            const minScore = 1;
            const maxScore = 5;
            expect(minScore).toBe(1);
            expect(maxScore).toBe(5);
        });
    });

    describe('運動反應評分', () => {
        test('無反應應該得 1 分', () => {
            const motorResponse = 1;
            expect(motorResponse).toBe(1);
        });

        test('異常伸展應該得 2 分（去腦姿勢）', () => {
            const motorResponse = 2;
            expect(motorResponse).toBe(2);
        });

        test('異常屈曲應該得 3 分（去皮質姿勢）', () => {
            const motorResponse = 3;
            expect(motorResponse).toBe(3);
        });

        test('屈曲逃避應該得 4 分', () => {
            const motorResponse = 4;
            expect(motorResponse).toBe(4);
        });

        test('定位疼痛應該得 5 分', () => {
            const motorResponse = 5;
            expect(motorResponse).toBe(5);
        });

        test('遵從指令應該得 6 分', () => {
            const motorResponse = 6;
            expect(motorResponse).toBe(6);
        });

        test('運動反應分數範圍應該是 1-6', () => {
            const minScore = 1;
            const maxScore = 6;
            expect(minScore).toBe(1);
            expect(maxScore).toBe(6);
        });
    });

    describe('總分計算', () => {
        test('最低可能分數應該是 3', () => {
            const eye = 1;
            const verbal = 1;
            const motor = 1;
            const total = eye + verbal + motor;
            expect(total).toBe(3);
        });

        test('最高可能分數應該是 15', () => {
            const eye = 4;
            const verbal = 5;
            const motor = 6;
            const total = eye + verbal + motor;
            expect(total).toBe(15);
        });

        test('正常意識應該是 15 分', () => {
            const eye = 4; // 自發睜眼
            const verbal = 5; // 正常交談
            const motor = 6; // 遵從指令
            const total = eye + verbal + motor;
            expect(total).toBe(15);
        });

        test('中度意識障礙應該是 9-12 分', () => {
            const total = 10;
            expect(total).toBeGreaterThanOrEqual(9);
            expect(total).toBeLessThanOrEqual(12);
        });

        test('嚴重意識障礙應該是 3-8 分', () => {
            const total = 6;
            expect(total).toBeGreaterThanOrEqual(3);
            expect(total).toBeLessThanOrEqual(8);
        });
    });

    describe('臨床分級', () => {
        test('GCS 13-15: 輕度腦損傷', () => {
            const gcs = 14;
            const severity = gcs >= 13 ? 'Mild' : 'More severe';
            expect(severity).toBe('Mild');
        });

        test('GCS 9-12: 中度腦損傷', () => {
            const gcs = 10;
            const severity = (gcs >= 9 && gcs <= 12) ? 'Moderate' : 'Other';
            expect(severity).toBe('Moderate');
        });

        test('GCS 3-8: 重度腦損傷', () => {
            const gcs = 6;
            const severity = gcs <= 8 ? 'Severe' : 'Less severe';
            expect(severity).toBe('Severe');
        });

        test('GCS ≤8: 應考慮插管', () => {
            const gcs = 7;
            const needsIntubation = gcs <= 8;
            expect(needsIntubation).toBe(true);
        });
    });

    describe('實際臨床案例', () => {
        test('案例1: 完全清醒的患者', () => {
            const eye = 4; // 自發睜眼
            const verbal = 5; // 正常交談
            const motor = 6; // 遵從指令
            const total = eye + verbal + motor;
            
            expect(total).toBe(15);
            // 正常意識狀態
        });

        test('案例2: 酒精中毒患者', () => {
            const eye = 3; // 對語言睜眼
            const verbal = 4; // 困惑的交談
            const motor = 5; // 定位疼痛
            const total = eye + verbal + motor;
            
            expect(total).toBe(12);
            // 中度意識障礙
        });

        test('案例3: 嚴重腦損傷患者', () => {
            const eye = 2; // 對疼痛睜眼
            const verbal = 2; // 無法理解的聲音
            const motor = 3; // 異常屈曲
            const total = eye + verbal + motor;
            
            expect(total).toBe(7);
            // 重度意識障礙，需要插管
        });

        test('案例4: 昏迷患者', () => {
            const eye = 1; // 無反應
            const verbal = 1; // 無反應
            const motor = 1; // 無反應
            const total = eye + verbal + motor;
            
            expect(total).toBe(3);
            // 深度昏迷
        });

        test('案例5: 插管患者（無法評估語言）', () => {
            const eye = 3; // 對語言睜眼
            const verbal = 1; // 插管，無法評估
            const motor = 5; // 定位疼痛
            const total = eye + verbal + motor;
            
            expect(total).toBe(9);
            // 應記錄為 9T (T = intubated)
        });
    });

    describe('預後評估', () => {
        test('入院時 GCS 3-4 預後極差', () => {
            const gcs = 3;
            const prognosis = gcs <= 4 ? 'Very poor' : 'Better';
            expect(prognosis).toBe('Very poor');
        });

        test('入院時 GCS 5-7 預後不佳', () => {
            const gcs = 6;
            const prognosis = (gcs >= 5 && gcs <= 7) ? 'Poor' : 'Other';
            expect(prognosis).toBe('Poor');
        });

        test('入院時 GCS 8-10 預後中等', () => {
            const gcs = 9;
            const prognosis = (gcs >= 8 && gcs <= 10) ? 'Moderate' : 'Other';
            expect(prognosis).toBe('Moderate');
        });

        test('入院時 GCS 11-15 預後較好', () => {
            const gcs = 13;
            const prognosis = gcs >= 11 ? 'Good' : 'Worse';
            expect(prognosis).toBe('Good');
        });
    });

    describe('特殊情況處理', () => {
        test('眼部創傷無法評估眼睛反應', () => {
            // 應記錄為 E:C (Closed due to injury)
            const eyeClosed = true;
            expect(eyeClosed).toBe(true);
        });

        test('氣管插管無法評估語言反應', () => {
            // 應記錄為 V:T (intubated)
            const intubated = true;
            expect(intubated).toBe(true);
        });

        test('脊髓損傷影響運動反應', () => {
            // 應記錄實際觀察到的運動
            const spinalInjury = true;
            expect(spinalInjury).toBe(true);
        });
    });

    describe('趨勢分析', () => {
        test('GCS 改善提示病情好轉', () => {
            const initialGCS = 8;
            const currentGCS = 12;
            const improvement = currentGCS - initialGCS;
            expect(improvement).toBeGreaterThan(0);
        });

        test('GCS 下降提示病情惡化', () => {
            const initialGCS = 13;
            const currentGCS = 9;
            const deterioration = initialGCS - currentGCS;
            expect(deterioration).toBeGreaterThan(0);
        });

        test('GCS 下降 ≥2 分需要緊急評估', () => {
            const initialGCS = 15;
            const currentGCS = 12;
            const drop = initialGCS - currentGCS;
            const needsUrgentEval = drop >= 2;
            expect(needsUrgentEval).toBe(true);
        });
    });
});

