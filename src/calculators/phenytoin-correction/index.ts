import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { ValidationRules, validateCalculatorInput } from '../../validator.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';
import { fhirDataService } from '../../fhir-data-service.js';

interface CalculatorModule {
    id: string;
    title: string;
    description: string;
    generateHTML: () => string;
    initialize: (client: any, patient: any, container: HTMLElement) => void;
}

export const phenytoinCorrection: CalculatorModule = {
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
                // step is not in interface but was used. Removing to satisfy TS.
                placeholder: 'e.g., 8.0',
                unit: 'mcg/mL',
                unitToggle: {
                    type: 'phenytoin',
                    units: ['mcg/mL', 'µmol/L', 'mg/L'],
                    default: 'mcg/mL'
                }
            })}
                    ${uiBuilder.createInput({
                id: 'pheny-albumin',
                label: 'Serum Albumin',
                type: 'number',
                // step is not in interface using it may cause error.
                placeholder: 'e.g., 3.0',
                unitToggle: {
                    type: 'albumin',
                    units: ['g/dL', 'g/L'],
                    default: 'g/dL'
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
                    <ul class="info-list">
                        <li>10-20 mcg/mL</li>
                        <li>>20 mcg/mL: Toxic</li>
                        <li><10 mcg/mL: Subtherapeutic</li>
                    </ul>
                `
        })}
        `;
    },
    initialize: function (client: any, patient: any, container: HTMLElement) {
        uiBuilder.initializeComponents(container);
        
        // Initialize FHIRDataService
        fhirDataService.initialize(client, patient, container);

        const totalEl = container.querySelector('#pheny-total') as HTMLInputElement;
        const albuminEl = container.querySelector('#pheny-albumin') as HTMLInputElement;
        const resultEl = container.querySelector('#phenytoin-result');

        const calculateAndUpdate = () => {
            // Clear previous errors
            const errorContainer = container.querySelector('#pheny-error-container');
            if (errorContainer) errorContainer.innerHTML = '';

            const totalPhenytoin = UnitConverter.getStandardValue(totalEl, 'mcg/mL');
            const albuminGdl = UnitConverter.getStandardValue(albuminEl, 'g/dL');
            const hasRenalFailure = (container.querySelector('input[name="pheny-renal"]:checked') as HTMLInputElement)?.value === 'yes';

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
                    if (hasInput && resultEl) {
                        const valuesPresent = totalPhenytoin !== null && albuminGdl !== null && !isNaN(totalPhenytoin) && !isNaN(albuminGdl);
                        if (valuesPresent || validation.errors.some((e: string) => !e.includes('required'))) {
                            if (errorContainer) displayError(errorContainer as HTMLElement, new ValidationError(validation.errors[0], 'VALIDATION_ERROR'));
                        }
                        resultEl.classList.remove('show');
                    }
                    return;
                }

                if (resultEl) {
                    const K = hasRenalFailure ? 0.2 : 0.1;
                    const correctedPhenytoin = totalPhenytoin! / (((1 - K) * albuminGdl!) / 4.4 + K);

                    if (!isFinite(correctedPhenytoin) || isNaN(correctedPhenytoin)) throw new Error("Calculation Error");

                    // Determine therapeutic status
                    let status = '';
                    let statusClass = 'ui-alert-success';
                    let alertType: 'success' | 'warning' | 'danger' | 'info' = 'success';
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
                    if (resultContent) {
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
                            value: totalPhenytoin!.toFixed(1),
                            unit: 'mcg/mL'
                        })}
                        ${uiBuilder.createAlert({
                            type: alertType,
                            message: alertMsg
                        })}
                    `;
                    }
                    resultEl.classList.add('show');
                }
            } catch (error) {
                logError(error as Error, { calculator: 'phenytoin-correction', action: 'calculate' });
                if (errorContainer) displayError(errorContainer as HTMLElement, error as Error);
                if (resultEl) resultEl.classList.remove('show');
            }
        };

        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculateAndUpdate);
            input.addEventListener('change', calculateAndUpdate);
        });

        // Auto-populate from FHIR using FHIRDataService
        if (client) {
            // Phenytoin (LOINC 4038-8)
            fhirDataService.getObservation('4038-8', { trackStaleness: true, stalenessLabel: 'Phenytoin', targetUnit: 'mcg/mL', unitType: 'phenytoin' }).then(result => {
                if (result.value !== null) {
                    totalEl.value = result.value.toFixed(1);
                    totalEl.dispatchEvent(new Event('input'));
                }
            }).catch(e => console.warn(e));

            // Albumin
            fhirDataService.getObservation(LOINC_CODES.ALBUMIN, { trackStaleness: true, stalenessLabel: 'Albumin', targetUnit: 'g/dL', unitType: 'albumin' }).then(result => {
                if (result.value !== null) {
                    albuminEl.value = result.value.toFixed(1);
                    albuminEl.dispatchEvent(new Event('input'));
                }
            }).catch(e => console.warn(e));
        }

        calculateAndUpdate();
    }
};
