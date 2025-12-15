import { calculateAge, getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';

export const perc = {
    id: 'perc',
    title: 'PERC Rule for Pulmonary Embolism',
    description: 'Rules out PE if no criteria are present and pre-test probability is ≤15%.',
    generateHTML: function () {
        const criteria = [
            { id: 'age50', label: 'Age ≥ 50 years' },
            { id: 'hr100', label: 'Heart rate ≥ 100 bpm' },
            { id: 'o2sat', label: 'Room air SaO₂ < 95%' },
            { id: 'hemoptysis', label: 'Hemoptysis (coughing up blood)' },
            { id: 'exogenous-estrogen', label: 'Exogenous estrogen use' },
            { id: 'prior-dvt-pe', label: 'History of DVT or PE' },
            { id: 'unilateral-swelling', label: 'Unilateral leg swelling' },
            { id: 'trauma-surgery', label: 'Recent trauma or surgery requiring hospitalization' }
        ];

        const criteriaSection = uiBuilder.createSection({
            title: 'PERC Criteria',
            subtitle: 'Check if present',
            icon: '📋',
            content: criteria.map(item =>
                uiBuilder.createCheckbox({
                    id: item.id,
                    label: item.label,
                    value: '1'
                })
            ).join('')
        });

        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            ${uiBuilder.createAlert({
            type: 'warning',
            message: '<strong>Important:</strong> PERC is only valid when pre-test probability for PE is ≤15%.'
        })}
            
            ${criteriaSection}
            
            <div id="perc-error-container"></div>
            ${uiBuilder.createResultBox({ id: 'perc-result', title: 'PERC Rule Result' })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const calculate = () => {
            try {
                // Clear validation errors
                const errorContainer = container.querySelector('#perc-error-container');
                if (errorContainer) errorContainer.innerHTML = '';

                const criteriaMet = [];
                container.querySelectorAll('input[type="checkbox"]:checked').forEach(box => {
                    criteriaMet.push(box.id);
                });

                let resultTitle = '';
                let interpretation = '';
                let alertClass = '';

                if (criteriaMet.length === 0) {
                    resultTitle = 'PERC Negative';
                    interpretation = 'PE may be ruled out. No further testing is indicated if pre-test probability is low (≤15%).';
                    alertClass = 'ui-alert-success';
                } else {
                    resultTitle = 'PERC Positive';
                    interpretation = 'The rule is positive. PE is NOT ruled out. Further testing (e.g., D-dimer, imaging) should be considered.';
                    alertClass = 'ui-alert-danger';
                }

                const resultBox = container.querySelector('#perc-result');
                const resultContent = resultBox.querySelector('.ui-result-content');

                resultContent.innerHTML = `
                    ${uiBuilder.createResultItem({
                    label: 'Status',
                    value: resultTitle,
                    unit: '',
                    alertClass: alertClass
                })}
                    ${criteriaMet.length > 0 ? uiBuilder.createResultItem({ label: 'Criteria Met', value: `${criteriaMet.length} / 8` }) : ''}
                    
                    <div class="ui-alert ${alertClass} mt-10">
                        <span class="ui-alert-icon">${alertClass.includes('success') ? '✓' : '⚠️'}</span>
                        <div class="ui-alert-content">
                            <strong>Result:</strong> ${interpretation}
                        </div>
                    </div>
                `;

                resultBox.classList.add('show');
            } catch (error) {
                const errorContainer = container.querySelector('#perc-error-container');
                if (errorContainer) {
                    displayError(errorContainer, error);
                } else {
                    console.error(error);
                }
                logError(error, { calculator: 'perc', action: 'calculate' });
            }
        };

        // Add event listeners
        container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', calculate);
        });

        // Pre-fill age
        if (patient && patient.birthDate) {
            const age = calculateAge(patient.birthDate);
            if (age >= 50) {
                const box = container.querySelector('#age50');
                if (box) box.checked = true; // Use checked prop directly for init
            }
        }

        // Pre-fill heart rate and O2 saturation with standard FHIR utils
        if (client) {
            getMostRecentObservation(client, LOINC_CODES.HEART_RATE).then(obs => {
                if (obs && obs.valueQuantity && obs.valueQuantity.value >= 100) {
                    const box = container.querySelector('#hr100');
                    if (box) {
                        box.checked = true;
                        // No event dispatch here, wait for final calc
                    }
                }
            }).catch(e => console.warn(e))
                .finally(() => calculate()); // ensure recalc once

            getMostRecentObservation(client, LOINC_CODES.OXYGEN_SATURATION).then(obs => {
                if (obs && obs.valueQuantity && obs.valueQuantity.value < 95) {
                    const box = container.querySelector('#o2sat');
                    if (box) {
                        box.checked = true;
                    }
                }
            }).catch(e => console.warn(e))
                .finally(() => calculate());
        } else {
            calculate();
        }
    }
};