import { getPatient, getPatientConditions, getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { createStalenessTracker } from '../../data-staleness.js';
import { uiBuilder } from '../../ui-builder.js';
import { displayError, logError } from '../../errorHandler.js';
export const stopBang = {
    id: 'stop-bang',
    title: 'STOP-BANG Score for Obstructive Sleep Apnea',
    description: 'Screens for obstructive sleep apnea using validated clinical criteria.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            ${uiBuilder.createAlert({
            type: 'info',
            message: 'Check all conditions that apply to the patient.'
        })}
            ${uiBuilder.createSection({
            title: 'STOP-BANG Criteria',
            content: `
                    ${uiBuilder.createCheckbox({
                id: 'sb-snoring',
                label: 'Snoring',
                description: 'Do you snore loudly? (Louder than talking or loud enough to be heard through closed doors)'
            })}
                    ${uiBuilder.createCheckbox({
                id: 'sb-tired',
                label: 'Tired',
                description: 'Do you often feel tired, fatigued, or sleepy during daytime?'
            })}
                    ${uiBuilder.createCheckbox({
                id: 'sb-observed',
                label: 'Observed',
                description: 'Has anyone observed you stop breathing during your sleep?'
            })}
                    ${uiBuilder.createCheckbox({
                id: 'sb-pressure',
                label: 'Pressure',
                description: 'Do you have or are you being treated for high blood pressure?'
            })}
                    ${uiBuilder.createCheckbox({
                id: 'sb-bmi',
                label: 'BMI',
                description: 'BMI more than 35 kg/m²'
            })}
                    ${uiBuilder.createCheckbox({
                id: 'sb-age',
                label: 'Age',
                description: 'Age over 50 years old'
            })}
                    ${uiBuilder.createCheckbox({
                id: 'sb-neck',
                label: 'Neck Circumference',
                description: 'Neck circumference greater than 40 cm'
            })}
                    ${uiBuilder.createCheckbox({
                id: 'sb-gender',
                label: 'Gender',
                description: 'Male gender'
            })}
                `
        })}
            
            <div id="stop-bang-error-container"></div>
            ${uiBuilder.createResultBox({ id: 'stop-bang-result', title: 'Risk Assessment' })}
            
            ${uiBuilder.createAlert({
            type: 'info',
            message: `
                    <h4>Risk Categories</h4>
                    <ul>
                        <li><strong>Low Risk (0-2):</strong> Low probability of moderate to severe OSA</li>
                        <li><strong>Intermediate Risk (3-4):</strong> Intermediate probability of moderate to severe OSA</li>
                        <li><strong>High Risk (5-8):</strong> High probability of moderate to severe OSA</li>
                    </ul>
                `
        })}
        `;
    },
    initialize: function (client, _patient, container) {
        uiBuilder.initializeComponents(container);
        // Initialize staleness tracker
        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);
        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        const resultBox = container.querySelector('#stop-bang-result');
        const calculate = () => {
            // Clear previous errors
            const errorContainer = container.querySelector('#stop-bang-error-container');
            if (errorContainer)
                errorContainer.innerHTML = '';
            try {
                let score = 0;
                checkboxes.forEach(box => {
                    if (box.checked)
                        score++;
                });
                let riskLevel = '';
                let riskDescription = '';
                let alertType = 'info';
                if (score <= 2) {
                    riskLevel = 'Low Risk';
                    riskDescription = 'Low probability of moderate to severe OSA';
                    alertType = 'success';
                }
                else if (score <= 4) {
                    riskLevel = 'Intermediate Risk';
                    riskDescription = 'Intermediate probability of moderate to severe OSA';
                    alertType = 'warning';
                }
                else {
                    riskLevel = 'High Risk';
                    riskDescription = 'High probability of moderate to severe OSA';
                    alertType = 'danger';
                }
                if (resultBox) {
                    const resultContent = resultBox.querySelector('.ui-result-content');
                    if (resultContent) {
                        resultContent.innerHTML = `
                        ${uiBuilder.createResultItem({
                            label: 'STOP-BANG Score',
                            value: score,
                            unit: '/ 8'
                        })}
                        ${uiBuilder.createAlert({
                            type: alertType,
                            message: `<strong>${riskLevel}</strong>: ${riskDescription}`
                        })}
                    `;
                    }
                    resultBox.classList.add('show');
                }
            }
            catch (error) {
                logError(error, { calculator: 'stop-bang', action: 'calculate' });
                if (errorContainer)
                    displayError(errorContainer, error);
            }
        };
        checkboxes.forEach(box => box.addEventListener('change', calculate));
        // Auto-populate patient data
        if (client) {
            getPatient(client).then(pt => {
                if (pt) {
                    const birthDate = new Date(pt.birthDate);
                    const today = new Date();
                    let age = today.getFullYear() - birthDate.getFullYear();
                    const m = today.getMonth() - birthDate.getMonth();
                    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                        age--;
                    }
                    if (age > 50) {
                        const ageCheckbox = container.querySelector('#sb-age');
                        if (ageCheckbox && !ageCheckbox.checked) {
                            ageCheckbox.checked = true;
                            // Trigger change event to update result
                            ageCheckbox.dispatchEvent(new Event('change'));
                        }
                    }
                    if (pt.gender && pt.gender.toLowerCase() === 'male') {
                        const genderCheckbox = container.querySelector('#sb-gender');
                        if (genderCheckbox && !genderCheckbox.checked) {
                            genderCheckbox.checked = true;
                            genderCheckbox.dispatchEvent(new Event('change'));
                        }
                    }
                }
            }).catch(e => console.warn(e));
            getMostRecentObservation(client, LOINC_CODES.BMI).then(obs => {
                if (obs && obs.valueQuantity && obs.valueQuantity.value > 35) {
                    const bmiCheckbox = container.querySelector('#sb-bmi');
                    if (bmiCheckbox && !bmiCheckbox.checked) {
                        bmiCheckbox.checked = true;
                        bmiCheckbox.dispatchEvent(new Event('change'));
                        stalenessTracker.trackObservation('#sb-bmi', obs, LOINC_CODES.BMI, 'BMI');
                    }
                }
            }).catch(e => console.warn(e));
            // Check for hypertension
            getPatientConditions(client, ['38341003']).then(conditions => {
                if (conditions.length > 0) {
                    const pressureCheckbox = container.querySelector('#sb-pressure');
                    if (pressureCheckbox && !pressureCheckbox.checked) {
                        pressureCheckbox.checked = true;
                        pressureCheckbox.dispatchEvent(new Event('change'));
                    }
                }
            }).catch(e => console.warn(e));
        }
        calculate();
    }
};
