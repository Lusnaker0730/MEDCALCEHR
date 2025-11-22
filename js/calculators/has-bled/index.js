import {
    getPatient,
    getMostRecentObservation,
    getPatientConditions,
    getMedicationRequests
} from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';

export const hasBled = {
    id: 'has-bled',
    title: 'HAS-BLED Score for Major Bleeding Risk',
    description:
        'Estimates risk of major bleeding for patients on anticoagulation to assess risk-benefit in atrial fibrillation care.',
    generateHTML: function () {
        const riskFactors = [
            { id: 'hasbled-hypertension', label: '<strong>H</strong>ypertension (Uncontrolled, >160 mmHg systolic)' },
            { id: 'hasbled-renal', label: 'Abnormal <strong>R</strong>enal function (Dialysis, transplant, Cr >2.26 mg/dL)' },
            { id: 'hasbled-liver', label: 'Abnormal <strong>L</strong>iver function (Cirrhosis or bilirubin >2x normal with AST/ALT/AP >3x normal)' },
            { id: 'hasbled-stroke', label: '<strong>S</strong>troke history' },
            { id: 'hasbled-bleeding', label: '<strong>B</strong>leeding history or predisposition' },
            { id: 'hasbled-inr', label: '<strong>L</strong>abile INR (Unstable/high INRs, time in therapeutic range <60%)' },
            { id: 'hasbled-age', label: '<strong>E</strong>lderly (Age >65)' },
            { id: 'hasbled-meds', label: '<strong>D</strong>rugs predisposing to bleeding (Aspirin, clopidogrel, NSAIDs)' },
            { id: 'hasbled-alcohol', label: 'Alcohol use (≥8 drinks/week)' }
        ];

        const inputs = uiBuilder.createSection({
            title: 'HAS-BLED Risk Factors',
            content: riskFactors.map(factor => 
                uiBuilder.createRadioGroup({
                    name: factor.id,
                    label: factor.label,
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: '1', label: 'Yes (+1)' }
                    ]
                })
            ).join('')
        });

        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            <div class="alert info">
                <span class="alert-icon">ℹ️</span>
                <div class="alert-content">
                    <p>Select all risk factors that apply. Score automatically calculates.</p>
                </div>
            </div>
            
            ${inputs}
            
            ${uiBuilder.createResultBox({ id: 'has-bled-result', title: 'HAS-BLED Score Result' })}
        `;
    },
    initialize: async function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const setRadioValue = (name, value) => {
            const radio = container.querySelector(`input[name="${name}"][value="${value}"]`);
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change'));
            }
        };

        const calculate = () => {
            let score = 0;
            const radios = container.querySelectorAll('input[type="radio"]:checked');
            radios.forEach(radio => {
                score += parseInt(radio.value);
            });

            let risk = '';
            let level = '';
            let alertClass = '';
            let recommendation = '';

            if (score === 0) {
                risk = '0.9% risk (1.13 bleeds/100 patient-years)';
                level = 'Low risk';
                alertClass = 'ui-alert-success';
            } else if (score === 1) {
                risk = '1.02 bleeds/100 patient-years';
                level = 'Low-moderate risk';
                alertClass = 'ui-alert-success';
            } else if (score === 2) {
                risk = '1.88 bleeds/100 patient-years';
                level = 'Moderate risk';
                alertClass = 'ui-alert-warning';
            } else if (score === 3) {
                risk = '3.74 bleeds/100 patient-years';
                level = 'Moderate-high risk';
                alertClass = 'ui-alert-warning';
            } else if (score === 4) {
                risk = '8.70 bleeds/100 patient-years';
                level = 'High risk';
                alertClass = 'ui-alert-danger';
            } else {
                risk = '12.50 bleeds/100 patient-years';
                level = 'Very high risk';
                alertClass = 'ui-alert-danger';
            }

            if (score >= 3) {
                recommendation = 'Consider alternatives to anticoagulation or more frequent monitoring. High bleeding risk.';
            } else {
                recommendation = 'Anticoagulation can be considered. Relatively low risk for major bleeding.';
            }

            const resultBox = container.querySelector('#has-bled-result');
            const resultContent = resultBox.querySelector('.ui-result-content');

            resultContent.innerHTML = `
                ${uiBuilder.createResultItem({ 
                    label: 'Total Score', 
                    value: score, 
                    unit: '/ 9 points',
                    interpretation: level,
                    alertClass: alertClass
                })}
                
                <div class="result-item" style="margin-top: 10px; text-align: center;">
                    <span class="label" style="color: #666;">Annual Bleeding Risk:</span>
                    <span class="value" style="font-weight: 600;">${risk}</span>
                </div>

                <div class="ui-alert ${alertClass} mt-10">
                    <span class="ui-alert-icon">${score >= 3 ? '⚠️' : 'ℹ️'}</span>
                    <div class="ui-alert-content">
                        <strong>Recommendation:</strong> ${recommendation}
                    </div>
                </div>
            `;
            
            resultBox.classList.add('show');
        };

        // Add event listeners
        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', calculate);
        });

        calculate();

        // FHIR Integration
        if (client) {
            try {
                // Age > 65
                const patientData = await getPatient(client);
                if (patientData && patientData.birthDate) {
                    const birthYear = new Date(patientData.birthDate).getFullYear();
                    const currentYear = new Date().getFullYear();
                    if (currentYear - birthYear > 65) {
                        setRadioValue('hasbled-age', '1');
                    }
                }

                // Conditions
                const conditions = await getPatientConditions(client);
                if (conditions) {
                    // Basic mapping check (simplified for brevity)
                    // In real scenario, we'd check codes more robustly
                    const checkCondition = (codes, targetId) => {
                        if (conditions.some(c => codes.includes(c.code?.coding?.[0]?.code))) {
                            setRadioValue(targetId, '1');
                        }
                    };

                    checkCondition(['38341003'], 'hasbled-hypertension');
                    checkCondition(['80294001'], 'hasbled-renal');
                    checkCondition(['19943007'], 'hasbled-liver');
                    checkCondition(['230690007'], 'hasbled-stroke');
                    checkCondition(['131148009'], 'hasbled-bleeding');
                }

                // Observations
                const sbp = await getMostRecentObservation(client, LOINC_CODES.SYSTOLIC_BP);
                if (sbp?.valueQuantity?.value > 160) {
                    setRadioValue('hasbled-hypertension', '1');
                }

                const creatinine = await getMostRecentObservation(client, LOINC_CODES.CREATININE);
                if (creatinine?.valueQuantity?.value > 2.26) {
                    setRadioValue('hasbled-renal', '1');
                }

                // Medications
                // For demo, assuming utility function works as expected or returning empty array if not found
                try {
                    const meds = await getMedicationRequests(client, ['1191', '32953', '5640']);
                    if (meds && meds.length > 0) {
                        setRadioValue('hasbled-meds', '1');
                    }
                } catch (e) {
                    // Ignore medication errors if API not available
                }

            } catch (error) {
                console.log('FHIR data loading error in HAS-BLED:', error);
            }
        }
    }
};