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
            
            <div id="pheny-error-container"></div>
            <div id="phenytoin-result" class="ui-result-box">
                <div class="ui-result-header">Corrected Phenytoin Level</div>
                <div class="ui-result-content"></div>
            </div>
            
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
            const errorContainer = container.querySelector('#pheny-error-container');
            if (errorContainer) errorContainer.innerHTML = '';

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
                            if (errorContainer) displayError(errorContainer, new ValidationError(validation.errors[0], 'VALIDATION_ERROR'));
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
                if (errorContainer) displayError(errorContainer, error);
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
                    const val = obs.valueQuantity.value;
                    const unit = obs.valueQuantity.unit || 'mcg/mL';
                    const converted = UnitConverter.convert(val, unit, 'mcg/mL', 'phenytoin');
                    if (converted !== null) {
                        totalEl.value = converted.toFixed(1);
                    } else {
                        totalEl.value = val.toFixed(1);
                    }
                    totalEl.dispatchEvent(new Event('input'));
                }
            }).catch(e => console.warn(e));

            getMostRecentObservation(client, LOINC_CODES.ALBUMIN).then(obs => {
                if (obs && obs.valueQuantity) {
                    const val = obs.valueQuantity.value;
                    const unit = obs.valueQuantity.unit || 'g/dL';
                    const converted = UnitConverter.convert(val, unit, 'g/dL', 'albumin');
                    if (converted !== null) {
                        albuminEl.value = converted.toFixed(1);
                    } else {
                        // Fallback logic from previous version was: if L but not dL, divide by 10.
                        // But UnitConverter should handle this if configured right.
                        // If not, we fall back to raw value or simple assumption
                        albuminEl.value = val.toFixed(1);
                    }
                    albuminEl.dispatchEvent(new Event('input'));
                }
            }).catch(e => console.warn(e));
        }

        calculateAndUpdate();
    }
};
