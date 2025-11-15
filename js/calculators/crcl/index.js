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
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            <div class="section">
                <div class="section-title">
                    <span>Patient Information</span>
                </div>
                
                <div class="section-subtitle">Gender</div>
                <div class="radio-group">
                    <label class="radio-option">
                        <input type="radio" name="crcl-gender" value="male" checked>
                        <span>Male</span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="crcl-gender" value="female">
                        <span>Female</span>
                    </label>
                </div>
                
                <div class="input-row mt-15">
                    <label for="crcl-age">Age</label>
                    <div class="input-with-unit">
                        <input type="number" id="crcl-age" placeholder="e.g., 65">
                        <span>years</span>
                    </div>
                </div>
                <div class="input-group mt-10">
                    <label>Weight:</label>
                    ${createUnitSelector('crcl-weight', 'weight', ['kg', 'lbs'], 'kg')}
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">
                    <span>Lab Values</span>
                </div>
                <div class="input-group">
                    <label>Serum Creatinine:</label>
                    ${createUnitSelector('crcl-scr', 'creatinine', ['mg/dL', 'µmol/L'], 'mg/dL')}
                </div>
            </div>
            
            <div class="result-container" id="crcl-result" style="display:none;"></div>
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
        const resultEl = container.querySelector('#crcl-result');

        // Function to calculate and update results
        const calculateAndUpdate = () => {
            const age = parseInt(ageEl.value);
            const weightKg = getValueInStandardUnit(container, 'crcl-weight', 'kg');
            const scrMgDl = getValueInStandardUnit(container, 'crcl-scr', 'mg/dL');
            const genderRadio = container.querySelector('input[name="crcl-gender"]:checked');
            const gender = genderRadio ? genderRadio.value : 'male';

            // Skip calculation if inputs are not yet provided
            if (!age || !weightKg || !scrMgDl || isNaN(age) || isNaN(weightKg) || isNaN(scrMgDl)) {
                resultEl.style.display = 'none';
                return;
            }

            if (!isNaN(age) && weightKg > 0 && scrMgDl > 0 && age > 0) {
                let crcl = ((140 - age) * weightKg) / (72 * scrMgDl);
                if (gender === 'female') {
                    crcl *= 0.85;
                }

                // Determine kidney function category and severity
                let category = '';
                let severityClass = 'low';
                let alertType = 'info';
                let alertMsg = '';

                if (crcl >= 90) {
                    category = 'Normal kidney function';
                    severityClass = 'low';
                    alertMsg = 'Normal creatinine clearance.';
                } else if (crcl >= 60) {
                    category = 'Mild reduction';
                    severityClass = 'low';
                    alertMsg = 'Mildly reduced creatinine clearance.';
                } else if (crcl >= 30) {
                    category = 'Moderate reduction';
                    severityClass = 'moderate';
                    alertMsg =
                        'Moderate reduction in kidney function. Consider nephrology referral and dose adjustment for renally cleared medications.';
                    alertType = 'warning';
                } else if (crcl >= 15) {
                    category = 'Severe reduction';
                    severityClass = 'high';
                    alertMsg =
                        'Severe reduction in kidney function. Nephrology referral required. Careful medication dosing adjustments necessary.';
                    alertType = 'warning';
                } else {
                    category = 'Kidney failure';
                    severityClass = 'high';
                    alertMsg =
                        'Kidney failure. Consider dialysis or transplantation. Avoid renally cleared medications.';
                    alertType = 'warning';
                }

                // Update result display
                resultEl.innerHTML = `
                    <div class="result-header">
                        <h4>Creatinine Clearance Results</h4>
                    </div>
                    
                    <div class="result-score">
                        <span class="result-score-value">${crcl.toFixed(1)}</span>
                        <span class="result-score-unit">mL/min</span>
                    </div>
                    
                    <div class="severity-indicator ${severityClass} mt-20">
                        <span class="severity-indicator-text">${category}</span>
                    </div>
                    
                    <div class="alert ${alertType} mt-20">
                        <span class="alert-icon">${alertType === 'warning' ? '⚠️' : 'ℹ️'}</span>
                        <div class="alert-content">
                            <p>${alertMsg}</p>
                        </div>
                    </div>
                `;

                resultEl.style.display = 'block';
                resultEl.classList.add('show');
            } else {
                resultEl.style.display = 'none';
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
            const genderValue = patient.gender.toLowerCase() === 'female' ? 'female' : 'male';
            const genderRadio = container.querySelector(
                `input[name="crcl-gender"][value="${genderValue}"]`
            );
            if (genderRadio) {
                genderRadio.checked = true;
                genderRadio.parentElement.classList.add('selected');
            }
        }

        // Add visual feedback for radio options
        const radioOptions = container.querySelectorAll('.radio-option');
        radioOptions.forEach(option => {
            option.addEventListener('click', function () {
                const radio = this.querySelector('input[type="radio"]');
                const group = radio.name;

                container.querySelectorAll(`input[name="${group}"]`).forEach(r => {
                    r.parentElement.classList.remove('selected');
                });

                this.classList.add('selected');
                radio.checked = true;
                calculateAndUpdate();
            });
        });

        // Initialize selected state
        radioOptions.forEach(option => {
            const radio = option.querySelector('input[type="radio"]');
            if (radio.checked) {
                option.classList.add('selected');
            }
        });

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

        // Initial calculation
        calculateAndUpdate();
    }
};
