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

const baseCalculator = createMixedInputCalculator({
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

// 導出帶有公式表格的計算器
export const sexShock = {
    ...baseCalculator,

    generateHTML(): string {
        const html = baseCalculator.generateHTML();

        // Formula Section
        const formulaSection = `
            ${uiBuilder.createSection({
                title: 'FORMULA',
                icon: '📐',
                content: `
                    <p class="mb-15">Equations are as follows (sex-stratified α coefficients are listed in the table below):</p>
                    
                    <p><strong>SEX-SHOCK Score:</strong></p>
                    <div class="formula-code">
                        Y = (Intercept) + α × log₂(CRP, mg/L + 1) + α × log₂(Creatinine, μmol/L) + α × ST-Segment elevation + α × LVEF 35%-50% + α × LVEF <50% + α × Age >70 years + α × Presentation as cardiac arrest + α × Killip class III + α × Heart rate >90/min + α × SBP <125 and PP <45 mmHg + α × Glycemia >10 mmol/L + α × Culprit lesion of the left main* + α × Post-PCI TIMI flow <3*
                    </div>
                    
                    <p class="mt-15"><strong>SEX-SHOCK<sub>light</sub> Score:</strong></p>
                    <div class="formula-code">
                        Y = (Intercept) + α × log₂(CRP, mg/L + 1) + α × log₂(Creatinine, μmol/L) + α × ST-Segment elevation + α × LVEF 35%-50% + α × LVEF <50% + α × Age >70 years + α × Presentation as cardiac arrest + α × Killip class III + α × Heart rate >90/min + α × SBP <125 and PP <45 mmHg + α × Glycemia >10 mmol/L
                    </div>
                    
                    <p class="mt-15"><strong>Risk, % = <span class="formula-fraction"><span class="numerator">1</span><span class="denominator">1 + e<sup>−Y</sup></span></span> × 100</strong></p>
                `
            })}
        `;

        // Coefficients Table
        const coefficientsTable = `
            ${uiBuilder.createSection({
                title: 'Model Coefficients',
                icon: '📊',
                content: `
                    ${uiBuilder.createTable({
                        headers: ['Models', 'SEX-SHOCK', '', 'SEX-SHOCK<sub>light</sub>', ''],
                        rows: [
                            ['<strong>Coefficients</strong>', '<strong>Females</strong>', '<strong>Males</strong>', '<strong>Females</strong>', '<strong>Males</strong>'],
                            ['(Intercept)', '-7.0804', '-7.9666', '-7.1019', '-8.0009'],
                            ['CRP (mg/L)*', '0.0915', '0.0696', '0.0946', '0.0774'],
                            ['Creatinine (μmol/L)*', '0.6092', '0.6040', '0.6274', '0.6276'],
                            ['ST-segment elevation', '0.0328', '0.768', '0.0172', '0.7445'],
                            ['LVEF 35%-50%*', '-1.0953', '-1.2722', '-1.1636', '-1.2994'],
                            ['LVEF <50%*', '-1.9474', '-2.0153', '-2.0078', '-2.0677'],
                            ['Age >70 years', '0.1825', '0.2635', '0.2758', '0.2939'],
                            ['Presentation as cardiac arrest', '1.2567', '1.1459', '1.2132', '1.1394'],
                            ['Killip class III*', '1.0503', '0.6849', '1.1277', '0.7185'],
                            ['Heart rate >90/min', '0.2408', '0.5386', '0.2610', '0.5346'],
                            ['SBP <125 and PP <45 mmHg', '0.8192', '0.7062', '0.8429', '0.7071'],
                            ['Glycemia >10 mmol/L', '0.4019', '0.8375', '0.4223', '0.8176'],
                            ['Culprit lesion of the left main**', '0.6397', '0.9036', 'NA', 'NA'],
                            ['Post-PCI TIMI flow <3**', '0.7198', '0.4966', 'NA', 'NA']
                        ],
                        stickyFirstColumn: true
                    })}
                    <p class="table-note text-sm text-muted mt-10">
                        *p=1, No=0<br>
                        **Only required for SEX-SHOCK (full model). SEX-SHOCK<sub>light</sub> relies on non-PCI related variables only.<br>
                        *Note that CRP and creatinine are log₂-transformed (CRP − log₂(original value + 1); creatinine − log₂(original value)) in the SEX-SHOCK models.
                    </p>
                `
            })}
        `;

        return html + formulaSection + coefficientsTable;
    }
};
