// js/calculators/ldl.js
import { getMostRecentObservation } from '../../utils.js';

export const ldl = {
    id: 'ldl',
    title: 'LDL Calculated',
    description: 'Calculates LDL based on total and HDL cholesterol and triglycerides.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p>${this.description}</p>
            <div class="input-group">
                <label for="total-chol">Total Cholesterol:</label>
                <div style="display: flex; gap: 10px;">
                    <input type="number" id="total-chol" placeholder="loading..." style="flex: 1;" step="0.1">
                    <select id="total-chol-unit" style="width: 90px;">
                        <option value="mg/dL">mg/dL</option>
                        <option value="mmol/L">mmol/L</option>
                    </select>
                </div>
                <small id="total-chol-converted" style="color: #666; margin-top: 4px; display: none;"></small>
            </div>
            <div class="input-group">
                <label for="hdl-chol">HDL Cholesterol:</label>
                <div style="display: flex; gap: 10px;">
                    <input type="number" id="hdl-chol" placeholder="loading..." style="flex: 1;" step="0.1">
                    <select id="hdl-chol-unit" style="width: 90px;">
                        <option value="mg/dL">mg/dL</option>
                        <option value="mmol/L">mmol/L</option>
                    </select>
                </div>
                <small id="hdl-chol-converted" style="color: #666; margin-top: 4px; display: none;"></small>
            </div>
            <div class="input-group">
                <label for="trig">Triglycerides:</label>
                <div style="display: flex; gap: 10px;">
                    <input type="number" id="trig" placeholder="loading..." style="flex: 1;" step="0.1">
                    <select id="trig-unit" style="width: 90px;">
                        <option value="mg/dL">mg/dL</option>
                        <option value="mmol/L">mmol/L</option>
                    </select>
                </div>
                <small id="trig-converted" style="color: #666; margin-top: 4px; display: none;"></small>
            </div>
            <div id="ldl-result" class="result" style="display:none;"></div>
            <div class="formula-section">
                <h4>📐 Formula (Friedewald Equation)</h4>
                <div class="formula" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; margin: 15px 0; text-align: center;">
                    <div style="font-size: 1.2em; font-weight: bold;">
                    LDL = Total Cholesterol - HDL - (Triglycerides / 5)
                    </div>
                    <div style="margin-top: 10px; font-size: 0.9em; opacity: 0.9;">
                        (All values in mg/dL)
                    </div>
                </div>
                
                <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin-top: 15px;">
                    <p style="margin: 0;"><strong>⚠️ Important Notes:</strong></p>
                    <ul style="margin: 10px 0 0 20px; padding: 0;">
                        <li>This formula is <strong>not accurate</strong> when triglycerides ≥ 400 mg/dL (≥ 4.52 mmol/L)</li>
                        <li>Fasting sample is required (9-12 hours)</li>
                        <li>Consider direct LDL measurement for high triglycerides</li>
                    </ul>
                </div>

                <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
                    <h5 style="margin-top: 0;">🔄 Unit Conversions</h5>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                        <div>
                            <strong>Cholesterol (Total, HDL, LDL):</strong><br>
                            <span style="font-size: 0.9em; color: #666;">
                                mg/dL ÷ 38.67 = mmol/L<br>
                                mmol/L × 38.67 = mg/dL
                            </span>
                        </div>
                        <div>
                            <strong>Triglycerides:</strong><br>
                            <span style="font-size: 0.9em; color: #666;">
                                mg/dL ÷ 88.57 = mmol/L<br>
                                mmol/L × 88.57 = mg/dL
                            </span>
                        </div>
                    </div>
                </div>

                <div style="margin-top: 20px; padding: 15px; background: #e7f3ff; border-radius: 8px;">
                    <h5 style="margin-top: 0;">📊 LDL Cholesterol Goals</h5>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="background: #f8f9fa;">
                            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #dee2e6;">Category</th>
                            <th style="padding: 8px; text-align: center; border-bottom: 2px solid #dee2e6;">mg/dL</th>
                            <th style="padding: 8px; text-align: center; border-bottom: 2px solid #dee2e6;">mmol/L</th>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #dee2e6;"><span style="color: #28a745;">●</span> Optimal</td>
                            <td style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;">&lt; 100</td>
                            <td style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;">&lt; 2.59</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #dee2e6;"><span style="color: #5cb85c;">●</span> Near Optimal</td>
                            <td style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;">100-129</td>
                            <td style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;">2.59-3.34</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #dee2e6;"><span style="color: #ffc107;">●</span> Borderline High</td>
                            <td style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;">130-159</td>
                            <td style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;">3.37-4.12</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px; border-bottom: 1px solid #dee2e6;"><span style="color: #fd7e14;">●</span> High</td>
                            <td style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;">160-189</td>
                            <td style="padding: 8px; text-align: center; border-bottom: 1px solid #dee2e6;">4.15-4.90</td>
                        </tr>
                        <tr>
                            <td style="padding: 8px;"><span style="color: #dc3545;">●</span> Very High</td>
                            <td style="padding: 8px; text-align: center;">≥ 190</td>
                            <td style="padding: 8px; text-align: center;">≥ 4.92</td>
                        </tr>
                    </table>
                </div>
            </div>
        `;
    },
    initialize: function(client) {
        // Get DOM elements
        const totalCholInput = document.getElementById('total-chol');
        const totalCholUnit = document.getElementById('total-chol-unit');
        const totalCholConverted = document.getElementById('total-chol-converted');
        
        const hdlCholInput = document.getElementById('hdl-chol');
        const hdlCholUnit = document.getElementById('hdl-chol-unit');
        const hdlCholConverted = document.getElementById('hdl-chol-converted');
        
        const trigInput = document.getElementById('trig');
        const trigUnit = document.getElementById('trig-unit');
        const trigConverted = document.getElementById('trig-converted');
        
        const resultEl = document.getElementById('ldl-result');

        // Conversion factors
        const CHOL_CONVERSION = 38.67; // mg/dL to mmol/L
        const TRIG_CONVERSION = 88.57; // mg/dL to mmol/L

        // Convert cholesterol to mg/dL
        function getCholInMgDl(value, unit) {
            if (!value || value <= 0) return null;
            return unit === 'mmol/L' ? value * CHOL_CONVERSION : value;
        }

        // Convert triglycerides to mg/dL
        function getTrigInMgDl(value, unit) {
            if (!value || value <= 0) return null;
            return unit === 'mmol/L' ? value * TRIG_CONVERSION : value;
        }

        // Update conversion display for cholesterol
        function updateCholConversion(inputEl, unitEl, convertedEl) {
            const value = parseFloat(inputEl.value);
            if (value && value > 0) {
                const unit = unitEl.value;
                if (unit === 'mg/dL') {
                    const mmol = (value / CHOL_CONVERSION).toFixed(2);
                    convertedEl.textContent = `≈ ${mmol} mmol/L`;
                    convertedEl.style.display = 'block';
                } else {
                    const mgdl = (value * CHOL_CONVERSION).toFixed(1);
                    convertedEl.textContent = `≈ ${mgdl} mg/dL`;
                    convertedEl.style.display = 'block';
                }
            } else {
                convertedEl.style.display = 'none';
            }
        }

        // Update conversion display for triglycerides
        function updateTrigConversion() {
            const value = parseFloat(trigInput.value);
            if (value && value > 0) {
                const unit = trigUnit.value;
                if (unit === 'mg/dL') {
                    const mmol = (value / TRIG_CONVERSION).toFixed(2);
                    trigConverted.textContent = `≈ ${mmol} mmol/L`;
                    trigConverted.style.display = 'block';
                } else {
                    const mgdl = (value * TRIG_CONVERSION).toFixed(1);
                    trigConverted.textContent = `≈ ${mgdl} mg/dL`;
                    trigConverted.style.display = 'block';
                }
            } else {
                trigConverted.style.display = 'none';
            }
        }

        // Auto-calculate function
        function autoCalculate() {
            const totalMgDl = getCholInMgDl(parseFloat(totalCholInput.value), totalCholUnit.value);
            const hdlMgDl = getCholInMgDl(parseFloat(hdlCholInput.value), hdlCholUnit.value);
            const trigMgDl = getTrigInMgDl(parseFloat(trigInput.value), trigUnit.value);

            // Update conversions
            updateCholConversion(totalCholInput, totalCholUnit, totalCholConverted);
            updateCholConversion(hdlCholInput, hdlCholUnit, hdlCholConverted);
            updateTrigConversion();

            // Calculate if all values present
            if (totalMgDl && hdlMgDl && trigMgDl) {
                if (trigMgDl >= 400) {
                    resultEl.innerHTML = `
                        <div style="padding: 12px; background: #fff3cd; border-left: 4px solid #ffc107; border-radius: 6px;">
                            <p style="margin: 0; color: #856404;"><strong>⚠️ Warning:</strong></p>
                            <p style="margin: 8px 0 0 0; color: #856404;">LDL cannot be calculated accurately when triglycerides are ≥ 400 mg/dL (≥ 4.52 mmol/L).</p>
                            <p style="margin: 8px 0 0 0; font-size: 0.9em; color: #856404;">Consider a direct LDL measurement.</p>
                        </div>
                    `;
                    resultEl.style.display = 'block';
                    resultEl.style.backgroundColor = '#fff3cd';
                    resultEl.style.borderColor = '#ffc107';
                    return;
                }

                // Calculate LDL using Friedewald equation
                const ldlMgDl = totalMgDl - hdlMgDl - (trigMgDl / 5);
                const ldlMmol = ldlMgDl / CHOL_CONVERSION;

                // Determine risk category
                let riskCategory = '';
                let riskColor = '';
                if (ldlMgDl < 100) {
                    riskCategory = 'Optimal';
                    riskColor = '#28a745';
                } else if (ldlMgDl < 130) {
                    riskCategory = 'Near Optimal';
                    riskColor = '#5cb85c';
                } else if (ldlMgDl < 160) {
                    riskCategory = 'Borderline High';
                    riskColor = '#ffc107';
                } else if (ldlMgDl < 190) {
                    riskCategory = 'High';
                    riskColor = '#fd7e14';
                } else {
                    riskCategory = 'Very High';
                    riskColor = '#dc3545';
                }

                resultEl.innerHTML = `
                    <div style="text-align: center; padding: 15px;">
                        <h4 style="margin: 0 0 10px 0; color: #333;">Calculated LDL Cholesterol</h4>
                        <div style="font-size: 2em; font-weight: bold; color: ${riskColor}; margin: 10px 0;">
                            ${ldlMgDl.toFixed(1)} mg/dL
                        </div>
                        <div style="font-size: 1.2em; color: #666; margin-bottom: 10px;">
                            ${ldlMmol.toFixed(2)} mmol/L
                        </div>
                        <div style="display: inline-block; padding: 6px 12px; background: ${riskColor}; color: white; border-radius: 20px; font-weight: 600;">
                            ${riskCategory}
                        </div>
                    </div>
                    <div style="margin-top: 15px; padding: 12px; background: #f8f9fa; border-radius: 6px; font-size: 0.9em; color: #666;">
                        <strong>Calculation:</strong> ${totalMgDl.toFixed(1)} - ${hdlMgDl.toFixed(1)} - (${trigMgDl.toFixed(1)} / 5) = ${ldlMgDl.toFixed(1)} mg/dL
                    </div>
                    <div style="margin-top: 10px; font-size: 0.85em; color: #666;">
                        <strong>LDL Categories:</strong><br>
                        &lt; 100: Optimal | 100-129: Near Optimal | 130-159: Borderline High<br>
                        160-189: High | ≥ 190: Very High
                    </div>
                `;
                resultEl.style.display = 'block';
                resultEl.style.backgroundColor = '#d4edda';
                resultEl.style.borderColor = '#c3e6cb';
            } else {
                resultEl.style.display = 'none';
            }
        }

        // Add event listeners for auto-calculation
        totalCholInput.addEventListener('input', autoCalculate);
        totalCholUnit.addEventListener('change', autoCalculate);
        hdlCholInput.addEventListener('input', autoCalculate);
        hdlCholUnit.addEventListener('change', autoCalculate);
        trigInput.addEventListener('input', autoCalculate);
        trigUnit.addEventListener('change', autoCalculate);

        // Load observations from FHIR
        const totalCholPromise = getMostRecentObservation(client, '2093-3');
        const hdlCholPromise = getMostRecentObservation(client, '2085-9');
        const trigPromise = getMostRecentObservation(client, '2571-8');

        Promise.all([totalCholPromise, hdlCholPromise, trigPromise]).then(([totalChol, hdl, trig]) => {
            if (totalChol) totalCholInput.value = totalChol.valueQuantity.value.toFixed(0);
            else totalCholInput.placeholder = "e.g., 200";
            
            if (hdl) hdlCholInput.value = hdl.valueQuantity.value.toFixed(0);
            else hdlCholInput.placeholder = "e.g., 50";

            if (trig) trigInput.value = trig.valueQuantity.value.toFixed(0);
            else trigInput.placeholder = "e.g., 150";

            // Auto-calculate after loading data
            autoCalculate();
        });

        // Initial calculation if values already exist
        autoCalculate();
    }
};
