/**
 * Formula Calculator Factory
 * 
 * Specifically designed for "pure calculation" calculators like BMI, QTc, etc.
 * Key features:
 * - Handles numeric inputs with unit conversions
 * - Handles radio/select inputs for configuration options
 * - Automatically standardizes units before passing to calculate function
 * - Standardized result display
 * - Built-in validation and error handling
 * - Built-in FHIR auto-population
 */

import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import {
    fhirDataService,
    FieldDataRequirement
} from '../../fhir-data-service.js';
import { ValidationError, displayError } from '../../errorHandler.js';

// ==========================================
// Configuration Interfaces
// ==========================================

export interface FormulaNumberInputConfig {
    type: 'number';
    id: string;
    label: string;
    /** The standard unit expected by the calculation function */
    standardUnit?: string;
    /** Unit toggle configuration */
    unitConfig?: {
        type: string; // e.g. 'weight'
        units: string[]; // e.g. ['kg', 'lbs']
        default: string; // Should match standardUnit usually
    };
    placeholder?: string;
    min?: number;
    max?: number;
    step?: number;
    loincCode?: string; // For FHIR auto-population
    helpText?: string;
    required?: boolean; // Default true
}

export interface FormulaRadioInputConfig {
    type: 'radio';
    id: string; // Used as 'name' for radio group
    label: string;
    options: { label: string; value: string; checked?: boolean }[];
    helpText?: string;
}

export interface FormulaSelectInputConfig {
    type: 'select';
    id: string;
    label: string;
    options: { label: string; value: string }[];
    defaultValue?: string;
    helpText?: string;
}

export type FormulaInputConfig = FormulaNumberInputConfig | FormulaRadioInputConfig | FormulaSelectInputConfig;

export interface FormulaResultItem {
    label: string;
    value: number | string;
    unit?: string;
    interpretation?: string;
    alertClass?: 'success' | 'warning' | 'danger' | 'info';
}

export interface FormulaConfig {
    id: string;
    title: string;
    description: string;
    inputs: FormulaInputConfig[];

    /**
     * Formulas to display in the reference section
     */
    formulas?: {
        label: string;
        formula: string;
        notes?: string;
    }[];

    /**
     * Calculation function
     * Receives values in their STANDARD units (as defined in input config)
     * Numeric inputs return number, others return string
     * Returns either a list of result items or null if calculation cannot be performed
     */
    calculate: (values: Record<string, number | string>) => FormulaResultItem[] | null;

    /**
     * Optional custom result renderer if the standard list of items is insufficient
     */
    customResultRenderer?: (results: FormulaResultItem[]) => string;
}

export interface CalculatorModule {
    id: string;
    title: string;
    description: string;
    generateHTML: () => string;
    initialize: (client: any, patient: any, container: HTMLElement) => void;
}

// ==========================================
// Factory Function
// ==========================================

