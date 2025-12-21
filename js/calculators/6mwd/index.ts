import { getMostRecentObservation, calculateAge } from '../../utils.js';
import { createStalenessTracker } from '../../data-staleness.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';

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

            <div class="info-section" style="margin-top: 20px; font-size: 0.85em; color: #666;">
                <h4>Reference</h4>
                <p>Enright, P L, & Sherrill, D L. (1998). Reference equations for the six-minute walk in healthy adults. <em>American journal of respiratory and critical care medicine</em>, 158(5 Pt 1), 1384-7.</p>
            </div>
        `;
    },
    initialize: function (client: any, patient: any, container: HTMLElement) {
        uiBuilder.initializeComponents(container);
        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);

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

        // Auto-populate
        if (patient && patient.birthDate) {
            ageEl.value = calculateAge(patient.birthDate).toString(); // calculateAge might need date string
        }

        if (patient && patient.gender) {
            const genderRadio = container.querySelector(`input[name="mwd6-gender"][value="${patient.gender}"]`) as HTMLInputElement | null;
            if (genderRadio) {
                genderRadio.checked = true;
                genderRadio.dispatchEvent(new Event('change'));
            }
        }

        if (client) {
            getMostRecentObservation(client, LOINC_CODES.HEIGHT).then(obs => {
                if (obs && obs.valueQuantity && obs.valueQuantity.value !== undefined) {
                    const val = obs.valueQuantity.value;
                    const unit = obs.valueQuantity.unit || 'cm';
                    const standardized = UnitConverter.convert(val, unit, 'cm', 'height');
                    if (standardized !== null) {
                        // Check current unit of input to decide whether to set directly or convert
                        // But UnitConverter.getStandardValue reads the input unit.
                        // Here we are SETTING the value.
                        // Ideally we set it in the input's current unit or force the unit.
                        // For simplicity, let's assume we set it in cm if default is cm, or just let unit converter handle display?
                        // Actually better to just set value if we know the unit or convert to expected input default.
                        heightEl.value = standardized.toFixed(1);
                        stalenessTracker.trackObservation('#mwd6-height', obs, LOINC_CODES.HEIGHT, 'Height');
                        // Trigger calc
                        calculate();
                    }
                }
            }).catch(console.warn);

            getMostRecentObservation(client, LOINC_CODES.WEIGHT).then(obs => {
                if (obs && obs.valueQuantity && obs.valueQuantity.value !== undefined) {
                    const val = obs.valueQuantity.value;
                    const unit = obs.valueQuantity.unit || 'kg';
                    const standardized = UnitConverter.convert(val, unit, 'kg', 'weight');
                    if (standardized !== null) {
                        weightEl.value = standardized.toFixed(1);
                        stalenessTracker.trackObservation('#mwd6-weight', obs, LOINC_CODES.WEIGHT, 'Weight');
                        calculate();
                    }
                }
            }).catch(console.warn);
        }

        calculate();
    }
};
