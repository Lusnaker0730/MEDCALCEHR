import { calculateIntraopFluid } from './calculation.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { ValidationRules, validateCalculatorInput } from '../../validator.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';
import { fhirDataService } from '../../fhir-data-service.js';

export const intraopFluid = {
    id: 'intraop-fluid',
    title: 'Intraoperative Fluid Dosing in Adult Patients',
    description: 'Doses IV fluids intraoperatively.',
    generateHTML: function (): string {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>

            ${uiBuilder.createAlert({
                type: 'warning',
                message:
                    '<strong>IMPORTANT:</strong> This dosing tool is intended to assist with calculation, not to provide comprehensive or definitive drug information. Always double-check dosing.'
            })}
            
            ${uiBuilder.createAlert({
                type: 'info',
                message:
                    '<strong>INSTRUCTIONS:</strong> Use in patients undergoing surgery who weigh >10 kg and do not have conditions that could otherwise result in fluid overload such as heart failure, COPD, or kidney failure on dialysis.'
            })}

            ${uiBuilder.createSection({
                title: 'Patient Parameters',
                content: `
                    ${uiBuilder.createInput({
                        id: 'ifd-weight',
                        label: 'Weight',
                        type: 'number',
                        placeholder: 'e.g., 70',
                        unitToggle: { type: 'weight', units: ['kg', 'lbs'], default: 'kg' }
                    })}
                    ${uiBuilder.createInput({
                        id: 'ifd-npo',
                        label: 'Time spent NPO',
                        unit: 'hours',
                        type: 'number',
                        placeholder: 'e.g., 8'
                    })}
                `
            })}

            ${uiBuilder.createSection({
                title: 'Surgical Factors',
                content: uiBuilder.createRadioGroup({
                    name: 'ifd-trauma',
                    label: 'Estimated severity of trauma to tissue',
                    options: [
                        {
                            value: '4',
                            label: 'Minimal (e.g. hernia repair, laparoscopy) (4 mL/kg/hr)'
                        },
                        { value: '6', label: 'Moderate (e.g. open cholecystectomy) (6 mL/kg/hr)' },
                        { value: '8', label: 'Severe (e.g. bowel resection) (8 mL/kg/hr)' }
                    ]
                })
            })}

            <div id="ifd-result" class="ui-result-box">
                <div class="ui-result-header">Fluid Requirements</div>
                <div class="ui-result-content"></div>
            </div>

            ${uiBuilder.createSection({
                title: 'FORMULA',
                icon: '📐',
                content: `
                    <ul class="info-list">
                        <li><a href="#" class="text-link">Hourly maintenance fluid</a>, mL/hr = body weight, kg + 40 mL</li>
                        <li><strong>NPO fluid deficit</strong>, mL = hourly maintenance fluid, mL/hr × time spent NPO, hrs</li>
                        <li><strong>1st hour fluids:</strong> ½ NPO fluid deficit + hourly maintenance fluid + fluid loss from surgical trauma*</li>
                        <li><strong>2nd hour fluids:</strong> ¼ NPO fluid deficit + hourly maintenance fluid + fluid loss from surgical trauma*</li>
                        <li><strong>3rd hour fluids:</strong> ¼ NPO fluid deficit + hourly maintenance fluid + fluid loss from surgical trauma*</li>
                        <li><strong>4th hour fluids and beyond:</strong> hourly maintenance fluid + fluid loss from surgical trauma*</li>
                    </ul>
                    <p class="text-sm text-muted mt-15">*Estimated fluid loss from surgical trauma:</p>
                    ${uiBuilder.createTable({
                        headers: ['Severity', 'Example', 'Fluid Loss'],
                        rows: [
                            [
                                'Minimal',
                                'e.g. hernia repair, laparoscopy',
                                '2-4 mL/kg/hr (calculator uses 3 mL/kg/hr)'
                            ],
                            [
                                'Moderate',
                                'e.g. open cholecystectomy, open appendectomy',
                                '4-6 mL/kg/hr (calculator uses 5 mL/kg/hr)'
                            ],
                            [
                                'Severe',
                                'e.g. bowel resection',
                                '6-8 mL/kg/hr (calculator uses 7 mL/kg/hr)'
                            ]
                        ],
                        stickyFirstColumn: true
                    })}
                `
            })}
        `;
    },
    initialize: function (client: any, patient: any, container: HTMLElement): void {
        uiBuilder.initializeComponents(container);

        // Initialize FHIRDataService
        fhirDataService.initialize(client, patient, container);

        const weightInput = container.querySelector('#ifd-weight') as HTMLInputElement;
        const npoInput = container.querySelector('#ifd-npo') as HTMLInputElement;
        const resultBox = container.querySelector('#ifd-result') as HTMLElement;
        const resultContent = resultBox.querySelector('.ui-result-content') as HTMLElement;

        const calculate = () => {
            // Clear previous errors
            const existingError = container.querySelector('#ifd-error');
            if (existingError) {
                existingError.remove();
            }

            const weightKg = UnitConverter.getStandardValue(weightInput, 'kg');
            const npoHours = parseFloat(npoInput.value);
            const traumaRadio = container.querySelector(
                'input[name="ifd-trauma"]:checked'
            ) as HTMLInputElement | null;

            try {
                // Validation inputs
                const inputs = { weight: weightKg, hours: npoHours };
                const schema = {
                    weight: {
                        ...ValidationRules.weight,
                        min: 10,
                        message: 'Weight must be > 10 kg for this calculator.'
                    },
                    // @ts-ignore
                    hours: ValidationRules.hours
                };
                // @ts-ignore
                const validation = validateCalculatorInput(inputs, schema);

                if (!validation.isValid) {
                    // Filter required errors if empty
                    if (weightInput.value || npoInput.value) {
                        const meaningfulErrors = validation.errors.filter(
                            e => !e.includes('required') || (weightInput.value && npoInput.value)
                        );
                        if (
                            meaningfulErrors.length > 0 &&
                            weightKg !== null &&
                            !isNaN(weightKg) &&
                            !isNaN(npoHours)
                        ) {
                            const errorContainer = document.createElement('div');
                            errorContainer.id = 'ifd-error';
                            resultBox.parentNode?.insertBefore(errorContainer, resultBox);
                            displayError(
                                errorContainer,
                                new ValidationError(meaningfulErrors[0], 'VALIDATION_ERROR')
                            );
                        }
                    }

                    resultBox.classList.remove('show');
                    return;
                }

                if (!traumaRadio) {
                    return;
                }

                const traumaLevel = parseFloat(traumaRadio.value);

                const result = calculateIntraopFluid({
                    weightKg,
                    npoHours,
                    traumaLevel
                });

                const {
                    maintenanceRate,
                    npoDeficit,
                    firstHourFluids,
                    secondHourFluids,
                    thirdHourFluids,
                    fourthHourFluids
                } = result;

                resultContent.innerHTML = `
                    ${uiBuilder.createResultItem({
                        label: 'Hourly Maintenance Fluid',
                        value: maintenanceRate.toFixed(0),
                        unit: 'mL/hr'
                    })}
                    ${uiBuilder.createResultItem({
                        label: 'NPO Fluid Deficit',
                        value: npoDeficit.toFixed(0),
                        unit: 'mL'
                    })}
                    ${uiBuilder.createResultItem({
                        label: '1st Hour Fluids',
                        value: firstHourFluids.toFixed(0),
                        unit: 'mL/hr',
                        interpretation: '50% Deficit + Maint + Trauma'
                    })}
                    ${uiBuilder.createResultItem({
                        label: '2nd Hour Fluids',
                        value: secondHourFluids.toFixed(0),
                        unit: 'mL/hr',
                        interpretation: '25% Deficit + Maint + Trauma'
                    })}
                    ${uiBuilder.createResultItem({
                        label: '3rd Hour Fluids',
                        value: thirdHourFluids.toFixed(0),
                        unit: 'mL/hr',
                        interpretation: '25% Deficit + Maint + Trauma'
                    })}
                    ${uiBuilder.createResultItem({
                        label: '4th Hour & Beyond',
                        value: fourthHourFluids.toFixed(0),
                        unit: 'mL/hr',
                        interpretation: 'Maintenance + Trauma'
                    })}
                `;
                resultBox.classList.add('show');
            } catch (error: any) {
                logError(error, { calculator: 'intraop-fluid', action: 'calculate' });
                if (error.name !== 'ValidationError') {
                    let errorContainer = container.querySelector('#ifd-error');
                    if (!errorContainer) {
                        errorContainer = document.createElement('div');
                        errorContainer.id = 'ifd-error';
                        resultBox.parentNode?.insertBefore(errorContainer, resultBox);
                    }
                    displayError(errorContainer as HTMLElement, error);
                }
                resultBox.classList.remove('show');
            }
        };

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
                        weightInput.value = result.value.toFixed(1);
                        weightInput.dispatchEvent(new Event('input'));
                    }
                });
        }

        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculate);
            input.addEventListener('change', calculate);
        });

        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', calculate);
        });
    }
};
