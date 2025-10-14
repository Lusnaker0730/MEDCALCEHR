// js/calculators/free-water-deficit.js
import { getMostRecentObservation } from '../../utils.js';

export const freeWaterDeficit = {
    id: 'free-water-deficit',
    title: 'Free Water Deficit in Hypernatremia',
    description: 'Calculates free water deficit by estimated total body water in a patient with hypernatremia or dehydration.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p>${this.description}</p>
            <div class="input-group">
                <label for="fwd-weight">Weight (kg):</label>
                <input type="number" id="fwd-weight" placeholder="loading...">
            </div>
            <div class="input-group">
                <label for="fwd-sodium">Serum Sodium (mEq/L):</label>
                <input type="number" id="fwd-sodium" placeholder="loading...">
            </div>
             <div class="input-group">
                <label for="fwd-gender">Gender:</label>
                <select id="fwd-gender">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                </select>
            </div>
            <button id="calculate-fwd">Calculate Deficit</button>
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
    initialize: function(client, patient) {
        document.getElementById('fwd-weight').value = patient.weight || '';
        document.getElementById('fwd-gender').value = patient.gender || 'male';

        getMostRecentObservation(client, '29463-7').then(obs => { 
            if(obs) document.getElementById('fwd-weight').value = obs.valueQuantity.value.toFixed(1);
        });
        getMostRecentObservation(client, '2951-2').then(obs => {
            if(obs) document.getElementById('fwd-sodium').value = obs.valueQuantity.value.toFixed(0);
        });

        document.getElementById('calculate-fwd').addEventListener('click', () => {
            const weight = parseFloat(document.getElementById('fwd-weight').value);
            const sodium = parseFloat(document.getElementById('fwd-sodium').value);
            const isMale = document.getElementById('fwd-gender').value === 'male';
            const resultEl = document.getElementById('fwd-result');

            if (weight > 0 && sodium > 140) {
                const tbwFactor = isMale ? 0.6 : 0.5;
                const totalBodyWater = weight * tbwFactor;
                const deficit = totalBodyWater * ((sodium / 140) - 1);
                
                resultEl.innerHTML = `
                    <p>Free Water Deficit: ${deficit.toFixed(1)} L</p>
                    <small><em>This should be corrected slowly (e.g., over 48-72 hours) to avoid cerebral edema. Maximum rate of sodium correction is typically 0.5 mEq/L/hr.</em></small>
                `;
                resultEl.style.display = 'block';
            } else if (sodium <= 140) {
                 resultEl.innerText = 'This calculation is intended for patients with hypernatremia (Sodium > 140 mEq/L).';
                 resultEl.style.display = 'block';
            } else {
                resultEl.innerText = 'Please enter a valid weight and sodium level.';
                resultEl.style.display = 'block';
            }
        });
    }
};
