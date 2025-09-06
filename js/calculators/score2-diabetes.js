import { getMostRecentObservation, calculateAge } from '../utils.js';

// Coefficients and baseline survival data from the official SCORE2-Diabetes calculator
const score2DiabetesData = {
    "low": {
        "male": { "age": 0.0652, "sbp": 0.0139, "tchol": 0.2079, "hdl": -0.4485, "hba1c": 0.0211, "egfr": -0.0076, "smoking": 0.3838, "s010": 0.9765, "mean_x": 4.9664 },
        "female": { "age": 0.0768, "sbp": 0.0152, "tchol": 0.147, "hdl": -0.5659, "hba1c": 0.0232, "egfr": -0.0084, "smoking": 0.5422, "s010": 0.9859, "mean_x": 5.215 }
    },
    "moderate": {
        "male": { "age": 0.0652, "sbp": 0.0139, "tchol": 0.2079, "hdl": -0.4485, "hba1c": 0.0211, "egfr": -0.0076, "smoking": 0.3838, "s010": 0.9626, "mean_x": 4.9664 },
        "female": { "age": 0.0768, "sbp": 0.0152, "tchol": 0.147, "hdl": -0.5659, "hba1c": 0.0232, "egfr": -0.0084, "smoking": 0.5422, "s010": 0.9782, "mean_x": 5.215 }
    },
    "high": {
        "male": { "age": 0.0652, "sbp": 0.0139, "tchol": 0.2079, "hdl": -0.4485, "hba1c": 0.0211, "egfr": -0.0076, "smoking": 0.3838, "s010": 0.9388, "mean_x": 4.9664 },
        "female": { "age": 0.0768, "sbp": 0.0152, "tchol": 0.147, "hdl": -0.5659, "hba1c": 0.0232, "egfr": -0.0084, "smoking": 0.5422, "s010": 0.9661, "mean_x": 5.215 }
    },
    "very_high": {
        "male": { "age": 0.0652, "sbp": 0.0139, "tchol": 0.2079, "hdl": -0.4485, "hba1c": 0.0211, "egfr": -0.0076, "smoking": 0.3838, "s010": 0.9038, "mean_x": 4.9664 },
        "female": { "age": 0.0768, "sbp": 0.0152, "tchol": 0.147, "hdl": -0.5659, "hba1c": 0.0232, "egfr": -0.0084, "smoking": 0.5422, "s010": 0.9472, "mean_x": 5.215 }
    }
};

