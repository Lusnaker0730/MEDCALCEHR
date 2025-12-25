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

export const crcl: CalculatorModule = {
    id: 'crcl',
    title: 'Creatinine Clearance (Cockcroft-Gault Equation)',
    description: 'Calculates CrCl according to the Cockcroft-Gault equation.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            ${uiBuilder.createSection({
                title: 'Patient Information',
                icon: '👤',
                content: `
                    ${uiBuilder.createRadioGroup({
                        name: 'crcl-gender',
                        label: 'Gender',
                        options: [
                            { value: 'male', label: 'Male', checked: true },
                            { value: 'female', label: 'Female' }
                        ]
                    })}
                    ${uiBuilder.createInput({
                        id: 'crcl-age',
                        label: 'Age',
                        type: 'number',
                        unit: 'years',
                        placeholder: 'e.g., 65'
                    })}
                    ${uiBuilder.createInput({
                        id: 'crcl-weight',
                        label: 'Weight',
                        type: 'number',
                        placeholder: 'e.g., 70',
                        unitToggle: {
                            type: 'weight',
                            units: ['kg', 'lbs'],
                            default: 'kg'
                        }
                    })}
                `
            })}
            
            ${uiBuilder.createSection({
                title: 'Lab Values',
                icon: '🧪',
                content: uiBuilder.createInput({
                    id: 'crcl-scr',
                    label: 'Serum Creatinine',
                    type: 'number',
                    placeholder: 'e.g., 1.0',
                    unitToggle: {
                        type: 'creatinine',
                        units: ['mg/dL', 'µmol/L'],
                        default: 'mg/dL'
                    }
                })
            })}
            
            <div id="crcl-error-container"></div>
            
            <div id="crcl-result" class="ui-result-box">
                <div class="ui-result-header">Creatinine Clearance Results</div>
                <div class="ui-result-content"></div>
            </div>

            ${uiBuilder.createFormulaSection({
                items: [
                    { label: 'Male', formula: '[(140 - Age) × Weight] / (72 × Serum Creatinine)' },
                    {
                        label: 'Female',
                        formula: '[(140 - Age) × Weight × 0.85] / (72 × Serum Creatinine)'
                    }
                ]
            })}

            ${uiBuilder.createAlert({
                type: 'info',
                message: `
                    <h4>Note:</h4>
                    <ul class="info-list">
                        <li>This formula estimates creatinine clearance, not GFR.</li>
                        <li>May overestimate clearance in elderly patients.</li>
                    </ul>
                `
            })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        // Initialize FHIRDataService
        fhirDataService.initialize(client, patient, container);

        const ageInput = container.querySelector('#crcl-age') as HTMLInputElement;
        const weightInput = container.querySelector('#crcl-weight') as HTMLInputElement;
        const scrInput = container.querySelector('#crcl-scr') as HTMLInputElement;
        const resultBox = container.querySelector('#crcl-result');

        const calculateAndUpdate = () => {
            // Clear previous errors
            const errorContainer = container.querySelector('#crcl-error-container');
            if (errorContainer) {
                errorContainer.innerHTML = '';
            }

            const age = parseFloat(ageInput.value);
            const weightKg = UnitConverter.getStandardValue(weightInput, 'kg');
            const scrMgDl = UnitConverter.getStandardValue(scrInput, 'mg/dL');
            const gender =
                (container.querySelector('input[name="crcl-gender"]:checked') as HTMLInputElement)
                    ?.value || 'male';

            try {
                // Validation inputs
                const inputs = { age, weight: weightKg, creatinine: scrMgDl };
                const schema = {
                    age: ValidationRules.age,
                    weight: ValidationRules.weight,
                    creatinine: ValidationRules.creatinine
                };

                // @ts-ignore
                const validation = validateCalculatorInput(inputs, schema);

                if (!validation.isValid) {
                    const hasInput = ageInput.value || weightInput.value || scrInput.value;

                    if (hasInput) {
                        const valuesPresent =
                            !isNaN(age) &&
                            weightKg !== null &&
                            !isNaN(weightKg) &&
                            scrMgDl !== null &&
                            !isNaN(scrMgDl);
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

                if (weightKg === null || scrMgDl === null) {
                    return;
                }

                let crclVal = ((140 - age) * weightKg) / (72 * scrMgDl);
                if (gender === 'female') {
                    crclVal *= 0.85;
                }

                if (!isFinite(crclVal) || isNaN(crclVal)) {
                    throw new Error('Calculation Error');
                }

                let category = '';
                let severityClass = 'ui-alert-success';
                let alertType: 'info' | 'warning' | 'danger' = 'info';
                let alertMsg = '';

                if (crclVal >= 90) {
                    category = 'Normal kidney function';
                    severityClass = 'ui-alert-success';
                    alertMsg = 'Normal creatinine clearance.';
                } else if (crclVal >= 60) {
                    category = 'Mild reduction';
                    severityClass = 'ui-alert-success';
                    alertMsg = 'Mildly reduced creatinine clearance.';
                } else if (crclVal >= 30) {
                    category = 'Moderate reduction';
                    severityClass = 'ui-alert-warning';
                    alertMsg =
                        'Moderate reduction in kidney function. Consider nephrology referral and dose adjustment for renally cleared medications.';
                    alertType = 'warning';
                } else if (crclVal >= 15) {
                    category = 'Severe reduction';
                    severityClass = 'ui-alert-danger';
                    alertMsg =
                        'Severe reduction in kidney function. Nephrology referral required. Careful medication dosing adjustments necessary.';
                    alertType = 'danger';
                } else {
                    category = 'Kidney failure';
                    severityClass = 'ui-alert-danger';
                    alertMsg =
                        'Kidney failure. Consider dialysis or transplantation. Avoid renally cleared medications.';
                    alertType = 'danger';
                }

                if (resultBox) {
                    const resultContent = resultBox.querySelector('.ui-result-content');
                    if (resultContent) {
                        resultContent.innerHTML = `
                            ${uiBuilder.createResultItem({
                                label: 'Creatinine Clearance',
                                value: crclVal.toFixed(1),
                                unit: 'mL/min',
                                interpretation: category,
                                alertClass: severityClass
                            })}
                            ${uiBuilder.createAlert({
                                type: alertType,
                                message: alertMsg
                            })}
                        `;
                    }
                    resultBox.classList.add('show');
                }
            } catch (error) {
                logError(error as Error, { calculator: 'crcl', action: 'calculate' });
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

        // Auto-populate using FHIRDataService
        const autoPopulate = async () => {
            if (fhirDataService.isReady()) {
                try {
                    // Get age
                    const age = await fhirDataService.getPatientAge();
                    if (age !== null && ageInput) {
                        ageInput.value = age.toString();
                        ageInput.dispatchEvent(new Event('input'));
                    }

                    // Get gender
                    const gender = await fhirDataService.getPatientGender();
                    if (gender) {
                        const genderValue = gender.toLowerCase() === 'female' ? 'female' : 'male';
                        const genderRadio = container.querySelector(
                            `input[name="crcl-gender"][value="${genderValue}"]`
                        ) as HTMLInputElement | null;
                        if (genderRadio) {
                            genderRadio.checked = true;
                            genderRadio.dispatchEvent(new Event('change'));
                        }
                    }

                    // Get weight and creatinine in parallel
                    const [weightResult, crResult] = await Promise.all([
                        fhirDataService.getObservation(LOINC_CODES.WEIGHT, {
                            trackStaleness: true,
                            stalenessLabel: 'Weight',
                            targetUnit: 'kg',
                            unitType: 'weight'
                        }),
                        fhirDataService.getObservation(LOINC_CODES.CREATININE, {
                            trackStaleness: true,
                            stalenessLabel: 'Serum Creatinine',
                            targetUnit: 'mg/dL',
                            unitType: 'creatinine'
                        })
                    ]);

                    if (weightResult.value !== null && weightInput) {
                        weightInput.value = weightResult.value.toFixed(1);
                        weightInput.dispatchEvent(new Event('input'));
                    }

                    if (crResult.value !== null && scrInput) {
                        scrInput.value = crResult.value.toFixed(2);
                        scrInput.dispatchEvent(new Event('input'));
                    }
                } catch (e) {
                    console.warn('Error auto-populating CrCl:', e);
                }
            }
            calculateAndUpdate();
        };

        autoPopulate();
    }
};
