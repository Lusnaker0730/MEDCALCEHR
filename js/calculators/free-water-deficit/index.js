import {
    getMostRecentObservation,
} from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { ValidationRules, validateCalculatorInput } from '../../validator.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';

export const freeWaterDeficit = {
    id: 'free-water-deficit',
    title: 'Free Water Deficit in Hypernatremia',
    description: 'Calculates free water deficit by estimated total body water in a patient with hypernatremia or dehydration.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            ${uiBuilder.createSection({
            title: 'Patient Data',
            icon: '👤',
            content: `
                    ${uiBuilder.createInput({
                id: 'fwd-weight',
                label: 'Weight',
                type: 'number',
                placeholder: 'e.g., 70',
                unitToggle: {
                    type: 'weight',
                    units: ['kg', 'lbs'],
                    defaultUnit: 'kg'
                }
            })}
                    ${uiBuilder.createInput({
                id: 'fwd-sodium',
                label: 'Serum Sodium',
                type: 'number',
                placeholder: 'e.g., 160',
                unitToggle: {
                    type: 'sodium',
                    units: ['mEq/L', 'mmol/L'],
                    defaultUnit: 'mEq/L'
                }
            })}
                    ${uiBuilder.createRadioGroup({
                name: 'fwd-gender',
                label: 'Gender / Type',
                options: [
                    { value: 'male', label: 'Adult Male', checked: true },
                    { value: 'female', label: 'Adult Female' },
                    { value: 'elderly', label: 'Elderly Male' },
                    { value: 'elderly_female', label: 'Elderly Female' },
                    { value: 'child', label: 'Child' }
                ],
                helpText: 'Determines Total Body Water (TBW) factor.'
            })}
                `
        })}
            
            <div id="fwd-result" class="ui-result-box">
                <div class="ui-result-header">Free Water Deficit</div>
                <div class="ui-result-content"></div>
            </div>
            
            ${uiBuilder.createFormulaSection({
            items: [
                { label: 'Free Water Deficit (L)', formula: 'TBW × [(Current Na / 140) - 1]' },
                { label: 'TBW (Total Body Water)', formula: 'Weight (kg) × Factor' }
            ]
        })}

            ${uiBuilder.createAlert({
            type: 'info',
            message: `
                    <h4>TBW Factors:</h4>
                    <ul style="margin-top: 5px; padding-left: 20px;">
                        <li>Adult Male: 0.6</li>
                        <li>Adult Female: 0.5</li>
                        <li>Elderly Male: 0.5</li>
                        <li>Elderly Female: 0.45</li>
                        <li>Child: 0.6</li>
                    </ul>
                `
        })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const weightInput = container.querySelector('#fwd-weight');
        const sodiumInput = container.querySelector('#fwd-sodium');
        const resultBox = container.querySelector('#fwd-result');
        const resultContent = resultBox.querySelector('.ui-result-content');

        const calculateAndUpdate = () => {
            // Clear previous errors
            const existingError = container.querySelector('#fwd-error');
            if (existingError) existingError.remove();

            const weightKg = UnitConverter.getStandardValue(weightInput, 'kg');
            const sodium = parseFloat(sodiumInput.value);
            const genderType = container.querySelector('input[name="fwd-gender"]:checked')?.value || 'male';

            try {
                // Validation inputs
                const inputs = {
                    weight: weightKg,
                    sodium: sodium
                };
                const schema = {
                    weight: ValidationRules.weight,
                    sodium: ValidationRules.sodium
                };

                const validation = validateCalculatorInput(inputs, schema);

                if (!validation.isValid) {
                    const hasInput = (weightInput.value || sodiumInput.value);

                    if (hasInput) {
                        const requiredPresent = !isNaN(weightKg) && !isNaN(sodium);
                        if (requiredPresent || validation.errors.some(e => !e.includes('required'))) {
                            let errorContainer = document.createElement('div');
                            errorContainer.id = 'fwd-error';
                            resultBox.parentNode.insertBefore(errorContainer, resultBox);
                            displayError(errorContainer, new ValidationError(validation.errors[0], 'VALIDATION_ERROR'));
                        }
                    }

                    resultBox.classList.remove('show');
                    return;
                }

                // Determine TBW factor
                let tbwFactor = 0.6;
                switch (genderType) {
                    case 'male': tbwFactor = 0.6; break;
                    case 'female': tbwFactor = 0.5; break;
                    case 'elderly': tbwFactor = 0.5; break;
                    case 'elderly_female': tbwFactor = 0.45; break;
                    case 'child': tbwFactor = 0.6; break;
                }

                const totalBodyWater = weightKg * tbwFactor;
                const deficit = totalBodyWater * ((sodium / 140) - 1);

                if (!isFinite(deficit) || isNaN(deficit)) throw new Error("Calculation Error");

                let status = '';
                let alertType = 'success';
                let alertMsg = '';

                if (sodium <= 140) {
                    status = 'Not Indicated';
                    alertType = 'warning';
                    alertMsg = 'Calculation intended for hypernatremia (Na > 140).';
                } else {
                    status = 'Hypernatremia';
                    alertType = 'danger'; // High risk
                    alertMsg = 'Correction should be slow (e.g., over 48-72 hours) to avoid cerebral edema. Max rate ~0.5 mEq/L/hr.';
                }

                resultContent.innerHTML = `
                    ${uiBuilder.createResultItem({
                    label: 'Free Water Deficit',
                    value: deficit > 0 ? deficit.toFixed(1) : '0.0',
                    unit: 'Liters',
                    interpretation: status,
                    alertClass: `ui-alert-${alertType}`
                })}
                    ${uiBuilder.createResultItem({
                    label: 'Estimated TBW',
                    value: totalBodyWater.toFixed(1),
                    unit: 'Liters'
                })}
                    ${uiBuilder.createAlert({
                    type: alertType,
                    message: alertMsg
                })}
                `;
                resultBox.classList.add('show');
            } catch (error) {
                logError(error, { calculator: 'free-water-deficit', action: 'calculate' });
                if (error.name !== 'ValidationError') {
                    let errorContainer = container.querySelector('#fwd-error');
                    if (!errorContainer) {
                        errorContainer = document.createElement('div');
                        errorContainer.id = 'fwd-error';
                        resultBox.parentNode.insertBefore(errorContainer, resultBox);
                    }
                    displayError(errorContainer, error);
                }
                resultBox.classList.remove('show');
            }
        };

        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculateAndUpdate);
            input.addEventListener('change', calculateAndUpdate);
        });

        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', calculateAndUpdate);
        });

        // Auto-populate from FHIR
        if (client) {
            getMostRecentObservation(client, LOINC_CODES.WEIGHT).then(obs => {
                if (obs && obs.valueQuantity) {
                    // Assuming standard kg, unit converter handles toggle
                    const val = obs.valueQuantity.value;
                    weightInput.value = val.toFixed(1);
                    weightInput.dispatchEvent(new Event('input'));
                }
            });
            getMostRecentObservation(client, LOINC_CODES.SODIUM).then(obs => {
                if (obs && obs.valueQuantity) {
                    sodiumInput.value = obs.valueQuantity.value.toFixed(0);
                    sodiumInput.dispatchEvent(new Event('input'));
                }
            });
        }

        // Initial patient data (gender)
        if (patient && patient.gender) {
            const genderVal = patient.gender.toLowerCase();
            // Simple mapping - try to check if radio exists
            const genderRadio = container.querySelector(`input[name="fwd-gender"][value="${genderVal}"]`);
            if (genderRadio) {
                genderRadio.checked = true;
                genderRadio.dispatchEvent(new Event('change'));
            }
        }

    }
};
