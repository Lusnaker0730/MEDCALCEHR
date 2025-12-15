import { getMostRecentObservation, calculateAge } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { ValidationRules, validateCalculatorInput } from '../../validator.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';

export const graceAcs = {
    id: 'grace-acs',
    title: 'GRACE ACS Risk Score',
    description:
        'Estimates admission to 6 month mortality for patients with acute coronary syndrome.',
    generateHTML: function () {
        const vitalsSection = uiBuilder.createSection({
            title: 'Vital Signs & Demographics',
            icon: '🌡️',
            content: [
                uiBuilder.createInput({
                    id: 'grace-age',
                    label: 'Age',
                    type: 'number',
                    placeholder: 'Enter age',
                    unit: 'years'
                }),
                uiBuilder.createInput({
                    id: 'grace-hr',
                    label: 'Heart Rate',
                    type: 'number',
                    placeholder: 'Enter heart rate',
                    unit: 'bpm'
                }),
                uiBuilder.createInput({
                    id: 'grace-sbp',
                    label: 'Systolic BP',
                    type: 'number',
                    placeholder: 'Enter systolic BP',
                    unit: 'mmHg'
                }),
                uiBuilder.createInput({
                    id: 'grace-creatinine',
                    label: 'Creatinine',
                    type: 'number',
                    step: 0.1,
                    placeholder: 'Enter creatinine',
                    unitToggle: {
                        type: 'creatinine',
                        units: ['mg/dL', 'µmol/L'],
                        defaultUnit: 'mg/dL'
                    }
                })
            ].join('')
        });

        const clinicalSection = uiBuilder.createSection({
            title: 'Clinical Findings',
            icon: '🩺',
            content: [
                uiBuilder.createRadioGroup({
                    name: 'grace-killip',
                    label: 'Killip Class (Heart Failure Classification)',
                    options: [
                        { value: '0', label: 'Class I - No heart failure', checked: true },
                        { value: '20', label: 'Class II - Mild HF (rales, S3)' },
                        { value: '39', label: 'Class III - Pulmonary edema' },
                        { value: '59', label: 'Class IV - Cardiogenic shock' }
                    ]
                }),
                uiBuilder.createRadioGroup({
                    name: 'grace-cardiac-arrest',
                    label: 'Cardiac Arrest at Admission',
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: '39', label: 'Yes' }
                    ]
                }),
                uiBuilder.createRadioGroup({
                    name: 'grace-st-deviation',
                    label: 'ST Segment Deviation',
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: '28', label: 'Yes' }
                    ]
                }),
                uiBuilder.createRadioGroup({
                    name: 'grace-cardiac-enzymes',
                    label: 'Abnormal Cardiac Enzymes',
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: '14', label: 'Yes' }
                    ]
                })
            ].join('')
        });

        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            ${vitalsSection}
            ${clinicalSection}
            
            <div id="grace-error-container"></div>
            ${uiBuilder.createResultBox({ id: 'grace-result', title: 'GRACE ACS Risk Assessment' })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const calculate = () => {
            try {
                // Clear validation errors
                const errorContainer = container.querySelector('#grace-error-container');
                if (errorContainer) errorContainer.innerHTML = '';

                // Get inputs using standard logic or standard values
                const ageInput = container.querySelector('#grace-age');
                const hrInput = container.querySelector('#grace-hr');
                const sbpInput = container.querySelector('#grace-sbp');
                const creatinineInput = container.querySelector('#grace-creatinine');

                // Unit Conversion for creatinine
                const creatinine = UnitConverter.getStandardValue(creatinineInput, 'mg/dL');

                // Values for logic
                const age = parseFloat(ageInput.value);
                const hr = parseFloat(hrInput.value);
                const sbp = parseFloat(sbpInput.value);

                // Validation
                const inputs = {
                    age: age,
                    hr: hr,
                    sbp: sbp,
                    creatinine: creatinine
                };
                const schema = {
                    age: ValidationRules.age,
                    hr: ValidationRules.heartRate,
                    sbp: ValidationRules.systolicBp,
                    creatinine: ValidationRules.creatinine
                };

                const validation = validateCalculatorInput(inputs, schema);

                if (!validation.isValid) {
                    // Check if meaningful input is present to show error
                    const hasInput = (age || hr || sbp || !isNaN(creatinine));
                    if (hasInput) {
                        // Only show if fields are non-empty but invalid
                        if (validation.errors.some(e => !e.includes('required'))) {
                            if (errorContainer) {
                                displayError(errorContainer, new ValidationError(validation.errors[0], 'VALIDATION_ERROR'));
                            }
                        }
                    }
                    // Hide result until valid
                    container.querySelector('#grace-result').classList.remove('show');
                    return;
                }

                // If fully valid, proceed
                const getRadioVal = (name) => {
                    const el = container.querySelector(`input[name="${name}"]:checked`);
                    return el ? parseInt(el.value) : 0;
                };

                const killip = getRadioVal('grace-killip');
                const arrest = getRadioVal('grace-cardiac-arrest');
                const st = getRadioVal('grace-st-deviation');
                const enzymes = getRadioVal('grace-cardiac-enzymes');

                let agePoints = 0;
                if (age >= 40 && age <= 49) agePoints = 18;
                else if (age >= 50 && age <= 59) agePoints = 36;
                else if (age >= 60 && age <= 69) agePoints = 55;
                else if (age >= 70 && age <= 79) agePoints = 73;
                else if (age >= 80) agePoints = 91;

                let hrPoints = 0;
                if (hr >= 50 && hr <= 69) hrPoints = 0;
                else if (hr >= 70 && hr <= 89) hrPoints = 3;
                else if (hr >= 90 && hr <= 109) hrPoints = 7;
                else if (hr >= 110 && hr <= 149) hrPoints = 13;
                else if (hr >= 150 && hr <= 199) hrPoints = 23;
                else if (hr >= 200) hrPoints = 36;

                let sbpPoints = 0;
                if (sbp >= 200) sbpPoints = 0;
                else if (sbp >= 160 && sbp <= 199) sbpPoints = 10;
                else if (sbp >= 140 && sbp <= 159) sbpPoints = 18;
                else if (sbp >= 120 && sbp <= 139) sbpPoints = 24;
                else if (sbp >= 100 && sbp <= 119) sbpPoints = 34;
                else if (sbp >= 80 && sbp <= 99) sbpPoints = 43;
                else if (sbp < 80) sbpPoints = 53;

                let crPoints = 0;
                if (creatinine >= 0 && creatinine <= 0.39) crPoints = 1;
                else if (creatinine >= 0.4 && creatinine <= 0.79) crPoints = 4;
                else if (creatinine >= 0.8 && creatinine <= 1.19) crPoints = 7;
                else if (creatinine >= 1.2 && creatinine <= 1.59) crPoints = 10;
                else if (creatinine >= 1.6 && creatinine <= 1.99) crPoints = 13;
                else if (creatinine >= 2.0 && creatinine <= 3.99) crPoints = 21;
                else if (creatinine >= 4.0) crPoints = 28;

                const totalScore = agePoints + hrPoints + sbpPoints + crPoints + killip + arrest + st + enzymes;

                let inHospitalMortality = '<1%';
                let riskLevel = 'Low Risk';
                let alertClass = 'ui-alert-success';
                let riskDescription = 'Low risk of in-hospital mortality';

                if (totalScore > 140) {
                    inHospitalMortality = '>3%';
                    riskLevel = 'High Risk';
                    alertClass = 'ui-alert-danger';
                    riskDescription = 'High risk of in-hospital mortality - Consider intensive monitoring and aggressive intervention';
                } else if (totalScore > 118) {
                    inHospitalMortality = '1-3%';
                    riskLevel = 'Intermediate Risk';
                    alertClass = 'ui-alert-warning';
                    riskDescription = 'Intermediate risk of in-hospital mortality - Close monitoring recommended';
                }

                const resultBox = container.querySelector('#grace-result');
                const resultContent = resultBox.querySelector('.ui-result-content');

                resultContent.innerHTML = `
                    ${uiBuilder.createResultItem({
                    label: 'Total GRACE Score',
                    value: totalScore,
                    unit: 'points',
                    interpretation: riskLevel,
                    alertClass: alertClass
                })}
                    ${uiBuilder.createResultItem({
                    label: 'In-Hospital Mortality Risk',
                    value: inHospitalMortality,
                    alertClass: alertClass
                })}
                    
                    <div class="ui-alert ${alertClass} mt-10">
                        <span class="ui-alert-icon">📋</span>
                        <div class="ui-alert-content">
                            <strong>Interpretation:</strong> ${riskDescription}
                        </div>
                    </div>
                `;

                resultBox.classList.add('show');
            } catch (error) {
                const errorContainer = container.querySelector('#grace-error-container');
                if (errorContainer) {
                    displayError(errorContainer, error);
                } else {
                    console.error(error);
                }
                logError(error, { calculator: 'grace-acs', action: 'calculate' });
            }
        };

        // Add event listeners
        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculate);
            input.addEventListener('change', calculate);
        });

        // Auto-populate (only if client exists)
        if (client) {
            if (patient && patient.birthDate) {
                container.querySelector('#grace-age').value = calculateAge(patient.birthDate);
                // Dispatch input event to trigger calculation if other fields present? 
                // Better to just set value, wait for other asyncs, then calc.
            }

            getMostRecentObservation(client, LOINC_CODES.HEART_RATE).then(obs => {
                if (obs?.valueQuantity) container.querySelector('#grace-hr').value = Math.round(obs.valueQuantity.value);
            });

            getMostRecentObservation(client, LOINC_CODES.SYSTOLIC_BP).then(obs => {
                if (obs?.valueQuantity) container.querySelector('#grace-sbp').value = Math.round(obs.valueQuantity.value);
            });

            getMostRecentObservation(client, LOINC_CODES.CREATININE).then(obs => {
                if (obs?.valueQuantity) {
                    let val = obs.valueQuantity.value;
                    const unit = obs.valueQuantity.unit || 'mg/dL';
                    // We let UI Builder / UnitConverter handle the logic if we set the RAW value and dispatch change, 
                    // provided the unitToggle logic is set up to receive the user's preference.
                    // But here we are setting the input value.
                    // If the input default unit is mg/dL, and obs is mmol/L, we must convert.
                    // Actually, UnitConverter.getStandardValue reads the toggle state.
                    // BUT setting .value programmatically... does NOT update the unit dropdown.
                    // So we must be careful.
                    // Robust way: convert to the *default unit* of the input (mg/dL) before setting.

                    if (UnitConverter.isUnit(unit, 'mmol/L') || unit === 'µmol/L' || unit === 'umol/L') {
                        // The file previously had custom logic: val = val / 88.4;
                        // Better use UnitConverter if available, or keep custom logic if simpler.
                        // UnitConverter has creatinine conversion? Check.
                        // Ideally: val = UnitConverter.convert(val, unit, 'mg/dL', 'creatinine');
                        val = val / 88.4; // Custom fallback if UnitConverter not full
                    }
                    container.querySelector('#grace-creatinine').value = val.toFixed(2);
                }
            });

            // Trigger calculation after a delay to allow async operations
            setTimeout(calculate, 1000);
        }
    }
};