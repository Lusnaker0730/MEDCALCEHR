// js/calculators/mdrd-gfr.js
import {
    getMostRecentObservation,
    calculateAge,
    createUnitSelector,
    initializeUnitConversion,
    getValueInStandardUnit
} from '../../utils.js';

export const mdrdGfr = {
    id: 'mdrd-gfr',
    title: 'MDRD GFR Equation',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">Estimates GFR using the MDRD equation. Note: CKD-EPI is now preferred for most patients.</p>
            </div>
            
            <div class="alert warning">
                <span class="alert-icon">⚠️</span>
                <div class="alert-content">
                    <p><strong>Note:</strong> MDRD is less accurate at higher GFR values (>60). Consider using CKD-EPI for general use.</p>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">
                    <span>Patient Information</span>
                </div>
                
                <div class="section-subtitle">Gender</div>
                <div class="radio-group">
                    <label class="radio-option">
                        <input type="radio" name="mdrd-gender" value="male" checked>
                        <span>Male</span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="mdrd-gender" value="female">
                        <span>Female</span>
                    </label>
                </div>
                
                <div class="section-subtitle mt-15">Race</div>
                <div class="radio-group">
                    <label class="radio-option">
                        <input type="radio" name="mdrd-race" value="non-aa" checked>
                        <span>Non-African American</span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="mdrd-race" value="aa">
                        <span>African American</span>
                    </label>
                </div>
                
                <div class="input-row mt-15">
                    <label for="mdrd-age">Age</label>
                    <div class="input-with-unit">
                        <input type="number" id="mdrd-age" placeholder="e.g., 65">
                        <span>years</span>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">
                    <span>Lab Values</span>
                </div>
                <div class="input-group">
                    <label for="mdrd-creatinine">Serum Creatinine:</label>
                    ${createUnitSelector('mdrd-creatinine', 'creatinine', ['mg/dL', 'µmol/L'], 'mg/dL')}
                </div>
            </div>
            
            <div class="result-container" id="mdrd-result" style="display:none;"></div>
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
    initialize: function (client, patient, container) {
        const ageInput = container.querySelector('#mdrd-age');
        const resultEl = container.querySelector('#mdrd-result');

        // Function to calculate and update results
        const calculateAndUpdate = () => {
            // Get creatinine in mg/dL (standard unit)
            const creatinineMgDl = getValueInStandardUnit(container, 'mdrd-creatinine', 'mg/dL');
            const age = parseFloat(ageInput.value);
            const genderRadio = container.querySelector('input[name="mdrd-gender"]:checked');
            const raceRadio = container.querySelector('input[name="mdrd-race"]:checked');
            const isFemale = genderRadio ? genderRadio.value === 'female' : false;
            const isAA = raceRadio ? raceRadio.value === 'aa' : false;

            // Skip calculation if inputs are not yet provided
            if (!creatinineMgDl || !age || isNaN(creatinineMgDl) || isNaN(age)) {
                resultEl.style.display = 'none';
                return;
            }

            if (creatinineMgDl > 0 && age > 0) {
                let gfr = 175 * Math.pow(creatinineMgDl, -1.154) * Math.pow(age, -0.203);
                if (isFemale) {
                    gfr *= 0.742;
                }
                if (isAA) {
                    gfr *= 1.212;
                }

                // Determine CKD stage and severity
                let stage = '';
                let severityClass = 'low';
                let alertType = 'info';
                let alertMsg = '';
                
                if (gfr >= 90) {
                    stage = 'Stage 1 (Normal or high)';
                    severityClass = 'low';
                    alertMsg = 'Normal kidney function.';
                } else if (gfr >= 60) {
                    stage = 'Stage 2 (Mild)';
                    severityClass = 'low';
                    alertMsg = 'Mildly decreased kidney function.';
                } else if (gfr >= 45) {
                    stage = 'Stage 3a (Mild to moderate)';
                    severityClass = 'moderate';
                    alertMsg = 'Mild to moderate reduction in kidney function.';
                } else if (gfr >= 30) {
                    stage = 'Stage 3b (Moderate to severe)';
                    severityClass = 'moderate';
                    alertMsg = 'Moderate to severe reduction in kidney function. Consider nephrology referral.';
                    alertType = 'warning';
                } else if (gfr >= 15) {
                    stage = 'Stage 4 (Severe)';
                    severityClass = 'high';
                    alertMsg = 'Severe reduction in kidney function. Nephrology referral required.';
                    alertType = 'warning';
                } else {
                    stage = 'Stage 5 (Kidney failure)';
                    severityClass = 'high';
                    alertMsg = 'Kidney failure. Consider dialysis or transplantation.';
                    alertType = 'warning';
                }

                // Update result display
                resultEl.innerHTML = `
                    <div class="result-header">
                        <h4>eGFR Results (MDRD)</h4>
                    </div>
                    
                    <div class="result-score">
                        <span class="result-score-value">${gfr.toFixed(0)}</span>
                        <span class="result-score-unit">mL/min/1.73m²</span>
                    </div>
                    
                    <div class="severity-indicator ${severityClass} mt-20">
                        <span class="severity-indicator-text">${stage}</span>
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

        // Initialize unit conversion for creatinine
        initializeUnitConversion(container, 'mdrd-creatinine', calculateAndUpdate);

        // Auto-populate patient data
        if (patient && patient.birthDate) {
            ageInput.value = calculateAge(patient.birthDate);
        }
        if (patient && patient.gender) {
            const genderValue = patient.gender.toLowerCase() === 'female' ? 'female' : 'male';
            const genderRadio = container.querySelector(`input[name="mdrd-gender"][value="${genderValue}"]`);
            if (genderRadio) {
                genderRadio.checked = true;
                genderRadio.parentElement.classList.add('selected');
            }
        }
        
        // Add visual feedback for radio options
        const radioOptions = container.querySelectorAll('.radio-option');
        radioOptions.forEach(option => {
            option.addEventListener('click', function() {
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
        getMostRecentObservation(client, '2160-0').then(obs => {
            if (obs && obs.valueQuantity) {
                const creatinineInput = container.querySelector('#mdrd-creatinine');
                if (creatinineInput) {
                    creatinineInput.value = obs.valueQuantity.value.toFixed(2);
                }
            }
            // Calculate initial results if data was populated
            calculateAndUpdate();
        });

        // Add event listeners for automatic calculation
        ageInput.addEventListener('input', calculateAndUpdate);

        // Initial calculation
        calculateAndUpdate();
    }
};
