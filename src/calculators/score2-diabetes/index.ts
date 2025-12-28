/**
 * SCORE2-Diabetes Risk Score
 *
 * 使用 Mixed Input Calculator 工廠函數
 * 預測第2型糖尿病患者10年心血管疾病風險
 */

import { createMixedInputCalculator } from '../shared/mixed-input-calculator.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { fhirDataService } from '../../fhir-data-service.js';

// Region-specific coefficients
const score2DiabetesData: Record<
    string,
    Record<
        string,
        {
            age: number;
            sbp: number;
            tchol: number;
            hdl: number;
            hba1c: number;
            egfr: number;
            smoking: number;
            s010: number;
            mean_x: number;
        }
    >
> = {
    low: {
        male: {
            age: 0.0652,
            sbp: 0.0139,
            tchol: 0.2079,
            hdl: -0.4485,
            hba1c: 0.0211,
            egfr: -0.0076,
            smoking: 0.3838,
            s010: 0.9765,
            mean_x: 4.9664
        },
        female: {
            age: 0.0768,
            sbp: 0.0152,
            tchol: 0.147,
            hdl: -0.5659,
            hba1c: 0.0232,
            egfr: -0.0084,
            smoking: 0.5422,
            s010: 0.9859,
            mean_x: 5.215
        }
    },
    moderate: {
        male: {
            age: 0.0652,
            sbp: 0.0139,
            tchol: 0.2079,
            hdl: -0.4485,
            hba1c: 0.0211,
            egfr: -0.0076,
            smoking: 0.3838,
            s010: 0.9626,
            mean_x: 4.9664
        },
        female: {
            age: 0.0768,
            sbp: 0.0152,
            tchol: 0.147,
            hdl: -0.5659,
            hba1c: 0.0232,
            egfr: -0.0084,
            smoking: 0.5422,
            s010: 0.9782,
            mean_x: 5.215
        }
    },
    high: {
        male: {
            age: 0.0652,
            sbp: 0.0139,
            tchol: 0.2079,
            hdl: -0.4485,
            hba1c: 0.0211,
            egfr: -0.0076,
            smoking: 0.3838,
            s010: 0.9388,
            mean_x: 4.9664
        },
        female: {
            age: 0.0768,
            sbp: 0.0152,
            tchol: 0.147,
            hdl: -0.5659,
            hba1c: 0.0232,
            egfr: -0.0084,
            smoking: 0.5422,
            s010: 0.9661,
            mean_x: 5.215
        }
    },
    very_high: {
        male: {
            age: 0.0652,
            sbp: 0.0139,
            tchol: 0.2079,
            hdl: -0.4485,
            hba1c: 0.0211,
            egfr: -0.0076,
            smoking: 0.3838,
            s010: 0.9038,
            mean_x: 4.9664
        },
        female: {
            age: 0.0768,
            sbp: 0.0152,
            tchol: 0.147,
            hdl: -0.5659,
            hba1c: 0.0232,
            egfr: -0.0084,
            smoking: 0.5422,
            s010: 0.9472,
            mean_x: 5.215
        }
    }
};

