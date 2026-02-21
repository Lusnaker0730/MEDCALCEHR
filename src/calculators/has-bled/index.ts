/**
 * HAS-BLED Score for Major Bleeding Risk Calculator
 *
 * 使用 Yes/No Calculator 工廠函數
 * 已整合 FHIRDataService 進行自動填充
 */

import { createScoringCalculator, ScoringCalculatorConfig } from '../shared/scoring-calculator.js';
import { LOINC_CODES, SNOMED_CODES, RXNORM_CODES } from '../../fhir-codes.js';
import { fhirDataService } from '../../fhir-data-service.js';
import { UnitConverter } from '../../unit-converter.js';
import { uiBuilder } from '../../ui-builder.js';
import { logger } from '../../logger.js';

export const hasBledConfig: ScoringCalculatorConfig = {
    inputType: 'yesno',
    id: 'has-bled',
    title: 'HAS-BLED Score for Major Bleeding Risk',
    description:
        'Estimates risk of major bleeding for patients on anticoagulation to assess risk-benefit in atrial fibrillation care.',
    infoAlert: 'Select all risk factors that apply. Score automatically calculates.',
    sectionTitle: 'HAS-BLED Risk Factors',
    sectionIcon: '🩸',
    questions: [
        {
            id: 'hasbled-hypertension',
            label: '<strong>H</strong>ypertension (Uncontrolled, >160 mmHg systolic)',
            points: 1,
            conditionCode: SNOMED_CODES.HYPERTENSION
        },
        {
            id: 'hasbled-renal',
            label: 'Abnormal <strong>R</strong>enal function (Dialysis, transplant, Cr >2.26 mg/dL)',
            points: 1,
            conditionCode: SNOMED_CODES.CHRONIC_KIDNEY_DISEASE
        },
        {
            id: 'hasbled-liver',
            label: 'Abnormal <strong>L</strong>iver function (Cirrhosis or bilirubin >2x normal with AST/ALT/AP >3x normal)',
            points: 1,
            conditionCode: SNOMED_CODES.CIRRHOSIS
        },
        {
            id: 'hasbled-stroke',
            label: '<strong>S</strong>troke history',
            points: 1,
            conditionCode: SNOMED_CODES.STROKE
        },
        {
            id: 'hasbled-bleeding',
            label: '<strong>B</strong>leeding history or predisposition',
            points: 1,
            conditionCode: SNOMED_CODES.PREVIOUS_BLEEDING
        },
        {
            id: 'hasbled-inr',
            label: '<strong>L</strong>abile INR (Unstable/high INRs, time in therapeutic range <60%)',
            points: 1
        },
        { id: 'hasbled-age', label: '<strong>E</strong>lderly (Age >65)', points: 1 },
        {
            id: 'hasbled-meds',
            label: '<strong>D</strong>rugs predisposing to bleeding (Aspirin, clopidogrel, NSAIDs)',
            points: 1
        },
        { id: 'hasbled-alcohol', label: 'Alcohol use (≥8 drinks/week)', points: 1 }
    ],
    formulaSection: {
        show: true,
        title: 'FORMULA',
        calculationNote: 'Addition of the selected points:',
        scoringCriteria: [
            { criteria: 'Hypertension', points: '1' },
            {
                criteria: 'Renal disease (dialysis, transplant, Cr >2.26 mg/dL or 200 µmol/L)',
                points: '1'
            },
            {
                criteria:
                    'Liver disease (cirrhosis or bilirubin >2x normal with AST/ALT/AP >3x normal)',
                points: '1'
            },
            { criteria: 'Stroke history', points: '1' },
            { criteria: 'Prior major bleeding or predisposition to bleeding', points: '1' },
            {
                criteria: 'Labile INR (unstable/high INRs, time in therapeutic range <60%)',
                points: '1'
            },
            { criteria: 'Elderly (age >65)', points: '1' },
            {
                criteria:
                    'Medication usage predisposing to bleeding (aspirin, clopidogrel, NSAIDs)',
                points: '1'
            },
            { criteria: 'Alcohol usage (≥8 drinks/week)', points: '1' }
        ],
        footnotes: [
            'Note: HAS-BLED is an acronym for Hypertension, Abnormal liver/renal function, Stroke history, Bleeding predisposition, Labile INR, Elderly, Drug/alcohol usage.'
        ]
    },

    riskLevels: [
        {
            minScore: 0,
            maxScore: 0,
            label: 'Low risk',
            severity: 'success',
            recommendation:
                'Anticoagulation should be considered. Relatively low risk for major bleeding.'
        },
        {
            minScore: 1,
            maxScore: 1,
            label: 'Low-moderate risk',
            severity: 'success',
            recommendation:
                'Anticoagulation should be considered.'
        },
        {
            minScore: 2,
            maxScore: 2,
            label: 'Moderate risk',
            severity: 'warning',
            recommendation:
                'Anticoagulation can be considered.'
        },
        {
            minScore: 3,
            maxScore: 999,
            label: 'High risk',
            severity: 'danger',
            recommendation:
                'Alternatives to anticoagulation should be considered. Address modifiable bleeding risk factors.'
        }
    ],

    customResultRenderer: (score: number): string => {
        const riskData: Record<number, { risk: string; level: string; bleeds: string }> = {
            0: {
                risk: 'Low risk',
                level: 'success',
                bleeds: '0.9% risk (1.13 bleeds/100 patient-years)'
            },
            1: {
                risk: 'Low-moderate risk',
                level: 'success',
                bleeds: '3.4% risk (1.02 bleeds/100 patient-years)'
            },
            2: { risk: 'Moderate risk', level: 'warning', bleeds: '4.1% risk (1.88 bleeds/100 patient-years)' },
            3: {
                risk: 'High risk',
                level: 'danger',
                bleeds: '5.8% risk (3.72 bleeds/100 patient-years)'
            },
            4: { risk: 'High risk', level: 'danger', bleeds: '8.9% risk (8.70 bleeds/100 patient-years)' },
            5: { risk: 'High risk', level: 'danger', bleeds: '9.1% risk (12.50 bleeds/100 patient-years)' }
        };

        const data = riskData[Math.min(score, 5)] || {
            risk: 'Very high risk',
            level: 'danger',
            bleeds: '>10% estimated (too rare to determine precisely)'
        };
        const alertClass = `ui-alert-${data.level}`;
        const recommendation =
            score >= 3
                ? 'Alternatives to anticoagulation should be considered. Address modifiable bleeding risk factors.'
                : score === 2
                    ? 'Anticoagulation can be considered.'
                    : 'Anticoagulation should be considered. Relatively low risk for major bleeding.';

        return `
            ${uiBuilder.createResultItem({
            label: 'Total Score',
            value: score.toString(),
            unit: '/ 9 points',
            interpretation: data.risk,
            alertClass: alertClass
        })}
            
            ${uiBuilder.createResultItem({
            label: 'Annual Bleeding Risk',
            value: data.bleeds
        })}
            ${uiBuilder.createAlert({
            type: data.level as 'success' | 'warning' | 'danger',
            message: `<strong>Recommendation:</strong> ${recommendation}`
        })}
        `;
    },

    // 使用 customInitialize 處理年齡和複雜的 FHIR 邏輯
    customInitialize: async (client, patient, container, calculate) => {
        const setRadioValue = (name: string, value: string) => {
            const radio = container.querySelector(
                `input[name="${name}"][value="${value}"]`
            ) as HTMLInputElement;
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change', { bubbles: true }));
            }
        };

        // 自動填充年齡
        const age = fhirDataService.getPatientAge();
        if (age !== null && age > 65) {
            setRadioValue('hasbled-age', '1');
        }

        if (!fhirDataService.isReady()) {
            return;
        }

        const stalenessTracker = fhirDataService.getStalenessTracker();

        try {
            // 獲取血壓（使用 blood pressure panel）SBP > 160
            const bpResult = await fhirDataService.getBloodPressure({
                trackStaleness: true
            });

            if (bpResult.systolic !== null && bpResult.systolic > 160) {
                setRadioValue('hasbled-hypertension', '1');
            }

            // Creatinine > 2.26 mg/dL
            const crResult = await fhirDataService.getObservation(LOINC_CODES.CREATININE, {
                trackStaleness: true,
                stalenessLabel: 'Creatinine'
            });

            if (crResult.value !== null) {
                const unit = crResult.unit || 'mg/dL';
                const crMgDl = UnitConverter.convert(crResult.value, unit, 'mg/dL', 'creatinine');
                if (crMgDl !== null && crMgDl > 2.26) {
                    setRadioValue('hasbled-renal', '1');
                    if (stalenessTracker && crResult.observation) {
                        stalenessTracker.trackObservation(
                            'input[name="hasbled-renal"]',
                            crResult.observation,
                            LOINC_CODES.CREATININE,
                            'Creatinine > 2.26'
                        );
                    }
                }
            }

            // 檢查抗血小板藥物 (Aspirin, Clopidogrel, NSAIDs)
            const bleedingMeds = [
                RXNORM_CODES.ASPIRIN,
                RXNORM_CODES.CLOPIDOGREL,
                RXNORM_CODES.IBUPROFEN,
                RXNORM_CODES.NAPROXEN,
                RXNORM_CODES.DICLOFENAC,
                RXNORM_CODES.KETOROLAC,
                RXNORM_CODES.INDOMETHACIN,
                RXNORM_CODES.MELOXICAM,
                RXNORM_CODES.CELECOXIB
            ];

            const hasMeds = await fhirDataService.isOnMedication(bleedingMeds);
            if (hasMeds) {
                setRadioValue('hasbled-meds', '1');
            }
        } catch (error) {
            logger.warn('Error auto-populating HAS-BLED', { error: String(error) });
        }
    }
};

