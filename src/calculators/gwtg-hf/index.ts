/**
 * GWTG-Heart Failure Risk Score
 *
 * 使用 createMixedInputCalculator 工廠函數遷移
 */

import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import {
    createMixedInputCalculator,
    MixedInputCalculatorConfig
} from '../shared/mixed-input-calculator.js';
import { fhirDataService } from '../../fhir-data-service.js';

// 分數計算函數
const getPoints = {
    sbp: (v: number): number => {
        if (v < 90) {
            return 28;
        }
        if (v < 100) {
            return 23;
        }
        if (v < 110) {
            return 18;
        }
        if (v < 120) {
            return 14;
        }
        if (v < 130) {
            return 9;
        }
        if (v < 140) {
            return 5;
        }
        return 0;
    },
    bun: (v: number): number => {
        if (v < 20) {
            return 0;
        }
        if (v < 30) {
            return 4;
        }
        if (v < 40) {
            return 9;
        }
        if (v < 50) {
            return 13;
        }
        if (v < 60) {
            return 18;
        }
        if (v < 70) {
            return 22;
        }
        return 28;
    },
    sodium: (v: number): number => {
        if (v > 140) {
            return 4;
        }
        if (v > 135) {
            return 2;
        }
        return 0;
    },
    age: (v: number): number => {
        if (v < 40) {
            return 0;
        }
        if (v < 50) {
            return 7;
        }
        if (v < 60) {
            return 14;
        }
        if (v < 70) {
            return 21;
        }
        if (v < 80) {
            return 28;
        }
        return 28;
    },
    hr: (v: number): number => {
        if (v < 70) {
            return 0;
        }
        if (v < 80) {
            return 1;
        }
        if (v < 90) {
            return 3;
        }
        if (v < 100) {
            return 5;
        }
        if (v < 110) {
            return 6;
        }
        return 8;
    }
};

const getMortality = (score: number): string => {
    if (score <= 32) {
        return '<1%';
    }
    if (score <= 41) {
        return '1-2%';
    }
    if (score <= 50) {
        return '2-5%';
    }
    if (score <= 56) {
        return '5-10%';
    }
    if (score <= 61) {
        return '10-15%';
    }
    if (score <= 65) {
        return '15-20%';
    }
    if (score <= 72) {
        return '20-30%';
    }
    if (score <= 74) {
        return '30-40%';
    }
    if (score <= 79) {
        return '40-50%';
    }
    return '>50%';
};

