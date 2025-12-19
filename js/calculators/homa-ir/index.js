import {
    getMostRecentObservation,
} from '../../utils.js';
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
                unitToggle: true,
                placeholder: 'e.g. 100'
            })}
                    ${uiBuilder.createInput({
                id: 'homa-insulin',
                label: 'Fasting Insulin',
                unit: 'µU/mL',
                type: 'number',
                placeholder: 'e.g. 10',
                unitToggle: { type: 'insulin', units: ['µU/mL', 'pmol/L'], defaultUnit: 'µU/mL' }
            })}
                `
        })}
            
            <div id="homa-error-container"></div>
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

        // Initialize staleness tracker for this calculator
        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);

        const insulinInput = container.querySelector('#homa-insulin');
        const glucoseInput = container.querySelector('#homa-glucose');

        // Enhance Glucose (explicitly manual toggle call to ensure 'glucose' type logic works correctly if simple unitToggle:true defaults are generic)
        // Note: unitToggle:true in uiBuilder implies generic handling, but for specific conversions we often want specific types like 'glucose' for mmol/L->mg/dL logic
        if (!glucoseInput.hasAttribute('data-unit-toggle-initialized')) {
            UnitConverter.createUnitToggle(glucoseInput, 'glucose', ['mg/dL', 'mmol/L']);
        }
        // Insulin handled by object config in createInput usually, but verifying:
        // createInput with object unitToggle generates the markup, initializeComponents might handle it?
        // uiBuilder logic usually handles markup. UnitConverter logic binds events?
        // Safest is to rely on UnitConverter.createUnitToggle if uncertain about uiBuilder auto-bind depth.
        // But let's assume ui.initializeComponents does standard work OR we do it manually.
        // HOMA-IR previous code manually called it.
        // Re-affirming manual call for safety as 'insulin' type might need specific conversion logic registry.
        // Check if already init by check attributes.
        // For now, explicit call is safe and idempotent-ish (replaces/updates).
        UnitConverter.createUnitToggle(insulinInput, 'insulin', ['µU/mL', 'pmol/L']);

        const resultBox = container.querySelector('#homa-ir-result');
        const resultContent = resultBox.querySelector('.ui-result-content');

        const calculate = () => {
            // Clear previous errors
            const errorContainer = container.querySelector('#homa-error-container');
            if (errorContainer) errorContainer.innerHTML = '';

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

                const validation = validateCalculatorInput(inputs, schema);

                if (!validation.isValid) {
                    const hasInput = (glucoseInput.value || insulinInput.value);

                    if (hasInput) {
                        const valuesPresent = !isNaN(glucoseMgDl) && !isNaN(insulin);
                        if (valuesPresent || validation.errors.some(e => !e.includes('required'))) {
                            if (errorContainer) displayError(errorContainer, new ValidationError(validation.errors[0], 'VALIDATION_ERROR'));
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
                if (errorContainer) displayError(errorContainer, error);
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
                    } else {
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
                    } else {
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
