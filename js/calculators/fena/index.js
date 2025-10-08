// js/calculators/fena.js
import { getMostRecentObservation } from '../../utils.js';

export const fena = {
    id: 'fena',
    title: 'Fractional Excretion of Sodium (FENa)',
    description: 'Determines if renal failure is due to prerenal or intrinsic pathology.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p>${this.description}</p>
            <div class="input-group">
                <label for="urine-na">Urine Sodium (mEq/L):</label>
                <input type="number" id="urine-na" placeholder="loading...">
            </div>
            <div class="input-group">
                <label for="serum-na">Serum Sodium (mEq/L):</label>
                <input type="number" id="serum-na" placeholder="loading...">
            </div>
            <div class="input-group">
                <label for="urine-creat">Urine Creatinine (mg/dL):</label>
                <input type="number" id="urine-creat" placeholder="loading...">
            </div>
            <div class="input-group">
                <label for="serum-creat">Serum Creatinine (mg/dL):</label>
                <input type="number" id="serum-creat" placeholder="loading...">
            </div>
            <button id="calculate-fena">Calculate FENa</button>
            <div id="fena-result" class="result" style="display:none;"></div>
            
            <div class="formula-section">
                <h4>📐 Formula</h4>
                
                <div class="formula-box">
                    <h5>Fractional Excretion of Sodium (FENa)</h5>
                    <div class="formula-content">
                        <div class="formula-equation-large">
                            FENa (%) = [(Urine Na × Serum Cr) / (Serum Na × Urine Cr)] × 100
                        </div>
                        <div class="formula-equation-fraction">
                            <div class="fraction-container">
                                <div class="fraction">
                                    <div class="numerator">Urine Na / Serum Na</div>
                                    <div class="fraction-line"></div>
                                    <div class="denominator">Urine Cr / Serum Cr</div>
                                </div>
                                <span class="multiply">× 100</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="formula-explanation">
                    <h5>📋 Formula Components</h5>
                    <ul>
                        <li><strong>Urine Sodium (UNa):</strong> Measured in mEq/L</li>
                        <li><strong>Serum Sodium (SNa):</strong> Measured in mEq/L</li>
                        <li><strong>Urine Creatinine (UCr):</strong> Measured in mg/dL</li>
                        <li><strong>Serum Creatinine (SCr):</strong> Measured in mg/dL</li>
                    </ul>
                </div>

                <div class="interpretation-guide">
                    <h5>🔍 Interpretation</h5>
                    <div class="interpretation-grid">
                        <div class="interpretation-item prerenal">
                            <div class="interpretation-header">
                                <span class="interpretation-value">&lt; 1%</span>
                                <span class="interpretation-label">Prerenal AKI</span>
                            </div>
                            <div class="interpretation-details">
                                <p><strong>Suggests:</strong> Prerenal azotemia</p>
                                <ul>
                                    <li>Volume depletion</li>
                                    <li>Decreased effective circulating volume</li>
                                    <li>Heart failure</li>
                                    <li>Cirrhosis with ascites</li>
                                    <li>Renal artery stenosis</li>
                                </ul>
                            </div>
                        </div>

                        <div class="interpretation-item indeterminate">
                            <div class="interpretation-header">
                                <span class="interpretation-value">1-2%</span>
                                <span class="interpretation-label">Indeterminate</span>
                            </div>
                            <div class="interpretation-details">
                                <p><strong>Suggests:</strong> Unclear etiology</p>
                                <ul>
                                    <li>May represent transition phase</li>
                                    <li>Mixed picture</li>
                                    <li>Consider clinical context</li>
                                    <li>Repeat testing may be helpful</li>
                                    <li>Use additional diagnostic tools</li>
                                </ul>
                            </div>
                        </div>

                        <div class="interpretation-item intrinsic">
                            <div class="interpretation-header">
                                <span class="interpretation-value">&gt; 2%</span>
                                <span class="interpretation-label">Intrinsic/ATN</span>
                            </div>
                            <div class="interpretation-details">
                                <p><strong>Suggests:</strong> Intrinsic renal disease</p>
                                <ul>
                                    <li>Acute tubular necrosis (ATN)</li>
                                    <li>Acute interstitial nephritis</li>
                                    <li>Glomerulonephritis</li>
                                    <li>Vasculitis</li>
                                    <li>Nephrotoxic medications</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="clinical-note">
                    <h5>⚠️ Important Clinical Notes & Limitations</h5>
                    <ul>
                        <li><strong>Diuretic Use:</strong> FENa is unreliable in patients on diuretics (consider FEUrea instead)</li>
                        <li><strong>Chronic Kidney Disease:</strong> May have elevated baseline FENa (>1%)</li>
                        <li><strong>Contrast-Induced Nephropathy:</strong> May have FENa <1% despite ATN</li>
                        <li><strong>Rhabdomyolysis:</strong> May have FENa <1% despite intrinsic injury</li>
                        <li><strong>Sepsis-Associated AKI:</strong> May have variable FENa</li>
                        <li><strong>Hepatorenal Syndrome:</strong> Typically FENa <1%</li>
                        <li><strong>Urinary Tract Obstruction:</strong> Variable FENa depending on duration</li>
                        <li><strong>Spot Urine Sample:</strong> Requires simultaneous serum and urine samples</li>
                        <li><strong>Not Diagnostic Alone:</strong> Must be interpreted in clinical context</li>
                    </ul>
                </div>

                <div class="alternative-indices">
                    <h5>🔄 Alternative Indices</h5>
                    <div class="alternative-grid">
                        <div class="alternative-item">
                            <h6>Fractional Excretion of Urea (FEUrea)</h6>
                            <div class="formula-equation">FEUrea (%) = [(Urine Urea × Serum Cr) / (Serum Urea × Urine Cr)] × 100</div>
                            <p><strong>Use when:</strong> Patient is on diuretics</p>
                            <p><strong>Interpretation:</strong> &lt;35% suggests prerenal, &gt;50% suggests intrinsic</p>
                        </div>

                        <div class="alternative-item">
                            <h6>Urine Sodium Concentration</h6>
                            <p><strong>Prerenal:</strong> Usually &lt;20 mEq/L</p>
                            <p><strong>Intrinsic:</strong> Usually &gt;40 mEq/L</p>
                            <p><strong>Note:</strong> Less specific than FENa</p>
                        </div>

                        <div class="alternative-item">
                            <h6>Urine Osmolality</h6>
                            <p><strong>Prerenal:</strong> Usually &gt;500 mOsm/kg</p>
                            <p><strong>Intrinsic:</strong> Usually &lt;350 mOsm/kg</p>
                            <p><strong>Note:</strong> Reflects concentrating ability</p>
                        </div>
                    </div>
                </div>

                <div class="reference-info">
                    <h5>📚 Clinical Pearls</h5>
                    <ul>
                        <li><strong>Timing:</strong> Obtain samples early in AKI course for best accuracy</li>
                        <li><strong>Volume Status:</strong> Always assess clinical volume status alongside FENa</li>
                        <li><strong>Urine Microscopy:</strong> Complement FENa with urinalysis and microscopy</li>
                        <li><strong>Serial Measurements:</strong> Trending FENa can help monitor response to therapy</li>
                        <li><strong>Prerenal vs ATN:</strong> Prerenal AKI should improve with volume resuscitation</li>
                        <li><strong>Mixed Pictures:</strong> Some patients may have both prerenal and intrinsic components</li>
                    </ul>
                </div>
            </div>
        `;
    },
    initialize: function(client, patient, container) {
        // LOINC: Urine Na: 2955-3, Serum Na: 2951-2, Urine Creat: 2161-8, Serum Creat: 2160-0
        const uNaPromise = getMostRecentObservation(client, '2955-3');
        const sNaPromise = getMostRecentObservation(client, '2951-2');
        const uCrPromise = getMostRecentObservation(client, '2161-8');
        const sCrPromise = getMostRecentObservation(client, '2160-0');

        Promise.all([uNaPromise, sNaPromise, uCrPromise, sCrPromise]).then(([uNa, sNa, uCr, sCr]) => {
            if (uNa) container.querySelector('#urine-na').value = uNa.valueQuantity.value.toFixed(0);
            else container.querySelector('#urine-na').placeholder = "e.g., 20";
            if (sNa) container.querySelector('#serum-na').value = sNa.valueQuantity.value.toFixed(0);
            else container.querySelector('#serum-na').placeholder = "e.g., 140";
            if (uCr) container.querySelector('#urine-creat').value = uCr.valueQuantity.value.toFixed(0);
            else container.querySelector('#urine-creat').placeholder = "e.g., 100";
            if (sCr) container.querySelector('#serum-creat').value = sCr.valueQuantity.value.toFixed(1);
            else container.querySelector('#serum-creat').placeholder = "e.g., 2.5";
        });

        container.querySelector('#calculate-fena').addEventListener('click', () => {
            const uNa = parseFloat(container.querySelector('#urine-na').value);
            const sNa = parseFloat(container.querySelector('#serum-na').value);
            const uCr = parseFloat(container.querySelector('#urine-creat').value);
            const sCr = parseFloat(container.querySelector('#serum-creat').value);
            const resultEl = container.querySelector('#fena-result');

            if (uNa > 0 && sNa > 0 && uCr > 0 && sCr > 0) {
                const fenaValue = ((uNa / sNa) / (uCr / sCr)) * 100;
                let interpretation = '';
                if (fenaValue < 1) {
                    interpretation = 'FENa < 1% suggests a prerenal cause of AKI.';
                } else if (fenaValue > 2) {
                    interpretation = 'FENa > 2% suggests an intrinsic cause (e.g., ATN).';
                } else {
                    interpretation = 'FENa between 1% and 2% is indeterminate.';
                }

                resultEl.innerHTML = `
                    <p>FENa: ${fenaValue.toFixed(2)}%</p>
                    <p><strong>Interpretation:</strong> ${interpretation}</p>
                `;
                resultEl.style.display = 'block';
            } else {
                resultEl.innerText = 'Please enter valid values for all fields.';
                resultEl.style.display = 'block';
            }
        });
    }
};
