// js/calculators/mdrd-gfr.js
import { getMostRecentObservation, calculateAge } from '../../utils.js';

export const mdrdGfr = {
    id: 'mdrd-gfr',
    title: 'MDRD GFR Equation',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <div class="input-group">
                <label for="mdrd-creatinine">Serum Creatinine (mg/dL):</label>
                <input type="number" id="mdrd-creatinine" placeholder="e.g., 1.2">
            </div>
            <div class="input-group">
                <label for="mdrd-age">Age:</label>
                <input type="number" id="mdrd-age" placeholder="e.g., 65">
            </div>
            <div class="input-group">
                <label for="mdrd-gender">Gender:</label>
                <select id="mdrd-gender">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                </select>
            </div>
            <div class="input-group">
                <label for="mdrd-race">Race:</label>
                <select id="mdrd-race">
                    <option value="non-aa">Non-African American</option>
                    <option value="aa">African American</option>
                </select>
            </div>
            <div id="mdrd-result" class="result" style="display:block;">
                <div class="result-item">
                    <span class="value">-- <span class="unit">mL/min/1.73m²</span></span>
                    <span class="label">eGFR (MDRD)</span>
                </div>
            </div>
            <div class="formula-section">
                <h4>MDRD Formula</h4>
                <div class="formula-item">
                    <strong>Base Formula:</strong>
                    <div class="formula">eGFR = 175 × (Scr)<sup>-1.154</sup> × (Age)<sup>-0.203</sup></div>
                </div>
                <div class="formula-item">
                    <strong>Gender Adjustment:</strong>
                    <div class="formula">If female: multiply by 0.742</div>
                </div>
                <div class="formula-item">
                    <strong>Race Adjustment:</strong>
                    <div class="formula">If African American: multiply by 1.212</div>
                </div>
                <div class="formula-item">
                    <strong>Complete Formula:</strong>
                    <div class="formula">
                        eGFR = 175 × (Scr)<sup>-1.154</sup> × (Age)<sup>-0.203</sup> × [0.742 if female] × [1.212 if African American]
                    </div>
                </div>
                <div class="formula-item">
                    <strong>Where:</strong>
                    <div class="formula">
                        Scr = serum creatinine (mg/dL)<br>
                        Age = patient age in years<br>
                        Result = estimated GFR in mL/min/1.73m²
                    </div>
                </div>
                <div class="formula-item">
                    <strong>Important Notes:</strong>
                    <div class="formula">
                        • MDRD formula is less accurate at higher GFR values (>60)<br>
                        • CKD-EPI equation is now preferred for most patients<br>
                        • Original study included patients with CKD<br>
                        • Not validated for use in children, pregnancy, or acute kidney injury
                    </div>
                </div>
            </div>
        `;
    },
    initialize: function(client, patient, container) {
        const creatinineInput = container.querySelector('#mdrd-creatinine');
        const ageInput = container.querySelector('#mdrd-age');
        const genderSelect = container.querySelector('#mdrd-gender');
        const raceSelect = container.querySelector('#mdrd-race');
        const resultEl = container.querySelector('#mdrd-result');

        // Function to calculate and update results
        const calculateAndUpdate = () => {
            const creatinine = parseFloat(creatinineInput.value);
            const age = parseFloat(ageInput.value);
            const isFemale = genderSelect.value === 'female';
            const isAA = raceSelect.value === 'aa';

            if (creatinine > 0 && age > 0) {
                let gfr = 175 * Math.pow(creatinine, -1.154) * Math.pow(age, -0.203);
                if (isFemale) gfr *= 0.742;
                if (isAA) gfr *= 1.212;
                
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
            }
            // Calculate initial results if data was populated
            calculateAndUpdate();
        });

        // Add event listeners for automatic calculation
        creatinineInput.addEventListener('input', calculateAndUpdate);
        ageInput.addEventListener('input', calculateAndUpdate);
        genderSelect.addEventListener('change', calculateAndUpdate);
        raceSelect.addEventListener('change', calculateAndUpdate);

        // Initial calculation
        calculateAndUpdate();
    }
};

