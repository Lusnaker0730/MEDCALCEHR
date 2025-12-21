import { getMostRecentObservation, calculateAge } from '../../utils.js';
import { createStalenessTracker } from '../../data-staleness.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';

interface CalculatorModule {
    id: string;
    title: string;
    description: string;
    generateHTML: () => string;
    initialize: (client: any, patient: any, container: HTMLElement) => void;
}

interface SectionOption {
    value: string;
    label: string;
    checked?: boolean;
}

interface SectionConfig {
    id: string;
    title: string;
    icon: string;
    options: SectionOption[];
    help?: string;
}

export const fourCMortalityCovid: CalculatorModule = {
    id: '4c-mortality-covid',
    title: '4C Mortality Score for COVID-19',
    description: 'Predicts in-hospital mortality in patients admitted with COVID-19.',

    generateHTML: function () {
        const sections: SectionConfig[] = [
            {
                id: 'age',
                title: 'Age (years)',
                icon: '👴',
                options: [
                    { value: '0', label: '<50', checked: true },
                    { value: '2', label: '50-59 (+2)' },
                    { value: '4', label: '60-69 (+4)' },
                    { value: '6', label: '70-79 (+6)' },
                    { value: '7', label: '≥80 (+7)' }
                ]
            },
            {
                id: 'sex',
                title: 'Sex at Birth',
                icon: '⚧',
                options: [
                    { value: '0', label: 'Female', checked: true },
                    { value: '1', label: 'Male (+1)' }
                ]
            },
            {
                id: 'comorbidities',
                title: 'Number of Comorbidities',
                icon: '🏥',
                help: 'Includes chronic cardiac/respiratory/renal/liver/neurological disease, dementia, malignancy, obesity, etc.',
                options: [
                    { value: '0', label: '0', checked: true },
                    { value: '1', label: '1 (+1)' },
                    { value: '2', label: '≥2 (+2)' }
                ]
            },
            {
                id: 'resp_rate',
                title: 'Respiratory Rate (breaths/min)',
                icon: '🫁',
                options: [
                    { value: '0', label: '<20', checked: true },
                    { value: '1', label: '20-29 (+1)' },
                    { value: '2', label: '≥30 (+2)' }
                ]
            },
            {
                id: 'oxygen_sat',
                title: 'Peripheral Oxygen Saturation (Room Air)',
                icon: '📉',
                options: [
                    { value: '0', label: '≥92%', checked: true },
                    { value: '2', label: '<92% (+2)' }
                ]
            },
            {
                id: 'gcs',
                title: 'Glasgow Coma Scale',
                icon: '🧠',
                options: [
                    { value: '0', label: '15', checked: true },
                    { value: '2', label: '<15 (+2)' }
                ]
            },
            {
                id: 'urea',
                title: 'Urea or BUN',
                icon: '🧪',
                options: [
                    { value: '0', label: 'Urea <7 mmol/L or BUN <19.6 mg/dL', checked: true },
                    { value: '1', label: 'Urea 7-14 mmol/L or BUN 19.6-39.2 mg/dL (+1)' },
                    { value: '3', label: 'Urea >14 mmol/L or BUN >39.2 mg/dL (+3)' }
                ]
            },
            {
                id: 'crp',
                title: 'C-Reactive Protein (mg/L)',
                icon: '🔥',
                options: [
                    { value: '0', label: '<50', checked: true },
                    { value: '1', label: '50-99 (+1)' },
                    { value: '2', label: '≥100 (+2)' }
                ]
            }
        ];

        const sectionsHTML = sections.map(section =>
            uiBuilder.createSection({
                title: section.title,
                icon: section.icon,
                content: uiBuilder.createRadioGroup({
                    name: `4c-${section.id}`,
                    options: section.options,
                    helpText: section.help
                })
            })
        ).join('');

        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            ${uiBuilder.createAlert({
            type: 'info',
            message: 'Use with admitted patients diagnosed with COVID-19.'
        })}
            
            ${sectionsHTML}
            
            <div id="four-c-error-container"></div>
            ${uiBuilder.createResultBox({ id: 'four-c-result', title: '4C Mortality Score Results' })}
            
            
            ${uiBuilder.createFormulaSection({
            items: [
                {
                    title: 'Scoring Criteria',
                    formulas: [
                        'Age: <50 (0) | 50-59 (+2) | 60-69 (+4) | 70-79 (+6) | ≥80 (+7)',
                        'Sex: Female (0) | Male (+1)',
                        'Comorbidities: 0 (0) | 1 (+1) | ≥2 (+2)',
                        'Respiratory Rate: <20 (0) | 20-29 (+1) | ≥30 (+2)',
                        'O₂ Saturation: ≥92% (0) | <92% (+2)',
                        'Glasgow Coma Scale: 15 (0) | <15 (+2)',
                        'Urea/BUN: <7 mmol/L or <19.6 mg/dL (0) | 7-14 mmol/L or 19.6-39.2 mg/dL (+1) | >14 mmol/L or >39.2 mg/dL (+3)',
                        'C-Reactive Protein: <50 mg/L (0) | 50-99 mg/L (+1) | ≥100 mg/L (+2)'
                    ]
                },
                {
                    title: 'In-Hospital Mortality Risk Stratification',
                    content: `
                            <div style="overflow-x: auto;">
                                <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                                    <thead>
                                        <tr style="background: rgba(102, 126, 234, 0.1);">
                                            <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Score</th>
                                            <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Risk Group</th>
                                            <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Mortality Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr style="background: rgba(40, 167, 69, 0.1);">
                                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">0-3</td>
                                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">Low</td>
                                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">1.2%</td>
                                        </tr>
                                        <tr style="background: rgba(255, 193, 7, 0.1);">
                                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">4-8</td>
                                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">Intermediate</td>
                                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">9.9%</td>
                                        </tr>
                                        <tr style="background: rgba(255, 152, 0, 0.1);">
                                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">9-14</td>
                                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">High</td>
                                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">31.4%</td>
                                        </tr>
                                        <tr style="background: rgba(220, 53, 69, 0.1);">
                                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">≥15</td>
                                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">Very High</td>
                                            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">61.5%</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        `
                },
                {
                    label: 'Note',
                    content: 'Comorbidities include: chronic cardiac disease, chronic respiratory disease, chronic renal disease, chronic liver disease, chronic neurological disease, dementia, malignancy, obesity (BMI >30), diabetes mellitus, and immunosuppression.'
                }
            ]
        })}
        `;
    },

    initialize: function (client: any, patient: any, container: HTMLElement) {
        uiBuilder.initializeComponents(container);

        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);

        const setRadioValue = (name: string, value: string) => {
            const radio = container.querySelector(`input[name="${name}"][value="${value}"]`) as HTMLInputElement | null;
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change'));
            }
        };

        const calculate = () => {
            try {
                // Clear validation errors
                const errorContainer = container.querySelector('#four-c-error-container');
                if (errorContainer) errorContainer.innerHTML = '';

                let score = 0;
                const groups = [
                    '4c-age', '4c-sex', '4c-comorbidities', '4c-resp_rate',
                    '4c-oxygen_sat', '4c-gcs', '4c-urea', '4c-crp'
                ];

                groups.forEach(group => {
                    const checked = container.querySelector(`input[name="${group}"]:checked`) as HTMLInputElement | null;
                    if (checked) {
                        score += parseInt(checked.value);
                    }
                });

                let riskGroup = '';
                let mortality = '';
                let alertClass = '';

                if (score <= 3) {
                    riskGroup = 'Low Risk';
                    mortality = '1.2%';
                    alertClass = 'ui-alert-success';
                } else if (score <= 8) {
                    riskGroup = 'Intermediate Risk';
                    mortality = '9.9%';
                    alertClass = 'ui-alert-warning';
                } else if (score <= 14) {
                    riskGroup = 'High Risk';
                    mortality = '31.4%';
                    alertClass = 'ui-alert-danger';
                } else {
                    riskGroup = 'Very High Risk';
                    mortality = '61.5%';
                    alertClass = 'ui-alert-danger';
                }

                const resultBox = container.querySelector('#four-c-result');
                if (resultBox) {
                    const resultContent = resultBox.querySelector('.ui-result-content');
                    if (resultContent) {
                        resultContent.innerHTML = `
                        ${uiBuilder.createResultItem({
                            label: 'Total 4C Score',
                            value: score.toString(),
                            unit: 'points',
                            interpretation: riskGroup,
                            alertClass: alertClass
                        })}
                        ${uiBuilder.createResultItem({
                            label: 'Estimated In-Hospital Mortality',
                            value: mortality,
                            unit: '',
                            alertClass: alertClass
                        })}
                    `;
                    }
                    resultBox.classList.add('show');
                }
            } catch (error) {
                const errorContainer = container.querySelector('#four-c-error-container');
                if (errorContainer) {
                    displayError(errorContainer as HTMLElement, error as Error);
                } else {
                    console.error(error);
                }
                logError(error as Error, { calculator: '4c-mortality-covid', action: 'calculate' });
            }
        };

        // Add event listeners
        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', calculate);
        });

        // Auto-populate
        if (client) {
            if (patient) {
                if (patient.birthDate) {
                    const age = calculateAge(patient.birthDate);
                    if (age < 50) setRadioValue('4c-age', '0');
                    else if (age <= 59) setRadioValue('4c-age', '2');
                    else if (age <= 69) setRadioValue('4c-age', '4');
                    else if (age <= 79) setRadioValue('4c-age', '6');
                    else setRadioValue('4c-age', '7');
                }
                if (patient.gender === 'male') setRadioValue('4c-sex', '1');
                else if (patient.gender === 'female') setRadioValue('4c-sex', '0');
            }

            // Respiratory Rate
            getMostRecentObservation(client, LOINC_CODES.RESPIRATORY_RATE).then(obs => {
                if (obs && obs.valueQuantity && obs.valueQuantity.value !== undefined) {
                    const val = obs.valueQuantity.value;
                    // Unit assumption: breaths/min is standard.
                    if (val < 20) setRadioValue('4c-resp_rate', '0');
                    else if (val < 30) setRadioValue('4c-resp_rate', '1');
                    else setRadioValue('4c-resp_rate', '2');
                    stalenessTracker.trackObservation('input[name="4c-resp_rate"]', obs, LOINC_CODES.RESPIRATORY_RATE, 'Respiratory Rate');
                }
            }).catch(console.warn);

            // Oxygen Saturation
            getMostRecentObservation(client, LOINC_CODES.OXYGEN_SATURATION).then(obs => {
                if (obs && obs.valueQuantity && obs.valueQuantity.value !== undefined) {
                    const val = obs.valueQuantity.value;
                    // Standard is %
                    if (val >= 92) setRadioValue('4c-oxygen_sat', '0');
                    else setRadioValue('4c-oxygen_sat', '2');
                    stalenessTracker.trackObservation('input[name="4c-oxygen_sat"]', obs, LOINC_CODES.OXYGEN_SATURATION, 'O2 Saturation');
                }
            }).catch(console.warn);

            // GCS
            const gcsSearch = [LOINC_CODES.GCS].flat(); // Assuming GCS can be list
            // Or just use the one code if defined as string.
            getMostRecentObservation(client, LOINC_CODES.GCS).then(obs => {
                if (obs && obs.valueQuantity && obs.valueQuantity.value !== undefined) {
                    const val = obs.valueQuantity.value;
                    if (val === 15) setRadioValue('4c-gcs', '0');
                    else setRadioValue('4c-gcs', '2');
                    stalenessTracker.trackObservation('input[name="4c-gcs"]', obs, LOINC_CODES.GCS, 'GCS');
                }
            }).catch(console.warn);

            // Urea (BUN)
            getMostRecentObservation(client, LOINC_CODES.BUN).then(obs => {
                if (obs && obs.valueQuantity && obs.valueQuantity.value !== undefined) {
                    let val = obs.valueQuantity.value;
                    const unit = obs.valueQuantity.unit;

                    // Normalizing to mg/dL for decision or using range checks
                    // Thresholds: Urea 7 mmol/L (approx 19.6 mg/dL assuming BUN approx Urea/2.14? No, BUN is Nitrogen. Urea MW=60, N=14*2=28. Factor 2.14. 
                    // Urea(mmol/L) = BUN(mg/dL) * 0.357 ?? No.
                    // Standard conv: BUN (mg/dL) = Urea (mmol/L) * 2.8.
                    // Check text: Urea < 7 mmol/L OR BUN < 19.6 mg/dL.
                    // 7 * 2.8 = 19.6. Correct.

                    // Convert everything to mg/dL (BUN)
                    // If unit is mmol/L, it might be Urea or BUN in mmol/L. 
                    // LOINC_CODES.BUN usually refers to Blood Urea Nitrogen.

                    if (unit && (unit.includes('mmol') || unit.toLowerCase() === 'mmol/l')) {
                        // If it's effectively Urea in mmol/L or BUN in mmol/L? 
                        // If LOINC says 3094-0 (BUN), and unit is mmol/L, it's BUN in mmol/L.
                        // BUN (mmol/L) to mg/dL => * 2.8.
                        // If it is Urea (mmol/L), the value is the same number for the threshold logic (7).
                        // Let's assume input matches the threshold type if unit matches.

                        // Let's normalize to BUN mg/dL for consistent logic
                        // If mmol/L, assume it's BUN in mmol/L which is same molarity as Urea in mmol/L? 
                        // Actually BUN is Nitrogen content. Urea is molecule.
                        // 1 mmol Urea = 1 mmol BUN (N2). 
                        // So 7 mmol/L Urea = 7 mmol/L BUN.
                        // 7 mmol/L * 2.801 = 19.6 mg/dL.
                        // So if we have mmol/L, we multiply by 2.801 to get mg/dL.
                        val = val * 2.801;
                    }
                    // else assume mg/dL

                    if (val < 19.6) setRadioValue('4c-urea', '0');
                    else if (val <= 39.2) setRadioValue('4c-urea', '1');
                    else setRadioValue('4c-urea', '3');
                    stalenessTracker.trackObservation('input[name="4c-urea"]', obs, LOINC_CODES.BUN, 'Urea/BUN');
                }
            }).catch(console.warn);

            // CRP
            getMostRecentObservation(client, LOINC_CODES.CRP).then(obs => {
                if (obs && obs.valueQuantity && obs.valueQuantity.value !== undefined) {
                    const val = obs.valueQuantity.value;
                    if (val < 50) setRadioValue('4c-crp', '0');
                    else if (val < 100) setRadioValue('4c-crp', '1');
                    else setRadioValue('4c-crp', '2');
                    stalenessTracker.trackObservation('input[name="4c-crp"]', obs, LOINC_CODES.CRP, 'CRP');
                }
            }).catch(console.warn);
        }

        calculate();
    }
};
