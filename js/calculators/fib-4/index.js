// js/calculators/fib-4.js
import { getMostRecentObservation, calculateAge } from '../../utils.js';

export const fib4 = {
    id: 'fib-4',
    title: 'Fibrosis-4 (FIB-4) Index',
    generateHTML: function() {
        return `
            <div class="fib4-container">
                <div class="fib4-header">
                    <h3>${this.title}</h3>
                    <p class="fib4-subtitle">Estimates liver fibrosis in patients with chronic liver disease</p>
                </div>

                <div class="fib4-input-section">
                    <div class="fib4-input-card">
                        <div class="input-icon">👤</div>
                        <div class="input-content">
                            <label for="fib4-age">Age (years)</label>
                            <input type="number" id="fib4-age" placeholder="Enter age">
                        </div>
                    </div>

                    <div class="fib4-input-card">
                        <div class="input-icon">🧪</div>
                        <div class="input-content">
                            <label for="fib4-ast">AST (Aspartate Aminotransferase)</label>
                            <input type="number" id="fib4-ast" placeholder="U/L">
                            <span class="input-unit">U/L</span>
                        </div>
                    </div>

                    <div class="fib4-input-card">
                        <div class="input-icon">🧪</div>
                        <div class="input-content">
                            <label for="fib4-alt">ALT (Alanine Aminotransferase)</label>
                            <input type="number" id="fib4-alt" placeholder="U/L">
                            <span class="input-unit">U/L</span>
                        </div>
                    </div>

                    <div class="fib4-input-card">
                        <div class="input-icon">🩸</div>
                        <div class="input-content">
                            <label for="fib4-plt">Platelet Count</label>
                            <input type="number" id="fib4-plt" placeholder="x10⁹/L">
                            <span class="input-unit">×10⁹/L</span>
                        </div>
                    </div>
                </div>

                <button id="calculate-fib4" class="fib4-calculate-btn">
                    <span>Calculate FIB-4 Score</span>
                    <span class="btn-icon">→</span>
                </button>

                <div id="fib4-result" class="fib4-result" style="display:none;"></div>

                <div class="fib4-formula-section">
                    <h4>📐 Formula</h4>
                    <div class="formula-box fib4-formula">
                        <strong>FIB-4 Index</strong> = 
                        <div class="fraction">
                            <div class="numerator">Age (years) × AST (U/L)</div>
                            <div class="denominator">Platelet (10⁹/L) × √ALT (U/L)</div>
                        </div>
                    </div>
                </div>

                <div class="fib4-interpretation-guide">
                    <h4>📊 Interpretation Guide</h4>
                    <div class="interpretation-cards">
                        <div class="interp-card low-risk">
                            <div class="risk-range">< 1.30</div>
                            <div class="risk-label">Low Risk</div>
                            <p>Low probability of advanced fibrosis (F3-F4)</p>
                            <ul>
                                <li>NPV: 90% for excluding advanced fibrosis</li>
                                <li>Continue routine monitoring</li>
                            </ul>
                        </div>

                        <div class="interp-card intermediate-risk">
                            <div class="risk-range">1.30 - 2.67</div>
                            <div class="risk-label">Indeterminate</div>
                            <p>Further evaluation recommended</p>
                            <ul>
                                <li>Consider additional testing (FibroScan, liver biopsy)</li>
                                <li>Clinical correlation required</li>
                            </ul>
                        </div>

                        <div class="interp-card high-risk">
                            <div class="risk-range">> 2.67</div>
                            <div class="risk-label">High Risk</div>
                            <p>High probability of advanced fibrosis (F3-F4)</p>
                            <ul>
                                <li>PPV: 65% for advanced fibrosis</li>
                                <li>Consider referral to hepatology</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div class="fib4-clinical-notes">
                    <h4>⚕️ Clinical Pearls</h4>
                    <ul>
                        <li><strong>Age cutoffs:</strong> Consider age-adjusted thresholds (higher in patients >65 years)</li>
                        <li><strong>HIV coinfection:</strong> Lower cutoffs may be appropriate (1.45 and 3.25)</li>
                        <li><strong>Best use:</strong> Screening test to rule out advanced fibrosis in chronic liver disease</li>
                        <li><strong>Not for use in:</strong> Acute hepatitis, extrahepatic cholestasis, or heart failure</li>
                        <li><strong>Serial monitoring:</strong> Can track disease progression over time</li>
                    </ul>
                </div>
            </div>
        `;
    },
    initialize: function(client, patient) {
        const ageInput = document.getElementById('fib4-age');
        ageInput.value = calculateAge(patient.birthDate);

        getMostRecentObservation(client, '1920-8').then(obs => { // AST
            if (obs) document.getElementById('fib4-ast').value = obs.valueQuantity.value.toFixed(0);
        });
        getMostRecentObservation(client, '1742-6').then(obs => { // ALT
            if (obs) document.getElementById('fib4-alt').value = obs.valueQuantity.value.toFixed(0);
        });
        getMostRecentObservation(client, '777-3').then(obs => { // Platelets
            if (obs) document.getElementById('fib4-plt').value = obs.valueQuantity.value.toFixed(0);
        });

        document.getElementById('calculate-fib4').addEventListener('click', () => {
            const age = parseFloat(ageInput.value);
            const ast = parseFloat(document.getElementById('fib4-ast').value);
            const alt = parseFloat(document.getElementById('fib4-alt').value);
            const plt = parseFloat(document.getElementById('fib4-plt').value);
            const resultEl = document.getElementById('fib4-result');

            if (age > 0 && ast > 0 && alt > 0 && plt > 0) {
                const fib4_score = (age * ast) / (plt * Math.sqrt(alt));
                
                let riskClass = '';
                let riskLabel = '';
                let riskIcon = '';
                let interpretation = '';
                let recommendation = '';
                
                if (fib4_score < 1.30) {
                    riskClass = 'low-risk';
                    riskLabel = 'Low Risk';
                    riskIcon = '✓';
                    interpretation = 'Low probability of advanced fibrosis (F3-F4)';
                    recommendation = 'Continue routine monitoring and address underlying liver disease.';
                } else if (fib4_score > 2.67) {
                    riskClass = 'high-risk';
                    riskLabel = 'High Risk';
                    riskIcon = '⚠';
                    interpretation = 'High probability of advanced fibrosis (F3-F4)';
                    recommendation = 'Consider referral to hepatology for further evaluation and management. Additional testing with FibroScan or liver biopsy may be warranted.';
                } else {
                    riskClass = 'intermediate-risk';
                    riskLabel = 'Indeterminate';
                    riskIcon = '?';
                    interpretation = 'Indeterminate risk - Further evaluation recommended';
                    recommendation = 'Consider additional non-invasive testing (e.g., FibroScan, elastography) or liver biopsy for definitive assessment.';
                }
                
                resultEl.innerHTML = `
                    <div class="fib4-result-content ${riskClass}">
                        <div class="result-header">
                            <div class="result-icon">${riskIcon}</div>
                            <div class="result-main">
                                <div class="result-score-label">FIB-4 Score</div>
                                <div class="result-score-value">${fib4_score.toFixed(2)}</div>
                            </div>
                        </div>
                        <div class="result-divider"></div>
                        <div class="result-details">
                            <div class="risk-classification">
                                <strong>${riskLabel}</strong>
                            </div>
                            <p class="interpretation">${interpretation}</p>
                            <div class="recommendation">
                                <strong>Recommendation:</strong>
                                <p>${recommendation}</p>
                            </div>
                        </div>
                    </div>
                `;
                resultEl.style.display = 'block';
            } else {
                resultEl.innerHTML = `
                    <div class="fib4-result-content error">
                        <p>⚠️ Please enter valid values for all fields.</p>
                    </div>
                `;
                resultEl.style.display = 'block';
            }
        });
    }
};

