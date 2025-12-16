import { getMostRecentObservation } from '../../utils.js';
import { calculateIntraopFluid } from './calculation.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { ValidationRules, validateCalculatorInput } from '../../validator.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';

export const intraopFluid = {
    id: 'intraop-fluid',
    title: 'Intraoperative Fluid Dosing in Adult Patients',
    description: 'Doses IV fluids intraoperatively.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>

            ${uiBuilder.createAlert({
            type: 'warning',
            message: '<strong>IMPORTANT:</strong> This dosing tool is intended to assist with calculation, not to provide comprehensive or definitive drug information. Always double-check dosing.'
        })}
            
            ${uiBuilder.createAlert({
            type: 'info',
            message: '<strong>INSTRUCTIONS:</strong> Use in patients undergoing surgery who weigh >10 kg and do not have conditions that could otherwise result in fluid overload such as heart failure, COPD, or kidney failure on dialysis.'
        })}

            ${uiBuilder.createSection({
            title: 'Patient Parameters',
            content: `
                    ${uiBuilder.createInput({
                id: 'ifd-weight',
                label: 'Weight',
                type: 'number',
                placeholder: 'e.g., 70',
                unitToggle: { type: 'weight', units: ['kg', 'lbs'] }
            })}
                    ${uiBuilder.createInput({
                id: 'ifd-npo',
                label: 'Time spent NPO',
                unit: 'hours',
                type: 'number',
                placeholder: 'e.g., 8'
            })}
                `
        })}

            ${uiBuilder.createSection({
            title: 'Surgical Factors',
            content: uiBuilder.createRadioGroup({
                name: 'ifd-trauma',
                label: 'Estimated severity of trauma to tissue',
                options: [
                    { value: '4', label: 'Minimal (e.g. hernia repair, laparoscopy) (4 mL/kg/hr)' },
                    { value: '6', label: 'Moderate (e.g. open cholecystectomy) (6 mL/kg/hr)' },
                    { value: '8', label: 'Severe (e.g. bowel resection) (8 mL/kg/hr)' }
                ]
            })
        })}

            <div id="ifd-result" class="ui-result-box">
                <div class="ui-result-header">Fluid Requirements</div>
                <div class="ui-result-content"></div>
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const weightInput = container.querySelector('#ifd-weight');
        const npoInput = container.querySelector('#ifd-npo');
        const resultBox = container.querySelector('#ifd-result');
        const resultContent = resultBox.querySelector('.ui-result-content');

        const calculate = () => {
            // Clear previous errors
            const existingError = container.querySelector('#ifd-error');
            if (existingError) existingError.remove();

            const weightKg = UnitConverter.getStandardValue(weightInput, 'kg');
            const npoHours = parseFloat(npoInput.value);
            const traumaRadio = container.querySelector('input[name="ifd-trauma"]:checked');

            try {
                // Validation inputs
                const inputs = { weight: weightKg, hours: npoHours };
                const schema = {
                    weight: { ...ValidationRules.weight, min: 10, message: 'Weight must be > 10 kg for this calculator.' },
                    hours: ValidationRules.hours
                };
                const validation = validateCalculatorInput(inputs, schema);

                if (!validation.isValid) {
                    // Filter required errors if empty
                    if (weightInput.value || npoInput.value) {
                        const meaningfulErrors = validation.errors.filter(e => !e.includes('required') || (weightInput.value && npoInput.value));
                        if (meaningfulErrors.length > 0 && !isNaN(weightKg) && !isNaN(npoHours)) {
                            let errorContainer = document.createElement('div');
                            errorContainer.id = 'ifd-error';
                            resultBox.parentNode.insertBefore(errorContainer, resultBox);
                            displayError(errorContainer, new ValidationError(meaningfulErrors[0], 'VALIDATION_ERROR'));
                        }
                    }

                    resultBox.classList.remove('show');
                    return;
                }

                if (!traumaRadio) return;

                const traumaLevel = parseFloat(traumaRadio.value);

                const result = calculateIntraopFluid({
                    weightKg,
                    npoHours,
                    traumaLevel
                });

                const {
                    maintenanceRate,
                    npoDeficit,
                    firstHourFluids,
                    secondHourFluids,
                    thirdHourFluids,
                    fourthHourFluids
                } = result;

                resultContent.innerHTML = `
                    ${uiBuilder.createResultItem({
                    label: 'Hourly Maintenance Fluid',
                    value: maintenanceRate.toFixed(0),
                    unit: 'mL/hr'
                })}
                    ${uiBuilder.createResultItem({
                    label: 'NPO Fluid Deficit',
                    value: npoDeficit.toFixed(0),
                    unit: 'mL'
                })}
                    ${uiBuilder.createResultItem({
                    label: '1st Hour Fluids',
                    value: firstHourFluids.toFixed(0),
                    unit: 'mL/hr',
                    interpretation: '50% Deficit + Maint + Trauma'
                })}
                    ${uiBuilder.createResultItem({
                    label: '2nd Hour Fluids',
                    value: secondHourFluids.toFixed(0),
                    unit: 'mL/hr',
                    interpretation: '25% Deficit + Maint + Trauma'
                })}
                    ${uiBuilder.createResultItem({
                    label: '3rd Hour Fluids',
                    value: thirdHourFluids.toFixed(0),
                    unit: 'mL/hr',
                    interpretation: '25% Deficit + Maint + Trauma'
                })}
                    ${uiBuilder.createResultItem({
                    label: '4th Hour & Beyond',
                    value: fourthHourFluids.toFixed(0),
                    unit: 'mL/hr',
                    interpretation: 'Maintenance + Trauma'
                })}
                `;
                resultBox.classList.add('show');
            } catch (error) {
                logError(error, { calculator: 'intraop-fluid', action: 'calculate' });
                if (error.name !== 'ValidationError') {
                    let errorContainer = container.querySelector('#ifd-error');
                    if (!errorContainer) {
                        errorContainer = document.createElement('div');
                        errorContainer.id = 'ifd-error';
                        resultBox.parentNode.insertBefore(errorContainer, resultBox);
                    }
                    displayError(errorContainer, error);
                }
                resultBox.classList.remove('show');
            }
        };

        if (client) {
            getMostRecentObservation(client, LOINC_CODES.WEIGHT).then(obs => {
                if (obs && obs.valueQuantity) {
                    weightInput.value = obs.valueQuantity.value.toFixed(1);
                    weightInput.dispatchEvent(new Event('input'));
                }
            });
        }

        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculate);
            input.addEventListener('change', calculate); // For radio buttons and unit toggles (if they bubbled)
        });

        // Specifically listen to radio change since inputs selector might miss dynamic ones or behavior differs
        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', calculate);
        });
    }
};
