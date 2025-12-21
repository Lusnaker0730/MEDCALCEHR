import { getMostRecentObservation, calculateAge } from '../../utils.js';
import { createStalenessTracker } from '../../data-staleness.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { ValidationRules, validateCalculatorInput } from '../../validator.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';

interface CalculatorModule {
    id: string;
    title: string;
    description: string;
    generateHTML: () => string;
    initialize: (client: any, patient: any, container: HTMLElement) => void;
}

export const graceAcs: CalculatorModule = {
    id: 'grace-acs',
    title: 'GRACE ACS Risk Score',
    description: 'Estimates admission to 6 month mortality for patients with acute coronary syndrome.',
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
                        default: 'mg/dL' // Correction: ui-builder uses 'default', older code might have used 'defaultUnit'
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
    initialize: function (client: any, patient: any, container: HTMLElement) {
        uiBuilder.initializeComponents(container);

        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);

        const calculate = () => {
            try {
                // Clear validation errors
                const errorContainer = container.querySelector('#grace-error-container');
                if (errorContainer) errorContainer.innerHTML = '';

                // Get inputs using standard logic or standard values
                const ageInput = container.querySelector('#grace-age') as HTMLInputElement;
                const hrInput = container.querySelector('#grace-hr') as HTMLInputElement;
                const sbpInput = container.querySelector('#grace-sbp') as HTMLInputElement;
                const creatinineInput = container.querySelector('#grace-creatinine') as HTMLInputElement;

                if (!ageInput || !hrInput || !sbpInput || !creatinineInput) return;

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
                    creatinine: creatinine ?? undefined // Ensure it's not null for validation if expected
                };
                const schema = {
                    age: ValidationRules.age,
                    hr: ValidationRules.heartRate,
                    sbp: ValidationRules.bloodPressure.systolic,
                    creatinine: ValidationRules.creatinine
                };

                const validation = validateCalculatorInput(inputs, schema);

                if (!validation.isValid) {
                    // Check if meaningful input is present to show error
                    const hasInput = (age || hr || sbp || (creatinine !== null && !isNaN(creatinine)));
                    if (hasInput) {
                        // Only show if fields are non-empty but invalid
                        if (validation.errors.some(e => !e.includes('required'))) {
                            if (errorContainer) {
                                displayError(errorContainer as HTMLElement, new ValidationError(validation.errors[0], 'VALIDATION_ERROR'));
                            }
                        }
                    }
                    // Hide result until valid
                    const resultBox = container.querySelector('#grace-result');
                    if (resultBox) resultBox.classList.remove('show');
                    return;
                }

                // If fully valid, proceed
                const getRadioVal = (name: string): number => {
                    const el = container.querySelector(`input[name="${name}"]:checked`) as HTMLInputElement;
                    return el ? parseInt(el.value, 10) : 0;
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
                // Assuming validation passes, creatinine should be a number. Force cast or logical check.
                // But logic above might allow NaN/null if only age/hr/sbp provided? 
                // The calculator likely needs all inputs. 
                // If creatinine is still null/NaN here despite validation (if validation allowed optional), we default or return.
                // Given the logic, let's treat it as required.
                const validCreatinine = (typeof creatinine === 'number' && !isNaN(creatinine)) ? creatinine : 0;

                if (validCreatinine >= 0 && validCreatinine <= 0.39) crPoints = 1;
                else if (validCreatinine >= 0.4 && validCreatinine <= 0.79) crPoints = 4;
                else if (validCreatinine >= 0.8 && validCreatinine <= 1.19) crPoints = 7;
                else if (validCreatinine >= 1.2 && validCreatinine <= 1.59) crPoints = 10;
                else if (validCreatinine >= 1.6 && validCreatinine <= 1.99) crPoints = 13;
                else if (validCreatinine >= 2.0 && validCreatinine <= 3.99) crPoints = 21;
                else if (validCreatinine >= 4.0) crPoints = 28;

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
                if (resultBox) {
                    const resultContent = resultBox.querySelector('.ui-result-content');
                    if (resultContent) {
                        resultContent.innerHTML = `
                            ${uiBuilder.createResultItem({
                            label: 'Total GRACE Score',
                            value: totalScore.toString(),
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
                    }
                }
            } catch (error) {
                const errorContainer = container.querySelector('#grace-error-container');
                if (errorContainer) {
                    displayError(errorContainer as HTMLElement, error as Error);
                } else {
                    console.error(error);
                }
                logError(error as Error, { calculator: 'grace-acs', action: 'calculate' });
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
                const ageInput = container.querySelector('#grace-age') as HTMLInputElement;
                if (ageInput) ageInput.value = calculateAge(patient.birthDate).toString();
            }

            // Fetch Heart Rate - Try standalone, then Panel (sometimes HR is in BP panel or Vitals panel)
            const fetchHR = async () => {
                let hrValue: number | null = null;
                let hrObs: any = null;

                // 1. Try standalone
                try {
                    const obs = await getMostRecentObservation(client, LOINC_CODES.HEART_RATE);
                    if (obs?.valueQuantity) {
                        hrValue = Math.round(obs.valueQuantity.value!);
                        hrObs = obs;
                    }
                } catch (e) { console.error('Error fetching HR standalone', e); }

                // 2. If no value, try Panel (checking BP Panel as it often contains HR in some implementations)
                if (hrValue === null) {
                    try {
                        const panel = await getMostRecentObservation(client, LOINC_CODES.BP_PANEL); // Or Vitals Panel if we had a code for it readily available
                        if (panel?.component) {
                            const hrComp = panel.component.find((c: any) =>
                                c.code.coding && c.code.coding.some((coding: any) => coding.code === LOINC_CODES.HEART_RATE)
                            );
                            if (hrComp?.valueQuantity) {
                                hrValue = Math.round(hrComp.valueQuantity.value!);
                                hrObs = panel;
                            }
                        }
                    } catch (e) { console.error('Error fetching HR from Panel', e); }
                }

                if (hrValue !== null) {
                    const hrInput = container.querySelector('#grace-hr') as HTMLInputElement;
                    if (hrInput) {
                        hrInput.value = hrValue.toString();
                        stalenessTracker.trackObservation('#grace-hr', hrObs, LOINC_CODES.HEART_RATE, 'Heart Rate');
                    }
                }
            };

            fetchHR();

            // Fetch Systolic BP - Try standalone first, then Panel
            const fetchSBP = async () => {
                let sbpValue: number | null = null;
                let sbpObs: any = null;

                // 1. Try standalone
                try {
                    const obs = await getMostRecentObservation(client, LOINC_CODES.SYSTOLIC_BP);
                    if (obs?.valueQuantity) {
                        sbpValue = Math.round(obs.valueQuantity.value!);
                        sbpObs = obs;
                    }
                } catch (e) { console.error('Error fetching SBP standalone', e); }

                // 2. If no value, try BP Panel
                if (sbpValue === null) {
                    try {
                        const panel = await getMostRecentObservation(client, LOINC_CODES.BP_PANEL);
                        if (panel?.component) {
                            const sbpComp = panel.component.find((c: any) =>
                                c.code.coding && c.code.coding.some((coding: any) => coding.code === LOINC_CODES.SYSTOLIC_BP)
                            );
                            if (sbpComp?.valueQuantity) {
                                sbpValue = Math.round(sbpComp.valueQuantity.value!);
                                sbpObs = panel; // Track the panel as the source
                            }
                        }
                    } catch (e) { console.error('Error fetching BP Panel', e); }
                }

                // Update UI
                if (sbpValue !== null) {
                    const sbpInput = container.querySelector('#grace-sbp') as HTMLInputElement;
                    if (sbpInput) {
                        sbpInput.value = sbpValue.toString();
                        // Trigger input event to update valid state if needed, though calculate runs later
                        stalenessTracker.trackObservation('#grace-sbp', sbpObs, LOINC_CODES.SYSTOLIC_BP, 'Systolic BP');
                    }
                }
            };

            fetchSBP();

            getMostRecentObservation(client, LOINC_CODES.CREATININE).then(obs => {
                if (obs?.valueQuantity) {
                    let val = obs.valueQuantity.value!;
                    const unit = obs.valueQuantity.unit || 'mg/dL';

                    if (unit === 'mmol/L' || unit === 'µmol/L' || unit === 'umol/L') {
                        val = val / 88.4;
                    }
                    const crInput = container.querySelector('#grace-creatinine') as HTMLInputElement;
                    if (crInput) {
                        crInput.value = val.toFixed(2);
                        stalenessTracker.trackObservation('#grace-creatinine', obs, LOINC_CODES.CREATININE, 'Creatinine');
                    }
                }
            });

            // Trigger calculation after a delay
            setTimeout(calculate, 1000);
        }
    }
};
