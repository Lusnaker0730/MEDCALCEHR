
import { getPatient, getPatientConditions, getObservation } from '../../utils.js';

export const timiNstemi = {
    id: 'timi-nstemi',
    title: 'TIMI Risk Score for UA/NSTEMI',
    description: 'Estimates mortality for patients with unstable angina and non-ST elevation MI.',

    generateHTML: () => `
        <h3>${timiNstemi.title}</h3>
        <p class="calculator-description">${timiNstemi.description}</p>
        
        <div class="timi-form-container">
            <div class="timi-criteria-grid">
                <div class="timi-criterion-card">
                    <div class="criterion-header">
                        <div class="criterion-icon">👴</div>
                        <div class="criterion-title">Age ≥65</div>
                    </div>
                    <div class="timi-segmented-control" data-name="age">
                        <label class="segment-option">
                            <input type="radio" name="age" value="0" checked>
                            <span class="segment-label">
                                <span class="option-text">No</span>
                                <span class="option-points">0</span>
                            </span>
                        </label>
                        <label class="segment-option">
                            <input type="radio" name="age" value="1">
                            <span class="segment-label">
                                <span class="option-text">Yes</span>
                                <span class="option-points">+1</span>
                            </span>
                        </label>
                    </div>
                </div>

                <div class="timi-criterion-card">
                    <div class="criterion-header">
                        <div class="criterion-icon">⚠️</div>
                        <div class="criterion-title">≥3 CAD Risk Factors</div>
                    </div>
                    <div class="criterion-subtitle">
                        Hypertension, hypercholesterolemia, diabetes, family history of CAD, or current smoker
                    </div>
                    <div class="timi-segmented-control" data-name="cad_risk">
                        <label class="segment-option">
                            <input type="radio" name="cad_risk" value="0" checked>
                            <span class="segment-label">
                                <span class="option-text">No</span>
                                <span class="option-points">0</span>
                            </span>
                        </label>
                        <label class="segment-option">
                            <input type="radio" name="cad_risk" value="1">
                            <span class="segment-label">
                                <span class="option-text">Yes</span>
                                <span class="option-points">+1</span>
                            </span>
                        </label>
                    </div>
                </div>

                <div class="timi-criterion-card">
                    <div class="criterion-header">
                        <div class="criterion-icon">❤️</div>
                        <div class="criterion-title">Known CAD</div>
                    </div>
                    <div class="criterion-subtitle">Stenosis ≥50%</div>
                    <div class="timi-segmented-control" data-name="known_cad">
                        <label class="segment-option">
                            <input type="radio" name="known_cad" value="0" checked>
                            <span class="segment-label">
                                <span class="option-text">No</span>
                                <span class="option-points">0</span>
                            </span>
                        </label>
                        <label class="segment-option">
                            <input type="radio" name="known_cad" value="1">
                            <span class="segment-label">
                                <span class="option-text">Yes</span>
                                <span class="option-points">+1</span>
                            </span>
                        </label>
                    </div>
                </div>

                <div class="timi-criterion-card">
                    <div class="criterion-header">
                        <div class="criterion-icon">💊</div>
                        <div class="criterion-title">ASA Use</div>
                    </div>
                    <div class="criterion-subtitle">In past 7 days</div>
                    <div class="timi-segmented-control" data-name="asa">
                        <label class="segment-option">
                            <input type="radio" name="asa" value="0" checked>
                            <span class="segment-label">
                                <span class="option-text">No</span>
                                <span class="option-points">0</span>
                            </span>
                        </label>
                        <label class="segment-option">
                            <input type="radio" name="asa" value="1">
                            <span class="segment-label">
                                <span class="option-text">Yes</span>
                                <span class="option-points">+1</span>
                            </span>
                        </label>
                    </div>
                </div>

                <div class="timi-criterion-card">
                    <div class="criterion-header">
                        <div class="criterion-icon">🫀</div>
                        <div class="criterion-title">Severe Angina</div>
                    </div>
                    <div class="criterion-subtitle">≥2 episodes in 24 hours</div>
                    <div class="timi-segmented-control" data-name="angina">
                        <label class="segment-option">
                            <input type="radio" name="angina" value="0" checked>
                            <span class="segment-label">
                                <span class="option-text">No</span>
                                <span class="option-points">0</span>
                            </span>
                        </label>
                        <label class="segment-option">
                            <input type="radio" name="angina" value="1">
                            <span class="segment-label">
                                <span class="option-text">Yes</span>
                                <span class="option-points">+1</span>
                            </span>
                        </label>
                    </div>
                </div>

                <div class="timi-criterion-card">
                    <div class="criterion-header">
                        <div class="criterion-icon">📈</div>
                        <div class="criterion-title">EKG ST Changes</div>
                    </div>
                    <div class="criterion-subtitle">≥0.5mm</div>
                    <div class="timi-segmented-control" data-name="ekg">
                        <label class="segment-option">
                            <input type="radio" name="ekg" value="0" checked>
                            <span class="segment-label">
                                <span class="option-text">No</span>
                                <span class="option-points">0</span>
                            </span>
                        </label>
                        <label class="segment-option">
                            <input type="radio" name="ekg" value="1">
                            <span class="segment-label">
                                <span class="option-text">Yes</span>
                                <span class="option-points">+1</span>
                            </span>
                        </label>
                    </div>
                </div>

                <div class="timi-criterion-card">
                    <div class="criterion-header">
                        <div class="criterion-icon">🧪</div>
                        <div class="criterion-title">Positive Cardiac Marker</div>
                    </div>
                    <div class="criterion-subtitle">Troponin, CK-MB</div>
                    <div class="timi-segmented-control" data-name="marker">
                        <label class="segment-option">
                            <input type="radio" name="marker" value="0" checked>
                            <span class="segment-label">
                                <span class="option-text">No</span>
                                <span class="option-points">0</span>
                            </span>
                        </label>
                        <label class="segment-option">
                            <input type="radio" name="marker" value="1">
                            <span class="segment-label">
                                <span class="option-text">Yes</span>
                                <span class="option-points">+1</span>
                            </span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="timi-result-container">
            <div class="timi-score-display">
                <div class="score-circle">
                    <div class="score-number" id="result-score">0</div>
                    <div class="score-label">points</div>
                </div>
                <div class="risk-assessment">
                    <div class="risk-percentage" id="risk-percentage">5%</div>
                    <div class="risk-description" id="result-interpretation">risk at 14 days of: all-cause mortality, new or recurrent MI, or severe recurrent ischemia requiring urgent revascularization.</div>
                </div>
            </div>
            
            <div class="risk-stratification">
                <h4>📊 Risk Stratification</h4>
                <div class="risk-levels">
                    <div class="risk-level low-risk">
                        <div class="risk-range">0-2 points</div>
                        <div class="risk-category">Low Risk</div>
                        <div class="risk-value">5-8%</div>
                    </div>
                    <div class="risk-level moderate-risk">
                        <div class="risk-range">3-4 points</div>
                        <div class="risk-category">Moderate Risk</div>
                        <div class="risk-value">13-20%</div>
                    </div>
                    <div class="risk-level high-risk">
                        <div class="risk-range">5-7 points</div>
                        <div class="risk-category">High Risk</div>
                        <div class="risk-value">26-41%</div>
                    </div>
                </div>
            </div>
            
            <div class="clinical-recommendations">
                <h4>💡 Clinical Recommendations</h4>
                <div class="recommendations-grid">
                    <div class="recommendation-item low-risk-rec">
                        <h5>Low Risk (0-2 points)</h5>
                        <ul>
                            <li>Conservative management</li>
                            <li>Medical therapy optimization</li>
                            <li>Outpatient follow-up</li>
                            <li>Consider stress testing</li>
                        </ul>
                    </div>
                    <div class="recommendation-item moderate-risk-rec">
                        <h5>Moderate Risk (3-4 points)</h5>
                        <ul>
                            <li>Intensive medical therapy</li>
                            <li>Consider early invasive strategy</li>
                            <li>Dual antiplatelet therapy</li>
                            <li>Close monitoring</li>
                        </ul>
                    </div>
                    <div class="recommendation-item high-risk-rec">
                        <h5>High Risk (5-7 points)</h5>
                        <ul>
                            <li>Early invasive strategy</li>
                            <li>Urgent cardiology consultation</li>
                            <li>Aggressive antiplatelet therapy</li>
                            <li>Consider GP IIb/IIIa inhibitors</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="references-section">
            <h4>📚 Reference & Validation</h4>
            <div class="reference-content">
                <div class="reference-citation">
                    <h5>Original TIMI Risk Score Study</h5>
                    <p><strong>Antman EM, Cohen M, Bernink PJ, McCabe CH, Horacek T, Papuchis G, Mautner B, Corbalan R, Radley D, Braunwald E.</strong> The TIMI risk score for unstable angina/non-ST elevation MI: A method for prognostication and therapeutic decision making. <em>JAMA</em>. 2000 Aug 16;284(7):835-42.</p>
                    <p><strong>PMID:</strong> <a href="https://pubmed.ncbi.nlm.nih.gov/10938172/" target="_blank" rel="noopener noreferrer">10938172</a></p>
                    <p><strong>DOI:</strong> <a href="https://doi.org/10.1001/jama.284.7.835" target="_blank" rel="noopener noreferrer">10.1001/jama.284.7.835</a></p>
                </div>
                
                <div class="study-details">
                    <h5>Study Overview</h5>
                    <div class="study-grid">
                        <div class="study-item">
                            <h6>Study Design</h6>
                            <p>Two phase 3, international, randomized, double-blind trials (TIMI 11B and ESSENCE)</p>
                        </div>
                        <div class="study-item">
                            <h6>Patient Population</h6>
                            <p>7,081 patients with UA/NSTEMI across both trials</p>
                        </div>
                        <div class="study-item">
                            <h6>Primary Endpoint</h6>
                            <p>All-cause mortality, new or recurrent MI, or severe recurrent ischemia requiring urgent revascularization through 14 days</p>
                        </div>
                        <div class="study-item">
                            <h6>Validation</h6>
                            <p>Score validated in 3 independent cohorts with consistent results (P<.001)</p>
                        </div>
                    </div>
                </div>
                
                <div class="study-results">
                    <h5>Key Findings</h5>
                    <div class="findings-grid">
                        <div class="finding-item">
                            <h6>Risk Stratification</h6>
                            <ul>
                                <li>Score 0-1: 4.7% event rate</li>
                                <li>Score 2: 8.3% event rate</li>
                                <li>Score 3: 13.2% event rate</li>
                                <li>Score 4: 19.9% event rate</li>
                                <li>Score 5: 26.2% event rate</li>
                                <li>Score 6-7: 40.9% event rate</li>
                            </ul>
                        </div>
                        <div class="finding-item">
                            <h6>Clinical Impact</h6>
                            <ul>
                                <li>Simple bedside risk assessment tool</li>
                                <li>No computer required for calculation</li>
                                <li>Guides therapeutic decision making</li>
                                <li>Identifies patients who benefit from enoxaparin</li>
                                <li>Significant treatment interaction (P=.02)</li>
                            </ul>
                        </div>
                </div>
            </div>
                
                <div class="reference-image">
                    <h5>TIMI Risk Score Reference Chart</h5>
                    <img src="js/calculators/timi-nstemi/TIMI_RISK.jpg" alt="TIMI Risk Score Reference Chart" />
                    <p class="image-caption">Original TIMI Risk Score validation data showing event rates by risk score category across multiple clinical trials.</p>
                </div>
                
                <div class="clinical-validation">
                    <h5>🏥 Clinical Validation & Impact</h5>
                    <div class="validation-points">
                        <div class="validation-item">
                            <h6>Multi-trial Validation</h6>
                            <p>Validated across TIMI 11B and ESSENCE trials with over 7,000 patients, demonstrating consistent risk stratification across different populations and treatment strategies.</p>
                        </div>
                        <div class="validation-item">
                            <h6>Treatment Interaction</h6>
                            <p>Demonstrated significant interaction between risk score and treatment benefit from enoxaparin vs. unfractionated heparin, supporting personalized therapy approaches.</p>
                        </div>
                        <div class="validation-item">
                            <h6>Clinical Adoption</h6>
                            <p>Widely adopted in clinical practice and incorporated into major cardiology guidelines (AHA/ACC, ESC) for risk assessment in UA/NSTEMI patients.</p>
                        </div>
                        <div class="validation-item">
                            <h6>Prognostic Accuracy</h6>
                            <p>Strong statistical significance (P<.001) for trend across all validation cohorts, with clear dose-response relationship between score and event rates.</p>
                </div>
            </div>
                </div>
            </div>
        </div>
    `,

    initialize: (client) => {
        const riskMapping = {
            0: '5%', 1: '5%', 2: '8%', 3: '13%', 4: '20%', 5: '26%', 6: '41%', 7: '41%'
        };

        const calculate = () => {
            const score = Array.from(document.querySelectorAll('.timi-form-container input:checked')).reduce((acc, input) => {
                return acc + parseInt(input.value);
            }, 0);

            const risk = riskMapping[score] || 'N/A';
            document.getElementById('result-score').textContent = score;
            document.getElementById('risk-percentage').textContent = risk;
            document.getElementById('result-interpretation').textContent = `risk at 14 days of: all-cause mortality, new or recurrent MI, or severe recurrent ischemia requiring urgent revascularization.`;
            
            // Update risk level highlighting
            document.querySelectorAll('.risk-level').forEach(level => level.classList.remove('active'));
            document.querySelectorAll('.recommendation-item').forEach(item => item.classList.remove('active'));
            
            if (score <= 2) {
                document.querySelector('.low-risk').classList.add('active');
                document.querySelector('.low-risk-rec').classList.add('active');
            } else if (score <= 4) {
                document.querySelector('.moderate-risk').classList.add('active');
                document.querySelector('.moderate-risk-rec').classList.add('active');
            } else {
                document.querySelector('.high-risk').classList.add('active');
                document.querySelector('.high-risk-rec').classList.add('active');
            }
        };

        document.querySelectorAll('.timi-form-container input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', calculate);
        });

        // --- FHIR Integration ---
        const setRadio = (name, value) => {
            const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
            if (radio) radio.checked = true;
        };

        getPatient(client).then(patient => {
            const age = new Date().getFullYear() - new Date(patient.birthDate).getFullYear();
            if (age >= 65) setRadio('age', '1');
        });

        const cadRiskFactorsCodes = [
            '38341003', // Hypertension
            '55822004', // Hypercholesterolemia
            '44054006', // Diabetes
        ];
        getPatientConditions(client, cadRiskFactorsCodes).then(conditions => {
            getObservation(client, "72166-2").then(smokingObs => { // Smoking status
                let riskCount = conditions.length;
                if (smokingObs && smokingObs.valueCodeableConcept && smokingObs.valueCodeableConcept.coding.some(c => ['449868002', '428041000124106'].includes(c.code))) {
                    riskCount++;
                }
                if (riskCount >= 3) setRadio('cad_risk', '1');
            });
        });
        
        getPatientConditions(client, ['53741008']).then(conditions => { // Known CAD
            if (conditions.length > 0) setRadio('known_cad', '1');
        });

        client.patient.request(`MedicationStatement?status=active&category=outpatient`).then(meds => {
             if (meds.entry) {
                const hasAspirin = meds.entry.some(e => 
                    e.resource.medicationCodeableConcept &&
                    e.resource.medicationCodeableConcept.coding.some(c => c.code === '1191') // RxNorm for Aspirin
                );
                if (hasAspirin) setRadio('asa', '1');
            }
        });

        const troponinCodes = ['30239-8', '15056-5', '10839-9', '32195-5']; // Troponin T and I
        Promise.all(troponinCodes.map(code => getObservation(client, code))).then(observations => {
            const positiveMarker = observations.some(obs => {
                if (!obs || !obs.valueQuantity || !obs.referenceRange || !obs.referenceRange[0].high) return false;
                return obs.valueQuantity.value > obs.referenceRange[0].high.value;
            });
            if (positiveMarker) setRadio('marker', '1');
        }).finally(() => {
            setTimeout(calculate, 500); // Calculate after all FHIR data has a chance to populate
        });
    }
};
