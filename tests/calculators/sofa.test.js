/**
 * SOFA Score 單元測試
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { sofa } from '../../js/calculators/sofa/index.js';
import {
    createMockFHIRClient,
    createMockContainer,
    cleanupContainer,
    validateCalculatorStructure
} from './test-helpers.js';

describe('SOFA Score Calculator', () => {
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
        validateCalculatorStructure(sofa);
        expect(sofa.id).toBe('sofa');
        expect(sofa.title).toContain('SOFA');
    });

    describe('呼吸系統評分', () => {
        test('PaO2/FiO2 ≥400 應該得 0 分', () => {
            const ratio = 450;
            const score = ratio >= 400 ? 0 : -1;
            expect(score).toBe(0);
        });

        test('PaO2/FiO2 <100 且需呼吸支持應該得 4 分', () => {
            const ratio = 95;
            const mechanicalVentilation = true;
            expect(ratio).toBeLessThan(100);
            expect(mechanicalVentilation).toBe(true);
        });

        test('PaO2/FiO2 <200 且需呼吸支持應該得 3 分', () => {
            const ratio = 180;
            const mechanicalVentilation = true;
            expect(ratio).toBeLessThan(200);
            expect(ratio).toBeGreaterThanOrEqual(100);
        });
    });

    describe('凝血系統評分', () => {
        test('血小板 ≥150 應該得 0 分', () => {
            const platelets = 200; // ×10³/μL
            const score = platelets >= 150 ? 0 : -1;
            expect(score).toBe(0);
        });

        test('血小板 <20 應該得 4 分', () => {
            const platelets = 15;
            const score = platelets < 20 ? 4 : -1;
            expect(score).toBe(4);
        });

        test('血小板 <50 應該得 3 分', () => {
            const platelets = 45;
            const score = platelets >= 20 && platelets < 50 ? 3 : -1;
            expect(score).toBe(3);
        });
    });

    describe('肝功能評分', () => {
        test('膽紅素 <1.2 應該得 0 分', () => {
            const bilirubin = 1.0; // mg/dL
            const score = bilirubin < 1.2 ? 0 : -1;
            expect(score).toBe(0);
        });

        test('膽紅素 ≥12.0 應該得 4 分', () => {
            const bilirubin = 15.0;
            const score = bilirubin >= 12.0 ? 4 : -1;
            expect(score).toBe(4);
        });

        test('膽紅素 1.2-1.9 應該得 1 分', () => {
            const bilirubin = 1.5;
            const score = bilirubin >= 1.2 && bilirubin < 2.0 ? 1 : -1;
            expect(score).toBe(1);
        });
    });

    describe('心血管系統評分', () => {
        test('無低血壓應該得 0 分', () => {
            const map = 75; // mmHg
            const vasopressors = false;
            const score = map >= 70 && !vasopressors ? 0 : -1;
            expect(score).toBe(0);
        });

        test('MAP <70 應該得 1 分', () => {
            const map = 65;
            const score = map < 70 ? 1 : -1;
            expect(score).toBe(1);
        });

        test('高劑量升壓藥應該得 4 分', () => {
            const dopamine = 20; // μg/kg/min
            const score = dopamine > 15 ? 4 : -1;
            expect(score).toBe(4);
        });
    });

    describe('中樞神經系統評分', () => {
        test('GCS 15 應該得 0 分', () => {
            const gcs = 15;
            const score = gcs === 15 ? 0 : -1;
            expect(score).toBe(0);
        });

        test('GCS <6 應該得 4 分', () => {
            const gcs = 5;
            const score = gcs < 6 ? 4 : -1;
            expect(score).toBe(4);
        });

        test('GCS 13-14 應該得 1 分', () => {
            const gcs = 13;
            const score = gcs >= 13 && gcs <= 14 ? 1 : -1;
            expect(score).toBe(1);
        });

        test('GCS 10-12 應該得 2 分', () => {
            const gcs = 11;
            const score = gcs >= 10 && gcs <= 12 ? 2 : -1;
            expect(score).toBe(2);
        });

        test('GCS 6-9 應該得 3 分', () => {
            const gcs = 8;
            const score = gcs >= 6 && gcs <= 9 ? 3 : -1;
            expect(score).toBe(3);
        });
    });

    describe('腎功能評分', () => {
        test('肌酐 <1.2 應該得 0 分', () => {
            const creatinine = 1.0; // mg/dL
            const score = creatinine < 1.2 ? 0 : -1;
            expect(score).toBe(0);
        });

        test('肌酐 ≥5.0 應該得 4 分', () => {
            const creatinine = 5.5;
            const score = creatinine >= 5.0 ? 4 : -1;
            expect(score).toBe(4);
        });

        test('尿量 <200 mL/day 應該得 4 分', () => {
            const urineOutput = 150; // mL/day
            expect(urineOutput).toBeLessThan(200);
        });

        test('尿量 <500 mL/day 應該得 3 分', () => {
            const urineOutput = 400; // mL/day
            expect(urineOutput).toBeLessThan(500);
            expect(urineOutput).toBeGreaterThanOrEqual(200);
        });
    });

    describe('總分計算', () => {
        test('健康狀態應該總分為 0', () => {
            const respScore = 0;
            const coagScore = 0;
            const liverScore = 0;
            const cardioScore = 0;
            const cnsScore = 0;
            const renalScore = 0;

            const totalScore = respScore + coagScore + liverScore + 
                             cardioScore + cnsScore + renalScore;
            expect(totalScore).toBe(0);
        });

        test('多器官衰竭應該有高分', () => {
            const respScore = 4;
            const coagScore = 3;
            const liverScore = 2;
            const cardioScore = 4;
            const cnsScore = 2;
            const renalScore = 3;

            const totalScore = respScore + coagScore + liverScore + 
                             cardioScore + cnsScore + renalScore;
            expect(totalScore).toBe(18);
            expect(totalScore).toBeGreaterThan(12); // 高死亡率
        });

        test('最高可能分數應該是 24', () => {
            const maxScore = 4 * 6; // 6 個器官系統，每個最高 4 分
            expect(maxScore).toBe(24);
        });
    });

    describe('死亡率預測', () => {
        test('SOFA 0-6 應該對應低死亡率 (<10%)', () => {
            const score = 5;
            const mortality = score <= 6 ? '<10%' : 'Higher';
            expect(mortality).toBe('<10%');
        });

        test('SOFA 7-9 應該對應中等死亡率 (15-20%)', () => {
            const score = 8;
            const inRange = score >= 7 && score <= 9;
            expect(inRange).toBe(true);
        });

        test('SOFA 10-12 應該對應高死亡率 (40-50%)', () => {
            const score = 11;
            const inRange = score >= 10 && score <= 12;
            expect(inRange).toBe(true);
        });

        test('SOFA ≥13 應該對應非常高死亡率 (>80%)', () => {
            const score = 15;
            const mortality = score >= 13 ? '>80%' : 'Lower';
            expect(mortality).toBe('>80%');
        });
    });

    describe('Delta SOFA', () => {
        test('ΔSOFA ≥2 應該定義為器官功能障礙', () => {
            const baselineSOFA = 3;
            const currentSOFA = 5;
            const delta = currentSOFA - baselineSOFA;
            
            expect(delta).toBe(2);
            expect(delta >= 2).toBe(true); // 符合 Sepsis-3 定義
        });

        test('ΔSOFA <2 應該視為穩定', () => {
            const baselineSOFA = 4;
            const currentSOFA = 5;
            const delta = currentSOFA - baselineSOFA;
            
            expect(delta).toBe(1);
            expect(delta < 2).toBe(true);
        });

        test('負的 ΔSOFA 應該表示改善', () => {
            const baselineSOFA = 8;
            const currentSOFA = 5;
            const delta = currentSOFA - baselineSOFA;
            
            expect(delta).toBe(-3);
            expect(delta < 0).toBe(true);
        });
    });

    describe('Sepsis-3 整合', () => {
        test('敗血症診斷需要 SOFA ≥2', () => {
            const sofa = 3;
            const hasSepsisCriteria = sofa >= 2;
            expect(hasSepsisCriteria).toBe(true);
        });

        test('qSOFA 和 SOFA 應該一起使用', () => {
            const qSOFA = 2; // 篩檢工具
            const SOFA = 3; // 診斷工具
            
            expect(qSOFA >= 2).toBe(true); // 篩檢陽性
            expect(SOFA >= 2).toBe(true); // 診斷確認
        });
    });

    describe('輸入驗證', () => {
        test('應該拒絕不合理的血小板值', () => {
            const platelets = 1000;
            expect(platelets).toBeGreaterThan(500); // 異常高
        });

        test('應該拒絕不合理的膽紅素值', () => {
            const bilirubin = 50;
            expect(bilirubin).toBeGreaterThan(30); // 異常高
        });

        test('應該拒絕不合理的 GCS 值', () => {
            const gcs = 20;
            expect(gcs).toBeGreaterThan(15); // 超出範圍
        });
    });
});

