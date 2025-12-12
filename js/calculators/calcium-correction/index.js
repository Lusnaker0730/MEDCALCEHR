import {
    getMostRecentObservation
} from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { ValidationRules, validateCalculatorInput } from '../../validator.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';

export const calciumCorrection = {
    id: 'calcium-correction',
    title: 'Calcium Correction for Albumin',
    description: 'Calculates corrected calcium for patients with hypoalbuminemia.',
    generateHTML: function () {
        const inputs = uiBuilder.createSection({
            title: 'Lab Values',
            content: [
                uiBuilder.createInput({
                    id: 'ca-total',
                    label: 'Total Calcium',
                    type: 'number',
                    step: 0.1,
                    unitToggle: { type: 'calcium', units: ['mg/dL', 'mmol/L'] }
                }),
                uiBuilder.createInput({
                    id: 'ca-albumin',
                    label: 'Albumin',
                    type: 'number',
                    step: 0.1,
                    unitToggle: { type: 'albumin', units: ['g/dL', 'g/L'] }
                })
            ].join('')
        });

        const formulaSection = uiBuilder.createFormulaSection({
            items: [
                { label: 'Corrected Calcium (mg/dL)', formula: 'Total Calcium + 0.8 × (4.0 - Albumin)' },
                { label: 'Note', formula: 'Normal albumin reference: 4.0 g/dL' }
            ]
        });

        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            <div class="alert info">
                <span class="alert-icon">ℹ️</span>
                <div class="alert-content">
                    <p>Use this calculator when albumin levels are abnormal (< 4.0 g/dL). 40-50% of total blood calcium is bound to plasma proteins, primarily albumin.</p>
                </div>
            </div>
            
            ${inputs}
            
            <div id="ca-result" class="ui-result-box">
                <div class="ui-result-header">Corrected Calcium</div>
                <div class="ui-result-content"></div>
            </div>
            
            ${formulaSection}
            
            <div class="alert warning mt-20">
                <span class="alert-icon">⚠️</span>
                <div class="alert-content">
                    <p><strong>Clinical Note:</strong> This correction is an estimation. For critically ill patients or precise assessment, measurement of ionized calcium is preferred.</p>
                </div>
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const calculateAndUpdate = () => {
            // Clear previous errors
            const existingError = container.querySelector('#ca-error');
            if (existingError) existingError.remove();

            const calciumInput = container.querySelector('#ca-total');
            const albuminInput = container.querySelector('#ca-albumin');
            const resultBox = container.querySelector('#ca-result');
            const resultContent = resultBox.querySelector('.ui-result-content');

            // Get values using UnitConverter (normalizes to standard unit)
            // Standard units: Calcium -> mg/dL, Albumin -> g/dL (as per validator rules usually)
            // Note: validator rules for albumin say 0.5-8.0 g/dL.
            const totalCalciumMgDl = UnitConverter.getStandardValue(calciumInput, 'mg/dL');
            const albuminGdl = UnitConverter.getStandardValue(albuminInput, 'g/dL');

            try {
                // Validation inputs
                const inputs = { calcium: totalCalciumMgDl, albumin: albuminGdl };
                const schema = {
                    calcium: ValidationRules.calcium,
                    albumin: ValidationRules.albumin
                };

                const validation = validateCalculatorInput(inputs, schema);

                if (!validation.isValid) {
                    const hasInput = calciumInput.value || albuminInput.value;
                    if (hasInput) {
                        const valuesPresent = !isNaN(totalCalciumMgDl) && !isNaN(albuminGdl);
                        if (valuesPresent || validation.errors.some(e => !e.includes('required'))) {
                            let errorContainer = document.createElement('div');
                            errorContainer.id = 'ca-error';
                            resultBox.parentNode.insertBefore(errorContainer, resultBox);
                            displayError(errorContainer, new ValidationError(validation.errors[0], 'VALIDATION_ERROR'));
                        }
                    }
                    resultBox.classList.remove('show');
                    return;
                }

                const correctedCalcium = totalCalciumMgDl + 0.8 * (4.0 - albuminGdl);
                const correctedCalciumMmol = correctedCalcium * 0.2495;

                let alertClass = 'ui-alert-success';
                let interpretation = 'Normal Range';

                if (correctedCalcium < 8.5) {
                    alertClass = 'ui-alert-warning'; // Hypocalcemia
                    interpretation = 'Hypocalcemia (< 8.5 mg/dL)';
                } else if (correctedCalcium > 10.5) {
                    alertClass = 'ui-alert-danger'; // Hypercalcemia
                    interpretation = 'Hypercalcemia (> 10.5 mg/dL)';
                }

                resultContent.innerHTML = `
                    ${uiBuilder.createResultItem({
                    label: 'Corrected Calcium',
                    value: correctedCalcium.toFixed(2),
                    unit: 'mg/dL',
                    interpretation: interpretation,
                    alertClass: alertClass
                })}
                    <div style="text-align: center; margin-top: 5px; color: #666;">
                        (${correctedCalciumMmol.toFixed(2)} mmol/L)
                    </div>
                `;

                resultBox.classList.add('show');
            } catch (error) {
                logError(error, { calculator: 'calcium-correction', action: 'calculate' });
                // Only show system errors, validation handled above
                if (error.name !== 'ValidationError') {
                    let errorContainer = container.querySelector('#ca-error');
                    if (!errorContainer) {
                        errorContainer = document.createElement('div');
                        errorContainer.id = 'ca-error';
                        resultBox.parentNode.insertBefore(errorContainer, resultBox);
                    }
                    displayError(errorContainer, error);
                }
                resultBox.classList.remove('show');
            }
        };

        // Event listeners for inputs
        const inputs = container.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', calculateAndUpdate);
        });

        // Helper to set value safely
        const setInputValue = (id, val) => {
            const input = container.querySelector(id);
            if (input && val) {
                input.value = val;
                input.dispatchEvent(new Event('input')); // Trigger calculation
            }
        };

        // Auto-populate from FHIR data
        if (client) {
            getMostRecentObservation(client, LOINC_CODES.CALCIUM).then(obs => {
                if (obs && obs.valueQuantity) {
                    setInputValue('#ca-total', obs.valueQuantity.value.toFixed(1));
                }
            });

            getMostRecentObservation(client, LOINC_CODES.ALBUMIN).then(obs => {
                if (obs && obs.valueQuantity) {
                    setInputValue('#ca-albumin', obs.valueQuantity.value.toFixed(1));
                }
            });
        }

        calculateAndUpdate();
    }
};