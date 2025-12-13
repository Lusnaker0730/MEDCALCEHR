import { getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { ValidationRules, validateCalculatorInput } from '../../validator.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';

export const abl = {
    id: 'abl',
    title: 'Maximum Allowable Blood Loss (ABL) Without Transfusion',
    description:
        'Calculates the allowable blood loss for a patient before a transfusion may be indicated.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>

            ${uiBuilder.createSection({
            title: 'Patient Category',
            content: `
                    ${uiBuilder.createSelect({
                id: 'abl-age-category',
                label: 'Category',
                options: [
                    { value: '75', label: 'Adult man (75 mL/kg)' },
                    { value: '65', label: 'Adult woman (65 mL/kg)' },
                    { value: '80', label: 'Infant (80 mL/kg)' },
                    { value: '85', label: 'Neonate (85 mL/kg)' },
                    { value: '96', label: 'Premature neonate (96 mL/kg)' }
                ],
                helpText: 'Blood volume (mL/kg) varies by age and sex'
            })}
                `
        })}

            ${uiBuilder.createSection({
            title: 'Parameters',
            content: `
                    ${uiBuilder.createInput({
                id: 'abl-weight',
                label: 'Weight',
                type: 'number',
                placeholder: 'e.g., 70',
                unitToggle: { type: 'weight', units: ['kg', 'lbs'], defaultUnit: 'kg' }
            })}
                    ${uiBuilder.createInput({
                id: 'abl-hgb-initial',
                label: 'Initial Hemoglobin',
                type: 'number',
                step: '0.1',
                placeholder: 'e.g., 14',
                unitToggle: { type: 'hemoglobin', units: ['g/dL', 'g/L', 'mmol/L'], defaultUnit: 'g/dL' }
            })}
                    ${uiBuilder.createInput({
                id: 'abl-hgb-final',
                label: 'Target/Allowable Hemoglobin',
                type: 'number',
                step: '0.1',
                placeholder: 'e.g., 7',
                unitToggle: { type: 'hemoglobin', units: ['g/dL', 'g/L', 'mmol/L'], defaultUnit: 'g/dL' }
            })}
                `
        })}

            <div id="abl-result" class="ui-result-box">
                <div class="ui-result-header">ABL Results</div>
                <div class="ui-result-content"></div>
            </div>

            ${uiBuilder.createFormulaSection({
            items: [
                { label: 'Estimated Blood Volume (EBV)', content: 'Weight (kg) × Blood Volume (mL/kg)' },
                { label: 'Allowable Blood Loss (ABL)', content: 'EBV × (Hgb<sub>initial</sub> - Hgb<sub>final</sub>) / Hgb<sub>average</sub>' },
                { label: 'Average Hgb', content: '(Hgb<sub>initial</sub> + Hgb<sub>final</sub>) / 2' }
            ]
        })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const weightInput = container.querySelector('#abl-weight');
        const hgbInitialInput = container.querySelector('#abl-hgb-initial');
        const hgbFinalInput = container.querySelector('#abl-hgb-final');
        const categorySelect = container.querySelector('#abl-age-category');
        const resultBox = container.querySelector('#abl-result');
        const resultContent = resultBox.querySelector('.ui-result-content');

        const calculate = () => {
            // Clear previous errors
            const existingError = container.querySelector('#abl-error');
            if (existingError) existingError.remove();

            const weightKg = UnitConverter.getStandardValue(weightInput, 'kg');
            const hgbInitial = UnitConverter.getStandardValue(hgbInitialInput, 'g/dL');
            const hgbFinal = UnitConverter.getStandardValue(hgbFinalInput, 'g/dL');
            const avgBloodVolume = parseFloat(categorySelect.value);

            try {
                // Validation inputs
                const inputs = { weight: weightKg, hgbInitial: hgbInitial, hgbFinal: hgbFinal };
                const schema = {
                    weight: ValidationRules.weight,
                    hgbInitial: ValidationRules.hemoglobin,
                    hgbFinal: ValidationRules.hemoglobin
                };
                const validation = validateCalculatorInput(inputs, schema);

                if (!validation.isValid) {
                    // Only show if fields have values
                    const hasInput = (weightInput.value || hgbInitialInput.value || hgbFinalInput.value);
                    if (hasInput) {
                        const valuesPresent = !isNaN(weightKg) && !isNaN(hgbInitial) && !isNaN(hgbFinal);
                        if (valuesPresent || validation.errors.some(e => !e.includes('required'))) {
                            let errorContainer = document.createElement('div');
                            errorContainer.id = 'abl-error';
                            resultBox.parentNode.insertBefore(errorContainer, resultBox);
                            displayError(errorContainer, new ValidationError(validation.errors[0], 'VALIDATION_ERROR'));
                        }
                    }
                    resultBox.classList.remove('show');
                    return;
                }

                if (hgbInitial <= hgbFinal) {
                    throw new Error("Initial hemoglobin must be greater than final/target hemoglobin.");
                }

                const ebv = weightKg * avgBloodVolume; // Estimated Blood Volume in mL
                const hgbAvg = (hgbInitial + hgbFinal) / 2;
                const ablValue = (ebv * (hgbInitial - hgbFinal)) / hgbAvg;

                resultContent.innerHTML = `
                    ${uiBuilder.createResultItem({
                    label: 'Maximum Allowable Blood Loss',
                    value: ablValue.toFixed(0),
                    unit: 'mL',
                    alertClass: 'ui-alert-info'
                })}
                    ${uiBuilder.createResultItem({
                    label: 'Estimated Blood Volume (EBV)',
                    value: ebv.toFixed(0),
                    unit: 'mL'
                })}
                    ${uiBuilder.createResultItem({
                    label: 'Average Hemoglobin',
                    value: hgbAvg.toFixed(1),
                    unit: 'g/dL'
                })}
                `;
                resultBox.classList.add('show');
            } catch (error) {
                logError(error, { calculator: 'abl', action: 'calculate' });
                // Only show system errors, validation handled above
                if (error.name !== 'ValidationError') {
                    let errorContainer = container.querySelector('#abl-error');
                    if (!errorContainer) {
                        errorContainer = document.createElement('div');
                        errorContainer.id = 'abl-error';
                        resultBox.parentNode.insertBefore(errorContainer, resultBox);
                    }
                    displayError(errorContainer, error);
                }
                resultBox.classList.remove('show');
            }
        };

        // Auto-populate from FHIR
        getMostRecentObservation(client, LOINC_CODES.WEIGHT).then(obs => {
            if (obs && obs.valueQuantity) {
                weightInput.value = obs.valueQuantity.value.toFixed(1);
                weightInput.dispatchEvent(new Event('input'));
            }
        });
        getMostRecentObservation(client, LOINC_CODES.HEMOGLOBIN).then(obs => {
            if (obs && obs.valueQuantity) {
                hgbInitialInput.value = obs.valueQuantity.value.toFixed(1);
                hgbInitialInput.dispatchEvent(new Event('input'));
            }
        });

        // Pre-select category based on patient data
        if (patient) {
            const ageYear = patient.birthDate ? new Date().getFullYear() - new Date(patient.birthDate).getFullYear() : 30;
            if (ageYear > 18) {
                categorySelect.value = patient.gender === 'female' ? '65' : '75';
            }
            categorySelect.dispatchEvent(new Event('change'));
        }

        // Add event listeners for auto-calculation
        container.querySelectorAll('input, select').forEach(el => {
            el.addEventListener('input', calculate);
            el.addEventListener('change', calculate);
        });
    }
};
