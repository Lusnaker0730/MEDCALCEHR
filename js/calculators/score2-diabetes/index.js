import { getMostRecentObservation, calculateAge } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { createStalenessTracker } from '../../data-staleness.js';
import { uiBuilder } from '../../ui-builder.js';
import { displayError, logError } from '../../errorHandler.js';
const score2DiabetesData = {
    low: {
        male: { age: 0.0652, sbp: 0.0139, tchol: 0.2079, hdl: -0.4485, hba1c: 0.0211, egfr: -0.0076, smoking: 0.3838, s010: 0.9765, mean_x: 4.9664 },
        female: { age: 0.0768, sbp: 0.0152, tchol: 0.147, hdl: -0.5659, hba1c: 0.0232, egfr: -0.0084, smoking: 0.5422, s010: 0.9859, mean_x: 5.215 }
    },
    moderate: {
        male: { age: 0.0652, sbp: 0.0139, tchol: 0.2079, hdl: -0.4485, hba1c: 0.0211, egfr: -0.0076, smoking: 0.3838, s010: 0.9626, mean_x: 4.9664 },
        female: { age: 0.0768, sbp: 0.0152, tchol: 0.147, hdl: -0.5659, hba1c: 0.0232, egfr: -0.0084, smoking: 0.5422, s010: 0.9782, mean_x: 5.215 }
    },
    high: {
        male: { age: 0.0652, sbp: 0.0139, tchol: 0.2079, hdl: -0.4485, hba1c: 0.0211, egfr: -0.0076, smoking: 0.3838, s010: 0.9388, mean_x: 4.9664 },
        female: { age: 0.0768, sbp: 0.0152, tchol: 0.147, hdl: -0.5659, hba1c: 0.0232, egfr: -0.0084, smoking: 0.5422, s010: 0.9661, mean_x: 5.215 }
    },
    very_high: {
        male: { age: 0.0652, sbp: 0.0139, tchol: 0.2079, hdl: -0.4485, hba1c: 0.0211, egfr: -0.0076, smoking: 0.3838, s010: 0.9038, mean_x: 4.9664 },
        female: { age: 0.0768, sbp: 0.0152, tchol: 0.147, hdl: -0.5659, hba1c: 0.0232, egfr: -0.0084, smoking: 0.5422, s010: 0.9472, mean_x: 5.215 }
    }
};
export const score2Diabetes = {
    id: 'score2-diabetes',
    title: 'SCORE2-Diabetes Risk Score',
    description: 'Predicts 10-year CVD risk in patients with type 2 diabetes (age 40-69).',
    generateHTML: function () {
        return `
                <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
                    </div>
            ${uiBuilder.createAlert({
            type: 'info',
            message: '<strong>Instructions:</strong> Select risk region and enter patient details. Validated for European populations aged 40-69.'
        })}

            ${uiBuilder.createSection({
            title: 'Geographic Risk Region',
            icon: '🌍',
            content: uiBuilder.createRadioGroup({
                name: 'score2d-region',
                options: [
                    { value: 'low', label: 'Low Risk (e.g., France, Spain, Italy)' },
                    { value: 'moderate', label: 'Moderate Risk (e.g., Germany, UK)' },
                    { value: 'high', label: 'High Risk (e.g., Poland, Hungary)' },
                    { value: 'very_high', label: 'Very High Risk (e.g., Romania, Turkey)' }
                ]
            })
        })}

            ${uiBuilder.createSection({
            title: 'Demographics & History',
            icon: '👤',
            content: `
                    ${uiBuilder.createRadioGroup({
                name: 'score2d-sex',
                label: 'Gender',
                options: [
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' }
                ]
            })}
                    ${uiBuilder.createInput({ id: 'score2d-age', label: 'Age', unit: 'years', type: 'number', min: 40, max: 69 })}
                    ${uiBuilder.createRadioGroup({
                name: 'score2d-smoking',
                label: 'Smoking Status',
                options: [
                    { value: '0', label: 'Non-smoker', checked: true },
                    { value: '1', label: 'Current Smoker' }
                ]
            })}
                `
        })}

            ${uiBuilder.createSection({
            title: 'Clinical & Lab Values',
            icon: '🧪',
            content: `
                    ${uiBuilder.createInput({ id: 'score2d-sbp', label: 'Systolic BP', unit: 'mmHg', type: 'number' })}
                    ${uiBuilder.createInput({ id: 'score2d-tchol', label: 'Total Cholesterol', unit: 'mg/dL', type: 'number' })}
                    ${uiBuilder.createInput({ id: 'score2d-hdl', label: 'HDL Cholesterol', unit: 'mg/dL', type: 'number' })}
                    ${uiBuilder.createInput({ id: 'score2d-hba1c', label: 'HbA1c', unit: '%', type: 'number', step: 0.1 })}
                    ${uiBuilder.createInput({ id: 'score2d-egfr', label: 'eGFR', unit: 'mL/min', type: 'number' })}
                `
        })}
            
            <div id="score2d-error-container"></div>
            ${uiBuilder.createResultBox({ id: 'score2d-result', title: '10-Year CVD Risk' })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);
        // Initialize staleness tracker
        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);
        const calculate = () => {
            try {
                // Clear validation errors
                const errorContainer = container.querySelector('#score2d-error-container');
                if (errorContainer)
                    errorContainer.innerHTML = '';
                const regionInput = container.querySelector('input[name="score2d-region"]:checked');
                const region = regionInput?.value;
                const sexInput = container.querySelector('input[name="score2d-sex"]:checked');
                const sex = sexInput?.value;
                const ageInput = container.querySelector('#score2d-age');
                const age = parseFloat(ageInput.value);
                const smokingInput = container.querySelector('input[name="score2d-smoking"]:checked');
                const smoking = smokingInput ? parseInt(smokingInput.value) : 0;
                const sbpInput = container.querySelector('#score2d-sbp');
                const sbp = parseFloat(sbpInput.value);
                const tcholInput = container.querySelector('#score2d-tchol');
                const tchol = parseFloat(tcholInput.value);
                const hdlInput = container.querySelector('#score2d-hdl');
                const hdl = parseFloat(hdlInput.value);
                const hba1cInput = container.querySelector('#score2d-hba1c');
                const hba1c = parseFloat(hba1cInput.value);
                const egfrInput = container.querySelector('#score2d-egfr');
                const egfr = parseFloat(egfrInput.value);
                const resultBox = container.querySelector('#score2d-result');
                if (!region || !sex || isNaN(age) || isNaN(sbp) || isNaN(tchol) || isNaN(hdl) || isNaN(hba1c) || isNaN(egfr)) {
                    if (resultBox)
                        resultBox.classList.remove('show');
                    return;
                }
                if (age < 40 || age > 69) {
                    if (resultBox) {
                        const resultContent = resultBox.querySelector('.ui-result-content');
                        if (resultContent) {
                            resultContent.innerHTML = uiBuilder.createAlert({
                                type: 'warning',
                                message: 'Score valid only for ages 40-69.'
                            });
                        }
                        resultBox.classList.add('show');
                    }
                    return;
                }
                const coeffs = score2DiabetesData[region][sex];
                // Conversions
                const tchol_mmol = tchol / 38.67;
                const hdl_mmol = hdl / 38.67;
                const hba1c_mmol = hba1c * 10.93 - 23.5;
                const ind_x = coeffs.age * age +
                    coeffs.sbp * sbp +
                    coeffs.tchol * tchol_mmol +
                    coeffs.hdl * hdl_mmol +
                    coeffs.hba1c * hba1c_mmol +
                    coeffs.egfr * egfr +
                    coeffs.smoking * smoking;
                const risk = 100 * (1 - Math.pow(coeffs.s010, Math.exp(ind_x - coeffs.mean_x)));
                let riskCategory = '';
                let alertType = 'info';
                if (risk < 5) {
                    riskCategory = 'Low Risk';
                    alertType = 'success';
                }
                else if (risk < 10) {
                    riskCategory = 'Moderate Risk';
                    alertType = 'warning';
                }
                else if (risk < 20) {
                    riskCategory = 'High Risk';
                    alertType = 'danger';
                }
                else {
                    riskCategory = 'Very High Risk';
                    alertType = 'danger';
                }
                if (resultBox) {
                    const resultContent = resultBox.querySelector('.ui-result-content');
                    if (resultContent) {
                        resultContent.innerHTML = `
                        ${uiBuilder.createResultItem({
                            label: '10-Year CVD Risk',
                            value: risk.toFixed(1),
                            unit: '%',
                            interpretation: riskCategory,
                            alertClass: `ui-alert-${alertType}`
                        })}
                    `;
                    }
                    resultBox.classList.add('show');
                }
            }
            catch (error) {
                const errorContainer = container.querySelector('#score2d-error-container');
                if (errorContainer) {
                    displayError(errorContainer, error);
                }
                logError(error, { calculator: 'score2-diabetes', action: 'calculate' });
            }
        };
        container.addEventListener('change', (e) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
                calculate();
            }
        });
        container.addEventListener('input', (e) => {
            if (e.target instanceof HTMLInputElement) {
                calculate();
            }
        });
        const setRadioValue = (name, value) => {
            const radio = container.querySelector(`input[name="${name}"][value="${value}"]`);
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change'));
            }
        };
        // Auto-populate
        if (patient && patient.birthDate) {
            const ageInput = container.querySelector('#score2d-age');
            if (ageInput)
                ageInput.value = calculateAge(patient.birthDate).toString();
        }
        if (patient && patient.gender) {
            setRadioValue('score2d-sex', patient.gender);
        }
        if (client) {
            getMostRecentObservation(client, LOINC_CODES.SYSTOLIC_BP).then(obs => {
                if (obs?.valueQuantity) {
                    const sbpInput = container.querySelector('#score2d-sbp');
                    if (sbpInput)
                        sbpInput.value = obs.valueQuantity.value.toFixed(0);
                    stalenessTracker.trackObservation('#score2d-sbp', obs, LOINC_CODES.SYSTOLIC_BP, 'Systolic BP');
                }
                calculate();
            });
            getMostRecentObservation(client, LOINC_CODES.CHOLESTEROL_TOTAL).then(obs => {
                if (obs?.valueQuantity) {
                    const tcholInput = container.querySelector('#score2d-tchol');
                    if (tcholInput)
                        tcholInput.value = obs.valueQuantity.value.toFixed(0);
                    stalenessTracker.trackObservation('#score2d-tchol', obs, LOINC_CODES.CHOLESTEROL_TOTAL, 'Total Cholesterol');
                }
                calculate();
            });
            getMostRecentObservation(client, LOINC_CODES.HDL).then(obs => {
                if (obs?.valueQuantity) {
                    const hdlInput = container.querySelector('#score2d-hdl');
                    if (hdlInput)
                        hdlInput.value = obs.valueQuantity.value.toFixed(0);
                    stalenessTracker.trackObservation('#score2d-hdl', obs, LOINC_CODES.HDL, 'HDL Cholesterol');
                }
                calculate();
            });
            getMostRecentObservation(client, LOINC_CODES.HBA1C).then(obs => {
                if (obs?.valueQuantity) {
                    const hba1cInput = container.querySelector('#score2d-hba1c');
                    if (hba1cInput)
                        hba1cInput.value = obs.valueQuantity.value.toFixed(1);
                    stalenessTracker.trackObservation('#score2d-hba1c', obs, LOINC_CODES.HBA1C, 'HbA1c');
                }
                calculate();
            });
            getMostRecentObservation(client, LOINC_CODES.EGFR).then(obs => {
                if (obs?.valueQuantity) {
                    const egfrInput = container.querySelector('#score2d-egfr');
                    if (egfrInput)
                        egfrInput.value = obs.valueQuantity.value.toFixed(0);
                    stalenessTracker.trackObservation('#score2d-egfr', obs, LOINC_CODES.EGFR, 'eGFR');
                }
                calculate();
            });
        }
    }
};
