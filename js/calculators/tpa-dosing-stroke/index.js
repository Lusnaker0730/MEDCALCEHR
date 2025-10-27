// js/calculators/tpa-dosing-stroke/index.js
import { getMostRecentObservation } from '../../utils.js';

export const tpaDosing = {
    id: 'tpa-dosing-stroke',
    title: 'tPA Dosing for Acute Stroke',
    description: 'Calculates tissue plasminogen activator (tPA) dosing for acute ischemic stroke.',
    generateHTML: function () {
        return `
            <h3>${this.title}</h3>
            <p>Calculates tissue plasminogen activator (tPA) dosing for acute ischemic stroke.</p>
            
            <div class="input-group">
                <label for="weight">Weight (kg):</label>
                <input type="number" id="weight" placeholder="loading..." step="0.1" min="0">
            </div>
            
            <div class="input-group">
                <label for="symptom-onset">Time from symptom onset (hours):</label>
                <input type="number" id="symptom-onset" placeholder="e.g., 2.5" step="0.1" min="0" max="4.5">
                <small>Must be ≤ 4.5 hours for IV tPA eligibility</small>
            </div>
            
            <button id="calculate-tpa-stroke">Calculate tPA Dosing</button>
            <div id="tpa-stroke-result" class="result" style="display:none;"></div>
            
            <div class="formula-section">
                <h4>📐 Formula & Dosing</h4>
                <div class="formula-box">
                    <div class="formula-title">tPA Total Dose (mg) =</div>
                    <div class="formula-equation">
                        <span class="formula-main">0.9 mg/kg (maximum 90 mg)</span>
                    </div>
                </div>
                
                <div class="dosing-protocol">
                    <h5>💉 Administration Protocol</h5>
                    <div class="protocol-steps">
                        <div class="protocol-step">
                            <h6>Step 1: Initial Bolus (10%)</h6>
                            <p><strong>Dose:</strong> 10% of total dose over 1 minute IV push</p>
                            <p><strong>Formula:</strong> (0.9 × weight) × 0.1 mg</p>
                        </div>
                        <div class="protocol-step">
                            <h6>Step 2: Continuous Infusion (90%)</h6>
                            <p><strong>Dose:</strong> Remaining 90% over 60 minutes</p>
                            <p><strong>Formula:</strong> (0.9 × weight) × 0.9 mg over 1 hour</p>
                        </div>
                    </div>
                </div>
                
                <div class="eligibility-criteria">
                    <h5>✅ Inclusion Criteria</h5>
                    <div class="criteria-grid">
                        <div class="criteria-category">
                            <h6>Time Window</h6>
                            <ul>
                                <li>Symptom onset ≤ 4.5 hours</li>
                                <li>Last known well time ≤ 4.5 hours</li>
                                <li>Wake-up stroke with DWI-FLAIR mismatch</li>
                            </ul>
                        </div>
                        <div class="criteria-category">
                            <h6>Clinical</h6>
                            <ul>
                                <li>Age ≥ 18 years</li>
                                <li>Acute ischemic stroke</li>
                                <li>Measurable neurologic deficit</li>
                                <li>NIHSS typically ≥ 4</li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div class="contraindications">
                    <h5>❌ Major Contraindications</h5>
                    <div class="contraindications-grid">
                        <div class="contraindication-category">
                            <h6>Hemorrhage Risk</h6>
                            <ul>
                                <li>ICH on CT/MRI</li>
                                <li>SAH on CT/MRI</li>
                                <li>Active internal bleeding</li>
                                <li>Recent major surgery (≤ 14 days)</li>
                                <li>Recent head trauma (≤ 3 months)</li>
                            </ul>
                        </div>
                        <div class="contraindication-category">
                            <h6>Coagulation</h6>
                            <ul>
                                <li>Platelets < 100,000/μL</li>
                                <li>INR > 1.7 (if on warfarin)</li>
                                <li>aPTT > 40 sec (if on heparin)</li>
                                <li>Recent anticoagulant use</li>
                            </ul>
                        </div>
                        <div class="contraindication-category">
                            <h6>Blood Pressure</h6>
                            <ul>
                                <li>SBP > 185 mmHg</li>
                                <li>DBP > 110 mmHg</li>
                                <li>Aggressive treatment required</li>
                            </ul>
                        </div>
                        <div class="contraindication-category">
                            <h6>Other</h6>
                            <ul>
                                <li>Glucose < 50 mg/dL</li>
                                <li>Seizure at onset</li>
                                <li>Rapidly improving symptoms</li>
                                <li>Minor symptoms (NIHSS < 4)</li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div class="monitoring-guidelines">
                    <h5>🔍 Post-Administration Monitoring</h5>
                    <div class="monitoring-grid">
                        <div class="monitoring-item">
                            <h6>Neurologic Checks</h6>
                            <ul>
                                <li>Every 15 min × 2 hours</li>
                                <li>Every 30 min × 6 hours</li>
                                <li>Every hour × 16 hours</li>
                            </ul>
                        </div>
                        <div class="monitoring-item">
                            <h6>Blood Pressure</h6>
                            <ul>
                                <li>Every 15 min × 2 hours</li>
                                <li>Every 30 min × 6 hours</li>
                                <li>Every hour × 16 hours</li>
                                <li>Keep < 180/105 mmHg</li>
                            </ul>
                        </div>
                        <div class="monitoring-item">
                            <h6>Hemorrhage Watch</h6>
                            <ul>
                                <li>Any neurologic deterioration</li>
                                <li>Severe headache</li>
                                <li>Nausea/vomiting</li>
                                <li>Hypertension</li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div class="clinical-note">
                    <h5>⚠️ Clinical Notes</h5>
                    <ul>
                        <li><strong>Weight limit:</strong> Maximum dose is 90 mg regardless of weight</li>
                        <li><strong>No anticoagulants:</strong> Avoid heparin, warfarin, or antiplatelet agents for 24 hours</li>
                        <li><strong>Follow-up imaging:</strong> CT head at 24 hours or if neurologic deterioration</li>
                        <li><strong>Blood pressure management:</strong> Avoid aggressive BP reduction unless > 185/110</li>
                        <li><strong>Endovascular therapy:</strong> Consider mechanical thrombectomy for large vessel occlusion</li>
                        <li><strong>Door-to-needle time:</strong> Target < 60 minutes from arrival</li>
                        <li><strong>Symptom-to-needle time:</strong> Target < 4.5 hours from onset</li>
                    </ul>
                </div>
            </div>
        `;
    },
    initialize: function (client) {
        const weightInput = document.getElementById('weight');
        const symptomOnsetInput = document.getElementById('symptom-onset');

        // Try to get weight from patient data
        getMostRecentObservation(client, '29463-7').then(weightObs => {
            if (weightObs) {
                weightInput.value = weightObs.valueQuantity.value.toFixed(1);
            } else {
                weightInput.placeholder = 'e.g., 70';
            }
        });

        document.getElementById('calculate-tpa-stroke').addEventListener('click', () => {
            const weight = parseFloat(weightInput.value);
            const symptomOnset = parseFloat(symptomOnsetInput.value);
            const resultEl = document.getElementById('tpa-stroke-result');

            if (weight > 0) {
                // Calculate tPA dosing
                const totalDose = Math.min(0.9 * weight, 90); // Maximum 90 mg
                const bolus = totalDose * 0.1; // 10% bolus
                const infusion = totalDose * 0.9; // 90% infusion
                const infusionRate = infusion; // mg/hour (over 1 hour)

                let eligibilityStatus = '';
                let eligibilityClass = '';

                if (symptomOnset > 0) {
                    if (symptomOnset <= 4.5) {
                        eligibilityStatus = '✅ Within time window for IV tPA';
                        eligibilityClass = 'eligible';
                    } else {
                        eligibilityStatus = '❌ Outside time window for IV tPA (> 4.5 hours)';
                        eligibilityClass = 'not-eligible';
                    }
                } else {
                    eligibilityStatus = '⚠️ Please enter time from symptom onset';
                    eligibilityClass = 'warning';
                }

                resultEl.innerHTML = `
                    <div class="tpa-dosing-results">
                        <div class="dosing-summary">
                            <h4>tPA Dosing Summary</h4>
                            <div class="dose-calculation">
                                <p><strong>Patient Weight:</strong> ${weight} kg</p>
                                <p><strong>Total Dose:</strong> ${totalDose.toFixed(1)} mg (0.9 mg/kg, max 90 mg)</p>
                            </div>
                        </div>
                        
                        <div class="administration-details">
                            <div class="dose-step">
                                <h5>Step 1: IV Bolus</h5>
                                <p><strong>Dose:</strong> ${bolus.toFixed(1)} mg</p>
                                <p><strong>Administration:</strong> IV push over 1 minute</p>
                            </div>
                            <div class="dose-step">
                                <h5>Step 2: Continuous Infusion</h5>
                                <p><strong>Dose:</strong> ${infusion.toFixed(1)} mg</p>
                                <p><strong>Rate:</strong> ${infusionRate.toFixed(1)} mg/hour</p>
                                <p><strong>Duration:</strong> 60 minutes</p>
                            </div>
                        </div>
                        
                        <div class="eligibility-status ${eligibilityClass}">
                            <p>${eligibilityStatus}</p>
                        </div>
                        
                        <div class="important-reminders">
                            <h5>⚠️ Important Reminders</h5>
                            <ul>
                                <li>Verify all inclusion/exclusion criteria before administration</li>
                                <li>Obtain informed consent when possible</li>
                                <li>Ensure BP < 185/110 mmHg before treatment</li>
                                <li>Have reversal agents available (cryoprecipitate, aminocaproic acid)</li>
                            </ul>
                        </div>
                    </div>
                `;
                resultEl.style.display = 'block';
            } else {
                resultEl.innerHTML = '<p class="error">Please enter a valid weight.</p>';
                resultEl.style.display = 'block';
            }
        });
    }
};
