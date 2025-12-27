/**
 * SEX-SHOCK Risk Score for Cardiogenic Shock
 *
 * 使用 Mixed Input Calculator 工廠函數
 * 計算急性冠心症患者院內心源性休克風險
 */

import { createMixedInputCalculator } from '../shared/mixed-input-calculator.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { fhirDataService } from '../../fhir-data-service.js';

interface SexShockCoeffs {
    intercept: number;
    crp: number;
    creatinine: number;
    st: number;
    lvef35to50: number;
    lvefLess50: number;
    age: number;
    arrest: number;
    killip: number;
    hr: number;
    bp: number;
    glycemia: number;
    leftMain: number;
    timi: number;
}

const FEMALE_COEFFS: SexShockCoeffs = {
    intercept: -7.0804,
    crp: 0.0915,
    creatinine: 0.6092,
    st: 0.0328,
    lvef35to50: -1.0953,
    lvefLess50: -1.9474,
    age: 0.1825,
    arrest: 1.2567,
    killip: 1.0503,
    hr: 0.2408,
    bp: 0.8192,
    glycemia: 0.4019,
    leftMain: 0.6397,
    timi: 0.7198
};

const MALE_COEFFS: SexShockCoeffs = {
    intercept: -7.9666,
    crp: 0.0696,
    creatinine: 0.604,
    st: 0.768,
    lvef35to50: -1.2722,
    lvefLess50: -2.0153,
    age: 0.2635,
    arrest: 1.1459,
    killip: 0.6849,
    hr: 0.5386,
    bp: 0.7062,
    glycemia: 0.8375,
    leftMain: 0.9036,
    timi: 0.4966
};

