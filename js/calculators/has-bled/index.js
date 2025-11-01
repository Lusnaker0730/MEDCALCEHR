import {
    getPatient,
    getMostRecentObservation,
    getPatientConditions,
    getMedicationRequests
} from '../../utils.js';

export const hasBled = {
    id: 'has-bled',
    title: 'HAS-BLED Score for Major Bleeding Risk',
    description:
        'Estimates risk of major bleeding for patients on anticoagulation to assess risk-benefit in atrial fibrillation care.',
    generateHTML: function () {
        return `
        <div class="calculator-header">
            <h3>HAS-BLED Score for Major Bleeding Risk</h3>
            <p class="description">Estimates risk of major bleeding for patients on anticoagulation to assess risk-benefit in atrial fibrillation care.</p>
        </div>
        
        <div class="alert info">
            <span class="alert-icon">ℹ️</span>
            <div class="alert-content">
                <p>Select all risk factors that apply. Score automatically calculates.</p>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title"><span>HAS-BLED Risk Factors</span></div>
            <div class="checkbox-group">
                <label class="checkbox-option" data-id="hypertension">
                    <input type="checkbox" value="1">
                    <span><strong>H</strong>ypertension (Uncontrolled, >160 mmHg systolic) <strong>+1</strong></span>
                </label>
                <label class="checkbox-option" data-id="renal">
                    <input type="checkbox" value="1">
                    <span>Abnormal <strong>R</strong>enal function (Dialysis, transplant, Cr >2.26 mg/dL) <strong>+1</strong></span>
                </label>
                <label class="checkbox-option" data-id="liver">
                    <input type="checkbox" value="1">
                    <span>Abnormal <strong>L</strong>iver function (Cirrhosis or bilirubin >2x normal with AST/ALT/AP >3x normal) <strong>+1</strong></span>
                </label>
                <label class="checkbox-option" data-id="stroke">
                    <input type="checkbox" value="1">
                    <span><strong>S</strong>troke history <strong>+1</strong></span>
                </label>
                <label class="checkbox-option" data-id="bleeding">
                    <input type="checkbox" value="1">
                    <span><strong>B</strong>leeding history or predisposition <strong>+1</strong></span>
                </label>
                <label class="checkbox-option" data-id="inr">
                    <input type="checkbox" value="1">
                    <span><strong>L</strong>abile INR (Unstable/high INRs, time in therapeutic range <60%) <strong>+1</strong></span>
                </label>
                <label class="checkbox-option" data-id="age">
                    <input type="checkbox" value="1">
                    <span><strong>E</strong>lderly (Age >65) <strong>+1</strong></span>
                </label>
                <label class="checkbox-option" data-id="meds">
                    <input type="checkbox" value="1">
                    <span><strong>D</strong>rugs predisposing to bleeding (Aspirin, clopidogrel, NSAIDs) <strong>+1</strong></span>
                </label>
                <label class="checkbox-option" data-id="alcohol">
                    <input type="checkbox" value="1">
                    <span>Alcohol use (≥8 drinks/week) <strong>+1</strong></span>
                </label>
            </div>
        </div>
        
        <div id="has-bled-result" class="result-container"></div>
        `;
    },
    initialize: async function (client, patient, container) {
        const riskFactors = [
            'hypertension',
            'renal',
            'liver',
            'stroke',
            'bleeding',
            'inr',
            'age',
            'meds',
            'alcohol'
        ];

        const scoreInterpretation = {
            0: { risk: '0.9% risk (Lip 2011) or 1.13 bleeds/100 patient-years', level: 'Low risk', alertClass: 'success' },
            1: { risk: '1.02 bleeds/100 patient-years', level: 'Low-moderate risk', alertClass: 'success' },
            2: { risk: '1.88 bleeds/100 patient-years', level: 'Moderate risk', alertClass: 'warning' },
            3: { risk: '3.74 bleeds/100 patient-years', level: 'Moderate-high risk', alertClass: 'warning' },
            4: { risk: '8.70 bleeds/100 patient-years', level: 'High risk', alertClass: 'danger' },
            5: { risk: '12.50 bleeds/100 patient-years', level: 'Very high risk', alertClass: 'danger' }
        };

        const calculate = () => {
            let score = 0;
            container.querySelectorAll('.checkbox-option input[type="checkbox"]').forEach(cb => {
                if (cb.checked) score++;
            });

            const maxScore = Math.min(score, 5);
            const interpretation = scoreInterpretation[maxScore];

            const resultEl = container.querySelector('#has-bled-result');
            resultEl.innerHTML = `
                <div class="result-header">
                    <h4>HAS-BLED Score Result</h4>
                </div>
                <div class="result-score">
                    <span class="score-value">${score}</span>
                    <span class="score-label">/ 9 points</span>
                </div>
                <div class="result-item">
                    <span class="label">Annual Bleeding Risk:</span>
                    <span class="value">${interpretation.risk}</span>
                </div>
                <div class="severity-indicator ${interpretation.alertClass}">
                    <strong>${interpretation.level}</strong>
                </div>
                <div class="alert ${interpretation.alertClass}">
                    <span class="alert-icon">${interpretation.alertClass === 'success' ? '✓' : '⚠'}</span>
                    <div class="alert-content">
                        <p><strong>Recommendation:</strong> ${score >= 3 ? 'Consider alternatives to anticoagulation or more frequent monitoring. High bleeding risk.' : 'Anticoagulation can be considered. Relatively low risk for major bleeding.'}</p>
                    </div>
                </div>
            `;
            resultEl.style.display = 'block';
        };

        // Visual feedback for checkboxes
        container.querySelectorAll('.checkbox-option').forEach(option => {
            const checkbox = option.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    option.classList.add('selected');
                } else {
                    option.classList.remove('selected');
                }
                calculate();
            });
            if (checkbox.checked) {
                option.classList.add('selected');
            }
        });

        calculate();

        // FHIR Integration
        if (client) {
            const setCheckbox = (id, checked) => {
                const checkbox = container.querySelector(`.checkbox-option[data-id="${id}"] input[type="checkbox"]`);
                if (checkbox) {
                    checkbox.checked = checked;
                    if (checked) {
                        checkbox.closest('.checkbox-option').classList.add('selected');
                    }
                }
            };

            // Age > 65
            const patientData = await getPatient(client);
            if (patientData && patientData.birthDate) {
                const age = new Date().getFullYear() - new Date(patientData.birthDate).getFullYear();
                if (age > 65) {
                    setCheckbox('age', true);
                }
            }

            // Conditions
            const conditions = await getPatientConditions(client, [
                '38341003', // Hypertension
                '709044004', '34947000', '80294001', // Renal disease
                '19943007', // Liver disease (Cirrhosis)
                '230690007', // Stroke
                '131148009' // Bleeding
            ]);

            const conditionMap = {
                hypertension: ['38341003'],
                renal: ['709044004', '34947000', '80294001'],
                liver: ['19943007'],
                stroke: ['230690007'],
                bleeding: ['131148009']
            };

            for (const [key, codes] of Object.entries(conditionMap)) {
                if (conditions.some(c => codes.includes(c.code.coding[0].code))) {
                    setCheckbox(key, true);
                }
            }

            // Observations
            const sbp = await getMostRecentObservation(client, '8480-6'); // SBP
            if (sbp && sbp.valueQuantity.value > 160) {
                setCheckbox('hypertension', true);
            }

            const creatinine = await getMostRecentObservation(client, '2160-0'); // Creatinine
            if (creatinine && creatinine.valueQuantity.value > 2.26) {
                setCheckbox('renal', true);
            }

            // Medications
            const meds = await getMedicationRequests(client, [
                '1191', '32953', '5640', '7294', '3329'
            ]); // Aspirin, Clopidogrel, Ibuprofen, Naproxen, Diclofenac
            if (meds && meds.length > 0) {
                setCheckbox('meds', true);
            }

            calculate();
        }
    }
};
