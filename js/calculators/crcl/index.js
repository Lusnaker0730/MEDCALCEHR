import {
    getMostRecentObservation,
    calculateAge,
    createUnitSelector,
    initializeUnitConversion,
    getValueInStandardUnit
} from '../../utils.js';

export const crcl = {
    id: 'crcl',
    title: 'Creatinine Clearance (Cockcroft-Gault Equation)',
    description: 'Calculates CrCl according to the Cockcroft-Gault equation.',
    generateHTML: function () {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <div class="input-group">
                <label>Age (years)</label>
                <input type="number" id="crcl-age" placeholder="e.g., 65">
            </div>
            <div class="input-group">
                <label>Weight:</label>
                ${createUnitSelector('crcl-weight', 'weight', ['kg', 'lbs'], 'kg')}
            </div>
            <div class="input-group">
                <label>Serum Creatinine:</label>
                ${createUnitSelector('crcl-scr', 'creatinine', ['mg/dL', 'µmol/L'], 'mg/dL')}
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
    initialize: function (client, patient, container) {
        const ageEl = container.querySelector('#crcl-age');
        const genderEl = container.querySelector('#crcl-gender');
        const resultEl = container.querySelector('#crcl-result');

        // Function to calculate and update results
        const calculateAndUpdate = () => {
            const age = parseInt(ageEl.value);
            const weightKg = getValueInStandardUnit(container, 'crcl-weight', 'kg');
            const scrMgDl = getValueInStandardUnit(container, 'crcl-scr', 'mg/dL');
            const gender = genderEl.value;

            if (!isNaN(age) && weightKg > 0 && scrMgDl > 0 && age > 0) {
                let crcl = ((140 - age) * weightKg) / (72 * scrMgDl);
                if (gender === 'female') {
                    crcl *= 0.85;
                }

                // Determine kidney function category
                let category = '';
                let categoryColor = '';
                if (crcl >= 90) {
                    category = 'Normal kidney function';
                    categoryColor = '#4caf50';
                } else if (crcl >= 60) {
                    category = 'Mild reduction';
                    categoryColor = '#8bc34a';
                } else if (crcl >= 30) {
                    category = 'Moderate reduction';
                    categoryColor = '#ff9800';
                } else if (crcl >= 15) {
                    category = 'Severe reduction';
                    categoryColor = '#ff5722';
                } else {
                    category = 'Kidney failure';
                    categoryColor = '#f44336';
                }

                // Update result display
                const valueEl = resultEl.querySelector('.result-item .value');
                valueEl.innerHTML = `
                    <div style="font-size: 2em; font-weight: bold;">${crcl.toFixed(1)}</div>
                    <div style="font-size: 0.9em; margin-top: 5px;">mL/min</div>
                    <div style="margin-top: 10px; padding: 8px; background: ${categoryColor}; color: white; border-radius: 5px; font-size: 0.9em;">
                        ${category}
                    </div>
                `;

                resultEl.className = 'result calculated';
            } else {
                // Reset to default values if inputs are invalid
                const valueEl = resultEl.querySelector('.result-item .value');
                valueEl.innerHTML = '-- <span class="unit">mL/min</span>';

                resultEl.className = 'result';
            }
        };

        // Initialize unit conversions
        initializeUnitConversion(container, 'crcl-weight', calculateAndUpdate);
        initializeUnitConversion(container, 'crcl-scr', calculateAndUpdate);

        // Auto-populate patient data
        if (patient && patient.birthDate) {
            ageEl.value = calculateAge(patient.birthDate);
        }
        if (patient && patient.gender) {
            genderEl.value = patient.gender;
        }

        // Auto-populate from FHIR data
        getMostRecentObservation(client, '29463-7').then(obs => {
            // Weight
            if (obs && obs.valueQuantity) {
                const weightInput = container.querySelector('#crcl-weight');
                if (weightInput) {
                    weightInput.value = obs.valueQuantity.value.toFixed(1);
                }
            }
            calculateAndUpdate();
        });

        getMostRecentObservation(client, '2160-0').then(obs => {
            // Serum Creatinine
            if (obs && obs.valueQuantity) {
                const scrInput = container.querySelector('#crcl-scr');
                if (scrInput) {
                    scrInput.value = obs.valueQuantity.value.toFixed(2);
                }
            }
            calculateAndUpdate();
        });

        // Add event listeners for automatic calculation
        ageEl.addEventListener('input', calculateAndUpdate);
        genderEl.addEventListener('change', calculateAndUpdate);

        // Initial calculation
        calculateAndUpdate();
    }
};
