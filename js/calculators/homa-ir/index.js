import {
    getMostRecentObservation
} from '../../utils.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { ValidationRules, validateCalculatorInput } from '../../validator.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';

export const homaIr = {
    id: 'homa-ir',
    title: 'HOMA-IR (Homeostatic Model Assessment for Insulin Resistance)',
    description: 'Approximates insulin resistance.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>

            ${uiBuilder.createSection({
            title: 'Parameters',
            content: `
                    ${uiBuilder.createInput({
                id: 'homa-glucose',
                label: 'Fasting Glucose',
                unit: 'mg/dL',
                type: 'number',
                unitToggle: true
            })}
                    ${uiBuilder.createInput({
                id: 'homa-insulin',
                label: 'Fasting Insulin',
                unit: 'µU/mL',
                type: 'number',
                placeholder: 'e.g. 10'
            })}
                `
        })}
            
            <div id="homa-ir-result" class="ui-result-box">
                <div class="ui-result-header">HOMA-IR Score</div>
                <div class="ui-result-content"></div>
            </div>
            
            ${uiBuilder.createFormulaSection({
            items: [
                { label: 'HOMA-IR', content: '(Fasting Glucose [mg/dL] × Fasting Insulin [μU/mL]) / 405' }
            ]
        })}
            
            ${uiBuilder.createAlert({
            type: 'info',
            message: `
                    <strong>Interpretation:</strong>
                    <ul>
                        <li><strong>< 1.9:</strong> Optimal insulin sensitivity</li>
                        <li><strong>1.9 - 2.9:</strong> Early insulin resistance is likely</li>
                        <li><strong>> 2.9:</strong> High likelihood of insulin resistance</li>
                    </ul>
                `
        })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        UnitConverter.createUnitToggle(container.querySelector('#homa-glucose'), 'glucose', ['mg/dL', 'mmol/L']);

        const insulinInput = container.querySelector('#homa-insulin');
        const glucoseInput = container.querySelector('#homa-glucose');
        const resultBox = container.querySelector('#homa-ir-result');
        const resultContent = resultBox.querySelector('.ui-result-content');

        const calculate = () => {
            // Clear previous errors
            const existingError = container.querySelector('#homa-error');
            if (existingError) existingError.remove();

            // Use UnitConverter to get standard value (mg/dL)
            const glucoseMgDl = UnitConverter.getStandardValue(glucoseInput);
            const insulin = parseFloat(insulinInput.value);

            try {
                // Validation inputs
                const inputs = {
                    glucose: glucoseMgDl,
                    insulin: insulin
                };
                const schema = {
                    glucose: ValidationRules.glucose,
                    insulin: ValidationRules.insulin
                };

                const validation = validateCalculatorInput(inputs, schema);

                if (!validation.isValid) {
                    const hasInput = (glucoseInput.value || insulinInput.value);

                    if (hasInput) {
                        const valuesPresent = !isNaN(glucoseMgDl) && !isNaN(insulin);
                        if (valuesPresent || validation.errors.some(e => !e.includes('required'))) {
                            let errorContainer = document.createElement('div');
                            errorContainer.id = 'homa-error';
                            resultBox.parentNode.insertBefore(errorContainer, resultBox);
                            displayError(errorContainer, new ValidationError(validation.errors[0], 'VALIDATION_ERROR'));
                        }
                    }

                    resultBox.classList.remove('show');
                    return;
                }

                const homaIrScore = (glucoseMgDl * insulin) / 405;

                if (!isFinite(homaIrScore) || isNaN(homaIrScore)) throw new Error("Calculation Error");

                let interpretation = '';
                let alertType = 'success';
                let alertClass = 'ui-alert-success';

                if (homaIrScore > 2.9) {
                    interpretation = 'High likelihood of insulin resistance';
                    alertType = 'danger';
                    alertClass = 'ui-alert-danger';
                } else if (homaIrScore > 1.9) {
                    interpretation = 'Early insulin resistance likely';
                    alertType = 'warning';
                    alertClass = 'ui-alert-warning';
                } else {
                    interpretation = 'Optimal insulin sensitivity';
                    alertType = 'success';
                    alertClass = 'ui-alert-success';
                }

                resultContent.innerHTML = `
                    ${uiBuilder.createResultItem({
                    label: 'HOMA-IR',
                    value: homaIrScore.toFixed(2),
                    unit: '',
                    interpretation: interpretation,
                    alertClass: alertClass
                })}
                `;
                resultBox.classList.add('show');
            } catch (error) {
                logError(error, { calculator: 'homa-ir', action: 'calculate' });
                if (error.name !== 'ValidationError') {
                    let errorContainer = container.querySelector('#homa-error');
                    if (!errorContainer) {
                        errorContainer = document.createElement('div');
                        errorContainer.id = 'homa-error';
                        resultBox.parentNode.insertBefore(errorContainer, resultBox);
                    }
                    displayError(errorContainer, error);
                }
                resultBox.classList.remove('show');
            }
        };

        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculate);
            input.addEventListener('change', calculate);
        });

        if (client) {
            getMostRecentObservation(client, '2339-0').then(obs => {
                if (obs && obs.valueQuantity) {
                    // Populate value. Unit toggle handling:
                    // Usually we set value and dispatch input.
                    // If units differ, user manually toggles or we rely on UnitConverter.
                    // For now, raw population.
                    glucoseInput.value = obs.valueQuantity.value.toFixed(0);
                    glucoseInput.dispatchEvent(new Event('input'));
                }
            });

            getMostRecentObservation(client, '20448-7').then(obs => {
                if (obs && obs.valueQuantity) {
                    insulinInput.value = obs.valueQuantity.value.toFixed(1);
                    insulinInput.dispatchEvent(new Event('input'));
                }
            });
        }

        calculate();
    }
};
