import {
    getMostRecentObservation,
    calculateAge,
} from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { ValidationRules, validateCalculatorInput } from '../../validator.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';

export const ckdEpi = {
    id: 'ckd-epi',
    title: 'CKD-EPI GFR (2021 Refit)',
    description: 'Estimates GFR using the CKD-EPI 2021 race-free equation, the recommended method for assessing kidney function.',
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
                name: 'ckd-epi-gender',
                label: 'Gender',
                options: [
                    { value: 'male', label: 'Male', checked: true },
                    { value: 'female', label: 'Female' }
                ]
            })}
                    ${uiBuilder.createInput({
                id: 'ckd-epi-age',
                label: 'Age',
                type: 'number',
                unit: 'years',
                placeholder: 'Enter age'
            })}
                `
        })}
            
            ${uiBuilder.createSection({
            title: 'Lab Values',
            icon: '🧪',
            content: uiBuilder.createInput({
                id: 'ckd-epi-creatinine',
                label: 'Serum Creatinine',
                type: 'number',
                placeholder: 'Enter creatinine',
                unitToggle: {
                    type: 'creatinine',
                    units: ['mg/dL', 'µmol/L'],
                    defaultUnit: 'mg/dL'
                }
            })
        })}
            
            <div id="ckd-epi-error-container"></div>
            
            <div id="ckd-epi-result" class="ui-result-box">
                <div class="ui-result-header">eGFR Results (CKD-EPI 2021)</div>
                <div class="ui-result-content"></div>
            </div>

            ${uiBuilder.createFormulaSection({
            items: [
                { label: 'Female', formula: '142 × min(Scr/0.7, 1)<sup>-0.241</sup> × max(Scr/0.7, 1)<sup>-1.200</sup> × 0.9938<sup>Age</sup> × 1.012' },
                { label: 'Male', formula: '142 × min(Scr/0.9, 1)<sup>-0.302</sup> × max(Scr/0.9, 1)<sup>-1.200</sup> × 0.9938<sup>Age</sup>' }
            ]
        })}

            ${uiBuilder.createAlert({
            type: 'info',
            message: `
                    <h4>Note:</h4>
                    <p>Scr = serum creatinine (mg/dL)</p>
                `
        })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const ageInput = container.querySelector('#ckd-epi-age');
        const creatinineInput = container.querySelector('#ckd-epi-creatinine');
        const resultBox = container.querySelector('#ckd-epi-result');

        const calculateAndUpdate = () => {
            // Clear previous errors
            const errorContainer = container.querySelector('#ckd-epi-error-container');
            if (errorContainer) errorContainer.innerHTML = '';

            const age = parseFloat(ageInput.value);
            const gender = container.querySelector('input[name="ckd-epi-gender"]:checked')?.value || 'male';

            // Get creatinine in mg/dL using UnitConverter
            const creatinineMgDl = UnitConverter.getStandardValue(creatinineInput, 'mg/dL');

            try {
                // Validate inputs
                const inputs = { age, creatinine: creatinineMgDl };
                const schema = {
                    age: ValidationRules.age,
                    creatinine: ValidationRules.creatinine
                };

                const validation = validateCalculatorInput(inputs, schema);

                if (!validation.isValid) {
                    const hasInput = ageInput.value || creatinineInput.value;

                    if (hasInput) {
                        const valuesPresent = !isNaN(age) && !isNaN(creatinineMgDl);
                        // Show error if values are present or at least one is clearly typed but invalid
                        if (valuesPresent || validation.errors.some(e => !e.includes('required'))) {
                            if (errorContainer) displayError(errorContainer, new ValidationError(validation.errors[0], 'VALIDATION_ERROR'));
                        }
                    }

                    resultBox.classList.remove('show');
                    return;
                }

                const kappa = gender === 'female' ? 0.7 : 0.9;
                const alpha = gender === 'female' ? -0.241 : -0.302;
                const genderFactor = gender === 'female' ? 1.012 : 1;

                const gfr = 142 *
                    Math.pow(Math.min(creatinineMgDl / kappa, 1), alpha) *
                    Math.pow(Math.max(creatinineMgDl / kappa, 1), -1.2) *
                    Math.pow(0.9938, age) *
                    genderFactor;

                if (!isFinite(gfr) || isNaN(gfr)) throw new Error("Calculation Error");

                // Determine stage and severity
                let stage = '';
                let severityClass = 'low';
                let alertType = 'info';
                let alertMsg = '';

                if (gfr >= 90) {
                    stage = 'Stage 1 (Normal or high)';
                    severityClass = 'ui-alert-success';
                    alertMsg = 'Normal kidney function.';
                } else if (gfr >= 60) {
                    stage = 'Stage 2 (Mild)';
                    severityClass = 'ui-alert-success';
                    alertMsg = 'Mildly decreased kidney function.';
                } else if (gfr >= 45) {
                    stage = 'Stage 3a (Mild to moderate)';
                    severityClass = 'ui-alert-warning';
                    alertMsg = 'Mild to moderate reduction in kidney function.';
                } else if (gfr >= 30) {
                    stage = 'Stage 3b (Moderate to severe)';
                    severityClass = 'ui-alert-warning';
                    alertMsg = 'Moderate to severe reduction in kidney function. Consider nephrology referral.';
                    alertType = 'warning';
                } else if (gfr >= 15) {
                    stage = 'Stage 4 (Severe)';
                    severityClass = 'ui-alert-danger';
                    alertMsg = 'Severe reduction in kidney function. Nephrology referral required.';
                    alertType = 'danger';
                } else {
                    stage = 'Stage 5 (Kidney failure)';
                    severityClass = 'ui-alert-danger';
                    alertMsg = 'Kidney failure. Consider dialysis or transplantation.';
                    alertType = 'danger';
                }

                const resultContent = resultBox.querySelector('.ui-result-content');
                resultContent.innerHTML = `
                    ${uiBuilder.createResultItem({
                    label: 'eGFR',
                    value: gfr.toFixed(0),
                    unit: 'mL/min/1.73m²',
                    interpretation: stage,
                    alertClass: severityClass
                })}
                    ${uiBuilder.createAlert({
                    type: alertType,
                    message: alertMsg
                })}
                `;
                resultBox.classList.add('show');
            } catch (error) {
                logError(error, { calculator: 'ckd-epi', action: 'calculate' });
                if (errorContainer) displayError(errorContainer, error);
                resultBox.classList.remove('show');
            }
        };

        // Event listeners
        container.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('input', calculateAndUpdate);
            input.addEventListener('change', calculateAndUpdate);
        });

        // Auto-populate
        if (patient) {
            if (patient.birthDate) {
                ageInput.value = calculateAge(patient.birthDate);
            }
            if (patient.gender) {
                const genderValue = patient.gender.toLowerCase() === 'female' ? 'female' : 'male';
                const genderRadio = container.querySelector(`input[name="ckd-epi-gender"][value="${genderValue}"]`);
                if (genderRadio) {
                    genderRadio.checked = true;
                    genderRadio.dispatchEvent(new Event('change'));
                }
            }
        }

        if (client) {
            getMostRecentObservation(client, LOINC_CODES.CREATININE).then(obs => {
                if (obs && obs.valueQuantity) {
                    const val = obs.valueQuantity.value;
                    const unit = obs.valueQuantity.unit || 'mg/dL';

                    // UnitConverter check
                    // If UI is default mg/dL, convert if necessary
                    const converted = UnitConverter.convert(val, unit, 'mg/dL', 'creatinine');
                    if (converted !== null) {
                        creatinineInput.value = converted.toFixed(2);
                        creatinineInput.dispatchEvent(new Event('input'));
                    }
                }
            }).catch(e => console.warn(e));
        }

        calculateAndUpdate();
    }
};
