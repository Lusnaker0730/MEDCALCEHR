import {
    getMostRecentObservation,
} from '../../utils.js';
import { createStalenessTracker } from '../../data-staleness.js';
import { LOINC_CODES } from '../../fhir-codes.js';
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

export const serumAnionGap: CalculatorModule = {
    id: 'serum-anion-gap',
    title: 'Serum Anion Gap',
    description: 'Evaluates states of metabolic acidosis.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            ${uiBuilder.createSection({
            title: 'Electrolytes',
            icon: '🧪',
            content: `
                    ${uiBuilder.createInput({
                id: 'sag-na',
                label: 'Sodium (Na⁺)',
                type: 'number',
                placeholder: 'e.g., 140',
                unitToggle: { type: 'electrolyte', units: ['mEq/L', 'mmol/L'], default: 'mEq/L' }
            })}
                    ${uiBuilder.createInput({
                id: 'sag-cl',
                label: 'Chloride (Cl⁻)',
                type: 'number',
                placeholder: 'e.g., 100',
                unitToggle: { type: 'electrolyte', units: ['mEq/L', 'mmol/L'], default: 'mEq/L' }
            })}
                    ${uiBuilder.createInput({
                id: 'sag-hco3',
                label: 'Bicarbonate (HCO₃⁻)',
                type: 'number',
                placeholder: 'e.g., 24',
                unitToggle: { type: 'electrolyte', units: ['mEq/L', 'mmol/L'], default: 'mEq/L' }
            })}
                `
        })}
            
            <div id="sag-error-container"></div>
            <div id="sag-result" class="ui-result-box">
                <div class="ui-result-header">Anion Gap Result</div>
                <div class="ui-result-content"></div>
            </div>
            
            ${uiBuilder.createFormulaSection({
            items: [
                { label: 'Anion Gap', formula: 'Na⁺ - (Cl⁻ + HCO₃⁻)' }
            ]
        })}

            ${uiBuilder.createAlert({
            type: 'info',
            message: `
                    <h4>Interpretation:</h4>
                    <ul class="info-list">
                        <li><strong>Normal Range:</strong> 6-12 mEq/L</li>
                        <li><strong>High (>12):</strong> High Anion Gap Metabolic Acidosis (MUDPILES)</li>
                        <li><strong>Low (<6):</strong> Uncommon, possible lab error or hypoalbuminemia</li>
                    </ul>
                    <p class="mt-10"><strong>Note:</strong> For every 1 g/dL decrease in albumin below 4 g/dL, add 2.5 mEq/L to the anion gap (corrected gap).</p>
                `
        })}
        `;
    },
    initialize: function (client: any, patient: any, container: HTMLElement) {
        uiBuilder.initializeComponents(container);

        // Initialize staleness tracker
        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);

        const naInput = container.querySelector('#sag-na') as HTMLInputElement;
        const clInput = container.querySelector('#sag-cl') as HTMLInputElement;
        const hco3Input = container.querySelector('#sag-hco3') as HTMLInputElement;
        const resultBox = container.querySelector('#sag-result');


        const calculate = () => {
            // Clear previous errors
            const errorContainer = container.querySelector('#sag-error-container');
            if (errorContainer) errorContainer.innerHTML = '';

            const na = UnitConverter.getStandardValue(naInput, 'mEq/L');
            const cl = UnitConverter.getStandardValue(clInput, 'mEq/L');
            const hco3 = UnitConverter.getStandardValue(hco3Input, 'mEq/L');

            try {
                // Validation inputs
                const inputs = {
                    sodium: na,
                    chloride: cl,
                    bicarbonate: hco3
                };
                const schema = {
                    sodium: ValidationRules.sodium,
                    chloride: ValidationRules.chloride,
                    bicarbonate: ValidationRules.bicarbonate
                };

                const validation = validateCalculatorInput(inputs, schema);

                if (!validation.isValid) {
                    const hasInput = (naInput.value || clInput.value || hco3Input.value);

                    if (hasInput && resultBox) {
                        const valuesPresent = na !== null && cl !== null && hco3 !== null && !isNaN(na) && !isNaN(cl) && !isNaN(hco3);
                        if (valuesPresent || validation.errors.some((e: string) => !e.includes('required'))) {
                            if (errorContainer) displayError(errorContainer as HTMLElement, new ValidationError(validation.errors[0], 'VALIDATION_ERROR'));
                        }
                        resultBox.classList.remove('show');
                    }
                    return;
                }

                if (resultBox) {
                    const resultContent = resultBox.querySelector('.ui-result-content');
                    const anionGap = na! - (cl! + hco3!);

                    if (!isFinite(anionGap) || isNaN(anionGap)) throw new Error("Calculation Error");

                    let interpretation = '';
                    let alertClass = 'ui-alert-success';
                    let alertType: 'success' | 'warning' | 'danger' | 'info' = 'success';
                    let alertMsg = '';

                    if (anionGap > 12) {
                        interpretation = 'High Anion Gap';
                        alertClass = 'ui-alert-danger';
                        alertType = 'danger';
                        alertMsg = 'Suggests metabolic acidosis (e.g., DKA, lactic acidosis, renal failure, toxic ingestions - MUDPILES).';
                    } else if (anionGap < 6) {
                        interpretation = 'Low Anion Gap';
                        alertClass = 'ui-alert-warning';
                        alertType = 'warning';
                        alertMsg = 'Less common, may be due to lab error, hypoalbuminemia, or paraproteinemia.';
                    } else {
                        interpretation = 'Normal Anion Gap';
                        alertClass = 'ui-alert-success';
                        alertType = 'success';
                        alertMsg = 'Metabolic acidosis, if present, is likely non-anion gap (e.g., diarrhea, renal tubular acidosis).';
                    }

                    if (resultContent) {
                        resultContent.innerHTML = `
                        ${uiBuilder.createResultItem({
                            label: 'Serum Anion Gap',
                            value: anionGap.toFixed(1),
                            unit: 'mEq/L',
                            interpretation: interpretation,
                            alertClass: alertClass
                        })}
                        ${uiBuilder.createAlert({
                            type: alertType,
                            message: alertMsg
                        })}
                    `;
                    }
                    resultBox.classList.add('show');
                }
            } catch (error) {
                logError(error as Error, { calculator: 'serum-anion-gap', action: 'calculate' });
                if (errorContainer) displayError(errorContainer as HTMLElement, error as Error);
                if (resultBox) resultBox.classList.remove('show');
            }
        };

        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculate);
            input.addEventListener('change', calculate);
        });

        // Auto-populate from FHIR
        if (client) {
            getMostRecentObservation(client, LOINC_CODES.SODIUM).then(obs => {
                if (obs && obs.valueQuantity && obs.valueQuantity.value !== undefined) {
                    naInput.value = obs.valueQuantity.value.toFixed(0);
                    naInput.dispatchEvent(new Event('input'));
                    stalenessTracker.trackObservation('#sag-na', obs, LOINC_CODES.SODIUM, 'Sodium');
                }
            }).catch(e => console.warn(e));
            getMostRecentObservation(client, LOINC_CODES.CHLORIDE).then(obs => {
                if (obs && obs.valueQuantity && obs.valueQuantity.value !== undefined) {
                    clInput.value = obs.valueQuantity.value.toFixed(0);
                    clInput.dispatchEvent(new Event('input'));
                    stalenessTracker.trackObservation('#sag-cl', obs, LOINC_CODES.CHLORIDE, 'Chloride');
                }
            }).catch(e => console.warn(e));
            getMostRecentObservation(client, LOINC_CODES.BICARBONATE).then(obs => {
                if (obs && obs.valueQuantity && obs.valueQuantity.value !== undefined) {
                    hco3Input.value = obs.valueQuantity.value.toFixed(0);
                    hco3Input.dispatchEvent(new Event('input'));
                    stalenessTracker.trackObservation('#sag-hco3', obs, LOINC_CODES.BICARBONATE, 'Bicarbonate');
                }
            }).catch(e => console.warn(e));
        }

    }
};
