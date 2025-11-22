import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';

export const regiscar = {
    id: 'regiscar',
    title: 'RegiSCAR Score for DRESS',
    description: 'Diagnoses Drug Reaction with Eosinophilia and Systemic Symptoms (DRESS).',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            ${uiBuilder.createAlert({
                type: 'info',
                message: '<strong>Note:</strong> DRESS is a severe drug hypersensitivity reaction. RegiSCAR helps standardize diagnosis.'
            })}

            ${uiBuilder.createSection({
                title: 'Clinical Features',
                icon: '🌡️',
                content: `
                    ${uiBuilder.createRadioGroup({
                        name: 'regiscar-fever',
                        label: 'Fever (≥38.5 °C)',
                        options: [
                            { value: '-1', label: 'No / Unknown (-1)', checked: true },
                            { value: '0', label: 'Yes (0)' }
                        ]
                    })}
                    ${uiBuilder.createRadioGroup({
                        name: 'regiscar-lymph-nodes',
                        label: 'Enlarged lymph nodes (≥2 sites, >1 cm)',
                        options: [
                            { value: '0', label: 'No / Unknown (0)', checked: true },
                            { value: '1', label: 'Yes (+1)' }
                        ]
                    })}
                `
            })}

            ${uiBuilder.createSection({
                title: 'Laboratory Findings',
                icon: '🔬',
                content: `
                    ${uiBuilder.createRadioGroup({
                        name: 'regiscar-lymphocytes',
                        label: 'Atypical lymphocytes',
                        options: [
                            { value: '0', label: 'No / Unknown (0)', checked: true },
                            { value: '1', label: 'Yes (+1)' }
                        ]
                    })}
                    ${uiBuilder.createRadioGroup({
                        name: 'regiscar-eosinophilia',
                        label: 'Eosinophilia',
                        options: [
                            { value: '0', label: '0-699 cells or <10% (0)', checked: true },
                            { value: '1', label: '700-1,499 cells or 10-19.9% (+1)' },
                            { value: '2', label: '≥1,500 cells or ≥20% (+2)' }
                        ]
                    })}
                `
            })}

            ${uiBuilder.createSection({
                title: 'Skin Manifestations',
                icon: '🩹',
                content: `
                    ${uiBuilder.createRadioGroup({
                        name: 'regiscar-rash',
                        label: 'Skin rash extent >50%',
                        options: [
                            { value: '0', label: 'No / Unknown (0)', checked: true },
                            { value: '1', label: 'Yes (+1)' }
                        ]
                    })}
                    ${uiBuilder.createRadioGroup({
                        name: 'regiscar-skin-features',
                        label: 'Skin features suggesting DRESS',
                        helpText: 'At least 2 of: edema, infiltration, purpura, scaling',
                        options: [
                            { value: '0', label: 'Unknown (0)', checked: true },
                            { value: '-1', label: 'No (-1)' },
                            { value: '1', label: 'Yes (+1)' }
                        ]
                    })}
                    ${uiBuilder.createRadioGroup({
                        name: 'regiscar-biopsy',
                        label: 'Biopsy suggesting DRESS',
                        options: [
                            { value: '-1', label: 'No (-1)' },
                            { value: '0', label: 'Yes / Unknown (0)', checked: true }
                        ]
                    })}
                `
            })}

            ${uiBuilder.createSection({
                title: 'Organ Involvement & Course',
                icon: '🫀',
                content: `
                    ${uiBuilder.createRadioGroup({
                        name: 'regiscar-organ',
                        label: 'Internal organ involved',
                        helpText: 'Liver, kidney, lung, heart, pancreas, etc.',
                        options: [
                            { value: '0', label: 'None (0)', checked: true },
                            { value: '1', label: '1 organ (+1)' },
                            { value: '2', label: '≥2 organs (+2)' }
                        ]
                    })}
                    ${uiBuilder.createRadioGroup({
                        name: 'regiscar-resolution',
                        label: 'Resolution in ≥15 days',
                        options: [
                            { value: '-1', label: 'No / Unknown (-1)', checked: true },
                            { value: '0', label: 'Yes (0)' }
                        ]
                    })}
                    ${uiBuilder.createRadioGroup({
                        name: 'regiscar-alternative',
                        label: 'Alternative diagnoses excluded',
                        helpText: 'By ≥3 biological investigations',
                        options: [
                            { value: '0', label: 'No / Unknown (0)', checked: true },
                            { value: '1', label: 'Yes (+1)' }
                        ]
                    })}
                `
            })}

            ${uiBuilder.createResultBox({ id: 'regiscar-result', title: 'RegiSCAR Assessment' })}

            ${uiBuilder.createAlert({
                type: 'info',
                message: `
                    <h4>📊 Score Interpretation</h4>
                    <div class="ui-data-table">
                        <table>
                            <thead>
                                <tr><th>Score</th><th>Diagnosis</th><th>Likelihood</th></tr>
                            </thead>
                            <tbody>
                                <tr><td>< 2</td><td>No case</td><td>Unlikely</td></tr>
                                <tr><td>2-3</td><td>Possible case</td><td>Consider DRESS</td></tr>
                                <tr><td>4-5</td><td>Probable case</td><td>High likelihood</td></tr>
                                <tr><td>> 5</td><td>Definite case</td><td>Confirmed</td></tr>
                            </tbody>
                        </table>
                    </div>
                `
            })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const resultBox = container.querySelector('#regiscar-result');

        const calculate = () => {
            const groups = [
                'regiscar-fever', 'regiscar-lymph-nodes', 'regiscar-lymphocytes', 'regiscar-eosinophilia',
                'regiscar-rash', 'regiscar-skin-features', 'regiscar-biopsy',
                'regiscar-organ', 'regiscar-resolution', 'regiscar-alternative'
            ];

            let score = 0;
            groups.forEach(g => {
                const checked = container.querySelector(`input[name="${g}"]:checked`);
                if (checked) {
                    score += parseInt(checked.value);
                }
            });

            let diagnosis = '';
            let alertType = 'info';

            if (score < 2) {
                diagnosis = 'No case';
                alertType = 'success';
            } else if (score <= 3) {
                diagnosis = 'Possible case';
                alertType = 'warning';
            } else if (score <= 5) {
                diagnosis = 'Probable case';
                alertType = 'danger';
            } else {
                diagnosis = 'Definite case';
                alertType = 'danger';
            }

            const resultContent = resultBox.querySelector('.ui-result-content');
            resultContent.innerHTML = `
                ${uiBuilder.createResultItem({
                    label: 'RegiSCAR Score',
                    value: score,
                    unit: 'points',
                    interpretation: diagnosis,
                    alertClass: `ui-alert-${alertType}`
                })}
            `;
            resultBox.classList.add('show');
        };

        container.addEventListener('change', (e) => {
            if (e.target.type === 'radio') calculate();
        });

        // Auto-populate
        const getObservation = code => {
            if (!client || !client.patient) return Promise.resolve(null);
            return client.patient.request(`Observation?code=${code}&_sort=-date&_count=1`)
                .then(r => (r.entry && r.entry[0] ? r.entry[0].resource : null));
        };

        getObservation(LOINC_CODES.TEMPERATURE).then(temp => {
            if (temp?.valueQuantity?.value >= 38.5) {
                uiBuilder.setRadioValue('regiscar-fever', '0'); // Yes is 0
                    calculate();
            }
        });

        getObservation(LOINC_CODES.EOSINOPHILS).then(eos => {
            if (eos?.valueQuantity) {
                const val = eos.valueQuantity.value;
                if (val >= 1500) uiBuilder.setRadioValue('regiscar-eosinophilia', '2');
                else if (val >= 700) uiBuilder.setRadioValue('regiscar-eosinophilia', '1');
                    calculate();
            }
        });

        calculate();
    }
};
