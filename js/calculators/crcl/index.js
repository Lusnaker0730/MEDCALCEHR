import {
    getMostRecentObservation,
    calculateAge,
} from '../../utils.js';
import { createStalenessTracker } from '../../data-staleness.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { ValidationRules, validateCalculatorInput } from '../../validator.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';

export const crcl = {
    id: 'crcl',
    title: 'Creatinine Clearance (Cockcroft-Gault Equation)',
    description: 'Calculates CrCl according to the Cockcroft-Gault equation.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            ${uiBuilder.createSection({
            title: 'Patient Information',
            icon: '👤',
            content: `
                    ${uiBuilder.createRadioGroup({
                name: 'crcl-gender',
                label: 'Gender',
                options: [
                    { value: 'male', label: 'Male', checked: true },
                    { value: 'female', label: 'Female' }
                ]
            })}
                    ${uiBuilder.createInput({
                id: 'crcl-age',
                label: 'Age',
                type: 'number',
                unit: 'years',
                placeholder: 'e.g., 65'
            })}
                    ${uiBuilder.createInput({
                id: 'crcl-weight',
                label: 'Weight',
                type: 'number',
                placeholder: 'e.g., 70',
                unitToggle: {
                    type: 'weight',
                    units: ['kg', 'lbs'],
                    defaultUnit: 'kg'
                }
            })}
                `
        })}
            
            ${uiBuilder.createSection({
            title: 'Lab Values',
            icon: '🧪',
            content: uiBuilder.createInput({
                id: 'crcl-scr',
                label: 'Serum Creatinine',
                type: 'number',
                placeholder: 'e.g., 1.0',
                unitToggle: {
                    type: 'creatinine',
                    units: ['mg/dL', 'µmol/L'],
                    defaultUnit: 'mg/dL'
                }
            })
        })}
            
            <div id="crcl-error-container"></div>
            
            <div id="crcl-result" class="ui-result-box">
                <div class="ui-result-header">Creatinine Clearance Results</div>
                <div class="ui-result-content"></div>
            </div>

            ${uiBuilder.createFormulaSection({
            items: [
                { label: 'Male', formula: '[(140 - Age) × Weight] / (72 × Serum Creatinine)' },
                { label: 'Female', formula: '[(140 - Age) × Weight × 0.85] / (72 × Serum Creatinine)' }
            ]
        })}

            ${uiBuilder.createAlert({
            type: 'info',
            message: `
                    <h4>Note:</h4>
                    <ul style="margin-top: 5px; padding-left: 20px;">
                        <li>This formula estimates creatinine clearance, not GFR.</li>
                        <li>May overestimate clearance in elderly patients.</li>
                    </ul>
                `
        })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        // Initialize staleness tracker
        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);

        const ageInput = container.querySelector('#crcl-age');
        const weightInput = container.querySelector('#crcl-weight');
        const scrInput = container.querySelector('#crcl-scr');
        const resultBox = container.querySelector('#crcl-result');

        const calculateAndUpdate = () => {
            // Clear previous errors
            const errorContainer = container.querySelector('#crcl-error-container');
            if (errorContainer) errorContainer.innerHTML = '';

            const age = parseFloat(ageInput.value);
            const weightKg = UnitConverter.getStandardValue(weightInput, 'kg');
            const scrMgDl = UnitConverter.getStandardValue(scrInput, 'mg/dL');
            const gender = container.querySelector('input[name="crcl-gender"]:checked')?.value || 'male';

            try {
                // Validation inputs
                const inputs = { age, weight: weightKg, creatinine: scrMgDl };
                const schema = {
                    age: ValidationRules.age,
                    weight: ValidationRules.weight,
                    creatinine: ValidationRules.creatinine
                };

                const validation = validateCalculatorInput(inputs, schema);

                if (!validation.isValid) {
                    const hasInput = (ageInput.value || weightInput.value || scrInput.value);

                    if (hasInput) {
                        const valuesPresent = !isNaN(age) && !isNaN(weightKg) && !isNaN(scrMgDl);
                        if (valuesPresent || validation.errors.some(e => !e.includes('required'))) {
                            if (errorContainer) displayError(errorContainer, new ValidationError(validation.errors[0], 'VALIDATION_ERROR'));
                        }
                    }

                    resultBox.classList.remove('show');
                    return;
                }

                let crcl = ((140 - age) * weightKg) / (72 * scrMgDl);
                if (gender === 'female') {
                    crcl *= 0.85;
                }

                if (!isFinite(crcl) || isNaN(crcl)) throw new Error("Calculation Error");

                let category = '';
                let severityClass = 'ui-alert-success';
                let alertType = 'info';
                let alertMsg = '';

                if (crcl >= 90) {
                    category = 'Normal kidney function';
                    severityClass = 'ui-alert-success';
                    alertMsg = 'Normal creatinine clearance.';
                } else if (crcl >= 60) {
                    category = 'Mild reduction';
                    severityClass = 'ui-alert-success';
                    alertMsg = 'Mildly reduced creatinine clearance.';
                } else if (crcl >= 30) {
                    category = 'Moderate reduction';
                    severityClass = 'ui-alert-warning';
                    alertMsg = 'Moderate reduction in kidney function. Consider nephrology referral and dose adjustment for renally cleared medications.';
                    alertType = 'warning';
                } else if (crcl >= 15) {
                    category = 'Severe reduction';
                    severityClass = 'ui-alert-danger';
                    alertMsg = 'Severe reduction in kidney function. Nephrology referral required. Careful medication dosing adjustments necessary.';
                    alertType = 'danger';
                } else {
                    category = 'Kidney failure';
                    severityClass = 'ui-alert-danger';
                    alertMsg = 'Kidney failure. Consider dialysis or transplantation. Avoid renally cleared medications.';
                    alertType = 'danger';
                }

                const resultContent = resultBox.querySelector('.ui-result-content');
                resultContent.innerHTML = `
                    ${uiBuilder.createResultItem({
                    label: 'Creatinine Clearance',
                    value: crcl.toFixed(1),
                    unit: 'mL/min',
                    interpretation: category,
                    alertClass: severityClass
                })}
                    ${uiBuilder.createAlert({
                    type: alertType,
                    message: alertMsg
                })}
                `;
                resultBox.classList.add('show');
            } catch (error) {
                logError(error, { calculator: 'crcl', action: 'calculate' });
                if (errorContainer) displayError(errorContainer, error);
                resultBox.classList.remove('show');
            }
        };

        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculateAndUpdate);
            input.addEventListener('change', calculateAndUpdate);
        });

        if (patient) {
            if (patient.birthDate) {
                ageInput.value = calculateAge(patient.birthDate);
            }
            if (patient.gender) {
                const genderValue = patient.gender.toLowerCase() === 'female' ? 'female' : 'male';
                const genderRadio = container.querySelector(`input[name="crcl-gender"][value="${genderValue}"]`);
                if (genderRadio) {
                    genderRadio.checked = true;
                    genderRadio.dispatchEvent(new Event('change'));
                }
            }
        }

        if (client) {
            getMostRecentObservation(client, LOINC_CODES.WEIGHT).then(obs => {
                if (obs && obs.valueQuantity) {
                    const val = obs.valueQuantity.value;
                    const unit = obs.valueQuantity.unit || 'kg';
                    const converted = UnitConverter.convert(val, unit, 'kg', 'weight');
                    if (converted !== null) {
                        weightInput.value = converted.toFixed(1);
                        weightInput.dispatchEvent(new Event('input'));
                        stalenessTracker.trackObservation('#crcl-weight', obs, LOINC_CODES.WEIGHT, 'Weight');
                    }
                }
            }).catch(e => console.warn(e));

            getMostRecentObservation(client, LOINC_CODES.CREATININE).then(obs => {
                if (obs && obs.valueQuantity) {
                    const val = obs.valueQuantity.value;
                    const unit = obs.valueQuantity.unit || 'mg/dL';
                    const converted = UnitConverter.convert(val, unit, 'mg/dL', 'creatinine');

                    if (converted !== null) {
                        scrInput.value = converted.toFixed(2);
                        scrInput.dispatchEvent(new Event('input'));
                        stalenessTracker.trackObservation('#crcl-scr', obs, LOINC_CODES.CREATININE, 'Serum Creatinine');
                    }
                }
            }).catch(e => console.warn(e));
        }

        // Initial calculation
        calculateAndUpdate();
    }
};
