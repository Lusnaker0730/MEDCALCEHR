import { getMostRecentObservation, calculateAge } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { Calculator } from '../../types/calculator';
import { FHIRClient, Patient, Observation } from '../../types/fhir';

export const nafldFibrosisScore: Calculator = {
    id: 'nafld-fibrosis-score',
    title: 'NAFLD (Non-Alcoholic Fatty Liver Disease) Fibrosis Score',
    description: 'Estimates amount of scarring in the liver based on laboratory tests.',
    generateHTML: function (): string {
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
                    default: '×10⁹/L'
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
                    default: 'g/dL'
                }
            })}
                `
        })}

            ${uiBuilder.createResultBox({ id: 'nafld-result', title: 'NAFLD Fibrosis Score' })}

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
    initialize: function (client: FHIRClient | null, patient: Patient | null, container: HTMLElement): void {
        uiBuilder.initializeComponents(container);

        const ageInput = container.querySelector('#nafld-age') as HTMLInputElement;
        const bmiInput = container.querySelector('#nafld-bmi') as HTMLInputElement;
        const astInput = container.querySelector('#nafld-ast') as HTMLInputElement;
        const altInput = container.querySelector('#nafld-alt') as HTMLInputElement;
        const plateletInput = container.querySelector('#nafld-platelet') as HTMLInputElement;
        const albuminInput = container.querySelector('#nafld-albumin') as HTMLInputElement;
        const resultBox = container.querySelector('#nafld-result') as HTMLElement;

        const calculate = () => {
            const age = parseFloat(ageInput.value);
            const bmi = parseFloat(bmiInput.value);
            const ast = parseFloat(astInput.value);
            const alt = parseFloat(altInput.value);
            const platelet = UnitConverter.getStandardValue(plateletInput, '×10⁹/L');
            const albumin = UnitConverter.getStandardValue(albuminInput, 'g/dL');

            const diabetesRadio = container.querySelector('input[name="nafld-diabetes"]:checked') as HTMLInputElement;
            const diabetes = diabetesRadio ? parseInt(diabetesRadio.value) : 0;

            if (isNaN(age) || isNaN(bmi) || isNaN(ast) || isNaN(alt) || platelet === null || albumin === null || alt === 0) {
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

            let stage = '';
            let interpretation = '';
            let alertType: 'info' | 'warning' | 'danger' | 'success' = 'info';

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

            const resultContent = resultBox.querySelector('.ui-result-content') as HTMLElement;
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
            ageInput.value = calculateAge(patient.birthDate).toString();
        }

        if (client) {
            getMostRecentObservation(client, LOINC_CODES.BMI).then((obs: Observation | null) => {
                if (obs && obs.valueQuantity) {
                    bmiInput.value = obs.valueQuantity.value.toFixed(1);
                    calculate();
                }
            });
            getMostRecentObservation(client, LOINC_CODES.AST).then((obs: Observation | null) => {
                if (obs && obs.valueQuantity) {
                    astInput.value = obs.valueQuantity.value.toFixed(0);
                    calculate();
                }
            });
            getMostRecentObservation(client, LOINC_CODES.ALT).then((obs: Observation | null) => {
                if (obs && obs.valueQuantity) {
                    altInput.value = obs.valueQuantity.value.toFixed(0);
                    calculate();
                }
            });
            getMostRecentObservation(client, LOINC_CODES.PLATELETS).then((obs: Observation | null) => {
                if (obs && obs.valueQuantity) {
                    plateletInput.value = obs.valueQuantity.value.toFixed(0);
                    calculate();
                }
            });
            getMostRecentObservation(client, LOINC_CODES.ALBUMIN).then((obs: Observation | null) => {
                if (obs && obs.valueQuantity) {
                    // Populate value, user confirms unit
                    albuminInput.value = obs.valueQuantity.value.toFixed(1);
                    calculate();
                }
            });
        }
    }
};
