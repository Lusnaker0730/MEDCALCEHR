import { calculateAge } from '../../utils.js';
import { uiBuilder } from '../../ui-builder.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';

export const heartScore = {
    id: 'heart-score',
    title: 'HEART Score for Major Cardiac Events',
    description:
        'Predicts 6-week risk of major adverse cardiac events in patients with chest pain.',
    generateHTML: function () {
        const criteria = [
            {
                id: 'history',
                title: 'History',
                icon: '📋',
                help: 'Slightly suspicious: Low risk features (well localized, sharp, non-exertional). Moderately suspicious: Mixture. Highly suspicious: Classic angina features.',
                options: [
                    { value: '0', label: 'Slightly suspicious', checked: true },
                    { value: '1', label: 'Moderately suspicious' },
                    { value: '2', label: 'Highly suspicious' }
                ]
            },
            {
                id: 'ecg',
                title: 'EKG',
                icon: '📊',
                help: 'Normal: 0 pts. Non-specific: LBBB, LVH, digoxin effect (1 pt). Significant: ST deviation not due to LBBB/LVH/digoxin (2 pts).',
                options: [
                    { value: '0', label: 'Normal', checked: true },
                    { value: '1', label: 'Non-specific repolarization disturbance' },
                    { value: '2', label: 'Significant ST deviation' }
                ]
            },
            {
                id: 'age',
                title: 'Age',
                icon: '👤',
                options: [
                    { value: '0', label: '< 45 years', checked: true },
                    { value: '1', label: '45-64 years' },
                    { value: '2', label: '≥ 65 years' }
                ]
            },
            {
                id: 'risk',
                title: 'Risk Factors',
                icon: '⚡',
                help: 'HTN, hyperlipidemia, DM, obesity (BMI>30), smoking, family history, atherosclerotic disease.',
                options: [
                    { value: '0', label: 'No known risk factors', checked: true },
                    { value: '1', label: '1-2 risk factors' },
                    { value: '2', label: '≥3 risk factors or history of atherosclerotic disease' }
                ]
            },
            {
                id: 'troponin',
                title: 'Initial Troponin',
                icon: '🔬',
                help: 'Use local assay cutoffs.',
                options: [
                    { value: '0', label: '≤ normal limit', checked: true },
                    { value: '1', label: '1-3× normal limit' },
                    { value: '2', label: '> 3× normal limit' }
                ]
            }
        ];

        const sectionsHTML = criteria.map(item =>
            uiBuilder.createSection({
                title: item.title,
                icon: item.icon,
                content: uiBuilder.createRadioGroup({
                    name: `heart-${item.id}`,
                    options: item.options,
                    helpText: item.help
                })
            })
        ).join('');

        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            ${uiBuilder.createAlert({
            type: 'warning',
            message: '<strong>Inclusion Criteria:</strong> Patients ≥21 years old with symptoms suggestive of ACS. <strong>Do not use if:</strong> new ST-elevation ≥1 mm, hypotension, life expectancy <1 year, or noncardiac illness requiring admission.'
        })}
            
            ${sectionsHTML}
            
            <div id="heart-error-container"></div>
            ${uiBuilder.createResultBox({ id: 'heart-score-result', title: 'HEART Score Result' })}
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
                // Clear errors
                const errorContainer = container.querySelector('#heart-error-container');
                if (errorContainer) errorContainer.innerHTML = '';

                const criteria = ['heart-history', 'heart-ecg', 'heart-age', 'heart-risk', 'heart-troponin'];
                let score = 0;
                let allSelected = true;

                criteria.forEach(name => {
                    const checked = container.querySelector(`input[name="${name}"]:checked`);
                    if (checked) {
                        score += parseInt(checked.value);
                    } else {
                        allSelected = false;
                    }
                });

                // With default 'checked: true' in generateHTML, all should be selected initially.
                if (!allSelected) return;

                let riskCategory = '';
                let maceRate = '';
                let recommendation = '';
                let alertClass = '';

                if (score <= 3) {
                    riskCategory = 'Low Risk (0-3)';
                    maceRate = '0.9-1.7%';
                    recommendation = 'Supports early discharge.';
                    alertClass = 'ui-alert-success';
                } else if (score <= 6) {
                    riskCategory = 'Moderate Risk (4-6)';
                    maceRate = '12-16.6%';
                    recommendation = 'Admit for clinical observation and further testing.';
                    alertClass = 'ui-alert-warning';
                } else {
                    riskCategory = 'High Risk (7-10)';
                    maceRate = '50-65%';
                    recommendation = 'Candidate for early invasive measures.';
                    alertClass = 'ui-alert-danger';
                }

                const resultBox = container.querySelector('#heart-score-result');
                const resultContent = resultBox.querySelector('.ui-result-content');

                resultContent.innerHTML = `
                    ${uiBuilder.createResultItem({
                    label: 'Total HEART Score',
                    value: score,
                    unit: '/ 10 points',
                    interpretation: riskCategory,
                    alertClass: alertClass
                })}
                    ${uiBuilder.createResultItem({
                    label: 'Risk of Major Adverse Cardiac Event (6-week)',
                    value: maceRate,
                    alertClass: alertClass
                })}
                    
                    <div class="ui-alert ${alertClass} mt-10">
                        <span class="ui-alert-icon">💡</span>
                        <div class="ui-alert-content">
                            <strong>Recommendation:</strong> ${recommendation}
                        </div>
                    </div>
                `;

                resultBox.classList.add('show');
            } catch (error) {
                const errorContainer = container.querySelector('#heart-error-container');
                if (errorContainer) {
                    displayError(errorContainer, error);
                } else {
                    console.error(error);
                }
                logError(error, { calculator: 'heart-score', action: 'calculate' });
            }
        };

        // Add event listeners
        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', calculate);
        });

        // Auto-populate Age
        if (patient && patient.birthDate) {
            const age = calculateAge(patient.birthDate);
            if (age < 45) {
                setRadioValue('heart-age', '0');
            } else if (age <= 64) {
                setRadioValue('heart-age', '1');
            } else {
                setRadioValue('heart-age', '2');
            }
        }

        calculate();
    }
};