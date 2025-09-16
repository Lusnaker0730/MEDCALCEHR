// js/calculators/ckd-epi.js
import { getMostRecentObservation, calculateAge } from '../../utils.js';

export const ckdEpi = {
    id: 'ckd-epi',
    title: 'CKD-EPI GFR (2021 Refit)',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <div class="input-group">
                <label for="epi-creatinine">Serum Creatinine (mg/dL):</label>
                <input type="number" id="epi-creatinine" placeholder="loading...">
            </div>
            <div class="input-group">
                <label for="epi-age">Age:</label>
                <input type="number" id="epi-age" placeholder="loading...">
            </div>
            <div class="input-group">
                <label for="epi-gender">Gender:</label>
                <select id="epi-gender">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                </select>
            </div>
            <button id="calculate-epi">Calculate</button>
            <div id="epi-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function(client, patient) {
        const creatinineInput = document.getElementById('epi-creatinine');
        const ageInput = document.getElementById('epi-age');
        const genderSelect = document.getElementById('epi-gender');

        ageInput.value = calculateAge(patient.birthDate);
        genderSelect.value = patient.gender;

        getMostRecentObservation(client, '2160-0').then(obs => {
            if (obs) creatinineInput.value = obs.valueQuantity.value.toFixed(2);
            else creatinineInput.placeholder = "e.g., 1.2";
        });

        document.getElementById('calculate-epi').addEventListener('click', () => {
            const creatinine = parseFloat(creatinineInput.value);
            const age = parseFloat(ageInput.value);
            const gender = genderSelect.value;
            const resultEl = document.getElementById('epi-result');

            if (creatinine > 0 && age > 0) {
                const kappa = gender === 'female' ? 0.7 : 0.9;
                const alpha = gender === 'female' ? -0.241 : -0.302;
                const gender_coefficient = gender === 'female' ? 1.012 : 1;

                let gfr = 142 * 
                          Math.pow(Math.min(creatinine / kappa, 1.0), alpha) *
                          Math.pow(Math.max(creatinine / kappa, 1.0), -1.200) *
                          Math.pow(0.9938, age) *
                          gender_coefficient;
                
                resultEl.innerHTML = `<p>eGFR: ${gfr.toFixed(0)} mL/min/1.73m²</p>`;
                resultEl.style.display = 'block';
            } else {
                resultEl.innerText = 'Please enter valid creatinine and age.';
                resultEl.style.display = 'block';
            }
        });
    }
};







