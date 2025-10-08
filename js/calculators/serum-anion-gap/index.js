import { getMostRecentObservation } from '../../utils.js';

export const serumAnionGap = {
    id: 'serum-anion-gap',
    title: 'Serum Anion Gap',
    description: 'Evaluates states of metabolic acidosis.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <div class="input-group">
                <label for="sag-na">Sodium (Na⁺) (mEq/L)</label>
                <input type="number" id="sag-na" placeholder="Enter Sodium">
            </div>
            <div class="input-group">
                <label for="sag-cl">Chloride (Cl⁻) (mEq/L)</label>
                <input type="number" id="sag-cl" placeholder="Enter Chloride">
            </div>
            <div class="input-group">
                <label for="sag-hco3">Bicarbonate (HCO₃⁻) (mEq/L)</label>
                <input type="number" id="sag-hco3" placeholder="Enter Bicarbonate">
            </div>
            <button id="calculate-sag">Calculate Anion Gap</button>
            <div id="sag-result" class="result" style="display:none;"></div>
            
            <div class="formula-section">
                <h4>📐 Formula</h4>
                <div class="formula-box">
                    <div class="formula-title">Serum Anion Gap (mEq/L) =</div>
                    <div class="formula-equation">
                        <span class="formula-main">Na⁺ - (Cl⁻ + HCO₃⁻)</span>
                    </div>
                </div>
                
                <div class="formula-explanation">
                    <h5>📋 Explanation</h5>
                    <ul>
                        <li><strong>Na⁺ (Sodium):</strong> Major extracellular cation</li>
                        <li><strong>Cl⁻ (Chloride):</strong> Major extracellular anion</li>
                        <li><strong>HCO₃⁻ (Bicarbonate):</strong> Major buffer in blood</li>
                        <li><strong>Purpose:</strong> Evaluates acid-base status and identifies unmeasured anions</li>
                        <li><strong>Clinical significance:</strong> Helps differentiate causes of metabolic acidosis</li>
                    </ul>
                </div>
                
                <div class="normal-values">
                    <h5>📊 Normal Values & Interpretation</h5>
                    <div class="values-grid">
                        <div class="value-item normal-range">
                            <strong>Normal Range:</strong><br>6-12 mEq/L
                        </div>
                        <div class="value-item high-range">
                            <strong>High (>12 mEq/L):</strong><br>High Anion Gap Metabolic Acidosis
                        </div>
                        <div class="value-item low-range">
                            <strong>Low (<6 mEq/L):</strong><br>Uncommon, possible lab error
                        </div>
                    </div>
                </div>
                
                <div class="clinical-causes">
                    <h5>🔍 Common Causes</h5>
                    <div class="causes-grid">
                        <div class="cause-category">
                            <h6>High Anion Gap (MUDPILES)</h6>
                            <ul>
                                <li><strong>M</strong>ethanol</li>
                                <li><strong>U</strong>remia</li>
                                <li><strong>D</strong>iabetic ketoacidosis</li>
                                <li><strong>P</strong>ropylene glycol</li>
                                <li><strong>I</strong>soniazid</li>
                                <li><strong>L</strong>actic acidosis</li>
                                <li><strong>E</strong>thylene glycol</li>
                                <li><strong>S</strong>alicylates</li>
                            </ul>
                        </div>
                        <div class="cause-category">
                            <h6>Normal Anion Gap</h6>
                            <ul>
                                <li>Diarrhea</li>
                                <li>Renal tubular acidosis</li>
                                <li>Carbonic anhydrase inhibitors</li>
                                <li>Post-hypocapnia</li>
                                <li>Saline administration</li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div class="clinical-note">
                    <h5>⚠️ Clinical Notes</h5>
                    <ul>
                        <li><strong>Albumin correction:</strong> For every 1 g/dL decrease in albumin below 4 g/dL, add 2.5 mEq/L to the anion gap</li>
                        <li><strong>Laboratory variation:</strong> Normal ranges may vary between laboratories</li>
                        <li><strong>Potassium:</strong> Some laboratories include K⁺ in the formula: (Na⁺ + K⁺) - (Cl⁻ + HCO₃⁻)</li>
                    </ul>
                </div>
            </div>
        `;
    },
    initialize: function(client) {
        // Fetch recent lab values
        getMostRecentObservation(client, '2951-2').then(obs => {
            if (obs && obs.valueQuantity) document.getElementById('sag-na').value = obs.valueQuantity.value.toFixed(0);
        });
        getMostRecentObservation(client, '2075-0').then(obs => {
            if (obs && obs.valueQuantity) document.getElementById('sag-cl').value = obs.valueQuantity.value.toFixed(0);
        });
        getMostRecentObservation(client, '1963-8').then(obs => {
            if (obs && obs.valueQuantity) document.getElementById('sag-hco3').value = obs.valueQuantity.value.toFixed(0);
        });

        document.getElementById('calculate-sag').addEventListener('click', () => {
            const na = parseFloat(document.getElementById('sag-na').value);
            const cl = parseFloat(document.getElementById('sag-cl').value);
            const hco3 = parseFloat(document.getElementById('sag-hco3').value);

            if (isNaN(na) || isNaN(cl) || isNaN(hco3)) {
                alert('Please enter all values.');
                return;
            }

            const anionGap = na - (cl + hco3);
            
            let interpretation = '';
            if (anionGap > 12) {
                interpretation = 'High Anion Gap: Suggests metabolic acidosis (e.g., DKA, lactic acidosis, renal failure, toxic ingestions).';
            } else if (anionGap < 6) {
                interpretation = 'Low Anion Gap: Less common, may be due to lab error, hypoalbuminemia, or paraproteinemia.';
            } else {
                interpretation = 'Normal Anion Gap: Metabolic acidosis, if present, is likely non-anion gap (e.g., diarrhea, renal tubular acidosis).';
            }

            const resultEl = document.getElementById('sag-result');
            resultEl.innerHTML = `
                <p>Serum Anion Gap: ${anionGap.toFixed(1)} mEq/L</p>
                <p>Interpretation: ${interpretation}</p>
            `;
            resultEl.style.display = 'block';
        });
    }
};
