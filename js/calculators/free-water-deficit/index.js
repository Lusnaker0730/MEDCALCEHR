// js/calculators/free-water-deficit.js
import { getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';

export const freeWaterDeficit = {
    id: 'free-water-deficit',
    title: 'Free Water Deficit in Hypernatremia',
    description:
        'Calculates free water deficit by estimated total body water in a patient with hypernatremia or dehydration.',
    generateHTML: function () {
        return `
            <h3>${this.title}</h3>
            <p>${this.description}</p>
            <div class="input-group">
                <label for="fwd-weight">Weight:</label>
                <div style="display: flex; gap: 10px;">
                    <input type="number" id="fwd-weight" placeholder="loading..." style="flex: 1;">
                    <select id="fwd-weight-unit" style="width: 80px;">
                        <option value="kg">kg</option>
                        <option value="lbs">lbs</option>
                    </select>
                </div>
                <small id="fwd-weight-converted" style="color: #666; margin-top: 4px; display: none;"></small>
            </div>
            <div class="input-group">
                <label for="fwd-sodium">Serum Sodium:</label>
                <div style="display: flex; gap: 10px;">
                    <input type="number" id="fwd-sodium" placeholder="loading..." style="flex: 1;">
                    <select id="fwd-sodium-unit" style="width: 100px;">
                        <option value="mEq/L">mEq/L</option>
                        <option value="mmol/L">mmol/L</option>
                    </select>
                </div>
            </div>
             <div class="input-group">
                <label for="fwd-gender">Gender:</label>
                <select id="fwd-gender">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                </select>
            </div>
            <div id="fwd-result" class="result" style="display:none;"></div>

            <div class="formula-section">
                <h4>🧮 Calculation Formula</h4>
                
                <div class="formula-steps">
                    <div class="formula-step">
                        <h5>Step 1: Calculate Total Body Water (TBW)</h5>
                        <div class="formula-box">
                            <strong>TBW (L)</strong> = Weight (kg) × TBW Factor
                        </div>
                        <p class="formula-note">
                            <strong>TBW Factor:</strong><br>
                            • Male: 0.6 (60% of body weight)<br>
                            • Female: 0.5 (50% of body weight)<br>
                            • Elderly: 0.5 (decreased body water)
                        </p>
                    </div>

                    <div class="formula-step">
                        <h5>Step 2: Calculate Free Water Deficit</h5>
                        <div class="formula-box">
                            <strong>Free Water Deficit (L)</strong> = TBW × [(Current Na⁺ / 140) - 1]
                        </div>
                        <p class="formula-note">
                            • Current Na⁺ = Patient's serum sodium (mEq/L)<br>
                            • 140 = Normal serum sodium (mEq/L)<br>
                            • Result is in liters
                        </p>
                    </div>

                    <div class="formula-step combined">
                        <h5>Combined Formula</h5>
                        <div class="formula-box highlight">
                            <strong>Free Water Deficit (L)</strong> = 
                            <div class="fraction">
                                <div class="numerator">Weight (kg) × TBW Factor × (Current Na⁺ - 140)</div>
                                <div class="denominator">140</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="fwd-correction-guide">
                    <h4>💧 Correction Strategy</h4>
                    <div class="correction-cards">
                        <div class="correction-card rate">
                            <div class="card-icon">⏱️</div>
                            <h5>Correction Rate</h5>
                            <p><strong>Maximum:</strong> 0.5 mEq/L/hour</p>
                            <p><strong>Target:</strong> 10-12 mEq/L per day</p>
                            <p><strong>Duration:</strong> 48-72 hours for severe hypernatremia</p>
                        </div>

                        <div class="correction-card fluid">
                            <div class="card-icon">💉</div>
                            <h5>Fluid Choice</h5>
                            <ul>
                                <li><strong>D5W:</strong> Pure free water replacement</li>
                                <li><strong>0.45% NS:</strong> Hypotonic saline (often preferred)</li>
                                <li><strong>Oral water:</strong> If patient can tolerate</li>
                            </ul>
                        </div>

                        <div class="correction-card monitoring">
                            <div class="card-icon">📊</div>
                            <h5>Monitoring</h5>
                            <ul>
                                <li>Check Na⁺ every 2-4 hours initially</li>
                                <li>Adjust rate based on response</li>
                                <li>Watch for cerebral edema signs</li>
                                <li>Monitor volume status</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div class="clinical-notes">
                    <h4>⚠️ Important Clinical Considerations</h4>
                    <ul>
                        <li><strong>Danger of rapid correction:</strong> Too rapid correction can cause cerebral edema, seizures, and death</li>
                        <li><strong>Acute vs chronic:</strong> Acute hypernatremia (<48h) can be corrected faster than chronic</li>
                        <li><strong>Ongoing losses:</strong> Consider insensible losses (500-1000 mL/day) and ongoing fluid losses</li>
                        <li><strong>Underlying cause:</strong> Address the cause (diabetes insipidus, dehydration, excess sodium intake)</li>
                        <li><strong>Special populations:</strong>
                            <ul>
                                <li>Elderly: Use 0.5 for TBW factor</li>
                                <li>Obese: Consider using ideal body weight</li>
                                <li>Children: Different TBW factors (consult pediatric guidelines)</li>
                            </ul>
                        </li>
                    </ul>
                </div>

                <div class="example-calculation">
                    <h4>📝 Example Calculation</h4>
                    <div class="example-box">
                        <div class="example-data">
                            <strong>Patient Data:</strong>
                            <ul>
                                <li>Weight: 70 kg</li>
                                <li>Gender: Male</li>
                                <li>Serum Na⁺: 160 mEq/L</li>
                            </ul>
                        </div>
                        <div class="example-steps">
                            <strong>Calculation:</strong>
                            <ol>
                                <li>TBW = 70 kg × 0.6 = 42 L</li>
                                <li>Deficit = 42 × [(160 / 140) - 1]</li>
                                <li>Deficit = 42 × [1.143 - 1]</li>
                                <li>Deficit = 42 × 0.143 = <strong>6.0 L</strong></li>
                            </ol>
                            <p class="example-result">
                                <strong>Correction Plan:</strong> Replace 6 L over 48-72 hours<br>
                                Rate: ~2-3 L per 24 hours
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    initialize: function (client, patient) {
        const weightInput = document.getElementById('fwd-weight');
        const weightUnit = document.getElementById('fwd-weight-unit');
        const weightConverted = document.getElementById('fwd-weight-converted');
        const sodiumInput = document.getElementById('fwd-sodium');
        const sodiumUnit = document.getElementById('fwd-sodium-unit');
        const genderSelect = document.getElementById('fwd-gender');
        const resultEl = document.getElementById('fwd-result');

        // Set initial values
        if (patient) {
            weightInput.value = patient.weight || '';
            genderSelect.value = patient.gender || 'male';
        }

        // Load observations from FHIR
        getMostRecentObservation(client, LOINC_CODES.WEIGHT).then(obs => {
            if (obs) {
                weightInput.value = obs.valueQuantity.value.toFixed(1);
            }
            autoCalculate();
        });
        getMostRecentObservation(client, LOINC_CODES.SODIUM).then(obs => {
            if (obs) {
                sodiumInput.value = obs.valueQuantity.value.toFixed(0);
            }
            autoCalculate();
        });

        // Function to convert weight to kg
        function getWeightInKg() {
            const weight = parseFloat(weightInput.value);
            if (!weight || weight <= 0) {
                return null;
            }
            const unit = weightUnit.value;
            return unit === 'lbs' ? weight / 2.20462 : weight;
        }

        // Function to get sodium in mEq/L
        function getSodiumInMeqL() {
            const sodium = parseFloat(sodiumInput.value);
            if (!sodium || sodium <= 0) {
                return null;
            }
            // mEq/L and mmol/L are equivalent for sodium
            return sodium;
        }

        // Function to update weight conversion display
        function updateWeightConversion() {
            const weight = parseFloat(weightInput.value);
            if (weight && weight > 0) {
                const unit = weightUnit.value;
                if (unit === 'kg') {
                    const lbs = (weight * 2.20462).toFixed(1);
                    weightConverted.textContent = `≈ ${lbs} lbs`;
                    weightConverted.style.display = 'block';
                } else {
                    const kg = (weight / 2.20462).toFixed(1);
                    weightConverted.textContent = `≈ ${kg} kg`;
                    weightConverted.style.display = 'block';
                }
            } else {
                weightConverted.style.display = 'none';
            }
        }

        // Auto-calculate function
        function autoCalculate() {
            const weightKg = getWeightInKg();
            const sodium = getSodiumInMeqL();
            const isMale = genderSelect.value === 'male';

            if (weightKg && sodium) {
                if (sodium > 140) {
                    const tbwFactor = isMale ? 0.6 : 0.5;
                    const totalBodyWater = weightKg * tbwFactor;
                    const deficit = totalBodyWater * (sodium / 140 - 1);

                    resultEl.innerHTML = `
                        <p><strong>Free Water Deficit: ${deficit.toFixed(1)} L</strong></p>
                        <div style="margin-top: 10px; padding: 10px; background: #fff3cd; border-radius: 6px; border-left: 4px solid #ffc107;">
                            <small><strong>⚠️ Important:</strong> This should be corrected slowly (e.g., over 48-72 hours) to avoid cerebral edema. Maximum rate of sodium correction is typically 0.5 mEq/L/hr.</small>
                        </div>
                        <div style="margin-top: 10px; font-size: 0.9em; color: #666;">
                            <em>Calculation: TBW = ${weightKg.toFixed(1)} kg × ${tbwFactor} = ${totalBodyWater.toFixed(1)} L<br>
                            Deficit = ${totalBodyWater.toFixed(1)} × [(${sodium}/140) - 1] = ${deficit.toFixed(1)} L</em>
                        </div>
                    `;
                    resultEl.style.display = 'block';
                    resultEl.style.backgroundColor = '#d4edda';
                    resultEl.style.borderColor = '#c3e6cb';
                } else if (sodium <= 140) {
                    resultEl.innerHTML = `
                        <p style="color: #856404;">ℹ️ This calculation is intended for patients with hypernatremia (Sodium > 140 mEq/L).</p>
                        <p style="font-size: 0.9em;">Current sodium: ${sodium} mEq/L</p>
                    `;
                    resultEl.style.display = 'block';
                    resultEl.style.backgroundColor = '#fff3cd';
                    resultEl.style.borderColor = '#ffc107';
                }
            } else {
                resultEl.style.display = 'none';
            }

            updateWeightConversion();
        }

        // Add event listeners for auto-calculation
        weightInput.addEventListener('input', autoCalculate);
        weightUnit.addEventListener('change', autoCalculate);
        sodiumInput.addEventListener('input', autoCalculate);
        sodiumUnit.addEventListener('change', autoCalculate);
        genderSelect.addEventListener('change', autoCalculate);

        // Initial calculation if values exist
        autoCalculate();
    }
};