export function createFormulaCalculator(config: FormulaConfig): CalculatorModule {
    return {
        id: config.id,
        title: config.title,
        description: config.description,

        generateHTML(): string {
            // Generate Input Section
            const inputsHTML = config.inputs.map(input => {
                if (input.type === 'number') {
                    return uiBuilder.createInput({
                        id: input.id,
                        label: input.label,
                        type: 'number',
                        placeholder: input.placeholder,
                        min: input.min,
                        max: input.max,
                        step: input.step,
                        helpText: input.helpText,
                        // If unit toggle is enabled, do NOT pass 'unit' to uiBuilder, otherwise it renders both static text AND the toggle button
                        unit: input.unitConfig ? undefined : input.standardUnit,
                        unitToggle: input.unitConfig ? {
                            type: input.unitConfig.type,
                            units: input.unitConfig.units,
                            default: input.unitConfig.default
                        } : undefined,
                        required: input.required !== false
                    });
                } else if (input.type === 'radio') {
                    // Manually generating radio HTML as uiBuilder might not have perfect flexible method or ensuring structure
                    return uiBuilder.createRadioGroup({
                        name: input.id,
                        label: input.label,
                        options: input.options,
                        helpText: input.helpText
                    });
                } else if (input.type === 'select') {
                    return uiBuilder.createSelect({
                        id: input.id,
                        label: input.label,
                        options: input.options,
                        helpText: input.helpText
                    });
                }
                return '';
            }).join('');

            const inputSection = uiBuilder.createSection({
                title: 'Measurements',
                content: inputsHTML
            });

            // Generate Formula Reference Section
            const formulaSection = config.formulas ? uiBuilder.createFormulaSection({
                items: config.formulas
            }) : '';

            return `
                <div class="calculator-header">
                    <h3>${config.title}</h3>
                    <p class="description">${config.description}</p>
                </div>

                ${inputSection}

                <div id="${config.id}-error-container"></div>
                
                ${uiBuilder.createResultBox({
                id: `${config.id}-result`,
                title: 'Results'
            })}
                
                ${formulaSection}
            `;
        },

        initialize(client: any, patient: any, container: HTMLElement): void {
            // Initialize standard UI components (unit toggles, radio interactions)
            uiBuilder.initializeComponents(container);

            // Initialize FHIR Service
            fhirDataService.initialize(client, patient, container);

            const resultBox = container.querySelector(`#${config.id}-result`) as HTMLElement;
            const errorContainer = container.querySelector(`#${config.id}-error-container`) as HTMLElement;

            // ----------------------------------------------------------------
            // Calculation Logic
            // ----------------------------------------------------------------
            const performCalculation = () => {
                // 1. Clear Errors
                if (errorContainer) errorContainer.innerHTML = '';

                // 2. Gather and Standarize Inputs
                const values: Record<string, number | string> = {};
                const errors: string[] = [];

                let allRequiredPresent = true;

                config.inputs.forEach(inputConfig => {
                    if (inputConfig.type === 'number') {
                        const inputEl = container.querySelector(`#${inputConfig.id}`) as HTMLInputElement;
                        if (!inputEl) return;

                        // Skip empty fields
                        if (inputEl.value === '') {
                            if (inputConfig.required !== false) {
                                allRequiredPresent = false;
                            }
                            return;
                        }

                        let val = parseFloat(inputEl.value);

                        // Validate basic number
                        if (isNaN(val)) {
                            allRequiredPresent = false;
                            return;
                        }

                        // Handle Unit Conversion to Standard Unit using custom helper
                        if (inputConfig.standardUnit) {
                            try {
                                const standardVal = UnitConverter.getStandardValue(inputEl, inputConfig.standardUnit);
                                if (standardVal !== null) {
                                    val = standardVal;
                                }
                            } catch (e) {
                                // Silently fail unit conversion, use raw
                            }
                        }

                        // Range Validation
                        if (inputConfig.min !== undefined && val < inputConfig.min) {
                            errors.push(`${inputConfig.label} must be at least ${inputConfig.min}`);
                        }
                        if (inputConfig.max !== undefined && val > inputConfig.max) {
                            errors.push(`${inputConfig.label} must be at most ${inputConfig.max}`);
                        }

                        values[inputConfig.id] = val;

                    } else if (inputConfig.type === 'radio') {
                        const checked = container.querySelector(`input[name="${inputConfig.id}"]:checked`) as HTMLInputElement;
                        if (checked) {
                            values[inputConfig.id] = checked.value;
                        }
                    } else if (inputConfig.type === 'select') {
                        const select = container.querySelector(`#${inputConfig.id}`) as HTMLSelectElement;
                        if (select) {
                            values[inputConfig.id] = select.value;
                        }
                    }
                });

                // 3. Handle Validation Errors
                if (errors.length > 0) {
                    if (resultBox) resultBox.classList.remove('show');
                    if (errorContainer && allRequiredPresent) {
                        displayError(errorContainer, new ValidationError(errors[0]));
                    }
                    return;
                }

                if (!allRequiredPresent) {
                    if (resultBox) resultBox.classList.remove('show');
                    return;
                }

                // 4. Run Calculation
                try {
                    const results = config.calculate(values);

                    if (results && resultBox) {
                        const contentEl = resultBox.querySelector('.ui-result-content');
                        if (contentEl) {
                            if (config.customResultRenderer) {
                                contentEl.innerHTML = config.customResultRenderer(results);
                            } else {
                                contentEl.innerHTML = results.map(r => uiBuilder.createResultItem({
                                    label: r.label,
                                    value: r.value,
                                    unit: r.unit,
                                    interpretation: r.interpretation,
                                    alertClass: r.alertClass ? `ui-alert-${r.alertClass}` : ''
                                })).join('');
                            }
                        }
                        resultBox.classList.add('show');
                    } else if (resultBox) {
                        resultBox.classList.remove('show');
                    }
                } catch (e) {
                    if (errorContainer) {
                        displayError(errorContainer, e as Error);
                    }
                }
            };

            // ----------------------------------------------------------------
            // Event Listeners
            // ----------------------------------------------------------------
            const inputs = container.querySelectorAll('input, select');
            inputs.forEach(el => {
                el.addEventListener('input', performCalculation);
                el.addEventListener('change', performCalculation);
            });

            // ----------------------------------------------------------------
            // FHIR Auto-population
            // ----------------------------------------------------------------
            const autoPopulate = async () => {
                // Filter only number inputs that have loincCode
                const fhirInputs = config.inputs.filter(
                    (i): i is FormulaNumberInputConfig => i.type === 'number' && !!i.loincCode
                );

                if (fhirInputs.length === 0) return;

                if (fhirDataService.isReady()) {
                    const requirements: FieldDataRequirement[] = fhirInputs
                        .map(i => ({
                            inputId: `#${i.id}`,
                            code: i.loincCode!,
                            label: i.label,
                            targetUnit: i.unitConfig ? i.unitConfig.default : i.standardUnit,
                            unitType: i.unitConfig?.type,
                            decimals: 1 // Default to 1 decimal place
                        }));

                    await fhirDataService.autoPopulateFields(requirements);
                    performCalculation();
                }
            };

            autoPopulate();
        }
    };
}
