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

export const serumOsmolality: CalculatorModule = {
    id: 'serum-osmolality',
    title: 'Serum Osmolality/Osmolarity',
    description:
        'Calculates expected serum osmolarity, for comparison to measured osmolality to detect unmeasured compounds in the serum.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            ${uiBuilder.createSection({
            title: 'Lab Values',
            icon: '🧪',
            content: `
                    ${uiBuilder.createInput({
                id: 'osmo-na',
                label: 'Sodium (Na)',
                type: 'number',
                placeholder: 'e.g., 140',
                unitToggle: { type: 'sodium', units: ['mEq/L', 'mmol/L'], default: 'mEq/L' }
            })}
                    ${uiBuilder.createInput({
                id: 'osmo-glucose',
                label: 'Glucose',
                type: 'number',
                placeholder: 'e.g., 100',
                unitToggle: {
                    type: 'glucose',
                    units: ['mg/dL', 'mmol/L'],
                    default: 'mg/dL'
                }
            })}
                    ${uiBuilder.createInput({
                id: 'osmo-bun',
                label: 'BUN',
                type: 'number',
                placeholder: 'e.g., 15',
                unitToggle: {
                    type: 'bun',
                    units: ['mg/dL', 'mmol/L'],
                    default: 'mg/dL'
                }
            })}
                    ${uiBuilder.createInput({
                id: 'osmo-ethanol',
                label: 'Ethanol (Optional)',
                type: 'number',
                placeholder: 'e.g., 0',
                unit: 'mg/dL',
                helpText: 'If known, improves accuracy in suspected ingestion.'
            })}
                `
        })}
            
            <div id="osmolality-error-container"></div>
            <div id="osmolality-result" class="ui-result-box">
                <div class="ui-result-header">Calculated Serum Osmolality</div>
                <div class="ui-result-content"></div>
            </div>
            
            ${uiBuilder.createFormulaSection({
            items: [
                { label: 'Osmolality', formula: '2 × Na + (Glucose / 18) + (BUN / 2.8) + (Ethanol / 4.6)' }
            ]
        })}

            ${uiBuilder.createAlert({
            type: 'info',
            message: `
                    <h4>Normal Range:</h4>
                    <p>275-295 mOsm/kg</p>
                    <p class="mt-10"><strong>Osmolar Gap:</strong> Measured Osmolality - Calculated Osmolality</p>
                    <p>Gap > 10 mOsm/kg suggests unmeasured osmoles (e.g., toxic alcohols, ketones).</p>
                `
        })}
        `;
    },
    initialize: function (client: any, patient: any, container: HTMLElement) {
        uiBuilder.initializeComponents(container);

        // Initialize FHIRDataService
        fhirDataService.initialize(client, patient, container);

        const naInput = container.querySelector('#osmo-na') as HTMLInputElement;
        const glucoseInput = container.querySelector('#osmo-glucose') as HTMLInputElement;
        const bunInput = container.querySelector('#osmo-bun') as HTMLInputElement;
        const ethanolInput = container.querySelector('#osmo-ethanol') as HTMLInputElement;
        const resultBox = container.querySelector('#osmolality-result');

        const calculateAndUpdate = () => {
            // Clear previous errors
            const errorContainer = container.querySelector('#osmolality-error-container');
            if (errorContainer) errorContainer.innerHTML = '';

            const na = UnitConverter.getStandardValue(naInput, 'mEq/L');
            const glucoseMgDl = UnitConverter.getStandardValue(glucoseInput, 'mg/dL');
            const bunMgDl = UnitConverter.getStandardValue(bunInput, 'mg/dL');
            const ethanol = parseFloat(ethanolInput.value) || 0;

            try {
                // Validation inputs
                const inputs = {
                    sodium: na,
                    glucose: glucoseMgDl,
                    bun: bunMgDl,
                    ethanol: ethanol
                };
                const schema = {
                    sodium: ValidationRules.sodium,
                    glucose: ValidationRules.glucose,
                    bun: ValidationRules.bun,
                    ethanol: ValidationRules.ethanol
                };

                const validation = validateCalculatorInput(inputs, schema);

                if (!validation.isValid) {
                    const hasInput = (naInput.value || glucoseInput.value || bunInput.value || ethanolInput.value);

                    if (hasInput && resultBox) {
                        const valuesPresent = na !== null && glucoseMgDl !== null && bunMgDl !== null && !isNaN(na) && !isNaN(glucoseMgDl) && !isNaN(bunMgDl);
                        if (valuesPresent || validation.errors.some((e: string) => !e.includes('required'))) {
                            if (errorContainer) displayError(errorContainer as HTMLElement, new ValidationError(validation.errors[0], 'VALIDATION_ERROR'));
                        }
                        resultBox.classList.remove('show');
                    }
                    return;
                }

                if (resultBox) {
                    const resultContent = resultBox.querySelector('.ui-result-content');
                    const calculatedOsmolality = 2 * na! + glucoseMgDl! / 18 + bunMgDl! / 2.8 + ethanol / 4.6;

                    if (!isFinite(calculatedOsmolality) || isNaN(calculatedOsmolality)) throw new Error("Calculation Error");

                    // Determine interpretation
                    let interpretation = '';
                    let alertClass = 'ui-alert-success';
                    let alertType: 'success' | 'warning' | 'danger' | 'info' = 'success';
                    let alertMsg = 'Within normal range.';

                    if (calculatedOsmolality < 275) {
                        interpretation = 'Low Osmolality';
                        alertClass = 'ui-alert-info';
                        alertType = 'info';
                        alertMsg = 'Below normal range (275-295 mOsm/kg).';
                    } else if (calculatedOsmolality > 295) {
                        interpretation = 'High Osmolality';
                        alertClass = 'ui-alert-warning';
                        alertType = 'warning';
                        alertMsg = 'Above normal range (275-295 mOsm/kg).';
                    }

                    if (resultContent) {
                        resultContent.innerHTML = `
                        ${uiBuilder.createResultItem({
                            label: 'Calculated Osmolality',
                            value: calculatedOsmolality.toFixed(1),
                            unit: 'mOsm/kg',
                            interpretation: interpretation,
                            alertClass: alertClass
                        })}
                        ${uiBuilder.createAlert({
                            type: alertType,
                            message: alertMsg
                        })}
                        ${uiBuilder.createSection({
                            title: 'Calculation Breakdown',
                            content: `
                                <div class="text-sm text-muted">
                                    <div>2 × Na: ${(2 * na!).toFixed(1)}</div>
                                    <div>Glucose / 18: ${(glucoseMgDl! / 18).toFixed(1)}</div>
                                    <div>BUN / 2.8: ${(bunMgDl! / 2.8).toFixed(1)}</div>
                                    ${ethanol > 0 ? `<div>Ethanol / 4.6: ${(ethanol / 4.6).toFixed(1)}</div>` : ''}
                                </div>
                            `
                        })}
                    `;
                    }
                    resultBox.classList.add('show');
                }
            } catch (error) {
                logError(error as Error, { calculator: 'serum-osmolality', action: 'calculate' });
                if (errorContainer) displayError(errorContainer as HTMLElement, error as Error);
                if (resultBox) resultBox.classList.remove('show');
            }
        };

        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculateAndUpdate);
            input.addEventListener('change', calculateAndUpdate);
        });

        // Auto-populate using FHIRDataService
        if (client) {
            fhirDataService.getObservation(LOINC_CODES.SODIUM, {
                trackStaleness: true,
                stalenessLabel: 'Sodium',
                targetUnit: 'mEq/L',
                unitType: 'sodium'
            }).then(result => {
                if (result.value !== null) {
                    naInput.value = result.value.toFixed(0);
                    naInput.dispatchEvent(new Event('input'));
                }
            }).catch(e => console.warn(e));

            fhirDataService.getObservation(LOINC_CODES.GLUCOSE, {
                trackStaleness: true,
                stalenessLabel: 'Glucose',
                targetUnit: 'mg/dL',
                unitType: 'glucose'
            }).then(result => {
                if (result.value !== null) {
                    glucoseInput.value = result.value.toFixed(0);
                    glucoseInput.dispatchEvent(new Event('input'));
                }
            }).catch(e => console.warn(e));

            fhirDataService.getObservation(LOINC_CODES.BUN, {
                trackStaleness: true,
                stalenessLabel: 'BUN',
                targetUnit: 'mg/dL',
                unitType: 'bun'
            }).then(result => {
                if (result.value !== null) {
                    bunInput.value = result.value.toFixed(0);
                    bunInput.dispatchEvent(new Event('input'));
                }
            }).catch(e => console.warn(e));
        }

        calculateAndUpdate();
    }
};
