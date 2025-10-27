// js/calculators/gupta-mica.js
import { calculateAge, getMostRecentObservation } from '../../utils.js';

export const guptaMica = {
    id: 'gupta-mica',
    title: 'Gupta Perioperative Risk for Myocardial Infarction or Cardiac Arrest (MICA)',
    description:
        'Predicts risk of MI or cardiac arrest after surgery. Formula: Cardiac risk, % = √(1 + e^x) where x = -5.25 + sum of selected variables.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3 class="calculator-title">
                    <span class="title-icon">🫀</span>
                    ${this.title}
                </h3>
                <p class="calculator-description">${this.description}</p>
            </div>

            <div class="grace-container">
                <div class="grace-section">
                    <h4 class="section-title">
                        <span class="section-icon">👤</span>
                        Patient Demographics
                    </h4>
                    <div class="grace-input-grid">
                        <div class="input-group grace-input-item">
                            <label for="mica-age">
                                <span class="label-text">Age</span>
                                <span class="label-unit">(years)</span>
                            </label>
                            <input type="number" id="mica-age" placeholder="Enter age">
                        </div>
                    </div>
                </div>

                <div class="grace-section">
                    <h4 class="section-title">
                        <span class="section-icon">🏥</span>
                        Clinical Status
                    </h4>
                    <div class="grace-select-grid">
                        <div class="select-group">
                            <label for="mica-status">
                                <span class="label-text">Functional Status</span>
                            </label>
                            <select id="mica-status" class="modern-select">
                                <option value="0">Independent</option>
                                <option value="0.65">Partially Dependent</option>
                                <option value="1.03">Totally Dependent</option>
                            </select>
                        </div>
                        <div class="select-group">
                            <label for="mica-asa">
                                <span class="label-text">ASA Class</span>
                                <span class="label-helper">Physical status classification</span>
                            </label>
                            <select id="mica-asa" class="modern-select">
                                <option value="-6.17">Class 1 - Normal healthy patient</option>
                                <option value="-3.29">Class 2 - Mild systemic disease</option>
                                <option value="1.80">Class 3 - Severe systemic disease</option>
                                <option value="4.29">Class 4 - Severe systemic disease (threat to life)</option>
                                <option value="0">Class 5 - Moribund</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="grace-section">
                    <h4 class="section-title">
                        <span class="section-icon">🧪</span>
                        Laboratory Values
                    </h4>
                    <div class="grace-select-grid">
                        <div class="input-group grace-input-item">
                            <label for="mica-creat">
                                <span class="label-text">Creatinine</span>
                                <span class="label-unit">(mg/dL)</span>
                            </label>
                            <input type="number" id="mica-creat" step="0.1" placeholder="Enter creatinine">
                        </div>
                    </div>
                </div>

                <div class="grace-section">
                    <h4 class="section-title">
                        <span class="section-icon">🔪</span>
                        Type of Procedure
                    </h4>
                    <div class="grace-select-grid">
                        <div class="select-group">
                            <label for="mica-procedure">
                                <span class="label-text">Surgical Procedure Type</span>
                            </label>
                            <select id="mica-procedure" class="modern-select">
                                <option value="-0.74">Urology</option>
                                <option value="-1.63">Breast</option>
                                <option value="-0.25">Bariatric</option>
                                <option value="0">Hernia (ventral, inguinal, femoral)</option>
                                <option value="0.14">Skin</option>
                                <option value="0.59">Neck (thyroid/parathyroid)</option>
                                <option value="0.59">Gallbladder, appendix, intestine, or colon</option>
                                <option value="0.60">Orthopedic and non-vascular extremity</option>
                                <option value="0.63">Non-neurological thoracic</option>
                                <option value="0.71">ENT (except thyroid/parathyroid)</option>
                                <option value="0.74">Spine</option>
                                <option value="0.96">Peripheral vascular</option>
                                <option value="1.13">Other abdominal</option>
                                <option value="1.14">Intestinal</option>
                                <option value="1.31">Cardiac</option>
                                <option value="1.39">Foregut or hepatopancreaticobiliary</option>
                                <option value="1.48">Brain</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div class="button-container">
                <button id="calculate-mica" class="calculate-btn">
                    <span class="btn-icon">🔍</span>
                    Calculate MICA Risk
                </button>
            </div>

            <div id="mica-result" class="result-container" style="display:none;"></div>
        `;
    },
    initialize: function (client, patient) {
        // Helper function to mark field as auto-populated
        const markAutoFilled = element => {
            if (element) {
                element.style.background = '#e6f7ff';
                element.style.borderColor = '#91d5ff';
                element.title = '✓ Auto-populated from patient data';
            }
        };

        // Auto-populate age
        if (patient && patient.birthDate) {
            const age = calculateAge(patient.birthDate);
            const ageInput = document.getElementById('mica-age');
            if (ageInput && age > 0) {
                ageInput.value = age;
                markAutoFilled(ageInput);
            }
        }

        // Auto-populate creatinine
        if (client) {
            getMostRecentObservation(client, '2160-0')
                .then(obs => {
                    if (obs && obs.valueQuantity) {
                        const crInput = document.getElementById('mica-creat');
                        let crValue = obs.valueQuantity.value;
                        // Convert if needed (µmol/L to mg/dL: divide by 88.4)
                        if (
                            obs.valueQuantity.unit === 'µmol/L' ||
                            obs.valueQuantity.unit === 'umol/L'
                        ) {
                            crValue = crValue / 88.4;
                        }
                        crInput.value = crValue.toFixed(2);
                        markAutoFilled(crInput);
                    }
                })
                .catch(err => console.log('Creatinine not available'));
        }

        document.getElementById('calculate-mica').addEventListener('click', () => {
            const age = parseInt(document.getElementById('mica-age').value);
            const functionalStatus = parseFloat(document.getElementById('mica-status').value);
            const asaClass = parseFloat(document.getElementById('mica-asa').value);
            const creat = parseFloat(document.getElementById('mica-creat').value);
            const procedure = parseFloat(document.getElementById('mica-procedure').value);

            if (isNaN(age) || isNaN(creat)) {
                alert('⚠️ Please fill out all required fields.');
                return;
            }

            // Calculate x using the formula: x = -5.25 + sum of values
            let x = -5.25;

            // Age contribution: Age × 0.02
            x += age * 0.02;

            // Functional status
            x += functionalStatus;

            // ASA class
            x += asaClass;

            // Creatinine: elevated ≥1.5 mg/dL adds 0.61
            if (creat >= 1.5) {
                x += 0.61;
            }

            // Type of procedure
            x += procedure;

            // Calculate risk using formula: risk % = √(1 + e^x)
            const risk = Math.sqrt(1 + Math.exp(x));
            const riskPercent = risk.toFixed(2);

            // Determine risk level and color
            let riskLevel = 'low';
            let riskColor = '#10b981';
            let riskIcon = '✓';
            let riskDescription = 'Low risk of postoperative MI or cardiac arrest';

            if (risk > 5) {
                riskLevel = 'high';
                riskColor = '#ef4444';
                riskIcon = '⚠';
                riskDescription =
                    'High risk of postoperative MI or cardiac arrest - Consider risk modification strategies';
            } else if (risk > 2) {
                riskLevel = 'intermediate';
                riskColor = '#f59e0b';
                riskIcon = '⚡';
                riskDescription =
                    'Intermediate risk of postoperative MI or cardiac arrest - Consider perioperative optimization';
            }

            const resultEl = document.getElementById('mica-result');
            resultEl.innerHTML = `
                <div class="grace-result-card" style="border-left-color: ${riskColor}">
                    <div class="result-header">
                        <span class="result-icon" style="color: ${riskColor}">${riskIcon}</span>
                        <h4 class="result-title">Gupta MICA Risk Assessment</h4>
                    </div>
                    
                    <div class="grace-score-display">
                        <div class="score-main">
                            <span class="score-label">Cardiac Risk</span>
                            <span class="score-value" style="color: ${riskColor}">${riskPercent}%</span>
                        </div>
                        <div class="score-divider"></div>
                        <div class="score-risk">
                            <span class="risk-label">Risk Category</span>
                            <span class="risk-category" style="color: ${riskColor}">${riskLevel.toUpperCase()} RISK</span>
                        </div>
                    </div>

                    <div class="risk-interpretation" style="background: ${riskColor}15; border-color: ${riskColor}">
                        <div class="interpretation-icon" style="color: ${riskColor}">ℹ️</div>
                        <div class="interpretation-text">
                            <strong>Clinical Interpretation:</strong><br>
                            ${riskDescription}
                        </div>
                    </div>

                    <div class="score-breakdown">
                        <h5 class="breakdown-title">Formula Components:</h5>
                        <div class="breakdown-grid">
                            <div class="breakdown-item">
                                <span class="breakdown-label">Age Component</span>
                                <span class="breakdown-points">${(age * 0.02).toFixed(2)}</span>
                            </div>
                            <div class="breakdown-item">
                                <span class="breakdown-label">Functional Status</span>
                                <span class="breakdown-points">${functionalStatus.toFixed(2)}</span>
                            </div>
                            <div class="breakdown-item">
                                <span class="breakdown-label">ASA Class</span>
                                <span class="breakdown-points">${asaClass.toFixed(2)}</span>
                            </div>
                            <div class="breakdown-item">
                                <span class="breakdown-label">Creatinine</span>
                                <span class="breakdown-points">${creat >= 1.5 ? '0.61' : '0.00'}</span>
                            </div>
                            <div class="breakdown-item">
                                <span class="breakdown-label">Procedure Type</span>
                                <span class="breakdown-points">${procedure.toFixed(2)}</span>
                            </div>
                            <div class="breakdown-item">
                                <span class="breakdown-label">X Value</span>
                                <span class="breakdown-points">${x.toFixed(2)}</span>
                            </div>
                        </div>
                        <p style="margin-top: 15px; font-size: 0.9em; color: #718096;">
                            Formula: Cardiac risk, % = √(1 + e<sup>x</sup>) where x = -5.25 + sum of values
                        </p>
                    </div>
                </div>
            `;
            resultEl.style.display = 'block';
            resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    }
};
