import { getMostRecentObservation } from '../../utils.js';

export const childPugh = {
    id: 'child-pugh',
    title: 'Child-Pugh Score for Cirrhosis Mortality',
    description: 'Estimates cirrhosis severity.',
    generateHTML: function () {
        return `
            <div class="child-pugh-container">
                <div class="calculator-header" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 16px; margin-bottom: 25px;">
                    <div class="header-icon" style="font-size: 3em;">🫀</div>
                    <div class="header-content">
                        <h2 class="calculator-title" style="color: white !important; background: none !important; -webkit-background-clip: unset !important; -webkit-text-fill-color: white !important; background-clip: unset !important; margin: 0 0 8px 0; font-size: 1.8em; font-weight: 700;">${this.title}</h2>
                        <p class="calculator-description" style="color: white !important; margin: 0; opacity: 0.95; font-size: 1.1em;">${this.description}</p>
                    </div>
                </div>

                <div class="instructions-notice">
                    <div class="notice-icon">ℹ️</div>
                    <div class="notice-content">
                        <h5>About Child-Pugh Score</h5>
                        <p>The Child-Pugh score assesses the prognosis of chronic liver disease, mainly cirrhosis. It uses five clinical measures to classify patients into three categories (A, B, C) with different survival rates and surgical risks.</p>
                    </div>
                </div>

                <div class="lab-values-summary">
                    <h4>🧪 Current Lab Values</h4>
                    <div class="lab-values-grid">
                        <div class="lab-value-item">
                            <div class="lab-label">Bilirubin (Total)</div>
                            <div class="lab-value" id="current-bilirubin">Loading...</div>
                        </div>
                        <div class="lab-value-item">
                            <div class="lab-label">Albumin</div>
                            <div class="lab-value" id="current-albumin">Loading...</div>
                        </div>
                        <div class="lab-value-item">
                            <div class="lab-label">INR</div>
                            <div class="lab-value" id="current-inr">Loading...</div>
                        </div>
                    </div>
                </div>

                <div class="criteria-sections">
                    <!-- Laboratory Parameters -->
                    <div class="criteria-section">
                        <h4 class="section-title">
                            <span class="section-icon">🔬</span>
                            Laboratory Parameters
                        </h4>
                        
                        <div class="criterion-card">
                            <div class="criterion-header">
                                <div class="criterion-title">Bilirubin (Total)</div>
                                <div class="criterion-points" data-points="bilirubin">0 pts</div>
                            </div>
                            <div class="child-pugh-radio-group">
                                <label class="radio-option">
                                    <input type="radio" name="bilirubin" value="1">
                                    <span class="radio-content">
                                        <span class="radio-label">&lt;2 mg/dL (&lt;34.2 μmol/L)</span>
                                        <span class="radio-score">1 pt</span>
                                    </span>
                                </label>
                                <label class="radio-option">
                                    <input type="radio" name="bilirubin" value="2">
                                    <span class="radio-content">
                                        <span class="radio-label">2-3 mg/dL (34.2-51.3 μmol/L)</span>
                                        <span class="radio-score">2 pts</span>
                                    </span>
                                </label>
                                <label class="radio-option">
                                    <input type="radio" name="bilirubin" value="3">
                                    <span class="radio-content">
                                        <span class="radio-label">&gt;3 mg/dL (&gt;51.3 μmol/L)</span>
                                        <span class="radio-score">3 pts</span>
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div class="criterion-card">
                            <div class="criterion-header">
                                <div class="criterion-title">Albumin</div>
                                <div class="criterion-points" data-points="albumin">0 pts</div>
                            </div>
                            <div class="child-pugh-radio-group">
                                <label class="radio-option">
                                    <input type="radio" name="albumin" value="1">
                                    <span class="radio-content">
                                        <span class="radio-label">&gt;3.5 g/dL (&gt;35 g/L)</span>
                                        <span class="radio-score">1 pt</span>
                                    </span>
                                </label>
                                <label class="radio-option">
                                    <input type="radio" name="albumin" value="2">
                                    <span class="radio-content">
                                        <span class="radio-label">2.8-3.5 g/dL (28-35 g/L)</span>
                                        <span class="radio-score">2 pts</span>
                                    </span>
                                </label>
                                <label class="radio-option">
                                    <input type="radio" name="albumin" value="3">
                                    <span class="radio-content">
                                        <span class="radio-label">&lt;2.8 g/dL (&lt;28 g/L)</span>
                                        <span class="radio-score">3 pts</span>
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div class="criterion-card">
                            <div class="criterion-header">
                                <div class="criterion-title">INR (International Normalized Ratio)</div>
                                <div class="criterion-points" data-points="inr">0 pts</div>
                            </div>
                            <div class="child-pugh-radio-group">
                                <label class="radio-option">
                                    <input type="radio" name="inr" value="1">
                                    <span class="radio-content">
                                        <span class="radio-label">&lt;1.7</span>
                                        <span class="radio-score">1 pt</span>
                                    </span>
                                </label>
                                <label class="radio-option">
                                    <input type="radio" name="inr" value="2">
                                    <span class="radio-content">
                                        <span class="radio-label">1.7-2.3</span>
                                        <span class="radio-score">2 pts</span>
                                    </span>
                                </label>
                                <label class="radio-option">
                                    <input type="radio" name="inr" value="3">
                                    <span class="radio-content">
                                        <span class="radio-label">&gt;2.3</span>
                                        <span class="radio-score">3 pts</span>
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- Clinical Parameters -->
                    <div class="criteria-section">
                        <h4 class="section-title">
                            <span class="section-icon">🩺</span>
                            Clinical Parameters
                        </h4>
                        
                        <div class="criterion-card">
                            <div class="criterion-header">
                                <div class="criterion-title">Ascites</div>
                                <div class="criterion-subtitle">Fluid accumulation in peritoneal cavity</div>
                                <div class="criterion-points" data-points="ascites">0 pts</div>
                            </div>
                            <div class="child-pugh-radio-group">
                                <label class="radio-option">
                                    <input type="radio" name="ascites" value="1">
                                    <span class="radio-content">
                                        <span class="radio-label">Absent</span>
                                        <span class="radio-score">1 pt</span>
                                    </span>
                                </label>
                                <label class="radio-option">
                                    <input type="radio" name="ascites" value="2">
                                    <span class="radio-content">
                                        <span class="radio-label">Slight (controlled with diuretics)</span>
                                        <span class="radio-score">2 pts</span>
                                    </span>
                                </label>
                                <label class="radio-option">
                                    <input type="radio" name="ascites" value="3">
                                    <span class="radio-content">
                                        <span class="radio-label">Moderate (despite diuretic therapy)</span>
                                        <span class="radio-score">3 pts</span>
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div class="criterion-card">
                            <div class="criterion-header">
                                <div class="criterion-title">Hepatic Encephalopathy</div>
                                <div class="criterion-subtitle">Neuropsychiatric abnormalities</div>
                                <div class="criterion-points" data-points="encephalopathy">0 pts</div>
                            </div>
                            <div class="child-pugh-radio-group">
                                <label class="radio-option">
                                    <input type="radio" name="encephalopathy" value="1">
                                    <span class="radio-content">
                                        <span class="radio-label">No Encephalopathy</span>
                                        <span class="radio-score">1 pt</span>
                                    </span>
                                </label>
                                <label class="radio-option">
                                    <input type="radio" name="encephalopathy" value="2">
                                    <span class="radio-content">
                                        <span class="radio-label">Grade 1-2 (mild confusion, asterixis)</span>
                                        <span class="radio-score">2 pts</span>
                                    </span>
                                </label>
                                <label class="radio-option">
                                    <input type="radio" name="encephalopathy" value="3">
                                    <span class="radio-content">
                                        <span class="radio-label">Grade 3-4 (severe confusion, coma)</span>
                                        <span class="radio-score">3 pts</span>
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Results Section -->
                <div class="results-section">
                    <div class="results-header">
                        <h4>📊 Child-Pugh Score Assessment</h4>
                    </div>
                    <div class="results-content">
                        <div class="result-main">
                            <div class="result-value-container">
                                <div class="result-score-display" id="result-score">0</div>
                                <div class="result-label">Total Points</div>
                            </div>
                            <div class="result-interpretation-container">
                                <div class="result-classification" id="result-classification">-</div>
                                <div class="result-prognosis" id="result-prognosis">Please complete all criteria</div>
                            </div>
                        </div>
                        
                        <div class="class-interpretation-guide">
                            <h5>📋 Classification & Prognosis</h5>
                            <div class="class-grid">
                                <div class="class-item class-a" data-class="a">
                                    <div class="class-header">
                                        <div class="class-name">Child Class A</div>
                                        <div class="class-score">5-6 points</div>
                                    </div>
                                    <div class="class-details">
                                        <div class="detail-item">
                                            <span class="detail-label">Life Expectancy:</span>
                                            <span class="detail-value">15-20 years</span>
                                        </div>
                                        <div class="detail-item">
                                            <span class="detail-label">Surgical Mortality:</span>
                                            <span class="detail-value">10%</span>
                                        </div>
                                        <div class="detail-item">
                                            <span class="detail-label">1-year Survival:</span>
                                            <span class="detail-value">100%</span>
                                        </div>
                                        <div class="detail-item">
                                            <span class="detail-label">2-year Survival:</span>
                                            <span class="detail-value">85%</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="class-item class-b" data-class="b">
                                    <div class="class-header">
                                        <div class="class-name">Child Class B</div>
                                        <div class="class-score">7-9 points</div>
                                    </div>
                                    <div class="class-details">
                                        <div class="detail-item">
                                            <span class="detail-label">Life Expectancy:</span>
                                            <span class="detail-value">4-14 years</span>
                                        </div>
                                        <div class="detail-item">
                                            <span class="detail-label">Surgical Mortality:</span>
                                            <span class="detail-value">30%</span>
                                        </div>
                                        <div class="detail-item">
                                            <span class="detail-label">1-year Survival:</span>
                                            <span class="detail-value">80%</span>
                                        </div>
                                        <div class="detail-item">
                                            <span class="detail-label">2-year Survival:</span>
                                            <span class="detail-value">60%</span>
                                        </div>
                                    </div>
                                </div>

                                <div class="class-item class-c" data-class="c">
                                    <div class="class-header">
                                        <div class="class-name">Child Class C</div>
                                        <div class="class-score">10-15 points</div>
                                    </div>
                                    <div class="class-details">
                                        <div class="detail-item">
                                            <span class="detail-label">Life Expectancy:</span>
                                            <span class="detail-value">1-3 years</span>
                                        </div>
                                        <div class="detail-item">
                                            <span class="detail-label">Surgical Mortality:</span>
                                            <span class="detail-value">82%</span>
                                        </div>
                                        <div class="detail-item">
                                            <span class="detail-label">1-year Survival:</span>
                                            <span class="detail-value">45%</span>
                                        </div>
                                        <div class="detail-item">
                                            <span class="detail-label">2-year Survival:</span>
                                            <span class="detail-value">35%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="clinical-management">
                            <h5>⚕️ Clinical Management Considerations</h5>
                            <div class="management-grid" id="management-content">
                                <div class="management-item">
                                    <h6>General Management</h6>
                                    <ul>
                                        <li>Treat underlying cause of cirrhosis</li>
                                        <li>Avoid hepatotoxic medications</li>
                                        <li>Nutritional support</li>
                                        <li>Monitor for complications</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div class="clinical-notes">
                            <h5>⚠️ Important Clinical Notes</h5>
                            <ul>
                                <li><strong>Liver Transplant:</strong> Class B and C patients should be evaluated for transplantation</li>
                                <li><strong>MELD Score:</strong> Consider using MELD score for transplant prioritization</li>
                                <li><strong>Surgical Risk:</strong> Elective surgery contraindicated in Class C patients</li>
                                <li><strong>Complications:</strong> Monitor for variceal bleeding, SBP, HRS, HCC</li>
                                <li><strong>Limitations:</strong> Subjective assessment of ascites and encephalopathy</li>
                                <li><strong>Updates:</strong> Reassess score regularly as clinical status changes</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        const groups = ['bilirubin', 'albumin', 'inr', 'ascites', 'encephalopathy'];

        const updateToggleState = input => {
            const group = input.closest('.child-pugh-radio-group');
            if (group) {
                group.querySelectorAll('.radio-option').forEach(option => {
                    option.classList.remove('active');
                });
                input.closest('.radio-option').classList.add('active');
            }
        };

        const updatePointsDisplay = (name, value) => {
            const pointsEl = container.querySelector(`[data-points="${name}"]`);
            if (pointsEl) {
                const points = parseInt(value);
                pointsEl.textContent = `${points} pt${points > 1 ? 's' : ''}`;
                pointsEl.style.color =
                    points === 1 ? '#059669' : points === 2 ? '#d97706' : '#dc2626';
            }
        };

        const calculate = () => {
            let score = 0;
            const allAnswered = groups.every(group =>
                container.querySelector(`input[name="${group}"]:checked`)
            );

            groups.forEach(group => {
                const selected = container.querySelector(`input[name="${group}"]:checked`);
                if (selected) {
                    const value = parseInt(selected.value);
                    score += value;
                    updatePointsDisplay(group, value);
                }
            });

            const resultScoreEl = container.querySelector('#result-score');
            const resultClassificationEl = container.querySelector('#result-classification');
            const resultPrognosisEl = container.querySelector('#result-prognosis');
            const resultMain = container.querySelector('.result-main');

            if (!allAnswered) {
                resultScoreEl.textContent = '0';
                resultClassificationEl.textContent = '-';
                resultPrognosisEl.textContent = 'Please complete all criteria';
                resultMain.className = 'result-main';
                container
                    .querySelectorAll('.class-item')
                    .forEach(item => item.classList.remove('active'));
                return;
            }

            resultScoreEl.textContent = score;

            let classification = '';
            let classType = '';
            let prognosis = '';

            if (score <= 6) {
                classification = 'Child Class A';
                classType = 'a';
                prognosis = 'Well-compensated disease - Good prognosis';
                resultMain.className = 'result-main class-a';
            } else if (score <= 9) {
                classification = 'Child Class B';
                classType = 'b';
                prognosis = 'Significant functional compromise - Moderate prognosis';
                resultMain.className = 'result-main class-b';
            } else {
                classification = 'Child Class C';
                classType = 'c';
                prognosis = 'Decompensated disease - Poor prognosis';
                resultMain.className = 'result-main class-c';
            }

            resultClassificationEl.textContent = classification;
            resultPrognosisEl.textContent = prognosis;

            // Highlight corresponding class item
            container.querySelectorAll('.class-item').forEach(item => {
                item.classList.remove('active');
            });
            const activeItem = container.querySelector(`.class-item[data-class="${classType}"]`);
            if (activeItem) {
                activeItem.classList.add('active');
            }
        };

        const setRadioFromValue = (groupName, value, ranges, displayValue, unit) => {
            if (value === null || value === undefined) {
                const displayEl = container.querySelector(`#current-${groupName}`);
                if (displayEl) {
                    displayEl.textContent = 'Not available';
                }
                return;
            }

            // Update display
            const displayEl = container.querySelector(`#current-${groupName}`);
            if (displayEl) {
                displayEl.textContent = `${displayValue} ${unit}`;
            }

            // Select appropriate radio
            const radioToSelect = ranges.find(range => range.condition(value));
            if (radioToSelect) {
                const radio = container.querySelector(
                    `input[name="${groupName}"][value="${radioToSelect.value}"]`
                );
                if (radio) {
                    radio.checked = true;
                    updateToggleState(radio);
                }
            }
        };

        // Fetch and set lab values
        getMostRecentObservation(client, '1975-2')
            .then(obs => {
                // Bilirubin mg/dL
                if (obs && obs.valueQuantity) {
                    const value = obs.valueQuantity.value;
                    setRadioFromValue(
                        'bilirubin',
                        value,
                        [
                            { condition: v => v < 2, value: '1' },
                            { condition: v => v >= 2 && v <= 3, value: '2' },
                            { condition: v => v > 3, value: '3' }
                        ],
                        value.toFixed(1),
                        'mg/dL'
                    );
                } else {
                    container.querySelector('#current-bilirubin').textContent = 'Not available';
                }
                calculate();
            })
            .catch(error => {
                console.error('Error fetching bilirubin:', error);
                container.querySelector('#current-bilirubin').textContent = 'Not available';
            });

        getMostRecentObservation(client, '1751-7')
            .then(obs => {
                // Albumin g/dL
                if (obs && obs.valueQuantity) {
                    const valueGdL = obs.valueQuantity.value / 10; // Convert g/L to g/dL
                    setRadioFromValue(
                        'albumin',
                        valueGdL,
                        [
                            { condition: v => v > 3.5, value: '1' },
                            { condition: v => v >= 2.8 && v <= 3.5, value: '2' },
                            { condition: v => v < 2.8, value: '3' }
                        ],
                        valueGdL.toFixed(1),
                        'g/dL'
                    );
                } else {
                    container.querySelector('#current-albumin').textContent = 'Not available';
                }
                calculate();
            })
            .catch(error => {
                console.error('Error fetching albumin:', error);
                container.querySelector('#current-albumin').textContent = 'Not available';
            });

        getMostRecentObservation(client, '34714-6')
            .then(obs => {
                // INR
                if (obs && obs.valueQuantity) {
                    const value = obs.valueQuantity.value;
                    setRadioFromValue(
                        'inr',
                        value,
                        [
                            { condition: v => v < 1.7, value: '1' },
                            { condition: v => v >= 1.7 && v <= 2.3, value: '2' },
                            { condition: v => v > 2.3, value: '3' }
                        ],
                        value.toFixed(2),
                        ''
                    );
                } else {
                    container.querySelector('#current-inr').textContent = 'Not available';
                }
                calculate();
            })
            .catch(error => {
                console.error('Error fetching INR:', error);
                container.querySelector('#current-inr').textContent = 'Not available';
            });

        // Event listeners for all radio buttons
        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', e => {
                updateToggleState(e.target);
                calculate();
            });

            // Initialize toggle states
            if (radio.checked) {
                updateToggleState(radio);
            }
        });

        // Initial calculation
        calculate();
    }
};
