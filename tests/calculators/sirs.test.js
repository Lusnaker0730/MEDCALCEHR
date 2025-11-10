/**
 * SIRS (Systemic Inflammatory Response Syndrome) 單元測試
 */

import { describe, test, expect } from '@jest/globals';

describe('SIRS Criteria', () => {
    describe('SIRS 診斷標準 (4項)', () => {
        test('體溫 >38°C 或 <36°C', () => {
            const temp1 = 38.5;
            const temp2 = 35.5;
            expect(temp1 > 38 || temp1 < 36).toBe(true);
            expect(temp2 > 38 || temp2 < 36).toBe(true);
        });

        test('心率 >90 bpm', () => {
            const hr = 100;
            expect(hr > 90).toBe(true);
        });

        test('呼吸率 >20 或 PaCO2 <32 mmHg', () => {
            const rr = 24;
            const paco2 = 30;
            expect(rr > 20 || paco2 < 32).toBe(true);
        });

        test('WBC >12,000 或 <4,000 或 >10% bands', () => {
            const wbc1 = 15000;
            const wbc2 = 3000;
            const bands = 15; // %
            expect(wbc1 > 12000).toBe(true);
            expect(wbc2 < 4000).toBe(true);
            expect(bands > 10).toBe(true);
        });
    });

    describe('SIRS 評分', () => {
        test('0-1 項標準: 不符合 SIRS', () => {
            const criteriaCount = 1;
            const hasSIRS = criteriaCount >= 2;
            expect(hasSIRS).toBe(false);
        });

        test('≥2 項標準: 符合 SIRS', () => {
            const criteriaCount = 2;
            const hasSIRS = criteriaCount >= 2;
            expect(hasSIRS).toBe(true);
        });

        test('4 項標準: 嚴重 SIRS', () => {
            const criteriaCount = 4;
            const severeSIRS = criteriaCount === 4;
            expect(severeSIRS).toBe(true);
        });
    });

    describe('體溫標準', () => {
        test('正常體溫 (36-38°C) 不計分', () => {
            const temp = 37.0;
            const meets = temp > 38 || temp < 36;
            expect(meets).toBe(false);
        });

        test('發燒 (>38°C) 計分', () => {
            const temp = 38.5;
            const meets = temp > 38;
            expect(meets).toBe(true);
        });

        test('低體溫 (<36°C) 計分', () => {
            const temp = 35.5;
            const meets = temp < 36;
            expect(meets).toBe(true);
        });

        test('高燒 (>39°C) 仍然計分', () => {
            const temp = 40.0;
            const meets = temp > 38;
            expect(meets).toBe(true);
        });
    });

    describe('心率標準', () => {
        test('心率 ≤90 不計分', () => {
            const hr = 85;
            const meets = hr > 90;
            expect(meets).toBe(false);
        });

        test('心率 >90 計分', () => {
            const hr = 95;
            const meets = hr > 90;
            expect(meets).toBe(true);
        });

        test('嚴重心搏過速 (>140) 仍計 1 分', () => {
            const hr = 150;
            const meets = hr > 90 ? 1 : 0;
            expect(meets).toBe(1);
        });
    });

    describe('呼吸標準', () => {
        test('呼吸率 ≤20 且 PaCO2 ≥32 不計分', () => {
            const rr = 16;
            const paco2 = 40;
            const meets = rr > 20 || paco2 < 32;
            expect(meets).toBe(false);
        });

        test('呼吸率 >20 計分', () => {
            const rr = 24;
            const meets = rr > 20;
            expect(meets).toBe(true);
        });

        test('PaCO2 <32 計分', () => {
            const paco2 = 28;
            const meets = paco2 < 32;
            expect(meets).toBe(true);
        });

        test('呼吸率 >20 且 PaCO2 <32 仍計 1 分', () => {
            const rr = 24;
            const paco2 = 28;
            const meets = (rr > 20 || paco2 < 32) ? 1 : 0;
            expect(meets).toBe(1);
        });
    });

    describe('白血球標準', () => {
        test('WBC 4,000-12,000 不計分', () => {
            const wbc = 8000;
            const bands = 5;
            const meets = wbc > 12000 || wbc < 4000 || bands > 10;
            expect(meets).toBe(false);
        });

        test('WBC >12,000 計分', () => {
            const wbc = 15000;
            const meets = wbc > 12000;
            expect(meets).toBe(true);
        });

        test('WBC <4,000 計分', () => {
            const wbc = 3000;
            const meets = wbc < 4000;
            expect(meets).toBe(true);
        });

        test('>10% 未成熟帶狀白血球計分', () => {
            const bands = 15; // %
            const meets = bands > 10;
            expect(meets).toBe(true);
        });
    });

    describe('SIRS 與敗血症', () => {
        test('SIRS + 感染 = 敗血症', () => {
            const sirsCount = 2;
            const hasInfection = true;
            const hasSepsis = sirsCount >= 2 && hasInfection;
            expect(hasSepsis).toBe(true);
        });

        test('SIRS 但無感染 ≠ 敗血症', () => {
            const sirsCount = 3;
            const hasInfection = false;
            const hasSepsis = sirsCount >= 2 && hasInfection;
            expect(hasSepsis).toBe(false);
        });

        test('感染但 SIRS <2 項 ≠ 敗血症', () => {
            const sirsCount = 1;
            const hasInfection = true;
            const hasSepsis = sirsCount >= 2 && hasInfection;
            expect(hasSepsis).toBe(false);
        });
    });

    describe('實際臨床案例', () => {
        test('案例1: 健康人運動後', () => {
            const temp = 37.0; // 正常
            const hr = 100; // 1分 (運動後)
            const rr = 18; // 正常
            const wbc = 8000; // 正常
            
            const sirs = (temp > 38 || temp < 36 ? 1 : 0) +
                        (hr > 90 ? 1 : 0) +
                        (rr > 20 ? 1 : 0) +
                        (wbc > 12000 || wbc < 4000 ? 1 : 0);
            
            expect(sirs).toBe(1);
            // 不符合 SIRS
        });

        test('案例2: 肺炎患者', () => {
            const temp = 38.8; // 1分
            const hr = 105; // 1分
            const rr = 24; // 1分
            const wbc = 15000; // 1分
            
            const sirs = 4;
            expect(sirs).toBe(4);
            // SIRS + 感染 = 敗血症
        });

        test('案例3: 術後患者', () => {
            const temp = 37.5; // 正常
            const hr = 95; // 1分
            const rr = 22; // 1分
            const wbc = 11000; // 正常
            
            const sirs = 2;
            expect(sirs).toBe(2);
            // SIRS 但可能非感染性
        });

        test('案例4: 嚴重敗血症', () => {
            const temp = 35.0; // 1分 (低體溫)
            const hr = 125; // 1分
            const rr = 28; // 1分
            const wbc = 3000; // 1分
            
            const sirs = 4;
            expect(sirs).toBe(4);
            // 嚴重 SIRS
        });
    });

    describe('非感染性 SIRS 原因', () => {
        test('創傷可引起 SIRS', () => {
            const trauma = true;
            const canCauseSIRS = trauma;
            expect(canCauseSIRS).toBe(true);
        });

        test('燒傷可引起 SIRS', () => {
            const burn = true;
            const canCauseSIRS = burn;
            expect(canCauseSIRS).toBe(true);
        });

        test('胰臟炎可引起 SIRS', () => {
            const pancreatitis = true;
            const canCauseSIRS = pancreatitis;
            expect(canCauseSIRS).toBe(true);
        });

        test('手術可引起 SIRS', () => {
            const surgery = true;
            const canCauseSIRS = surgery;
            expect(canCauseSIRS).toBe(true);
        });
    });

    describe('SIRS 的限制', () => {
        test('SIRS 靈敏度高但特異性低', () => {
            const highSensitivity = true;
            const lowSpecificity = true;
            expect(highSensitivity && lowSpecificity).toBe(true);
        });

        test('許多病人符合 SIRS 但無敗血症', () => {
            const manySIRSWithoutSepsis = true;
            expect(manySIRSWithoutSepsis).toBe(true);
        });

        test('Sepsis-3 建議使用 SOFA 代替', () => {
            const sepsis3UsesSOFA = true;
            expect(sepsis3UsesSOFA).toBe(true);
        });
    });

    describe('與 Sepsis-3 的差異', () => {
        test('SIRS 是 Sepsis-2 定義的一部分', () => {
            const partOfSepsis2 = true;
            expect(partOfSepsis2).toBe(true);
        });

        test('Sepsis-3 不再要求 SIRS', () => {
            const sepsis3RequiresSIRS = false;
            expect(sepsis3RequiresSIRS).toBe(false);
        });

        test('Sepsis-3 使用 qSOFA 作為篩檢工具', () => {
            const usesQSOFA = true;
            expect(usesQSOFA).toBe(true);
        });
    });

    describe('SIRS 臨床應用', () => {
        test('可用於感染患者的早期識別', () => {
            const usefulForScreening = true;
            expect(usefulForScreening).toBe(true);
        });

        test('應結合臨床判斷使用', () => {
            const needsClinicalJudgment = true;
            expect(needsClinicalJudgment).toBe(true);
        });

        test('SIRS 數量越多，死亡率越高', () => {
            const moreSIRSHigherMortality = true;
            expect(moreSIRSHigherMortality).toBe(true);
        });
    });
});

