import { getPatient, getPatientConditions, getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';

export const stopBang = {
    id: 'stop-bang',
    title: 'STOP-BANG Score for Obstructive Sleep Apnea',
    description: 'Screens for obstructive sleep apnea using validated clinical criteria.',
    generateHTML: function () {
        return `
            <h3>${this.title}</h3>
            <p class="calculator-description">${this.description}</p>
            
            <div class="stop-bang-container">
                <div class="patient-demographics">
                    <h4>?? Patient Demographics</h4>
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
                            <label>BMI:</label>
                            <span id="patient-bmi">Loading...</span>
                        </div>
                    </div>
                </div>
                
                <div class="stop-bang-criteria">
                    <h4>?? STOP-BANG Assessment</h4>
                    <div class="criteria-grid">
                        <div class="criterion-card snoring">
                            <div class="criterion-header">
                                <div class="criterion-letter">S</div>
                                <div class="criterion-title">Snoring</div>
                            </div>
                            <div class="criterion-question">Do you snore loudly?</div>
                            <div class="criterion-detail">Louder than talking or loud enough to be heard through closed doors</div>
                            <div class="stop-bang-toggle" data-criterion="snoring">
                                <input type="checkbox" id="sb-snoring" data-points="1">
                                <label for="sb-snoring" class="toggle-label">
                                    <span class="toggle-slider"></span>
                                    <span class="toggle-text">No</span>
                                </label>
                            </div>
                        </div>

                        <div class="criterion-card tired">
                            <div class="criterion-header">
                                <div class="criterion-letter">T</div>
                                <div class="criterion-title">Tired</div>
                            </div>
                            <div class="criterion-question">Do you often feel tired, fatigued, or sleepy during daytime?</div>
                            <div class="criterion-detail">Despite adequate sleep time</div>
                            <div class="stop-bang-toggle" data-criterion="tired">
                                <input type="checkbox" id="sb-tired" data-points="1">
                                <label for="sb-tired" class="toggle-label">
                                    <span class="toggle-slider"></span>
                                    <span class="toggle-text">No</span>
                                </label>
                            </div>
                        </div>

                        <div class="criterion-card observed">
                            <div class="criterion-header">
                                <div class="criterion-letter">O</div>
                                <div class="criterion-title">Observed</div>
                            </div>
                            <div class="criterion-question">Has anyone observed you stop breathing during your sleep?</div>
                            <div class="criterion-detail">Witnessed apnea episodes</div>
                            <div class="stop-bang-toggle" data-criterion="observed">
                                <input type="checkbox" id="sb-observed" data-points="1">
                                <label for="sb-observed" class="toggle-label">
                                    <span class="toggle-slider"></span>
                                    <span class="toggle-text">No</span>
                                </label>
                            </div>
                        </div>

                        <div class="criterion-card pressure">
                            <div class="criterion-header">
                                <div class="criterion-letter">P</div>
                                <div class="criterion-title">Pressure</div>
                            </div>
                            <div class="criterion-question">Do you have or are you being treated for high blood pressure?</div>
                            <div class="criterion-detail">Hypertension diagnosis or treatment</div>
                            <div class="stop-bang-toggle" data-criterion="pressure">
                                <input type="checkbox" id="sb-pressure" data-points="1">
                                <label for="sb-pressure" class="toggle-label">
                                    <span class="toggle-slider"></span>
                                    <span class="toggle-text">No</span>
                                </label>
                            </div>
                        </div>

                        <div class="criterion-card bmi">
                            <div class="criterion-header">
                                <div class="criterion-letter">B</div>
                                <div class="criterion-title">BMI</div>
                            </div>
                            <div class="criterion-question">BMI more than 35 kg/m¬≤?</div>
                            <div class="criterion-detail">Severe obesity classification</div>
                            <div class="stop-bang-toggle" data-criterion="bmi">
                                <input type="checkbox" id="sb-bmi" data-points="1">
                                <label for="sb-bmi" class="toggle-label">
                                    <span class="toggle-slider"></span>
                                    <span class="toggle-text">No</span>
                                </label>
                            </div>
                        </div>

                        <div class="criterion-card age">
                            <div class="criterion-header">
                                <div class="criterion-letter">A</div>
                                <div class="criterion-title">Age</div>
                            </div>
                            <div class="criterion-question">Age over 50 years old?</div>
                            <div class="criterion-detail">Increased OSA risk with age</div>
                            <div class="stop-bang-toggle" data-criterion="age">
                                <input type="checkbox" id="sb-age" data-points="1">
                                <label for="sb-age" class="toggle-label">
                                    <span class="toggle-slider"></span>
                                    <span class="toggle-text">No</span>
                                </label>
                            </div>
                        </div>

                        <div class="criterion-card neck">
                            <div class="criterion-header">
                                <div class="criterion-letter">N</div>
                                <div class="criterion-title">Neck</div>
                            </div>
                            <div class="criterion-question">Neck circumference greater than 40 cm?</div>
                            <div class="criterion-detail">Measure at cricothyroid membrane level</div>
                            <div class="stop-bang-toggle" data-criterion="neck">
                                <input type="checkbox" id="sb-neck" data-points="1">
                                <label for="sb-neck" class="toggle-label">
                                    <span class="toggle-slider"></span>
                                    <span class="toggle-text">No</span>
                                </label>
                            </div>
                        </div>

                        <div class="criterion-card gender">
                            <div class="criterion-header">
                                <div class="criterion-letter">G</div>
                                <div class="criterion-title">Gender</div>
                            </div>
                            <div class="criterion-question">Male gender?</div>
                            <div class="criterion-detail">Higher OSA prevalence in males</div>
                            <div class="stop-bang-toggle" data-criterion="gender">
                                <input type="checkbox" id="sb-gender" data-points="1">
                                <label for="sb-gender" class="toggle-label">
                                    <span class="toggle-slider"></span>
                                    <span class="toggle-text">No</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="stop-bang-result-container">
                <div class="score-display">
                    <div class="score-circle">
                        <div class="score-number" id="current-score">0</div>
                        <div class="score-label">/ 8</div>
                    </div>
                    <div class="risk-assessment">
                        <div class="risk-level" id="risk-level">Low Risk</div>
                        <div class="risk-description" id="risk-description">Low risk of moderate to severe OSA</div>
                    </div>
                </div>
                
                <div class="risk-interpretation">
                    <h4>?? Risk Interpretation</h4>
                    <div class="risk-levels">
                        <div class="risk-item low-risk">
                            <div class="risk-score">0-2 points</div>
                            <div class="risk-category">Low Risk</div>
                            <div class="risk-probability">Low probability of moderate to severe OSA</div>
                        </div>
                        <div class="risk-item intermediate-risk">
                            <div class="risk-score">3-4 points</div>
                            <div class="risk-category">Intermediate Risk</div>
                            <div class="risk-probability">Intermediate probability of moderate to severe OSA</div>
                        </div>
                        <div class="risk-item high-risk">
                            <div class="risk-score">5-8 points</div>
                            <div class="risk-category">High Risk</div>
                            <div class="risk-probability">High probability of moderate to severe OSA</div>
                        </div>
                    </div>
                </div>
                
                <div class="clinical-recommendations">
                    <h4>?í° Clinical Recommendations</h4>
                    <div class="recommendations-grid">
                        <div class="recommendation-item low-risk-rec">
                            <h5>Low Risk (0-2 points)</h5>
                            <ul>
                                <li>Routine clinical assessment</li>
                                <li>Sleep hygiene counseling</li>
                                <li>Weight management if applicable</li>
                                <li>Consider sleep study if high clinical suspicion</li>
                            </ul>
                        </div>
                        <div class="recommendation-item intermediate-risk-rec">
                            <h5>Intermediate Risk (3-4 points)</h5>
                            <ul>
                                <li>Consider sleep study evaluation</li>
                                <li>Perioperative monitoring if surgery planned</li>
                                <li>Weight loss counseling</li>
                                <li>Sleep position therapy</li>
                            </ul>
                        </div>
                        <div class="recommendation-item high-risk-rec">
                            <h5>High Risk (5-8 points)</h5>
                            <ul>
                                <li>Sleep study strongly recommended</li>
                                <li>Consider CPAP trial</li>
                                <li>Perioperative precautions</li>
                                <li>Multidisciplinary sleep medicine referral</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="references-section">
                <h4>?? Reference & Validation</h4>
                <div class="reference-content">
                    <div class="reference-citation">
                        <h5>Original STOP-BANG Study</h5>
                        <p><strong>Chung F, Yegneswaran B, Liao P, Chung SA, Vairavanathan S, Islam S, Khajehdehi A, Shapiro CM.</strong> STOP questionnaire: a tool to screen patients for obstructive sleep apnea. <em>Anesthesiology</em>. 2008 May;108(5):812-21.</p>
                        <p><strong>PMID:</strong> <a href="https://pubmed.ncbi.nlm.nih.gov/18431116/" target="_blank" rel="noopener noreferrer">18431116</a></p>
                        <p><strong>DOI:</strong> <a href="https://doi.org/10.1097/ALN.0b013e31816d83e4" target="_blank" rel="noopener noreferrer">10.1097/ALN.0b013e31816d83e4</a></p>
                    </div>
                    
                    <div class="study-details">
                        <h5>Study Overview</h5>
                        <div class="study-grid">
                            <div class="study-item">
                                <h6>Study Population</h6>
                                <p>2,467 preoperative patients aged ??8 years without previously diagnosed OSA</p>
                            </div>
                            <div class="study-item">
                                <h6>Validation Method</h6>
                                <p>Polysomnography validation in 177 patients with apnea-hypopnea index assessment</p>
                            </div>
                            <div class="study-item">
                                <h6>Primary Outcome</h6>
                                <p>Sensitivity for detecting OSA with AHI >5, >15, and >30 events/hour</p>
                            </div>
                            <div class="study-item">
                                <h6>Clinical Setting</h6>
                                <p>Developed and validated in preoperative clinics for surgical patients</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="study-results">
                        <h5>Key Performance Metrics</h5>
                        <div class="findings-grid">
                            <div class="finding-item">
                                <h6>STOP Questionnaire Sensitivity</h6>
                                <ul>
                                    <li>AHI >5: 65.6% sensitivity</li>
                                    <li>AHI >15: 74.3% sensitivity</li>
                                    <li>AHI >30: 79.5% sensitivity</li>
                                </ul>
                            </div>
                            <div class="finding-item">
                                <h6>STOP-BANG Enhanced Sensitivity</h6>
                                <ul>
                                    <li>AHI >5: 83.6% sensitivity</li>
                                    <li>AHI >15: 92.9% sensitivity</li>
                                    <li>AHI >30: 100% sensitivity</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <div class="clinical-validation">
                        <h5>?è• Clinical Impact & Validation</h5>
                        <div class="validation-points">
                            <div class="validation-item">
                                <h6>Perioperative Screening</h6>
                                <p>Specifically developed for preoperative assessment, helping identify patients at risk for perioperative complications related to undiagnosed OSA.</p>
                            </div>
                            <div class="validation-item">
                                <h6>Enhanced Sensitivity</h6>
                                <p>Addition of BMI, Age, Neck circumference, and Gender (BANG) significantly improved sensitivity, especially for moderate to severe OSA detection.</p>
                            </div>
                            <div class="validation-item">
                                <h6>Clinical Adoption</h6>
                                <p>Widely adopted screening tool in perioperative medicine, sleep clinics, and primary care settings for OSA risk assessment.</p>
                            </div>
                            <div class="validation-item">
                                <h6>Validation Strength</h6>
                                <p>Polysomnography-validated tool with demonstrated high sensitivity for clinically significant OSA, particularly valuable for surgical populations.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    initialize: function (client) {
        // Auto-populate patient data
        this.populatePatientData(client);

        // Set up event listeners for checkboxes
        this.setupEventListeners();

        // Initial calculation
        this.calculateScore();
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

                // Auto-check age if > 50
                if (adjustedAge > 50) {
                    document.getElementById('sb-age').checked = true;
                    this.updateToggleText('sb-age', true);
                }

                // Set gender
                const gender = patient.gender || 'unknown';
                document.getElementById('patient-gender').textContent =
                    gender.charAt(0).toUpperCase() + gender.slice(1);

                // Auto-check gender if male
                if (gender.toLowerCase() === 'male') {
                    document.getElementById('sb-gender').checked = true;
                    this.updateToggleText('sb-gender', true);
                }
            })
            .catch(error => {
                console.error('Error fetching patient data:', error);
                document.getElementById('patient-age').textContent = 'Not available';
                document.getElementById('patient-gender').textContent = 'Not available';
            });

        // Get BMI from observations
        getMostRecentObservation(client, LOINC_CODES.BMI)
            .then(bmiObs => {
                if (bmiObs && bmiObs.valueQuantity) {
                    const bmi = bmiObs.valueQuantity.value;
                    document.getElementById('patient-bmi').textContent = `${bmi.toFixed(1)} kg/m¬≤`;

                    // Auto-check BMI if > 35
                    if (bmi > 35) {
                        document.getElementById('sb-bmi').checked = true;
                        this.updateToggleText('sb-bmi', true);
                    }
                } else {
                    document.getElementById('patient-bmi').textContent = 'Not available';
                }
            })
            .catch(error => {
                console.error('Error fetching BMI:', error);
                document.getElementById('patient-bmi').textContent = 'Not available';
            });

        // Check for hypertension
        getPatientConditions(client, ['38341003'])
            .then(conditions => {
                if (conditions.length > 0) {
                    document.getElementById('sb-pressure').checked = true;
                    this.updateToggleText('sb-pressure', true);
                }
            })
            .catch(error => {
                console.error('Error fetching conditions:', error);
            });

        // Recalculate after data population
        setTimeout(() => this.calculateScore(), 1000);
    },

    setupEventListeners: function () {
        const checkboxes = document.querySelectorAll('.stop-bang-container input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', e => {
                this.updateToggleText(e.target.id, e.target.checked);
                this.calculateScore();
            });
        });
    },

    updateToggleText: function (checkboxId, isChecked) {
        const label = document.querySelector(`label[for="${checkboxId}"]`);
        const textSpan = label.querySelector('.toggle-text');
        textSpan.textContent = isChecked ? 'Yes' : 'No';
    },

    calculateScore: function () {
        const checkboxes = document.querySelectorAll('.stop-bang-container input[type="checkbox"]');
        let score = 0;
        checkboxes.forEach(box => {
            if (box.checked) {
                score += parseInt(box.dataset.points);
            }
        });

        // Update score display
        document.getElementById('current-score').textContent = score;

        // Update risk assessment
        let riskLevel = '';
        let riskDescription = '';
        let riskClass = '';

        if (score <= 2) {
            riskLevel = 'Low Risk';
            riskDescription = 'Low probability of moderate to severe OSA';
            riskClass = 'low-risk';
        } else if (score <= 4) {
            riskLevel = 'Intermediate Risk';
            riskDescription = 'Intermediate probability of moderate to severe OSA';
            riskClass = 'intermediate-risk';
        } else {
            riskLevel = 'High Risk';
            riskDescription = 'High probability of moderate to severe OSA';
            riskClass = 'high-risk';
        }

        document.getElementById('risk-level').textContent = riskLevel;
        document.getElementById('risk-description').textContent = riskDescription;

        // Update risk level highlighting
        document.querySelectorAll('.risk-item').forEach(item => item.classList.remove('active'));
        document
            .querySelectorAll('.recommendation-item')
            .forEach(item => item.classList.remove('active'));

        document.querySelector(`.risk-item.${riskClass}`).classList.add('active');
        document.querySelector(`.recommendation-item.${riskClass}-rec`).classList.add('active');

        // Update score circle color
        const scoreCircle = document.querySelector('.score-circle');
        scoreCircle.className = `score-circle ${riskClass}`;
    }
};
