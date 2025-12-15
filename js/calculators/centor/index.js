import { calculateAge } from '../../utils.js';
import { uiBuilder } from '../../ui-builder.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';

export const centor = {
    id: 'centor',
    title: 'Centor Score (Modified/McIsaac) for Strep Pharyngitis',
    description:
        'Estimates probability that pharyngitis is streptococcal, and suggests management course.',
    generateHTML: function () {
        const criteria = [
            { id: 'centor-exudates', label: 'Tonsillar exudates or swelling', points: 1 },
            { id: 'centor-nodes', label: 'Swollen, tender anterior cervical nodes', points: 1 },
            { id: 'centor-fever', label: 'Temperature > 38°C (100.4°F)', points: 1 },
            { id: 'centor-cough', label: 'Absence of cough', points: 1 }
        ];

        const criteriaSection = uiBuilder.createSection({
            title: 'Clinical Criteria',
            content: criteria.map(item =>
                uiBuilder.createRadioGroup({
                    name: item.id,
                    label: item.label,
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: '1', label: 'Yes (+1)' }
                    ]
                })
            ).join('')
        });

        const ageSection = uiBuilder.createSection({
            title: 'McIsaac Modification (Age)',
            content: uiBuilder.createRadioGroup({
                name: 'centor-age',
                options: [
                    { value: '1', label: 'Age 3-14 years (+1)' },
                    { value: '0', label: 'Age 15-44 years (+0)', checked: true },
                    { value: '-1', label: 'Age ≥ 45 years (-1)' }
                ]
            })
        });

        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            ${criteriaSection}
            ${ageSection}
            
            <div id="centor-error-container"></div>
            ${uiBuilder.createResultBox({ id: 'centor-result', title: 'Centor Score Result' })}
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
            try {
                // Clear validation errors
                const errorContainer = container.querySelector('#centor-error-container');
                if (errorContainer) errorContainer.innerHTML = '';

                let score = 0;
                container.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
                    score += parseInt(radio.value);
                });

                let probability = '';
                let recommendation = '';
                let alertClass = '';

                if (score <= 0) {
                    probability = '<10%';
                    recommendation = 'No antibiotic or throat culture necessary.';
                    alertClass = 'ui-alert-success';
                } else if (score === 1) {
                    probability = '≈17%';
                    recommendation = 'No antibiotic or throat culture necessary.';
                    alertClass = 'ui-alert-success';
                } else if (score === 2) {
                    probability = '≈35%';
                    recommendation = 'Consider throat culture or rapid antigen testing.';
                    alertClass = 'ui-alert-warning';
                } else if (score === 3) {
                    probability = '≈56%';
                    recommendation = 'Consider throat culture or rapid antigen testing. May treat empirically.';
                    alertClass = 'ui-alert-warning';
                } else {
                    probability = '>85%';
                    recommendation = 'Empiric antibiotic treatment is justified.';
                    alertClass = 'ui-alert-danger';
                }

                const resultBox = container.querySelector('#centor-result');
                const resultContent = resultBox.querySelector('.ui-result-content');

                resultContent.innerHTML = `
                    ${uiBuilder.createResultItem({
                    label: 'Total Score',
                    value: score,
                    unit: '/ 5 points',
                    interpretation: `Probability of Strep: ${probability}`,
                    alertClass: alertClass
                })}
                    
                    <div class="ui-alert ${alertClass} mt-10">
                        <span class="ui-alert-icon">${alertClass.includes('success') ? '✓' : '⚠️'}</span>
                        <div class="ui-alert-content">
                            <strong>Recommendation:</strong> ${recommendation}
                        </div>
                    </div>
                `;

                resultBox.classList.add('show');
            } catch (error) {
                const errorContainer = container.querySelector('#centor-error-container');
                if (errorContainer) {
                    displayError(errorContainer, error);
                } else {
                    console.error(error);
                }
                logError(error, { calculator: 'centor', action: 'calculate' });
            }
        };

        // Add event listeners
        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', calculate);
        });

        // Auto-populate Age
        if (patient && patient.birthDate) {
            const age = calculateAge(patient.birthDate);
            if (age >= 3 && age <= 14) {
                setRadioValue('centor-age', '1');
            } else if (age >= 45) {
                setRadioValue('centor-age', '-1');
            } else {
                setRadioValue('centor-age', '0');
            }
        }

        calculate();
    }
};