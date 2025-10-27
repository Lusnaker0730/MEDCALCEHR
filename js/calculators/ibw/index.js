// js/calculators/ibw.js
import { getMostRecentObservation } from '../../utils.js';

export const ibw = {
    id: 'ibw',
    title: 'Ideal & Adjusted Body Weight',
    generateHTML: function () {
        return `
            <h3>${this.title}</h3>
            <div class="input-group">
                <label for="ibw-height">Height (cm):</label>
                <input type="number" id="ibw-height" placeholder="loading...">
            </div>
            <div class="input-group">
                <label for="ibw-gender">Gender:</label>
                <select id="ibw-gender">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                </select>
            </div>
            <div class="input-group">
                <label for="ibw-actual">Actual Weight (kg):</label>
                <input type="number" id="ibw-actual" placeholder="loading...">
            </div>
            <button id="calculate-ibw">Calculate</button>
            <div id="ibw-result" class="result" style="display:none;"></div>
            
            <div class="formula-section">
                <h4>📐 Formulas</h4>
                
                <div class="formula-box">
                    <h5>Ideal Body Weight (IBW) - Devine Formula</h5>
                    <div class="formula-content">
                        <div class="formula-item">
                            <strong>For Males:</strong>
                            <div class="formula-equation">IBW (kg) = 50 + 2.3 × (height in inches - 60)</div>
                        </div>
                        <div class="formula-item">
                            <strong>For Females:</strong>
                            <div class="formula-equation">IBW (kg) = 45.5 + 2.3 × (height in inches - 60)</div>
                        </div>
                    </div>
                </div>

                <div class="formula-box">
                    <h5>Adjusted Body Weight (ABW)</h5>
                    <div class="formula-content">
                        <div class="formula-item">
                            <div class="formula-equation">ABW (kg) = IBW + 0.4 × (Actual Weight - IBW)</div>
                            <div class="formula-note">
                                <strong>Note:</strong> ABW is calculated only when actual weight exceeds IBW
                            </div>
                        </div>
                    </div>
                </div>

                <div class="formula-explanation">
                    <h5>📋 Formula Components</h5>
                    <ul>
                        <li><strong>Height conversion:</strong> 1 inch = 2.54 cm</li>
                        <li><strong>Base weight:</strong> 50 kg (male) or 45.5 kg (female) for 60 inches (152.4 cm)</li>
                        <li><strong>Height adjustment:</strong> Add 2.3 kg for each inch above 60 inches</li>
                        <li><strong>ABW factor:</strong> 0.4 (40%) of the excess weight above IBW</li>
                    </ul>
                </div>

                <div class="clinical-applications">
                    <h5>🏥 Clinical Applications</h5>
                    <div class="applications-grid">
                        <div class="application-item">
                            <h6>Ideal Body Weight (IBW)</h6>
                            <ul>
                                <li>Drug dosing for medications with narrow therapeutic index</li>
                                <li>Nutritional assessment and planning</li>
                                <li>Ventilator settings (tidal volume calculation)</li>
                                <li>Estimating energy requirements</li>
                            </ul>
                        </div>
                        <div class="application-item">
                            <h6>Adjusted Body Weight (ABW)</h6>
                            <ul>
                                <li>Drug dosing in obese patients (actual weight > IBW)</li>
                                <li>Aminoglycoside dosing</li>
                                <li>Anesthetic agent dosing</li>
                                <li>More accurate than IBW alone for obese patients</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div class="clinical-note">
                    <h5>⚠️ Important Clinical Notes</h5>
                    <ul>
                        <li><strong>Limitations:</strong> IBW formulas are based on population averages and may not be appropriate for all individuals</li>
                        <li><strong>Height restriction:</strong> Devine formula is most accurate for heights > 152 cm (60 inches)</li>
                        <li><strong>Body composition:</strong> Does not account for muscle mass, body composition, or frame size</li>
                        <li><strong>Obesity:</strong> Use ABW for drug dosing in patients with actual weight > 120% of IBW</li>
                        <li><strong>Underweight:</strong> For patients below IBW, use actual body weight for dosing</li>
                        <li><strong>Alternative formulas:</strong> Consider Robinson, Miller, or Hamwi formulas for comparison</li>
                        <li><strong>Pediatric patients:</strong> These formulas are not validated for children; use age-appropriate methods</li>
                    </ul>
                </div>

                <div class="reference-info">
                    <h5>📚 References</h5>
                    <p><strong>Devine BJ.</strong> Gentamicin therapy. <em>Drug Intell Clin Pharm.</em> 1974;8:650-655.</p>
                    <p><strong>Clinical Application:</strong> The Devine formula remains the most widely used method for calculating IBW in clinical practice, particularly for drug dosing and ventilator management.</p>
                </div>
            </div>
        `;
    },
    initialize: function (client, patient) {
        const heightInput = document.getElementById('ibw-height');
        const genderSelect = document.getElementById('ibw-gender');
        const actualWeightInput = document.getElementById('ibw-actual');

        genderSelect.value = patient.gender;

        getMostRecentObservation(client, '8302-2').then(obs => {
            if (obs) {
                heightInput.value = obs.valueQuantity.value.toFixed(1);
            }
        });
        getMostRecentObservation(client, '29463-7').then(obs => {
            if (obs) {
                actualWeightInput.value = obs.valueQuantity.value.toFixed(1);
            }
        });

        document.getElementById('calculate-ibw').addEventListener('click', () => {
            const heightCm = parseFloat(heightInput.value);
            const isMale = genderSelect.value === 'male';
            const actualWeight = parseFloat(actualWeightInput.value);
            const resultEl = document.getElementById('ibw-result');

            if (heightCm > 0) {
                const heightIn = heightCm / 2.54;
                let ibw = 0;
                if (heightIn > 60) {
                    if (isMale) {
                        ibw = 50 + 2.3 * (heightIn - 60);
                    } else {
                        ibw = 45.5 + 2.3 * (heightIn - 60);
                    }
                } else {
                    // For simplicity, handle this edge case. A more complex formula might be needed for < 5ft.
                    ibw = isMale ? 50 : 45.5;
                }

                let resultHTML = `<p>Ideal Body Weight: ${ibw.toFixed(1)} kg</p>`;

                if (actualWeight > 0 && actualWeight > ibw) {
                    const adjBw = ibw + 0.4 * (actualWeight - ibw);
                    resultHTML += `<p>Adjusted Body Weight: ${adjBw.toFixed(1)} kg</p>`;
                }

                resultEl.innerHTML = resultHTML;
                resultEl.style.display = 'block';
            } else {
                resultEl.innerText = 'Please enter a valid height.';
                resultEl.style.display = 'block';
            }
        });
    }
};
