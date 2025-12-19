import { getMostRecentObservation } from '../../utils.js';
import { createStalenessTracker } from '../../data-staleness.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { ValidationRules, validateCalculatorInput } from '../../validator.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';

export const tpaDosing = {
    id: 'tpa-dosing-stroke',
    title: 'tPA Dosing for Acute Stroke',
    description: 'Calculates tissue plasminogen activator (tPA) dosing for acute ischemic stroke.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            ${uiBuilder.createSection({
            title: 'Patient & Event Details',
            content: `
                    ${uiBuilder.createInput({
                id: 'weight',
                label: 'Weight',
                type: 'number',
                placeholder: 'Enter weight',
                unitToggle: { type: 'weight', units: ['kg', 'lbs'], defaultUnit: 'kg' },
                min: 0
            })}
                    ${uiBuilder.createInput({
                id: 'symptom-onset',
                label: 'Time from symptom onset',
                type: 'number',
                unit: 'hours',
                placeholder: 'e.g., 2.5',
                min: 0,
                max: 4.5,
                helpText: 'Must be ≤ 4.5 hours for IV tPA eligibility'
            })}
                `
        })}
            
            <div id="tpa-error-container"></div>
            ${uiBuilder.createResultBox({ id: 'tpa-stroke-result', title: 'Dosing & Eligibility' })}
            
            ${uiBuilder.createAlert({
            type: 'warning',
            message: `
                    <h4>Important Reminders</h4>
                    <ul>
                        <li>Verify all inclusion/exclusion criteria before administration</li>
                        <li>Obtain informed consent when possible</li>
                        <li>Ensure BP < 185/110 mmHg before treatment</li>
                        <li>Have reversal agents available (cryoprecipitate, aminocaproic acid)</li>
                    </ul>
                `
        })}
            ${uiBuilder.createFormulaSection({
            items: [
                { label: 'Total Dose', formula: '0.9 mg/kg (Max 90 mg)' },
                { label: 'Bolus', formula: '10% of Total Dose (over 1 min)' },
                { label: 'Infusion', formula: '90% of Total Dose (over 60 min)' }
            ],
            notes: 'Maximum dose is 90 mg regardless of weight.'
        })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);

        const weightInput = container.querySelector('#weight');
        const symptomOnsetInput = container.querySelector('#symptom-onset');
        const resultBox = container.querySelector('#tpa-stroke-result');

        const calculate = () => {
            try {
                // Clear validation errors
                const errorContainer = container.querySelector('#tpa-error-container');
                if (errorContainer) errorContainer.innerHTML = '';

                // Unit Conversion
                const weight = UnitConverter.getStandardValue(weightInput, 'kg');
                const symptomOnset = parseFloat(symptomOnsetInput.value);

                const validation = validateCalculatorInput(
                    { weight: weight },
                    { weight: ValidationRules.weight }
                );

                if (!validation.isValid) {
                    // Check if empty specifically
                    if (weightInput.value !== '' && validation.errors.some(e => !e.includes('required'))) {
                        displayError(errorContainer, new ValidationError(validation.errors[0], 'VALIDATION_ERROR'));
                    }
                    resultBox.classList.remove('show');
                    return;
                }

                if (isNaN(weight) || weight <= 0) {
                    resultBox.classList.remove('show');
                    return;
                }

                const totalDose = Math.min(0.9 * weight, 90);
                const bolus = totalDose * 0.1;
                const infusion = totalDose * 0.9;
                const infusionRate = infusion; // mg/hour

                let eligibilityHtml = '';
                let alertType = 'info';

                if (!isNaN(symptomOnset)) {
                    if (symptomOnset <= 4.5) {
                        eligibilityHtml = uiBuilder.createAlert({
                            type: 'success',
                            message: '<strong>Eligibility:</strong> Within time window for IV tPA (≤ 4.5 hours)'
                        });
                    } else {
                        eligibilityHtml = uiBuilder.createAlert({
                            type: 'danger',
                            message: '<strong>Eligibility:</strong> Outside time window for IV tPA (> 4.5 hours)'
                        });
                        alertType = 'danger';
                    }
                } else {
                    eligibilityHtml = uiBuilder.createAlert({
                        type: 'warning',
                        message: '<strong>Note:</strong> Please enter time from symptom onset to check eligibility.'
                    });
                }

                resultBox.querySelector('.ui-result-content').innerHTML = `
                    ${eligibilityHtml}
                    ${uiBuilder.createResultItem({
                    label: 'Total Dose',
                    value: totalDose.toFixed(1),
                    unit: 'mg',
                    interpretation: '0.9 mg/kg, max 90 mg'
                })}
                    <hr>
                    ${uiBuilder.createResultItem({
                    label: 'Step 1: IV Bolus',
                    value: bolus.toFixed(1),
                    unit: 'mg',
                    interpretation: 'IV push over 1 minute'
                })}
                    ${uiBuilder.createResultItem({
                    label: 'Step 2: Continuous Infusion',
                    value: infusion.toFixed(1),
                    unit: 'mg',
                    interpretation: `Rate: ${infusionRate.toFixed(1)} mg/hr over 60 minutes`
                })}
                `;
                resultBox.classList.add('show');
            } catch (error) {
                const errorContainer = container.querySelector('#tpa-error-container');
                if (errorContainer) {
                    displayError(errorContainer, error);
                } else {
                    console.error(error);
                }
                logError(error, { calculator: 'tpa-dosing-stroke', action: 'calculate' });
                resultBox.classList.remove('show');
            }
        };

        weightInput.addEventListener('input', calculate);
        symptomOnsetInput.addEventListener('input', calculate);
        // Also listen for unit changes if feasible, normally unitToggle doesn't expose clean event without deeper UI integration
        container.querySelectorAll('select').forEach(s => s.addEventListener('change', calculate));

        if (client) {
            getMostRecentObservation(client, LOINC_CODES.WEIGHT).then(weightObs => {
                if (weightObs?.valueQuantity) {
                    // Try to populate correctly
                    const val = weightObs.valueQuantity.value;
                    const unit = weightObs.valueQuantity.unit || 'kg';
                    // We can utilize UnitConverter to standardize to input's current unit if we want,
                    // or just set value if we know it matches default.
                    // For now, simple fallback or use UnitConverter in 'initialize' could be complex if units mismatch UI default.
                    // But assume kg for simplicity or:

                    const kgValue = UnitConverter.convert(val, unit, 'kg', 'weight');
                    if (kgValue !== null) {
                        weightInput.value = kgValue.toFixed(1);
                        calculate();
                        stalenessTracker.trackObservation('#weight', weightObs, LOINC_CODES.WEIGHT, 'Weight');
                    }
                }
            }).catch(e => console.warn(e));
        }

        calculate();
    }
};
