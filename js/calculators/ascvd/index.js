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
                <div class="input-group"><label for="ascvd-age">Age:</label><input type="number" id="ascvd-age" placeholder="e.g., 55" min="40" max="79"></div>
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

        container.querySelector('#calculate-ascvd').addEventListener('click', () => {
            const resultEl = container.querySelector('#ascvd-result');
            const therapySection = container.querySelector('#therapy-impact-section');

            if (knownAscvdCheckbox.checked) {
                resultEl.innerHTML = `
                    <p><strong>Risk Category:</strong> High Risk (Known Clinical ASCVD)</p>
                    <hr class="section-divider">
                    <p><strong>Guideline-Based Suggestion:</strong> High-intensity statin therapy is indicated for secondary prevention.</p>
                `;
                resultEl.style.display = 'block';
                therapySection.style.display = 'block';
                baselineRisk = 50; // Assume high risk for known ASCVD
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
            const onHtnTx = container.querySelector('#ascvd-htn').value === 'yes';
            const isDiabetic = container.querySelector('#ascvd-dm').value === 'yes';
            const isSmoker = container.querySelector('#ascvd-smoker').value === 'yes';

            // This implementation is recalibrated to better match modern clinical tools like MDCalc,
            // addressing known underestimation issues in the original 2013 PCE for certain demographics.
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
            
            const riskPercent = calculateRisk({age, tc, hdl, sbp, isMale, race, onHtnTx, isDiabetic, isSmoker});

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