const config: MixedInputCalculatorConfig = {
    id: 'gwtg-hf',
    title: 'GWTG-Heart Failure Risk Score',
    description: 'Predicts in-hospital all-cause heart failure mortality.',

    infoAlert:
        '<strong>IMPORTANT:</strong> This calculator includes inputs based on race, which may or may not provide better estimates.',

    sections: [
        {
            title: 'Clinical Parameters',
            inputs: [
                {
                    type: 'number',
                    id: 'gwtg-sbp',
                    label: 'Systolic BP',
                    unit: 'mmHg',
                    placeholder: '120'
                },
                {
                    type: 'number',
                    id: 'gwtg-bun',
                    label: 'BUN',
                    unit: 'mg/dL',
                    placeholder: '30'
                },
                {
                    type: 'number',
                    id: 'gwtg-sodium',
                    label: 'Sodium',
                    unit: 'mEq/L',
                    placeholder: '140'
                },
                {
                    type: 'number',
                    id: 'gwtg-age',
                    label: 'Age',
                    unit: 'years',
                    placeholder: '65'
                },
                {
                    type: 'number',
                    id: 'gwtg-hr',
                    label: 'Heart Rate',
                    unit: 'bpm',
                    placeholder: '80'
                }
            ]
        },
        {
            title: 'Risk Factors',
            inputs: [
                {
                    type: 'radio',
                    name: 'copd',
                    label: 'COPD History',
                    options: [
                        { value: '0', label: 'No (0)', checked: true },
                        { value: '2', label: 'Yes (+2)' }
                    ]
                },
                {
                    type: 'radio',
                    name: 'race',
                    label: 'Black Race',
                    helpText:
                        'Race may/may not provide better estimates of in-hospital mortality; optional',
                    options: [
                        { value: '0', label: 'No (0)', checked: true },
                        { value: '-3', label: 'Yes (-3)' }
                    ]
                }
            ]
        }
    ],

    resultTitle: 'GWTG-HF Score Result',

    calculate: values => {
        const sbp = values['gwtg-sbp'] as number | null;
        const bun = values['gwtg-bun'] as number | null;
        const sodium = values['gwtg-sodium'] as number | null;
        const age = values['gwtg-age'] as number | null;
        const hr = values['gwtg-hr'] as number | null;

        // Require all numeric inputs
        if (sbp === null || bun === null || sodium === null || age === null || hr === null) {
            return null;
        }

        let score = 0;
        score += getPoints.sbp(sbp);
        score += getPoints.bun(bun);
        score += getPoints.sodium(sodium);
        score += getPoints.age(age);
        score += getPoints.hr(hr);

        // Radio values
        const copd = values['copd'] as string | null;
        const race = values['race'] as string | null;

        if (copd) {
            score += parseInt(copd);
        }
        if (race) {
            score += parseInt(race);
        }

        return score;
    },

    customResultRenderer: (score, values) => {
        const mortality = getMortality(score);

        let riskLevel = 'Low Risk';
        let alertType: 'success' | 'warning' | 'danger' = 'success';

        if (
            mortality.includes('>50%') ||
            mortality.includes('40-50') ||
            mortality.includes('30-40')
        ) {
            riskLevel = 'High Risk';
            alertType = 'danger';
        } else if (
            mortality.includes('20-30') ||
            mortality.includes('15-20') ||
            mortality.includes('10-15')
        ) {
            riskLevel = 'Moderate Risk';
            alertType = 'warning';
        }

        return `
            ${uiBuilder.createResultItem({
                label: 'GWTG-HF Score',
                value: score.toString(),
                unit: 'points',
                interpretation: riskLevel,
                alertClass: `ui-alert-${alertType}`
            })}
            ${uiBuilder.createResultItem({
                label: 'In-hospital Mortality',
                value: mortality,
                alertClass: `ui-alert-${alertType}`
            })}
        `;
    },

    customInitialize: async (client, patient, container, calculate, setValue) => {
        // Initialize FHIRDataService
        fhirDataService.initialize(client, patient, container);

        // Age from patient using FHIRDataService
        const age = fhirDataService.getPatientAge();
        if (age !== null) {
            setValue('gwtg-age', age.toString());
        }

        if (client) {
            // Fetch all observations in parallel using FHIRDataService
            const [sbpResult, bunResult, sodiumResult, hrResult] = await Promise.all([
                fhirDataService
                    .getObservation(LOINC_CODES.SYSTOLIC_BP, {
                        trackStaleness: true,
                        stalenessLabel: 'Systolic BP'
                    })
                    .catch(() => ({ value: null })),
                fhirDataService
                    .getObservation(LOINC_CODES.BUN, {
                        trackStaleness: true,
                        stalenessLabel: 'BUN',
                        targetUnit: 'mg/dL'
                    })
                    .catch(() => ({ value: null })),
                fhirDataService
                    .getObservation(LOINC_CODES.SODIUM, {
                        trackStaleness: true,
                        stalenessLabel: 'Sodium',
                        targetUnit: 'mEq/L'
                    })
                    .catch(() => ({ value: null })),
                fhirDataService
                    .getObservation(LOINC_CODES.HEART_RATE, {
                        trackStaleness: true,
                        stalenessLabel: 'Heart Rate'
                    })
                    .catch(() => ({ value: null }))
            ]);

            if (sbpResult.value !== null) {
                setValue('gwtg-sbp', sbpResult.value.toFixed(0));
            }

            if (bunResult.value !== null) {
                setValue('gwtg-bun', bunResult.value.toFixed(0));
            }

            if (sodiumResult.value !== null) {
                setValue('gwtg-sodium', sodiumResult.value.toFixed(0));
            }

            if (hrResult.value !== null) {
                setValue('gwtg-hr', hrResult.value.toFixed(0));
            }
        }

        calculate();
    }
};

export const gwtgHf = createMixedInputCalculator(config);
