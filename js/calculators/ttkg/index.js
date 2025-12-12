import { getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { ValidationRules, validateCalculatorInput } from '../../validator.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';

export const ttkg = {
    id: 'ttkg',
    title: 'Transtubular Potassium Gradient (TTKG)',
    description: 'May help in assessment of hyperkalemia or hypokalemia.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            ${uiBuilder.createSection({
            title: 'Lab Values',
            content: `
                    ${uiBuilder.createInput({
                id: 'ttkg-urine-k',
                label: 'Urine Potassium',
                type: 'number',
                unit: 'mEq/L'
            })}
                    ${uiBuilder.createInput({
                id: 'ttkg-serum-k',
                label: 'Serum Potassium',
                type: 'number',
                unit: 'mEq/L',
                placeholder: 'Norm: 3.5 - 5.2'
            })}
                    ${uiBuilder.createInput({
                id: 'ttkg-urine-osmo',
                label: 'Urine Osmolality',
                type: 'number',
                unit: 'mOsm/kg',
                placeholder: 'Norm: 500 - 800'
            })}
                    ${uiBuilder.createInput({
                id: 'ttkg-serum-osmo',
                label: 'Serum Osmolality',
                type: 'number',
                unit: 'mOsm/kg',
                placeholder: 'Norm: 275 - 295'
            })}
                `
        })}
            
            <div id="ttkg-result" class="ui-result-box">
                <div class="ui-result-header">Result</div>
                <div class="ui-result-content"></div>
            </div>

            ${uiBuilder.createFormulaSection({
            items: [
                {
                    label: 'TTKG Formula',
                    formula: 'TTKG = (Urine K × Serum Osmolality) / (Serum K × Urine Osmolality)'
                }
            ],
            notes: 'Valid only when Urine Osmolality > Serum Osmolality.'
        })}
            ${uiBuilder.createAlert({
            type: 'info',
            message: `
                    <h4>Clinical Interpretation</h4>
                    <ul>
                        <li><strong>Hypokalemia (K < 3.5):</strong>
                            <ul>
                                <li>TTKG < 3: Non-renal loss (GI, etc.)</li>
                                <li>TTKG > 3: Renal loss</li>
                            </ul>
                        </li>
                        <li><strong>Hyperkalemia (K > 5.2):</strong>
                            <ul>
                                <li>TTKG > 10: Normal renal response</li>
                                <li>TTKG < 7: Hypoaldosteronism or resistance</li>
                            </ul>
                        </li>
                    </ul>
                `
        })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const urineKEl = container.querySelector('#ttkg-urine-k');
        const serumKEl = container.querySelector('#ttkg-serum-k');
        const urineOsmoEl = container.querySelector('#ttkg-urine-osmo');
        const serumOsmoEl = container.querySelector('#ttkg-serum-osmo');
        const resultBox = container.querySelector('#ttkg-result');
        const resultContent = resultBox.querySelector('.ui-result-content');

        const calculate = () => {
            // Clear previous errors
            const existingError = container.querySelector('#ttkg-error');
            if (existingError) existingError.remove();

            const urineK = parseFloat(urineKEl.value);
            const serumK = parseFloat(serumKEl.value);
            const urineOsmo = parseFloat(urineOsmoEl.value);
            const serumOsmo = parseFloat(serumOsmoEl.value);

            try {
                // Validation inputs
                const inputs = {
                    urinePotassium: urineK,
                    potassium: serumK,
                    urineOsmolality: urineOsmo,
                    serumOsmolality: serumOsmo
                };

                // Re-use rules, mapping osmolality broadly if separate types not defined
                // Ideally we might want specific range for urine vs serum obs, but generic 'osmolality' 0-2000 covers safety
                const schema = {
                    urinePotassium: { ...ValidationRules.potassium, message: 'Urine K must be valid' }, // Reusing potassium rule for now or generic number
                    potassium: ValidationRules.potassium,
                    urineOsmolality: ValidationRules.osmolality,
                    serumOsmolality: ValidationRules.osmolality
                };

                const validation = validateCalculatorInput(inputs, schema);

                if (!validation.isValid) {
                    const hasInput = (urineKEl.value || serumKEl.value || urineOsmoEl.value || serumOsmoEl.value);

                    if (hasInput) {
                        const valuesPresent = !isNaN(urineK) && !isNaN(serumK) && !isNaN(urineOsmo) && !isNaN(serumOsmo);
                        if (valuesPresent || validation.errors.some(e => !e.includes('required'))) {
                            let errorContainer = document.createElement('div');
                            errorContainer.id = 'ttkg-error';
                            resultBox.parentNode.insertBefore(errorContainer, resultBox);
                            displayError(errorContainer, new ValidationError(validation.errors[0], 'VALIDATION_ERROR'));
                        }
                    }

                    resultBox.classList.remove('show');
                    return;
                }

                if (serumK === 0 || urineOsmo === 0) {
                    throw new ValidationError('Serum potassium and Urine osmolality cannot be zero.', 'CALCULATION_ERROR');
                }

                const ttkgValue = (urineK * serumOsmo) / (serumK * urineOsmo);

                let interpretation = '';
                let alertType = 'info';

                if (serumK < 3.5) {
                    // Hypokalemia
                    if (ttkgValue < 3) {
                        interpretation = 'Suggests non-renal potassium loss (e.g., GI loss, transcellular shift).';
                    } else {
                        interpretation = 'Suggests renal potassium wasting.';
                        alertType = 'warning';
                    }
                } else if (serumK > 5.2) {
                    // Hyperkalemia
                    if (ttkgValue > 10) {
                        interpretation = 'Suggests hyperkalemia is driven by high potassium intake (dietary or iatrogenic).';
                    } else if (ttkgValue < 7) {
                        interpretation = 'Suggests an issue with aldosterone (e.g., hypoaldosteronism or aldosterone resistance).';
                        alertType = 'warning';
                    }
                } else {
                    interpretation = 'Normal potassium levels. TTKG should be interpreted in context of potassium disorders.';
                }

                if (urineOsmo <= serumOsmo) {
                    interpretation = `<strong>Warning:</strong> TTKG is not valid when Urine Osmolality (${urineOsmo}) ≤ Serum Osmolality (${serumOsmo}).`;
                    alertType = 'warning';
                }

                resultContent.innerHTML = `
                    ${uiBuilder.createResultItem({
                    label: 'TTKG',
                    value: ttkgValue.toFixed(2),
                    interpretation: interpretation,
                    alertClass: `ui-alert-${alertType}`
                })}
                `;
                resultBox.classList.add('show');
            } catch (error) {
                logError(error, { calculator: 'ttkg', action: 'calculate' });
                if (error.name !== 'ValidationError') {
                    let errorContainer = container.querySelector('#ttkg-error');
                    if (!errorContainer) {
                        errorContainer = document.createElement('div');
                        errorContainer.id = 'ttkg-error';
                        resultBox.parentNode.insertBefore(errorContainer, resultBox);
                    }
                    displayError(errorContainer, error);
                }
                resultBox.classList.remove('show');
            }
        };

        [urineKEl, serumKEl, urineOsmoEl, serumOsmoEl].forEach(input => {
            input.addEventListener('input', calculate);
        });

        // FHIR auto-population
        if (client) {
            getMostRecentObservation(client, LOINC_CODES.URINE_POTASSIUM).then(obs => {
                if (obs?.valueQuantity) {
                    urineKEl.value = obs.valueQuantity.value.toFixed(1);
                    urineKEl.dispatchEvent(new Event('input'));
                }
            });
            getMostRecentObservation(client, LOINC_CODES.POTASSIUM).then(obs => {
                if (obs?.valueQuantity) {
                    serumKEl.value = obs.valueQuantity.value.toFixed(1);
                    serumKEl.dispatchEvent(new Event('input'));
                }
            });
            getMostRecentObservation(client, '2697-2').then(obs => { // Urine Osmolality
                if (obs?.valueQuantity) {
                    urineOsmoEl.value = obs.valueQuantity.value.toFixed(1);
                    urineOsmoEl.dispatchEvent(new Event('input'));
                }
            });
            getMostRecentObservation(client, '2695-6').then(obs => { // Serum Osmolality
                if (obs?.valueQuantity) {
                    serumOsmoEl.value = obs.valueQuantity.value.toFixed(1);
                    serumOsmoEl.dispatchEvent(new Event('input'));
                }
            });
        }
    }
};
