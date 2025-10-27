import { getMostRecentObservation, calculateAge } from '../../utils.js';

export const nafldFibrosisScore = {
    id: 'nafld-fibrosis-score',
    title: 'NAFLD (Non-Alcoholic Fatty Liver Disease) Fibrosis Score',
    description: 'Estimates amount of scarring in the liver based on several laboratory tests.',
    generateHTML: function () {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <div class="input-group">
                <label for="nafld-age">Age (years)</label>
                <input type="number" id="nafld-age" min="0" max="120">
            </div>
            <div class="input-group">
                <label for="nafld-bmi">BMI (kg/m²)</label>
                <input type="number" id="nafld-bmi" step="0.1" min="0">
            </div>
            <div class="input-group">
                <label for="nafld-diabetes">Impaired Fasting Glucose / Diabetes?</label>
                <select id="nafld-diabetes">
                    <option value="0">No</option>
                    <option value="1">Yes</option>
                </select>
            </div>
            <div class="input-group">
                <label for="nafld-ast">AST (U/L)</label>
                <input type="number" id="nafld-ast" min="0">
            </div>
            <div class="input-group">
                <label for="nafld-alt">ALT (U/L)</label>
                <input type="number" id="nafld-alt" min="0">
            </div>
            <div class="input-group">
                <label for="nafld-platelet">Platelet Count (×10⁹/L)</label>
                <input type="number" id="nafld-platelet" min="0">
            </div>
            <div class="input-group">
                <label for="nafld-albumin">Albumin (g/dL)</label>
                <input type="number" id="nafld-albumin" step="0.1" min="0">
            </div>
            
            <div id="nafld-result" class="result" style="display:none;"></div>

            <!-- Formula Section -->
            <div class="formula-section">
                <h4>📐 NAFLD Fibrosis Score Formula</h4>
                <p style="font-size: 0.9em; color: #666; margin-bottom: 15px;">
                    The NAFLD Fibrosis Score is a non-invasive test that predicts the presence of advanced fibrosis in patients with NAFLD using routine laboratory tests.
                </p>

                <!-- Main Formula -->
                <div style="background: #f5f7fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                    <h5 style="margin-top: 0; color: #333;">NAFLD Fibrosis Score Calculation:</h5>
                    <p style="font-family: monospace; background: white; padding: 15px; border-radius: 5px; overflow-x: auto; margin-bottom: 10px; word-break: break-all;">
                        Score = -1.675 + (0.037 × Age) + (0.094 × BMI)<br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ (1.13 × Diabetes [0 or 1]) + (0.99 × AST/ALT ratio)<br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;- (0.013 × Platelet count) - (0.66 × Albumin)
                    </p>
                </div>

                <!-- Variables Definition -->
                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #2196F3;">
                    <h5 style="margin-top: 0; color: #1976D2;">📋 Variable Definitions:</h5>
                    <ul style="margin: 10px 0; padding-left: 20px; font-size: 0.9em;">
                        <li><strong>Age:</strong> Patient age in years</li>
                        <li><strong>BMI:</strong> Body Mass Index (kg/m²)</li>
                        <li><strong>Diabetes:</strong> Binary (0 = No, 1 = Yes) - includes impaired fasting glucose</li>
                        <li><strong>AST/ALT ratio:</strong> Aspartate aminotransferase divided by Alanine aminotransferase</li>
                        <li><strong>Platelet count:</strong> In ×10⁹/L (e.g., 150-400 normal range)</li>
                        <li><strong>Albumin:</strong> In g/dL (normal 3.5-5.0 g/dL)</li>
                    </ul>
                </div>

                <!-- Score Interpretation -->
                <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #f39c12;">
                    <h5 style="margin-top: 0; color: #d68910;">📊 NAFLD Fibrosis Score Interpretation:</h5>
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.9em; margin-top: 10px;">
                        <tr style="background: #fff8e1;">
                            <th style="border: 1px solid #ffeaa7; padding: 10px; text-align: left;"><strong>NAFLD Score Range</strong></th>
                            <th style="border: 1px solid #ffeaa7; padding: 10px; text-align: left;"><strong>Fibrosis Stage</strong></th>
                            <th style="border: 1px solid #ffeaa7; padding: 10px; text-align: left;"><strong>Clinical Significance</strong></th>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ffeaa7; padding: 10px;"><strong>&lt; -1.455</strong></td>
                            <td style="border: 1px solid #ffeaa7; padding: 10px;"><strong>F0-F2</strong> (No to Moderate Fibrosis)</td>
                            <td style="border: 1px solid #ffeaa7; padding: 10px;">Low probability of advanced fibrosis</td>
                        </tr>
                        <tr style="background: #f5f5f5;">
                            <td style="border: 1px solid #ffeaa7; padding: 10px;"><strong>-1.455 to 0.675</strong></td>
                            <td style="border: 1px solid #ffeaa7; padding: 10px;"><strong>Indeterminate</strong></td>
                            <td style="border: 1px solid #ffeaa7; padding: 10px;">Further testing may be needed (e.g., FibroScan, liver biopsy)</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ffeaa7; padding: 10px;"><strong>&gt; 0.675</strong></td>
                            <td style="border: 1px solid #ffeaa7; padding: 10px;"><strong>F3-F4</strong> (Advanced Fibrosis/Cirrhosis)</td>
                            <td style="border: 1px solid #ffeaa7; padding: 10px;">High probability of advanced fibrosis; consider specialist referral</td>
                        </tr>
                    </table>
                </div>

                <!-- Fibrosis Stages -->
                <div style="background: #f1f8e9; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #c5e1a5;">
                    <h5 style="margin-top: 0; color: #33691e;">📈 Fibrosis Severity Scale:</h5>
                    <ul style="margin: 10px 0; padding-left: 20px; font-size: 0.9em;">
                        <li><strong>F0:</strong> No fibrosis</li>
                        <li><strong>F1:</strong> Mild fibrosis</li>
                        <li><strong>F2:</strong> Moderate fibrosis</li>
                        <li><strong>F3:</strong> Severe fibrosis</li>
                        <li><strong>F4:</strong> Cirrhosis (most severe)</li>
                    </ul>
                </div>

                <!-- Clinical Considerations -->
                <div style="background: #fef5e7; padding: 15px; border-radius: 8px; border-left: 4px solid #f39c12;">
                    <h5 style="margin-top: 0; color: #d68910;">📌 Important Clinical Notes:</h5>
                    <ul style="margin: 10px 0; padding-left: 20px; font-size: 0.85em; color: #555;">
                        <li><strong>Non-invasive Test:</strong> Does not require liver biopsy; uses routine laboratory tests</li>
                        <li><strong>Accuracy:</strong> AUROC 0.803 for discriminating F ≥ 3 vs F &lt; 3</li>
                        <li><strong>Limitations:</strong> Not ideal for individual patient prediction; better for screening populations</li>
                        <li><strong>AST/ALT Ratio:</strong> Important marker - elevated ratio suggests greater fibrosis risk</li>
                        <li><strong>Platelet Count:</strong> Thrombocytopenia often associated with advanced fibrosis/portal hypertension</li>
                        <li><strong>Indeterminate Zone:</strong> Patients with intermediate scores require further evaluation (FibroScan, imaging, or biopsy)</li>
                        <li><strong>Complementary Tests:</strong> FibroScan (transient elastography) can help confirm results, especially in indeterminate zone</li>
                        <li><strong>NAFLD Progression:</strong> Regular monitoring recommended for all patients with NAFLD, not just those with advanced fibrosis</li>
                    </ul>
                </div>

                <!-- Risk Factors -->
                <div style="background: #e8f4fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196F3;">
                    <h5 style="margin-top: 0; color: #0c5460;">⚠️ Risk Factors for NAFLD Progression:</h5>
                    <ul style="margin: 10px 0; padding-left: 20px; font-size: 0.85em; color: #0c5460;">
                        <li>Obesity (BMI ≥ 30 kg/m²)</li>
                        <li>Type 2 diabetes or metabolic syndrome</li>
                        <li>Hypertension and dyslipidemia</li>
                        <li>Elevated ALT/AST levels</li>
                        <li>Age over 50 years</li>
                        <li>Male gender</li>
                        <li>Genetic factors (PNPLA3, TM6SF2 variants)</li>
                    </ul>
                </div>
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        const ageEl = container.querySelector('#nafld-age');
        const bmiEl = container.querySelector('#nafld-bmi');
        const diabetesEl = container.querySelector('#nafld-diabetes');
        const astEl = container.querySelector('#nafld-ast');
        const altEl = container.querySelector('#nafld-alt');
        const plateletEl = container.querySelector('#nafld-platelet');
        const albuminEl = container.querySelector('#nafld-albumin');
        const resultEl = container.querySelector('#nafld-result');

        if (patient && patient.birthDate) {
            ageEl.value = calculateAge(patient.birthDate);
        }

        // Fetch observations
        if (client) {
            getMostRecentObservation(client, '39156-5')
                .then(obs => {
                    // BMI
                    if (obs && obs.valueQuantity) {
                        bmiEl.value = obs.valueQuantity.value.toFixed(1);
                        calculateAndUpdate();
                    }
                })
                .catch(err => console.log('BMI data not available'));

            getMostRecentObservation(client, '1920-8')
                .then(obs => {
                    // AST
                    if (obs && obs.valueQuantity) {
                        astEl.value = obs.valueQuantity.value.toFixed(0);
                        calculateAndUpdate();
                    }
                })
                .catch(err => console.log('AST data not available'));

            getMostRecentObservation(client, '1742-6')
                .then(obs => {
                    // ALT
                    if (obs && obs.valueQuantity) {
                        altEl.value = obs.valueQuantity.value.toFixed(0);
                        calculateAndUpdate();
                    }
                })
                .catch(err => console.log('ALT data not available'));

            getMostRecentObservation(client, '777-3')
                .then(obs => {
                    // Platelet
                    if (obs && obs.valueQuantity) {
                        plateletEl.value = obs.valueQuantity.value.toFixed(0);
                        calculateAndUpdate();
                    }
                })
                .catch(err => console.log('Platelet data not available'));

            getMostRecentObservation(client, '1751-7')
                .then(obs => {
                    // Albumin
                    if (obs && obs.valueQuantity) {
                        albuminEl.value = obs.valueQuantity.value.toFixed(1);
                        calculateAndUpdate();
                    }
                })
                .catch(err => console.log('Albumin data not available'));
        }

        const calculateAndUpdate = () => {
            const age = parseInt(ageEl.value);
            const bmi = parseFloat(bmiEl.value);
            const diabetes = parseInt(diabetesEl.value);
            const ast = parseInt(astEl.value);
            const alt = parseInt(altEl.value);
            const platelet = parseInt(plateletEl.value);
            const albumin = parseFloat(albuminEl.value);

            // Check if all values are valid
            if (
                isNaN(age) ||
                isNaN(bmi) ||
                isNaN(ast) ||
                isNaN(alt) ||
                isNaN(platelet) ||
                isNaN(albumin)
            ) {
                resultEl.style.display = 'none';
                return;
            }

            if (alt === 0) {
                resultEl.innerHTML =
                    '<p style="color: red;"><strong>Error:</strong> ALT cannot be zero for calculation.</p>';
                resultEl.style.display = 'block';
                return;
            }

            const astAltRatio = ast / alt;
            const score =
                -1.675 +
                0.037 * age +
                0.094 * bmi +
                1.13 * diabetes +
                0.99 * astAltRatio -
                0.013 * platelet -
                0.66 * albumin;

            let fibrosisStage = '';
            let interpretation = '';
            let riskColor = '';
            let recommendedAction = '';

            if (score < -1.455) {
                fibrosisStage = 'F0-F2 (No to Moderate Fibrosis)';
                interpretation = 'Low probability of advanced fibrosis';
                riskColor = '#388e3c';
                recommendedAction = 'Continue regular monitoring and lifestyle modifications';
            } else if (score <= 0.675) {
                fibrosisStage = 'Indeterminate';
                interpretation = 'Further evaluation needed';
                riskColor = '#ff9800';
                recommendedAction =
                    'Consider FibroScan (transient elastography) or other confirmatory testing';
            } else {
                fibrosisStage = 'F3-F4 (Advanced Fibrosis/Cirrhosis)';
                interpretation = 'High probability of advanced fibrosis';
                riskColor = '#d32f2f';
                recommendedAction =
                    'Recommend specialist referral for further evaluation and management';
            }

            resultEl.innerHTML = `
                <div class="result-item">
                    <span class="value">${score.toFixed(3)}</span>
                    <span class="label">NAFLD Fibrosis Score</span>
                </div>
                <div style="background: ${riskColor}20; border-left: 4px solid ${riskColor}; padding: 15px; border-radius: 5px; margin-top: 15px;">
                    <div style="font-size: 0.95em; margin-bottom: 8px;">
                        <strong style="color: ${riskColor};">📊 Fibrosis Stage:</strong> <span style="color: ${riskColor}; font-weight: bold;">${fibrosisStage}</span>
                    </div>
                    <div style="font-size: 0.9em; margin-bottom: 8px; color: ${riskColor};">
                        <strong>Interpretation:</strong> ${interpretation}
                    </div>
                    <div style="font-size: 0.9em; color: ${riskColor};">
                        <strong>Recommended Action:</strong> ${recommendedAction}
                    </div>
                </div>
                <div style="margin-top: 15px; padding: 12px; background: #e3f2fd; border-radius: 5px; font-size: 0.85em; border-left: 4px solid #2196F3;">
                    <strong>Score Breakdown:</strong><br>
                    • Age factor: ${(0.037 * age).toFixed(3)}<br>
                    • BMI factor: ${(0.094 * bmi).toFixed(3)}<br>
                    • Diabetes factor: ${(1.13 * diabetes).toFixed(3)}<br>
                    • AST/ALT ratio (${astAltRatio.toFixed(2)}): ${(0.99 * astAltRatio).toFixed(3)}<br>
                    • Platelet factor: ${(-0.013 * platelet).toFixed(3)}<br>
                    • Albumin factor: ${(-0.66 * albumin).toFixed(3)}
                </div>
            `;
            resultEl.style.display = 'block';
        };

        // Add event listeners for automatic calculation
        ageEl.addEventListener('input', calculateAndUpdate);
        bmiEl.addEventListener('input', calculateAndUpdate);
        diabetesEl.addEventListener('change', calculateAndUpdate);
        astEl.addEventListener('input', calculateAndUpdate);
        altEl.addEventListener('input', calculateAndUpdate);
        plateletEl.addEventListener('input', calculateAndUpdate);
        albuminEl.addEventListener('input', calculateAndUpdate);

        // Initial calculation if data is already loaded
        calculateAndUpdate();
    }
};
