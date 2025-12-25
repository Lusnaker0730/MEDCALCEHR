import { calculateNAFLDScore } from './calculation.js';
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

export const nafldFibrosisScore: CalculatorModule = {
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
                message:
                    '<strong>Instructions:</strong> For use in patients with NAFLD to screen for advanced fibrosis.'
            })}

            ${uiBuilder.createSection({
                title: 'Patient Demographics',
                icon: '👤',
                content: `
                    ${uiBuilder.createInput({ id: 'nafld-age', label: 'Age', unit: 'years', type: 'number' })}
                    ${uiBuilder.createInput({ id: 'nafld-bmi', label: 'BMI', unit: 'kg/m²', type: 'number', step: 0.1 })}
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
                            default: '×10⁹/L'
                        }
                    })}
                    ${uiBuilder.createInput({
                        id: 'nafld-albumin',
                        label: 'Albumin',
                        type: 'number',
                        step: 0.1,
                        unit: 'g/dL',
                        unitToggle: {
                            type: 'concentration',
                            units: ['g/dL', 'g/L'],
                            default: 'g/dL'
                        }
                    })}
                `
            })}

            <div id="nafld-error-container"></div>
            ${uiBuilder.createResultBox({ id: 'nafld-result', title: 'NAFLD Fibrosis Score' })}

            ${uiBuilder.createFormulaSection({
                items: [
                    {
                        label: 'Score Formula',
                        formula:
                            '-1.675 + (0.037 × Age) + (0.094 × BMI) + (1.13 × Diabetes) + (0.99 × AST/ALT) - (0.013 × Platelet) - (0.66 × Albumin)'
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

        // Initialize FHIRDataService
        fhirDataService.initialize(client, patient, container);

        const ageInput = container.querySelector('#nafld-age') as HTMLInputElement;
        const bmiInput = container.querySelector('#nafld-bmi') as HTMLInputElement;
        const astInput = container.querySelector('#nafld-ast') as HTMLInputElement;
        const altInput = container.querySelector('#nafld-alt') as HTMLInputElement;
        const plateletInput = container.querySelector('#nafld-platelet') as HTMLInputElement;
        const albuminInput = container.querySelector('#nafld-albumin') as HTMLInputElement;
        const resultBox = container.querySelector('#nafld-result');

        const calculate = () => {
            // Clear previous errors
            const errorContainer = container.querySelector('#nafld-error-container');
            if (errorContainer) {
                errorContainer.innerHTML = '';
            }

            const age = parseFloat(ageInput.value);
            const bmi = parseFloat(bmiInput.value);
            const ast = parseFloat(astInput.value);
            const alt = parseFloat(altInput.value);
            const platelet = UnitConverter.getStandardValue(plateletInput, '×10⁹/L');
            const albumin = UnitConverter.getStandardValue(albuminInput, 'g/dL');
            const diabetesInput = container.querySelector(
                'input[name="nafld-diabetes"]:checked'
            ) as HTMLInputElement;
            const diabetes = diabetesInput ? parseInt(diabetesInput.value) : 0;

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
                    const hasInput =
                        ageInput.value ||
                        bmiInput.value ||
                        astInput.value ||
                        altInput.value ||
                        plateletInput.value ||
                        albuminInput.value;
                    if (hasInput) {
                        const valuesPresent =
                            !isNaN(age) &&
                            !isNaN(bmi) &&
                            !isNaN(ast) &&
                            !isNaN(alt) &&
                            platelet !== null &&
                            !isNaN(platelet) &&
                            albumin !== null &&
                            !isNaN(albumin);
                        // Show error only if all required fields are present or if the error is not 'required' type (e.g. range error)
                        // Actually, for better UX, let's just show error if there is input
                        if (errorContainer) {
                            displayError(
                                errorContainer as HTMLElement,
                                new ValidationError(validation.errors[0], 'VALIDATION_ERROR')
                            );
                        }
                    }
                    if (resultBox) {
                        resultBox.classList.remove('show');
                    }
                    return;
                }

                if (platelet === null || albumin === null) {
                    return;
                }

                const result = calculateNAFLDScore({
                    age,
                    bmi,
                    diabetes,
                    ast,
                    alt,
                    platelet,
                    albumin
                });

                const { score, stage, interpretation, alertType } = result;

                if (resultBox) {
                    const resultContent = resultBox.querySelector('.ui-result-content');
                    if (resultContent) {
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
                    }
                    resultBox.classList.add('show');
                }
            } catch (error) {
                logError(error as Error, {
                    calculator: 'nafld-fibrosis-score',
                    action: 'calculate'
                });
                if (errorContainer) {
                    displayError(errorContainer as HTMLElement, error as Error);
                }
                if (resultBox) {
                    resultBox.classList.remove('show');
                }
            }
        };

        // Event listeners
        [ageInput, bmiInput, astInput, altInput, plateletInput, albuminInput].forEach(input => {
            if (input) {
                input.addEventListener('input', calculate);
            }
        });
        container.querySelectorAll('input[name="nafld-diabetes"]').forEach(radio => {
            radio.addEventListener('change', calculate);
        });

        // Auto-populate using FHIRDataService
        const age = fhirDataService.getPatientAge();
        if (age !== null) {
            ageInput.value = age.toString();
        }

        if (client) {
            // BMI
            fhirDataService
                .getObservation(LOINC_CODES.BMI, {
                    trackStaleness: true,
                    stalenessLabel: 'BMI'
                })
                .then(result => {
                    if (result.value !== null) {
                        bmiInput.value = result.value.toFixed(1);
                        calculate();
                    }
                })
                .catch(e => console.warn(e));

            // AST
            fhirDataService
                .getObservation(LOINC_CODES.AST, {
                    trackStaleness: true,
                    stalenessLabel: 'AST'
                })
                .then(result => {
                    if (result.value !== null) {
                        astInput.value = result.value.toFixed(0);
                        calculate();
                    }
                })
                .catch(e => console.warn(e));

            // ALT
            fhirDataService
                .getObservation(LOINC_CODES.ALT, {
                    trackStaleness: true,
                    stalenessLabel: 'ALT'
                })
                .then(result => {
                    if (result.value !== null) {
                        altInput.value = result.value.toFixed(0);
                        calculate();
                    }
                })
                .catch(e => console.warn(e));

            // Platelets
            fhirDataService
                .getObservation(LOINC_CODES.PLATELETS, {
                    trackStaleness: true,
                    stalenessLabel: 'Platelets'
                })
                .then(result => {
                    if (result.value !== null) {
                        plateletInput.value = result.value.toFixed(0);
                        calculate();
                    }
                })
                .catch(e => console.warn(e));

            // Albumin
            fhirDataService
                .getObservation(LOINC_CODES.ALBUMIN, {
                    trackStaleness: true,
                    stalenessLabel: 'Albumin',
                    targetUnit: 'g/dL',
                    unitType: 'albumin'
                })
                .then(result => {
                    if (result.value !== null) {
                        albuminInput.value = result.value.toFixed(1);
                        calculate();
                    }
                })
                .catch(e => console.warn(e));
        }
    }
};
