// js/calculators/fena.js
import { getMostRecentObservation, createUnitSelector, initializeUnitConversion, getValueInStandardUnit } from '../../utils.js';

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
                <label for="urine-creat">Urine Creatinine:</label>
                ${createUnitSelector('urine-creat', 'creatinine', ['mg/dL', 'µmol/L'], 'mg/dL')}
            </div>
            <div class="input-group">
                <label for="serum-creat">Serum Creatinine:</label>
                ${createUnitSelector('serum-creat', 'creatinine', ['mg/dL', 'µmol/L'], 'mg/dL')}
            </div>
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
        const uNaInput = container.querySelector('#urine-na');
        const sNaInput = container.querySelector('#serum-na');
        const resultEl = container.querySelector('#fena-result');

        const calculateAndUpdate = () => {
            const uNa = parseFloat(uNaInput.value);
            const sNa = parseFloat(sNaInput.value);
            const uCrMgDl = getValueInStandardUnit(container, 'urine-creat', 'mg/dL');
            const sCrMgDl = getValueInStandardUnit(container, 'serum-creat', 'mg/dL');

            if (uNa > 0 && sNa > 0 && uCrMgDl > 0 && sCrMgDl > 0) {
                const fenaValue = ((uNa / sNa) / (uCrMgDl / sCrMgDl)) * 100;
                
                let interpretation = '';
                let category = '';
                let categoryColor = '';
                let details = '';
                
                if (fenaValue < 1) {
                    category = 'Prerenal AKI';
                    categoryColor = '#2196f3';
                    interpretation = 'FENa < 1% suggests a prerenal cause of AKI.';
                    details = 'Suggests volume depletion, decreased effective circulating volume, heart failure, or hepatorenal syndrome.';
                } else if (fenaValue > 2) {
                    category = 'Intrinsic/ATN';
                    categoryColor = '#f44336';
                    interpretation = 'FENa > 2% suggests an intrinsic cause (e.g., ATN).';
                    details = 'Suggests acute tubular necrosis, acute interstitial nephritis, or other intrinsic renal disease.';
                } else {
                    category = 'Indeterminate';
                    categoryColor = '#ff9800';
                    interpretation = 'FENa between 1% and 2% is indeterminate.';
                    details = 'May represent transition phase or mixed picture. Consider clinical context and additional testing.';
                }

                resultEl.innerHTML = `
                    <div style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; margin-bottom: 15px;">
                        <div style="font-size: 1.1em; margin-bottom: 8px;">Fractional Excretion of Sodium (FENa):</div>
                        <div style="font-size: 2.2em; font-weight: bold;">${fenaValue.toFixed(2)}%</div>
                        <div style="margin-top: 10px; padding: 8px; background: ${categoryColor}; border-radius: 5px; font-size: 0.95em;">
                            ${category}
                        </div>
                    </div>
                    
                    <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                        <h4 style="margin: 0 0 10px 0; font-size: 1em;">Calculation:</h4>
                        <div style="font-size: 0.9em; line-height: 1.6;">
                            <div><strong>Formula:</strong> [(UNa ÷ SNa) ÷ (UCr ÷ SCr)] × 100</div>
                            <div style="margin-top: 10px;">
                                <div>Urine Na: ${uNa} mEq/L</div>
                                <div>Serum Na: ${sNa} mEq/L</div>
                                <div>Urine Cr: ${uCrMgDl.toFixed(0)} mg/dL</div>
                                <div>Serum Cr: ${sCrMgDl.toFixed(1)} mg/dL</div>
                            </div>
                        </div>
                    </div>
                    
                    <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                        <h4 style="margin: 0 0 10px 0; font-size: 1em;">Interpretation Guide:</h4>
                        <div style="font-size: 0.9em;">
                            <div style="padding: 5px 0;"><strong>&lt; 1%:</strong> Prerenal azotemia</div>
                            <div style="padding: 5px 0;"><strong>1-2%:</strong> Indeterminate</div>
                            <div style="padding: 5px 0;"><strong>&gt; 2%:</strong> Intrinsic renal disease/ATN</div>
                        </div>
                    </div>
                    
                    <div style="background: ${categoryColor}15; padding: 12px; border-radius: 6px; border-left: 4px solid ${categoryColor}; font-size: 0.9em;">
                        <strong>${interpretation}</strong>
                        <div style="margin-top: 8px; color: #555;">${details}</div>
                    </div>
                    
                    ${fenaValue < 1 || fenaValue > 2 ? '' : '<div style="background: #fff3cd; padding: 12px; border-radius: 6px; margin-top: 10px; font-size: 0.9em;"><strong>⚠️ Note:</strong> FENa is unreliable in patients on diuretics. Consider FEUrea instead.</div>'}
                `;
                resultEl.style.display = 'block';
            } else {
                resultEl.style.display = 'none';
            }
        };

        // Initialize unit conversions
        initializeUnitConversion(container, 'urine-creat', calculateAndUpdate);
        initializeUnitConversion(container, 'serum-creat', calculateAndUpdate);

        // Auto-populate from FHIR
        const uNaPromise = getMostRecentObservation(client, '2955-3');
        const sNaPromise = getMostRecentObservation(client, '2951-2');
        const uCrPromise = getMostRecentObservation(client, '2161-8');
        const sCrPromise = getMostRecentObservation(client, '2160-0');

        Promise.all([uNaPromise, sNaPromise, uCrPromise, sCrPromise]).then(([uNa, sNa, uCr, sCr]) => {
            if (uNa && uNa.valueQuantity) {
                uNaInput.value = uNa.valueQuantity.value.toFixed(0);
            } else {
                uNaInput.placeholder = "e.g., 20";
            }
            
            if (sNa && sNa.valueQuantity) {
                sNaInput.value = sNa.valueQuantity.value.toFixed(0);
            } else {
                sNaInput.placeholder = "e.g., 140";
            }
            
            if (uCr && uCr.valueQuantity) {
                const uCrInput = container.querySelector('#urine-creat');
                if (uCrInput) {
                    uCrInput.value = uCr.valueQuantity.value.toFixed(0);
                }
            }
            
            if (sCr && sCr.valueQuantity) {
                const sCrInput = container.querySelector('#serum-creat');
                if (sCrInput) {
                    sCrInput.value = sCr.valueQuantity.value.toFixed(1);
                }
            }
            
            calculateAndUpdate();
        });

        // Event listeners
        uNaInput.addEventListener('input', calculateAndUpdate);
        sNaInput.addEventListener('input', calculateAndUpdate);
        
        // Initial calculation
        calculateAndUpdate();
    }
};