export const sexShock = createMixedInputCalculator({
    id: 'sex-shock',
    title: 'SEX-SHOCK Risk Score for Cardiogenic Shock',
    description: 'Calculates the risk of in-hospital cardiogenic shock in patients with acute coronary syndrome (ACS).',

    infoAlert: '<strong>Validation Notice:</strong> Use caution in patients who have not undergone PCI.',

    sections: [
        {
            title: 'Patient Characteristics',
            icon: '👤',
            inputs: [
                {
                    type: 'radio',
                    name: 'sex-shock-age',
                    label: 'Age > 70 years',
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: '1', label: 'Yes' }
                    ]
                },
                {
                    type: 'radio',
                    name: 'sex-shock-sex',
                    label: 'Sex',
                    options: [
                        { value: '0', label: 'Male', checked: true },
                        { value: '1', label: 'Female' }
                    ]
                }
            ]
        },
        {
            title: 'Clinical Presentation',
            icon: '🏥',
            inputs: [
                {
                    type: 'radio',
                    name: 'sex-shock-arrest',
                    label: 'Cardiac Arrest at Presentation',
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: '1', label: 'Yes' }
                    ]
                },
                {
                    type: 'radio',
                    name: 'sex-shock-killip',
                    label: 'Killip Class III (Acute Pulmonary Edema)',
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: '1', label: 'Yes' }
                    ]
                },
                {
                    type: 'radio',
                    name: 'sex-shock-hr',
                    label: 'Heart Rate > 90 bpm',
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: '1', label: 'Yes' }
                    ]
                },
                {
                    type: 'radio',
                    name: 'sex-shock-bp',
                    label: 'Low BP (SBP < 125) & Pulse Pressure < 45 mmHg',
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: '1', label: 'Yes' }
                    ]
                }
            ]
        },
        {
            title: 'Angiographic & ECG Findings',
            icon: '💓',
            inputs: [
                {
                    type: 'radio',
                    name: 'sex-shock-pci',
                    label: 'PCI Not Performed',
                    options: [
                        { value: '0', label: 'PCI Done', checked: true },
                        { value: '1', label: 'No PCI' }
                    ]
                },
                {
                    type: 'radio',
                    name: 'sex-shock-timi',
                    label: 'Post-PCI TIMI Flow < 3',
                    options: [
                        { value: '0', label: 'No (TIMI 3)', checked: true },
                        { value: '1', label: 'Yes (< 3)' }
                    ]
                },
                {
                    type: 'radio',
                    name: 'sex-shock-left-main',
                    label: 'Left Main Culprit Lesion',
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: '1', label: 'Yes' }
                    ]
                },
                {
                    type: 'radio',
                    name: 'sex-shock-st',
                    label: 'ST-Elevation on ECG',
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: '1', label: 'Yes' }
                    ]
                },
                {
                    type: 'radio',
                    name: 'sex-shock-lvef',
                    label: 'Left Ventricular EF',
                    options: [
                        { value: '55', label: '> 50%' },
                        { value: '42.5', label: '35-50%' },
                        { value: '30', label: '< 35%', checked: true }
                    ]
                }
            ]
        },
        {
            title: 'Laboratory Values',
            icon: '🧪',
            inputs: [
                {
                    type: 'radio',
                    name: 'sex-shock-glycemia',
                    label: 'Glucose > 10 mmol/L (> 180 mg/dL)',
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: '1', label: 'Yes' }
                    ]
                },
                {
                    type: 'number',
                    id: 'sex-shock-creatinine',
                    label: 'Creatinine',
                    unit: 'mg/dL',
                    step: 0.1,
                    min: 0,
                    placeholder: 'e.g. 1.2'
                },
                {
                    type: 'number',
                    id: 'sex-shock-crp',
                    label: 'C-Reactive Protein',
                    unit: 'mg/L',
                    step: 0.1,
                    min: 0,
                    placeholder: 'e.g. 5.0'
                }
            ]
        }
    ],

    riskLevels: [
        { minScore: 0, maxScore: 5, label: 'Low Risk', severity: 'success' },
        { minScore: 5, maxScore: 15, label: 'Moderate Risk', severity: 'warning' },
        { minScore: 15, maxScore: 30, label: 'High Risk', severity: 'danger' },
        { minScore: 30, maxScore: 100, label: 'Very High Risk', severity: 'danger' }
    ],

    formulaSection: {
        show: true,
        title: 'Risk Model',
        type: 'list',
        calculationNote: 'Logistic regression model with sex-specific coefficients',
        footnotes: [
            'Uses separate coefficients for male and female patients',
            'Risk = 1 / (1 + exp(-Y)) where Y is the linear predictor'
        ]
    },

    // Custom calculation returns risk percentage (not score)
    calculate: (values) => {
        const getVal = (name: string): number => parseInt(values[name] as string || '0', 10);
        const getFloat = (name: string): number => parseFloat(values[name] as string || '0');

        const sex = getVal('sex-shock-sex');
        const isFemale = sex === 1;
        const coeffs = isFemale ? FEMALE_COEFFS : MALE_COEFFS;

        const age70 = getVal('sex-shock-age');
        const arrest = getVal('sex-shock-arrest');
        const killip = getVal('sex-shock-killip');
        const hr = getVal('sex-shock-hr');
        const bp = getVal('sex-shock-bp');
        const timi = getVal('sex-shock-timi');
        const leftMain = getVal('sex-shock-left-main');
        const st = getVal('sex-shock-st');
        const lvef = getFloat('sex-shock-lvef');
        const glycemia = getVal('sex-shock-glycemia');
        const creatinine = getFloat('sex-shock-creatinine');
        const crp = getFloat('sex-shock-crp');

        let Y = coeffs.intercept;

        if (crp > 0) {
            Y += coeffs.crp * Math.log2(crp + 1);
        }
        if (creatinine > 0) {
            Y += coeffs.creatinine * Math.log2(creatinine * 88.4); // Convert mg/dL to umol/L
        }

        Y += coeffs.st * st;

        // LVEF adjustment
        if (lvef === 55) {
            Y += coeffs.lvefLess50; // >50% (protective)
        } else if (lvef === 42.5) {
            Y += coeffs.lvef35to50; // 35-50%
        }
        // lvef === 30 (<35%) is baseline, no adjustment

        Y += coeffs.age * age70;
        Y += coeffs.arrest * arrest;
        Y += coeffs.killip * killip;
        Y += coeffs.hr * hr;
        Y += coeffs.bp * bp;
        Y += coeffs.glycemia * glycemia;
        Y += coeffs.leftMain * leftMain;
        Y += coeffs.timi * timi;

        const risk = (1 / (1 + Math.exp(-Y))) * 100;
        return Math.round(risk * 10) / 10; // Round to 1 decimal
    },

    customResultRenderer: (score: number) => {
        let riskLevel = '';
        let alertType: 'success' | 'warning' | 'danger' = 'success';

        if (score < 5) {
            riskLevel = 'Low Risk';
            alertType = 'success';
        } else if (score < 15) {
            riskLevel = 'Moderate Risk';
            alertType = 'warning';
        } else if (score < 30) {
            riskLevel = 'High Risk';
            alertType = 'danger';
        } else {
            riskLevel = 'Very High Risk';
            alertType = 'danger';
        }

        return `
            ${uiBuilder.createResultItem({
                label: 'In-Hospital Cardiogenic Shock Risk',
                value: score.toFixed(1),
                unit: '%',
                interpretation: riskLevel,
                alertClass: `ui-alert-${alertType}`
            })}
        `;
    },

    customInitialize: async (client, patient, container, calculate, setValue) => {
        fhirDataService.initialize(client, patient, container);

        // Helper to set radio
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
        if (age !== null && age > 70) {
            setRadioValue('sex-shock-age', '1');
        }

        // Auto-populate gender
        const gender = fhirDataService.getPatientGender();
        if (gender === 'female') {
            setRadioValue('sex-shock-sex', '1');
        }

        if (!client) return;

        try {
            // Heart Rate
            const hrResult = await fhirDataService.getObservation(LOINC_CODES.HEART_RATE, {
                trackStaleness: true,
                stalenessLabel: 'Heart Rate'
            });
            if (hrResult.value !== null && hrResult.value > 90) {
                setRadioValue('sex-shock-hr', '1');
            }

            // Creatinine
            const creatResult = await fhirDataService.getObservation(LOINC_CODES.CREATININE, {
                trackStaleness: true,
                stalenessLabel: 'Creatinine',
                targetUnit: 'mg/dL',
                unitType: 'creatinine'
            });
            if (creatResult.value !== null) {
                setValue('sex-shock-creatinine', creatResult.value.toFixed(1));
            }

            // CRP
            const crpResult = await fhirDataService.getObservation(LOINC_CODES.CRP, {
                trackStaleness: true,
                stalenessLabel: 'CRP'
            });
            if (crpResult.value !== null) {
                setValue('sex-shock-crp', crpResult.value.toFixed(1));
            }

            calculate();
        } catch (e) {
            console.warn('FHIR data fetch failed:', e);
        }
    }
});
