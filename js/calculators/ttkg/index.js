import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { ValidationRules, validateCalculatorInput } from '../../validator.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';
import { fhirDataService } from '../../fhir-data-service.js';
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
                unitToggle: {
                    type: 'electrolyte',
                    units: ['mEq/L', 'mmol/L'],
                    default: 'mEq/L'
                }
            })}
                    ${uiBuilder.createInput({
                id: 'ttkg-serum-k',
                label: 'Serum Potassium',
                type: 'number',
                unitToggle: {
                    type: 'electrolyte',
                    units: ['mEq/L', 'mmol/L'],
                    default: 'mEq/L'
                },
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
            
            <div id="ttkg-error-container"></div>
            <div id="ttkg-result" class="ui-result-box">
                <div class="ui-result-header">Result</div>
                <div class="ui-result-content"></div>
            </div>

            ${uiBuilder.createFormulaSection({
            items: [
                {
                    label: 'TTKG Formula',
                    formula: 'TTKG = (Urine K × Serum Osmolality) / (Serum K × Urine Osmolality)',
                    notes: 'Valid only when Urine Osmolality > Serum Osmolality.'
                }
            ]
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
        // Initialize FHIRDataService
        fhirDataService.initialize(client, patient, container);
        const urineKEl = container.querySelector('#ttkg-urine-k');
        const serumKEl = container.querySelector('#ttkg-serum-k');
        const urineOsmoEl = container.querySelector('#ttkg-urine-osmo');
        const serumOsmoEl = container.querySelector('#ttkg-serum-osmo');
        const resultBox = container.querySelector('#ttkg-result');
        const resultContent = resultBox.querySelector('.ui-result-content');
        const calculate = () => {
            // Clear previous errors
            const errorContainer = container.querySelector('#ttkg-error-container');
            if (errorContainer)
                errorContainer.innerHTML = '';
            const urineK = UnitConverter.getStandardValue(urineKEl, 'mEq/L');
            const serumK = UnitConverter.getStandardValue(serumKEl, 'mEq/L');
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
                // @ts-ignore
                const schema = {
                    // @ts-ignore
                    urinePotassium: { ...ValidationRules.potassium, message: 'Urine K must be valid' },
                    // @ts-ignore
                    potassium: ValidationRules.potassium,
                    // @ts-ignore
                    urineOsmolality: ValidationRules.osmolality,
                    // @ts-ignore
                    serumOsmolality: ValidationRules.osmolality
                };
                // @ts-ignore
                const validation = validateCalculatorInput(inputs, schema);
                if (!validation.isValid) {
                    const hasInput = (urineKEl.value || serumKEl.value || urineOsmoEl.value || serumOsmoEl.value);
                    if (hasInput) {
                        const valuesPresent = (urineK !== null && !isNaN(urineK)) && (serumK !== null && !isNaN(serumK)) && !isNaN(urineOsmo) && !isNaN(serumOsmo);
                        if (valuesPresent || validation.errors.some(e => !e.includes('required'))) {
                            if (errorContainer)
                                displayError(errorContainer, new ValidationError(validation.errors[0], 'VALIDATION_ERROR'));
                        }
                    }
                    resultBox.classList.remove('show');
                    return;
                }
                if (serumK === 0 || urineOsmo === 0) {
                    throw new ValidationError('Serum potassium and Urine osmolality cannot be zero.', 'CALCULATION_ERROR');
                }
                // @ts-ignore - TS might worry about nulls here even though validation passed
                const ttkgValue = (urineK * serumOsmo) / (serumK * urineOsmo);
                // Additional logical check: Urine Osmo > Serum Osmo
                if (urineOsmo <= serumOsmo) {
                    // This is technically a required condition for validity, maybe throw error or warning
                    // The old code just showed a warning in interpretation. I'll stick to warning in interpretation unless it's critical.
                    // But it's invalid physiology for TTKG application usually.
                }
                let interpretation = '';
                let alertType = 'info';
                // @ts-ignore
                if (serumK !== null && serumK < 3.5) {
                    // Hypokalemia
                    if (ttkgValue < 3) {
                        interpretation = 'Suggests non-renal potassium loss (e.g., GI loss, transcellular shift).';
                    }
                    else {
                        interpretation = 'Suggests renal potassium wasting.';
                        alertType = 'warning';
                    }
                }
                else if (serumK !== null && serumK > 5.2) {
                    // Hyperkalemia
                    if (ttkgValue > 10) {
                        interpretation = 'Suggests hyperkalemia is driven by high potassium intake (dietary or iatrogenic).';
                    }
                    else if (ttkgValue < 7) {
                        interpretation = 'Suggests an issue with aldosterone (e.g., hypoaldosteronism or aldosterone resistance).';
                        alertType = 'warning';
                    }
                }
                else {
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
            }
            catch (error) {
                logError(error, { calculator: 'ttkg', action: 'calculate' });
                if (errorContainer)
                    displayError(errorContainer, error);
                resultBox.classList.remove('show');
            }
        };
        [urineKEl, serumKEl, urineOsmoEl, serumOsmoEl].forEach(input => {
            input.addEventListener('input', calculate);
        });
        // Helper
        const setInputValue = (el, val) => {
            if (el) {
                el.value = val.toString();
                el.dispatchEvent(new Event('input'));
            }
        };
        // FHIR auto-population using FHIRDataService
        if (client) {
            // Urine Potassium
            fhirDataService.getObservation(LOINC_CODES.URINE_POTASSIUM, {
                trackStaleness: true,
                stalenessLabel: 'Urine K',
                targetUnit: 'mEq/L',
                unitType: 'electrolyte'
            }).then(result => {
                if (result.value !== null) {
                    setInputValue(urineKEl, result.value.toFixed(1));
                }
            }).catch(e => console.warn(e));
            // Serum Potassium
            fhirDataService.getObservation(LOINC_CODES.POTASSIUM, {
                trackStaleness: true,
                stalenessLabel: 'Serum K',
                targetUnit: 'mEq/L',
                unitType: 'electrolyte'
            }).then(result => {
                if (result.value !== null) {
                    setInputValue(serumKEl, result.value.toFixed(1));
                }
            }).catch(e => console.warn(e));
            // Urine Osmolality (2697-2)
            fhirDataService.getObservation('2697-2', {
                trackStaleness: true,
                stalenessLabel: 'Urine Osmolality'
            }).then(result => {
                if (result.value !== null) {
                    setInputValue(urineOsmoEl, result.value.toFixed(1));
                }
            }).catch(e => console.warn(e));
            // Serum Osmolality (2695-6)
            fhirDataService.getObservation('2695-6', {
                trackStaleness: true,
                stalenessLabel: 'Serum Osmolality'
            }).then(result => {
                if (result.value !== null) {
                    setInputValue(serumOsmoEl, result.value.toFixed(1));
                }
            }).catch(e => console.warn(e));
        }
    }
};