// 創建基礎計算器
const baseCalculator = createScoringCalculator(hasBledConfig);

// 導出帶有 Facts & Figures 表格的計算器
export const hasBled = {
    ...baseCalculator,

    generateHTML(): string {
        const html = baseCalculator.generateHTML();

        // 添加 Facts & Figures 區塊
        const factsSection = `
            ${uiBuilder.createSection({
            title: 'FACTS & FIGURES',
            icon: '📊',
            content: uiBuilder.createTable({
                headers: [
                    'HAS-BLED Score',
                    'Risk group',
                    'Risk of major bleeding**',
                    'Bleeds per 100 patient-years***',
                    'Recommendation'
                ],
                rows: [
                    ['0', 'Low', '0.9%', '1.13', 'Anticoagulation should be considered'],
                    ['1', 'Low-moderate', '3.4%', '1.02', 'Anticoagulation should be considered'],
                    ['2', 'Moderate', '4.1%', '1.88', 'Anticoagulation can be considered'],
                    ['3', 'High', '5.8%', '3.72', 'Alternatives to anticoagulation should be considered'],
                    [
                        '4',
                        'High',
                        '8.9%',
                        '8.70',
                        'Alternatives to anticoagulation should be considered'
                    ],
                    [
                        '5',
                        'High',
                        '9.1%',
                        '12.50',
                        'Alternatives to anticoagulation should be considered'
                    ],
                    ['>5*', 'Very high', '-', '-', '-']
                ],
                stickyFirstColumn: true
            })
        })}
        `;

        return html + factsSection;
    }
};
