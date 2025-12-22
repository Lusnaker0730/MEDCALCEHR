import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { ValidationRules, validateCalculatorInput } from '../../validator.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';
import { fhirDataService } from '../../fhir-data-service.js';
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
                    unitToggle: { type: 'urineSodium', units: ['mEq/L', 'mmol/L'], default: 'mEq/L' }
                }),
                uiBuilder.createInput({
                    id: 'fena-serum-na',
                    label: 'Serum Sodium',
                    type: 'number',
                    placeholder: 'e.g. 140',
                    unitToggle: { type: 'sodium', units: ['mEq/L', 'mmol/L'], default: 'mEq/L' }
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
            
            <div id="fena-error-container"></div>
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
        // Initialize FHIRDataService
        fhirDataService.initialize(client, patient, container);
        const resultBox = container.querySelector('#fena-result');
        const calculateAndUpdate = () => {
            // Clear previous errors
            const errorContainer = container.querySelector('#fena-error-container');
            if (errorContainer)
                errorContainer.innerHTML = '';
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
                    if (hasInput && resultBox) {
                        const valuesPresent = uNa !== null && sNa !== null && uCrMgDl !== null && sCrMgDl !== null && !isNaN(uNa) && !isNaN(sNa) && !isNaN(uCrMgDl) && !isNaN(sCrMgDl);
                        if (valuesPresent || validation.errors.some((e) => !e.includes('required'))) {
                            if (errorContainer)
                                displayError(errorContainer, new ValidationError(validation.errors[0], 'VALIDATION_ERROR'));
                        }
                        resultBox.classList.remove('show');
                    }
                    return;
                }
                if (resultBox) {
                    const resultContent = resultBox.querySelector('.ui-result-content');
                    const fenaValue = (uNa / sNa / (uCrMgDl / sCrMgDl)) * 100;
                    if (!isFinite(fenaValue) || isNaN(fenaValue))
                        throw new Error("Calculation Error");
                    let interpretation = '';
                    let alertClass = '';
                    if (fenaValue < 1) {
                        interpretation = 'Prerenal AKI (< 1%)';
                        alertClass = 'ui-alert-success';
                    }
                    else if (fenaValue > 2) {
                        interpretation = 'Intrinsic/ATN (> 2%)';
                        alertClass = 'ui-alert-danger';
                    }
                    else {
                        interpretation = 'Indeterminate (1-2%)';
                        alertClass = 'ui-alert-warning';
                    }
                    if (resultContent) {
                        resultContent.innerHTML = `
                            ${uiBuilder.createResultItem({
                            label: 'Fractional Excretion of Sodium',
                            value: fenaValue.toFixed(2),
                            unit: '%',
                            interpretation: interpretation,
                            alertClass: alertClass
                        })}
                        `;
                    }
                    resultBox.classList.add('show');
                }
            }
            catch (error) {
                logError(error, { calculator: 'fena', action: 'calculate' });
                if (errorContainer)
                    displayError(errorContainer, error);
                if (resultBox)
                    resultBox.classList.remove('show');
            }
        };
        // Add event listeners
        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculateAndUpdate);
        });
        // Helper
        const setInputValue = (selector, val) => {
            const el = container.querySelector(selector);
            if (el) {
                el.value = val;
                el.dispatchEvent(new Event('input'));
            }
        };
        // Auto-populate from FHIR using FHIRDataService
        const autoPopulate = async () => {
            if (fhirDataService.isReady()) {
                try {
                    const [uNaResult, sNaResult, uCrResult, sCrResult] = await Promise.all([
                        fhirDataService.getObservation('2955-3', {
                            trackStaleness: true,
                            stalenessLabel: 'Urine Na'
                        }),
                        fhirDataService.getObservation(LOINC_CODES.SODIUM, {
                            trackStaleness: true,
                            stalenessLabel: 'Serum Na'
                        }),
                        fhirDataService.getObservation(LOINC_CODES.URINE_CREATININE, {
                            trackStaleness: true,
                            stalenessLabel: 'Urine Creatinine',
                            targetUnit: 'mg/dL',
                            unitType: 'creatinine'
                        }),
                        fhirDataService.getObservation(LOINC_CODES.CREATININE, {
                            trackStaleness: true,
                            stalenessLabel: 'Serum Creatinine',
                            targetUnit: 'mg/dL',
                            unitType: 'creatinine'
                        })
                    ]);
                    if (uNaResult.value !== null) {
                        setInputValue('#fena-urine-na', uNaResult.value.toFixed(0));
                    }
                    if (sNaResult.value !== null) {
                        setInputValue('#fena-serum-na', sNaResult.value.toFixed(0));
                    }
                    if (uCrResult.value !== null) {
                        setInputValue('#fena-urine-creat', uCrResult.value.toFixed(1));
                    }
                    if (sCrResult.value !== null) {
                        setInputValue('#fena-serum-creat', sCrResult.value.toFixed(2));
                    }
                }
                catch (e) {
                    console.warn('Error auto-populating FENa:', e);
                }
            }
            calculateAndUpdate();
        };
        autoPopulate();
    }
};
