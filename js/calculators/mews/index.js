import { getMostRecentObservation } from '../../utils.js';

// js/calculators/mews/index.js
export const mewsScore = {
    id: 'mews',
    title: 'Modified Early Warning Score (MEWS)',
    description:
        'Determines the degree of illness of a patient. Identifies patients at risk for clinical deterioration.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            <div class="alert info">
                <span class="alert-icon">ℹ️</span>
                <div class="alert-content">
                    <div class="alert-title">Instructions</div>
                    <p>Different hospitals and regions may use different modifications of the MEWS. Verify that your institution uses the same point assignments listed here.</p>
                </div>
            </div>
            
            <form id="mews-form">
                <!-- Systolic BP Section -->
                <div class="section">
                    <div class="section-title">
                        <span class="section-title-icon">🩺</span>
                        <span>Systolic BP (mmHg)</span>
                    </div>
                    
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" name="sbp" value="0" data-label="101-199 mmHg" checked>
                            <span>101-199 mmHg <span class="badge-points">0 points</span></span>
                        </label>
                        
                        <label class="radio-option">
                            <input type="radio" name="sbp" value="1" data-label="81-100 mmHg">
                            <span>81-100 mmHg <span class="badge-points">+1</span></span>
                        </label>
                        
                        <label class="radio-option">
                            <input type="radio" name="sbp" value="2" data-label="71-80 or ≥200 mmHg">
                            <span>71-80 or ≥200 mmHg <span class="badge-points">+2</span></span>
                        </label>
                        
                        <label class="radio-option">
                            <input type="radio" name="sbp" value="3" data-label="≤70 mmHg">
                            <span>≤70 mmHg <span class="badge-points warning">+3</span></span>
                        </label>
                    </div>
                </div>
                
                <!-- Heart Rate Section -->
                <div class="section">
                    <div class="section-title">
                        <span class="section-title-icon">❤️</span>
                        <span>Heart Rate (beats per minute)</span>
                    </div>
                    
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" name="hr" value="0" data-label="51-100 bpm" checked>
                            <span>51-100 bpm <span class="badge-points">0 points</span></span>
                        </label>
                        
                        <label class="radio-option">
                            <input type="radio" name="hr" value="1" data-label="41-50 or 101-110 bpm">
                            <span>41-50 or 101-110 bpm <span class="badge-points">+1</span></span>
                        </label>
                        
                        <label class="radio-option">
                            <input type="radio" name="hr" value="2" data-label="<40 or 111-129 bpm">
                            <span>&lt;40 or 111-129 bpm <span class="badge-points">+2</span></span>
                        </label>
                        
                        <label class="radio-option">
                            <input type="radio" name="hr" value="3" data-label="≥130 bpm">
                            <span>≥130 bpm <span class="badge-points warning">+3</span></span>
                        </label>
                    </div>
                </div>
                
                <!-- Respiratory Rate Section -->
                <div class="section">
                    <div class="section-title">
                        <span class="section-title-icon">🫁</span>
                        <span>Respiratory Rate (breaths per minute)</span>
                    </div>
                    
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" name="rr" value="0" data-label="9-14 bpm" checked>
                            <span>9-14 bpm <span class="badge-points">0 points</span></span>
                        </label>
                        
                        <label class="radio-option">
                            <input type="radio" name="rr" value="1" data-label="15-20 bpm">
                            <span>15-20 bpm <span class="badge-points">+1</span></span>
                        </label>
                        
                        <label class="radio-option">
                            <input type="radio" name="rr" value="2" data-label="<9 or 21-29 bpm">
                            <span>&lt;9 or 21-29 bpm <span class="badge-points">+2</span></span>
                        </label>
                        
                        <label class="radio-option">
                            <input type="radio" name="rr" value="3" data-label="≥30 bpm">
                            <span>≥30 bpm <span class="badge-points warning">+3</span></span>
                        </label>
                    </div>
                </div>
                
                <!-- Temperature Section -->
                <div class="section">
                    <div class="section-title">
                        <span class="section-title-icon">🌡️</span>
                        <span>Temperature</span>
                    </div>
                    
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" name="temp" value="0" data-label="35.0-38.4°C (95-101.12°F)" checked>
                            <span>35.0-38.4°C (95-101.12°F) <span class="badge-points">0 points</span></span>
                        </label>
                        
                        <label class="radio-option">
                            <input type="radio" name="temp" value="2" data-label="<35°C (<95°F) or ≥38.5°C (≥101.3°F)">
                            <span>&lt;35°C (&lt;95°F) or ≥38.5°C (≥101.3°F) <span class="badge-points">+2</span></span>
                        </label>
                    </div>
                </div>
                
                <!-- AVPU Section -->
                <div class="section">
                    <div class="section-title">
                        <span class="section-title-icon">🧠</span>
                        <span>AVPU Scale (Level of Consciousness)</span>
                    </div>
                    
                    <div class="radio-group">
                        <label class="radio-option">
                            <input type="radio" name="avpu" value="0" data-label="Alert" checked>
                            <span>Alert <span class="badge-points">0 points</span></span>
                        </label>
                        
                        <label class="radio-option">
                            <input type="radio" name="avpu" value="1" data-label="Voice - Responds to voice">
                            <span>Voice - Responds to voice <span class="badge-points">+1</span></span>
                        </label>
                        
                        <label class="radio-option">
                            <input type="radio" name="avpu" value="2" data-label="Pain - Responds to pain">
                            <span>Pain - Responds to pain <span class="badge-points">+2</span></span>
                        </label>
                        
                        <label class="radio-option">
                            <input type="radio" name="avpu" value="3" data-label="Unresponsive">
                            <span>Unresponsive <span class="badge-points warning">+3</span></span>
                        </label>
                    </div>
                </div>
            </form>
            
            <div class="result-container" id="mews-result" style="display:none;"></div>
            
            <!-- Formula Section -->
            <div class="info-section mt-30">
                <h4>📐 Formula</h4>
                <div class="formula-box">
                    <div class="formula-title">MEWS Score Calculation</div>
                    <p class="formula-text">MEWS = Systolic BP points + Heart Rate points + Respiratory Rate points + Temperature points + AVPU points</p>
                    <p class="mt-10"><strong>Total Score Range:</strong> 0-14 points</p>
                </div>
                
                <div class="formula-box mt-15">
                    <div class="formula-title">Points Assignment</div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Parameter</th>
                                <th>Range</th>
                                <th>Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td rowspan="4"><strong>Systolic BP</strong></td>
                                <td>≤70 mmHg</td>
                                <td>+3</td>
                            </tr>
                            <tr>
                                <td>71-80 mmHg</td>
                                <td>+2</td>
                            </tr>
                            <tr>
                                <td>81-100 mmHg</td>
                                <td>+1</td>
                            </tr>
                            <tr>
                                <td>101-199 mmHg</td>
                                <td>0</td>
                            </tr>
                            <tr>
                                <td></td>
                                <td>≥200 mmHg</td>
                                <td>+2</td>
                            </tr>
                            <tr>
                                <td rowspan="4"><strong>Heart Rate</strong></td>
                                <td>&lt;40 bpm</td>
                                <td>+2</td>
                            </tr>
                            <tr>
                                <td>41-50 bpm</td>
                                <td>+1</td>
                            </tr>
                            <tr>
                                <td>51-100 bpm</td>
                                <td>0</td>
                            </tr>
                            <tr>
                                <td>101-110 bpm</td>
                                <td>+1</td>
                            </tr>
                            <tr>
                                <td></td>
                                <td>111-129 bpm</td>
                                <td>+2</td>
                            </tr>
                            <tr>
                                <td></td>
                                <td>≥130 bpm</td>
                                <td>+3</td>
                            </tr>
                            <tr>
                                <td rowspan="4"><strong>Respiratory Rate</strong></td>
                                <td>&lt;9 bpm</td>
                                <td>+2</td>
                            </tr>
                            <tr>
                                <td>9-14 bpm</td>
                                <td>0</td>
                            </tr>
                            <tr>
                                <td>15-20 bpm</td>
                                <td>+1</td>
                            </tr>
                            <tr>
                                <td>21-29 bpm</td>
                                <td>+2</td>
                            </tr>
                            <tr>
                                <td></td>
                                <td>≥30 bpm</td>
                                <td>+3</td>
                            </tr>
                            <tr>
                                <td rowspan="2"><strong>Temperature</strong></td>
                                <td>&lt;35°C (&lt;95°F)</td>
                                <td>+2</td>
                            </tr>
                            <tr>
                                <td>35.0-38.4°C (95-101.12°F)</td>
                                <td>0</td>
                            </tr>
                            <tr>
                                <td></td>
                                <td>≥38.5°C (≥101.3°F)</td>
                                <td>+2</td>
                            </tr>
                            <tr>
                                <td rowspan="4"><strong>AVPU</strong></td>
                                <td>Alert</td>
                                <td>0</td>
                            </tr>
                            <tr>
                                <td>Voice</td>
                                <td>+1</td>
                            </tr>
                            <tr>
                                <td>Pain</td>
                                <td>+2</td>
                            </tr>
                            <tr>
                                <td>Unresponsive</td>
                                <td>+3</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            <!-- Interpretation Section -->
            <div class="info-section mt-30">
                <h4>📊 Interpretation</h4>
                <div class="formula-box">
                    <div class="formula-title">Risk Stratification</div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>MEWS Score</th>
                                <th>Risk Level</th>
                                <th>Recommended Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>0-1</strong></td>
                                <td><span class="badge-risk low">Low Risk</span></td>
                                <td>Continue routine monitoring</td>
                            </tr>
                            <tr>
                                <td><strong>2-3</strong></td>
                                <td><span class="badge-risk moderate">Moderate Risk</span></td>
                                <td>Increase frequency of observations; notify nurse in charge</td>
                            </tr>
                            <tr>
                                <td><strong>4</strong></td>
                                <td><span class="badge-risk moderate-high">Moderate-High Risk</span></td>
                                <td>Urgent call to doctor; consider ICU assessment</td>
                            </tr>
                            <tr>
                                <td><strong>≥5</strong></td>
                                <td><span class="badge-risk high">High Risk</span></td>
                                <td>Emergency call to doctor; immediate ICU assessment</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="alert warning mt-15">
                    <span class="alert-icon">⚠️</span>
                    <div class="alert-content">
                        <div class="alert-title">Clinical Note</div>
                        <p><strong>A score ≥5</strong> is statistically linked to <strong>increased likelihood of death or admission to an intensive care unit</strong>.</p>
                        <p class="mt-10"><strong>For any single physiological parameter scored +3</strong>, consider <strong>higher level of care</strong> for the patient, even if the total score is &lt;5.</p>
                    </div>
                </div>
                
                <div class="formula-box mt-15">
                    <div class="formula-title">AVPU Scale Explanation</div>
                    <ul>
                        <li><strong>A (Alert):</strong> Patient is fully awake and responds appropriately</li>
                        <li><strong>V (Voice):</strong> Patient responds to verbal stimuli</li>
                        <li><strong>P (Pain):</strong> Patient responds only to painful stimuli</li>
                        <li><strong>U (Unresponsive):</strong> Patient does not respond to any stimuli</li>
                    </ul>
                </div>
            </div>
            
            <!-- Clinical Pearls -->
            <div class="info-section mt-30">
                <h4>💡 Clinical Pearls</h4>
                <div class="formula-box">
                    <ul>
                        <li>MEWS is designed for early identification of patients at risk of clinical deterioration</li>
                        <li>Serial MEWS scores are more valuable than isolated measurements</li>
                        <li>Consider trending scores over time to detect deterioration</li>
                        <li>Different institutions may use variations of MEWS - always confirm local protocols</li>
                        <li>MEWS should supplement, not replace, clinical judgment</li>
                        <li>Some institutions use additional parameters (e.g., urine output, SpO2)</li>
                    </ul>
                </div>
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        // If only one parameter is passed (old style), use it as container
        if (!container && typeof client === 'object' && client.nodeType === 1) {
            container = client;
        }

        // Use document if container is not a DOM element
        const root = container || document;

        // Calculate function
        const calculate = () => {
            const sbp = parseInt(root.querySelector('input[name="sbp"]:checked')?.value || 0);
            const hr = parseInt(root.querySelector('input[name="hr"]:checked')?.value || 0);
            const rr = parseInt(root.querySelector('input[name="rr"]:checked')?.value || 0);
            const temp = parseInt(root.querySelector('input[name="temp"]:checked')?.value || 0);
            const avpu = parseInt(root.querySelector('input[name="avpu"]:checked')?.value || 0);

            const score = sbp + hr + rr + temp + avpu;

            let interpretation = '';
            let riskBadgeClass = '';
            let severityClass = '';
            let riskLevel = '';
            let recommendation = '';
            let chanceText = '';

            if (score === 0 || score === 1) {
                interpretation = 'Low risk of clinical deterioration. Continue routine monitoring.';
                riskBadgeClass = 'low';
                severityClass = 'low';
                riskLevel = 'Low Risk';
                recommendation = 'Continue routine monitoring';
            } else if (score === 2 || score === 3) {
                interpretation =
                    'Moderate risk of clinical deterioration. Increase frequency of observations and notify nurse in charge.';
                riskBadgeClass = 'moderate';
                severityClass = 'moderate';
                riskLevel = 'Moderate Risk';
                recommendation = 'Increase observation frequency; notify nurse in charge';
            } else if (score === 4) {
                interpretation =
                    'Moderate-high risk of clinical deterioration. Urgent call to doctor and consider ICU assessment.';
                riskBadgeClass = 'moderate-high';
                severityClass = 'moderate';
                riskLevel = 'Moderate-High Risk';
                recommendation = 'Urgent doctor call; consider ICU assessment';
            } else {
                interpretation =
                    'High risk of clinical deterioration. Emergency call to doctor and immediate ICU assessment required.';
                riskBadgeClass = 'high';
                severityClass = 'high';
                riskLevel = 'High Risk';
                recommendation = 'Emergency doctor call; immediate ICU assessment';
                chanceText =
                    'Statistically linked to increased likelihood of death or ICU admission.';
            }

            // Check for any parameter with +3 points
            const hasThreePoints = sbp === 3 || hr === 3 || rr === 3 || avpu === 3;
            let threePointWarning = '';
            if (hasThreePoints) {
                threePointWarning = `
                    <div class="alert warning mt-15">
                        <span class="alert-icon">⚠️</span>
                        <div class="alert-content">
                            <p><strong>Critical Parameter Alert:</strong> One or more parameters scored +3 points. Consider higher level of care regardless of total score.</p>
                        </div>
                    </div>
                `;
            }

            const resultEl = root.querySelector('#mews-result');
            resultEl.innerHTML = `
                <div class="result-header">
                    <h4>MEWS Score Results</h4>
                </div>
                
                <div class="result-score">
                    <span class="result-score-value">${score}</span>
                    <span class="result-score-unit">/ 14 points</span>
                </div>
                
                <div class="risk-badge ${riskBadgeClass} mt-15">
                    ${riskLevel}
                </div>
                
                <div class="result-breakdown mt-20">
                    <div class="breakdown-title">Score Breakdown:</div>
                    <div class="breakdown-item">
                        <span class="breakdown-label">Systolic BP:</span>
                        <span class="breakdown-value">${sbp} points</span>
                    </div>
                    <div class="breakdown-item">
                        <span class="breakdown-label">Heart Rate:</span>
                        <span class="breakdown-value">${hr} points</span>
                    </div>
                    <div class="breakdown-item">
                        <span class="breakdown-label">Respiratory Rate:</span>
                        <span class="breakdown-value">${rr} points</span>
                    </div>
                    <div class="breakdown-item">
                        <span class="breakdown-label">Temperature:</span>
                        <span class="breakdown-value">${temp} points</span>
                    </div>
                    <div class="breakdown-item">
                        <span class="breakdown-label">AVPU:</span>
                        <span class="breakdown-value">${avpu} points</span>
                    </div>
                </div>
                
                <div class="alert ${severityClass === 'high' ? 'warning' : 'info'} mt-20">
                    <span class="alert-icon">${score >= 5 ? '🚨' : score >= 4 ? '⚠️' : 'ℹ️'}</span>
                    <div class="alert-content">
                        <div class="alert-title">${riskLevel}</div>
                        <p>${interpretation}</p>
                        ${chanceText ? `<p class="mt-10"><strong>${chanceText}</strong></p>` : ''}
                    </div>
                </div>
                
                ${threePointWarning}
                
                <div class="formula-box mt-15">
                    <div class="formula-title">Recommended Action</div>
                    <p>${recommendation}</p>
                </div>
            `;
            resultEl.style.display = 'block';
            resultEl.classList.add('show');
        };

        // Auto-populate systolic blood pressure
        getMostRecentObservation(client, '8480-6').then(obs => {
            if (obs && obs.valueQuantity) {
                const sbp = obs.valueQuantity.value;
                let sbpValue = '0';
                if (sbp <= 70) {
                    sbpValue = '3';
                } else if (sbp >= 71 && sbp <= 80) {
                    sbpValue = '2';
                } else if (sbp >= 81 && sbp <= 100) {
                    sbpValue = '1';
                } else if (sbp >= 101 && sbp <= 199) {
                    sbpValue = '0';
                } else if (sbp >= 200) {
                    sbpValue = '2';
                }

                const sbpRadio = root.querySelector(`input[name="sbp"][value="${sbpValue}"]`);
                if (sbpRadio) {
                    sbpRadio.checked = true;
                    sbpRadio.closest('.radio-option')?.classList.add('selected');
                }
            }
        });

        // Auto-populate heart rate
        getMostRecentObservation(client, '8867-4').then(obs => {
            if (obs && obs.valueQuantity) {
                const hr = obs.valueQuantity.value;
                let hrValue = '0';
                if (hr < 40) {
                    hrValue = '2';
                } else if (hr >= 41 && hr <= 50) {
                    hrValue = '1';
                } else if (hr >= 51 && hr <= 100) {
                    hrValue = '0';
                } else if (hr >= 101 && hr <= 110) {
                    hrValue = '1';
                } else if (hr >= 111 && hr <= 129) {
                    hrValue = '2';
                } else if (hr >= 130) {
                    hrValue = '3';
                }

                const hrRadio = root.querySelector(`input[name="hr"][value="${hrValue}"]`);
                if (hrRadio) {
                    hrRadio.checked = true;
                    hrRadio.closest('.radio-option')?.classList.add('selected');
                }
            }
        });

        // Auto-populate respiratory rate
        getMostRecentObservation(client, '9279-1').then(obs => {
            if (obs && obs.valueQuantity) {
                const rr = obs.valueQuantity.value;
                let rrValue = '0';
                if (rr < 9) {
                    rrValue = '2';
                } else if (rr >= 9 && rr <= 14) {
                    rrValue = '0';
                } else if (rr >= 15 && rr <= 20) {
                    rrValue = '1';
                } else if (rr >= 21 && rr <= 29) {
                    rrValue = '2';
                } else if (rr >= 30) {
                    rrValue = '3';
                }

                const rrRadio = root.querySelector(`input[name="rr"][value="${rrValue}"]`);
                if (rrRadio) {
                    rrRadio.checked = true;
                    rrRadio.closest('.radio-option')?.classList.add('selected');
                }
            }
        });

        // Auto-populate temperature
        getMostRecentObservation(client, '8310-5').then(obs => {
            if (obs && obs.valueQuantity) {
                let temp = obs.valueQuantity.value;
                const unit = obs.valueQuantity.unit || obs.valueQuantity.code;

                // Convert Fahrenheit to Celsius if needed
                if (unit === '[degF]' || unit === 'degF' || unit === 'F') {
                    temp = ((temp - 32) * 5) / 9;
                }

                let tempValue = '0';
                if (temp < 35) {
                    tempValue = '2';
                } else if (temp >= 35 && temp <= 38.4) {
                    tempValue = '0';
                } else if (temp >= 38.5) {
                    tempValue = '2';
                }

                const tempRadio = root.querySelector(`input[name="temp"][value="${tempValue}"]`);
                if (tempRadio) {
                    tempRadio.checked = true;
                    tempRadio.closest('.radio-option')?.classList.add('selected');
                }
            }
        });

        // Add visual feedback and auto-calculate for radio buttons
        const radioOptions = root.querySelectorAll('.radio-option');
        radioOptions.forEach(option => {
            const radio = option.querySelector('input[type="radio"]');
            radio.addEventListener('change', function () {
                // Remove 'selected' class from all options in the same group
                const groupName = this.name;
                root.querySelectorAll(`input[name="${groupName}"]`).forEach(r => {
                    r.closest('.radio-option')?.classList.remove('selected');
                });

                // Add 'selected' class to selected option
                if (this.checked) {
                    option.classList.add('selected');
                }

                // Auto-calculate
                calculate();
            });

            // Initialize state
            if (radio.checked) {
                option.classList.add('selected');
            }
        });

        // Initial calculation
        calculate();
    }
};