export const score2Diabetes = {
    id: 'score2-diabetes',
    title: 'Systematic Coronary Risk Evaluation 2-Diabetes (SCORE2-Diabetes)',
    description: 'Predicts 10-year CVD risk in patients with type 2 diabetes.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
             <div class="instructions-box">
                <strong>INSTRUCTIONS</strong>
                <p>Use this score to predict 10-year risk of cardiovascular disease in European patients under 70 years of age and who have a history of diabetes.</p>
            </div>
            <div class="form-container modern">
                 <div class="input-row">
                    <label>Sex</label>
                    <div class="segmented-control">
                        <label><input type="radio" name="sex" value="male"> Male</label>
                        <label><input type="radio" name="sex" value="female"> Female</label>
                    </div>
                </div>
                 <div class="input-row">
                    <label for="age">Age</label>
                    <div class="input-with-unit">
                        <input type="number" id="age">
                        <span>years</span>
                    </div>
                </div>
                <div class="input-row">
                    <label>Smoking</label>
                    <div class="segmented-control">
                        <label><input type="radio" name="smoking" value="0"> Other</label>
                        <label><input type="radio" name="smoking" value="1"> Current</label>
                    </div>
                </div>
                 <div class="input-row">
                    <label for="sbp">SBP</label>
                    <div class="input-with-unit">
                        <input type="number" id="sbp" placeholder="Norm: 100 - 120">
                        <span>mm Hg</span>
                    </div>
                </div>
                <div class="input-row">
                    <label>Diabetes</label>
                    <div class="segmented-control">
                        <label><input type="radio" name="diabetes" value="0" checked> No</label>
                        <label><input type="radio" name="diabetes" value="1"> Yes</label>
                    </div>
                </div>
                <div class="input-row">
                    <label for="tchol">Total cholesterol</label>
                    <div class="input-with-unit">
                        <input type="number" id="tchol" placeholder="Norm: 150 - 200">
                        <span>mg/dL</span>
                    </div>
                </div>
                 <div class="input-row">
                    <label for="hdl">HDL cholesterol</label>
                    <div class="input-with-unit">
                        <input type="number" id="hdl" placeholder="Norm: 60 - 155">
                        <span>mg/dL</span>
                    </div>
                </div>
                <div class="input-row">
                    <label for="hba1c">HbA1c</label>
                    <div class="input-with-unit">
                        <input type="number" id="hba1c" placeholder="Norm: 4.0 - 5.6">
                        <span>%</span>
                    </div>
                </div>
                 <div class="input-row">
                    <label for="egfr">eGFR</label>
                    <div class="input-with-unit">
                        <input type="number" id="egfr" placeholder="Norm: 90 - 120">
                        <span>mL/min/1.73 m²</span>
                    </div>
                </div>
                <div class="input-row vertical ariscat-form">
                    <div class="input-label">Risk region</div>
                    <div class="radio-group vertical-group">
                        <label><input type="radio" name="region" value="low"> Low</label>
                        <label><input type="radio" name="region" value="moderate"> Moderate</label>
                        <label><input type="radio" name="region" value="high"> High</label>
                        <label><input type="radio" name="region" value="very_high"> Very high</label>
                    </div>
                </div>
            </div>
            <div id="score2-diabetes-result" class="result-box ttkg-result" style="display:block;">
                <div class="result-title">Result:</div>
                <div class="result-value">Please fill out required fields.</div>
            </div>
        `;
    },
    initialize: function(client, patient, container) {
        const fields = {
            sex: container.querySelector('input[name="sex"]:checked'),
            age: container.querySelector('#age'),
            smoking: container.querySelector('input[name="smoking"]:checked'),
            sbp: container.querySelector('#sbp'),
            tchol: container.querySelector('#tchol'),
            hdl: container.querySelector('#hdl'),
            hba1c: container.querySelector('#hba1c'),
            egfr: container.querySelector('#egfr'),
            region: container.querySelector('input[name="region"]:checked')
        };
        const resultEl = container.querySelector('#score2-diabetes-result');
        const resultValueEl = container.querySelector('#score2-diabetes-result .result-value');

        const calculate = () => {
            // Update checked fields
            fields.sex = container.querySelector('input[name="sex"]:checked');
            fields.smoking = container.querySelector('input[name="smoking"]:checked');
            fields.region = container.querySelector('input[name="region"]:checked');

            const allFilled = Object.values(fields).every(el => el && el.value);
            
            if (!allFilled) {
                resultValueEl.textContent = 'Please fill out required fields.';
                resultEl.className = 'result-box ttkg-result';
                return;
            }

            const region = fields.region.value;
            const sex = fields.sex.value;
            const coeffs = score2DiabetesData[region][sex];

            // Convert units for calculation
            const tchol_mmol = parseFloat(fields.tchol.value) / 38.67;
            const hdl_mmol = parseFloat(fields.hdl.value) / 38.67;
            const hba1c_mmol = (parseFloat(fields.hba1c.value) * 10.93) - 23.5;

            const ind_x = 
                coeffs.age * parseFloat(fields.age.value) +
                coeffs.sbp * parseFloat(fields.sbp.value) +
                coeffs.tchol * tchol_mmol +
                coeffs.hdl * hdl_mmol +
                coeffs.hba1c * hba1c_mmol +
                coeffs.egfr * parseFloat(fields.egfr.value) +
                coeffs.smoking * parseFloat(fields.smoking.value);

            const risk = 100 * (1 - Math.pow(coeffs.s010, Math.exp(ind_x - coeffs.mean_x)));

            resultEl.className = 'result-box ttkg-result calculated';
            resultValueEl.innerHTML = `${risk.toFixed(1)}% 10-year risk of fatal/non-fatal CVD`;
        };

        // Auto-populate patient data
        const patientAge = calculateAge(patient.birthDate);
        fields.age.value = patientAge;

        const patientGender = patient.gender; // 'male' or 'female'
        const genderRadio = container.querySelector(`input[name="sex"][value="${patientGender}"]`);
        if (genderRadio) {
            genderRadio.checked = true;
            genderRadio.parentElement.classList.add('selected');
        }

        getMostRecentObservation(client, '8480-6').then(obs => { if (obs && obs.valueQuantity) fields.sbp.value = obs.valueQuantity.value.toFixed(0); calculate(); });
        getMostRecentObservation(client, '2093-3').then(obs => { if (obs && obs.valueQuantity) fields.tchol.value = (obs.valueQuantity.value * 38.67).toFixed(0); calculate(); }); // mmol/L to mg/dL
        getMostRecentObservation(client, '2085-9').then(obs => { if (obs && obs.valueQuantity) fields.hdl.value = (obs.valueQuantity.value * 38.67).toFixed(0); calculate(); });   // mmol/L to mg/dL
        getMostRecentObservation(client, '4548-4').then(obs => { if (obs && obs.valueQuantity) fields.hba1c.value = ((obs.valueQuantity.value + 23.5) / 10.93).toFixed(1); calculate(); }); // mmol/mol to %
        getMostRecentObservation(client, '33914-3').then(obs => { if (obs && obs.valueQuantity) fields.egfr.value = obs.valueQuantity.value.toFixed(0); calculate(); });
        
        // Smoking status - LOINC 72166-2
        getMostRecentObservation(client, '72166-2').then(obs => {
            if (obs && obs.valueCodeableConcept) {
                const smokingCode = obs.valueCodeableConcept.coding[0].code;
                // This is a simplified mapping. Real-world codes can be complex.
                // 449868002 = Current every day smoker
                const isSmoker = smokingCode === '449868002';
                const smokingRadio = container.querySelector(`input[name="smoking"][value="${isSmoker ? 1 : 0}"]`);
                if(smokingRadio){
                    smokingRadio.checked = true;
                    smokingRadio.parentElement.classList.add('selected');
                }
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
