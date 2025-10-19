
export const graceAcs = {
    id: 'grace-acs',
    title: 'GRACE ACS Risk Score',
    description: 'Estimates admission to 6 month mortality for patients with acute coronary syndrome.',
    generateHTML: function() {
        return `
            <div class="calculator-header">
                <h3 class="calculator-title">
                    <span class="title-icon">🫀</span>
                    ${this.title}
                </h3>
                <p class="calculator-description">${this.description}</p>
            </div>

            <div class="grace-container">
                <div class="grace-section">
                    <h4 class="section-title">
                        <span class="section-icon">📊</span>
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

                <div class="grace-section">
                    <h4 class="section-title">
                        <span class="section-icon">🏥</span>
                        Clinical Parameters
                    </h4>
                    <div class="grace-select-grid">
                        <div class="select-group">
                            <label for="grace-killip">
                                <span class="label-text">Killip Class</span>
                                <span class="label-helper">Heart failure classification</span>
                            </label>
                            <select id="grace-killip" class="modern-select">
                                <option value="0">Class I - No heart failure</option>
                                <option value="20">Class II - Mild heart failure (rales, S3)</option>
                                <option value="39">Class III - Pulmonary edema</option>
                                <option value="59">Class IV - Cardiogenic shock</option>
                            </select>
                        </div>
                        <div class="select-group">
                            <label for="grace-cardiac-arrest">
                                <span class="label-text">Cardiac Arrest at Admission</span>
                            </label>
                            <select id="grace-cardiac-arrest" class="modern-select">
                                <option value="0">No</option>
                                <option value="39">Yes</option>
                            </select>
                        </div>
                        <div class="select-group">
                            <label for="grace-st-deviation">
                                <span class="label-text">ST Segment Deviation</span>
                                <span class="label-helper">On ECG</span>
                            </label>
                            <select id="grace-st-deviation" class="modern-select">
                                <option value="0">No</option>
                                <option value="28">Yes</option>
                            </select>
                        </div>
                        <div class="select-group">
                            <label for="grace-cardiac-enzymes">
                                <span class="label-text">Abnormal Cardiac Enzymes</span>
                                <span class="label-helper">Troponin elevation</span>
                            </label>
                            <select id="grace-cardiac-enzymes" class="modern-select">
                                <option value="0">No</option>
                                <option value="14">Yes</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div class="button-container">
                <button id="calculate-grace" class="calculate-btn">
                    <span class="btn-icon">🔍</span>
                    Calculate Risk Score
                </button>
            </div>

            <div id="grace-result" class="result-container" style="display:none;"></div>
        `;
    },
    initialize: function(client, patient) {
        // Helper function to mark field as auto-populated
        const markAutoFilled = (element) => {
            if (element) {
                element.style.background = '#e6f7ff';
                element.style.borderColor = '#91d5ff';
                element.title = '✓ Auto-populated from patient data';
            }
        };

        // Auto-populate age from patient data
        if (patient && patient.birthDate) {
            const birthDate = new Date(patient.birthDate);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            
            const ageInput = document.getElementById('grace-age');
            if (ageInput && age > 0) {
                ageInput.value = age;
                markAutoFilled(ageInput);
            }
        }

        // Try to auto-populate vital signs from FHIR observations
        if (client) {
            // Heart Rate (8867-4 is LOINC for heart rate)
            client.patient.request('Observation?code=8867-4&_sort=-date&_count=1')
                .then(response => {
                    if (response.entry && response.entry.length > 0) {
                        const obs = response.entry[0].resource;
                        const hrInput = document.getElementById('grace-hr');
                        if (obs.valueQuantity && hrInput && !hrInput.value) {
                            hrInput.value = Math.round(obs.valueQuantity.value);
                            markAutoFilled(hrInput);
                        }
                    }
                })
                .catch(err => console.log('Heart rate not available'));

            // Systolic Blood Pressure (8480-6 is LOINC for systolic BP)
            client.patient.request('Observation?code=8480-6&_sort=-date&_count=1')
                .then(response => {
                    if (response.entry && response.entry.length > 0) {
                        const obs = response.entry[0].resource;
                        const sbpInput = document.getElementById('grace-sbp');
                        if (obs.valueQuantity && sbpInput && !sbpInput.value) {
                            sbpInput.value = Math.round(obs.valueQuantity.value);
                            markAutoFilled(sbpInput);
                        }
                    }
                })
                .catch(err => console.log('Blood pressure not available'));

            // Creatinine (2160-0 is LOINC for serum creatinine)
            client.patient.request('Observation?code=2160-0&_sort=-date&_count=1')
                .then(response => {
                    if (response.entry && response.entry.length > 0) {
                        const obs = response.entry[0].resource;
                        const crInput = document.getElementById('grace-creatinine');
                        if (obs.valueQuantity && crInput && !crInput.value) {
                            let crValue = obs.valueQuantity.value;
                            // Convert if needed (µmol/L to mg/dL: divide by 88.4)
                            if (obs.valueQuantity.unit === 'µmol/L' || obs.valueQuantity.unit === 'umol/L') {
                                crValue = crValue / 88.4;
                            }
                            crInput.value = crValue.toFixed(2);
                            markAutoFilled(crInput);
                        }
                    }
                })
                .catch(err => console.log('Creatinine not available'));
        }

        document.getElementById('calculate-grace').addEventListener('click', () => {
            const age = parseInt(document.getElementById('grace-age').value);
            const hr = parseInt(document.getElementById('grace-hr').value);
            const sbp = parseInt(document.getElementById('grace-sbp').value);
            const creatinine = parseFloat(document.getElementById('grace-creatinine').value);
            const killip = parseInt(document.getElementById('grace-killip').value);
            const arrest = parseInt(document.getElementById('grace-cardiac-arrest').value);
            const st = parseInt(document.getElementById('grace-st-deviation').value);
            const enzymes = parseInt(document.getElementById('grace-cardiac-enzymes').value);

            if (isNaN(age) || isNaN(hr) || isNaN(sbp) || isNaN(creatinine)) {
                alert('⚠️ Please fill out all fields.');
                return;
            }

            let agePoints = 0;
            if (age >= 40 && age <= 49) agePoints = 18; 
            else if (age >= 50 && age <= 59) agePoints = 36; 
            else if (age >= 60 && age <= 69) agePoints = 55; 
            else if (age >= 70 && age <= 79) agePoints = 73; 
            else if (age >= 80) agePoints = 91;

            let hrPoints = 0;
            if (hr >= 50 && hr <= 69) hrPoints = 0;
            else if (hr >= 70 && hr <= 89) hrPoints = 3;
            else if (hr >= 90 && hr <= 109) hrPoints = 7; 
            else if (hr >= 110 && hr <= 149) hrPoints = 13; 
            else if (hr >= 150 && hr <= 199) hrPoints = 23; 
            else if (hr >= 200) hrPoints = 36;

            let sbpPoints = 0;
            if (sbp >= 200) sbpPoints = 0;
            else if (sbp >= 160 && sbp <= 199) sbpPoints = 10;
            else if (sbp >= 140 && sbp <= 159) sbpPoints = 18;
            else if (sbp >= 120 && sbp <= 139) sbpPoints = 24;
            else if (sbp >= 100 && sbp <= 119) sbpPoints = 34; 
            else if (sbp >= 80 && sbp <= 99) sbpPoints = 43; 
            else if (sbp < 80) sbpPoints = 53;

            let crPoints = 0;
            if (creatinine >= 0 && creatinine <= 0.39) crPoints = 1;
            else if (creatinine >= 0.4 && creatinine <= 0.79) crPoints = 4; 
            else if (creatinine >= 0.8 && creatinine <= 1.19) crPoints = 7; 
            else if (creatinine >= 1.2 && creatinine <= 1.59) crPoints = 10;
            else if (creatinine >= 1.6 && creatinine <= 1.99) crPoints = 13; 
            else if (creatinine >= 2.0 && creatinine <= 3.99) crPoints = 21;
            else if (creatinine >= 4.0) crPoints = 28;

            const totalScore = agePoints + hrPoints + sbpPoints + crPoints + killip + arrest + st + enzymes;
            
            // GRACE 2.0 Risk estimation for in-hospital mortality
            let inHospitalMortality = "<1%";
            let riskLevel = "low";
            let riskColor = "#10b981";
            let riskIcon = "✓";
            let riskDescription = "Low risk of in-hospital mortality";
            
            if (totalScore > 140) {
                inHospitalMortality = ">3%";
                riskLevel = "high";
                riskColor = "#ef4444";
                riskIcon = "⚠";
                riskDescription = "High risk of in-hospital mortality - Consider intensive monitoring and aggressive intervention";
            } else if (totalScore > 118) {
                inHospitalMortality = "1-3%";
                riskLevel = "intermediate";
                riskColor = "#f59e0b";
                riskIcon = "⚡";
                riskDescription = "Intermediate risk of in-hospital mortality - Close monitoring recommended";
            }

            document.getElementById('grace-result').innerHTML = `
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
                        <div class="interpretation-icon" style="color: ${riskColor}">ℹ️</div>
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
            document.getElementById('grace-result').style.display = 'block';
            document.getElementById('grace-result').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    }
};
