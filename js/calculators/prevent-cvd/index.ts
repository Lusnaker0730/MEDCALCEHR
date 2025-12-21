import { getMostRecentObservation, calculateAge } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { createStalenessTracker } from '../../data-staleness.js';
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

interface Coeffs {
    age: number;
    chol: number;
    hdl: number;
    sbp: number;
    smoker: number;
    diabetes: number;
    egfr: number;
    bpad: number;
    fhcvd: number;
    ckd: number;
    rheum: number;
    constant: number;
    meanD: number;
}

interface RiskPredictor {
    male: Coeffs;
    female: Coeffs;
    [key: string]: Coeffs;
}

export const preventCVD: CalculatorModule = {
    id: 'prevent-cvd',
    title: 'QRISK3-Based CVD Risk (UK)',
    description: 'Predicts 10-year risk of cardiovascular disease in patients aged 25-84 without known CVD.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            ${uiBuilder.createAlert({
            type: 'info',
            message: '<strong>Instructions:</strong> Valid for ages 25-84. Not applicable to patients with established CVD. Cholesterol values use mmol/L by default (UK standard).'
        })}

            ${uiBuilder.createSection({
            title: 'Patient Characteristics',
            icon: '👤',
            content: `
                    ${uiBuilder.createInput({ id: 'qrisk-age', label: 'Age', unit: 'years', type: 'number', min: 25, max: 84 })}
                    ${uiBuilder.createSelect({
                id: 'qrisk-gender',
                label: 'Gender',
                options: [
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' }
                ]
            })}
                    ${uiBuilder.createCheckbox({ id: 'qrisk-smoker', label: 'Current Smoker' })}
                    ${uiBuilder.createCheckbox({ id: 'qrisk-diabetes', label: 'Diabetes' })}
                    ${uiBuilder.createCheckbox({ id: 'qrisk-bpad', label: 'On Blood Pressure Treatment' })}
                    ${uiBuilder.createCheckbox({ id: 'qrisk-fhcvd', label: 'Family History of CVD (in 1st degree relative <60)' })}
                    ${uiBuilder.createCheckbox({ id: 'qrisk-chronic', label: 'Chronic Kidney Disease (Stage 3, 4 or 5)' })}
                    ${uiBuilder.createCheckbox({ id: 'qrisk-rheum', label: 'Rheumatoid Arthritis' })}
                `
        })}

            ${uiBuilder.createSection({
            title: 'Clinical Measurements',
            icon: '🩺',
            content: `
                    ${uiBuilder.createInput({ id: 'qrisk-sbp', label: 'Systolic BP', unit: 'mmHg', type: 'number' })}
                    ${uiBuilder.createInput({
                id: 'qrisk-cholesterol',
                label: 'Total Cholesterol',
                type: 'number',
                step: 0.1,
                unit: 'mmol/L',
                unitToggle: {
                    type: 'cholesterol',
                    units: ['mmol/L', 'mg/dL'],
                    default: 'mmol/L'
                }
            })}
                    ${uiBuilder.createInput({
                id: 'qrisk-hdl',
                label: 'HDL Cholesterol',
                type: 'number',
                step: 0.1,
                unit: 'mmol/L',
                unitToggle: {
                    type: 'cholesterol',
                    units: ['mmol/L', 'mg/dL'],
                    default: 'mmol/L'
                }
            })}
                    ${uiBuilder.createInput({ id: 'qrisk-egfr', label: 'eGFR', unit: 'mL/min/1.73m²', type: 'number' })}
                `
        })}
            
            <div id="prevent-cvd-error-container"></div>
            ${uiBuilder.createResultBox({ id: 'qrisk-result', title: 'QRISK3 10-Year Risk' })}

            ${uiBuilder.createFormulaSection({
            items: [
                {
                    label: 'QRISK3 Calculation',
                    formula: 'Risk = 100 × (1 - S(t)^exp(index))',
                    notes: 'Uses gender-specific coefficients and baseline survival S(t). Index = Σ(Coefficients × Values) - Mean.'
                }
            ]
        })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        // Initialize staleness tracker
        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);

        const ageInput = container.querySelector('#qrisk-age') as HTMLInputElement;
        const genderSelect = container.querySelector('#qrisk-gender') as HTMLSelectElement;
        const sbpInput = container.querySelector('#qrisk-sbp') as HTMLInputElement;
        const cholInput = container.querySelector('#qrisk-cholesterol') as HTMLInputElement;
        const hdlInput = container.querySelector('#qrisk-hdl') as HTMLInputElement;
        const egfrInput = container.querySelector('#qrisk-egfr') as HTMLInputElement;
        const resultBox = container.querySelector('#qrisk-result');

        const calculate = () => {
            try {
                // Clear validation errors
                const errorContainer = container.querySelector('#prevent-cvd-error-container');
                if (errorContainer) errorContainer.innerHTML = '';

                const age = parseFloat(ageInput.value);
                const gender = genderSelect.value;
                const sbp = parseFloat(sbpInput.value);
                const chol = UnitConverter.getStandardValue(cholInput, 'mmol/L');
                const hdl = UnitConverter.getStandardValue(hdlInput, 'mmol/L');
                const egfr = parseFloat(egfrInput.value);

                const smoker = (container.querySelector('#qrisk-smoker') as HTMLInputElement).checked ? 1 : 0;
                const diabetes = (container.querySelector('#qrisk-diabetes') as HTMLInputElement).checked ? 1 : 0;
                const bpad = (container.querySelector('#qrisk-bpad') as HTMLInputElement).checked ? 1 : 0;
                const fhcvd = (container.querySelector('#qrisk-fhcvd') as HTMLInputElement).checked ? 1 : 0;
                const ckd = (container.querySelector('#qrisk-chronic') as HTMLInputElement).checked ? 1 : 0;
                const rheum = (container.querySelector('#qrisk-rheum') as HTMLInputElement).checked ? 1 : 0;

                if (isNaN(age) || isNaN(sbp) || chol === null || hdl === null || isNaN(egfr)) {
                    if (resultBox) resultBox.classList.remove('show');
                    return;
                }

                const coeffs: RiskPredictor = {
                    male: {
                        age: 0.7939,
                        chol: 0.5105,
                        hdl: -0.9369,
                        sbp: 0.01775695,
                        smoker: 0.5361,
                        diabetes: 0.8668,
                        egfr: -0.6046,
                        bpad: 0.1198,
                        fhcvd: 0.3613,
                        ckd: 0.0946,
                        rheum: -0.0946,
                        constant: -3.3977,
                        meanD: 0.52
                    },
                    female: {
                        age: 0.7689,
                        chol: 0.0736,
                        hdl: -0.9499,
                        sbp: 0.01110366,
                        smoker: 0.4387,
                        diabetes: 0.7693,
                        egfr: 0.5379,
                        bpad: 0.1502,
                        fhcvd: 0.1933,
                        ckd: 0.1043,
                        rheum: -0.1043,
                        constant: -3.0312,
                        meanD: 0.48
                    }
                };

                const c = coeffs[gender];
                const d = c.constant +
                    (c.age * Math.log(age)) +
                    (c.chol * Math.log(chol)) +
                    (c.hdl * Math.log(hdl)) +
                    (c.sbp * sbp) +
                    (c.smoker * smoker) +
                    (c.diabetes * diabetes) +
                    (c.egfr * Math.log(egfr)) +
                    (c.bpad * bpad) +
                    (c.fhcvd * fhcvd) +
                    (c.ckd * ckd) +
                    (c.rheum * rheum); // Note: Original code used rheum coefficient correctly

                // Baseline survival S0 logic (simplified approximation based on age/gender from original code)
                let s0 = 0.97;
                if (gender === 'male') {
                    if (age < 50) s0 = 0.98;
                    else if (age < 60) s0 = 0.975;
                    else if (age < 70) s0 = 0.97;
                    else s0 = 0.96;
                } else {
                    if (age < 50) s0 = 0.985;
                    else if (age < 60) s0 = 0.98;
                    else if (age < 70) s0 = 0.975;
                    else s0 = 0.97;
                }

                const risk = 100 * (1 - Math.pow(s0, Math.exp(d - c.meanD)));
                const riskVal = Math.max(0.1, Math.min(99.9, risk));

                let riskCategory = '';
                let alertType: 'info' | 'success' | 'warning' | 'danger' = 'info';
                if (riskVal < 10) {
                    riskCategory = 'Low/Moderate Risk (<10%)';
                    alertType = 'success';
                } else if (riskVal < 20) {
                    riskCategory = 'High Risk (10-20%)';
                    alertType = 'warning';
                } else {
                    riskCategory = 'Very High Risk (≥20%)';
                    alertType = 'danger';
                }

                if (resultBox) {
                    const resultContent = resultBox.querySelector('.ui-result-content');
                    if (resultContent) {
                        resultContent.innerHTML = `
                            ${uiBuilder.createResultItem({
                            label: '10-Year CVD Risk',
                            value: riskVal.toFixed(1),
                            unit: '%',
                            interpretation: riskCategory,
                            alertClass: `ui-alert-${alertType}`
                        })}
                            ${uiBuilder.createAlert({
                            type: alertType,
                            message: `<strong>Recommendation:</strong> ${riskVal >= 10 ? 'Consider statin therapy and lifestyle interventions.' : 'Focus on lifestyle modifications.'}`
                        })}
                        `;
                    }
                    resultBox.classList.add('show');
                }
            } catch (error) {
                const errorContainer = container.querySelector('#prevent-cvd-error-container');
                if (errorContainer) {
                    displayError(errorContainer as HTMLElement, error as Error);
                } else {
                    console.error(error);
                }
                logError(error as Error, { calculator: 'prevent-cvd', action: 'calculate' });
            }
        };

        // Event listeners
        container.querySelectorAll('input, select').forEach(el => {
            el.addEventListener('input', calculate);
            el.addEventListener('change', calculate);
        });

        // Auto-populate
        if (patient && patient.birthDate) {
            ageInput.value = calculateAge(patient.birthDate).toString();
        }
        if (patient && patient.gender) {
            genderSelect.value = patient.gender === 'male' ? 'male' : 'female';
        }

        if (client) {
            getMostRecentObservation(client, LOINC_CODES.SYSTOLIC_BP).then(obs => {
                if (obs?.valueQuantity) {
                    sbpInput.value = obs.valueQuantity.value.toFixed(0);
                    calculate();
                    stalenessTracker.trackObservation('#qrisk-sbp', obs, LOINC_CODES.SYSTOLIC_BP, 'Systolic BP');
                }
            }).catch(e => console.warn(e));

            getMostRecentObservation(client, LOINC_CODES.CHOLESTEROL_TOTAL).then(obs => {
                if (obs?.valueQuantity) {
                    // FHIR usually mg/dL, but we default to mmol/L.
                    // Convert if needed.
                    let val = obs.valueQuantity.value;
                    if (obs.valueQuantity.unit === 'mg/dL') {
                        val = val / 38.67;
                    }
                    const el = container.querySelector('#qrisk-cholesterol') as HTMLInputElement;
                    if (el) el.value = val.toFixed(2);
                    calculate();
                    stalenessTracker.trackObservation('#qrisk-cholesterol', obs, LOINC_CODES.CHOLESTEROL_TOTAL, 'Total Cholesterol');
                }
            }).catch(e => console.warn(e));

            getMostRecentObservation(client, LOINC_CODES.HDL).then(obs => {
                if (obs?.valueQuantity) {
                    let val = obs.valueQuantity.value;
                    if (obs.valueQuantity.unit === 'mg/dL') {
                        val = val / 38.67;
                    }
                    hdlInput.value = val.toFixed(2);
                    calculate();
                    stalenessTracker.trackObservation('#qrisk-hdl', obs, LOINC_CODES.HDL, 'HDL Cholesterol');
                }
            }).catch(e => console.warn(e));

            getMostRecentObservation(client, LOINC_CODES.EGFR).then(obs => {
                if (obs?.valueQuantity) {
                    egfrInput.value = obs.valueQuantity.value.toFixed(0);
                    calculate();
                    stalenessTracker.trackObservation('#qrisk-egfr', obs, LOINC_CODES.EGFR, 'eGFR');
                }
            }).catch(e => console.warn(e));
        }
    }
};
