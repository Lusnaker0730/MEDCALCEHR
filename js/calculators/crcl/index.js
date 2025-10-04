import { getMostRecentObservation, calculateAge } from '../../utils.js';

export const crcl = {
    id: 'crcl',
    title: 'Creatinine Clearance (Cockcroft-Gault Equation)',
    description: 'Calculates CrCl according to the Cockcroft-Gault equation.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <div class="input-group">
                <label>Age (years)</label>
                <input type="number" id="crcl-age" placeholder="e.g., 65">
            </div>
            <div class="input-group">
                <label>Weight (kg)</label>
                <input type="number" id="crcl-weight" placeholder="e.g., 70">
            </div>
            <div class="input-group">
                <label>Serum Creatinine (mg/dL)</label>
                <input type="number" id="crcl-scr" step="0.1" placeholder="e.g., 1.2">
            </div>
            <div class="input-group">
                <label>Gender</label>
                <select id="crcl-gender">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                </select>
            </div>
            <div id="crcl-result" class="result" style="display:block;">
                <div class="result-item">
                    <span class="value">-- <span class="unit">mL/min</span></span>
                    <span class="label">Creatinine Clearance (CrCl)</span>
                </div>
            </div>
            <div class="formula-section">
                <h4>Cockcroft-Gault Formula</h4>
                <div class="formula-item">
                    <strong>For Males:</strong>
                    <div class="formula">CrCl = [(140 - Age) × Weight] / (72 × Serum Creatinine)</div>
                </div>
                <div class="formula-item">
                    <strong>For Females:</strong>
                    <div class="formula">CrCl = [(140 - Age) × Weight × 0.85] / (72 × Serum Creatinine)</div>
                </div>
                <div class="formula-item">
                    <strong>Where:</strong>
                    <div class="formula">
                        Age = patient age in years<br>
                        Weight = body weight in kg<br>
                        Serum Creatinine = serum creatinine in mg/dL<br>
                        Result = creatinine clearance in mL/min
                    </div>
                </div>
                <div class="formula-item">
                    <strong>Note:</strong>
                    <div class="formula">
                        • This formula estimates creatinine clearance, not GFR<br>
                        • For females, multiply result by 0.85<br>
                        • Original formula published in 1976<br>
                        • May overestimate clearance in elderly patients
                    </div>
                </div>
            </div>
        `;
    },
    initialize: function(client, patient, container) {
        const ageEl = container.querySelector('#crcl-age');
        const weightEl = container.querySelector('#crcl-weight');
        const scrEl = container.querySelector('#crcl-scr');
        const genderEl = container.querySelector('#crcl-gender');
        const resultEl = container.querySelector('#crcl-result');

        // Function to calculate and update results
        const calculateAndUpdate = () => {
            const age = parseInt(ageEl.value);
            const weight = parseFloat(weightEl.value);
            const scr = parseFloat(scrEl.value);
            const gender = genderEl.value;

            if (!isNaN(age) && !isNaN(weight) && !isNaN(scr) && age > 0 && weight > 0 && scr > 0) {
                let crcl = ((140 - age) * weight) / (72 * scr);
                if (gender === 'female') {
                    crcl *= 0.85;
                }

                // Update result display
                const valueEl = resultEl.querySelector('.result-item .value');
                valueEl.innerHTML = `${crcl.toFixed(1)} <span class="unit">mL/min</span>`;
                
                resultEl.className = 'result calculated';
            } else {
                // Reset to default values if inputs are invalid
                const valueEl = resultEl.querySelector('.result-item .value');
                valueEl.innerHTML = `-- <span class="unit">mL/min</span>`;
                
                resultEl.className = 'result';
            }
        };

        // Auto-populate patient data
        if (patient && patient.birthDate) {
            ageEl.value = calculateAge(patient.birthDate);
        }
        if (patient && patient.gender) {
            genderEl.value = patient.gender;
        }

        // Auto-populate from FHIR data
        getMostRecentObservation(client, '29463-7').then(obs => { // Weight
            if (obs && obs.valueQuantity) {
                weightEl.value = obs.valueQuantity.value.toFixed(1);
            }
            calculateAndUpdate();
        });
        
        getMostRecentObservation(client, '2160-0').then(obs => { // Serum Creatinine
            if (obs && obs.valueQuantity) {
                scrEl.value = obs.valueQuantity.value.toFixed(2);
            }
            calculateAndUpdate();
        });

        // Add event listeners for automatic calculation
        ageEl.addEventListener('input', calculateAndUpdate);
        weightEl.addEventListener('input', calculateAndUpdate);
        scrEl.addEventListener('input', calculateAndUpdate);
        genderEl.addEventListener('change', calculateAndUpdate);

        // Initial calculation
        calculateAndUpdate();
    }
};
