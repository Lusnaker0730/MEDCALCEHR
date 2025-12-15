import { getMostRecentObservation, calculateAge } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { ValidationRules, validateCalculatorInput } from '../../validator.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';

export const nafldFibrosisScore = {
    id: 'nafld-fibrosis-score',
    title: 'NAFLD (Non-Alcoholic Fatty Liver Disease) Fibrosis Score',
    description: 'Estimates amount of scarring in the liver based on laboratory tests.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            ${uiBuilder.createAlert({
            type: 'info',
            message: '<strong>Instructions:</strong> For use in patients with NAFLD to screen for advanced fibrosis.'
        })}

            ${uiBuilder.createSection({
            title: 'Patient Demographics',
            icon: '👤',
            content: `
                    ${uiBuilder.createInput({ id: 'nafld-age', label: 'Age', unit: 'years', type: 'number' })}
                    ${uiBuilder.createInput({ id: 'nafld-bmi', label: 'BMI', unit: 'kg/m²', type: 'number', step: '0.1' })}
                    ${uiBuilder.createRadioGroup({
                name: 'nafld-diabetes',
                label: 'Impaired Fasting Glucose / Diabetes',
                options: [
                    { value: '0', label: 'No', checked: true },
                    { value: '1', label: 'Yes (+1.13 points)' }
                ]
            })}
                `
        })}

            ${uiBuilder.createSection({
            title: 'Laboratory Values',
            icon: '🧪',
            content: `
                    ${uiBuilder.createInput({ id: 'nafld-ast', label: 'AST', unit: 'U/L', type: 'number' })}
                    ${uiBuilder.createInput({ id: 'nafld-alt', label: 'ALT', unit: 'U/L', type: 'number' })}
                    ${uiBuilder.createInput({
                id: 'nafld-platelet',
                label: 'Platelet Count',
                type: 'number',
                unit: '×10⁹/L',
                unitToggle: {
                    type: 'platelet',
                    units: ['×10⁹/L', 'K/µL'],
                    defaultUnit: '×10⁹/L'
                }
            })}
                    ${uiBuilder.createInput({
                id: 'nafld-albumin',
                label: 'Albumin',
                type: 'number',
                step: '0.1',
                unit: 'g/dL',
                unitToggle: {
                    type: 'concentration',
                    units: ['g/dL', 'g/L'],
                    defaultUnit: 'g/dL'
                }
            })}
                `
        })}

            <div id="nafld-error-container"></div>
            <div id="nafld-result" class="ui-result-box">
                <div class="ui-result-header">NAFLD Fibrosis Score</div>
                <div class="ui-result-content"></div>
            </div>

            ${uiBuilder.createFormulaSection({
            items: [
                {
                    label: 'Score Formula',
                    formula: '-1.675 + (0.037 × Age) + (0.094 × BMI) + (1.13 × Diabetes) + (0.99 × AST/ALT) - (0.013 × Platelet) - (0.66 × Albumin)'
                }
            ]
        })}

            ${uiBuilder.createAlert({
            type: 'info',
            message: `
                    <h4>📊 Interpretation</h4>
                    <div class="ui-data-table">
                        <table>
                            <thead>
                                <tr><th>Score</th><th>Fibrosis Stage</th><th>Interpretation</th></tr>
                            </thead>
                            <tbody>
                                <tr><td>< -1.455</td><td><span class="ui-alert-success">F0-F2</span></td><td>Low probability of advanced fibrosis</td></tr>
                                <tr><td>-1.455 to 0.675</td><td><span class="ui-alert-warning">Indeterminate</span></td><td>Further testing needed</td></tr>
                                <tr><td>> 0.675</td><td><span class="ui-alert-danger">F3-F4</span></td><td>High probability of advanced fibrosis</td></tr>
                            </tbody>
                        </table>
                    </div>
                `
        })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const ageInput = container.querySelector('#nafld-age');
        const bmiInput = container.querySelector('#nafld-bmi');
        const astInput = container.querySelector('#nafld-ast');
        const altInput = container.querySelector('#nafld-alt');
        const plateletInput = container.querySelector('#nafld-platelet');
        const albuminInput = container.querySelector('#nafld-albumin');
        const resultBox = container.querySelector('#nafld-result');

        const calculate = () => {
            // Clear previous errors
            const errorContainer = container.querySelector('#nafld-error-container');
            if (errorContainer) errorContainer.innerHTML = '';

            const age = parseFloat(ageInput.value);
            const bmi = parseFloat(bmiInput.value);
            const ast = parseFloat(astInput.value);
            const alt = parseFloat(altInput.value);
            const platelet = UnitConverter.getStandardValue(plateletInput, '×10⁹/L');
            const albumin = UnitConverter.getStandardValue(albuminInput, 'g/dL');
            const diabetes = parseInt(container.querySelector('input[name="nafld-diabetes"]:checked').value);

            try {
                // Validation Inputs
                const inputs = {
                    age,
                    bmi,
                    ast,
                    alt,
                    platelets: platelet,
                    albumin
                };
                const schema = {
                    age: ValidationRules.age,
                    bmi: ValidationRules.bmi,
                    ast: ValidationRules.liverEnzyme,
                    alt: ValidationRules.liverEnzyme,
                    platelets: ValidationRules.platelets,
                    albumin: ValidationRules.albumin
                };

                const validation = validateCalculatorInput(inputs, schema);

                if (!validation.isValid) {
                    const hasInput = (ageInput.value || bmiInput.value || astInput.value || altInput.value || plateletInput.value || albuminInput.value);
                    if (hasInput) {
                        const valuesPresent = !isNaN(age) && !isNaN(bmi) && !isNaN(ast) && !isNaN(alt) && !isNaN(platelet) && !isNaN(albumin);
                        if (valuesPresent || validation.errors.some(e => !e.includes('required'))) {
                            if (errorContainer) displayError(errorContainer, new ValidationError(validation.errors[0], 'VALIDATION_ERROR'));
                        }
                    }
                    resultBox.classList.remove('show');
                    return;
                }

                const astAltRatio = ast / alt;
                const score = -1.675 +
                    (0.037 * age) +
                    (0.094 * bmi) +
                    (1.13 * diabetes) +
                    (0.99 * astAltRatio) -
                    (0.013 * platelet) -
                    (0.66 * albumin);

                if (!isFinite(score) || isNaN(score)) throw new Error("Calculation Error");

                let stage = '';
                let interpretation = '';
                let alertType = 'info';

                if (score < -1.455) {
                    stage = 'F0-F2';
                    interpretation = 'Low probability of advanced fibrosis';
                    alertType = 'success';
                } else if (score <= 0.675) {
                    stage = 'Indeterminate';
                    interpretation = 'Further testing needed (e.g., elastography)';
                    alertType = 'warning';
                } else {
                    stage = 'F3-F4';
                    interpretation = 'High probability of advanced fibrosis';
                    alertType = 'danger';
                }

                const resultContent = resultBox.querySelector('.ui-result-content');
                resultContent.innerHTML = `
                    ${uiBuilder.createResultItem({
                    label: 'NAFLD Fibrosis Score',
                    value: score.toFixed(3),
                    unit: 'points',
                    interpretation: stage,
                    alertClass: `ui-alert-${alertType}`
                })}
                    ${uiBuilder.createAlert({
                    type: alertType,
                    message: `<strong>Interpretation:</strong> ${interpretation}`
                })}
                `;
                resultBox.classList.add('show');
            } catch (error) {
                logError(error, { calculator: 'nafld-fibrosis-score', action: 'calculate' });
                if (errorContainer) displayError(errorContainer, error);
                resultBox.classList.remove('show');
            }
        };

        // Event listeners
        [ageInput, bmiInput, astInput, altInput, plateletInput, albuminInput].forEach(input => {
            input.addEventListener('input', calculate);
        });
        container.querySelectorAll('input[name="nafld-diabetes"]').forEach(radio => {
            radio.addEventListener('change', calculate);
        });

        // Auto-populate
        if (patient && patient.birthDate) {
            ageInput.value = calculateAge(patient.birthDate);
        }

        if (client) {
            getMostRecentObservation(client, LOINC_CODES.BMI).then(obs => {
                if (obs?.valueQuantity) {
                    bmiInput.value = obs.valueQuantity.value.toFixed(1);
                    calculate();
                }
            }).catch(e => console.warn(e));
            getMostRecentObservation(client, LOINC_CODES.AST).then(obs => {
                if (obs?.valueQuantity) {
                    astInput.value = obs.valueQuantity.value.toFixed(0);
                    calculate();
                }
            }).catch(e => console.warn(e));
            getMostRecentObservation(client, LOINC_CODES.ALT).then(obs => {
                if (obs?.valueQuantity) {
                    altInput.value = obs.valueQuantity.value.toFixed(0);
                    calculate();
                }
            }).catch(e => console.warn(e));
            getMostRecentObservation(client, LOINC_CODES.PLATELETS).then(obs => {
                if (obs?.valueQuantity) {
                    plateletInput.value = obs.valueQuantity.value.toFixed(0);
                    calculate();
                }
            }).catch(e => console.warn(e));
            getMostRecentObservation(client, LOINC_CODES.ALBUMIN).then(obs => {
                if (obs?.valueQuantity) {
                    // Using setInputValue logic or unit helper if needed
                    albuminInput.value = obs.valueQuantity.value.toFixed(1);
                    calculate();
                }
            }).catch(e => console.warn(e));
        }
    }
};
