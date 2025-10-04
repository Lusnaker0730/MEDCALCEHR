// js/calculators/ckd-epi.js
import { getMostRecentObservation, calculateAge } from '../../utils.js';

export const ckdEpi = {
    id: 'ckd-epi',
    title: 'CKD-EPI GFR (2021 Refit)',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <div class="input-group">
                <label for="ckd-epi-creatinine">Serum Creatinine (mg/dL):</label>
                <input type="number" id="ckd-epi-creatinine" placeholder="loading...">
            </div>
            <div class="input-group">
                <label for="ckd-epi-age">Age:</label>
                <input type="number" id="ckd-epi-age" placeholder="loading...">
            </div>
            <div class="input-group">
                <label for="ckd-epi-gender">Gender:</label>
                <select id="ckd-epi-gender">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                </select>
            </div>
            <div id="ckd-epi-result" class="result" style="display:block;">
                <div class="result-item">
                    <span class="value">-- <span class="unit">mL/min/1.73m²</span></span>
                    <span class="label">eGFR (CKD-EPI 2021)</span>
                </div>
            </div>
            <div class="formula-section">
                <h4>CKD-EPI 2021 Formula</h4>
                <div class="formula-item">
                    <strong>For Females:</strong>
                    <div class="formula">eGFR = 142 × min(Scr/0.7, 1)<sup>-0.241</sup> × max(Scr/0.7, 1)<sup>-1.200</sup> × 0.9938<sup>Age</sup> × 1.012</div>
                </div>
                <div class="formula-item">
                    <strong>For Males:</strong>
                    <div class="formula">eGFR = 142 × min(Scr/0.9, 1)<sup>-0.302</sup> × max(Scr/0.9, 1)<sup>-1.200</sup> × 0.9938<sup>Age</sup></div>
                </div>
                <div class="formula-item">
                    <strong>Where:</strong>
                    <div class="formula">
                        Scr = serum creatinine (mg/dL)<br>
                        κ = 0.7 (females) or 0.9 (males)<br>
                        α = -0.241 (females) or -0.302 (males)<br>
                        min = minimum of Scr/κ or 1<br>
                        max = maximum of Scr/κ or 1
                    </div>
                </div>
            </div>
        `;
    },
    initialize: function(client, patient, container) {
        const creatinineInput = container.querySelector('#ckd-epi-creatinine');
        const ageInput = container.querySelector('#ckd-epi-age');
        const genderSelect = container.querySelector('#ckd-epi-gender');
        const resultEl = container.querySelector('#ckd-epi-result');

        // Function to calculate and update results
        const calculateAndUpdate = () => {
            const creatinine = parseFloat(creatinineInput.value);
            const age = parseFloat(ageInput.value);
            const gender = genderSelect.value;

            if (creatinine > 0 && age > 0) {
                const kappa = gender === 'female' ? 0.7 : 0.9;
                const alpha = gender === 'female' ? -0.241 : -0.302;
                const gender_coefficient = gender === 'female' ? 1.012 : 1;

                let gfr = 142 * 
                          Math.pow(Math.min(creatinine / kappa, 1.0), alpha) *
                          Math.pow(Math.max(creatinine / kappa, 1.0), -1.200) *
                          Math.pow(0.9938, age) *
                          gender_coefficient;
                
                // Update result display
                const valueEl = resultEl.querySelector('.result-item .value');
                valueEl.innerHTML = `${gfr.toFixed(0)} <span class="unit">mL/min/1.73m²</span>`;
                
                resultEl.className = 'result calculated';
            } else {
                // Reset to default values if inputs are invalid
                const valueEl = resultEl.querySelector('.result-item .value');
                valueEl.innerHTML = `-- <span class="unit">mL/min/1.73m²</span>`;
                
                resultEl.className = 'result';
            }
        };

        // Auto-populate patient data
        if (patient && patient.birthDate) {
            ageInput.value = calculateAge(patient.birthDate);
        }
        if (patient && patient.gender) {
            genderSelect.value = patient.gender;
        }

        // Auto-populate from FHIR data
        getMostRecentObservation(client, '2160-0').then(obs => {
            if (obs && obs.valueQuantity) {
                creatinineInput.value = obs.valueQuantity.value.toFixed(2);
            } else {
                creatinineInput.placeholder = "e.g., 1.2";
            }
            // Calculate initial results if data was populated
            calculateAndUpdate();
        });

        // Add event listeners for automatic calculation
        creatinineInput.addEventListener('input', calculateAndUpdate);
        ageInput.addEventListener('input', calculateAndUpdate);
        genderSelect.addEventListener('change', calculateAndUpdate);

        // Initial calculation
        calculateAndUpdate();
    }
};







