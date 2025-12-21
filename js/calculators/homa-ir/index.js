import { getMostRecentObservation, } from '../../utils.js';
import { createStalenessTracker } from '../../data-staleness.js';
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
                placeholder: 'e.g. 100',
                unitToggle: { type: 'glucose', units: ['mg/dL', 'mmol/L'], default: 'mg/dL' }
            })}
                    ${uiBuilder.createInput({
                id: 'homa-insulin',
                label: 'Fasting Insulin',
                type: 'number',
                placeholder: 'e.g. 10',
                unitToggle: { type: 'insulin', units: ['µU/mL', 'pmol/L'], default: 'µU/mL' }
            })}
                `
        })}
            
            <div id="homa-error-container"></div>
            ${uiBuilder.createResultBox({ id: 'homa-ir-result', title: 'HOMA-IR Score' })}
            
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
        // Initialize staleness tracker for this calculator
        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);
        const insulinInput = container.querySelector('#homa-insulin');
        const glucoseInput = container.querySelector('#homa-glucose');
        const resultBox = container.querySelector('#homa-ir-result');
        const calculate = () => {
            // Clear previous errors
            const errorContainer = container.querySelector('#homa-error-container');
            if (errorContainer)
                errorContainer.innerHTML = '';
            // Use UnitConverter to get standard value (mg/dL)
            const glucoseMgDl = UnitConverter.getStandardValue(glucoseInput, 'mg/dL');
            const insulin = UnitConverter.getStandardValue(insulinInput, 'µU/mL');
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
                // @ts-ignore
                const validation = validateCalculatorInput(inputs, schema);
                if (!validation.isValid) {
                    const hasInput = (glucoseInput.value || insulinInput.value);
                    if (hasInput) {
                        const valuesPresent = glucoseMgDl !== null && !isNaN(glucoseMgDl) && insulin !== null && !isNaN(insulin);
                        if (valuesPresent || validation.errors.some((e) => !e.includes('required'))) {
                            if (errorContainer)
                                displayError(errorContainer, new ValidationError(validation.errors[0], 'VALIDATION_ERROR'));
                        }
                    }
                    if (resultBox)
                        resultBox.classList.remove('show');
                    return;
                }
                if (glucoseMgDl === null || insulin === null)
                    return;
                const homaIrScore = (glucoseMgDl * insulin) / 405;
                if (!isFinite(homaIrScore) || isNaN(homaIrScore))
                    throw new Error("Calculation Error");
                let interpretation = '';
                let alertClass = 'ui-alert-success';
                if (homaIrScore > 2.9) {
                    interpretation = 'High likelihood of insulin resistance';
                    alertClass = 'ui-alert-danger';
                }
                else if (homaIrScore > 1.9) {
                    interpretation = 'Early insulin resistance likely';
                    alertClass = 'ui-alert-warning';
                }
                else {
                    interpretation = 'Optimal insulin sensitivity';
                    alertClass = 'ui-alert-success';
                }
                if (resultBox) {
                    const resultContent = resultBox.querySelector('.ui-result-content');
                    if (resultContent) {
                        resultContent.innerHTML = `
                            ${uiBuilder.createResultItem({
                            label: 'HOMA-IR',
                            value: homaIrScore.toFixed(2),
                            unit: '',
                            interpretation: interpretation,
                            alertClass: alertClass
                        })}
                        `;
                    }
                    resultBox.classList.add('show');
                }
            }
            catch (error) {
                logError(error, { calculator: 'homa-ir', action: 'calculate' });
                if (errorContainer)
                    displayError(errorContainer, error);
                if (resultBox)
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
                    const val = obs.valueQuantity.value;
                    const unit = obs.valueQuantity.unit || 'mg/dL';
                    const converted = UnitConverter.convert(val, unit, 'mg/dL', 'glucose');
                    if (converted !== null) {
                        glucoseInput.value = converted.toFixed(0);
                    }
                    else {
                        glucoseInput.value = val.toFixed(0);
                    }
                    glucoseInput.dispatchEvent(new Event('input'));
                    // Track staleness
                    stalenessTracker.trackObservation('#homa-glucose', obs, '2339-0', 'Fasting Glucose');
                }
            }).catch(e => console.warn(e));
            getMostRecentObservation(client, '20448-7').then(obs => {
                if (obs && obs.valueQuantity) {
                    const val = obs.valueQuantity.value;
                    const unit = obs.valueQuantity.unit || 'µU/mL';
                    const converted = UnitConverter.convert(val, unit, 'µU/mL', 'insulin');
                    if (converted !== null) {
                        insulinInput.value = converted.toFixed(1);
                    }
                    else {
                        insulinInput.value = val.toFixed(1);
                    }
                    insulinInput.dispatchEvent(new Event('input'));
                    // Track staleness
                    stalenessTracker.trackObservation('#homa-insulin', obs, '20448-7', 'Fasting Insulin');
                }
            }).catch(e => console.warn(e));
        }
        calculate();
    }
};
