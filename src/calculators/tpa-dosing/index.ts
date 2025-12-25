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

export const tpaDosing: CalculatorModule = {
    id: 'tpa-dosing',
    title: 'tPA (Alteplase) Dosing for Ischemic Stroke',
    description:
        'Calculates tPA (alteplase) dosing for acute ischemic stroke based on patient weight.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            ${uiBuilder.createSection({
                title: 'Patient Details',
                content: `
                    ${uiBuilder.createInput({
                        id: 'tpa-weight',
                        label: 'Weight',
                        type: 'number',
                        unit: 'kg',
                        placeholder: 'Enter weight',
                        unitToggle: {
                            type: 'weight',
                            units: ['kg', 'lbs'],
                            default: 'kg'
                        }
                    })}
                `
            })}
            
            <div id="tpa-error-container"></div>
            ${uiBuilder.createResultBox({ id: 'tpa-result', title: 'Dosing Guidelines' })}
            
            ${uiBuilder.createFormulaSection({
                items: [
                    {
                        label: 'Total Dose',
                        formula: '0.9 mg/kg (Max 90 mg)'
                    },
                    {
                        label: 'Bolus Dose',
                        formula: '10% of total dose over 1 minute'
                    },
                    {
                        label: 'Infusion Dose',
                        formula: '90% of total dose over 60 minutes'
                    }
                ]
            })}
        `;
    },
    initialize: function (client: any, patient: any, container: HTMLElement) {
        uiBuilder.initializeComponents(container);

        // Initialize FHIRDataService
        fhirDataService.initialize(client, patient, container);

        const weightEl = container.querySelector('#tpa-weight') as HTMLInputElement;
        const resultBox = container.querySelector('#tpa-result');

        const calculate = () => {
            // Clear previous errors
            const errorContainer = container.querySelector('#tpa-error-container');
            if (errorContainer) {
                errorContainer.innerHTML = '';
            }

            const weight = UnitConverter.getStandardValue(weightEl, 'kg');

            try {
                // Validation inputs
                const inputs = {
                    weight: weight
                };
                const schema = {
                    weight: ValidationRules.weight
                };

                const validation = validateCalculatorInput(inputs, schema);

                if (!validation.isValid) {
                    if (weightEl.value && resultBox) {
                        const valuesPresent = weight !== null && !isNaN(weight);
                        if (
                            valuesPresent ||
                            validation.errors.some((e: string) => !e.includes('required'))
                        ) {
                            if (errorContainer) {
                                displayError(
                                    errorContainer as HTMLElement,
                                    new ValidationError(validation.errors[0], 'VALIDATION_ERROR')
                                );
                            }
                        }
                        resultBox.classList.remove('show');
                    }
                    return;
                }

                if (resultBox) {
                    // Check logic constraints
                    if (!weight || weight <= 0) {
                        // handled by validation mostly, but safe guard
                        resultBox.classList.remove('show');
                        return;
                    }

                    // If weight > 100 kg, use 100 kg for calculation as max dose is 90mg.
                    const effectiveWeight = weight > 100 ? 100 : weight;
                    const totalDose = effectiveWeight * 0.9;
                    const bolusDose = totalDose * 0.1;
                    const infusionDose = totalDose * 0.9;

                    const resultContent = resultBox.querySelector('.ui-result-content');
                    if (resultContent) {
                        resultContent.innerHTML = `
                        ${uiBuilder.createResultItem({
                            label: 'Total Dose',
                            value: totalDose.toFixed(2),
                            unit: 'mg',
                            interpretation: weight > 100 ? '(Capped at 90 mg max)' : ''
                        })}
                        ${uiBuilder.createResultItem({
                            label: 'Bolus Dose (10%)',
                            value: bolusDose.toFixed(2),
                            unit: 'mg',
                            interpretation: 'Give over 1 minute'
                        })}
                        ${uiBuilder.createResultItem({
                            label: 'Infusion Dose (90%)',
                            value: infusionDose.toFixed(2),
                            unit: 'mg',
                            interpretation: 'Infuse over 60 minutes'
                        })}
                    `;
                    }
                    resultBox.classList.add('show');
                }
            } catch (error) {
                logError(error as Error, { calculator: 'tpa-dosing', action: 'calculate' });
                if (errorContainer) {
                    displayError(errorContainer as HTMLElement, error as Error);
                }
                if (resultBox) {
                    resultBox.classList.remove('show');
                }
            }
        };

        weightEl.addEventListener('input', calculate);
        weightEl.addEventListener('change', calculate);

        if (client) {
            fhirDataService
                .getObservation(LOINC_CODES.WEIGHT, {
                    trackStaleness: true,
                    stalenessLabel: 'Weight',
                    targetUnit: 'kg',
                    unitType: 'weight'
                })
                .then(result => {
                    if (result.value !== null) {
                        weightEl.value = result.value.toFixed(1);
                        calculate();
                    }
                })
                .catch(e => console.warn(e));
        }

        calculate();
    }
};
