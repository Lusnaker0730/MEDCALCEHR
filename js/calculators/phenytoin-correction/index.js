import {
    getMostRecentObservation,
} from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { ValidationRules, validateCalculatorInput } from '../../validator.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';

export const phenytoinCorrection = {
    id: 'phenytoin-correction',
    title: 'Phenytoin (Dilantin) Correction for Albumin/Renal Failure',
    description: 'Corrects serum phenytoin level for renal failure and/or hypoalbuminemia.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            ${uiBuilder.createSection({
            title: 'Lab Values & Clinical Status',
            icon: '🧪',
            content: `
                    ${uiBuilder.createInput({
                id: 'pheny-total',
                label: 'Total Phenytoin Level',
                type: 'number',
                step: '0.1',
                placeholder: 'e.g., 8.0',
                unit: 'mcg/mL',
                unitToggle: {
                    type: 'phenytoin',
                    units: ['mcg/mL', 'µmol/L', 'mg/L'],
                    defaultUnit: 'mcg/mL'
                }
            })}
                    ${uiBuilder.createInput({
                id: 'pheny-albumin',
                label: 'Serum Albumin',
                type: 'number',
                step: '0.1',
                placeholder: 'e.g., 3.0',
                unitToggle: {
                    type: 'albumin',
                    units: ['g/dL', 'g/L'],
                    defaultUnit: 'g/dL'
                }
            })}
                    ${uiBuilder.createRadioGroup({
                name: 'pheny-renal',
                label: 'Renal Status (CrCl < 10 mL/min)',
                options: [
                    { value: 'no', label: 'No (Normal Function)', checked: true },
                    { value: 'yes', label: 'Yes (Renal Failure)' }
                ],
                helpText: 'Select Yes if CrCl < 10 mL/min, ESRD, or on dialysis.'
            })}
                `
        })}
            
            ${uiBuilder.createResultBox({ id: 'phenytoin-result', title: 'Corrected Phenytoin Level' })}
            
            ${uiBuilder.createFormulaSection({
            items: [
                { label: 'Corrected Level', formula: 'Total Phenytoin / [((1-K) × Albumin/4.4) + K]' },
                { label: 'K', formula: '0.1 (Normal Renal Function) or 0.2 (Renal Failure)' }
            ]
        })}

            ${uiBuilder.createAlert({
            type: 'info',
            message: `
                    <h4>Therapeutic Range:</h4>
                    <ul style="margin-top: 5px; padding-left: 20px;">
                        <li>10-20 mcg/mL</li>
                        <li>>20 mcg/mL: Toxic</li>
                        <li><10 mcg/mL: Subtherapeutic</li>
                    </ul>
                `
        })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const totalEl = container.querySelector('#pheny-total');
        const albuminEl = container.querySelector('#pheny-albumin');
        const resultEl = container.querySelector('#phenytoin-result');

        const calculateAndUpdate = () => {
            // Clear previous errors
            const existingError = container.querySelector('#pheny-error');
            if (existingError) existingError.remove();

            const totalPhenytoin = UnitConverter.getStandardValue(totalEl, 'mcg/mL');
            const albuminGdl = UnitConverter.getStandardValue(albuminEl, 'g/dL');
            const hasRenalFailure = container.querySelector('input[name="pheny-renal"]:checked')?.value === 'yes';

            try {
                // Validation
                const inputs = {
                    phenytoin: totalPhenytoin,
                    albumin: albuminGdl
                };
                const schema = {
                    phenytoin: ValidationRules.phenytoin,
                    albumin: ValidationRules.albumin
                };

                const validation = validateCalculatorInput(inputs, schema);

                if (!validation.isValid) {
                    const hasInput = (totalEl.value || albuminEl.value);
                    if (hasInput) {
                        const valuesPresent = !isNaN(totalPhenytoin) && !isNaN(albuminGdl);
                        if (valuesPresent || validation.errors.some(e => !e.includes('required'))) {
                            let errorContainer = document.createElement('div');
                            errorContainer.id = 'pheny-error';
                            resultEl.parentNode.insertBefore(errorContainer, resultEl);
                            displayError(errorContainer, new ValidationError(validation.errors[0], 'VALIDATION_ERROR'));
                        }
                    }
                    resultEl.classList.remove('show');
                    return;
                }

                const K = hasRenalFailure ? 0.2 : 0.1;
                const correctedPhenytoin = totalPhenytoin / (((1 - K) * albuminGdl) / 4.4 + K);

                if (!isFinite(correctedPhenytoin) || isNaN(correctedPhenytoin)) throw new Error("Calculation Error");

                // Determine therapeutic status
                let status = '';
                let statusClass = 'ui-alert-success';
                let alertType = 'success';
                let alertMsg = 'Within therapeutic range.';

                if (correctedPhenytoin < 10) {
                    status = 'Subtherapeutic';
                    statusClass = 'ui-alert-info'; // Using info for low
                    alertType = 'info';
                    alertMsg = 'Level is below therapeutic range.';
                } else if (correctedPhenytoin > 20) {
                    status = 'Potentially Toxic';
                    statusClass = 'ui-alert-danger';
                    alertType = 'danger';
                    alertMsg = 'Level is above therapeutic range. Monitor for toxicity.';
                }

                const resultContent = resultEl.querySelector('.ui-result-content');
                resultContent.innerHTML = `
                    ${uiBuilder.createResultItem({
                    label: 'Corrected Phenytoin',
                    value: correctedPhenytoin.toFixed(1),
                    unit: 'mcg/mL',
                    interpretation: status,
                    alertClass: statusClass
                })}
                    ${uiBuilder.createResultItem({
                    label: 'Measured Total',
                    value: totalPhenytoin.toFixed(1),
                    unit: 'mcg/mL'
                })}
                    ${uiBuilder.createAlert({
                    type: alertType,
                    message: alertMsg
                })}
                `;
                resultEl.classList.add('show');
            } catch (error) {
                logError(error, { calculator: 'phenytoin-correction', action: 'calculate' });
                if (error.name !== 'ValidationError') {
                    let errorContainer = container.querySelector('#pheny-error');
                    if (!errorContainer) {
                        errorContainer = document.createElement('div');
                        errorContainer.id = 'pheny-error';
                        resultEl.parentNode.insertBefore(errorContainer, resultEl);
                    }
                    displayError(errorContainer, error);
                }
                resultEl.classList.remove('show');
            }
        };

        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculateAndUpdate);
            input.addEventListener('change', calculateAndUpdate);
        });

        // Auto-populate from FHIR
        if (client) {
            getMostRecentObservation(client, '4038-8').then(obs => { // Phenytoin
                if (obs && obs.valueQuantity) {
                    totalEl.value = obs.valueQuantity.value.toFixed(1);
                }
                calculateAndUpdate();
            });

            getMostRecentObservation(client, LOINC_CODES.ALBUMIN).then(obs => {
                if (obs && obs.valueQuantity) {
                    // Assuming g/dL logic or unit conversion handled if we had direct value input helper
                    // For now just set value, assume g/dL if not converted
                    // If unit is g/L, divide by 10
                    let val = obs.valueQuantity.value;
                    const unit = obs.valueQuantity.unit || 'g/dL';

                    // Simplified conversion check, ideally UnitConverter handles this if input logic matches
                    // But we need to set the input value for the user. 
                    // If user toggle is g/dL, we should provide g/dL.
                    // If unit is g/L, we can convert to g/dL for default
                    if (unit.includes('L') && !unit.includes('dL')) { // simple check for g/L
                        // Assuming standard is g/dL for calculator input default
                        // Let's just put raw value and let user toggle unit?
                        // Or convert to g/dL since default is g/dL
                        val = val / 10;
                    }
                    albuminEl.value = val.toFixed(1);
                    // Trigger input event
                    albuminEl.dispatchEvent(new Event('input'));
                }
                calculateAndUpdate();
            });
        }

        calculateAndUpdate();
    }
};
