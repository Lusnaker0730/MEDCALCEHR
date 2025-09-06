import { getMostRecentObservation, calculateAge, getPatientConditions } from '../utils.js';

const getPoints = {
    age: (v) => v * 0.08,
    ef: (v) => v * -0.05,
    sbp: (v) => v * -0.02,
    bmi: (v) => {
        if (v < 20) return 2;
        if (v >= 20 && v < 25) return 1;
        if (v >= 25 && v < 30) return 0;
        if (v >= 30) return -1;
        return 0;
    },
    creatinine: (v) => {
        const creatinine_mg_dl = v / 88.4; // Convert umol/L to mg/dL
        if (creatinine_mg_dl <= 0.9) return 0;
        if (creatinine_mg_dl <= 1.3) return 1;
        if (creatinine_mg_dl <= 2.2) return 3;
        if (creatinine_mg_dl > 2.2) return 5;
        return 0;
    }
};

const getMortality = (score) => {
    const linearPredictor = 0.047 * (score - 21.6);
    const prob1yr = 1 - Math.pow(0.92, Math.exp(linearPredictor));
    const prob3yr = 1 - Math.pow(0.79, Math.exp(linearPredictor));
    return { prob1yr: (prob1yr * 100).toFixed(1), prob3yr: (prob3yr * 100).toFixed(1) };
};


