import {
    getMostRecentObservation,
    calculateAge
} from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { ValidationRules, validateCalculatorInput } from '../../validator.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';

export const ascvd = {
    id: 'ascvd',
    title: 'ASCVD Risk Calculator with Therapy Impact',
    description:
        'Determines 10-year risk of hard ASCVD and calculates the impact of various therapies on risk reduction.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            ${uiBuilder.createAlert({
            type: 'warning',
            message: uiBuilder.createCheckbox({
                id: 'known-ascvd',
                label: '<strong>Known Clinical ASCVD?</strong> (e.g., history of MI, stroke, PAD)'
            })
        })}
            
            <div id="ascvd-risk-inputs">
                ${uiBuilder.createSection({
            title: 'Demographics',
            content: `
                        ${uiBuilder.createInput({ id: 'ascvd-age', label: 'Age', unit: 'years (40-79)', type: 'number', placeholder: 'e.g., 55' })}
                        ${uiBuilder.createRadioGroup({
                name: 'ascvd-gender',
                label: 'Gender',
                options: [
                    { value: 'male', label: 'Male', checked: true },
                    { value: 'female', label: 'Female' }
                ]
            })}
                        ${uiBuilder.createRadioGroup({
                name: 'ascvd-race',
                label: 'Race',
                options: [
                    { value: 'white', label: 'White', checked: true },
                    { value: 'aa', label: 'African American' },
                    { value: 'other', label: 'Other' }
                ]
            })}
                    `
        })}
                
                ${uiBuilder.createSection({
            title: 'Lab Values',
            content: `
                        ${uiBuilder.createInput({
                id: 'ascvd-tc',
                label: 'Total Cholesterol',
                type: 'number',
                placeholder: 'e.g., 200',
                unitToggle: { type: 'totalCholesterol', units: ['mg/dL', 'mmol/L'], defaultUnit: 'mg/dL' }
            })}
                        ${uiBuilder.createInput({
                id: 'ascvd-hdl',
                label: 'HDL Cholesterol',
                type: 'number',
                placeholder: 'e.g., 50',
                unitToggle: { type: 'hdl', units: ['mg/dL', 'mmol/L'], defaultUnit: 'mg/dL' }
            })}
                        ${uiBuilder.createInput({ id: 'ascvd-sbp', label: 'Systolic BP', unit: 'mmHg', type: 'number', placeholder: 'e.g., 130' })}
                    `
        })}
                
                ${uiBuilder.createSection({
            title: 'Risk Factors',
            content: `
                        ${uiBuilder.createRadioGroup({
                name: 'ascvd-htn',
                label: 'On Hypertension Treatment?',
                options: [
                    { value: 'no', label: 'No', checked: true },
                    { value: 'yes', label: 'Yes' }
                ]
            })}
                        ${uiBuilder.createRadioGroup({
                name: 'ascvd-dm',
                label: 'Diabetes?',
                options: [
                    { value: 'no', label: 'No', checked: true },
                    { value: 'yes', label: 'Yes' }
                ]
            })}
                        ${uiBuilder.createRadioGroup({
                name: 'ascvd-smoker',
                label: 'Current Smoker?',
                options: [
                    { value: 'no', label: 'No', checked: true },
                    { value: 'yes', label: 'Yes' }
                ]
            })}
                    `
        })}
            </div>
            
            ${uiBuilder.createResultBox({ id: 'ascvd-result', title: 'ASCVD Risk Results' })}
            
            <!-- Therapy Impact Section -->
            <div id="therapy-impact-section" style="display:none; margin-top: 20px;">
                ${uiBuilder.createSection({
            title: '🎯 Therapy Impact Analysis',
            content: `
                        <h5>Select Therapy Options:</h5>
                        
                        <div class="therapy-group" style="margin-bottom: 15px;">
                            ${uiBuilder.createCheckbox({ id: 'statin-therapy', label: 'Statin Therapy', checked: true })}
                            <div class="therapy-details" id="statin-details" style="margin-left: 25px;">
                                ${uiBuilder.createSelect({
                id: 'statin-intensity',
                label: 'Intensity',
                options: [
                    { value: 'moderate', label: 'Moderate-Intensity Statin (30-50% LDL reduction)' },
                    { value: 'high', label: 'High-Intensity Statin (≥50% LDL reduction)' },
                    { value: 'low', label: 'Low-Intensity Statin (<30% LDL reduction)' }
                ]
            })}
                            </div>
                        </div>
                        
                        <div class="therapy-group" style="margin-bottom: 15px;">
                            ${uiBuilder.createCheckbox({ id: 'lifestyle-mods', label: 'Lifestyle Modifications' })}
                            <div class="therapy-details" id="lifestyle-details" style="display:none; margin-left: 25px;">
                                ${uiBuilder.createCheckbox({ id: 'smoking-cessation', label: 'Smoking Cessation' })}
                                ${uiBuilder.createCheckbox({ id: 'bp-control', label: 'BP Control (target <130/80)' })}
                                ${uiBuilder.createCheckbox({ id: 'weight-loss', label: 'Weight Loss (if BMI ≥25)' })}
                            </div>
                        </div>
                        
                        <div class="therapy-group" style="margin-bottom: 15px;">
                            ${uiBuilder.createCheckbox({ id: 'additional-therapy', label: 'Additional Therapies' })}
                            <div class="therapy-details" id="additional-details" style="display:none; margin-left: 25px;">
                                ${uiBuilder.createSelect({
                id: 'additional-options',
                label: 'Option',
                options: [
                    { value: 'ezetimibe', label: 'Ezetimibe (additional 15-20% LDL reduction)' },
                    { value: 'pcsk9', label: 'PCSK9 Inhibitor (additional 50-60% LDL reduction)' },
                    { value: 'aspirin', label: 'Low-dose Aspirin (if bleeding risk low)' }
                ]
            })}
                            </div>
                        </div>
                        
                        <button id="calculate-therapy-impact" class="ui-btn" style="margin-top: 15px; width: 100%;">Calculate Therapy Impact</button>
                        
                        <div id="therapy-results" class="therapy-results" style="display:none; margin-top: 20px;"></div>
                    `
        })}
            </div>

            <!-- Formula Section -->
            ${uiBuilder.createSection({
            title: '📐 Pooled Cohort Equations (PCE) Formulas',
            content: `
                    <p style="font-size: 0.9em; color: #666; margin-bottom: 15px;">The 10-year ASCVD risk is calculated using the following equation for each population group:</p>
                    
                    <div style="background: #f5f7fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                        <h5 style="margin-top: 0; color: #333;">General Formula:</h5>
                        <p style="font-family: monospace; background: white; padding: 15px; border-radius: 5px; overflow-x: auto;">
                            Risk = (1 - S<sub>0</sub><sup>exp(Σ - mean)</sup>) × 100%
                        </p>
                    </div>
                    
                    ${uiBuilder.createAlert({
                type: 'info',
                message: 'Valid for ages 40-79 years. Uses 2013 ACC/AHA Pooled Cohort Equations.'
            })}
                `
        })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const ageInput = container.querySelector('#ascvd-age');
        const sbpInput = container.querySelector('#ascvd-sbp');
        const tcInput = container.querySelector('#ascvd-tc');
        const hdlInput = container.querySelector('#ascvd-hdl');
        const knownAscvdCheckbox = container.querySelector('#known-ascvd');
        const riskInputsDiv = container.querySelector('#ascvd-risk-inputs');
        const resultBox = container.querySelector('#ascvd-result');
        const resultContent = resultBox.querySelector('.ui-result-content');
        const therapySection = container.querySelector('#therapy-impact-section');

        if (patient && patient.birthDate) {
            ageInput.value = calculateAge(patient.birthDate);
        }
        if (patient && patient.gender) {
            const genderValue = patient.gender.toLowerCase() === 'female' ? 'female' : 'male';
            const genderRadio = container.querySelector(`input[name="ascvd-gender"][value="${genderValue}"]`);
            if (genderRadio) {
                genderRadio.checked = true;
            }
        }

        // Try to load FHIR data
        if (client) {
            getMostRecentObservation(client, LOINC_CODES.BP_PANEL).then(bpPanel => {
                if (bpPanel && bpPanel.component) {
                    const sbpComp = bpPanel.component.find(c => c.code.coding[0].code === LOINC_CODES.SYSTOLIC_BP);
                    if (sbpComp && sbpComp.valueQuantity) {
                        sbpInput.value = sbpComp.valueQuantity.value.toFixed(0);
                    }
                }
            }).catch(console.log);

            getMostRecentObservation(client, LOINC_CODES.CHOLESTEROL_TOTAL).then(obs => {
                if (obs && obs.valueQuantity) {
                    UnitConverter.setInputValue(tcInput, obs.valueQuantity.value, obs.valueQuantity.unit);
                }
            }).catch(console.log);

            getMostRecentObservation(client, LOINC_CODES.HDL).then(obs => {
                if (obs && obs.valueQuantity) {
                    UnitConverter.setInputValue(hdlInput, obs.valueQuantity.value, obs.valueQuantity.unit);
                }
            }).catch(console.log);
        }

        knownAscvdCheckbox.addEventListener('change', () => {
            riskInputsDiv.style.display = knownAscvdCheckbox.checked ? 'none' : 'block';
            calculate(); // Recalculate immediately
        });

        // Therapy option toggle handlers
        container.querySelector('#statin-therapy').addEventListener('change', function () {
            container.querySelector('#statin-details').style.display = this.checked ? 'block' : 'none';
        });

        container.querySelector('#lifestyle-mods').addEventListener('change', function () {
            container.querySelector('#lifestyle-details').style.display = this.checked ? 'block' : 'none';
        });

        container.querySelector('#additional-therapy').addEventListener('change', function () {
            container.querySelector('#additional-details').style.display = this.checked ? 'block' : 'none';
        });

        let baselineRisk = 0;
        let patientData = {};

        const calculateRisk = patient => {
            const lnAge = Math.log(patient.age);
            const lnTC = Math.log(patient.tc);
            const lnHDL = Math.log(patient.hdl);
            const lnSBP = Math.log(patient.sbp);

            let individualSum = 0;
            let baselineSurvival = 0;
            let meanValue = 0;

            if (patient.isMale) {
                if (patient.race === 'white') {
                    individualSum = 12.344 * lnAge + 11.853 * lnTC - 2.664 * lnAge * lnTC - 7.99 * lnHDL + 1.769 * lnAge * lnHDL + (patient.onHtnTx ? 1.797 : 1.764) * lnSBP + 7.837 * (patient.isSmoker ? 1 : 0) - 1.795 * lnAge * (patient.isSmoker ? 1 : 0) + 0.658 * (patient.isDiabetic ? 1 : 0);
                    meanValue = 61.18;
                    baselineSurvival = 0.9144;
                } else { // African American Male
                    individualSum = 2.469 * lnAge + 0.302 * lnTC - 0.307 * lnHDL + (patient.onHtnTx ? 1.916 : 1.809) * lnSBP + 0.549 * (patient.isSmoker ? 1 : 0) + 0.645 * (patient.isDiabetic ? 1 : 0);
                    meanValue = 19.54;
                    baselineSurvival = 0.8954;
                }
            } else { // Female
                if (patient.race === 'white') {
                    individualSum = -29.799 * lnAge + 4.884 * lnAge * lnAge + 13.54 * lnTC - 3.114 * lnAge * lnTC - 13.578 * lnHDL + 3.149 * lnAge * lnHDL + (patient.onHtnTx ? 2.019 * lnSBP : 1.957 * lnSBP) + 7.574 * (patient.isSmoker ? 1 : 0) - 1.665 * lnAge * (patient.isSmoker ? 1 : 0) + 0.661 * (patient.isDiabetic ? 1 : 0);
                    meanValue = -29.18;
                    baselineSurvival = 0.9665;
                } else { // African American Female
                    individualSum = 17.114 * lnAge + 0.94 * lnTC - 18.92 * lnHDL + 4.475 * lnAge * lnHDL + (patient.onHtnTx ? 29.291 : 27.82) * lnSBP - 6.432 * lnAge * lnSBP + 0.691 * (patient.isSmoker ? 1 : 0) + 0.874 * (patient.isDiabetic ? 1 : 0);
                    meanValue = 86.61;
                    baselineSurvival = 0.9533;
                }
            }
            const risk = (1 - Math.pow(baselineSurvival, Math.exp(individualSum - meanValue))) * 100;
            return Math.max(0, Math.min(100, risk));
        };

        const calculate = () => {
            // Clear previous errors
            const existingError = container.querySelector('#ascvd-error');
            if (existingError) existingError.remove();

            if (knownAscvdCheckbox.checked) {
                // Known ASCVD Logic (Simplified)
                patientData = {
                    age: parseFloat(ageInput.value) || 60, // Dummy for therapy calc mainly
                    tc: 200, // Dummy
                    hdl: 50, // Dummy
                    sbp: 130 // Dummy
                };
                // Capture other flags if they exist, but mostly we just set High Risk
                baselineRisk = 50;

                resultContent.innerHTML = `
                    ${uiBuilder.createResultItem({ label: 'Risk Category', value: 'High Risk', interpretation: 'Known Clinical ASCVD', alertClass: 'ui-alert-danger' })}
                    ${uiBuilder.createAlert({ type: 'warning', message: '<strong>Guideline:</strong> High-intensity statin therapy is indicated for secondary prevention.' })}
                `;
                resultBox.classList.add('show');
                therapySection.style.display = 'block';
                return;
            }

            const raceRadio = container.querySelector('input[name="ascvd-race"]:checked');
            const race = raceRadio ? raceRadio.value : 'white';

            const age = parseFloat(ageInput.value);
            const sbp = parseFloat(sbpInput.value);
            // Use UnitConverter for Cholesterol
            const tcMgDl = UnitConverter.getStandardValue(tcInput, 'mg/dL');
            const hdlMgDl = UnitConverter.getStandardValue(hdlInput, 'mg/dL');

            // Validation Schema
            const values = { age, systolic: sbp, totalCholesterol: tcMgDl, hdl: hdlMgDl };
            const schema = {
                age: ValidationRules.age,
                systolic: ValidationRules.bloodPressure.systolic,
                totalCholesterol: ValidationRules.totalCholesterol,
                hdl: ValidationRules.hdl
            };

            const validation = validateCalculatorInput(values, schema);

            if (!validation.isValid) {
                const hasInput = (ageInput.value || sbpInput.value || tcInput.value || hdlInput.value);
                if (hasInput) {
                    // Check if present values are invalid
                    const valsPresent = !isNaN(age) && !isNaN(sbp) && !isNaN(tcMgDl) && !isNaN(hdlMgDl);
                    if (valsPresent || validation.errors.some(e => !e.includes('required'))) {
                        // Show error
                        let errorContainer = document.createElement('div');
                        errorContainer.id = 'ascvd-error';
                        resultBox.parentNode.insertBefore(errorContainer, resultBox);
                        displayError(errorContainer, new ValidationError(validation.errors[0], 'VALIDATION_ERROR'));
                    }
                }
                resultBox.classList.remove('show');
                therapySection.style.display = 'none';
                return;
            }

            // Specific Age Range for ASCVD (override generic Age rule if strictly enforced by guideline, 
            // but generic validation is 0-150. We can add specific alert for <40 or >79)
            if (age < 40 || age > 79) {
                resultContent.innerHTML = uiBuilder.createAlert({
                    type: 'warning',
                    message: `<strong>Age Limitation:</strong> Valid for ages 40-79. Current age: ${age}.<br>${age < 40 ? 'Focus on lifestyle modifications.' : 'Clinical judgment should guide treatment.'}`
                });
                resultBox.classList.add('show');
                therapySection.style.display = 'none';
                return; // Stop calculation? Usually yes for PCE.
            }

            const genderRadio = container.querySelector('input[name="ascvd-gender"]:checked');
            const htnRadio = container.querySelector('input[name="ascvd-htn"]:checked');
            const dmRadio = container.querySelector('input[name="ascvd-dm"]:checked');
            const smokerRadio = container.querySelector('input[name="ascvd-smoker"]:checked');

            patientData = {
                age,
                tc: tcMgDl,
                hdl: hdlMgDl,
                sbp,
                isMale: genderRadio ? genderRadio.value === 'male' : true,
                race,
                onHtnTx: htnRadio ? htnRadio.value === 'yes' : false,
                isDiabetic: dmRadio ? dmRadio.value === 'yes' : false,
                isSmoker: smokerRadio ? smokerRadio.value === 'yes' : false
            };

            const riskPercent = calculateRisk(patientData);
            baselineRisk = riskPercent;

            let riskCategory = '';
            let recommendation = '';
            let alertType = 'info';

            if (riskPercent < 5) {
                riskCategory = 'Low Risk';
                recommendation = 'Emphasize lifestyle modifications.';
                alertType = 'success';
            } else if (riskPercent < 7.5) {
                riskCategory = 'Borderline Risk';
                recommendation = 'Discuss risk. Consider moderate-intensity statin if risk enhancers present.';
                alertType = 'warning';
            } else if (riskPercent < 20) {
                riskCategory = 'Intermediate Risk';
                recommendation = 'Initiate moderate-intensity statin therapy. Discuss risk enhancers.';
                alertType = 'warning';
            } else {
                riskCategory = 'High Risk';
                recommendation = 'Initiate high-intensity statin therapy.';
                alertType = 'danger';
            }

            let otherRaceAlert = '';
            if (race === 'other') {
                otherRaceAlert = uiBuilder.createAlert({ type: 'warning', message: 'The Pooled Cohort Equations are validated for non-Hispanic white and African American individuals. Risk for other groups may be over- or underestimated.' });
            }

            resultContent.innerHTML = `
                ${otherRaceAlert}
                ${uiBuilder.createResultItem({
                label: '10-Year ASCVD Risk',
                value: riskPercent.toFixed(1),
                unit: '%',
                interpretation: riskCategory,
                alertClass: `ui-alert-${alertType}`
            })}
                ${uiBuilder.createAlert({
                type: alertType,
                message: `<strong>Recommendation:</strong> ${recommendation}`
            })}
            `;
            resultBox.classList.add('show');
            therapySection.style.display = 'block';
        };

        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculate);
            input.addEventListener('change', calculate);
        });
        // Prevent therapy section inputs from triggering main calculate (which resets therapy results)
        container.querySelectorAll('#therapy-impact-section input, #therapy-impact-section select').forEach(el => {
            el.removeEventListener('input', calculate);
            el.removeEventListener('change', calculate);
            // Re-add if it was part of main inputs (unlikely given selectors)
        });


        // Therapy Impact Calculation
        container.querySelector('#calculate-therapy-impact').addEventListener('click', () => {
            const therapyResultsEl = container.querySelector('#therapy-results');

            if (baselineRisk === 0 && !knownAscvdCheckbox.checked) {
                therapyResultsEl.innerHTML = uiBuilder.createAlert({ type: 'danger', message: 'Please calculate baseline risk first.' });
                therapyResultsEl.style.display = 'block';
                return;
            }

            const modifiedPatientData = { ...patientData };
            const interventions = [];

            // Statin
            if (container.querySelector('#statin-therapy').checked) {
                const intensity = container.querySelector('#statin-intensity').value;
                let ldlReduction = 0;
                let statinDescription = '';

                if (intensity === 'high') { ldlReduction = 0.5; statinDescription = 'High-intensity statin'; }
                else if (intensity === 'moderate') { ldlReduction = 0.4; statinDescription = 'Moderate-intensity statin'; }
                else { ldlReduction = 0.25; statinDescription = 'Low-intensity statin'; }

                const estimatedTrig = 150;
                const baselineLDL = modifiedPatientData.tc - modifiedPatientData.hdl - estimatedTrig / 5;
                const treatedLDL = baselineLDL * (1 - ldlReduction);
                modifiedPatientData.tc = treatedLDL + modifiedPatientData.hdl + estimatedTrig / 5;
                interventions.push(statinDescription);
            }

            // Lifestyle
            if (container.querySelector('#lifestyle-mods').checked) {
                if (container.querySelector('#smoking-cessation').checked && modifiedPatientData.isSmoker) {
                    modifiedPatientData.isSmoker = false;
                    interventions.push('Smoking cessation');
                }
                if (container.querySelector('#bp-control').checked && modifiedPatientData.sbp > 130) {
                    modifiedPatientData.sbp = 130;
                    modifiedPatientData.onHtnTx = true;
                    interventions.push('Blood pressure control');
                }
            }

            if (container.querySelector('#additional-therapy').checked) {
                const select = container.querySelector('#additional-options');
                interventions.push(select.options[select.selectedIndex].text);
            }

            const modifiedRisk = calculateRisk(modifiedPatientData);
            const arr = Math.max(0, baselineRisk - modifiedRisk);
            const nnt = arr > 0 ? Math.round(100 / arr) : 'N/A';

            therapyResultsEl.innerHTML = `
                ${uiBuilder.createResultItem({
                label: 'Baseline Risk',
                value: baselineRisk.toFixed(1),
                unit: '%'
            })}
                ${uiBuilder.createResultItem({
                label: 'Treated Risk',
                value: modifiedRisk.toFixed(1),
                unit: '%',
                alertClass: 'ui-alert-success'
            })}
                ${uiBuilder.createResultItem({
                label: 'Absolute Risk Reduction (ARR)',
                value: arr.toFixed(1),
                unit: '%'
            })}
                ${uiBuilder.createResultItem({
                label: 'Number Needed to Treat (NNT)',
                value: nnt
            })}
                ${uiBuilder.createSection({
                title: 'Selected Interventions',
                content: `<ul>${interventions.map(i => `<li>${i}</li>`).join('')}</ul>`
            })}
            `;
            therapyResultsEl.style.display = 'block';
        });

        calculate();
    }
};
