import { getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { createStalenessTracker } from '../../data-staleness.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { ValidationRules, validateCalculatorInput } from '../../validator.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';

interface CalculatorModule {
    id: string;
    title: string;
    description: string;
    generateHTML: () => string;
    initialize: (client: any, patient: any, container: HTMLElement) => void;
}

export const ibw: CalculatorModule = {
    id: 'ibw',
    title: 'Ideal & Adjusted Body Weight',
    description: 'Calculates ideal body weight (IBW) and adjusted body weight (ABW) using the Devine formula.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            ${uiBuilder.createSection({
            title: 'Patient Information',
            content: `
                    ${uiBuilder.createRadioGroup({
                name: 'ibw-gender',
                label: 'Gender',
                options: [
                    { label: 'Male', value: 'male', checked: true },
                    { label: 'Female', value: 'female' }
                ]
            })}
                    ${uiBuilder.createInput({
                id: 'ibw-height',
                label: 'Height',
                type: 'number',
                unit: 'cm',
                placeholder: 'Enter height'
            })}
                    ${uiBuilder.createInput({
                id: 'ibw-actual',
                label: 'Actual Weight',
                type: 'number',
                unit: 'kg',
                placeholder: 'Enter weight'
            })}
                `
        })}
            
            <div id="ibw-error-container"></div>
            ${uiBuilder.createResultBox({ id: 'ibw-result', title: 'Body Weight Results' })}
            
            ${uiBuilder.createFormulaSection({
            items: [
                { label: 'IBW (Male)', formula: '50 + 2.3 × (height in inches - 60)' },
                { label: 'IBW (Female)', formula: '45.5 + 2.3 × (height in inches - 60)' },
                { label: 'ABW', formula: 'IBW + 0.4 × (Actual Weight - IBW)' }
            ]
        })}
            <p style="margin-top: 10px; font-size: 0.9em; color: #666;">
                <strong>Note:</strong> ABW is calculated only when actual weight exceeds IBW.
            </p>
            ${uiBuilder.createAlert({
            type: 'info',
            message: `
                    <h4>Clinical Applications</h4>
                    <ul>
                        <li><strong>Ideal Body Weight (IBW):</strong> Drug dosing for medications with narrow therapeutic index, nutritional assessment, ventilator settings.</li>
                        <li><strong>Adjusted Body Weight (ABW):</strong> Drug dosing in obese patients (actual weight > IBW), aminoglycoside dosing.</li>
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

        const heightInput = container.querySelector('#ibw-height') as HTMLInputElement;
        const actualWeightInput = container.querySelector('#ibw-actual') as HTMLInputElement;
        const resultBox = container.querySelector('#ibw-result');

        const calculate = () => {
            // Clear previous errors
            const errorContainer = container.querySelector('#ibw-error-container');
            if (errorContainer) errorContainer.innerHTML = '';

            const heightCm = parseFloat(heightInput.value);
            const actualWeight = parseFloat(actualWeightInput.value);
            const genderRadio = container.querySelector('input[name="ibw-gender"]:checked') as HTMLInputElement;
            const isMale = genderRadio ? genderRadio.value === 'male' : true;

            try {
                // Validation inputs
                const inputs = {
                    height: heightCm,
                    weight: actualWeight
                };
                const schema = {
                    height: ValidationRules.height,
                    weight: ValidationRules.weight
                };

                // @ts-ignore
                const validation = validateCalculatorInput(inputs, schema);

                if (!validation.isValid) {
                    const hasInput = (heightInput.value || actualWeightInput.value);

                    if (hasInput) {
                        const valuesPresent = !isNaN(heightCm) && !isNaN(actualWeight);
                        if (valuesPresent || validation.errors.some((e: string) => !e.includes('required'))) {
                            if (errorContainer) displayError(errorContainer as HTMLElement, new ValidationError(validation.errors[0], 'VALIDATION_ERROR'));
                        }
                    }
                    if (resultBox) resultBox.classList.remove('show');
                    return;
                }

                const heightIn = heightCm / 2.54;
                let ibw = 0;
                if (heightIn > 60) {
                    if (isMale) {
                        ibw = 50 + 2.3 * (heightIn - 60);
                    } else {
                        ibw = 45.5 + 2.3 * (heightIn - 60);
                    }
                } else {
                    ibw = isMale ? 50 : 45.5;
                }

                if (ibw <= 0) throw new Error("Calculated IBW is non-positive. Check height.");

                let resultItems: string[] = [];
                resultItems.push(uiBuilder.createResultItem({
                    label: 'Ideal Body Weight (IBW)',
                    value: ibw.toFixed(1),
                    unit: 'kg'
                }));

                if (!isNaN(actualWeight) && actualWeight > 0) {
                    if (actualWeight > ibw) {
                        const adjBw = ibw + 0.4 * (actualWeight - ibw);
                        const percentOver = (((actualWeight - ibw) / ibw) * 100).toFixed(0);

                        resultItems.push(uiBuilder.createResultItem({
                            label: 'Adjusted Body Weight (ABW)',
                            value: adjBw.toFixed(1),
                            unit: 'kg'
                        }));

                        resultItems.push(uiBuilder.createAlert({
                            type: 'info',
                            message: `Actual weight is ${percentOver}% above IBW. Use ABW for drug dosing in obese patients.`
                        }));
                    } else if (actualWeight < ibw) {
                        const percentUnder = (((ibw - actualWeight) / ibw) * 100).toFixed(0);
                        resultItems.push(uiBuilder.createAlert({
                            type: 'warning',
                            message: `Actual weight is ${percentUnder}% below IBW. Use actual body weight for drug dosing.`
                        }));
                    } else {
                        resultItems.push(uiBuilder.createAlert({
                            type: 'info',
                            message: 'Actual weight is at ideal body weight. Use IBW for drug dosing.'
                        }));
                    }
                }

                if (resultBox) {
                    const resultContent = resultBox.querySelector('.ui-result-content');
                    if (resultContent) {
                        resultContent.innerHTML = resultItems.join('');
                    }
                    resultBox.classList.add('show');
                }
            } catch (error) {
                logError(error as Error, { calculator: 'ibw', action: 'calculate' });
                if (errorContainer) displayError(errorContainer as HTMLElement, error as Error);
                if (resultBox) resultBox.classList.remove('show');
            }
        };

        [heightInput, actualWeightInput].forEach(input => input.addEventListener('input', calculate));
        container.querySelectorAll('input[name="ibw-gender"]').forEach(radio => radio.addEventListener('change', calculate));

        // Set gender from patient data
        if (patient && patient.gender) {
            const genderValue = patient.gender.toLowerCase() === 'female' ? 'female' : 'male';
            const genderRadio = container.querySelector(`input[name="ibw-gender"][value="${genderValue}"]`) as HTMLInputElement;
            if (genderRadio) {
                genderRadio.checked = true;
                genderRadio.dispatchEvent(new Event('change'));
            }
        }

        // Auto-populate from FHIR
        if (client) {
            getMostRecentObservation(client, LOINC_CODES.HEIGHT).then(obs => {
                if (obs && obs.valueQuantity) {
                    const val = obs.valueQuantity.value;
                    const unit = obs.valueQuantity.unit || 'cm';
                    const converted = UnitConverter.convert(val, unit, 'cm', 'height');
                    if (converted !== null) {
                        heightInput.value = converted.toFixed(1);
                    } else {
                        heightInput.value = val.toFixed(1);
                    }
                    calculate();

                    stalenessTracker.trackObservation('#ibw-height', obs, LOINC_CODES.HEIGHT, 'Height');
                }
            }).catch(e => console.warn(e));

            getMostRecentObservation(client, LOINC_CODES.WEIGHT).then(obs => {
                if (obs && obs.valueQuantity) {
                    const val = obs.valueQuantity.value;
                    const unit = obs.valueQuantity.unit || 'kg';
                    const converted = UnitConverter.convert(val, unit, 'kg', 'weight');
                    if (converted !== null) {
                        actualWeightInput.value = converted.toFixed(1);
                    } else {
                        actualWeightInput.value = val.toFixed(1);
                    }
                    calculate();

                    stalenessTracker.trackObservation('#ibw-actual', obs, LOINC_CODES.WEIGHT, 'Weight');
                }
            }).catch(e => console.warn(e));
        }

        calculate();
    }
};
