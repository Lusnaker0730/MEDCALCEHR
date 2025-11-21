import { getMostRecentObservation, calculateAge } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';

export const graceAcs = {
    id: 'grace-acs',
    title: 'GRACE ACS Risk Score',
    description:
        'Estimates admission to 6 month mortality for patients with acute coronary syndrome.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3 class="calculator-title">
                    <span class="title-icon">??</span>
                    ${this.title}
                </h3>
                <p class="calculator-description">${this.description}</p>
            </div>

            <div class="grace-container">
                <div class="grace-section">
                    <h4 class="section-title">
                        <span class="section-icon">??</span>
                        Vital Signs & Demographics
                    </h4>
                    <div class="grace-input-grid">
                        <div class="input-group grace-input-item">
                            <label for="grace-age">
                                <span class="label-text">Age</span>
                                <span class="label-unit">(years)</span>
                            </label>
                            <input type="number" id="grace-age" placeholder="Enter age">
                        </div>
                        <div class="input-group grace-input-item">
                            <label for="grace-hr">
                                <span class="label-text">Heart Rate</span>
                                <span class="label-unit">(bpm)</span>
                            </label>
                            <input type="number" id="grace-hr" placeholder="Enter heart rate">
                        </div>
                        <div class="input-group grace-input-item">
                            <label for="grace-sbp">
                                <span class="label-text">Systolic BP</span>
                                <span class="label-unit">(mmHg)</span>
                            </label>
                            <input type="number" id="grace-sbp" placeholder="Enter systolic BP">
                        </div>
                        <div class="input-group grace-input-item">
                            <label for="grace-creatinine">
                                <span class="label-text">Creatinine</span>
                                <span class="label-unit">(mg/dL)</span>
                            </label>
                            <input type="number" id="grace-creatinine" step="0.1" placeholder="Enter creatinine">
                        </div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">
                        <span>Killip Class</span>
                    </div>
                    <div class="help-text mb-10">Heart failure classification</div>
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" name="grace-killip" value="0" checked>
                            <span>Class I - No heart failure <strong>0</strong></span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="grace-killip" value="20">
                            <span>Class II - Mild HF (rales, S3) <strong>+20</strong></span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="grace-killip" value="39">
                            <span>Class III - Pulmonary edema <strong>+39</strong></span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="grace-killip" value="59">
                            <span>Class IV - Cardiogenic shock <strong>+59</strong></span>
                        </label>
                    </div>
                </div>
                
                <div class="section">
                    <div class="section-title">
                        <span>Cardiac Arrest at Admission</span>
                    </div>
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" name="grace-cardiac-arrest" value="0" checked>
                            <span>No <strong>0</strong></span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="grace-cardiac-arrest" value="39">
                            <span>Yes <strong>+39</strong></span>
                        </label>
                    </div>
                </div>
                
                <div class="section">
                    <div class="section-title">
                        <span>ST Segment Deviation</span>
                    </div>
                    <div class="help-text mb-10">On ECG</div>
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" name="grace-st-deviation" value="0" checked>
                            <span>No <strong>0</strong></span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="grace-st-deviation" value="28">
                            <span>Yes <strong>+28</strong></span>
                        </label>
                    </div>
                </div>
                
                <div class="section">
                    <div class="section-title">
                        <span>Abnormal Cardiac Enzymes</span>
                    </div>
                    <div class="help-text mb-10">Troponin elevation</div>
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" name="grace-cardiac-enzymes" value="0" checked>
                            <span>No <strong>0</strong></span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="grace-cardiac-enzymes" value="14">
                            <span>Yes <strong>+14</strong></span>
                        </label>
                    </div>
                </div>
            </div>

            <div id="grace-result" class="result-container" style="display:none;"></div>
        `;
    },
    initialize: function (client, patient, container) {
        // Use container or document
        const root = container || document;

        // Auto-populate age
        const ageInput = root.querySelector('#grace-age');
        if (ageInput) {
            ageInput.value = calculateAge(patient.birthDate);
        }

        // Auto-populate heart rate
        getMostRecentObservation(client, LOINC_CODES.HEART_RATE).then(obs => {
            const hrInput = root.querySelector('#grace-hr');
            if (obs && obs.valueQuantity && hrInput) {
                hrInput.value = Math.round(obs.valueQuantity.value);
            }
        });

        // Auto-populate systolic blood pressure
        getMostRecentObservation(client, LOINC_CODES.SYSTOLIC_BP).then(obs => {
            const sbpInput = root.querySelector('#grace-sbp');
            if (obs && obs.valueQuantity && sbpInput) {
                sbpInput.value = Math.round(obs.valueQuantity.value);
            }
        });

        // Auto-populate creatinine
        getMostRecentObservation(client, LOINC_CODES.CREATININE).then(obs => {
            const crInput = root.querySelector('#grace-creatinine');
            if (obs && obs.valueQuantity && crInput) {
                let crValue = obs.valueQuantity.value;
                // Convert if needed (Âµmol/L to mg/dL: divide by 88.4)
                if (obs.valueQuantity.unit === 'Âµmol/L' || obs.valueQuantity.unit === 'umol/L') {
                    crValue = crValue / 88.4;
                }
                crInput.value = crValue.toFixed(2);
            }
        });

        // Calculate function
        const calculate = () => {
            const age = parseInt(root.querySelector('#grace-age').value);
            const hr = parseInt(root.querySelector('#grace-hr').value);
            const sbp = parseInt(root.querySelector('#grace-sbp').value);
            const creatinine = parseFloat(root.querySelector('#grace-creatinine').value);

            const killipRadio = root.querySelector('input[name="grace-killip"]:checked');
            const arrestRadio = root.querySelector('input[name="grace-cardiac-arrest"]:checked');
            const stRadio = root.querySelector('input[name="grace-st-deviation"]:checked');
            const enzymesRadio = root.querySelector('input[name="grace-cardiac-enzymes"]:checked');

            const killip = killipRadio ? parseInt(killipRadio.value) : 0;
            const arrest = arrestRadio ? parseInt(arrestRadio.value) : 0;
            const st = stRadio ? parseInt(stRadio.value) : 0;
            const enzymes = enzymesRadio ? parseInt(enzymesRadio.value) : 0;

            // Skip calculation if inputs are not yet provided (silent fail)
            if (isNaN(age) || isNaN(hr) || isNaN(sbp) || isNaN(creatinine)) {
                root.querySelector('#grace-result').style.display = 'none';
                return;
            }

            let agePoints = 0;
            if (age >= 40 && age <= 49) {
                agePoints = 18;
            } else if (age >= 50 && age <= 59) {
                agePoints = 36;
            } else if (age >= 60 && age <= 69) {
                agePoints = 55;
            } else if (age >= 70 && age <= 79) {
                agePoints = 73;
            } else if (age >= 80) {
                agePoints = 91;
            }

            let hrPoints = 0;
            if (hr >= 50 && hr <= 69) {
                hrPoints = 0;
            } else if (hr >= 70 && hr <= 89) {
                hrPoints = 3;
            } else if (hr >= 90 && hr <= 109) {
                hrPoints = 7;
            } else if (hr >= 110 && hr <= 149) {
                hrPoints = 13;
            } else if (hr >= 150 && hr <= 199) {
                hrPoints = 23;
            } else if (hr >= 200) {
                hrPoints = 36;
            }

            let sbpPoints = 0;
            if (sbp >= 200) {
                sbpPoints = 0;
            } else if (sbp >= 160 && sbp <= 199) {
                sbpPoints = 10;
            } else if (sbp >= 140 && sbp <= 159) {
                sbpPoints = 18;
            } else if (sbp >= 120 && sbp <= 139) {
                sbpPoints = 24;
            } else if (sbp >= 100 && sbp <= 119) {
                sbpPoints = 34;
            } else if (sbp >= 80 && sbp <= 99) {
                sbpPoints = 43;
            } else if (sbp < 80) {
                sbpPoints = 53;
            }

            let crPoints = 0;
            if (creatinine >= 0 && creatinine <= 0.39) {
                crPoints = 1;
            } else if (creatinine >= 0.4 && creatinine <= 0.79) {
                crPoints = 4;
            } else if (creatinine >= 0.8 && creatinine <= 1.19) {
                crPoints = 7;
            } else if (creatinine >= 1.2 && creatinine <= 1.59) {
                crPoints = 10;
            } else if (creatinine >= 1.6 && creatinine <= 1.99) {
                crPoints = 13;
            } else if (creatinine >= 2.0 && creatinine <= 3.99) {
                crPoints = 21;
            } else if (creatinine >= 4.0) {
                crPoints = 28;
            }

            const totalScore =
                agePoints + hrPoints + sbpPoints + crPoints + killip + arrest + st + enzymes;

            // GRACE 2.0 Risk estimation for in-hospital mortality
            let inHospitalMortality = '<1%';
            let riskLevel = 'low';
            let riskColor = '#10b981';
            let riskIcon = '??;
            let riskDescription = 'Low risk of in-hospital mortality';

            if (totalScore > 140) {
                inHospitalMortality = '>3%';
                riskLevel = 'high';
                riskColor = '#ef4444';
                riskIcon = '??;
                riskDescription =
                    'High risk of in-hospital mortality - Consider intensive monitoring and aggressive intervention';
            } else if (totalScore > 118) {
                inHospitalMortality = '1-3%';
                riskLevel = 'intermediate';
                riskColor = '#f59e0b';
                riskIcon = '??;
                riskDescription =
                    'Intermediate risk of in-hospital mortality - Close monitoring recommended';
            }

            root.querySelector('#grace-result').innerHTML = `
                <div class="grace-result-card" style="border-left-color: ${riskColor}">
                    <div class="result-header">
                        <span class="result-icon" style="color: ${riskColor}">${riskIcon}</span>
                        <h4 class="result-title">GRACE ACS Risk Assessment</h4>
                    </div>
                    
                    <div class="grace-score-display">
                        <div class="score-main">
                            <span class="score-label">GRACE Score</span>
                            <span class="score-value" style="color: ${riskColor}">${totalScore}</span>
                        </div>
                        <div class="score-divider"></div>
                        <div class="score-risk">
                            <span class="risk-label">In-Hospital Mortality Risk</span>
                            <span class="risk-value" style="background: ${riskColor}">${inHospitalMortality}</span>
                            <span class="risk-category" style="color: ${riskColor}">${riskLevel.toUpperCase()} RISK</span>
                        </div>
                    </div>

                    <div class="risk-interpretation" style="background: ${riskColor}15; border-color: ${riskColor}">
                        <div class="interpretation-icon" style="color: ${riskColor}">?¹ï?</div>
                        <div class="interpretation-text">
                            <strong>Clinical Interpretation:</strong><br>
                            ${riskDescription}
                        </div>
                    </div>

                    <div class="score-breakdown">
                        <h5 class="breakdown-title">Score Components:</h5>
                        <div class="breakdown-grid">
                            <div class="breakdown-item">
                                <span class="breakdown-label">Age</span>
                                <span class="breakdown-points">${agePoints} pts</span>
                            </div>
                            <div class="breakdown-item">
                                <span class="breakdown-label">Heart Rate</span>
                                <span class="breakdown-points">${hrPoints} pts</span>
                            </div>
                            <div class="breakdown-item">
                                <span class="breakdown-label">Systolic BP</span>
                                <span class="breakdown-points">${sbpPoints} pts</span>
                            </div>
                            <div class="breakdown-item">
                                <span class="breakdown-label">Creatinine</span>
                                <span class="breakdown-points">${crPoints} pts</span>
                            </div>
                            <div class="breakdown-item">
                                <span class="breakdown-label">Killip Class</span>
                                <span class="breakdown-points">${killip} pts</span>
                            </div>
                            <div class="breakdown-item">
                                <span class="breakdown-label">Cardiac Arrest</span>
                                <span class="breakdown-points">${arrest} pts</span>
                            </div>
                            <div class="breakdown-item">
                                <span class="breakdown-label">ST Deviation</span>
                                <span class="breakdown-points">${st} pts</span>
                            </div>
                            <div class="breakdown-item">
                                <span class="breakdown-label">Cardiac Enzymes</span>
                                <span class="breakdown-points">${enzymes} pts</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            root.querySelector('#grace-result').style.display = 'block';
        };

        // Add visual feedback for radio options
        const radioOptions = root.querySelectorAll('.radio-option');
        radioOptions.forEach(option => {
            option.addEventListener('click', function () {
                const radio = this.querySelector('input[type="radio"]');
                const group = radio.name;

                root.querySelectorAll(`input[name="${group}"]`).forEach(r => {
                    r.parentElement.classList.remove('selected');
                });

                this.classList.add('selected');
                radio.checked = true;
                calculate();
            });
        });

        // Initialize selected state
        radioOptions.forEach(option => {
            const radio = option.querySelector('input[type="radio"]');
            if (radio.checked) {
                option.classList.add('selected');
            }
        });

        // Add event listeners for automatic calculation
        root.querySelector('#grace-age').addEventListener('input', calculate);
        root.querySelector('#grace-hr').addEventListener('input', calculate);
        root.querySelector('#grace-sbp').addEventListener('input', calculate);
        root.querySelector('#grace-creatinine').addEventListener('input', calculate);

        // Initial calculation
        calculate();
    }
};
