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

            <div id="mica-result" class="result-container"></div>
        `;
    },
    initialize: function (client, patient, container) {
        const root = container || document;
        // Helper function to mark field as auto-populated
        const markAutoFilled = element => {
            if (element) {
                element.style.background = '#e6f7ff';
                element.style.borderColor = '#91d5ff';
                element.title = '✓ Auto-populated from patient data';
            }
        };

        const ageInput = root.querySelector('#mica-age');
        const statusSelect = root.querySelector('#mica-status');
        const asaSelect = root.querySelector('#mica-asa');
        const creatInput = root.querySelector('#mica-creat');
        const procedureSelect = root.querySelector('#mica-procedure');
        const resultEl = root.querySelector('#mica-result');

        const calculate = () => {
            const age = parseInt(ageInput.value);
            const functionalStatus = parseFloat(statusSelect.value);
            const asaClass = parseFloat(asaSelect.value);
            const creat = parseFloat(creatInput.value);
            const procedure = parseFloat(procedureSelect.value);

            if (isNaN(age) || isNaN(creat)) {
                resultEl.classList.remove('show');
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

            // Determine risk level
            let riskLevel = 'low';
            let riskDescription = 'Low risk of postoperative MI or cardiac arrest';

            if (risk > 5) {
                riskLevel = 'high';
                riskDescription = 'High risk of postoperative MI or cardiac arrest - Consider risk modification strategies';
            } else if (risk > 2) {
                riskLevel = 'medium';
                riskDescription = 'Intermediate risk of postoperative MI or cardiac arrest - Consider perioperative optimization';
            }

            resultEl.innerHTML = `
                <div class="result-header">
                    <h3>Gupta MICA Risk Assessment</h3>
                </div>
                <div class="result-score" style="font-size: 4rem; font-weight: bold; color: #667eea;">${riskPercent}%</div>
                <div class="result-label">Cardiac Risk</div>
                
                <div class="severity-indicator ${riskLevel}">${riskLevel === 'high' ? 'High Risk' : riskLevel === 'medium' ? 'Intermediate Risk' : 'Low Risk'}</div>
                
                <div class="alert info">
                    <strong>📊 Clinical Interpretation</strong>
                    <p>${riskDescription}</p>
                </div>
                
                <div class="info-section">
                    <h4>Formula Components</h4>
                    <div class="data-table">
                        <table>
                            <tr><td>Age Component (Age × 0.02)</td><td><strong>${(age * 0.02).toFixed(2)}</strong></td></tr>
                            <tr><td>Functional Status</td><td><strong>${functionalStatus.toFixed(2)}</strong></td></tr>
                            <tr><td>ASA Class</td><td><strong>${asaClass.toFixed(2)}</strong></td></tr>
                            <tr><td>Creatinine (≥1.5 mg/dL)</td><td><strong>${creat >= 1.5 ? '0.61' : '0.00'}</strong></td></tr>
                            <tr><td>Procedure Type</td><td><strong>${procedure.toFixed(2)}</strong></td></tr>
                            <tr><td><strong>X Value</strong></td><td><strong>${x.toFixed(2)}</strong></td></tr>
                        </table>
                    </div>
                </div>
                
                <div class="formula-box">
                    <strong>Formula:</strong> Cardiac risk, % = √(1 + e<sup>x</sup>) where x = -5.25 + sum of values
                </div>
            `;
            resultEl.classList.add('show');
        };

        // Auto-populate age
        if (patient && patient.birthDate) {
            const age = calculateAge(patient.birthDate);
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
                        let crValue = obs.valueQuantity.value;
                        // Convert if needed (µmol/L to mg/dL: divide by 88.4)
                        if (obs.valueQuantity.unit === 'µmol/L' || obs.valueQuantity.unit === 'umol/L') {
                            crValue = crValue / 88.4;
                        }
                        creatInput.value = crValue.toFixed(2);
                        markAutoFilled(creatInput);
                        calculate();
                    }
                })
                .catch(err => console.log('Creatinine not available'));
        }

        // Add event listeners for auto-calculation
        ageInput.addEventListener('input', calculate);
        statusSelect.addEventListener('change', calculate);
        asaSelect.addEventListener('change', calculate);
        creatInput.addEventListener('input', calculate);
        procedureSelect.addEventListener('change', calculate);

        // Initial calculation
        calculate();
    }
};
