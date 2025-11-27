import { uiBuilder } from './ui-builder.js';
import { UnitConverter } from './unit-converter.js';

/**
 * GenericCalculator
 * 
 * A runtime engine that renders and executes calculators defined in JSON.
 */
export class GenericCalculator {
    constructor(definition) {
        this.def = definition;
        this.id = definition.meta.id;
        this.title = definition.meta.title;
        this.description = definition.meta.description;
    }

    /**
     * Generates the HTML for the calculator form based on the JSON definition.
     */
    generateHTML() {
        const formConfig = {
            fields: this.def.inputs.map(input => {
                // Map JSON input definition to uiBuilder config
                // We pass the definition directly as it should match uiBuilder schema
                return input;
            })
        };

        const formHTML = uiBuilder.createForm(formConfig);
        const resultHTML = uiBuilder.createResultBox({
            id: `${this.id}-result`,
            title: 'Result'
        });

        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            ${formHTML}
            ${resultHTML}
        `;
    }

    /**
     * Initializes the calculator logic.
     */
    initialize(client, patient, container) {
        uiBuilder.initializeComponents(container);

        const resultBox = container.querySelector(`#${this.id}-result`);
        const resultContent = resultBox.querySelector('.ui-result-content');

        // Helper to get value from input
        const getValue = (inputId, unitType) => {
            const el = container.querySelector(`#${inputId}`);
            if (!el) return 0;

            if (unitType) {
                return UnitConverter.getStandardValue(el, unitType);
            }

            if (el.type === 'checkbox') return el.checked;
            if (el.type === 'radio') {
                const checked = container.querySelector(`input[name="${inputId}"]:checked`);
                return checked ? checked.value : null;
            }

            return parseFloat(el.value) || 0;
        };

        const calculate = () => {
            const variables = {};

            // 1. Harvest Inputs
            // We map input IDs to variable names defined in "variables" section
            for (const [varName, inputId] of Object.entries(this.def.variables || {})) {
                // Find input definition to check for unit type
                const inputDef = this.def.inputs.find(i => i.id === inputId || i.name === inputId);
                const unitType = inputDef?.unitToggle?.default; // Simplified: assume default unit is standard for now, or check unitToggle.type
                // Actually UnitConverter.getStandardValue needs the target unit (e.g. 'kg'). 
                // In the JSON schema, we should probably specify the "standard" unit for the variable.
                // For now, let's infer or use raw value if no unit.

                let targetUnit = null;
                if (inputDef?.unitToggle?.type === 'weight') targetUnit = 'kg';
                if (inputDef?.unitToggle?.type === 'height') targetUnit = 'cm';
                if (inputDef?.unitToggle?.type === 'temperature') targetUnit = 'C';

                variables[varName] = getValue(inputId, targetUnit);
            }

            // 2. Perform Calculations
            for (const calc of this.def.calculations || []) {
                if (calc.type === 'formula') {
                    try {
                        // Create a function with variable names as arguments
                        const varNames = Object.keys(variables);
                        const varValues = Object.values(variables);
                        const func = new Function(...varNames, `return ${calc.expression};`);
                        variables[calc.var] = func(...varValues);
                    } catch (e) {
                        console.error(`Calculation error in ${calc.var}:`, e);
                        variables[calc.var] = null;
                    }
                } else if (calc.type === 'score_table') {
                    const inputVal = variables[calc.input_var]; // Use variable, not raw input
                    let score = 0;
                    let matched = false;

                    for (const rule of calc.rules) {
                        if (rule.default) {
                            if (!matched) score = rule.points;
                            continue;
                        }

                        // Simple range matching
                        let match = true;
                        if (rule.min !== undefined && inputVal < rule.min) match = false;
                        if (rule.max !== undefined && inputVal > rule.max) match = false;

                        if (match) {
                            score = rule.points;
                            matched = true;
                            break; // First match wins
                        }
                    }
                    variables[calc.var] = score;
                }
            }

            // 3. Render Outputs
            const resultsHTML = (this.def.outputs || []).map(output => {
                if (output.type === 'result_item') {
                    const val = variables[output.value_var];
                    if (val === null || val === undefined || isNaN(val)) return '';

                    return uiBuilder.createResultItem({
                        label: output.label,
                        value: typeof val === 'number' ? val.toFixed(output.decimals || 1) : val,
                        unit: output.unit,
                        interpretation: output.interpretation_var ? variables[output.interpretation_var] : undefined
                    });
                }
                return '';
            }).join('');

            if (resultsHTML) {
                resultContent.innerHTML = resultsHTML;
                resultBox.classList.add('show');
            } else {
                resultBox.classList.remove('show');
            }
        };

        // Bind events
        container.addEventListener('input', calculate);
        container.addEventListener('change', calculate);
    }
}
