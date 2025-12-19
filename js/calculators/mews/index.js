import { getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { createStalenessTracker } from '../../data-staleness.js';
import { uiBuilder } from '../../ui-builder.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';

export const mewsScore = {
    id: 'mews',
    title: 'Modified Early Warning Score (MEWS)',
    description:
        'Determines the degree of illness of a patient. Identifies patients at risk for clinical deterioration.',
    generateHTML: function () {
        const sections = [
            {
                id: 'sbp',
                title: 'Systolic BP (mmHg)',
                icon: '🩸',
                options: [
                    { value: '0', label: '101-199 mmHg', checked: true },
                    { value: '1', label: '81-100 mmHg (+1)' },
                    { value: '2', label: '71-80 or ≥200 mmHg (+2)' },
                    { value: '3', label: '≤70 mmHg (+3)' }
                ]
            },
            {
                id: 'hr',
                title: 'Heart Rate (bpm)',
                icon: '💓',
                options: [
                    { value: '0', label: '51-100 bpm', checked: true },
                    { value: '1', label: '41-50 or 101-110 bpm (+1)' },
                    { value: '2', label: '<40 or 111-129 bpm (+2)' },
                    { value: '3', label: '≥130 bpm (+3)' }
                ]
            },
            {
                id: 'rr',
                title: 'Respiratory Rate (breaths/min)',
                icon: '🫁',
                options: [
                    { value: '0', label: '9-14 bpm', checked: true },
                    { value: '1', label: '15-20 bpm (+1)' },
                    { value: '2', label: '<9 or 21-29 bpm (+2)' },
                    { value: '3', label: '≥30 bpm (+3)' }
                ]
            },
            {
                id: 'temp',
                title: 'Temperature',
                icon: '🌡️',
                options: [
                    { value: '0', label: '35.0-38.4°C (95-101.1°F)', checked: true },
                    { value: '2', label: '<35°C (<95°F) or ≥38.5°C (≥101.3°F) (+2)' }
                ]
            },
            {
                id: 'avpu',
                title: 'AVPU Scale (Level of Consciousness)',
                icon: '🧠',
                options: [
                    { value: '0', label: 'Alert', checked: true },
                    { value: '1', label: 'Voice - Responds to voice (+1)' },
                    { value: '2', label: 'Pain - Responds to pain (+2)' },
                    { value: '3', label: 'Unresponsive (+3)' }
                ]
            }
        ];

        const sectionsHTML = sections.map(section =>
            uiBuilder.createSection({
                title: section.title,
                icon: section.icon,
                content: uiBuilder.createRadioGroup({
                    name: `mews-${section.id}`,
                    options: section.options
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
            message: 'Different hospitals may use different modifications of MEWS. Verify your institution protocols.'
        })}
            
            ${sectionsHTML}
            
            <div id="mews-error-container"></div>
            ${uiBuilder.createResultBox({ id: 'mews-result', title: 'MEWS Score Results' })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        // Initialize staleness tracker
        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);

        const setRadioValue = (name, value) => {
            const radio = container.querySelector(`input[name="${name}"][value="${value}"]`);
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change'));
            }
        };

        const calculate = () => {
            try {
                // Clear any previous errors
                const errorContainer = container.querySelector('#mews-error-container');
                if (errorContainer) errorContainer.innerHTML = '';

                let score = 0;
                const groups = ['mews-sbp', 'mews-hr', 'mews-rr', 'mews-temp', 'mews-avpu'];
                let hasCriticalParam = false;

                groups.forEach(group => {
                    const checked = container.querySelector(`input[name="${group}"]:checked`);
                    if (checked) {
                        const val = parseInt(checked.value);
                        score += val;
                        if (val === 3) hasCriticalParam = true;
                    }
                });

                let riskLevel = '';
                let recommendation = '';
                let alertClass = '';

                if (score <= 1) {
                    riskLevel = 'Low Risk';
                    recommendation = 'Continue routine monitoring.';
                    alertClass = 'ui-alert-success';
                } else if (score <= 3) {
                    riskLevel = 'Moderate Risk';
                    recommendation = 'Increase frequency of observations. Notify nurse in charge.';
                    alertClass = 'ui-alert-warning';
                } else if (score === 4) {
                    riskLevel = 'Moderate-High Risk';
                    recommendation = 'Urgent call to doctor. Consider ICU assessment.';
                    alertClass = 'ui-alert-warning';
                } else {
                    riskLevel = 'High Risk';
                    recommendation = 'Emergency call to doctor. Immediate ICU assessment required.';
                    alertClass = 'ui-alert-danger';
                }

                let criticalWarning = '';
                if (hasCriticalParam) {
                    criticalWarning = `
                        <div class="ui-alert ui-alert-danger mt-10">
                            <span class="ui-alert-icon">⚠️</span>
                            <div class="ui-alert-content">
                                <strong>Critical Parameter Alert:</strong> One or more parameters scored +3 points. Consider higher level of care regardless of total score.
                            </div>
                        </div>
                    `;
                }

                const resultBox = container.querySelector('#mews-result');
                const resultContent = resultBox.querySelector('.ui-result-content');

                resultContent.innerHTML = `
                    ${uiBuilder.createResultItem({
                    label: 'Total MEWS Score',
                    value: score,
                    unit: '/ 14 points',
                    interpretation: riskLevel,
                    alertClass: alertClass
                })}
                    
                    <div class="ui-alert ${alertClass} mt-10">
                        <span class="ui-alert-icon">📋</span>
                        <div class="ui-alert-content">
                            <strong>Recommendation:</strong> ${recommendation}
                        </div>
                    </div>
                    
                    ${criticalWarning}
                `;

                resultBox.classList.add('show');
            } catch (error) {
                // Error Handling with standardized ErrorHandler
                const errorContainer = container.querySelector('#mews-error-container');
                if (errorContainer) {
                    displayError(errorContainer, error);
                } else {
                    console.error(error);
                }
                logError(error, { calculator: 'mews', action: 'calculate' });
            }
        };

        // Add event listeners
        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', calculate);
        });

        // Auto-populate
        if (client) {
            getMostRecentObservation(client, LOINC_CODES.SYSTOLIC_BP).then(obs => {
                if (obs?.valueQuantity) {
                    const sbp = obs.valueQuantity.value;
                    if (sbp <= 70) setRadioValue('mews-sbp', '3');
                    else if (sbp <= 80) setRadioValue('mews-sbp', '2');
                    else if (sbp <= 100) setRadioValue('mews-sbp', '1');
                    else if (sbp <= 199) setRadioValue('mews-sbp', '0');
                    else setRadioValue('mews-sbp', '2');

                    stalenessTracker.trackObservation('input[name="mews-sbp"]', obs, LOINC_CODES.SYSTOLIC_BP, 'Systolic BP');
                }
            }).catch(e => console.warn(e));

            getMostRecentObservation(client, LOINC_CODES.HEART_RATE).then(obs => {
                if (obs?.valueQuantity) {
                    const hr = obs.valueQuantity.value;
                    if (hr < 40) setRadioValue('mews-hr', '2');
                    else if (hr <= 50) setRadioValue('mews-hr', '1');
                    else if (hr <= 100) setRadioValue('mews-hr', '0');
                    else if (hr <= 110) setRadioValue('mews-hr', '1');
                    else if (hr <= 129) setRadioValue('mews-hr', '2');
                    else setRadioValue('mews-hr', '3');

                    stalenessTracker.trackObservation('input[name="mews-hr"]', obs, LOINC_CODES.HEART_RATE, 'Heart Rate');
                }
            }).catch(e => console.warn(e));

            getMostRecentObservation(client, LOINC_CODES.RESPIRATORY_RATE).then(obs => {
                if (obs?.valueQuantity) {
                    const rr = obs.valueQuantity.value;
                    if (rr < 9) setRadioValue('mews-rr', '2');
                    else if (rr <= 14) setRadioValue('mews-rr', '0');
                    else if (rr <= 20) setRadioValue('mews-rr', '1');
                    else if (rr <= 29) setRadioValue('mews-rr', '2');
                    else setRadioValue('mews-rr', '3');

                    stalenessTracker.trackObservation('input[name="mews-rr"]', obs, LOINC_CODES.RESPIRATORY_RATE, 'Resp Rate');
                }
            }).catch(e => console.warn(e));

            getMostRecentObservation(client, LOINC_CODES.TEMPERATURE).then(obs => {
                if (obs?.valueQuantity) {
                    let temp = obs.valueQuantity.value;
                    const unit = obs.valueQuantity.unit;
                    if (unit === '[degF]' || unit === 'degF' || unit === 'F') {
                        temp = ((temp - 32) * 5) / 9;
                    }

                    if (temp < 35 || temp >= 38.5) setRadioValue('mews-temp', '2');
                    else setRadioValue('mews-temp', '0');

                    stalenessTracker.trackObservation('input[name="mews-temp"]', obs, LOINC_CODES.TEMPERATURE, 'Temperature');
                }
            }).catch(e => console.warn(e));
        }

        calculate();
    }
};