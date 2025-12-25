/**
 * GRACE ACS Risk Score
 *
 * 使用 createMixedInputCalculator 工廠函數遷移
 */

import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import {
    createMixedInputCalculator,
    MixedInputCalculatorConfig
} from '../shared/mixed-input-calculator.js';
import { fhirDataService } from '../../fhir-data-service.js';

const config: MixedInputCalculatorConfig = {
    id: 'grace-acs',
    title: 'GRACE ACS Risk Score',
    description:
        'Estimates admission to 6 month mortality for patients with acute coronary syndrome.',

    sections: [
        {
            title: 'Vital Signs & Demographics',
            icon: '🌡️',
            inputs: [
                {
                    type: 'number',
                    id: 'grace-age',
                    label: 'Age',
                    placeholder: 'Enter age',
                    unit: 'years'
                },
                {
                    type: 'number',
                    id: 'grace-hr',
                    label: 'Heart Rate',
                    placeholder: 'Enter heart rate',
                    unit: 'bpm'
                },
                {
                    type: 'number',
                    id: 'grace-sbp',
                    label: 'Systolic BP',
                    placeholder: 'Enter systolic BP',
                    unit: 'mmHg'
                },
                {
                    type: 'number',
                    id: 'grace-creatinine',
                    label: 'Creatinine',
                    step: 0.1,
                    placeholder: 'Enter creatinine',
                    unitToggle: {
                        type: 'creatinine',
                        units: ['mg/dL', 'µmol/L'],
                        default: 'mg/dL'
                    }
                }
            ]
        },
        {
            title: 'Clinical Findings',
            icon: '🩺',
            inputs: [
                {
                    type: 'radio',
                    name: 'grace-killip',
                    label: 'Killip Class (Heart Failure Classification)',
                    options: [
                        { value: '0', label: 'Class I - No heart failure', checked: true },
                        { value: '20', label: 'Class II - Mild HF (rales, S3)' },
                        { value: '39', label: 'Class III - Pulmonary edema' },
                        { value: '59', label: 'Class IV - Cardiogenic shock' }
                    ]
                },
                {
                    type: 'radio',
                    name: 'grace-cardiac-arrest',
                    label: 'Cardiac Arrest at Admission',
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: '39', label: 'Yes' }
                    ]
                },
                {
                    type: 'radio',
                    name: 'grace-st-deviation',
                    label: 'ST Segment Deviation',
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: '28', label: 'Yes' }
                    ]
                },
                {
                    type: 'radio',
                    name: 'grace-cardiac-enzymes',
                    label: 'Abnormal Cardiac Enzymes',
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: '14', label: 'Yes' }
                    ]
                }
            ]
        }
    ],

    resultTitle: 'GRACE ACS Risk Assessment',

    calculate: values => {
        const age = values['grace-age'] as number | null;
        const hr = values['grace-hr'] as number | null;
        const sbp = values['grace-sbp'] as number | null;
        const creatinine = values['grace-creatinine'] as number | null;

        // Require all numeric inputs
        if (age === null || hr === null || sbp === null || creatinine === null) {
            return null;
        }

        // Age points
        let agePoints = 0;
        if (age >= 40 && age <= 49) {
            agePoints = 18;
        } else if (age >= 50 && age <= 59) {
            agePoints = 36;
        } else if (age >= 60 && age <= 69) {
            agePoints = 55;
        } else if (age >= 70 && age <= 79) {
            agePoints = 73;
        } else if (age >= 80) {
            agePoints = 91;
        }

        // HR points
        let hrPoints = 0;
        if (hr >= 50 && hr <= 69) {
            hrPoints = 0;
        } else if (hr >= 70 && hr <= 89) {
            hrPoints = 3;
        } else if (hr >= 90 && hr <= 109) {
            hrPoints = 7;
        } else if (hr >= 110 && hr <= 149) {
            hrPoints = 13;
        } else if (hr >= 150 && hr <= 199) {
            hrPoints = 23;
        } else if (hr >= 200) {
            hrPoints = 36;
        }

        // SBP points
        let sbpPoints = 0;
        if (sbp >= 200) {
            sbpPoints = 0;
        } else if (sbp >= 160 && sbp <= 199) {
            sbpPoints = 10;
        } else if (sbp >= 140 && sbp <= 159) {
            sbpPoints = 18;
        } else if (sbp >= 120 && sbp <= 139) {
            sbpPoints = 24;
        } else if (sbp >= 100 && sbp <= 119) {
            sbpPoints = 34;
        } else if (sbp >= 80 && sbp <= 99) {
            sbpPoints = 43;
        } else if (sbp < 80) {
            sbpPoints = 53;
        }

        // Creatinine points
        let crPoints = 0;
        if (creatinine >= 0 && creatinine <= 0.39) {
            crPoints = 1;
        } else if (creatinine >= 0.4 && creatinine <= 0.79) {
            crPoints = 4;
        } else if (creatinine >= 0.8 && creatinine <= 1.19) {
            crPoints = 7;
        } else if (creatinine >= 1.2 && creatinine <= 1.59) {
            crPoints = 10;
        } else if (creatinine >= 1.6 && creatinine <= 1.99) {
            crPoints = 13;
        } else if (creatinine >= 2.0 && creatinine <= 3.99) {
            crPoints = 21;
        } else if (creatinine >= 4.0) {
            crPoints = 28;
        }

        // Radio points
        const killip = parseInt((values['grace-killip'] as string) || '0');
        const arrest = parseInt((values['grace-cardiac-arrest'] as string) || '0');
        const st = parseInt((values['grace-st-deviation'] as string) || '0');
        const enzymes = parseInt((values['grace-cardiac-enzymes'] as string) || '0');

        return agePoints + hrPoints + sbpPoints + crPoints + killip + arrest + st + enzymes;
    },

    customResultRenderer: (score, values) => {
        let inHospitalMortality = '<1%';
        let riskLevel = 'Low Risk';
        let alertClass = 'ui-alert-success';
        let riskDescription = 'Low risk of in-hospital mortality';

        if (score > 140) {
            inHospitalMortality = '>3%';
            riskLevel = 'High Risk';
            alertClass = 'ui-alert-danger';
            riskDescription =
                'High risk of in-hospital mortality - Consider intensive monitoring and aggressive intervention';
        } else if (score > 118) {
            inHospitalMortality = '1-3%';
            riskLevel = 'Intermediate Risk';
            alertClass = 'ui-alert-warning';
            riskDescription =
                'Intermediate risk of in-hospital mortality - Close monitoring recommended';
        }

        return `
            ${uiBuilder.createResultItem({
                label: 'Total GRACE Score',
                value: score.toString(),
                unit: 'points',
                interpretation: riskLevel,
                alertClass: alertClass
            })}
            ${uiBuilder.createResultItem({
                label: 'In-Hospital Mortality Risk',
                value: inHospitalMortality,
                alertClass: alertClass
            })}
            
            <div class="ui-alert ${alertClass} mt-10">
                <span class="ui-alert-icon">📋</span>
                <div class="ui-alert-content">
                    <strong>Interpretation:</strong> ${riskDescription}
                </div>
            </div>
        `;
    },

    customInitialize: async (client, patient, container, calculate, setValue) => {
        // Initialize FHIRDataService
        fhirDataService.initialize(client, patient, container);

        if (!client) {
            calculate();
            return;
        }

        // Age from patient using FHIRDataService
        const age = fhirDataService.getPatientAge();
        if (age !== null) {
            setValue('grace-age', age.toString());
        }

        // Fetch all observations in parallel using FHIRDataService
        const [hrResult, bpResult, creatResult] = await Promise.all([
            fhirDataService
                .getObservation(LOINC_CODES.HEART_RATE, {
                    trackStaleness: true,
                    stalenessLabel: 'Heart Rate'
                })
                .catch(() => ({ value: null })),
            fhirDataService
                .getBloodPressure({ trackStaleness: true })
                .catch(() => ({ systolic: null })),
            fhirDataService
                .getObservation(LOINC_CODES.CREATININE, {
                    trackStaleness: true,
                    stalenessLabel: 'Creatinine',
                    targetUnit: 'mg/dL',
                    unitType: 'creatinine'
                })
                .catch(() => ({ value: null }))
        ]);

        if (hrResult.value !== null) {
            setValue('grace-hr', Math.round(hrResult.value).toString());
        }

        if (bpResult.systolic !== null) {
            setValue('grace-sbp', Math.round(bpResult.systolic).toString());
        }

        if (creatResult.value !== null) {
            setValue('grace-creatinine', creatResult.value.toFixed(2));
        }

        // Calculate after data population
        setTimeout(calculate, 100);
    }
};

export const graceAcs = createMixedInputCalculator(config);
