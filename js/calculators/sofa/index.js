// js/calculators/sofa.js
import { getMostRecentObservation } from '../../utils.js';

export const sofa = {
    id: 'sofa',
    title: 'SOFA Score for Sepsis Organ Failure',
    description: 'Sequential Organ Failure Assessment (SOFA) Score predicts ICU mortality based on lab results and clinical data.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p class="calculator-description">${this.description}</p>

            <div class="sofa-container">
                <div class="lab-values-summary">
                    <h4>📊 Current Lab Values</h4>
                    <div class="lab-grid">
                        <div class="lab-item">
                            <label>Platelets:</label>
                            <span id="current-platelets">Loading...</span>
                        </div>
                        <div class="lab-item">
                            <label>Creatinine:</label>
                            <span id="current-creatinine">Loading...</span>
                        </div>
                        <div class="lab-item">
                            <label>Bilirubin:</label>
                            <span id="current-bilirubin">Loading...</span>
                        </div>
                        <div class="lab-item">
                            <label>PaO₂/FiO₂:</label>
                            <span id="current-pao2fio2">Manual entry</span>
                        </div>
                    </div>
                </div>

                <div class="sofa-organs-grid">
                    <!-- Respiration -->
                    <div class="organ-card respiration">
                        <div class="organ-header">
                            <div class="organ-icon">🫁</div>
                            <div class="organ-title">Respiration</div>
                            <div class="organ-score" id="resp-score">0</div>
                        </div>
                        <div class="organ-parameter">PaO₂/FiO₂ Ratio</div>
                        <select id="sofa-resp" class="sofa-select">
                            <option value="0">≥400 (Score: 0)</option>
                            <option value="1">&lt;400 (Score: 1)</option>
                            <option value="2">&lt;300 (Score: 2)</option>
                            <option value="3">&lt;200 with respiratory support (Score: 3)</option>
                            <option value="4">&lt;100 with respiratory support (Score: 4)</option>
                        </select>
                        <div class="organ-detail">Mechanical ventilation or CPAP required for scores 3-4</div>
                    </div>

                    <!-- Coagulation -->
                    <div class="organ-card coagulation">
                        <div class="organ-header">
                            <div class="organ-icon">🩸</div>
                            <div class="organ-title">Coagulation</div>
                            <div class="organ-score" id="coag-score">0</div>
                        </div>
                        <div class="organ-parameter">Platelets (×10³/μL)</div>
                        <select id="sofa-coag" class="sofa-select">
                            <option value="0">≥150 (Score: 0)</option>
                            <option value="1">&lt;150 (Score: 1)</option>
                            <option value="2">&lt;100 (Score: 2)</option>
                            <option value="3">&lt;50 (Score: 3)</option>
                            <option value="4">&lt;20 (Score: 4)</option>
                        </select>
                        <div class="organ-detail">Normal platelet count: 150-450 ×10³/μL</div>
                    </div>

                    <!-- Liver -->
                    <div class="organ-card liver">
                        <div class="organ-header">
                            <div class="organ-icon">🫀</div>
                            <div class="organ-title">Liver</div>
                            <div class="organ-score" id="liver-score">0</div>
                        </div>
                        <div class="organ-parameter">Bilirubin (mg/dL)</div>
                        <select id="sofa-liver" class="sofa-select">
                            <option value="0">&lt;1.2 (Score: 0)</option>
                            <option value="1">1.2-1.9 (Score: 1)</option>
                            <option value="2">2.0-5.9 (Score: 2)</option>
                            <option value="3">6.0-11.9 (Score: 3)</option>
                            <option value="4">≥12.0 (Score: 4)</option>
                        </select>
                        <div class="organ-detail">Normal bilirubin: 0.2-1.2 mg/dL</div>
                    </div>

                    <!-- Cardiovascular -->
                    <div class="organ-card cardiovascular">
                        <div class="organ-header">
                            <div class="organ-icon">❤️</div>
                            <div class="organ-title">Cardiovascular</div>
                            <div class="organ-score" id="cardio-score">0</div>
                        </div>
                        <div class="organ-parameter">Hypotension & Vasopressors</div>
                        <select id="sofa-cardio" class="sofa-select">
                            <option value="0">No hypotension (Score: 0)</option>
                            <option value="1">MAP &lt;70 mmHg (Score: 1)</option>
                            <option value="2">Dopamine ≤5 or Dobutamine (any dose) (Score: 2)</option>
                            <option value="3">Dopamine >5 or Epinephrine ≤0.1 or Norepinephrine ≤0.1 (Score: 3)</option>
                            <option value="4">Dopamine >15 or Epinephrine >0.1 or Norepinephrine >0.1 (Score: 4)</option>
                        </select>
                        <div class="organ-detail">Vasopressor doses in μg/kg/min</div>
                    </div>

                    <!-- CNS -->
                    <div class="organ-card cns">
                        <div class="organ-header">
                            <div class="organ-icon">🧠</div>
                            <div class="organ-title">Central Nervous System</div>
                            <div class="organ-score" id="cns-score">0</div>
                        </div>
                        <div class="organ-parameter">Glasgow Coma Scale</div>
                        <select id="sofa-cns" class="sofa-select">
                            <option value="0">15 (Score: 0)</option>
                            <option value="1">13-14 (Score: 1)</option>
                            <option value="2">10-12 (Score: 2)</option>
                            <option value="3">6-9 (Score: 3)</option>
                            <option value="4">&lt;6 (Score: 4)</option>
                        </select>
                        <div class="organ-detail">Normal GCS: 15 (Eye 4 + Verbal 5 + Motor 6)</div>
                    </div>

                    <!-- Renal -->
                    <div class="organ-card renal">
                        <div class="organ-header">
                            <div class="organ-icon">🫘</div>
                            <div class="organ-title">Renal</div>
                            <div class="organ-score" id="renal-score">0</div>
                        </div>
                        <div class="organ-parameter">Creatinine (mg/dL) or Urine Output</div>
                        <select id="sofa-renal" class="sofa-select">
                            <option value="0">&lt;1.2 (Score: 0)</option>
                            <option value="1">1.2-1.9 (Score: 1)</option>
                            <option value="2">2.0-3.4 (Score: 2)</option>
                            <option value="3">3.5-4.9 or UO &lt;500 mL/day (Score: 3)</option>
                            <option value="4">≥5.0 or UO &lt;200 mL/day (Score: 4)</option>
                        </select>
                        <div class="organ-detail">Normal creatinine: 0.6-1.2 mg/dL</div>
                    </div>
                </div>
            </div>

            <div class="sofa-result-container">
                <div class="total-score-display">
                    <div class="score-circle">
                        <div class="score-number" id="total-sofa-score">0</div>
                        <div class="score-label">Total SOFA</div>
                    </div>
                    <div class="mortality-assessment">
                        <div class="mortality-risk" id="mortality-risk">Low Risk</div>
                        <div class="mortality-percentage" id="mortality-percentage">~10%</div>
                        <div class="mortality-description">ICU Mortality Risk</div>
                    </div>
                </div>

                <div class="score-interpretation">
                    <h4>📈 Score Interpretation</h4>
                    <div class="interpretation-grid">
                        <div class="interpretation-item low-mortality">
                            <div class="score-range">0-6 points</div>
                            <div class="mortality-category">Low Mortality</div>
                            <div class="mortality-rate">&lt;10%</div>
                        </div>
                        <div class="interpretation-item moderate-mortality">
                            <div class="score-range">7-9 points</div>
                            <div class="mortality-category">Moderate Mortality</div>
                            <div class="mortality-rate">15-20%</div>
                        </div>
                        <div class="interpretation-item high-mortality">
                            <div class="score-range">10-12 points</div>
                            <div class="mortality-category">High Mortality</div>
                            <div class="mortality-rate">40-50%</div>
                        </div>
                        <div class="interpretation-item very-high-mortality">
                            <div class="score-range">13+ points</div>
                            <div class="mortality-category">Very High Mortality</div>
                            <div class="mortality-rate">&gt;80%</div>
                        </div>
                    </div>
                </div>

                <div class="delta-sofa-info">
                    <h4>📊 ΔSOFA (Delta SOFA) Significance</h4>
                    <div class="delta-grid">
                        <div class="delta-item">
                            <h5>ΔSOFA ≥2 points</h5>
                            <p>Indicates organ dysfunction and increased mortality risk. Used in Sepsis-3 definition.</p>
                        </div>
                        <div class="delta-item">
                            <h5>ΔSOFA 0-1 points</h5>
                            <p>Stable organ function. Monitor for changes over time.</p>
                        </div>
                        <div class="delta-item">
                            <h5>Improving ΔSOFA</h5>
                            <p>Decreasing scores indicate improving organ function and better prognosis.</p>
                        </div>
                    </div>
                </div>

                <div class="clinical-applications">
                    <h4>🏥 Clinical Applications</h4>
                    <div class="applications-grid">
                        <div class="application-item">
                            <h5>Sepsis Diagnosis</h5>
                            <ul>
                                <li>ΔSOFA ≥2 points defines organ dysfunction</li>
                                <li>Core component of Sepsis-3 criteria</li>
                                <li>Serial assessments more valuable than single scores</li>
                            </ul>
                        </div>
                        <div class="application-item">
                            <h5>ICU Monitoring</h5>
                            <ul>
                                <li>Daily SOFA scoring for trend analysis</li>
                                <li>Guide intensity of care and interventions</li>
                                <li>Prognostic tool for family discussions</li>
                            </ul>
                        </div>
                        <div class="application-item">
                            <h5>Research & Quality</h5>
                            <ul>
                                <li>Standardized severity assessment</li>
                                <li>Clinical trial stratification</li>
                                <li>ICU performance benchmarking</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <div class="references-section">
                <h4>📚 Reference & Development</h4>
                <div class="reference-content">
                    <div class="reference-citation">
                        <h5>Original SOFA Score Development</h5>
                        <p><strong>Vincent JL, Moreno R, Takala J, Willatts S, De Mendonça A, Bruining H, Reinhart CK, Suter PM, Thijs LG.</strong> The SOFA (Sepsis-related Organ Failure Assessment) score to describe organ dysfunction/failure. On behalf of the Working Group on Sepsis-Related Problems of the European Society of Intensive Care Medicine. <em>Intensive Care Med</em>. 1996 Jul;22(7):707-10.</p>
                        <p><strong>PMID:</strong> <a href="https://pubmed.ncbi.nlm.nih.gov/8844239/" target="_blank" rel="noopener noreferrer">8844239</a></p>
                        <p><strong>DOI:</strong> <a href="https://doi.org/10.1007/BF01709751" target="_blank" rel="noopener noreferrer">10.1007/BF01709751</a></p>
                    </div>
                    
                    <div class="study-details">
                        <h5>Development Background</h5>
                        <div class="study-grid">
                            <div class="study-item">
                                <h6>Development Group</h6>
                                <p>European Society of Intensive Care Medicine Working Group on Sepsis-Related Problems</p>
                            </div>
                            <div class="study-item">
                                <h6>Original Purpose</h6>
                                <p>Describe organ dysfunction/failure in sepsis patients with objective, quantifiable criteria</p>
                            </div>
                            <div class="study-item">
                                <h6>Scoring System</h6>
                                <p>Six organ systems, each scored 0-4 points based on degree of dysfunction</p>
                            </div>
                            <div class="study-item">
                                <h6>Clinical Validation</h6>
                                <p>Extensively validated across multiple ICU populations and clinical scenarios</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="study-results">
                        <h5>Key Clinical Features</h5>
                        <div class="findings-grid">
                            <div class="finding-item">
                                <h6>Organ Systems Assessed</h6>
                                <ul>
                                    <li>Respiratory (PaO₂/FiO₂ ratio)</li>
                                    <li>Coagulation (platelet count)</li>
                                    <li>Hepatic (bilirubin level)</li>
                                    <li>Cardiovascular (hypotension/vasopressors)</li>
                                    <li>Central nervous system (GCS)</li>
                                    <li>Renal (creatinine/urine output)</li>
                                </ul>
                            </div>
                            <div class="finding-item">
                                <h6>Clinical Utility</h6>
                                <ul>
                                    <li>Objective assessment of organ dysfunction</li>
                                    <li>Prognostic indicator for ICU mortality</li>
                                    <li>Tool for clinical decision-making</li>
                                    <li>Research standardization instrument</li>
                                    <li>Quality improvement metric</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <div class="clinical-validation">
                        <h5>🏥 Clinical Impact & Evolution</h5>
                        <div class="validation-points">
                            <div class="validation-item">
                                <h6>Sepsis-3 Integration</h6>
                                <p>SOFA score became central to the Sepsis-3 definition, with ΔSOFA ≥2 points defining organ dysfunction in sepsis diagnosis.</p>
                            </div>
                            <div class="validation-item">
                                <h6>Global Adoption</h6>
                                <p>Widely adopted across ICUs worldwide as the standard tool for assessing and monitoring organ dysfunction in critically ill patients.</p>
                            </div>
                            <div class="validation-item">
                                <h6>Prognostic Accuracy</h6>
                                <p>Strong correlation between SOFA scores and ICU mortality, with higher scores predicting worse outcomes across diverse patient populations.</p>
                            </div>
                            <div class="validation-item">
                                <h6>Dynamic Assessment</h6>
                                <p>Serial SOFA measurements provide more valuable prognostic information than single time-point assessments, enabling trend-based clinical decisions.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    initialize: function(client) {
        // Auto-populate lab values and set up event listeners
        this.populateLabValues(client);
        this.setupEventListeners();
        this.calculateScore();
    },
    
    populateLabValues: function(client) {
        // Get platelets
        getMostRecentObservation(client, '2160-0').then(platelets => {
            if(platelets && platelets.valueQuantity) {
                const val = platelets.valueQuantity.value;
                document.getElementById('current-platelets').textContent = `${val.toFixed(0)} ×10³/μL`;
                
                const select = document.getElementById('sofa-coag');
                if (val >= 150) select.value = "0";
                else if (val >= 100) select.value = "1";
                else if (val >= 50) select.value = "2";
                else if (val >= 20) select.value = "3";
                else select.value = "4";
                
                this.updateOrganScore('coag', select.value);
            } else {
                document.getElementById('current-platelets').textContent = 'Not available';
            }
        }).catch(error => {
            console.error('Error fetching platelets:', error);
            document.getElementById('current-platelets').textContent = 'Not available';
        });

        // Get creatinine
        getMostRecentObservation(client, '2160-0').then(creatinine => {
            if(creatinine && creatinine.valueQuantity) {
                const val = creatinine.valueQuantity.value;
                document.getElementById('current-creatinine').textContent = `${val.toFixed(1)} mg/dL`;
                
                const select = document.getElementById('sofa-renal');
                if (val < 1.2) select.value = "0";
                else if (val < 2.0) select.value = "1";
                else if (val < 3.5) select.value = "2";
                else if (val < 5.0) select.value = "3";
                else select.value = "4";
                
                this.updateOrganScore('renal', select.value);
            } else {
                document.getElementById('current-creatinine').textContent = 'Not available';
            }
        }).catch(error => {
            console.error('Error fetching creatinine:', error);
            document.getElementById('current-creatinine').textContent = 'Not available';
        });

        // Get bilirubin
        getMostRecentObservation(client, '1975-2').then(bilirubin => {
            if(bilirubin && bilirubin.valueQuantity) {
                const val = bilirubin.valueQuantity.value;
                document.getElementById('current-bilirubin').textContent = `${val.toFixed(1)} mg/dL`;
                
                const select = document.getElementById('sofa-liver');
                if (val < 1.2) select.value = "0";
                else if (val < 2.0) select.value = "1";
                else if (val < 6.0) select.value = "2";
                else if (val < 12.0) select.value = "3";
                else select.value = "4";
                
                this.updateOrganScore('liver', select.value);
            } else {
                document.getElementById('current-bilirubin').textContent = 'Not available';
            }
        }).catch(error => {
            console.error('Error fetching bilirubin:', error);
            document.getElementById('current-bilirubin').textContent = 'Not available';
        });

        // Recalculate after data population
        setTimeout(() => this.calculateScore(), 1000);
    },
    
    setupEventListeners: function() {
        const selects = document.querySelectorAll('.sofa-select');
        selects.forEach(select => {
            select.addEventListener('change', (e) => {
                const organType = e.target.id.replace('sofa-', '');
                this.updateOrganScore(organType, e.target.value);
                this.calculateScore();
            });
        });
    },
    
    updateOrganScore: function(organType, score) {
        const scoreElement = document.getElementById(`${organType}-score`);
        if (scoreElement) {
            scoreElement.textContent = score;
        }
    },
    
    calculateScore: function() {
        const selectors = ['sofa-resp', 'sofa-coag', 'sofa-liver', 'sofa-cardio', 'sofa-cns', 'sofa-renal'];
        let totalScore = 0;
        
        selectors.forEach(id => {
            const value = parseInt(document.getElementById(id).value);
            totalScore += value;
        });

        // Update total score display
        document.getElementById('total-sofa-score').textContent = totalScore;
        
        // Update mortality assessment
        let mortalityRisk = '';
        let mortalityPercentage = '';
        let riskClass = '';
        
        if (totalScore <= 6) {
            mortalityRisk = 'Low Risk';
            mortalityPercentage = '~10%';
            riskClass = 'low-mortality';
        } else if (totalScore <= 9) {
            mortalityRisk = 'Moderate Risk';
            mortalityPercentage = '15-20%';
            riskClass = 'moderate-mortality';
        } else if (totalScore <= 12) {
            mortalityRisk = 'High Risk';
            mortalityPercentage = '40-50%';
            riskClass = 'high-mortality';
        } else {
            mortalityRisk = 'Very High Risk';
            mortalityPercentage = '>80%';
            riskClass = 'very-high-mortality';
        }
        
        document.getElementById('mortality-risk').textContent = mortalityRisk;
        document.getElementById('mortality-percentage').textContent = mortalityPercentage;
        
        // Update interpretation highlighting
        document.querySelectorAll('.interpretation-item').forEach(item => item.classList.remove('active'));
        document.querySelector(`.interpretation-item.${riskClass}`).classList.add('active');
        
        // Update score circle color
        const scoreCircle = document.querySelector('.score-circle');
        scoreCircle.className = `score-circle ${riskClass}`;
    }
};
