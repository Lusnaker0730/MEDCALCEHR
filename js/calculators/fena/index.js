import { getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { ValidationRules, validateCalculatorInput } from '../../validator.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';

export const fena = {
    id: 'fena',
    title: 'Fractional Excretion of Sodium (FENa)',
    description: 'Determines if renal failure is due to prerenal or intrinsic pathology.',
    generateHTML: function () {
        const inputs = uiBuilder.createSection({
            title: 'Laboratory Values',
            content: [
                uiBuilder.createInput({
                    id: 'fena-urine-na',
                    label: 'Urine Sodium',
                    type: 'number',
                    placeholder: 'e.g. 20',
                    unitToggle: { type: 'urineSodium', units: ['mEq/L', 'mmol/L'], defaultUnit: 'mEq/L' }
                }),
                uiBuilder.createInput({
                    id: 'fena-serum-na',
                    label: 'Serum Sodium',
                    type: 'number',
                    placeholder: 'e.g. 140',
                    unitToggle: { type: 'sodium', units: ['mEq/L', 'mmol/L'], defaultUnit: 'mEq/L' }
                }),
                uiBuilder.createInput({
                    id: 'fena-urine-creat',
                    label: 'Urine Creatinine',
                    type: 'number',
                    unitToggle: { type: 'creatinine', units: ['mg/dL', 'µmol/L'] }
                }),
                uiBuilder.createInput({
                    id: 'fena-serum-creat',
                    label: 'Serum Creatinine',
                    type: 'number',
                    unitToggle: { type: 'creatinine', units: ['mg/dL', 'µmol/L'] }
                })
            ].join('')
        });

        const formulaSection = uiBuilder.createFormulaSection({
            items: [
                { label: 'FENa Equation', formula: 'FENa (%) = [(Urine Na × Serum Cr) / (Serum Na × Urine Cr)] × 100' },
                { label: 'Units', formula: 'Na (mEq/L), Cr (mg/dL or µmol/L)' }
            ]
        });

        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            ${uiBuilder.createAlert({
            type: 'info',
            message: 'Use in the context of acute kidney injury (AKI) / acute renal failure to differentiate prerenal azotemia from acute tubular necrosis (ATN).'
        })}
            
            ${inputs}
            
            <div id="fena-result" class="ui-result-box">
                <div class="ui-result-header">FENa Result</div>
                <div class="ui-result-content"></div>
            </div>
            
            ${formulaSection}
            
            ${uiBuilder.createAlert({
            type: 'warning',
            message: '<strong>Limitations:</strong> FENa is unreliable in patients on diuretics. Consider Fractional Excretion of Urea (FEUrea) instead.'
        })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const resultBox = container.querySelector('#fena-result');
        const resultContent = resultBox.querySelector('.ui-result-content');

        const calculateAndUpdate = () => {
            // Clear previous errors
            const existingError = container.querySelector('#fena-error');
            if (existingError) existingError.remove();

            const uNaInput = container.querySelector('#fena-urine-na');
            const sNaInput = container.querySelector('#fena-serum-na');
            const uCrInput = container.querySelector('#fena-urine-creat');
            const sCrInput = container.querySelector('#fena-serum-creat');

            const uNa = UnitConverter.getStandardValue(uNaInput, 'mEq/L');
            const sNa = UnitConverter.getStandardValue(sNaInput, 'mEq/L');
            const uCrMgDl = UnitConverter.getStandardValue(uCrInput, 'mg/dL');
            const sCrMgDl = UnitConverter.getStandardValue(sCrInput, 'mg/dL');

            try {
                // Validation inputs
                const inputs = {
                    urineSodium: uNa,
                    sodium: sNa,
                    urineCreatinine: uCrMgDl,
                    creatinine: sCrMgDl
                };
                const schema = {
                    urineSodium: ValidationRules.urineSodium,
                    sodium: ValidationRules.sodium,
                    urineCreatinine: ValidationRules.urineCreatinine,
                    creatinine: ValidationRules.creatinine
                };

                const validation = validateCalculatorInput(inputs, schema);

                if (!validation.isValid) {
                    const hasInput = (uNaInput.value || sNaInput.value || uCrInput.value || sCrInput.value);

                    if (hasInput) {
                        const valuesPresent = !isNaN(uNa) && !isNaN(sNa) && !isNaN(uCrMgDl) && !isNaN(sCrMgDl);
                        if (valuesPresent || validation.errors.some(e => !e.includes('required'))) {
                            let errorContainer = document.createElement('div');
                            errorContainer.id = 'fena-error';
                            resultBox.parentNode.insertBefore(errorContainer, resultBox);
                            displayError(errorContainer, new ValidationError(validation.errors[0], 'VALIDATION_ERROR'));
                        }
                    }

                    resultBox.classList.remove('show');
                    return;
                }

                const fenaValue = (uNa / sNa / (uCrMgDl / sCrMgDl)) * 100;

                if (!isFinite(fenaValue) || isNaN(fenaValue)) throw new Error("Calculation Error");

                let interpretation = '';
                let alertClass = '';

                if (fenaValue < 1) {
                    interpretation = 'Prerenal AKI (< 1%)';
                    alertClass = 'ui-alert-success';
                } else if (fenaValue > 2) {
                    interpretation = 'Intrinsic/ATN (> 2%)';
                    alertClass = 'ui-alert-danger';
                } else {
                    interpretation = 'Indeterminate (1-2%)';
                    alertClass = 'ui-alert-warning';
                }

                resultContent.innerHTML = `
                    ${uiBuilder.createResultItem({
                    label: 'Fractional Excretion of Sodium',
                    value: fenaValue.toFixed(2),
                    unit: '%',
                    interpretation: interpretation,
                    alertClass: alertClass
                })}
                `;

                resultBox.classList.add('show');
            } catch (error) {
                logError(error, { calculator: 'fena', action: 'calculate' });
                // Only show system errors, validation handled above
                if (error.name !== 'ValidationError') {
                    let errorContainer = container.querySelector('#fena-error');
                    if (!errorContainer) {
                        errorContainer = document.createElement('div');
                        errorContainer.id = 'fena-error';
                        resultBox.parentNode.insertBefore(errorContainer, resultBox);
                    }
                    displayError(errorContainer, error);
                }
                resultBox.classList.remove('show');
            }
        };

        // Add event listeners
        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculateAndUpdate);
        });

        // Auto-populate from FHIR
        if (client) {
            Promise.all([
                getMostRecentObservation(client, '2955-3'), // Urine Na
                getMostRecentObservation(client, LOINC_CODES.SODIUM), // Serum Na
                getMostRecentObservation(client, LOINC_CODES.URINE_CREATININE),
                getMostRecentObservation(client, LOINC_CODES.CREATININE)
            ]).then(([uNa, sNa, uCr, sCr]) => {
                if (uNa && uNa.valueQuantity) {
                    container.querySelector('#fena-urine-na').value = uNa.valueQuantity.value.toFixed(0);
                }
                if (sNa && sNa.valueQuantity) {
                    container.querySelector('#fena-serum-na').value = sNa.valueQuantity.value.toFixed(0);
                }
                if (uCr && uCr.valueQuantity) {
                    container.querySelector('#fena-urine-creat').value = uCr.valueQuantity.value.toFixed(0);
                }
                if (sCr && sCr.valueQuantity) {
                    container.querySelector('#fena-serum-creat').value = sCr.valueQuantity.value.toFixed(1);
                }

                // Trigger calculation if values populated
                container.querySelector('#fena-urine-na').dispatchEvent(new Event('input'));
            });
        }
    }
};