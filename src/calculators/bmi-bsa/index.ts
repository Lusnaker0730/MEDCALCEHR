import { UnitConverter } from '../../unit-converter.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { ValidationError, logError, displayError } from '../../errorHandler.js';
import { ValidationRules, validateCalculatorInput } from '../../validator.js';
import { uiBuilder } from '../../ui-builder.js';
import { fhirDataService } from '../../fhir-data-service.js';

interface CalculatorModule {
    id: string;
    title: string;
    description?: string;
    generateHTML: () => string;
    initialize: (client: any, patient: any, container: HTMLElement) => void;
}

export const bmiBsa: CalculatorModule = {
    id: 'bmi-bsa',
    title: 'BMI & Body Surface Area (BSA)',
    description:
        'Calculates Body Mass Index (BMI) and Body Surface Area (BSA) for clinical assessment and medication dosing.',
    generateHTML: function () {
        const inputSection = uiBuilder.createSection({
            title: 'Patient Measurements',
            content: [
                uiBuilder.createInput({
                    id: 'bmi-bsa-weight',
                    label: 'Weight',
                    type: 'number',
                    placeholder: 'e.g. 70',
                    unitToggle: { type: 'weight', units: ['kg', 'lbs'], default: 'kg' }
                }),
                uiBuilder.createInput({
                    id: 'bmi-bsa-height',
                    label: 'Height',
                    type: 'number',
                    placeholder: 'e.g. 170',
                    unitToggle: { type: 'height', units: ['cm', 'in'], default: 'cm' }
                })
            ].join('')
        });

        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">Calculates Body Mass Index (BMI) and Body Surface Area (BSA) for clinical assessment and medication dosing.</p>
            </div>
            
            ${inputSection}
            
            <div id="bmi-bsa-error-container"></div>
            
            <div id="bmi-bsa-result" class="ui-result-box">
                <div class="ui-result-header">BMI & BSA Results</div>
                <div class="ui-result-content"></div>
            </div>
            
            ${uiBuilder.createFormulaSection({
                items: [
                    { label: 'BMI (Body Mass Index)', formula: 'Weight (kg) / Height² (m²)' },
                    {
                        label: 'BSA (Du Bois Formula)',
                        formula:
                            '0.007184 × Weight<sup>0.425</sup> (kg) × Height<sup>0.725</sup> (cm)'
                    }
                ]
            })}
        `;
    },
    initialize: function (client, patient, container) {
        // Initialize UI Builder components (unit toggles, etc.)
        uiBuilder.initializeComponents(container);

        // Initialize FHIRDataService
        fhirDataService.initialize(client, patient, container);

        const resultEl = container.querySelector('#bmi-bsa-result') as HTMLElement;

        const weightInput = container.querySelector('#bmi-bsa-weight') as HTMLInputElement;
        const heightInput = container.querySelector('#bmi-bsa-height') as HTMLInputElement;

        // Function to calculate and update results
        const calculateAndUpdate = () => {
            const errorContainer = container.querySelector('#bmi-bsa-error-container');
            if (errorContainer) {
                errorContainer.innerHTML = '';
            }

            try {
                // Get values in standard units (kg and cm)
                const weightKg = UnitConverter.getStandardValue(weightInput, 'kg');
                const heightCm = UnitConverter.getStandardValue(heightInput, 'cm');

                // Validate input
                const inputs = {
                    weight: weightKg,
                    height: heightCm
                };
                const schema = {
                    weight: ValidationRules.weight,
                    height: ValidationRules.height
                };
                // @ts-ignore
                const validation = validateCalculatorInput(inputs, schema);

                if (!validation.isValid) {
                    // Filter required errors if empty
                    if (weightInput.value || heightInput.value) {
                        const meaningfulErrors = validation.errors.filter(
                            (e: string) =>
                                !e.includes('required') || (weightInput.value && heightInput.value)
                        );
                        if (
                            meaningfulErrors.length > 0 &&
                            (weightKg !== null || heightCm !== null)
                        ) {
                            if (errorContainer) {
                                displayError(
                                    errorContainer as HTMLElement,
                                    new ValidationError(meaningfulErrors[0], 'VALIDATION_ERROR')
                                );
                            }
                        }
                    }
                    if (resultEl) {
                        resultEl.classList.remove('show');
                    }
                    return;
                }

                if (weightKg !== null && heightCm !== null && weightKg > 0 && heightCm > 0) {
                    const heightInMeters = heightCm / 100;
                    const bmi = weightKg / (heightInMeters * heightInMeters);
                    const bsa = 0.007184 * Math.pow(weightKg, 0.425) * Math.pow(heightCm, 0.725); // Du Bois

                    // Validate calculation results
                    if (isNaN(bmi) || isNaN(bsa) || !isFinite(bmi) || !isFinite(bsa)) {
                        throw new ValidationError(
                            'Invalid calculation result, please check input values',
                            { code: 'BMI_BSA_CALCULATION_ERROR', weightKg, heightCm, bmi, bsa }
                        );
                    }

                    // Determine BMI category and severity
                    let bmiCategory = '';
                    let alertClass = '';

                    if (bmi < 18.5) {
                        bmiCategory = 'Underweight';
                        alertClass = 'warning';
                    } else if (bmi < 25) {
                        bmiCategory = 'Normal weight';
                        alertClass = 'success';
                    } else if (bmi < 30) {
                        bmiCategory = 'Overweight';
                        alertClass = 'warning';
                    } else if (bmi < 35) {
                        bmiCategory = 'Obese (Class I)';
                        alertClass = 'danger';
                    } else if (bmi < 40) {
                        bmiCategory = 'Obese (Class II)';
                        alertClass = 'danger';
                    } else {
                        bmiCategory = 'Obese (Class III)';
                        alertClass = 'danger';
                    }

                    if (resultEl) {
                        const resultContent = resultEl.querySelector('.ui-result-content');
                        if (resultContent) {
                            resultContent.innerHTML = `
                                ${uiBuilder.createResultItem({
                                    label: 'Body Mass Index (BMI)',
                                    value: bmi.toFixed(1),
                                    unit: 'kg/m²',
                                    interpretation: bmiCategory,
                                    alertClass: 'ui-alert-' + alertClass
                                })}
                                
                                ${uiBuilder.createResultItem({
                                    label: 'Body Surface Area (BSA)',
                                    value: bsa.toFixed(2),
                                    unit: 'm²'
                                })}
                                
                                ${uiBuilder.createAlert({
                                    type: 'info',
                                    message:
                                        'BSA calculated using Du Bois formula. Used for medication dosing and cardiac index calculation.'
                                })}
                            `;
                        }
                        resultEl.classList.add('show');
                    }
                } else {
                    // Hide result if inputs are invalid (0 or negative that slipped through)
                    if (resultEl) {
                        resultEl.classList.remove('show');
                    }
                }
            } catch (error) {
                logError(error as Error, {
                    calculator: 'bmi-bsa',
                    action: 'calculateAndUpdate'
                });

                // Display error message
                if (errorContainer) {
                    displayError(errorContainer as HTMLElement, error as Error);
                }

                // Reset result display
                if (resultEl) {
                    resultEl.classList.remove('show');
                }
            }
        };

        // Add event listeners for real-time calculation
        const inputs = container.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', calculateAndUpdate);
        });
        container
            .querySelectorAll('select')
            .forEach(s => s.addEventListener('change', calculateAndUpdate));

        // Auto-populate from FHIR data using FHIRDataService
        const autoPopulate = async () => {
            if (fhirDataService.isReady()) {
                try {
                    // Get weight and height in parallel
                    const [weightResult, heightResult] = await Promise.all([
                        fhirDataService.getObservation(LOINC_CODES.WEIGHT, {
                            trackStaleness: true,
                            stalenessLabel: 'Weight',
                            targetUnit: 'kg',
                            unitType: 'weight'
                        }),
                        fhirDataService.getObservation(LOINC_CODES.HEIGHT, {
                            trackStaleness: true,
                            stalenessLabel: 'Height',
                            targetUnit: 'cm',
                            unitType: 'height'
                        })
                    ]);

                    if (weightResult.value !== null && weightInput) {
                        weightInput.value = weightResult.value.toFixed(1);
                        weightInput.dispatchEvent(new Event('input'));
                    }

                    if (heightResult.value !== null && heightInput) {
                        heightInput.value = heightResult.value.toFixed(1);
                        heightInput.dispatchEvent(new Event('input'));
                    }
                } catch (error) {
                    console.warn('Error auto-populating BMI-BSA:', error);
                }
            }
            calculateAndUpdate();
        };

        autoPopulate();
    }
};
