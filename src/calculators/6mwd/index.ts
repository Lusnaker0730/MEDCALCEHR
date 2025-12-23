import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';
import { fhirDataService } from '../../fhir-data-service.js';

interface CalculatorModule {
    id: string;
    title: string;
    description: string;
    generateHTML: () => string;
    initialize: (client: any, patient: any, container: HTMLElement) => void;
}

export const sixMwd: CalculatorModule = {
    id: '6mwd',
    title: '6 Minute Walk Distance',
    description: 'Calculates reference values for distance walked, as a measure of functional status.',
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
                name: 'mwd6-gender',
                label: 'Sex',
                options: [
                    { value: 'male', label: 'Male', checked: true },
                    { value: 'female', label: 'Female' }
                ]
            })}
                    ${uiBuilder.createInput({
                id: 'mwd6-age',
                label: 'Age',
                type: 'number',
                unit: 'years',
                placeholder: 'e.g., 62'
            })}
                    ${uiBuilder.createInput({
                id: 'mwd6-height',
                label: 'Height',
                type: 'number',
                placeholder: 'e.g., 175',
                unitToggle: {
                    type: 'height',
                    units: ['cm', 'in'],
                    default: 'cm'
                }
            })}
                    ${uiBuilder.createInput({
                id: 'mwd6-weight',
                label: 'Weight',
                type: 'number',
                placeholder: 'e.g., 88',
                unitToggle: {
                    type: 'weight',
                    units: ['kg', 'lbs'],
                    default: 'kg'
                }
            })}
                `
        })}

            ${uiBuilder.createSection({
            title: 'Test Result',
            icon: '🚶',
            content: uiBuilder.createInput({
                id: 'mwd6-distance',
                label: 'Distance Walked (optional)',
                type: 'number',
                unit: 'm',
                placeholder: 'e.g., 400',
                helpText: 'Enter actual distance to see % of expected'
            })
        })}

            <div id="mwd6-error-container"></div>
            ${uiBuilder.createResultBox({ id: 'mwd6-result', title: '6 Minute Walk Distance Results' })}



            ${uiBuilder.createFormulaSection({
            items: [
                {
                    title: 'Men',
                    formulas: [
                        '6MWD = (7.57 × height<sub>cm</sub>) - (5.02 × age) - (1.76 × weight<sub>kg</sub>) - 309 m',
                        'Alternate: 6MWD = 1,140 m - (5.61 × BMI) - (6.94 × age)'
                    ]
                },
                {
                    title: 'Women',
                    formulas: [
                        '6MWD = (2.11 × height<sub>cm</sub>) - (2.29 × weight<sub>kg</sub>) - (5.78 × age) + 667 m',
                        'Alternate: 6MWD = 1,017 m - (6.24 × BMI) - (5.83 × age)'
                    ]
                },
                {
                    title: 'Lower Limit of Normal',
                    formulas: [
                        'LLN = Expected Distance - 153 m'
                    ],
                    notes: 'When using either equation, subtract 153 m for the LLN'
                },
                {
                    label: 'Abbreviations',
                    content: 'BMI = body mass index (kg/m²); 6MWD = 6-min walk distance; LLN = lower limit of normal'
                }
            ]
        })}

            <div class="info-section mt-20 text-sm text-muted">
                <h4>Reference</h4>
                <p>Enright, P L, & Sherrill, D L. (1998). Reference equations for the six-minute walk in healthy adults. <em>American journal of respiratory and critical care medicine</em>, 158(5 Pt 1), 1384-7.</p>
            </div>
        `;
    },
    initialize: function (client: any, patient: any, container: HTMLElement) {
        uiBuilder.initializeComponents(container);
        
        // Initialize FHIRDataService
        fhirDataService.initialize(client, patient, container);

        const ageEl = container.querySelector('#mwd6-age') as HTMLInputElement;
        const heightEl = container.querySelector('#mwd6-height') as HTMLInputElement;
        const weightEl = container.querySelector('#mwd6-weight') as HTMLInputElement;
        const distanceEl = container.querySelector('#mwd6-distance') as HTMLInputElement;
        const resultBox = container.querySelector('#mwd6-result');

        const calculate = () => {
            try {
                // Clear validation errors
                const errorContainer = container.querySelector('#mwd6-error-container');
                if (errorContainer) errorContainer.innerHTML = '';

                const age = parseInt(ageEl.value);
                const genderRadio = container.querySelector('input[name="mwd6-gender"]:checked') as HTMLInputElement | null;

                // Get standardized values including unit conversion
                const heightCm = UnitConverter.getStandardValue(heightEl, 'cm');
                const weightKg = UnitConverter.getStandardValue(weightEl, 'kg');
                const actualDistance = distanceEl.value ? parseInt(distanceEl.value) : NaN;

                if (isNaN(age) || !genderRadio || heightCm === null || weightKg === null) {
                    if (resultBox) resultBox.classList.remove('show');
                    return;
                }

                // Note: getStandardValue returning null generally handled by isNaN check if expected numbers,
                // but since it returns number | null, explicit null check is better.
                // However, UnitConverter.getStandardValue returns number | null.
                // If inputs are empty, it returns null.

                const gender = genderRadio.value;
                let expectedDistance = 0;
                // Enright, F. (2003). The six-minute walk test. Respiratory Care, 48(8), 783-785.
                if (gender === 'male') {
                    expectedDistance = 7.57 * heightCm - 5.02 * age - 1.76 * weightKg - 309;
                } else {
                    // female
                    expectedDistance = 2.11 * heightCm - 2.29 * weightKg - 5.78 * age + 667;
                }

                // Lolkema, D. (2006). Reference values for the 6-minute walk test in a healthy Dutch population aged 40-70 years: a cross-sectional study.
                const lowerLimitNormal = expectedDistance - 153; // for men and women

                let percentage = NaN;
                if (!isNaN(actualDistance)) {
                    percentage = (actualDistance / expectedDistance) * 100;
                }

                if (resultBox) {
                    const resultContent = resultBox.querySelector('.ui-result-content');
                    if (resultContent) {
                        resultContent.innerHTML = `
                        ${uiBuilder.createResultItem({
                            label: 'Expected Distance',
                            value: expectedDistance.toFixed(0),
                            unit: 'meters'
                        })}
                        ${uiBuilder.createResultItem({
                            label: 'Lower Limit of Normal',
                            value: lowerLimitNormal.toFixed(0),
                            unit: 'meters'
                        })}
                        ${!isNaN(percentage) ? uiBuilder.createResultItem({
                            label: '% of Expected',
                            value: percentage.toFixed(0),
                            unit: '%',
                            interpretation: percentage < 80 ? 'Reduced' : 'Normal',
                            alertClass: percentage < 80 ? 'ui-alert-warning' : 'ui-alert-success'
                        }) : ''}
                    `;
                    }
                    resultBox.classList.add('show');
                }
            } catch (error) {
                const errorContainer = container.querySelector('#mwd6-error-container');
                if (errorContainer) {
                    displayError(errorContainer as HTMLElement, error as Error);
                } else {
                    console.error(error);
                }
                logError(error as Error, { calculator: '6mwd', action: 'calculate' });
            }
        };

        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculate);
            // change needed for radios and sometimes converted inputs
            input.addEventListener('change', calculate);
        });

        // Auto-populate using FHIRDataService
        const age = fhirDataService.getPatientAge();
        if (age !== null) {
            ageEl.value = age.toString();
        }

        const gender = fhirDataService.getPatientGender();
        if (gender) {
            const genderRadio = container.querySelector(`input[name="mwd6-gender"][value="${gender}"]`) as HTMLInputElement | null;
            if (genderRadio) {
                genderRadio.checked = true;
                genderRadio.dispatchEvent(new Event('change'));
            }
        }

        if (client) {
            fhirDataService.getObservation(LOINC_CODES.HEIGHT, { trackStaleness: true, stalenessLabel: 'Height', targetUnit: 'cm', unitType: 'height' }).then(result => {
                if (result.value !== null) {
                    heightEl.value = result.value.toFixed(1);
                    calculate();
                }
            }).catch(console.warn);

            fhirDataService.getObservation(LOINC_CODES.WEIGHT, { trackStaleness: true, stalenessLabel: 'Weight', targetUnit: 'kg', unitType: 'weight' }).then(result => {
                if (result.value !== null) {
                    weightEl.value = result.value.toFixed(1);
                    calculate();
                }
            }).catch(console.warn);
        }

        calculate();
    }
};