export const maggic = {
    id: 'maggic-hf',
    title: 'MAGGIC Risk Calculator for Heart Failure',
    description: 'Estimates 1- and 3- year mortality in heart failure.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <div class="instructions-box">
                <strong>INSTRUCTIONS</strong>
                <p>Use in adult patients (≥18 years). Use with caution in patients with reduced ejection fraction (not yet externally validated in this population).</p>
            </div>
            <div class="form-container modern">
                 <div class="input-row">
                    <label for="maggic-age">Age</label>
                    <div class="input-with-unit"><input type="number" id="maggic-age"><span>years</span></div>
                </div>
                 <div class="input-row">
                    <label for="maggic-ef">Ejection Fraction</label>
                    <div class="input-with-unit"><input type="number" id="maggic-ef"><span>%</span></div>
                </div>
                 <div class="input-row">
                    <label for="maggic-sbp">sBP</label>
                    <div class="input-with-unit"><input type="number" id="maggic-sbp" placeholder="Norm: 100 - 120"><span>mm Hg</span></div>
                </div>
                <div class="input-row">
                    <label for="maggic-bmi">BMI</label>
                    <div class="input-with-unit"><input type="number" id="maggic-bmi" placeholder="Norm: 20 - 25"><span>kg/m²</span></div>
                </div>
                <div class="input-row">
                    <label for="maggic-creatinine">
                        Creatinine
                        <span style="font-weight:normal; font-size: 0.8em; color: #777; display: block; margin-top: 4px;">Note: while this score uses creatinine as a proxy for renal function, eGFR is generally considered a more accurate indicator</span>
                    </label>
                    <div class="input-with-unit"><input type="number" id="maggic-creatinine" placeholder="Norm: 62 - 115"><span>μmol/L</span></div>
                </div>
                <div class="input-row vertical ariscat-form">
                    <div class="input-label">NYHA Class</div>
                    <div class="radio-group vertical-group">
                        <label><input type="radio" name="nyha" value="0"> Class I</label>
                        <label><input type="radio" name="nyha" value="2"> Class II</label>
                        <label><input type="radio" name="nyha" value="6"> Class III</label>
                        <label><input type="radio" name="nyha" value="8"> Class IV</label>
                    </div>
                </div>
                <div class="input-row ariscat-form">
                    <div class="input-label">Gender</div>
                    <div class="segmented-control">
                        <label><input type="radio" name="gender" value="0"> Female</label>
                        <label><input type="radio" name="gender" value="1"> Male</label>
                    </div>
                </div>
                 <div class="input-row ariscat-form">
                    <div class="input-label">Current smoker</div>
                    <div class="segmented-control">
                        <label><input type="radio" name="smoker" value="0"> No</label>
                        <label><input type="radio" name="smoker" value="1"> Yes</label>
                    </div>
                </div>
                <div class="input-row ariscat-form">
                    <div class="input-label">Diabetes</div>
                    <div class="segmented-control">
                        <label><input type="radio" name="diabetes" value="0"> No</label>
                        <label><input type="radio" name="diabetes" value="3"> Yes</label>
                    </div>
                </div>
                <div class="input-row ariscat-form">
                    <div class="input-label">COPD</div>
                    <div class="segmented-control">
                        <label><input type="radio" name="copd" value="0"> No</label>
                        <label><input type="radio" name="copd" value="2"> Yes</label>
                    </div>
                </div>
                <div class="input-row ariscat-form">
                    <div class="input-label">Heart failure first diagnosed ≥18 months ago</div>
                    <div class="segmented-control">
                        <label><input type="radio" name="hfdx" value="0"> No</label>
                        <label><input type="radio" name="hfdx" value="2"> Yes</label>
                    </div>
                </div>
                <div class="input-row ariscat-form">
                    <div class="input-label">Beta blocker</div>
                    <div class="segmented-control">
                        <label><input type="radio" name="bb" value="3"> No</label>
                        <label><input type="radio" name="bb" value="0"> Yes</label>
                    </div>
                </div>
                 <div class="input-row ariscat-form">
                    <div class="input-label">ACEi/ARB</div>
                    <div class="segmented-control">
                        <label><input type="radio" name="acei" value="1"> No</label>
                        <label><input type="radio" name="acei" value="0"> Yes</label>
                    </div>
                </div>
            </div>
             <div id="maggic-result" class="result-box ttkg-result" style="display:block;">
                <div class="result-title">Result:</div>
                <div class="result-value">Please fill out required fields.</div>
            </div>
        `;
    },
    initialize: function(client, patient, container) {
        const fields = {
            age: container.querySelector('#maggic-age'),
            ef: container.querySelector('#maggic-ef'),
            sbp: container.querySelector('#maggic-sbp'),
            bmi: container.querySelector('#maggic-bmi'),
            creatinine: container.querySelector('#maggic-creatinine'),
        };
        const radios = ['nyha', 'gender', 'smoker', 'diabetes', 'copd', 'hfdx', 'bb', 'acei'];
        const resultEl = container.querySelector('#maggic-result');
        const resultValueEl = container.querySelector('#maggic-result .result-value');
        
        const calculate = () => {
            let score = 0;
            const allFilled = Object.values(fields).every(el => el.value !== '') && 
                              radios.every(r => container.querySelector(`input[name="${r}"]:checked`));

            if (!allFilled) {
                resultValueEl.textContent = 'Please fill out required fields.';
                resultEl.className = 'result-box ttkg-result';
                return;
            }

            score += getPoints.age(parseFloat(fields.age.value));
            score += getPoints.ef(parseFloat(fields.ef.value));
            score += getPoints.sbp(parseFloat(fields.sbp.value));
            score += getPoints.bmi(parseFloat(fields.bmi.value));
            score += getPoints.creatinine(parseFloat(fields.creatinine.value));
            radios.forEach(r => {
                score += parseInt(container.querySelector(`input[name="${r}"]:checked`).value);
            });
            
            const mortality = getMortality(score);
            resultEl.className = 'result-box ttkg-result calculated';
            resultValueEl.innerHTML = `
                <div style="font-size: 1.2em; font-weight: bold;">
                    1-Year Mortality: ${mortality.prob1yr}%
                </div>
                <div style="font-size: 1.2em; font-weight: bold; margin-top: 10px;">
                    3-Year Mortality: ${mortality.prob3yr}%
                </div>
                <small style="display: block; margin-top: 15px;">MAGGIC Score: ${score.toFixed(1)}</small>
            `;
        };

        // Auto-populate data
        fields.age.value = calculateAge(patient.birthDate);
        const genderRadio = container.querySelector(`input[name="gender"][value="${patient.gender === 'male' ? 1 : 0}"]`);
        if (genderRadio) {
            genderRadio.checked = true;
            genderRadio.parentElement.classList.add('selected');
        }

        getMostRecentObservation(client, '39156-5').then(obs => { if(obs) fields.bmi.value = obs.valueQuantity.value.toFixed(1); calculate(); }); // BMI
        getMostRecentObservation(client, '8480-6').then(obs => { if(obs) fields.sbp.value = obs.valueQuantity.value.toFixed(0); calculate(); }); // SBP
        getMostRecentObservation(client, '2160-0').then(obs => { if(obs) fields.creatinine.value = obs.valueQuantity.value.toFixed(0); calculate(); }); // Creatinine umol/L
        
        // Simplified check for conditions
        getPatientConditions(client, ['414990002', '195967001']).then(conditions => { // Diabetes, COPD
            const hasDiabetes = conditions.some(c => c.code.coding.some(co => co.code === '414990002'));
            const diabetesRadio = container.querySelector(`input[name="diabetes"][value="${hasDiabetes ? 3 : 0}"]`);
            if(diabetesRadio) {
                diabetesRadio.checked = true;
                diabetesRadio.parentElement.classList.add('selected');
            }
            const hasCopd = conditions.some(c => c.code.coding.some(co => co.code === '195967001'));
            const copdRadio = container.querySelector(`input[name="copd"][value="${hasCopd ? 2 : 0}"]`);
            if(copdRadio) {
                copdRadio.checked = true;
                copdRadio.parentElement.classList.add('selected');
            }
            calculate();
        });

        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', () => {
                if (input.type === 'radio') {
                    const group = input.closest('.segmented-control, .radio-group');
                    group.querySelectorAll('label').forEach(label => label.classList.remove('selected'));
                    input.parentElement.classList.add('selected');
                }
                calculate();
            });
        });

        calculate();
    }
};
