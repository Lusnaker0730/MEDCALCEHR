import {
    createMixedInputCalculator,
    MixedInputCalculatorConfig
} from '../shared/mixed-input-calculator.js';
import { fhirDataService } from '../../fhir-data-service.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';

const config: MixedInputCalculatorConfig = {
    id: 'child-pugh',
    title: 'Child-Pugh Score for Cirrhosis Mortality',
    description: 'Estimates cirrhosis severity and prognosis.',
    infoAlert: `
        <strong>About Child-Pugh Score:</strong> Assesses the prognosis of chronic liver disease, mainly cirrhosis. Uses five clinical measures to classify patients into three categories (A, B, C) with different survival rates and surgical risks.
    `,
    sections: [
        {
            title: 'Laboratory Parameters',
            icon: '🔬',
            inputs: [
                {
                    type: 'radio',
                    name: 'bilirubin',
                    label: 'Bilirubin (Total)',
                    options: [
                        { value: '1', label: '< 2 mg/dL (< 34.2 μmol/L) (+1)' },
                        { value: '2', label: '2-3 mg/dL (34.2-51.3 μmol/L) (+2)' },
                        { value: '3', label: '> 3 mg/dL (> 51.3 μmol/L) (+3)' }
                    ]
                },
                {
                    type: 'radio',
                    name: 'albumin',
                    label: 'Albumin',
                    options: [
                        { value: '1', label: '> 3.5 g/dL (> 35 g/L) (+1)' },
                        { value: '2', label: '2.8-3.5 g/dL (28-35 g/L) (+2)' },
                        { value: '3', label: '< 2.8 g/dL (< 28 g/L) (+3)' }
                    ]
                },
                {
                    type: 'radio',
                    name: 'inr',
                    label: 'INR',
                    options: [
                        { value: '1', label: '< 1.7 (+1)' },
                        { value: '2', label: '1.7-2.3 (+2)' },
                        { value: '3', label: '> 2.3 (+3)' }
                    ]
                }
            ]
        },
        {
            title: 'Clinical Parameters',
            icon: '🩺',
            inputs: [
                {
                    type: 'radio',
                    name: 'ascites',
                    label: 'Ascites',
                    options: [
                        { value: '1', label: 'Absent (+1)' },
                        { value: '2', label: 'Slight (controlled with diuretics) (+2)' },
                        { value: '3', label: 'Moderate (despite diuretic therapy) (+3)' }
                    ],
                    helpText: 'Fluid accumulation in peritoneal cavity'
                },
                {
                    type: 'radio',
                    name: 'encephalopathy',
                    label: 'Hepatic Encephalopathy',
                    options: [
                        { value: '1', label: 'No Encephalopathy (+1)' },
                        { value: '2', label: 'Grade 1-2 (mild confusion, asterixis) (+2)' },
                        { value: '3', label: 'Grade 3-4 (severe confusion, coma) (+3)' }
                    ],
                    helpText: 'Neuropsychiatric abnormalities'
                }
            ]
        }
    ],
    formulas: [
        {
            title: 'Scoring',
            content: `
                <p class="calculation-note mb-15">Addition of the selected points:</p>
                ${uiBuilder.createTable({
                    headers: ['Classification', 'Points'],
                    rows: [
                        ['Child Class A', '5-6 points'],
                        ['Child Class B', '7-9 points'],
                        ['Child Class C', '10-15 points']
                    ]
                })}
            `
        }
    ],
    calculate: values => {
        const bilirubin = parseInt(values['bilirubin'] as string);
        const albumin = parseInt(values['albumin'] as string);
        const inr = parseInt(values['inr'] as string);
        const ascites = parseInt(values['ascites'] as string);
        const encephalopathy = parseInt(values['encephalopathy'] as string);

        if (
            isNaN(bilirubin) ||
            isNaN(albumin) ||
            isNaN(inr) ||
            isNaN(ascites) ||
            isNaN(encephalopathy)
        ) {
            return null;
        }

        return bilirubin + albumin + inr + ascites + encephalopathy;
    },
    customResultRenderer: (score, values) => {
        let classification = '';
        let prognosis = '';
        let alertClass = 'ui-alert-info';

        if (score <= 6) {
            classification = 'Child Class A';
            prognosis =
                'Well-compensated disease - Good prognosis<br>Life Expectancy: 15-20 years<br>Surgical Mortality: 10%';
            alertClass = 'ui-alert-success';
        } else if (score <= 9) {
            classification = 'Child Class B';
            prognosis =
                'Significant functional compromise - Moderate prognosis<br>Life Expectancy: 4-14 years<br>Surgical Mortality: 30%';
            alertClass = 'ui-alert-warning';
        } else {
            classification = 'Child Class C';
            prognosis =
                'Decompensated disease - Poor prognosis<br>Life Expectancy: 1-3 years<br>Surgical Mortality: 82%';
            alertClass = 'ui-alert-danger';
        }

        return `
            ${uiBuilder.createResultItem({
                label: 'Total Points',
                value: score.toString(),
                unit: 'points'
            })}
            ${uiBuilder.createResultItem({
                label: 'Classification',
                value: classification,
                interpretation: prognosis,
                alertClass: alertClass
            })}
        `;
    },
    customInitialize: (client, patient, container) => {
        // RangeCondition interface for helper
        interface RangeCondition {
            condition: (v: number) => boolean;
            value: string;
        }

        const setRadioFromValue = (groupName: string, value: number, ranges: RangeCondition[]) => {
            if (value === null || value === undefined) return;

            const radioToSelect = ranges.find(range => range.condition(value));
            if (radioToSelect) {
                const radio = container.querySelector(
                    `input[name="${groupName}"][value="${radioToSelect.value}"]`
                ) as HTMLInputElement;
                if (radio) {
                    radio.checked = true;
                    radio.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        };

        if (client) {
            // Bilirubin
            fhirDataService
                .getObservation(LOINC_CODES.BILIRUBIN_TOTAL, {
                    trackStaleness: true,
                    stalenessLabel: 'Bilirubin'
                })
                .then(result => {
                    if (result.value !== null) {
                        setRadioFromValue('bilirubin', result.value, [
                            { condition: v => v < 2, value: '1' },
                            { condition: v => v >= 2 && v <= 3, value: '2' },
                            { condition: v => v > 3, value: '3' }
                        ]);
                    }
                })
                .catch(console.warn);

            // Albumin
            fhirDataService
                .getObservation(LOINC_CODES.ALBUMIN, {
                    trackStaleness: true,
                    stalenessLabel: 'Albumin'
                })
                .then(result => {
                    if (result.value !== null) {
                        let valueGdL = result.value;
                        const unit = result.unit || 'g/dL';
                        if (
                            unit.toLowerCase().includes('l') &&
                            !unit.toLowerCase().includes('dl')
                        ) {
                            valueGdL = valueGdL / 10;
                        }

                        setRadioFromValue('albumin', valueGdL, [
                            { condition: v => v > 3.5, value: '1' },
                            { condition: v => v >= 2.8 && v <= 3.5, value: '2' },
                            { condition: v => v < 2.8, value: '3' }
                        ]);
                    }
                })
                .catch(console.warn);

            // INR
            fhirDataService
                .getObservation(LOINC_CODES.INR_COAG, {
                    trackStaleness: true,
                    stalenessLabel: 'INR'
                })
                .then(result => {
                    if (result.value !== null) {
                        setRadioFromValue('inr', result.value, [
                            { condition: v => v < 1.7, value: '1' },
                            { condition: v => v >= 1.7 && v <= 2.3, value: '2' },
                            { condition: v => v > 2.3, value: '3' }
                        ]);
                    }
                })
                .catch(console.warn);
        }
    }
};

export const childPugh = createMixedInputCalculator(config);
