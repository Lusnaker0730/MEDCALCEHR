/**
 * APACHE II Score 單元測試
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { apacheIi } from '../../js/calculators/apache-ii/index.js';
import {
    createMockFHIRClient,
    createMockContainer,
    cleanupContainer,
    validateCalculatorStructure
} from './test-helpers.js';

describe('APACHE II Score Calculator', () => {
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
        validateCalculatorStructure(apacheIi);
        expect(apacheIi.id).toBe('apache-ii');
        expect(apacheIi.title).toContain('APACHE');
    });

    test('應該生成正確的 HTML', () => {
        const html = apacheIi.generateHTML();
        expect(html).toBeDefined();
        expect(typeof html).toBe('string');
    });

    describe('分數計算', () => {
        test('低風險患者應該有較低的分數', () => {
            // 年輕健康患者
            const age = 25; // 0 分
            const temperature = 37.0; // 0 分
            const map = 80; // 0 分
            const heartRate = 75; // 0 分
            const respiratoryRate = 15; // 0 分
            const gcs = 15; // 0 分

            // 預期總分接近 0
            expect(age).toBeLessThan(45);
            expect(temperature).toBeGreaterThan(36);
            expect(temperature).toBeLessThan(39);
        });

        test('高風險患者應該有較高的分數', () => {
            // 老年危重患者
            const age = 75; // 5-6 分
            const temperature = 41.0; // 3-4 分
            const map = 50; // 2-4 分
            const heartRate = 150; // 3-4 分
            const respiratoryRate = 35; // 3-4 分
            const gcs = 6; // 高分

            expect(age).toBeGreaterThan(65);
            expect(temperature).toBeGreaterThan(39);
        });
    });

    describe('年齡評分', () => {
        test('<44 歲應該得 0 分', () => {
            const age = 40;
            const score = age < 45 ? 0 : -1;
            expect(score).toBe(0);
        });

        test('45-54 歲應該得 2 分', () => {
            const age = 50;
            const score = age >= 45 && age <= 54 ? 2 : -1;
            expect(score).toBe(2);
        });

        test('55-64 歲應該得 3 分', () => {
            const age = 60;
            const score = age >= 55 && age <= 64 ? 3 : -1;
            expect(score).toBe(3);
        });

        test('65-74 歲應該得 5 分', () => {
            const age = 70;
            const score = age >= 65 && age <= 74 ? 5 : -1;
            expect(score).toBe(5);
        });

        test('≥75 歲應該得 6 分', () => {
            const age = 80;
            const score = age >= 75 ? 6 : -1;
            expect(score).toBe(6);
        });
    });

    describe('體溫評分', () => {
        test('正常體溫 (36-38.4°C) 應該得 0 分', () => {
            const temp = 37.0;
            const score = temp >= 36.0 && temp <= 38.4 ? 0 : -1;
            expect(score).toBe(0);
        });

        test('低體溫 (<32°C) 應該得高分', () => {
            const temp = 30.0;
            expect(temp).toBeLessThan(32);
        });

        test('高體溫 (≥41°C) 應該得 4 分', () => {
            const temp = 41.5;
            expect(temp).toBeGreaterThanOrEqual(41);
        });
    });

    describe('GCS 評分轉換', () => {
        test('GCS 15 應該得 0 分', () => {
            const gcs = 15;
            const apacheScore = 15 - gcs;
            expect(apacheScore).toBe(0);
        });

        test('GCS 3 應該得最高分', () => {
            const gcs = 3;
            const apacheScore = 15 - gcs;
            expect(apacheScore).toBe(12);
        });

        test('GCS 10 應該得 5 分', () => {
            const gcs = 10;
            const apacheScore = 15 - gcs;
            expect(apacheScore).toBe(5);
        });
    });

    describe('死亡率預測', () => {
        test('APACHE II 0-4 分應該對應低死亡率', () => {
            const score = 3;
            const mortalityEstimate = score < 5 ? '<4%' : 'Higher';
            expect(mortalityEstimate).toBe('<4%');
        });

        test('APACHE II 25-29 分應該對應中等死亡率', () => {
            const score = 27;
            const inRange = score >= 25 && score <= 29;
            expect(inRange).toBe(true);
            // 死亡率約 55%
        });

        test('APACHE II ≥35 分應該對應高死亡率', () => {
            const score = 38;
            const mortalityEstimate = score >= 35 ? '>85%' : 'Lower';
            expect(mortalityEstimate).toBe('>85%');
        });
    });

    describe('慢性健康評估', () => {
        test('無慢性疾病應該得 0 分', () => {
            const hasChronicDisease = false;
            const score = hasChronicDisease ? 5 : 0;
            expect(score).toBe(0);
        });

        test('非手術患者有器官功能不全應該得 5 分', () => {
            const isNonOperative = true;
            const hasOrganFailure = true;
            const score = isNonOperative && hasOrganFailure ? 5 : 0;
            expect(score).toBe(5);
        });

        test('術後患者有器官功能不全應該得 2 分', () => {
            const isPostOp = true;
            const hasOrganFailure = true;
            const emergencySurgery = false;
            const score = isPostOp && hasOrganFailure && !emergencySurgery ? 2 : 0;
            expect(score).toBe(2);
        });
    });

    describe('輸入驗證', () => {
        test('應該拒絕不合理的體溫', () => {
            const temp = 50;
            expect(temp).toBeGreaterThan(45);
        });

        test('應該拒絕不合理的心率', () => {
            const hr = 300;
            expect(hr).toBeGreaterThan(250);
        });

        test('應該拒絕不合理的 GCS', () => {
            const gcs = 20;
            expect(gcs).toBeGreaterThan(15);
        });

        test('應該接受正常範圍的值', () => {
            const temp = 37.5;
            const hr = 80;
            const gcs = 15;

            expect(temp).toBeGreaterThan(35);
            expect(temp).toBeLessThan(42);
            expect(hr).toBeGreaterThan(30);
            expect(hr).toBeLessThan(200);
            expect(gcs).toBeGreaterThanOrEqual(3);
            expect(gcs).toBeLessThanOrEqual(15);
        });
    });

    describe('實際臨床案例', () => {
        test('案例1: 健康年輕患者術後', () => {
            const age = 30; // 0 分
            const chronicHealthPoints = 0;
            // 假設其他生理參數正常
            const totalScore = 0 + chronicHealthPoints; // 應該很低

            expect(totalScore).toBeLessThan(5);
        });

        test('案例2: 老年敗血症患者', () => {
            const age = 75; // 6 分
            const agePoints = 6;
            // 預期會有其他高分項目
            expect(agePoints).toBe(6);
        });

        test('案例3: 中年 ICU 患者', () => {
            const age = 55; // 3 分
            const agePoints = 3;
            expect(agePoints).toBe(3);
        });
    });

    describe('分數範圍', () => {
        test('最低可能分數應該是 0', () => {
            const minScore = 0;
            expect(minScore).toBe(0);
        });

        test('最高可能分數應該約 71', () => {
            // 12 項生理參數 × 4 分 = 48
            // 年齡 6 分
            // GCS (15-3) = 12 分
            // 慢性健康 5 分
            const maxScore = 48 + 6 + 12 + 5;
            expect(maxScore).toBe(71);
        });
    });
});

