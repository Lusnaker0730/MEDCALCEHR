// js/calculators/calcium-correction.js
import { getMostRecentObservation } from '../../utils.js';

export const calciumCorrection = {
    id: 'calcium-correction',
    title: 'Calcium Correction for Albumin',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <div class="input-group">
                <label for="ca-total">Total Calcium (mg/dL):</label>
                <input type="number" id="ca-total" placeholder="loading...">
            </div>
            <div class="input-group">
                <label for="ca-albumin">Albumin (g/dL):</label>
                <input type="number" id="ca-albumin" placeholder="loading...">
            </div>
            <button id="calculate-ca">Calculate</button>
            <div id="ca-result" class="result" style="display:none;"></div>
            
            <div class="formula-section">
                <h4>📐 Formula</h4>
                <div class="formula-box">
                    <div class="formula-title">Corrected Calcium (mg/dL) =</div>
                    <div class="formula-equation">
                        <span class="formula-main">Total Calcium + 0.8 × (4.0 - Albumin)</span>
                    </div>
                </div>
                
                <div class="formula-explanation">
                    <h5>📋 Explanation</h5>
                    <ul>
                        <li><strong>Normal albumin reference:</strong> 4.0 g/dL</li>
                        <li><strong>Correction factor:</strong> 0.8 mg/dL per 1 g/dL decrease in albumin</li>
                        <li><strong>Purpose:</strong> Adjusts total calcium for low albumin levels</li>
                        <li><strong>Clinical significance:</strong> Helps identify true hypocalcemia vs. low total calcium due to hypoalbuminemia</li>
                    </ul>
                </div>
                
                <div class="normal-values">
                    <h5>📊 Normal Values</h5>
                    <div class="values-grid">
                        <div class="value-item">
                            <strong>Total Calcium:</strong> 8.5-10.5 mg/dL
                        </div>
                        <div class="value-item">
                            <strong>Albumin:</strong> 3.5-5.0 g/dL
                        </div>
                        <div class="value-item">
                            <strong>Corrected Calcium:</strong> 8.5-10.5 mg/dL
                        </div>
                    </div>
                </div>
                
                <div class="clinical-note">
                    <h5>⚠️ Clinical Note</h5>
                    <p>This correction is most accurate when albumin is between 2.0-4.0 g/dL. For critically ill patients or those with severe hypoalbuminemia, consider measuring ionized calcium directly.</p>
                </div>
            </div>
        `;
    },
    initialize: function(client) {
        getMostRecentObservation(client, '17861-6').then(obs => {
            if (obs) document.getElementById('ca-total').value = obs.valueQuantity.value.toFixed(1);
        });
        getMostRecentObservation(client, '1751-7').then(obs => {
            if (obs) document.getElementById('ca-albumin').value = obs.valueQuantity.value.toFixed(1);
        });

        document.getElementById('calculate-ca').addEventListener('click', () => {
            const totalCalcium = parseFloat(document.getElementById('ca-total').value);
            const albumin = parseFloat(document.getElementById('ca-albumin').value);
            const resultEl = document.getElementById('ca-result');

            if (totalCalcium > 0 && albumin > 0) {
                const correctedCalcium = totalCalcium + 0.8 * (4.0 - albumin);
                resultEl.innerHTML = `<p>Corrected Calcium: ${correctedCalcium.toFixed(2)} mg/dL</p>`;
                resultEl.style.display = 'block';
            } else {
                resultEl.innerText = 'Please enter valid Total Calcium and Albumin values.';
                resultEl.style.display = 'block';
            }
        });
    }
};