export const score2Diabetes = createMixedInputCalculator({
    id: 'score2-diabetes',
    title: 'SCORE2-Diabetes Risk Score',
    description: 'Predicts 10-year CVD risk in patients with type 2 diabetes (age 40-69).',

    infoAlert:
        '<strong>Instructions:</strong> Select risk region and enter patient details. Validated for European populations aged 40-69.',

    sections: [
        {
            title: 'Geographic Risk Region',
            icon: '🌍',
            inputs: [
                {
                    type: 'radio',
                    name: 'score2d-region',
                    label: 'Select Region',
                    options: [
                        { value: 'low', label: 'Low Risk (e.g., France, Spain, Italy)' },
                        { value: 'moderate', label: 'Moderate Risk (e.g., Germany, UK)' },
                        { value: 'high', label: 'High Risk (e.g., Poland, Hungary)' },
                        { value: 'very_high', label: 'Very High Risk (e.g., Romania, Turkey)' }
                    ]
                }
            ]
        },
        {
            title: 'Demographics & History',
            icon: '👤',
            inputs: [
                {
                    type: 'radio',
                    name: 'score2d-sex',
                    label: 'Gender',
                    options: [
                        { value: 'male', label: 'Male' },
                        { value: 'female', label: 'Female' }
                    ]
                },
                {
                    type: 'number',
                    id: 'score2d-age',
                    label: 'Age',
                    unit: 'years',
                    min: 40,
                    max: 69,
                    placeholder: '40-69'
                },
                {
                    type: 'radio',
                    name: 'score2d-smoking',
                    label: 'Smoking Status',
                    options: [
                        { value: '0', label: 'Non-smoker', checked: true },
                        { value: '1', label: 'Current Smoker' }
                    ]
                }
            ]
        },
        {
            title: 'Clinical & Lab Values',
            icon: '🧪',
            inputs: [
                {
                    type: 'number',
                    id: 'score2d-sbp',
                    label: 'Systolic BP',
                    unit: 'mmHg',
                    placeholder: 'e.g. 130'
                },
                {
                    type: 'number',
                    id: 'score2d-tchol',
                    label: 'Total Cholesterol',
                    unit: 'mg/dL',
                    placeholder: 'e.g. 200'
                },
                {
                    type: 'number',
                    id: 'score2d-hdl',
                    label: 'HDL Cholesterol',
                    unit: 'mg/dL',
                    placeholder: 'e.g. 50'
                },
                {
                    type: 'number',
                    id: 'score2d-hba1c',
                    label: 'HbA1c',
                    unit: '%',
                    step: 0.1,
                    placeholder: 'e.g. 7.0'
                },
                {
                    type: 'number',
                    id: 'score2d-egfr',
                    label: 'eGFR',
                    unit: 'mL/min',
                    placeholder: 'e.g. 90'
                }
            ]
        }
    ],

    riskLevels: [
        { minScore: 0, maxScore: 5, label: 'Low Risk', severity: 'success' },
        { minScore: 5, maxScore: 10, label: 'Moderate Risk', severity: 'warning' },
        { minScore: 10, maxScore: 20, label: 'High Risk', severity: 'danger' },
        { minScore: 20, maxScore: 100, label: 'Very High Risk', severity: 'danger' }
    ],

    formulaSection: {
        show: true,
        title: 'Risk Calculation',
        type: 'list',
        calculationNote: 'Cox proportional hazards model with region-specific baseline survival',
        footnotes: [
            'Uses European Heart Journal validated coefficients',
            'Separate models for male and female patients',
            'Risk = 1 - S₀^exp(X - mean_X)'
        ]
    },

    calculate: values => {
        const region = values['score2d-region'] as string;
        const sex = values['score2d-sex'] as string;
        const age = values['score2d-age'] as number;
        const smoking = parseInt((values['score2d-smoking'] as string) || '0', 10);
        const sbp = values['score2d-sbp'] as number;
        const tchol = values['score2d-tchol'] as number;
        const hdl = values['score2d-hdl'] as number;
        const hba1c = values['score2d-hba1c'] as number;
        const egfr = values['score2d-egfr'] as number;

        // Validation
        if (!region || !sex || !age || !sbp || !tchol || !hdl || !hba1c || !egfr) {
            return null;
        }

        if (age < 40 || age > 69) {
            return null; // Will be handled by customResultRenderer
        }

        const coeffs = score2DiabetesData[region]?.[sex];
        if (!coeffs) return null;

        // Conversions
        const tchol_mmol = tchol / 38.67;
        const hdl_mmol = hdl / 38.67;
        const hba1c_mmol = hba1c * 10.93 - 23.5;

        const ind_x =
            coeffs.age * age +
            coeffs.sbp * sbp +
            coeffs.tchol * tchol_mmol +
            coeffs.hdl * hdl_mmol +
            coeffs.hba1c * hba1c_mmol +
            coeffs.egfr * egfr +
            coeffs.smoking * smoking;

        const risk = 100 * (1 - Math.pow(coeffs.s010, Math.exp(ind_x - coeffs.mean_x)));
        return Math.round(risk * 10) / 10; // Round to 1 decimal
    },

    customResultRenderer: (score: number, values: Record<string, number | string | null>) => {
        const age = values['score2d-age'] as number;

        if (age && (age < 40 || age > 69)) {
            return uiBuilder.createAlert({
                type: 'warning',
                message: 'Score valid only for ages 40-69.'
            });
        }

        let riskCategory = '';
        let alertType: 'success' | 'warning' | 'danger' = 'success';

        if (score < 5) {
            riskCategory = 'Low Risk';
            alertType = 'success';
        } else if (score < 10) {
            riskCategory = 'Moderate Risk';
            alertType = 'warning';
        } else if (score < 20) {
            riskCategory = 'High Risk';
            alertType = 'danger';
        } else {
            riskCategory = 'Very High Risk';
            alertType = 'danger';
        }

        return `
            ${uiBuilder.createResultItem({
                label: '10-Year CVD Risk',
                value: score.toFixed(1),
                unit: '%',
                interpretation: riskCategory,
                alertClass: `ui-alert-${alertType}`
            })}
        `;
    },

    customInitialize: async (client, patient, container, calculate, setValue) => {
        fhirDataService.initialize(client, patient, container);

        const setRadioValue = (name: string, value: string) => {
            const radio = container.querySelector(
                `input[name="${name}"][value="${value}"]`
            ) as HTMLInputElement;
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change', { bubbles: true }));
            }
        };

        // Auto-populate age
        const age = fhirDataService.getPatientAge();
        if (age !== null) {
            setValue('score2d-age', age.toString());
        }

        // Auto-populate gender
        const gender = fhirDataService.getPatientGender();
        if (gender) {
            setRadioValue('score2d-sex', gender);
        }

        if (!client) return;

        try {
            // Systolic BP (使用 getBloodPressure 處理 panel observation)
            const bpResult = await fhirDataService.getBloodPressure({
                trackStaleness: true
            });
            if (bpResult.systolic !== null) {
                setValue('score2d-sbp', bpResult.systolic.toFixed(0));
            }

            // Total Cholesterol
            const tcholResult = await fhirDataService.getObservation(
                LOINC_CODES.CHOLESTEROL_TOTAL,
                {
                    trackStaleness: true,
                    stalenessLabel: 'Total Cholesterol'
                }
            );
            if (tcholResult.value !== null) {
                setValue('score2d-tchol', tcholResult.value.toFixed(0));
            }

            // HDL
            const hdlResult = await fhirDataService.getObservation(LOINC_CODES.HDL, {
                trackStaleness: true,
                stalenessLabel: 'HDL Cholesterol'
            });
            if (hdlResult.value !== null) {
                setValue('score2d-hdl', hdlResult.value.toFixed(0));
            }

            // HbA1c
            const hba1cResult = await fhirDataService.getObservation(LOINC_CODES.HBA1C, {
                trackStaleness: true,
                stalenessLabel: 'HbA1c'
            });
            if (hba1cResult.value !== null) {
                setValue('score2d-hba1c', hba1cResult.value.toFixed(1));
            }

            // eGFR
            const egfrResult = await fhirDataService.getObservation(LOINC_CODES.EGFR, {
                trackStaleness: true,
                stalenessLabel: 'eGFR'
            });
            if (egfrResult.value !== null) {
                setValue('score2d-egfr', egfrResult.value.toFixed(0));
            }

            calculate();
        } catch (e) {
            console.warn('FHIR data fetch failed:', e);
        }
    }
});
