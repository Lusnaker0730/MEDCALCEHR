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

interface ABGValues {
    ph: number;
    pco2: number | null;
    hco3: number | null;
    sodium: number | null;
    chloride: number | null;
    albumin: number | null;
}

interface ABGInputs {
    ph: number;
    paCO2: number | null;
    bicarbonate: number | null;
    sodium?: number | null;
    chloride?: number | null;
    albumin?: number | null;
}

export const abgAnalyzer: CalculatorModule = {
    id: 'abg-analyzer',
    title: 'Arterial Blood Gas (ABG) Analyzer',
    description: 'Interprets arterial blood gas values to identify acid-base disorders.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>

            ${uiBuilder.createAlert({
            type: 'warning',
            message: '<strong>⚠️ Important</strong><br>This analyzer should not substitute for clinical context. Sodium, Chloride, and Albumin are required for accurate anion gap calculation.'
        })}

            ${uiBuilder.createSection({
            title: 'ABG Values',
            icon: '🧪',
            content: `
                    ${uiBuilder.createInput({
                id: 'abg-ph',
                label: 'pH',
                type: 'number',
                step: 0.01,
                placeholder: 'e.g., 7.40'
            })}
                    ${uiBuilder.createInput({
                id: 'abg-pco2',
                label: 'PaCO₂',
                type: 'number',
                placeholder: 'e.g., 40',
                unitToggle: { type: 'pressure', units: ['mmHg', 'kPa'], default: 'mmHg' }
            })}
                    ${uiBuilder.createInput({
                id: 'abg-hco3',
                label: 'HCO₃⁻',
                type: 'number',
                placeholder: 'e.g., 24',
                unitToggle: { type: 'electrolyte', units: ['mEq/L', 'mmol/L'], default: 'mEq/L' }
            })}
                `
        })}

            ${uiBuilder.createSection({
            title: 'Electrolytes & Albumin (for Anion Gap)',
            icon: '🧂',
            content: `
                    ${uiBuilder.createInput({
                id: 'abg-sodium',
                label: 'Sodium (Na⁺)',
                type: 'number',
                placeholder: 'e.g., 140',
                unitToggle: { type: 'electrolyte', units: ['mEq/L', 'mmol/L'], default: 'mEq/L' }
            })}
                    ${uiBuilder.createInput({
                id: 'abg-chloride',
                label: 'Chloride (Cl⁻)',
                type: 'number',
                placeholder: 'e.g., 100',
                unitToggle: { type: 'electrolyte', units: ['mEq/L', 'mmol/L'], default: 'mEq/L' }
            })}
                    ${uiBuilder.createInput({
                id: 'abg-albumin',
                label: 'Albumin',
                type: 'number',
                step: 0.1,
                placeholder: 'e.g., 4.0',
                unitToggle: { type: 'albumin', units: ['g/dL', 'g/L'], default: 'g/dL' }
            })}
                `
        })}

            ${uiBuilder.createSection({
            title: 'Chronicity (if respiratory)',
            icon: '⏱️',
            content: uiBuilder.createRadioGroup({
                name: 'chronicity',
                options: [
                    { value: 'acute', label: 'Acute', checked: true },
                    { value: 'chronic', label: 'Chronic' }
                ]
            })
        })}
            
            <div id="abg-error-container"></div>
            <div id="abg-result" class="ui-result-box">
                <div class="ui-result-header">ABG Interpretation</div>
                <div class="ui-result-content"></div>
            </div>

            ${uiBuilder.createFormulaSection({
            items: [
                { label: 'Anion Gap', formula: 'Na - (Cl + HCO₃⁻)', notes: 'All values in mEq/L' },
                { label: 'Delta Gap', formula: 'Anion Gap - 12', notes: 'Normal anion gap is 10-12 mEq/L' },
                { label: 'Albumin Corrected AG', formula: 'Anion Gap + [2.5 × (4 - Albumin)]', notes: 'Albumin in g/dL' },
                { label: 'Albumin Corrected Delta Gap', formula: 'Albumin Corrected AG - 12' },
                { label: 'Delta Ratio', formula: 'Delta Anion Gap / (24 - HCO₃⁻)' },
                { label: 'Albumin Corrected Delta Ratio', formula: 'Albumin Corrected Delta Gap / (24 - HCO₃⁻)' }
            ]
        })}

            ${uiBuilder.createAlert({
            type: 'info',
            message: `
                <h4>📊 Delta Ratio Interpretation</h4>
                <p class="text-sm mb-10">The delta ratio compares the amount of additional anion in the body to the amount of additional H⁺. The anion's volume of distribution and its excretion affect this ratio. Organic acids with a greater distribution may produce lower anion gaps compared to inorganic acids, which may be confined to the extracellular compartment.</p>
                <div class="ui-data-table">
                    <table>
                        <thead>
                            <tr><th>Delta Ratio</th><th>Suggests...</th></tr>
                        </thead>
                        <tbody>
                            <tr><td>&lt;0.4</td><td>Pure normal anion gap acidosis</td></tr>
                            <tr><td>0.4-0.8</td><td>Mixed high and normal anion gap acidosis</td></tr>
                            <tr><td>0.8-2.0</td><td>Pure anion gap acidosis</td></tr>
                            <tr><td>&gt;2</td><td>High anion gap acidosis with pre-existing metabolic alkalosis</td></tr>
                        </tbody>
                    </table>
                </div>
            `
        })}

            <div class="info-section mt-20 text-sm text-muted">
                <h4>📚 Reference</h4>
                <p>Baillie, J K. (2008). Simple, easily memorised "rules of thumb" for the rapid assessment of physiological compensation for respiratory acid-base disorders. <em>Thorax</em>.</p>
            </div>
        `;
    },
    initialize: function (client: any, patient: any, container: HTMLElement) {
        uiBuilder.initializeComponents(container);

        // Initialize FHIRDataService
        fhirDataService.initialize(client, patient, container);

        const fields = {
            ph: container.querySelector('#abg-ph') as HTMLInputElement,
            pco2: container.querySelector('#abg-pco2') as HTMLInputElement,
            hco3: container.querySelector('#abg-hco3') as HTMLInputElement,
            sodium: container.querySelector('#abg-sodium') as HTMLInputElement,
            chloride: container.querySelector('#abg-chloride') as HTMLInputElement,
            albumin: container.querySelector('#abg-albumin') as HTMLInputElement
        };
        const resultBox = container.querySelector('#abg-result');
        const resultContent = resultBox ? resultBox.querySelector('.ui-result-content') : null;

        const interpret = () => {
            // Clear previous errors
            const errorContainer = container.querySelector('#abg-error-container');
            if (errorContainer) errorContainer.innerHTML = '';

            const vals: ABGValues = {
                ph: parseFloat(fields.ph.value),
                pco2: UnitConverter.getStandardValue(fields.pco2, 'mmHg'),
                hco3: UnitConverter.getStandardValue(fields.hco3, 'mEq/L'),
                sodium: UnitConverter.getStandardValue(fields.sodium, 'mEq/L'),
                chloride: UnitConverter.getStandardValue(fields.chloride, 'mEq/L'),
                albumin: UnitConverter.getStandardValue(fields.albumin, 'g/dL')
            };

            try {
                // Validation inputs
                const inputs: ABGInputs = {
                    ph: vals.ph,
                    paCO2: vals.pco2,
                    bicarbonate: vals.hco3
                };

                // Add optional fields to inputs if present to validate them too
                if (vals.sodium !== null && !isNaN(vals.sodium)) inputs.sodium = vals.sodium;
                if (vals.chloride !== null && !isNaN(vals.chloride)) inputs.chloride = vals.chloride;
                if (vals.albumin !== null && !isNaN(vals.albumin)) inputs.albumin = vals.albumin;

                const schema: any = {
                    ph: ValidationRules.pH,
                    paCO2: ValidationRules.arterialGas.paCO2,
                    bicarbonate: ValidationRules.bicarbonate
                };

                if (inputs.sodium !== undefined) schema.sodium = ValidationRules.sodium;
                if (inputs.chloride !== undefined) schema.chloride = ValidationRules.chloride;
                if (inputs.albumin !== undefined) schema.albumin = ValidationRules.albumin;

                const validation = validateCalculatorInput(inputs, schema);

                if (!validation.isValid) {
                    // Check if at least one field has input to avoid error on empty load
                    const hasInput = Object.values(fields).some(f => f.value !== '');

                    if (hasInput) {
                        const corePresent = !isNaN(vals.ph) && vals.pco2 !== null && !isNaN(vals.pco2) && vals.hco3 !== null && !isNaN(vals.hco3);
                        // Validation errors are strings
                        if (corePresent || validation.errors.some((e: string) => !e.includes('required'))) {
                            if (errorContainer) displayError(errorContainer as HTMLElement, new ValidationError(validation.errors[0], 'VALIDATION_ERROR'));
                        }
                    }

                    if (resultBox) resultBox.classList.remove('show');
                    return;
                }

                // Ensure required values are present
                if (vals.pco2 === null || vals.hco3 === null) {
                    if (resultBox) resultBox.classList.remove('show');
                    return;
                }

                let primaryDisorder = '';
                let anionGapInfo = '';
                let alertClass = 'ui-alert-info';

                // Primary Disorder Logic
                if (vals.ph < 7.35) {
                    alertClass = 'ui-alert-danger';
                    if (vals.pco2 > 45) primaryDisorder = 'Respiratory Acidosis';
                    else if (vals.hco3 < 22) primaryDisorder = 'Metabolic Acidosis';
                    else primaryDisorder = 'Mixed Acidosis';
                } else if (vals.ph > 7.45) {
                    alertClass = 'ui-alert-danger';
                    if (vals.pco2 < 35) primaryDisorder = 'Respiratory Alkalosis';
                    else if (vals.hco3 > 26) primaryDisorder = 'Metabolic Alkalosis';
                    else primaryDisorder = 'Mixed Alkalosis';
                } else {
                    alertClass = 'ui-alert-success';
                    if (vals.pco2 > 45 && vals.hco3 > 26) primaryDisorder = 'Compensated Respiratory Acidosis/Metabolic Alkalosis';
                    else if (vals.pco2 < 35 && vals.hco3 < 22) primaryDisorder = 'Compensated Metabolic Acidosis/Respiratory Alkalosis';
                    else primaryDisorder = 'Normal Acid-Base Status';
                }

                // Anion Gap Logic
                if (vals.sodium !== null && !isNaN(vals.sodium) &&
                    vals.chloride !== null && !isNaN(vals.chloride) &&
                    vals.hco3 !== null && !isNaN(vals.hco3)) {

                    const anionGap = vals.sodium - (vals.chloride + vals.hco3);
                    let correctedAG = anionGap;

                    if (vals.albumin !== null && !isNaN(vals.albumin)) {
                        correctedAG = anionGap + 2.5 * (4.0 - vals.albumin);
                    }

                    if (correctedAG > 12) {
                        anionGapInfo = `High Anion Gap (${correctedAG.toFixed(1)})`;
                        const deltaDelta = correctedAG - 12 + vals.hco3;
                        if (deltaDelta > 28) anionGapInfo += ' + Metabolic Alkalosis';
                        else if (deltaDelta < 22) anionGapInfo += ' + Non-Gap Acidosis';
                    } else {
                        anionGapInfo = `Normal Anion Gap (${correctedAG.toFixed(1)})`;
                    }
                }

                if (resultContent) {
                    resultContent.innerHTML = `
                    ${uiBuilder.createResultItem({
                        label: 'Primary Disorder',
                        value: primaryDisorder,
                        alertClass: alertClass
                    })}
                    ${anionGapInfo ? uiBuilder.createResultItem({
                        label: 'Anion Gap Assessment',
                        value: anionGapInfo
                    }) : ''}
                `;
                }
                if (resultBox) resultBox.classList.add('show');
            } catch (error) {
                logError(error as Error, { calculator: 'abg-analyzer', action: 'calculate' });
                if (errorContainer) displayError(errorContainer as HTMLElement, error as Error);
                if (resultBox) resultBox.classList.remove('show');
            }
        };

        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', interpret);
            input.addEventListener('change', interpret); // Important for unit toggles
        });
        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', interpret);
        });

        // Helper
        const setInputValue = (field: HTMLInputElement, val: string) => {
            if (field) {
                field.value = val;
                field.dispatchEvent(new Event('input'));
            }
        };

        // FHIR Auto-populate using FHIRDataService
        if (client) {
            // pH (11558-4)
            fhirDataService.getObservation('11558-4', {
                trackStaleness: true,
                stalenessLabel: 'pH'
            }).then(result => {
                if (result.value !== null) {
                    setInputValue(fields.ph, result.value.toFixed(2));
                }
            }).catch(e => console.warn(e));

            // PaCO2 (11557-6)
            fhirDataService.getObservation('11557-6', {
                trackStaleness: true,
                stalenessLabel: 'PaCO2',
                targetUnit: 'mmHg',
                unitType: 'pressure'
            }).then(result => {
                if (result.value !== null) {
                    setInputValue(fields.pco2, result.value.toFixed(1));
                }
            }).catch(e => console.warn(e));

            // HCO3 (14627-4)
            fhirDataService.getObservation('14627-4', {
                trackStaleness: true,
                stalenessLabel: 'HCO3',
                targetUnit: 'mEq/L',
                unitType: 'electrolyte'
            }).then(result => {
                if (result.value !== null) {
                    setInputValue(fields.hco3, result.value.toFixed(1));
                }
            }).catch(e => console.warn(e));

            // Sodium
            fhirDataService.getObservation(LOINC_CODES.SODIUM, {
                trackStaleness: true,
                stalenessLabel: 'Sodium',
                targetUnit: 'mEq/L',
                unitType: 'electrolyte'
            }).then(result => {
                if (result.value !== null) {
                    setInputValue(fields.sodium, result.value.toFixed(1));
                }
            }).catch(e => console.warn(e));

            // Chloride (2075-0)
            fhirDataService.getObservation('2075-0', {
                trackStaleness: true,
                stalenessLabel: 'Chloride',
                targetUnit: 'mEq/L',
                unitType: 'electrolyte'
            }).then(result => {
                if (result.value !== null) {
                    setInputValue(fields.chloride, result.value.toFixed(1));
                }
            }).catch(e => console.warn(e));

            // Albumin
            fhirDataService.getObservation(LOINC_CODES.ALBUMIN, {
                trackStaleness: true,
                stalenessLabel: 'Albumin',
                targetUnit: 'g/dL',
                unitType: 'albumin'
            }).then(result => {
                if (result.value !== null) {
                    setInputValue(fields.albumin, result.value.toFixed(1));
                }
            }).catch(e => console.warn(e));
        }
    }
};
