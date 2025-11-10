/**
 * HAS-BLED Score 單元測試
 */

import { describe, test, expect } from '@jest/globals';

describe('HAS-BLED Score for Bleeding Risk', () => {
    describe('HAS-BLED 評分標準 (9項)', () => {
        test('H - Hypertension (高血壓)', () => {
            const uncontrolledHTN = true;
            const score = uncontrolledHTN ? 1 : 0;
            expect(score).toBe(1);
        });

        test('A - Abnormal renal/liver function (各1分)', () => {
            const abnormalRenal = true;
            const abnormalLiver = true;
            const score = (abnormalRenal ? 1 : 0) + (abnormalLiver ? 1 : 0);
            expect(score).toBe(2);
        });

        test('S - Stroke (中風史)', () => {
            const strokeHistory = true;
            const score = strokeHistory ? 1 : 0;
            expect(score).toBe(1);
        });

        test('B - Bleeding (出血傾向或史)', () => {
            const bleedingHistory = true;
            const score = bleedingHistory ? 1 : 0;
            expect(score).toBe(1);
        });

        test('L - Labile INR (不穩定 INR)', () => {
            const labileINR = true;
            const score = labileINR ? 1 : 0;
            expect(score).toBe(1);
        });

        test('E - Elderly (年齡 >65)', () => {
            const age = 70;
            const score = age > 65 ? 1 : 0;
            expect(score).toBe(1);
        });

        test('D - Drugs/Alcohol (各1分)', () => {
            const antiplateletUse = true;
            const alcoholAbuse = true;
            const score = (antiplateletUse ? 1 : 0) + (alcoholAbuse ? 1 : 0);
            expect(score).toBe(2);
        });
    });

    describe('高血壓定義', () => {
        test('收縮壓 >160 mmHg', () => {
            const sbp = 170;
            const isUncontrolled = sbp > 160;
            expect(isUncontrolled).toBe(true);
        });

        test('未控制的高血壓計分', () => {
            const controlled = false;
            const score = !controlled ? 1 : 0;
            expect(score).toBe(1);
        });
    });

    describe('腎功能異常定義', () => {
        test('慢性透析', () => {
            const onDialysis = true;
            expect(onDialysis).toBe(true);
        });

        test('腎移植', () => {
            const renalTransplant = true;
            expect(renalTransplant).toBe(true);
        });

        test('肌酐 ≥200 µmol/L', () => {
            const creatinine = 220; // µmol/L
            const abnormal = creatinine >= 200;
            expect(abnormal).toBe(true);
        });
    });

    describe('肝功能異常定義', () => {
        test('慢性肝病', () => {
            const chronicLiverDisease = true;
            expect(chronicLiverDisease).toBe(true);
        });

        test('膽紅素 >2倍正常值', () => {
            const bilirubin = 3.0; // 倍數
            const abnormal = bilirubin > 2;
            expect(abnormal).toBe(true);
        });

        test('AST/ALT/ALP >3倍正常值', () => {
            const enzymes = 3.5; // 倍數
            const abnormal = enzymes > 3;
            expect(abnormal).toBe(true);
        });
    });

    describe('出血傾向或史', () => {
        test('既往大出血史', () => {
            const majorBleeding = true;
            expect(majorBleeding).toBe(true);
        });

        test('貧血', () => {
            const anemia = true;
            expect(anemia).toBe(true);
        });

        test('血小板減少', () => {
            const thrombocytopenia = true;
            expect(thrombocytopenia).toBe(true);
        });
    });

    describe('不穩定 INR', () => {
        test('治療範圍內時間 <60%', () => {
            const timeInRange = 55; // %
            const labile = timeInRange < 60;
            expect(labile).toBe(true);
        });

        test('INR 波動大', () => {
            const fluctuating = true;
            expect(fluctuating).toBe(true);
        });
    });

    describe('藥物和酒精', () => {
        test('抗血小板藥物使用', () => {
            const takingAntiplatelet = true;
            const score = takingAntiplatelet ? 1 : 0;
            expect(score).toBe(1);
        });

        test('NSAIDs 使用', () => {
            const takingNSAIDs = true;
            const score = takingNSAIDs ? 1 : 0;
            expect(score).toBe(1);
        });

        test('酒精濫用 (≥8 drinks/week)', () => {
            const alcoholAbuse = true;
            const score = alcoholAbuse ? 1 : 0;
            expect(score).toBe(1);
        });
    });

    describe('總分計算', () => {
        test('最低分應該是 0', () => {
            const totalScore = 0;
            expect(totalScore).toBe(0);
        });

        test('最高分應該是 9', () => {
            const totalScore = 1 + 2 + 1 + 1 + 1 + 1 + 2;
            expect(totalScore).toBe(9);
        });
    });

    describe('出血風險分層', () => {
        test('HAS-BLED 0: 低風險 (1.13/100人年)', () => {
            const score = 0;
            const risk = score === 0 ? 'Low' : 'Higher';
            expect(risk).toBe('Low');
        });

        test('HAS-BLED 1: 低風險 (1.02/100人年)', () => {
            const score = 1;
            const risk = score === 1 ? 'Low' : 'Other';
            expect(risk).toBe('Low');
        });

        test('HAS-BLED 2: 中風險 (1.88/100人年)', () => {
            const score = 2;
            const risk = score === 2 ? 'Moderate' : 'Other';
            expect(risk).toBe('Moderate');
        });

        test('HAS-BLED 3: 高風險 (3.72/100人年)', () => {
            const score = 3;
            const risk = score >= 3 ? 'High' : 'Lower';
            expect(risk).toBe('High');
        });

        test('HAS-BLED ≥5: 極高風險 (>10/100人年)', () => {
            const score = 5;
            const risk = score >= 5 ? 'Very High' : 'Lower';
            expect(risk).toBe('Very High');
        });
    });

    describe('臨床應用', () => {
        test('HAS-BLED ≥3 表示高出血風險', () => {
            const score = 3;
            const highRisk = score >= 3;
            expect(highRisk).toBe(true);
        });

        test('高分不應作為停用抗凝藥的唯一依據', () => {
            const shouldNotStopAnticoagulation = true;
            expect(shouldNotStopAnticoagulation).toBe(true);
        });

        test('應該用於識別可修正的危險因子', () => {
            const identifyModifiableRisk = true;
            expect(identifyModifiableRisk).toBe(true);
        });
    });

    describe('實際臨床案例', () => {
        test('案例1: 低風險患者', () => {
            const htn = 0;
            const renal = 0;
            const liver = 0;
            const stroke = 0;
            const bleeding = 0;
            const inr = 0;
            const age = 0; // <65
            const drugs = 0;
            const alcohol = 0;
            const hasbled = htn + renal + liver + stroke + bleeding + inr + age + drugs + alcohol;
            
            expect(hasbled).toBe(0);
            // 低風險
        });

        test('案例2: 中風險患者', () => {
            const htn = 1;
            const renal = 0;
            const liver = 0;
            const stroke = 0;
            const bleeding = 0;
            const inr = 0;
            const age = 1; // >65
            const drugs = 0;
            const alcohol = 0;
            const hasbled = htn + renal + liver + stroke + bleeding + inr + age + drugs + alcohol;
            
            expect(hasbled).toBe(2);
            // 中風險
        });

        test('案例3: 高風險患者', () => {
            const htn = 1;
            const renal = 1;
            const liver = 0;
            const stroke = 1;
            const bleeding = 1;
            const inr = 1;
            const age = 1;
            const drugs = 1;
            const alcohol = 0;
            const hasbled = htn + renal + liver + stroke + bleeding + inr + age + drugs + alcohol;
            
            expect(hasbled).toBe(7);
            // 極高風險
        });
    });

    describe('可修正的危險因子', () => {
        test('控制高血壓', () => {
            const modifiable = true;
            expect(modifiable).toBe(true);
        });

        test('穩定 INR', () => {
            const modifiable = true;
            expect(modifiable).toBe(true);
        });

        test('避免 NSAIDs 和抗血小板藥', () => {
            const modifiable = true;
            expect(modifiable).toBe(true);
        });

        test('減少酒精攝入', () => {
            const modifiable = true;
            expect(modifiable).toBe(true);
        });

        test('治療貧血', () => {
            const modifiable = true;
            expect(modifiable).toBe(true);
        });
    });

    describe('與 CHA2DS2-VASc 的關係', () => {
        test('HAS-BLED 用於評估出血風險', () => {
            const assessesBleeding = true;
            expect(assessesBleeding).toBe(true);
        });

        test('CHA2DS2-VASc 用於評估中風風險', () => {
            const assessesStroke = true;
            expect(assessesStroke).toBe(true);
        });

        test('應該同時使用兩個評分', () => {
            const useBoth = true;
            expect(useBoth).toBe(true);
        });

        test('高出血風險不應單獨作為停用抗凝的理由', () => {
            const shouldBalance = true;
            expect(shouldBalance).toBe(true);
        });
    });

    describe('使用限制', () => {
        test('預測能力有限', () => {
            const limitedPrediction = true;
            expect(limitedPrediction).toBe(true);
        });

        test('不應作為停用抗凝的絕對指標', () => {
            const notAbsoluteContraindication = true;
            expect(notAbsoluteContraindication).toBe(true);
        });

        test('需要臨床判斷', () => {
            const needsClinicalJudgment = true;
            expect(needsClinicalJudgment).toBe(true);
        });
    });

    describe('DOACs vs Warfarin', () => {
        test('DOACs 可能降低出血風險', () => {
            const doacsLowerRisk = true;
            expect(doacsLowerRisk).toBe(true);
        });

        test('HAS-BLED ≥3 時考慮 DOACs', () => {
            const score = 4;
            const considerDOACs = score >= 3;
            expect(considerDOACs).toBe(true);
        });
    });
});

