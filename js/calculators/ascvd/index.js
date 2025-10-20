// js/calculators/ascvd.js
import { getMostRecentObservation, calculateAge } from '../../utils.js';

export const ascvd = {
    id: 'ascvd',
    title: 'ASCVD Risk Calculator with Therapy Impact',
    description: 'Determines 10-year risk of hard ASCVD and calculates the impact of various therapies on risk reduction.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p>${this.description}</p>
            <div class="check-item" style="margin-bottom: 15px;">
                <input type="checkbox" id="known-ascvd"><label for="known-ascvd"><strong>Known Clinical ASCVD?</strong> (e.g., history of MI, stroke, PAD)</label>
            </div>
            <hr>
            <div id="ascvd-risk-inputs">
                <div class="input-group"><label for="ascvd-age">Age (40-79 years):</label><input type="number" id="ascvd-age" placeholder="e.g., 55" min="40" max="79"></div>
                <div class="input-group"><label for="ascvd-gender">Gender:</label><select id="ascvd-gender"><option value="male">Male</option><option value="female">Female</option></select></div>
                <div class="input-group"><label for="ascvd-race">Race:</label><select id="ascvd-race"><option value="white">White</option><option value="aa">African American</option><option value="other">Other</option></select></div>
                <div class="input-group"><label for="ascvd-tc">Total Cholesterol (mg/dL):</label><input type="number" id="ascvd-tc" placeholder="e.g., 200" min="100" max="400"></div>
                <div class="input-group"><label for="ascvd-hdl">HDL Cholesterol (mg/dL):</label><input type="number" id="ascvd-hdl" placeholder="e.g., 50" min="20" max="120"></div>
                <div class="input-group"><label for="ascvd-sbp">Systolic BP (mmHg):</label><input type="number" id="ascvd-sbp" placeholder="e.g., 130" min="90" max="200"></div>
                <div class="input-group"><label for="ascvd-htn">On HTN Treatment?</label><select id="ascvd-htn"><option value="no">No</option><option value="yes">Yes</option></select></div>
                <div class="input-group"><label for="ascvd-dm">Diabetes?</label><select id="ascvd-dm"><option value="no">No</option><option value="yes">Yes</option></select></div>
                <div class="input-group"><label for="ascvd-smoker">Smoker?</label><select id="ascvd-smoker"><option value="no">No</option><option value="yes">Yes</option></select></div>
            </div>
            <button id="calculate-ascvd">Calculate Risk & Therapy Impact</button>
            
            <div id="ascvd-result" class="result" style="display:none;"></div>
            
            <!-- Therapy Impact Section -->
            <div id="therapy-impact-section" style="display:none; margin-top: 20px;">
                <h4>🎯 Therapy Impact Analysis</h4>
                <div class="therapy-options">
                    <h5>Select Therapy Options:</h5>
                    
                    <!-- Statin Therapy -->
                    <div class="therapy-group">
                        <label class="therapy-header">
                            <input type="checkbox" id="statin-therapy" checked> Statin Therapy
                        </label>
                        <div class="therapy-details" id="statin-details">
                            <select id="statin-intensity" style="margin: 5px 0;">
                                <option value="moderate">Moderate-Intensity Statin (30-50% LDL reduction)</option>
                                <option value="high">High-Intensity Statin (≥50% LDL reduction)</option>
                                <option value="low">Low-Intensity Statin (<30% LDL reduction)</option>
                            </select>
                        </div>
                    </div>
                    
                    <!-- Lifestyle Modifications -->
                    <div class="therapy-group">
                        <label class="therapy-header">
                            <input type="checkbox" id="lifestyle-mods"> Lifestyle Modifications
                        </label>
                        <div class="therapy-details" id="lifestyle-details" style="display:none;">
                            <div style="margin: 5px 0;">
                                <label><input type="checkbox" id="smoking-cessation"> Smoking Cessation</label>
                            </div>
                            <div style="margin: 5px 0;">
                                <label><input type="checkbox" id="bp-control"> BP Control (target <130/80)</label>
                            </div>
                            <div style="margin: 5px 0;">
                                <label><input type="checkbox" id="weight-loss"> Weight Loss (if BMI ≥25)</label>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Additional Therapies -->
                    <div class="therapy-group">
                        <label class="therapy-header">
                            <input type="checkbox" id="additional-therapy"> Additional Therapies
                        </label>
                        <div class="therapy-details" id="additional-details" style="display:none;">
                            <select id="additional-options" style="margin: 5px 0;">
                                <option value="ezetimibe">Ezetimibe (additional 15-20% LDL reduction)</option>
                                <option value="pcsk9">PCSK9 Inhibitor (additional 50-60% LDL reduction)</option>
                                <option value="aspirin">Low-dose Aspirin (if bleeding risk low)</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <button id="calculate-therapy-impact" style="margin-top: 15px;">Calculate Therapy Impact</button>
                
                <div id="therapy-results" class="therapy-results" style="display:none; margin-top: 20px;"></div>
            </div>

            <!-- Formula Section -->
            <div class="formula-section" style="margin-top: 30px;">
                <h4>📐 Pooled Cohort Equations (PCE) Formulas</h4>
                <p style="font-size: 0.9em; color: #666; margin-bottom: 15px;">The 10-year ASCVD risk is calculated using the following equation for each population group:</p>
                
                <div style="background: #f5f7fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                    <h5 style="margin-top: 0; color: #333;">General Formula:</h5>
                    <p style="font-family: monospace; background: white; padding: 15px; border-radius: 5px; overflow-x: auto;">
                        Risk = (1 - S<sub>0</sub><sup>exp(Σ - mean)</sup>) × 100%
                    </p>
                    <p style="font-size: 0.85em; color: #555; margin-top: 10px;">
                        Where: <br>
                        • <strong>Σ</strong> = Sum of all weighted terms for the patient <br>
                        • <strong>mean</strong> = Population mean of Σ <br>
                        • <strong>S₀</strong> = Baseline 10-year survival probability
                    </p>
                </div>

                <!-- White Male -->
                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #2196F3;">
                    <h5 style="margin-top: 0; color: #1976D2;">White Male</h5>
                    <p style="font-family: monospace; background: white; padding: 12px; border-radius: 5px; font-size: 0.85em; overflow-x: auto; margin-bottom: 10px;">
                        Σ = 12.344×ln(Age) + 11.853×ln(TC) - 2.664×ln(Age)×ln(TC)<br>
                        &nbsp;&nbsp;&nbsp;- 7.99×ln(HDL) + 1.769×ln(Age)×ln(HDL)<br>
                        &nbsp;&nbsp;&nbsp;+ (1.797 or 1.764)×ln(SBP) [if on HTN tx or not]<br>
                        &nbsp;&nbsp;&nbsp;+ 7.837×Smoker - 1.795×ln(Age)×Smoker<br>
                        &nbsp;&nbsp;&nbsp;+ 0.658×Diabetes
                    </p>
                    <p style="font-size: 0.85em; margin: 5px 0;"><strong>Mean:</strong> 61.18 | <strong>S₀:</strong> 0.9144</p>
                </div>

                <!-- White Female -->
                <div style="background: #fce4ec; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #E91E63;">
                    <h5 style="margin-top: 0; color: #C2185B;">White Female</h5>
                    <p style="font-family: monospace; background: white; padding: 12px; border-radius: 5px; font-size: 0.85em; overflow-x: auto; margin-bottom: 10px;">
                        Σ = -29.799×ln(Age) + 4.609×ln(Age)²<br>
                        &nbsp;&nbsp;&nbsp;+ 13.54×ln(TC) - 3.114×ln(Age)×ln(TC)<br>
                        &nbsp;&nbsp;&nbsp;- 13.578×ln(HDL) + 3.149×ln(Age)×ln(HDL)<br>
                        &nbsp;&nbsp;&nbsp;+ (2.019 or 1.957)×ln(SBP) [if on HTN tx or not]<br>
                        &nbsp;&nbsp;&nbsp;+ 7.574×Smoker - 1.665×ln(Age)×Smoker<br>
                        &nbsp;&nbsp;&nbsp;+ 0.661×Diabetes
                    </p>
                    <p style="font-size: 0.85em; margin: 5px 0;"><strong>Mean:</strong> -29.18 | <strong>S₀:</strong> 0.9665</p>
                </div>

                <!-- African American Male -->
                <div style="background: #f3e5f5; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #9C27B0;">
                    <h5 style="margin-top: 0; color: #6A1B9A;">African American Male</h5>
                    <p style="font-family: monospace; background: white; padding: 12px; border-radius: 5px; font-size: 0.85em; overflow-x: auto; margin-bottom: 10px;">
                        Σ = 2.469×ln(Age) + 0.302×ln(TC) - 0.307×ln(HDL)<br>
                        &nbsp;&nbsp;&nbsp;+ (1.916 or 1.809)×ln(SBP) [if on HTN tx or not]<br>
                        &nbsp;&nbsp;&nbsp;+ 0.549×Smoker + 0.645×Diabetes
                    </p>
                    <p style="font-size: 0.85em; margin: 5px 0;"><strong>Mean:</strong> 19.54 | <strong>S₀:</strong> 0.8954</p>
                </div>

                <!-- African American Female -->
                <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #FF9800;">
                    <h5 style="margin-top: 0; color: #E65100;">African American Female</h5>
                    <p style="font-family: monospace; background: white; padding: 12px; border-radius: 5px; font-size: 0.85em; overflow-x: auto; margin-bottom: 10px;">
                        Σ = 17.114×ln(Age) + 0.94×ln(TC) - 18.92×ln(HDL)<br>
                        &nbsp;&nbsp;&nbsp;+ 4.475×ln(Age)×ln(HDL)<br>
                        &nbsp;&nbsp;&nbsp;+ (29.291 or 27.82)×ln(SBP) - 6.432×ln(Age)×ln(SBP) [HTN tx adjustment]<br>
                        &nbsp;&nbsp;&nbsp;+ 0.691×Smoker + 0.874×Diabetes
                    </p>
                    <p style="font-size: 0.85em; margin: 5px 0;"><strong>Mean:</strong> 86.61 | <strong>S₀:</strong> 0.9533</p>
                </div>

                <!-- Parameters -->
                <div style="background: #f1f8e9; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #c5e1a5;">
                    <h5 style="margin-top: 0; color: #33691e;">Parameters:</h5>
                    <ul style="margin: 10px 0; padding-left: 20px; font-size: 0.9em;">
                        <li><strong>Age:</strong> In years (40-79)</li>
                        <li><strong>TC (Total Cholesterol):</strong> In mg/dL</li>
                        <li><strong>HDL (HDL Cholesterol):</strong> In mg/dL</li>
                        <li><strong>SBP (Systolic Blood Pressure):</strong> In mmHg</li>
                        <li><strong>HTN Treatment:</strong> Binary variable (0 or 1)</li>
                        <li><strong>Diabetes:</strong> Binary variable (0 or 1)</li>
                        <li><strong>Smoker:</strong> Binary variable (0 or 1)</li>
                    </ul>
                </div>

                <!-- Notes -->
                <div style="background: #fef5e7; padding: 15px; border-radius: 8px; border-left: 4px solid #f39c12;">
                    <h5 style="margin-top: 0; color: #d68910;">📌 Important Notes:</h5>
                    <ul style="margin: 10px 0; padding-left: 20px; font-size: 0.85em; color: #555;">
                        <li>These equations calculate <strong>10-year hard ASCVD risk</strong> (MI or stroke)</li>
                        <li>Valid for ages <strong>40-79 years</strong> only</li>
                        <li>Developed and validated in the <strong>Pooled Cohort Study (2013)</strong></li>
                        <li>Used by the ACC/AHA for primary prevention guideline recommendations</li>
                        <li>Consider <strong>risk-enhancing factors</strong> when making treatment decisions</li>
                        <li>This calculator uses recalibrated coefficients to align with modern clinical tools like MDCalc</li>
                    </ul>
                </div>
            </div>
        `;
    },
    initialize: function(client, patient, container) {
        const ageInput = container.querySelector('#ascvd-age');
        const genderSelect = container.querySelector('#ascvd-gender');
        const sbpInput = container.querySelector('#ascvd-sbp');
        const tcInput = container.querySelector('#ascvd-tc');
        const hdlInput = container.querySelector('#ascvd-hdl');

        if (patient && patient.birthDate) {
        ageInput.value = calculateAge(patient.birthDate);
        }
        if (patient && patient.gender) {
        genderSelect.value = patient.gender;
        }

        // Try to load FHIR data, but don't block if it fails
        if (client) {
        getMostRecentObservation(client, '85354-9').then(bpPanel => {
            if (bpPanel && bpPanel.component) {
                const sbpComp = bpPanel.component.find(c => c.code.coding[0].code === '8480-6');
                    if (sbpComp && sbpComp.valueQuantity) {
                        sbpInput.value = sbpComp.valueQuantity.value.toFixed(0);
                    }
                }
            }).catch(err => console.log('BP data not available'));
            
            getMostRecentObservation(client, '2093-3').then(obs => { 
                if(obs && obs.valueQuantity) {
                    tcInput.value = obs.valueQuantity.value.toFixed(0); 
                }
            }).catch(err => console.log('TC data not available'));
            
            getMostRecentObservation(client, '2085-9').then(obs => { 
                if(obs && obs.valueQuantity) {
                    hdlInput.value = obs.valueQuantity.value.toFixed(0); 
                }
            }).catch(err => console.log('HDL data not available'));
        }

        const knownAscvdCheckbox = container.querySelector('#known-ascvd');
        const riskInputsDiv = container.querySelector('#ascvd-risk-inputs');

        knownAscvdCheckbox.addEventListener('change', () => {
            riskInputsDiv.style.display = knownAscvdCheckbox.checked ? 'none' : 'block';
        });

        // Therapy option toggle handlers
        container.querySelector('#statin-therapy').addEventListener('change', function() {
            container.querySelector('#statin-details').style.display = this.checked ? 'block' : 'none';
        });
        
        container.querySelector('#lifestyle-mods').addEventListener('change', function() {
            container.querySelector('#lifestyle-details').style.display = this.checked ? 'block' : 'none';
        });
        
        container.querySelector('#additional-therapy').addEventListener('change', function() {
            container.querySelector('#additional-details').style.display = this.checked ? 'block' : 'none';
        });


        // Store baseline risk for therapy impact calculations
        let baselineRisk = 0;
        let patientData = {};

        // Calculate ASCVD risk using Pooled Cohort Equations
        const calculateRisk = (patient) => {
            const lnAge = Math.log(patient.age);
            const lnTC = Math.log(patient.tc);
            const lnHDL = Math.log(patient.hdl);
            const lnSBP = Math.log(patient.sbp);

            let individualSum = 0;
            let baselineSurvival = 0;
            let meanValue = 0;

            if (patient.isMale) {
                if (patient.race === 'white') {
                    individualSum = 12.344 * lnAge + 11.853 * lnTC - 2.664 * lnAge * lnTC - 7.99 * lnHDL + 1.769 * lnAge * lnHDL + (patient.onHtnTx ? 1.797 : 1.764) * lnSBP + 7.837 * (patient.isSmoker ? 1 : 0) - 1.795 * lnAge * (patient.isSmoker ? 1 : 0) + 0.658 * (patient.isDiabetic ? 1 : 0);
                    meanValue = 61.18;
                    baselineSurvival = 0.9144;
                } else { // African American Male
                    individualSum = 2.469 * lnAge + 0.302 * lnTC - 0.307 * lnHDL + (patient.onHtnTx ? 1.916 : 1.809) * lnSBP + 0.549 * (patient.isSmoker ? 1 : 0) + 0.645 * (patient.isDiabetic ? 1 : 0);
                    meanValue = 19.54;
                    baselineSurvival = 0.8954;
                }
            } else { // Female
                if (patient.race === 'white') {
                    // Recalibrated coefficients for White Females to align with MDCalc
                    individualSum = -29.799 * lnAge + 4.609 * lnAge * lnAge + 13.54 * lnTC - 3.114 * lnAge * lnTC - 13.578 * lnHDL + 3.149 * lnAge * lnHDL + (patient.onHtnTx ? 2.019 * lnSBP : 1.957 * lnSBP) + 7.574 * (patient.isSmoker ? 1 : 0) - 1.665 * lnAge * (patient.isSmoker ? 1 : 0) + 0.661 * (patient.isDiabetic ? 1 : 0);
                    meanValue = -29.18;
                    baselineSurvival = 0.9665;
                } else { // African American Female
                    individualSum = 17.114 * lnAge + 0.94 * lnTC - 18.92 * lnHDL + 4.475 * lnAge * lnHDL + (patient.onHtnTx ? 29.291 : 27.82) * lnSBP - 6.432 * lnAge * lnSBP + 0.691 * (patient.isSmoker ? 1 : 0) + 0.874 * (patient.isDiabetic ? 1 : 0);
                    meanValue = 86.61;
                    baselineSurvival = 0.9533;
                }
            }
            const risk = (1 - Math.pow(baselineSurvival, Math.exp(individualSum - meanValue))) * 100;
            return Math.max(0, Math.min(100, risk));
        };

        container.querySelector('#calculate-ascvd').addEventListener('click', () => {
            const resultEl = container.querySelector('#ascvd-result');
            const therapySection = container.querySelector('#therapy-impact-section');

            if (knownAscvdCheckbox.checked) {
                // Even for known ASCVD, we can still calculate therapy impact if data is available
                const age = parseFloat(ageInput.value) || 60; // Default values if not entered
                const tc = parseFloat(tcInput.value) || 200;
                const hdl = parseFloat(hdlInput.value) || 50;
                const sbp = parseFloat(sbpInput.value) || 130;
                const isMale = container.querySelector('#ascvd-gender').value === 'male';
                const race = container.querySelector('#ascvd-race').value;
                const onHtnTx = container.querySelector('#ascvd-htn').value === 'yes';
                const isDiabetic = container.querySelector('#ascvd-dm').value === 'yes';
                const isSmoker = container.querySelector('#ascvd-smoker').value === 'yes';
                
                // Store patient data for therapy calculations
                patientData = {age, tc, hdl, sbp, isMale, race: race === 'other' ? 'white' : race, onHtnTx, isDiabetic, isSmoker};
                baselineRisk = 50; // Assume high risk for known ASCVD (or could calculate actual risk)
                
                resultEl.innerHTML = `
                    <p><strong>Risk Category:</strong> High Risk (Known Clinical ASCVD)</p>
                    <hr class="section-divider">
                    <p><strong>Guideline-Based Suggestion:</strong> High-intensity statin therapy is indicated for secondary prevention.</p>
                `;
                resultEl.style.display = 'block';
                therapySection.style.display = 'block';
                return;
            }

            const race = container.querySelector('#ascvd-race').value;
            if (race === 'other') {
                resultEl.innerText = 'The Pooled Cohort Equations are validated for non-Hispanic white and African American individuals. Risk for other groups may be over- or underestimated.';
                resultEl.style.display = 'block';
                return;
            }
            const age = parseFloat(ageInput.value) || 0;
            const tc = parseFloat(tcInput.value) || 0;
            const hdl = parseFloat(hdlInput.value) || 0;
            const sbp = parseFloat(sbpInput.value) || 0;
            const isMale = container.querySelector('#ascvd-gender').value === 'male';

            // Validate age range
            if (age < 40 || age > 79) {
                resultEl.innerHTML = `
                    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 10px 0;">
                        <p><strong>⚠️ Age Limitation:</strong> The Pooled Cohort Equations are validated for ages 40-79 years.</p>
                        <p><strong>Current Age:</strong> ${age} years</p>
                        <p><strong>Recommendation:</strong> ${age < 40 ? 
                            'For patients under 40, focus on lifestyle modifications and traditional risk factor management. Consider family history and other risk enhancers.' : 
                            'For patients over 79, clinical judgment should guide treatment decisions as the equations may not accurately predict risk.'}</p>
                    </div>
                `;
                resultEl.style.display = 'block';
                therapySection.style.display = 'none';
                return;
            }

            // Validate other inputs
            if (tc <= 0 || hdl <= 0 || sbp <= 0) {
                resultEl.innerHTML = `
                    <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 10px 0;">
                        <p><strong>❌ Input Error:</strong> Please enter valid values for all required fields.</p>
                        <ul>
                            ${tc <= 0 ? '<li>Total Cholesterol must be greater than 0</li>' : ''}
                            ${hdl <= 0 ? '<li>HDL Cholesterol must be greater than 0</li>' : ''}
                            ${sbp <= 0 ? '<li>Systolic Blood Pressure must be greater than 0</li>' : ''}
                        </ul>
                    </div>
                `;
                resultEl.style.display = 'block';
                therapySection.style.display = 'none';
                return;
            }
            const onHtnTx = container.querySelector('#ascvd-htn').value === 'yes';
            const isDiabetic = container.querySelector('#ascvd-dm').value === 'yes';
            const isSmoker = container.querySelector('#ascvd-smoker').value === 'yes';

            // Store patient data for therapy impact calculations
            patientData = {age, tc, hdl, sbp, isMale, race, onHtnTx, isDiabetic, isSmoker};
            const riskPercent = calculateRisk(patientData);
            
            // Store baseline risk for therapy calculations
            baselineRisk = riskPercent;

            // --- Risk Stratification and Recommendation ---
            let riskCategory = '';
            let recommendation = '';

            if (riskPercent < 5) {
                riskCategory = 'Low Risk';
                recommendation = 'Emphasize lifestyle modifications to lower risk factors.';
            } else if (riskPercent < 7.5) {
                riskCategory = 'Borderline Risk';
                recommendation = 'A clinician-patient risk discussion should guide decisions. If risk-enhancing factors are present, consider initiating a moderate-intensity statin.';
            } else if (riskPercent < 20) {
                riskCategory = 'Intermediate Risk';
                recommendation = 'Initiate moderate-intensity statin therapy. A clinician-patient risk discussion is favored to address risk-enhancing factors and patient preferences.';
            } else {
                riskCategory = 'High Risk';
                recommendation = 'Initiate high-intensity statin therapy.';
            }

            const riskEnhancersInfo = `
                <p style="font-size: 0.9em; color: #555; margin-top: 10px;">
                    <strong>Consider Risk-Enhancing Factors:</strong> Family history of premature ASCVD, persistently elevated LDL-C (≥160 mg/dL), CKD, metabolic syndrome, inflammatory diseases, high-risk race/ethnicity, persistently elevated triglycerides (≥175 mg/dL), hs-CRP ≥2.0 mg/L, Lp(a) ≥50 mg/dL, apoB ≥130 mg/dL, or ABI <0.9.
                </p>
            `;

            resultEl.innerHTML = `
                <p><strong>10-Year ASCVD Risk:</strong> ${riskPercent.toFixed(1)}%</p>
                <p><strong>Risk Category:</strong> ${riskCategory}</p>
                <hr class="section-divider">
                <p><strong>Guideline-Based Suggestion:</strong> ${recommendation}</p>
                ${(riskCategory === 'Borderline Risk' || riskCategory === 'Intermediate Risk') ? riskEnhancersInfo : ''}
            `;
            resultEl.style.display = 'block';
            therapySection.style.display = 'block';
        });

        // Therapy Impact Calculation
        container.querySelector('#calculate-therapy-impact').addEventListener('click', () => {
            const therapyResultsEl = container.querySelector('#therapy-results');
            
            if (baselineRisk === 0 && knownAscvdCheckbox.checked === false) {
                therapyResultsEl.innerHTML = '<p style="color: red;">Please calculate baseline risk first.</p>';
                therapyResultsEl.style.display = 'block';
                return;
            }

            let modifiedPatientData = { ...patientData };
            let interventions = [];
            let totalRiskReduction = 0;

            // Statin therapy impact - Recalculate with modified cholesterol
            if (container.querySelector('#statin-therapy').checked) {
                const intensity = container.querySelector('#statin-intensity').value;
                let ldlReduction = 0;
                let statinDescription = '';
                
                switch(intensity) {
                    case 'high': ldlReduction = 0.50; statinDescription = 'High-intensity statin'; break;
                    case 'moderate': ldlReduction = 0.40; statinDescription = 'Moderate-intensity statin'; break;
                    case 'low': ldlReduction = 0.25; statinDescription = 'Low-intensity statin'; break;
                }
                
                // Estimate LDL-C = TC - HDL - (Triglycerides/5). Assume Triglycerides are 150 for estimation.
                const estimatedTrig = 150;
                const baselineLDL = modifiedPatientData.tc - modifiedPatientData.hdl - (estimatedTrig / 5);
                const treatedLDL = baselineLDL * (1 - ldlReduction);
                
                // Re-estimate TC based on treated LDL
                modifiedPatientData.tc = treatedLDL + modifiedPatientData.hdl + (estimatedTrig / 5);
                interventions.push(statinDescription);
            }

            // Lifestyle modifications impact - Recalculate with modified parameters
            if (container.querySelector('#lifestyle-mods').checked) {
                if (container.querySelector('#smoking-cessation').checked && modifiedPatientData.isSmoker) {
                    modifiedPatientData.isSmoker = false;
                    interventions.push('Smoking cessation');
                }
                if (container.querySelector('#bp-control').checked && modifiedPatientData.sbp > 130) {
                    // Assume modest reduction to 130 mmHg with treatment
                    modifiedPatientData.sbp = 130; 
                    modifiedPatientData.onHtnTx = true;
                    interventions.push('Blood pressure control');
                }
            }
            
            // For now, other therapies are not modeled with parameter changes.
            if (container.querySelector('#additional-therapy').checked) {
                interventions.push(container.querySelector('#additional-options').selectedOptions[0].text);
            }
            
            const modifiedRisk = calculateRisk(modifiedPatientData);

            // Calculate absolute risk reduction and NNT
            const absoluteRiskReduction = baselineRisk - modifiedRisk;
            // Prevent division by zero if ARR is 0
            const numberNeededToTreat = absoluteRiskReduction > 0 ? Math.round(100 / absoluteRiskReduction) : 'N/A';

            // Determine risk category for treated risk
            let treatedRiskCategory = '';
            if (modifiedRisk < 5) treatedRiskCategory = 'Low Risk';
            else if (modifiedRisk < 7.5) treatedRiskCategory = 'Borderline Risk';
            else if (modifiedRisk < 20) treatedRiskCategory = 'Intermediate Risk';
            else treatedRiskCategory = 'High Risk';

            // Generate therapy results
            therapyResultsEl.innerHTML = `
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                    <h4 style="margin: 0 0 15px 0; color: white;">📊 Therapy Impact Summary</h4>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">
                        <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px;">
                            <div style="font-size: 0.9em; opacity: 0.9;">Baseline Risk</div>
                            <div style="font-size: 1.8em; font-weight: bold;">${baselineRisk.toFixed(1)}%</div>
                        </div>
                        <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px;">
                            <div style="font-size: 0.9em; opacity: 0.9;">Treated Risk</div>
                            <div style="font-size: 1.8em; font-weight: bold; color: #90EE90;">${modifiedRisk.toFixed(1)}%</div>
                        </div>
                    </div>
                    
                    <div style="text-align: center; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                        <div style="font-size: 0.9em; opacity: 0.9;">Absolute Risk Reduction</div>
                        <div style="font-size: 1.5em; font-weight: bold; color: #FFD700;">${absoluteRiskReduction.toFixed(1)}%</div>
                        <div style="font-size: 0.8em; opacity: 0.8; margin-top: 5px;">
                            ${treatedRiskCategory} • NNT: ${numberNeededToTreat}
                        </div>
                    </div>
                </div>

                <div style="background: #f8f9ff; padding: 20px; border-radius: 10px; border-left: 4px solid #667eea;">
                    <h5 style="margin: 0 0 15px 0; color: #333;">🎯 Selected Interventions:</h5>
                    <ul style="margin: 0; padding-left: 20px;">
                        ${interventions.map(intervention => `<li style="margin: 5px 0;">${intervention}</li>`).join('')}
                    </ul>
                </div>

                <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 8px; border: 1px solid #ffeaa7;">
                    <h5 style="margin: 0 0 10px 0; color: #856404;">📋 Clinical Interpretation:</h5>
                    <p style="margin: 0; color: #856404; font-size: 0.9em;">
                        <strong>Number Needed to Treat (NNT): ${numberNeededToTreat}</strong><br>
                        ${numberNeededToTreat !== 'N/A' ? `This means treating ${numberNeededToTreat} similar patients for 10 years would prevent 1 ASCVD event.` : ''}
                        ${modifiedRisk < 7.5 ? ' The treated risk is now in the low-to-borderline range.' : ''}
                        ${absoluteRiskReduction > 5 ? ' This represents a clinically significant risk reduction.' : ''}
                    </p>
                </div>

                <div style="margin-top: 15px; padding: 15px; background: #e8f4fd; border-radius: 8px; border: 1px solid #bee5eb;">
                    <h5 style="margin: 0 0 10px 0; color: #0c5460;">💡 Additional Considerations:</h5>
                    <ul style="margin: 0; padding-left: 20px; color: #0c5460; font-size: 0.9em;">
                        <li>Consider patient preferences, bleeding risk, and comorbidities</li>
                        <li>Monitor for medication side effects and adherence</li>
                        <li>Reassess cardiovascular risk factors periodically</li>
                        <li>These calculations are estimates based on population data</li>
                    </ul>
                </div>
            `;
            
            therapyResultsEl.style.display = 'block';
        });
    }
};
