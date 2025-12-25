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

export const homaIr: CalculatorModule = {
    id: 'homa-ir',
    title: 'HOMA-IR (Homeostatic Model Assessment for Insulin Resistance)',
    description: 'Approximates insulin resistance.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>

            ${uiBuilder.createSection({
                title: 'Parameters',
                content: `
                    ${uiBuilder.createInput({
                        id: 'homa-glucose',
                        label: 'Fasting Glucose',
                        unit: 'mg/dL',
                        type: 'number',
                        placeholder: 'e.g. 100',
                        unitToggle: {
                            type: 'glucose',
                            units: ['mg/dL', 'mmol/L'],
                            default: 'mg/dL'
                        }
                    })}
                    ${uiBuilder.createInput({
                        id: 'homa-insulin',
                        label: 'Fasting Insulin',
                        type: 'number',
                        placeholder: 'e.g. 10',
                        unitToggle: {
                            type: 'insulin',
                            units: ['µU/mL', 'pmol/L'],
                            default: 'µU/mL'
                        }
                    })}
                `
            })}
            
            <div id="homa-error-container"></div>
            ${uiBuilder.createResultBox({ id: 'homa-ir-result', title: 'HOMA-IR Score' })}
            
            ${uiBuilder.createFormulaSection({
                items: [
                    {
                        label: 'HOMA-IR',
                        content: '(Fasting Glucose [mg/dL] × Fasting Insulin [μU/mL]) / 405'
                    }
                ]
            })}
            
            ${uiBuilder.createAlert({
                type: 'info',
                message: `
                    <strong>Interpretation:</strong>
                    <ul>
                        <li><strong>< 1.9:</strong> Optimal insulin sensitivity</li>
                        <li><strong>1.9 - 2.9:</strong> Early insulin resistance is likely</li>
                        <li><strong>> 2.9:</strong> High likelihood of insulin resistance</li>
                    </ul>
                `
            })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        // Initialize FHIRDataService
        fhirDataService.initialize(client, patient, container);

        const insulinInput = container.querySelector('#homa-insulin') as HTMLInputElement;
        const glucoseInput = container.querySelector('#homa-glucose') as HTMLInputElement;

        const resultBox = container.querySelector('#homa-ir-result');

        const calculate = () => {
            // Clear previous errors
            const errorContainer = container.querySelector('#homa-error-container');
            if (errorContainer) {
                errorContainer.innerHTML = '';
            }

            // Use UnitConverter to get standard value (mg/dL)
            const glucoseMgDl = UnitConverter.getStandardValue(glucoseInput, 'mg/dL');
            const insulin = UnitConverter.getStandardValue(insulinInput, 'µU/mL');

            try {
                // Validation inputs
                const inputs = {
                    glucose: glucoseMgDl,
                    insulin: insulin
                };
                const schema = {
                    glucose: ValidationRules.glucose,
                    insulin: ValidationRules.insulin
                };

                // @ts-ignore
                const validation = validateCalculatorInput(inputs, schema);

                if (!validation.isValid) {
                    const hasInput = glucoseInput.value || insulinInput.value;

                    if (hasInput) {
                        const valuesPresent =
                            glucoseMgDl !== null &&
                            !isNaN(glucoseMgDl) &&
                            insulin !== null &&
                            !isNaN(insulin);
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
                    }

                    if (resultBox) {
                        resultBox.classList.remove('show');
                    }
                    return;
                }

                if (glucoseMgDl === null || insulin === null) {
                    return;
                }

                const homaIrScore = (glucoseMgDl * insulin) / 405;

                if (!isFinite(homaIrScore) || isNaN(homaIrScore)) {
                    throw new Error('Calculation Error');
                }

                let interpretation = '';
                let alertClass = 'ui-alert-success';

                if (homaIrScore > 2.9) {
                    interpretation = 'High likelihood of insulin resistance';
                    alertClass = 'ui-alert-danger';
                } else if (homaIrScore > 1.9) {
                    interpretation = 'Early insulin resistance likely';
                    alertClass = 'ui-alert-warning';
                } else {
                    interpretation = 'Optimal insulin sensitivity';
                    alertClass = 'ui-alert-success';
                }

                if (resultBox) {
                    const resultContent = resultBox.querySelector('.ui-result-content');
                    if (resultContent) {
                        resultContent.innerHTML = `
                            ${uiBuilder.createResultItem({
                                label: 'HOMA-IR',
                                value: homaIrScore.toFixed(2),
                                unit: '',
                                interpretation: interpretation,
                                alertClass: alertClass
                            })}
                        `;
                    }
                    resultBox.classList.add('show');
                }
            } catch (error) {
                logError(error as Error, { calculator: 'homa-ir', action: 'calculate' });
                if (errorContainer) {
                    displayError(errorContainer as HTMLElement, error as Error);
                }
                if (resultBox) {
                    resultBox.classList.remove('show');
                }
            }
        };

        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculate);
            input.addEventListener('change', calculate);
        });

        // Auto-populate using FHIRDataService
        if (client) {
            // Fasting Glucose (LOINC 2339-0)
            fhirDataService
                .getObservation('2339-0', {
                    trackStaleness: true,
                    stalenessLabel: 'Fasting Glucose',
                    targetUnit: 'mg/dL',
                    unitType: 'glucose'
                })
                .then(result => {
                    if (result.value !== null) {
                        glucoseInput.value = result.value.toFixed(0);
                        glucoseInput.dispatchEvent(new Event('input'));
                    }
                })
                .catch(e => console.warn(e));

            // Fasting Insulin (LOINC 20448-7)
            fhirDataService
                .getObservation('20448-7', {
                    trackStaleness: true,
                    stalenessLabel: 'Fasting Insulin',
                    targetUnit: 'µU/mL',
                    unitType: 'insulin'
                })
                .then(result => {
                    if (result.value !== null) {
                        insulinInput.value = result.value.toFixed(1);
                        insulinInput.dispatchEvent(new Event('input'));
                    }
                })
                .catch(e => console.warn(e));
        }

        calculate();
    }
};
