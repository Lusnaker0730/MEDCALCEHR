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

export const sodiumCorrection: CalculatorModule = {
    id: 'sodium-correction',
    title: 'Sodium Correction for Hyperglycemia',
    description: 'Calculates the actual sodium level in patients with hyperglycemia.',
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
                        id: 'measured-sodium',
                        label: 'Measured Sodium',
                        type: 'number',
                        placeholder: 'e.g., 135',
                        unitToggle: {
                            type: 'sodium',
                            units: ['mEq/L', 'mmol/L'],
                            default: 'mEq/L'
                        }
                    })}
                    ${uiBuilder.createInput({
                        id: 'glucose',
                        label: 'Serum Glucose',
                        type: 'number',
                        placeholder: 'e.g., 400',
                        unitToggle: {
                            type: 'glucose',
                            units: ['mg/dL', 'mmol/L'],
                            default: 'mg/dL'
                        }
                    })}
                    ${uiBuilder.createRadioGroup({
                        name: 'correction-factor',
                        label: 'Correction Factor',
                        options: [
                            { value: '1.6', label: '1.6 (Standard, Hillier)', checked: true },
                            { value: '2.4', label: '2.4 (Katz, suggested for Glucose > 400 mg/dL)' }
                        ],
                        helpText:
                            'Standard factor is 1.6 mEq/L for every 100 mg/dL glucose above 100. Some suggest 2.4 when glucose > 400 mg/dL.'
                    })}
                `
            })}
            
            <div id="sodium-correction-error-container"></div>
            
            <div id="sodium-correction-result" class="ui-result-box">
                <div class="ui-result-header">Corrected Sodium</div>
                <div class="ui-result-content"></div>
            </div>
            
            ${uiBuilder.createFormulaSection({
                items: [
                    {
                        label: 'Corrected Na',
                        formula: 'Measured Na + [Correction Factor × (Glucose - 100) / 100]'
                    }
                ]
            })}

            ${uiBuilder.createAlert({
                type: 'info',
                message: `
                    <h4>Normal Values:</h4>
                    <ul class="info-list">
                        <li>Normal Sodium: 136-145 mEq/L</li>
                        <li>Normal Glucose: 70-100 mg/dL</li>
                    </ul>
                `
            })}
        `;
    },
    initialize: function (client: any, patient: any, container: HTMLElement) {
        uiBuilder.initializeComponents(container);

        // Initialize FHIRDataService
        fhirDataService.initialize(client, patient, container);

        const sodiumInput = container.querySelector('#measured-sodium') as HTMLInputElement;
        const glucoseInput = container.querySelector('#glucose') as HTMLInputElement;
        const resultBox = container.querySelector('#sodium-correction-result');

        const calculateAndUpdate = () => {
            // Clear previous errors
            const errorContainer = container.querySelector('#sodium-correction-error-container');
            if (errorContainer) {
                errorContainer.innerHTML = '';
            }

            const measuredSodium = UnitConverter.getStandardValue(sodiumInput, 'mEq/L');
            const glucoseMgDl = UnitConverter.getStandardValue(glucoseInput, 'mg/dL');
            const correctionFactorEl = container.querySelector(
                'input[name="correction-factor"]:checked'
            ) as HTMLInputElement;
            const correctionFactor = parseFloat(correctionFactorEl?.value || '1.6');

            try {
                // Validation inputs
                const inputs = {
                    sodium: measuredSodium,
                    glucose: glucoseMgDl
                };
                const schema = {
                    sodium: ValidationRules.sodium,
                    glucose: ValidationRules.glucose
                };

                const validation = validateCalculatorInput(inputs, schema);

                if (!validation.isValid) {
                    const hasInput = sodiumInput.value || glucoseInput.value;

                    if (hasInput && resultBox) {
                        const valuesPresent =
                            measuredSodium !== null &&
                            glucoseMgDl !== null &&
                            !isNaN(measuredSodium) &&
                            !isNaN(glucoseMgDl);
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
                    // Note: measuredSodium and glucoseMgDl are guaranteed not null by isNaN check above if we use '!' but logic is cleaner with 'valuesPresent' guard if strictly followed.
                    // However, we need '!' for TS inside here.
                    const correctedSodium =
                        measuredSodium! + correctionFactor * ((glucoseMgDl! - 100) / 100);

                    if (!isFinite(correctedSodium) || isNaN(correctedSodium)) {
                        throw new Error('Calculation Error');
                    }

                    let status = '';
                    let alertType: 'success' | 'warning' | 'danger' | 'info' = 'success';
                    let alertClass = 'ui-alert-success';

                    if (correctedSodium < 136) {
                        status = 'Low (Hyponatremia)';
                        alertType = 'info';
                        alertClass = 'ui-alert-warning';
                    } else if (correctedSodium > 145) {
                        status = 'High (Hypernatremia)';
                        alertType = 'danger';
                        alertClass = 'ui-alert-danger';
                    } else {
                        status = 'Normal';
                        alertType = 'success';
                        alertClass = 'ui-alert-success';
                    }

                    const resultContent = resultBox.querySelector('.ui-result-content');
                    if (resultContent) {
                        resultContent.innerHTML = `
                        ${uiBuilder.createResultItem({
                            label: 'Corrected Sodium',
                            value: correctedSodium.toFixed(1),
                            unit: 'mEq/L',
                            interpretation: status,
                            alertClass: alertClass
                        })}
                        ${uiBuilder.createResultItem({
                            label: 'Measured Sodium',
                            value: measuredSodium!.toString(),
                            unit: 'mEq/L'
                        })}
                        ${uiBuilder.createResultItem({
                            label: 'Correction',
                            value: `+${(correctedSodium - measuredSodium!).toFixed(1)}`,
                            unit: 'mEq/L'
                        })}
                    `;

                        if (correctionFactor === 1.6 && glucoseMgDl! > 400) {
                            resultContent.innerHTML += uiBuilder.createAlert({
                                type: 'warning',
                                message:
                                    'Glucose > 400 mg/dL. Consider using correction factor of 2.4.'
                            });
                        }
                    }

                    resultBox.classList.add('show');
                }
            } catch (error) {
                logError(error as Error, { calculator: 'sodium-correction', action: 'calculate' });
                if (errorContainer) {
                    displayError(errorContainer as HTMLElement, error as Error);
                }
                if (resultBox) {
                    resultBox.classList.remove('show');
                }
            }
        };

        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculateAndUpdate);
            input.addEventListener('change', calculateAndUpdate);
        });

        // Radio button listener
        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', calculateAndUpdate);
        });

        // Auto-populate from FHIR data using FHIRDataService
        const autoPopulate = async () => {
            if (fhirDataService.isReady()) {
                try {
                    const [sodiumResult, glucoseResult] = await Promise.all([
                        fhirDataService.getObservation(LOINC_CODES.SODIUM, {
                            trackStaleness: true,
                            stalenessLabel: 'Measured Sodium'
                        }),
                        fhirDataService.getObservation(LOINC_CODES.GLUCOSE, {
                            trackStaleness: true,
                            stalenessLabel: 'Serum Glucose',
                            targetUnit: 'mg/dL',
                            unitType: 'glucose'
                        })
                    ]);

                    if (sodiumResult.value !== null && sodiumInput) {
                        sodiumInput.value = sodiumResult.value.toFixed(0);
                        sodiumInput.dispatchEvent(new Event('input'));
                    }

                    if (glucoseResult.value !== null && glucoseInput) {
                        glucoseInput.value = glucoseResult.value.toFixed(0);
                        glucoseInput.dispatchEvent(new Event('input'));
                    }
                } catch (e) {
                    console.warn('Error auto-populating Sodium Correction:', e);
                }
            }
            calculateAndUpdate();
        };

        autoPopulate();
    }
};
