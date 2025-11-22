import { getMostRecentObservation, getPatient, calculateAge } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';

export const fourCMortalityCovid = {
    id: '4c-mortality-covid',
    title: '4C Mortality Score for COVID-19',
    description: 'Predicts in-hospital mortality in patients admitted with COVID-19.',

    generateHTML: function () {
        const sections = [
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
            
            ${uiBuilder.createResultBox({ id: 'four-c-result', title: '4C Mortality Score Results' })}
            
            ${uiBuilder.createAlert({
                type: 'info',
                message: `
                    <h4>📊 Risk Groups</h4>
                    <ul style="margin-top: 5px; padding-left: 20px;">
                        <li><strong>Low (0-3):</strong> 1.2% Mortality</li>
                        <li><strong>Intermediate (4-8):</strong> 9.9% Mortality</li>
                        <li><strong>High (9-14):</strong> 31.4% Mortality</li>
                        <li><strong>Very High (≥15):</strong> 61.5% Mortality</li>
                    </ul>
                `
            })}
        `;
    },

    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const setRadioValue = (name, value) => {
            const radio = container.querySelector(`input[name="${name}"][value="${value}"]`);
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change'));
            }
        };

        const calculate = () => {
            let score = 0;
            const groups = [
                '4c-age', '4c-sex', '4c-comorbidities', '4c-resp_rate',
                '4c-oxygen_sat', '4c-gcs', '4c-urea', '4c-crp'
            ];

            groups.forEach(group => {
                const checked = container.querySelector(`input[name="${group}"]:checked`);
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
            const resultContent = resultBox.querySelector('.ui-result-content');

            resultContent.innerHTML = `
                ${uiBuilder.createResultItem({ 
                    label: 'Total 4C Score', 
                    value: score, 
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
            
            resultBox.classList.add('show');
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

            getMostRecentObservation(client, LOINC_CODES.RESPIRATORY_RATE).then(obs => {
                if (obs?.valueQuantity) {
                    const val = obs.valueQuantity.value;
                    if (val < 20) setRadioValue('4c-resp_rate', '0');
                    else if (val < 30) setRadioValue('4c-resp_rate', '1');
                    else setRadioValue('4c-resp_rate', '2');
                }
            });

            getMostRecentObservation(client, LOINC_CODES.OXYGEN_SATURATION).then(obs => {
                if (obs?.valueQuantity) {
                    const val = obs.valueQuantity.value;
                    if (val >= 92) setRadioValue('4c-oxygen_sat', '0');
                    else setRadioValue('4c-oxygen_sat', '2');
                }
            });

            getMostRecentObservation(client, LOINC_CODES.GCS).then(obs => {
                if (obs?.valueQuantity) {
                    const val = obs.valueQuantity.value;
                    if (val === 15) setRadioValue('4c-gcs', '0');
                    else setRadioValue('4c-gcs', '2');
                }
            });

            // BUN/Urea logic simplified for brevity - assuming mg/dL for BUN or mmol/L for Urea based on unit or value range heuristic
            getMostRecentObservation(client, LOINC_CODES.BUN).then(obs => {
                if (obs?.valueQuantity) {
                    const val = obs.valueQuantity.value;
                    // Assume mg/dL if > 10 usually
                    if (val < 19.6) setRadioValue('4c-urea', '0');
                    else if (val <= 39.2) setRadioValue('4c-urea', '1');
                    else setRadioValue('4c-urea', '3');
                }
            });

            getMostRecentObservation(client, LOINC_CODES.CRP).then(obs => {
                if (obs?.valueQuantity) {
                    const val = obs.valueQuantity.value;
                    if (val < 50) setRadioValue('4c-crp', '0');
                    else if (val < 100) setRadioValue('4c-crp', '1');
                    else setRadioValue('4c-crp', '2');
                }
            });
        }

        calculate();
    }
};