import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { ValidationRules, validateCalculatorInput } from '../../validator.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';
import { fhirDataService } from '../../fhir-data-service.js';
export const abl = {
    id: 'abl',
    title: 'Maximum Allowable Blood Loss (ABL) Without Transfusion',
    description: 'Calculates the allowable blood loss for a patient before a transfusion may be indicated.',
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
                unitToggle: { type: 'weight', units: ['kg', 'lbs'], default: 'kg' }
            })}
                    ${uiBuilder.createInput({
                id: 'abl-hgb-initial',
                label: 'Initial Hemoglobin',
                type: 'number',
                step: 0.1,
                placeholder: 'e.g., 14',
                unitToggle: { type: 'hemoglobin', units: ['g/dL', 'g/L', 'mmol/L'], default: 'g/dL' }
            })}
                    ${uiBuilder.createInput({
                id: 'abl-hgb-final',
                label: 'Target/Allowable Hemoglobin',
                type: 'number',
                step: 0.1,
                placeholder: 'e.g., 7',
                unitToggle: { type: 'hemoglobin', units: ['g/dL', 'g/L', 'mmol/L'], default: 'g/dL' }
            })}
                `
        })}

            <div id="abl-error-container"></div>
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
        // Initialize FHIRDataService
        fhirDataService.initialize(client, patient, container);
        const weightInput = container.querySelector('#abl-weight');
        const hgbInitialInput = container.querySelector('#abl-hgb-initial');
        const hgbFinalInput = container.querySelector('#abl-hgb-final');
        const categorySelect = container.querySelector('#abl-age-category');
        const resultBox = container.querySelector('#abl-result');
        const resultContent = resultBox ? resultBox.querySelector('.ui-result-content') : null;
        const calculate = () => {
            const errorContainer = container.querySelector('#abl-error-container');
            if (errorContainer)
                errorContainer.innerHTML = '';
            const weightKg = UnitConverter.getStandardValue(weightInput, 'kg'); // Returns null if invalid input
            const hgbInitial = UnitConverter.getStandardValue(hgbInitialInput, 'g/dL');
            const hgbFinal = UnitConverter.getStandardValue(hgbFinalInput, 'g/dL');
            const avgBloodVolume = parseFloat(categorySelect.value);
            try {
                // Validation inputs - ValidationRules expect valid input or undefined?
                // validateCalculatorInput usually expects inputs object.
                // We should cast null values to something invalid or check existence first if strictly typed.
                // Assuming validateCalculatorInput handles null or isNaN checks if defined in rules.
                // If weightKg is null, it means input is empty or invalid. 
                // We treat it as NaN/undefined for validation purpose if needed?
                // Actually, if we pass null, validation might fail type check if rules expect number.
                const inputs = {
                    weight: weightKg !== null ? weightKg : NaN,
                    hgbInitial: hgbInitial !== null ? hgbInitial : NaN,
                    hgbFinal: hgbFinal !== null ? hgbFinal : NaN
                };
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
                        const valuesPresent = weightKg !== null && hgbInitial !== null && hgbFinal !== null;
                        if (valuesPresent || validation.errors.some(e => !e.includes('required'))) {
                            if (errorContainer)
                                displayError(errorContainer, new ValidationError(validation.errors[0], 'VALIDATION_ERROR'));
                        }
                    }
                    if (resultBox)
                        resultBox.classList.remove('show');
                    return;
                }
                // Check valid range if not caught by validator (though validator should catch range)
                // Additional logical check:
                if (hgbInitial !== null && hgbFinal !== null && hgbInitial <= hgbFinal) {
                    if (errorContainer) {
                        // We can create a custom ValidationError or just display message
                        displayError(errorContainer, new Error("Initial hemoglobin must be greater than final/target hemoglobin."));
                    }
                    if (resultBox)
                        resultBox.classList.remove('show');
                    return;
                }
                if (weightKg === null || hgbInitial === null || hgbFinal === null) {
                    if (resultBox)
                        resultBox.classList.remove('show');
                    return;
                }
                const ebv = weightKg * avgBloodVolume; // Estimated Blood Volume in mL
                const hgbAvg = (hgbInitial + hgbFinal) / 2;
                const ablValue = (ebv * (hgbInitial - hgbFinal)) / hgbAvg;
                if (resultContent) {
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
                }
                if (resultBox)
                    resultBox.classList.add('show');
            }
            catch (error) {
                logError(error, { calculator: 'abl', action: 'calculate' });
                // Only show system errors, validation handled above
                if (error instanceof Error && error.name !== 'ValidationError') {
                    if (errorContainer) {
                        displayError(errorContainer, error);
                    }
                }
                if (resultBox)
                    resultBox.classList.remove('show');
            }
        };
        // Auto-populate from FHIR using FHIRDataService
        if (client) {
            fhirDataService.getObservation(LOINC_CODES.WEIGHT, { trackStaleness: true, stalenessLabel: 'Weight', targetUnit: 'kg', unitType: 'weight' }).then(result => {
                if (result.value !== null) {
                    weightInput.value = result.value.toFixed(1);
                    weightInput.dispatchEvent(new Event('input'));
                }
            }).catch(console.warn);
            fhirDataService.getObservation(LOINC_CODES.HEMOGLOBIN, { trackStaleness: true, stalenessLabel: 'Initial Hgb', targetUnit: 'g/dL', unitType: 'hemoglobin' }).then(result => {
                if (result.value !== null) {
                    hgbInitialInput.value = result.value.toFixed(1);
                    hgbInitialInput.dispatchEvent(new Event('input'));
                }
            }).catch(console.warn);
        }
        // Pre-select category based on patient data using FHIRDataService
        const ageYear = fhirDataService.getPatientAge() || 30;
        const gender = fhirDataService.getPatientGender();
        if (ageYear > 18) {
            categorySelect.value = gender === 'female' ? '65' : '75';
        }
        else if (ageYear <= 1) {
            categorySelect.value = '80'; // Infant
        }
        categorySelect.dispatchEvent(new Event('change'));
        // Add event listeners for auto-calculation
        container.querySelectorAll('input, select').forEach(el => {
            el.addEventListener('input', calculate);
            el.addEventListener('change', calculate);
        });
    }
};
