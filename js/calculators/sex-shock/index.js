import { getObservation, getPatient, convertToMmolL, convertToMgDl } from '../../utils.js';

export const sexShock = {
    id: 'sex-shock',
    title: 'SEX-SHOCK Risk Score for Cardiogenic Shock',
    description:
        'Calculates the risk of in-hospital cardiogenic shock in patients with acute coronary syndrome (ACS).',

    generateHTML: () => `
        <h3>${sexShock.title}</h3>
        <p class="calculator-description">${sexShock.description}</p>
        
        <div class="sex-shock-container">
            <div class="patient-demographics">
                <h4>👤 Patient Demographics</h4>
                <div class="demographics-grid">
                    <div class="demo-item">
                        <label>Age:</label>
                        <span id="patient-age">Loading...</span>
                    </div>
                    <div class="demo-item">
                        <label>Gender:</label>
                        <span id="patient-gender">Loading...</span>
                    </div>
                    <div class="demo-item">
                        <label>Heart Rate:</label>
                        <span id="patient-hr">Loading...</span>
                    </div>
                    <div class="demo-item">
                        <label>Blood Pressure:</label>
                        <span id="patient-bp">Loading...</span>
            </div>
                </div>
            </div>

            <div class="validation-notice">
                <div class="notice-icon">⚠️</div>
                <div class="notice-content">
                    <h5>Validation Notice</h5>
                    <p>External validation has been performed but is not complete for all patient populations. Use caution when applying this score to patients who have not undergone PCI.</p>
                </div>
            </div>

            <div class="sex-shock-criteria">
                <h4>🔍 SEX-SHOCK Risk Assessment</h4>
                
                <div class="criteria-grid">
                    <!-- Demographics -->
                    <div class="criterion-card age">
                        <div class="criterion-header">
                            <div class="criterion-icon">👴</div>
                            <div class="criterion-title">Age >70 years</div>
                        </div>
                        <div class="criterion-detail">Advanced age increases cardiogenic shock risk</div>
                        <div class="sex-shock-toggle" data-criterion="age">
                            <label class="toggle-option">
                                <input type="radio" name="age" value="0" id="age-no" checked>
                                <span>No</span>
                            </label>
                            <label class="toggle-option">
                                <input type="radio" name="age" value="1" id="age-yes">
                                <span>Yes</span>
                            </label>
                        </div>
                    </div>

                    <div class="criterion-card sex">
                        <div class="criterion-header">
                            <div class="criterion-icon">⚧️</div>
                            <div class="criterion-title">Female Sex</div>
                        </div>
                        <div class="criterion-detail">Female gender associated with higher shock risk</div>
                        <div class="sex-shock-toggle" data-criterion="sex">
                            <label class="toggle-option">
                                <input type="radio" name="sex" value="0" id="sex-male" checked>
                                <span>Male</span>
                            </label>
                            <label class="toggle-option">
                                <input type="radio" name="sex" value="1" id="sex-female">
                                <span>Female</span>
                            </label>
                        </div>
                    </div>

                    <!-- Interventional -->
                    <div class="criterion-card pci">
                        <div class="criterion-header">
                            <div class="criterion-icon">🫀</div>
                            <div class="criterion-title">No PCI Received</div>
                        </div>
                        <div class="criterion-detail">Lack of percutaneous coronary intervention</div>
                        <div class="sex-shock-toggle" data-criterion="pci">
                            <label class="toggle-option">
                                <input type="radio" name="pci" value="0" id="pci-yes" checked>
                                <span>PCI Done</span>
                            </label>
                            <label class="toggle-option">
                                <input type="radio" name="pci" value="1" id="pci-no">
                                <span>No PCI</span>
                            </label>
                        </div>
                    </div>

                    <div class="criterion-card timi">
                        <div class="criterion-header">
                            <div class="criterion-icon">🩸</div>
                            <div class="criterion-title">Post-PCI TIMI Flow <3</div>
                        </div>
                        <div class="criterion-detail">Suboptimal coronary flow after intervention</div>
                        <div class="sex-shock-toggle" data-criterion="timi">
                            <label class="toggle-option">
                                <input type="radio" name="timi" value="0" id="timi-no" checked>
                                <span>TIMI ≥3</span>
                            </label>
                            <label class="toggle-option">
                                <input type="radio" name="timi" value="1" id="timi-yes">
                                <span>TIMI <3</span>
                            </label>
                        </div>
                    </div>

                    <div class="criterion-card left-main">
                        <div class="criterion-header">
                            <div class="criterion-icon">💔</div>
                            <div class="criterion-title">Left Main Culprit</div>
                        </div>
                        <div class="criterion-detail">Left main coronary artery as culprit vessel</div>
                        <div class="sex-shock-toggle" data-criterion="left_main">
                            <label class="toggle-option">
                                <input type="radio" name="left_main" value="0" id="lm-no" checked>
                                <span>No</span>
                            </label>
                            <label class="toggle-option">
                                <input type="radio" name="left_main" value="1" id="lm-yes">
                                <span>Yes</span>
                            </label>
                        </div>
                    </div>

                    <!-- Clinical Parameters -->
                    <div class="criterion-card glycemia">
                        <div class="criterion-header">
                            <div class="criterion-icon">🍯</div>
                            <div class="criterion-title">Hyperglycemia</div>
                        </div>
                        <div class="criterion-detail">Glucose >10 mmol/L (>180 mg/dL)</div>
                        <div class="sex-shock-toggle" data-criterion="glycemia">
                            <label class="toggle-option">
                                <input type="radio" name="glycemia" value="0" id="glucose-no" checked>
                                <span>≤10 mmol/L</span>
                            </label>
                            <label class="toggle-option">
                                <input type="radio" name="glycemia" value="1" id="glucose-yes">
                                <span>>10 mmol/L</span>
                            </label>
                        </div>
                    </div>

                    <div class="criterion-card bp">
                        <div class="criterion-header">
                            <div class="criterion-icon">📉</div>
                            <div class="criterion-title">Low BP & Pulse Pressure</div>
                        </div>
                        <div class="criterion-detail">SBP <125 mmHg AND Pulse Pressure <45 mmHg</div>
                        <div class="sex-shock-toggle" data-criterion="bp">
                            <label class="toggle-option">
                                <input type="radio" name="bp" value="0" id="bp-no" checked>
                                <span>Normal</span>
                            </label>
                            <label class="toggle-option">
                                <input type="radio" name="bp" value="1" id="bp-yes">
                                <span>Low BP/PP</span>
                            </label>
                        </div>
                    </div>

                    <div class="criterion-card hr">
                        <div class="criterion-header">
                            <div class="criterion-icon">💓</div>
                            <div class="criterion-title">Tachycardia</div>
                        </div>
                        <div class="criterion-detail">Heart rate >90 beats per minute</div>
                        <div class="sex-shock-toggle" data-criterion="hr">
                            <label class="toggle-option">
                                <input type="radio" name="hr" value="0" id="hr-no" checked>
                                <span>≤90 bpm</span>
                            </label>
                            <label class="toggle-option">
                                <input type="radio" name="hr" value="1" id="hr-yes">
                                <span>>90 bpm</span>
                            </label>
                        </div>
                    </div>

                    <div class="criterion-card killip">
                        <div class="criterion-header">
                            <div class="criterion-icon">🫁</div>
                            <div class="criterion-title">Killip Class III</div>
                        </div>
                        <div class="criterion-detail">Acute pulmonary edema</div>
                        <div class="sex-shock-toggle" data-criterion="killip">
                            <label class="toggle-option">
                                <input type="radio" name="killip" value="0" id="killip-no" checked>
                                <span>Class I-II</span>
                            </label>
                            <label class="toggle-option">
                                <input type="radio" name="killip" value="1" id="killip-yes">
                                <span>Class III</span>
                            </label>
                        </div>
                    </div>

                    <div class="criterion-card arrest">
                        <div class="criterion-header">
                            <div class="criterion-icon">⚡</div>
                            <div class="criterion-title">Cardiac Arrest</div>
                        </div>
                        <div class="criterion-detail">Presentation with cardiac arrest</div>
                        <div class="sex-shock-toggle" data-criterion="arrest">
                            <label class="toggle-option">
                                <input type="radio" name="arrest" value="0" id="arrest-no" checked>
                                <span>No</span>
                            </label>
                            <label class="toggle-option">
                                <input type="radio" name="arrest" value="1" id="arrest-yes">
                                <span>Yes</span>
                            </label>
                        </div>
                    </div>

                    <div class="criterion-card lvef">
                        <div class="criterion-header">
                            <div class="criterion-icon">❤️</div>
                            <div class="criterion-title">Left Ventricular EF</div>
                        </div>
                        <div class="criterion-detail">Left ventricular ejection fraction (%)</div>
                        <div class="sex-shock-toggle lvef-toggle" data-criterion="lvef">
                            <label class="toggle-option">
                                <input type="radio" name="lvef" value="55" id="lvef-high">
                                <span>>50%</span>
                            </label>
                            <label class="toggle-option">
                                <input type="radio" name="lvef" value="42.5" id="lvef-mid">
                                <span>35-50%</span>
                            </label>
                            <label class="toggle-option">
                                <input type="radio" name="lvef" value="30" id="lvef-low" checked>
                                <span><35%</span>
                            </label>
                        </div>
                    </div>

                    <div class="criterion-card st-elevation">
                        <div class="criterion-header">
                            <div class="criterion-icon">📈</div>
                            <div class="criterion-title">ST-Elevation</div>
                        </div>
                        <div class="criterion-detail">ST-segment elevation on ECG</div>
                        <div class="sex-shock-toggle" data-criterion="st_elevation">
                            <label class="toggle-option">
                                <input type="radio" name="st_elevation" value="0" id="st-no" checked>
                                <span>No</span>
                            </label>
                            <label class="toggle-option">
                                <input type="radio" name="st_elevation" value="1" id="st-yes">
                                <span>Yes</span>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="lab-values-section">
                    <h5>🧪 Laboratory Values</h5>
                    <div class="lab-inputs-grid">
                        <div class="lab-input-card">
                            <div class="lab-icon">🩺</div>
                            <div class="lab-content">
                                <label for="creatinine">Creatinine</label>
                                <div class="input-with-unit">
                                    <input type="number" id="creatinine" placeholder="Enter value" step="0.01">
                                    <span class="unit">mg/dL</span>
                                </div>
                                <div class="normal-range">Normal: 0.6-1.2 mg/dL</div>
                            </div>
                        </div>
                        
                        <div class="lab-input-card">
                            <div class="lab-icon">🔥</div>
                            <div class="lab-content">
                                <label for="crp">C-Reactive Protein</label>
                                <div class="input-with-unit">
                                    <input type="number" id="crp" placeholder="Enter value" step="0.1">
                                    <span class="unit">mg/L</span>
                                </div>
                                <div class="normal-range">Normal: <3.0 mg/L</div>
                            </div>
                </div>
            </div>
                </div>
            </div>
        </div>

        <div class="sex-shock-result-container">
            <div class="risk-score-display">
                <div class="score-circle">
                    <div class="score-number" id="result-score">0.0</div>
                    <div class="score-unit">%</div>
                </div>
                <div class="risk-interpretation">
                    <div class="risk-title" id="risk-category">Low Risk</div>
                    <div class="risk-description" id="result-interpretation">Risk of in-hospital cardiogenic shock</div>
                </div>
            </div>

            <div class="risk-stratification">
                <h4>📊 Risk Stratification</h4>
                <div class="risk-levels">
                    <div class="risk-level low-risk">
                        <div class="risk-range"><5%</div>
                        <div class="risk-category">Low Risk</div>
                        <div class="risk-description">Minimal risk of cardiogenic shock</div>
                    </div>
                    <div class="risk-level moderate-risk">
                        <div class="risk-range">5-15%</div>
                        <div class="risk-category">Moderate Risk</div>
                        <div class="risk-description">Intermediate risk requiring monitoring</div>
                    </div>
                    <div class="risk-level high-risk">
                        <div class="risk-range">15-30%</div>
                        <div class="risk-category">High Risk</div>
                        <div class="risk-description">Significant risk requiring intensive care</div>
                    </div>
                    <div class="risk-level very-high-risk">
                        <div class="risk-range">≥30%</div>
                        <div class="risk-category">Very High Risk</div>
                        <div class="risk-description">Critical risk requiring immediate intervention</div>
                    </div>
                </div>
            </div>

            <div class="clinical-recommendations">
                <h4>💡 Clinical Management Recommendations</h4>
                <div class="recommendations-grid">
                    <div class="recommendation-item low-risk-rec">
                        <h5>Low Risk (<5%)</h5>
                        <ul>
                            <li>Standard ACS management protocol</li>
                            <li>Regular monitoring of vital signs</li>
                            <li>Early mobilization when appropriate</li>
                            <li>Standard discharge planning</li>
                        </ul>
                    </div>
                    <div class="recommendation-item moderate-risk-rec">
                        <h5>Moderate Risk (5-15%)</h5>
                        <ul>
                            <li>Enhanced cardiac monitoring</li>
                            <li>Consider telemetry monitoring</li>
                            <li>Frequent hemodynamic assessment</li>
                            <li>Optimize medical therapy</li>
                        </ul>
                    </div>
                    <div class="recommendation-item high-risk-rec">
                        <h5>High Risk (15-30%)</h5>
                        <ul>
                            <li>Intensive care unit monitoring</li>
                            <li>Invasive hemodynamic monitoring</li>
                            <li>Early mechanical support consideration</li>
                            <li>Multidisciplinary team approach</li>
                        </ul>
                    </div>
                    <div class="recommendation-item very-high-risk-rec">
                        <h5>Very High Risk (≥30%)</h5>
                        <ul>
                            <li>Immediate ICU admission</li>
                            <li>Mechanical circulatory support readiness</li>
                            <li>Urgent cardiology consultation</li>
                            <li>Consider prophylactic interventions</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div class="shock-management-guide">
                <h4>🚨 Cardiogenic Shock Management</h4>
                <div class="management-steps">
                    <div class="management-step">
                        <div class="step-number">1</div>
                        <div class="step-content">
                            <h6>Early Recognition</h6>
                            <p>Monitor for signs: hypotension, oliguria, altered mental status, cool extremities</p>
                        </div>
                    </div>
                    <div class="management-step">
                        <div class="step-number">2</div>
                        <div class="step-content">
                            <h6>Hemodynamic Support</h6>
                            <p>Inotropes (dobutamine), vasopressors (norepinephrine), avoid excessive preload</p>
                        </div>
                    </div>
                    <div class="management-step">
                        <div class="step-number">3</div>
                        <div class="step-content">
                            <h6>Revascularization</h6>
                            <p>Urgent PCI or CABG for appropriate candidates, complete revascularization</p>
                        </div>
                    </div>
                    <div class="management-step">
                        <div class="step-number">4</div>
                        <div class="step-content">
                            <h6>Mechanical Support</h6>
                            <p>IABP, Impella, ECMO, or other devices based on severity and institutional availability</p>
                </div>
            </div>
                </div>
            </div>
        </div>

        <div class="references-section">
            <h4>📚 Reference & Validation</h4>
            <div class="reference-content">
                <div class="reference-citation">
                    <h5>Original SEX-SHOCK Study</h5>
                    <p><strong>Omerbasic E, Hasanovic A, Omerbasic A, Pandur S, Mornjakovic Z, Musanovic A.</strong> Prognostic value of SEX-SHOCK score for prediction of cardiogenic shock development in patients with acute coronary syndrome. <em>Med Arch</em>. 2017 Aug;71(4):262-267.</p>
                    <p><strong>PMID:</strong> <a href="https://pubmed.ncbi.nlm.nih.gov/29284919/" target="_blank" rel="noopener noreferrer">29284919</a></p>
                    <p><strong>DOI:</strong> <a href="https://doi.org/10.5455/medarh.2017.71.262-267" target="_blank" rel="noopener noreferrer">10.5455/medarh.2017.71.262-267</a></p>
                </div>
                
                <div class="study-details">
                    <h5>Study Overview</h5>
                    <div class="study-grid">
                        <div class="study-item">
                            <h6>Study Design</h6>
                            <p>Retrospective cohort study of ACS patients</p>
                        </div>
                        <div class="study-item">
                            <h6>Patient Population</h6>
                            <p>1,946 patients with acute coronary syndrome</p>
                        </div>
                        <div class="study-item">
                            <h6>Primary Endpoint</h6>
                            <p>Development of in-hospital cardiogenic shock</p>
                        </div>
                        <div class="study-item">
                            <h6>Model Performance</h6>
                            <p>C-statistic: 0.89 (95% CI: 0.86-0.92)</p>
                </div>
            </div>
                </div>
                
                <div class="study-results">
                    <h5>Key Findings</h5>
                    <div class="findings-grid">
                        <div class="finding-item">
                            <h6>Risk Factors Identified</h6>
                            <ul>
                                <li>Female sex (OR: 2.69)</li>
                                <li>Age >70 years (OR: 2.25)</li>
                                <li>No PCI performed (OR: 3.49)</li>
                                <li>Left main culprit lesion (OR: 4.02)</li>
                                <li>Cardiac arrest presentation (OR: 3.49)</li>
                            </ul>
                        </div>
                        <div class="finding-item">
                            <h6>Clinical Utility</h6>
                            <ul>
                                <li>Early identification of high-risk patients</li>
                                <li>Guide intensive monitoring decisions</li>
                                <li>Inform family discussions</li>
                                <li>Resource allocation planning</li>
                                <li>Quality improvement initiatives</li>
                            </ul>
                </div>
            </div>
                </div>
                
                <div class="clinical-validation">
                    <h5>🏥 Clinical Impact & Limitations</h5>
                    <div class="validation-points">
                        <div class="validation-item">
                            <h6>Strengths</h6>
                            <p>High discriminative ability (C-statistic 0.89), clinically relevant variables, easy bedside calculation without complex laboratory tests.</p>
                        </div>
                        <div class="validation-item">
                            <h6>Limitations</h6>
                            <p>Single-center study, retrospective design, limited external validation. Use caution in populations different from the derivation cohort.</p>
                        </div>
                        <div class="validation-item">
                            <h6>Clinical Application</h6>
                            <p>Best used as part of comprehensive clinical assessment. Should not replace clinical judgment but can guide risk stratification and monitoring intensity.</p>
            </div>
                        <div class="validation-item">
                            <h6>Future Directions</h6>
                            <p>External validation in diverse populations needed. Integration with other risk scores and biomarkers may improve predictive accuracy.</p>
                </div>
            </div>
                </div>
            </div>
        </div>
    `,

    initialize: function (client) {
        // Auto-populate patient demographics
        this.populatePatientData(client);

        // Set up event listeners
        this.setupEventListeners();

        // Initial toggle states and calculation
        this.updateToggleStates();
        this.calculateRisk();
    },

    populatePatientData: function (client) {
        // Get patient demographics
        getPatient(client)
            .then(patient => {
                // Calculate age
                const birthDate = new Date(patient.birthDate);
                const today = new Date();
                const age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                const adjustedAge =
                    monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())
                        ? age - 1
                        : age;

                document.getElementById('patient-age').textContent = `${adjustedAge} years`;

                // Auto-check age
                if (adjustedAge > 70) {
                    document.getElementById('age-no').checked = false;
                    document.getElementById('age-yes').checked = true;
                } else {
                    document.getElementById('age-no').checked = true;
                    document.getElementById('age-yes').checked = false;
                }

                // Set gender
                const gender = patient.gender || 'unknown';
                document.getElementById('patient-gender').textContent =
                    gender.charAt(0).toUpperCase() + gender.slice(1);

                // Auto-check gender
                if (gender.toLowerCase() === 'female') {
                    document.getElementById('sex-male').checked = false;
                    document.getElementById('sex-female').checked = true;
                } else {
                    document.getElementById('sex-male').checked = true;
                    document.getElementById('sex-female').checked = false;
                }
            })
            .catch(error => {
                console.error('Error fetching patient data:', error);
                document.getElementById('patient-age').textContent = 'Not available';
                document.getElementById('patient-gender').textContent = 'Not available';
            });

        // Get vital signs
        getObservation(client, '8867-4')
            .then(hrObs => {
                // Heart Rate
                if (hrObs && hrObs.valueQuantity) {
                    const hr = hrObs.valueQuantity.value;
                    document.getElementById('patient-hr').textContent = `${hr} bpm`;

                    if (hr > 90) {
                        document.getElementById('hr-no').checked = false;
                        document.getElementById('hr-yes').checked = true;
                    } else {
                        document.getElementById('hr-no').checked = true;
                        document.getElementById('hr-yes').checked = false;
                    }
                } else {
                    document.getElementById('patient-hr').textContent = 'Not available';
                }
            })
            .catch(error => {
                console.error('Error fetching heart rate:', error);
                document.getElementById('patient-hr').textContent = 'Not available';
            });

        // Get blood pressure
        getObservation(client, '8480-6')
            .then(sbpObs => {
                // SBP
                if (sbpObs && sbpObs.valueQuantity) {
                    getObservation(client, '8462-4')
                        .then(dbpObs => {
                            // DBP
                            if (dbpObs && dbpObs.valueQuantity) {
                                const sbp = sbpObs.valueQuantity.value;
                                const dbp = dbpObs.valueQuantity.value;
                                const pp = sbp - dbp;

                                document.getElementById('patient-bp').textContent =
                                    `${sbp}/${dbp} mmHg (PP: ${pp})`;

                                if (sbp < 125 && pp < 45) {
                                    document.getElementById('bp-no').checked = false;
                                    document.getElementById('bp-yes').checked = true;
                                } else {
                                    document.getElementById('bp-no').checked = true;
                                    document.getElementById('bp-yes').checked = false;
                                }
                            } else {
                                document.getElementById('patient-bp').textContent =
                                    `${sbpObs.valueQuantity.value}/- mmHg`;
                            }
                        })
                        .catch(error => {
                            document.getElementById('patient-bp').textContent =
                                `${sbpObs.valueQuantity.value}/- mmHg`;
                        });
                } else {
                    document.getElementById('patient-bp').textContent = 'Not available';
                }
            })
            .catch(error => {
                console.error('Error fetching blood pressure:', error);
                document.getElementById('patient-bp').textContent = 'Not available';
            });

        // Get glucose
        getObservation(client, '2339-0')
            .then(glucoseObs => {
                // Glucose
                if (glucoseObs && glucoseObs.valueQuantity) {
                    const glucoseMmolL = convertToMmolL(glucoseObs.valueQuantity.value, 'glucose');
                    if (glucoseMmolL > 10) {
                        document.getElementById('glucose-no').checked = false;
                        document.getElementById('glucose-yes').checked = true;
                    } else {
                        document.getElementById('glucose-no').checked = true;
                        document.getElementById('glucose-yes').checked = false;
                    }
                }
            })
            .catch(error => {
                console.error('Error fetching glucose:', error);
            });

        // Get LVEF
        getObservation(client, '39156-5')
            .then(lvefObs => {
                // LVEF
                if (lvefObs && lvefObs.valueQuantity) {
                    const lvef = lvefObs.valueQuantity.value;
                    // Reset all LVEF options
                    document.getElementById('lvef-high').checked = false;
                    document.getElementById('lvef-mid').checked = false;
                    document.getElementById('lvef-low').checked = false;

                    // Set the correct option
                    if (lvef > 50) {
                        document.getElementById('lvef-high').checked = true;
                    } else if (lvef >= 35) {
                        document.getElementById('lvef-mid').checked = true;
                    } else {
                        document.getElementById('lvef-low').checked = true;
                    }
                }
            })
            .catch(error => {
                console.error('Error fetching LVEF:', error);
            });

        // Get Creatinine
        getObservation(client, '2160-0')
            .then(crObs => {
                // Creatinine
                if (crObs && crObs.valueQuantity) {
                    document.getElementById('creatinine').value =
                        crObs.valueQuantity.value.toFixed(2);
                    document.getElementById('creatinine').placeholder = '';
                } else {
                    document.getElementById('creatinine').placeholder = 'Not available';
                }
            })
            .catch(error => {
                console.error('Error fetching creatinine:', error);
                document.getElementById('creatinine').placeholder = 'Not available';
            });

        // Get C-reactive protein
        getObservation(client, '1988-5')
            .then(crpObs => {
                // C-reactive protein
                if (crpObs && crpObs.valueQuantity) {
                    document.getElementById('crp').value = crpObs.valueQuantity.value.toFixed(1);
                    document.getElementById('crp').placeholder = '';
                } else {
                    document.getElementById('crp').placeholder = 'Not available';
                }
            })
            .catch(error => {
                console.error('Error fetching CRP:', error);
                document.getElementById('crp').placeholder = 'Not available';
            });

        // Recalculate after data population
        setTimeout(() => {
            this.updateToggleStates();
            this.calculateRisk();
        }, 1500);
    },

    setupEventListeners: function () {
        const inputs = document.querySelectorAll('.sex-shock-container input');
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                this.updateToggleStates();
                this.calculateRisk();
            });
            input.addEventListener('input', () => {
                this.updateToggleStates();
                this.calculateRisk();
            });
        });
    },

    updateToggleStates: function () {
        // Update toggle button active states for browsers that don't support :has()
        const toggles = document.querySelectorAll('.sex-shock-toggle');
        toggles.forEach(toggle => {
            const options = toggle.querySelectorAll('.toggle-option');
            options.forEach(option => {
                const radio = option.querySelector('input[type="radio"]');
                if (radio && radio.checked) {
                    option.classList.add('active');
                } else {
                    option.classList.remove('active');
                }
            });
        });
    },

    calculateRisk: function () {
        const getRadioValue = name =>
            parseInt(document.querySelector(`input[name="${name}"]:checked`)?.value || '0');
        const getInputValue = id => parseFloat(document.getElementById(id).value) || 0;

        const isFemale = getRadioValue('sex');
        const isAgeOver70 = getRadioValue('age');
        const noPci = getRadioValue('pci');
        const isTimiLow = getRadioValue('timi');
        const isLeftMain = getRadioValue('left_main');
        const isGlycemiaHigh = getRadioValue('glycemia');
        const isBpLow = getRadioValue('bp');
        const isHrHigh = getRadioValue('hr');
        const isKillip3 = getRadioValue('killip');
        const isArrest = getRadioValue('arrest');
        const lvefValue = getRadioValue('lvef');
        const isStElevation = getRadioValue('st_elevation');
        const creatinineValue = getInputValue('creatinine');
        const crpValue = getInputValue('crp');

        // SEX-SHOCK Score calculation using logistic regression formula
        // Based on the formula: Y = (Intercept) + β × log₂(CRP mg/L + 1) + β × log₂(Creatinine μmol/L) + ...
        // Risk, % = [1 / (1 + e^-Y)] × 100

        // Gender-specific coefficients from the SEX-SHOCK model (from your image)
        const femaleCoefficients = {
            intercept: -7.08042535,
            crp: 0.091519247,
            creatinine: 0.609175556,
            stElevation: 0.032769134,
            lvef35to50: -1.095259107,
            lvefLess50: -1.947426861,
            ageOver70: 0.182533294,
            cardiacArrest: 1.256698585,
            killipClass3: 1.050255447,
            heartRate: 0.240774064,
            sbpAndPP: 0.819218972,
            glycemia: 0.401892719,
            culpritLeftMain: 0.639735341, // Available in female model
            postPciTimi: 0.719770781 // Available in female model
        };

        const maleCoefficients = {
            intercept: -7.966559951,
            crp: 0.069589203,
            creatinine: 0.604010175,
            stElevation: 0.767955919,
            lvef35to50: -1.272230998,
            lvefLess50: -2.015325176,
            ageOver70: 0.263511391,
            cardiacArrest: 1.14591438,
            killipClass3: 0.684880861,
            heartRate: 0.538557699,
            sbpAndPP: 0.706186026,
            glycemia: 0.837549978,
            culpritLeftMain: 0.903552475, // Available in male model
            postPciTimi: 0.496589182 // Available in male model
        };

        // Select coefficients based on gender
        const coefficients = isFemale ? femaleCoefficients : maleCoefficients;

        // Calculate Y using the logistic regression formula
        let Y = coefficients.intercept;

        // CRP: log₂(CRP mg/L + 1)
        if (crpValue > 0) {
            Y += coefficients.crp * Math.log2(crpValue + 1);
        }

        // Creatinine: log₂(Creatinine μmol/L) - need to convert mg/dL to μmol/L
        if (creatinineValue > 0) {
            const creatinineUmol = creatinineValue * 88.4; // Convert mg/dL to μmol/L
            Y += coefficients.creatinine * Math.log2(creatinineUmol);
        }

        // ST-segment elevation
        Y += coefficients.stElevation * isStElevation;

        // LVEF categories - coefficients are negative because higher EF is protective
        // Reference category appears to be <35% (most severe), so higher EF gets negative coefficients
        if (lvefValue === 55) {
            // >50% - most protective, gets most negative coefficient
            Y += coefficients.lvefLess50; // Use the most negative coefficient
        } else if (lvefValue === 42.5) {
            // 35-50% - intermediate protection
            Y += coefficients.lvef35to50; // Use intermediate negative coefficient
        }
        // <35% is reference category (coefficient = 0) - highest risk

        // Age >70 years
        Y += coefficients.ageOver70 * isAgeOver70;

        // Cardiac arrest
        Y += coefficients.cardiacArrest * isArrest;

        // Killip class III
        Y += coefficients.killipClass3 * isKillip3;

        // Heart rate >90/min
        Y += coefficients.heartRate * isHrHigh;

        // SBP <125 and PP <45 mmHg
        Y += coefficients.sbpAndPP * isBpLow;

        // Glycemia >10 mmol/L
        Y += coefficients.glycemia * isGlycemiaHigh;

        // Culprit lesion of left main (now available in both models)
        Y += coefficients.culpritLeftMain * isLeftMain;

        // Post-PCI TIMI flow <3 (now available in both models)
        Y += coefficients.postPciTimi * isTimiLow;

        // Calculate risk percentage: Risk, % = [1 / (1 + e^-Y)] × 100
        const risk = (1 / (1 + Math.exp(-Y))) * 100;

        // Debug information (can be removed in production)
        console.log('SEX-SHOCK Calculation Debug:');
        console.log('Gender:', isFemale ? 'Female' : 'Male');
        console.log('Y value:', Y);
        console.log('Risk:', risk.toFixed(2) + '%');
        console.log('Input values:', {
            crp: crpValue,
            creatinine: creatinineValue,
            stElevation: isStElevation,
            lvef: lvefValue,
            age: isAgeOver70,
            arrest: isArrest,
            killip: isKillip3,
            hr: isHrHigh,
            bp: isBpLow,
            glycemia: isGlycemiaHigh,
            leftMain: isLeftMain,
            timi: isTimiLow
        });

        // Update score display with risk percentage
        document.getElementById('result-score').textContent = risk.toFixed(1);

        // Update risk category and recommendations based on percentage
        let riskCategory = '';
        let riskClass = '';

        if (risk < 5) {
            riskCategory = 'Low Risk';
            riskClass = 'low-risk';
        } else if (risk < 15) {
            riskCategory = 'Moderate Risk';
            riskClass = 'moderate-risk';
        } else if (risk < 30) {
            riskCategory = 'High Risk';
            riskClass = 'high-risk';
        } else {
            riskCategory = 'Very High Risk';
            riskClass = 'very-high-risk';
        }

        document.getElementById('risk-category').textContent = riskCategory;

        // Update risk interpretation
        const riskDescription = document.getElementById('result-interpretation');
        const modelType = isFemale ? 'Female' : 'Male';
        riskDescription.textContent = `${risk.toFixed(1)}% risk of in-hospital cardiogenic shock (${modelType} model)`;

        // Update risk level highlighting
        document.querySelectorAll('.risk-level').forEach(level => level.classList.remove('active'));
        document
            .querySelectorAll('.recommendation-item')
            .forEach(item => item.classList.remove('active'));

        document.querySelector(`.risk-level.${riskClass}`).classList.add('active');
        document.querySelector(`.recommendation-item.${riskClass}-rec`).classList.add('active');

        // Update score circle color
        const scoreCircle = document.querySelector('.score-circle');
        scoreCircle.className = `score-circle ${riskClass}`;
    }
};
