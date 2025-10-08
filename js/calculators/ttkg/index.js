import { getMostRecentObservation } from '../../utils.js';

export const ttkg = {
    id: 'ttkg',
    title: 'Transtubular Potassium Gradient (TTKG)',
    description: 'May help in assessment of hyperkalemia or hypokalemia.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <div class="form-container modern">
                <div class="input-row">
                    <label for="ttkg-urine-k">Urine potassium</label>
                    <div class="input-with-unit">
                        <input type="number" id="ttkg-urine-k">
                        <span>mEq/L</span>
                    </div>
                </div>
                <div class="input-row">
                    <label for="ttkg-serum-k">Serum potassium</label>
                    <div class="input-with-unit">
                        <input type="number" id="ttkg-serum-k" placeholder="Norm: 3.5 - 5.2">
                        <span>mEq/L</span>
                    </div>
                </div>
                <div class="input-row">
                    <label for="ttkg-urine-osmo">Urine osmolality</label>
                    <div class="input-with-unit">
                        <input type="number" id="ttkg-urine-osmo" placeholder="Norm: 500 - 800">
                        <span>mOsm/kg</span>
                    </div>
                </div>
                <div class="input-row">
                    <label for="ttkg-serum-osmo">Serum osmolality</label>
                    <div class="input-with-unit">
                        <input type="number" id="ttkg-serum-osmo" placeholder="Norm: 275 - 295">
                        <span>mOsm/kg</span>
                    </div>
                </div>
            </div>
            <div id="ttkg-result" class="result-box ttkg-result" style="display:block;">
                <div class="result-title">Result:</div>
                <div class="result-value">Please fill out required fields.</div>
            </div>
            
            <div class="formula-section">
                <h4>📐 Formula</h4>
                <div class="formula-box">
                    <div class="formula-title">TTKG =</div>
                    <div class="formula-equation">
                        <span class="formula-main">(Urine K⁺ × Serum Osmolality) / (Serum K⁺ × Urine Osmolality)</span>
                    </div>
                </div>
                
                <div class="formula-explanation">
                    <h5>📋 Formula Components</h5>
                    <ul>
                        <li><strong>Urine K⁺:</strong> Urine potassium concentration (mEq/L)</li>
                        <li><strong>Serum K⁺:</strong> Serum potassium concentration (mEq/L)</li>
                        <li><strong>Serum Osmolality:</strong> Serum osmolality (mOsm/kg)</li>
                        <li><strong>Urine Osmolality:</strong> Urine osmolality (mOsm/kg)</li>
                        <li><strong>Purpose:</strong> Estimates the potassium gradient across the cortical collecting duct</li>
                        <li><strong>Clinical significance:</strong> Helps differentiate renal vs. non-renal causes of potassium disorders</li>
                    </ul>
                </div>
                
                <div class="normal-values">
                    <h5>📊 Normal Values & Reference Ranges</h5>
                    <div class="values-grid">
                        <div class="value-item normal-range">
                            <strong>Normal TTKG:</strong><br>8-9 (on normal diet)
                        </div>
                        <div class="value-item reference-k">
                            <strong>Serum K⁺:</strong><br>3.5-5.2 mEq/L
                        </div>
                        <div class="value-item reference-osmo">
                            <strong>Serum Osmolality:</strong><br>275-295 mOsm/kg
                        </div>
                    </div>
                </div>
                
                <div class="clinical-interpretation">
                    <h5>🔍 Clinical Interpretation</h5>
                    <div class="interpretation-grid">
                        <div class="interpretation-category">
                            <h6>Hypokalemia (K⁺ < 3.5 mEq/L)</h6>
                            <div class="interpretation-item">
                                <strong>TTKG < 3:</strong>
                                <p>Suggests non-renal potassium loss (GI losses, transcellular shift, poor intake)</p>
                            </div>
                            <div class="interpretation-item">
                                <strong>TTKG ≥ 3:</strong>
                                <p>Suggests renal potassium wasting (hyperaldosteronism, diuretics, Bartter/Gitelman syndrome)</p>
                            </div>
                        </div>
                        <div class="interpretation-category">
                            <h6>Hyperkalemia (K⁺ > 5.2 mEq/L)</h6>
                            <div class="interpretation-item">
                                <strong>TTKG > 10:</strong>
                                <p>Suggests high potassium intake or transcellular shift</p>
                            </div>
                            <div class="interpretation-item">
                                <strong>TTKG < 7:</strong>
                                <p>Suggests aldosterone deficiency or resistance (hypoaldosteronism, Type IV RTA)</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="physiological-basis">
                    <h5>🧬 Physiological Basis</h5>
                    <div class="physiology-grid">
                        <div class="physiology-item">
                            <h6>Cortical Collecting Duct</h6>
                            <p>TTKG estimates the potassium gradient across the cortical collecting duct, where aldosterone acts to promote potassium secretion.</p>
                        </div>
                        <div class="physiology-item">
                            <h6>Aldosterone Effect</h6>
                            <p>Aldosterone increases potassium secretion by principal cells, creating a gradient that TTKG attempts to quantify.</p>
                        </div>
                        <div class="physiology-item">
                            <h6>Osmolality Correction</h6>
                            <p>The osmolality ratio corrects for water reabsorption in the collecting duct, providing a more accurate estimate of the true gradient.</p>
                        </div>
                    </div>
                </div>
                
                <div class="clinical-note">
                    <h5>⚠️ Clinical Notes & Limitations</h5>
                    <ul>
                        <li><strong>Prerequisites:</strong> TTKG is only valid when urine osmolality > serum osmolality (concentrated urine)</li>
                        <li><strong>Sodium delivery:</strong> Adequate sodium delivery to the distal nephron is required for accurate interpretation</li>
                        <li><strong>Diuretics:</strong> Loop and thiazide diuretics can affect TTKG interpretation</li>
                        <li><strong>Timing:</strong> Should be measured during steady-state conditions, not during acute changes</li>
                        <li><strong>Controversy:</strong> Some experts question the clinical utility of TTKG in modern practice</li>
                        <li><strong>Alternative:</strong> 24-hour urine potassium excretion may be more reliable in some cases</li>
                    </ul>
                </div>
            </div>
        `;
    },
    initialize: function(client, patient, container) {
        const urineKEl = container.querySelector('#ttkg-urine-k');
        const serumKEl = container.querySelector('#ttkg-serum-k');
        const urineOsmoEl = container.querySelector('#ttkg-urine-osmo');
        const serumOsmoEl = container.querySelector('#ttkg-serum-osmo');
        const resultEl = container.querySelector('#ttkg-result');
        const resultValueEl = container.querySelector('#ttkg-result .result-value');

        const calculate = () => {
            const urineK = parseFloat(urineKEl.value);
            const serumK = parseFloat(serumKEl.value);
            const urineOsmo = parseFloat(urineOsmoEl.value);
            const serumOsmo = parseFloat(serumOsmoEl.value);

            if (isNaN(urineK) || isNaN(serumK) || isNaN(urineOsmo) || isNaN(serumOsmo)) {
                resultValueEl.textContent = 'Please fill out required fields.';
                resultEl.className = 'result-box ttkg-result'; // Reset to default color
                return;
            }

            if (serumK === 0 || urineOsmo === 0) {
                 resultValueEl.textContent = 'Serum potassium and Urine osmolality cannot be zero.';
                 resultEl.className = 'result-box ttkg-result error'; // Add error class
                 return;
            }

            resultEl.className = 'result-box ttkg-result calculated'; // Add calculated class for styling

            const ttkgValue = (urineK * serumOsmo) / (serumK * urineOsmo);
            
            let interpretation = '';
            if (serumK < 3.5) { // Hypokalemia
                if (ttkgValue < 3) {
                    interpretation = 'Suggests renal potassium loss is not the primary cause of hypokalemia (e.g., GI loss, transcellular shift).';
                } else {
                    interpretation = 'Suggests renal potassium wasting.';
                }
            } else if (serumK > 5.2) { // Hyperkalemia
                 if (ttkgValue > 10) {
                    interpretation = 'Suggests hyperkalemia is driven by high potassium intake (dietary or iatrogenic).';
                } else if (ttkgValue < 7) {
                    interpretation = 'Suggests an issue with aldosterone (e.g., hypoaldosteronism or aldosterone resistance).';
                }
            }

            resultValueEl.innerHTML = `TTKG = ${ttkgValue.toFixed(2)}${interpretation ? `<small>${interpretation}</small>` : ''}`;
        };
        
        // LOINC codes for observations
        getMostRecentObservation(client, '2829-0').then(obs => { // Urine potassium
            if (obs && obs.valueQuantity) urineKEl.value = obs.valueQuantity.value.toFixed(1);
            calculate();
        });
        getMostRecentObservation(client, '2823-3').then(obs => { // Serum potassium
            if (obs && obs.valueQuantity) serumKEl.value = obs.valueQuantity.value.toFixed(1);
            calculate();
        });
        getMostRecentObservation(client, '2697-2').then(obs => { // Urine osmolality
            if (obs && obs.valueQuantity) urineOsmoEl.value = obs.valueQuantity.value.toFixed(1);
            calculate();
        });
        getMostRecentObservation(client, '2695-6').then(obs => { // Serum osmolality
            if (obs && obs.valueQuantity) serumOsmoEl.value = obs.valueQuantity.value.toFixed(1);
            calculate();
        });

        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculate);
        });

        calculate();
    }
};
