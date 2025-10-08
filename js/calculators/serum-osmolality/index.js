import { getMostRecentObservation } from '../../utils.js';

export const serumOsmolality = {
    id: 'serum-osmolality',
    title: 'Serum Osmolality/Osmolarity',
    description: 'Calculates expected serum osmolarity, for comparison to measured osmolality to detect unmeasured compounds in the serum.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <div class="input-group">
                <label for="osmo-na">Sodium (Na⁺) (mEq/L)</label>
                <input type="number" id="osmo-na">
            </div>
            <div class="input-group">
                <label for="osmo-glucose">Glucose (mg/dL)</label>
                <input type="number" id="osmo-glucose">
            </div>
            <div class="input-group">
                <label for="osmo-bun">BUN (mg/dL)</label>
                <input type="number" id="osmo-bun">
            </div>
            <button id="calculate-osmolality">Calculate</button>
            <div id="osmolality-result" class="result" style="display:none;"></div>
            
            <div class="formula-section">
                <h4>📐 Formula</h4>
                <div class="formula-box">
                    <div class="formula-title">Calculated Serum Osmolality (mOsm/kg) =</div>
                    <div class="formula-equation">
                        <span class="formula-main">2 × Na⁺ + (Glucose/18) + (BUN/2.8)</span>
                    </div>
                </div>
                
                <div class="formula-explanation">
                    <h5>📋 Formula Components</h5>
                    <ul>
                        <li><strong>2 × Na⁺:</strong> Sodium and its accompanying anions (mainly Cl⁻ and HCO₃⁻)</li>
                        <li><strong>Glucose/18:</strong> Glucose contribution (18 = molecular weight conversion factor)</li>
                        <li><strong>BUN/2.8:</strong> Blood urea nitrogen contribution (2.8 = conversion factor from BUN to urea)</li>
                        <li><strong>Purpose:</strong> Estimates the expected serum osmolality based on major osmotically active substances</li>
                        <li><strong>Clinical significance:</strong> Compare with measured osmolality to detect unmeasured osmoles</li>
                    </ul>
                </div>
                
                <div class="normal-values">
                    <h5>📊 Normal Values & Reference Ranges</h5>
                    <div class="values-grid">
                        <div class="value-item normal-range">
                            <strong>Normal Osmolality:</strong><br>275-295 mOsm/kg
                        </div>
                        <div class="value-item reference-na">
                            <strong>Sodium:</strong><br>136-145 mEq/L
                        </div>
                        <div class="value-item reference-glucose">
                            <strong>Glucose:</strong><br>70-100 mg/dL
                        </div>
                        <div class="value-item reference-bun">
                            <strong>BUN:</strong><br>7-20 mg/dL
                        </div>
                    </div>
                </div>
                
                <div class="osmolar-gap">
                    <h5>🔍 Osmolar Gap</h5>
                    <div class="gap-explanation">
                        <div class="gap-formula">
                            <strong>Osmolar Gap = Measured Osmolality - Calculated Osmolality</strong>
                        </div>
                        <div class="gap-interpretation">
                            <div class="gap-item normal-gap">
                                <strong>Normal Gap:</strong> < 10 mOsm/kg
                                <p>No significant unmeasured osmoles present</p>
                            </div>
                            <div class="gap-item elevated-gap">
                                <strong>Elevated Gap:</strong> > 10 mOsm/kg
                                <p>Suggests presence of unmeasured osmotically active substances</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="clinical-causes">
                    <h5>🔍 Causes of Elevated Osmolar Gap</h5>
                    <div class="causes-grid">
                        <div class="cause-category">
                            <h6>Toxic Alcohols</h6>
                            <ul>
                                <li>Methanol</li>
                                <li>Ethylene glycol</li>
                                <li>Isopropanol</li>
                                <li>Ethanol (high levels)</li>
                            </ul>
                        </div>
                        <div class="cause-category">
                            <h6>Other Substances</h6>
                            <ul>
                                <li>Mannitol</li>
                                <li>Glycerol</li>
                                <li>Propylene glycol</li>
                                <li>Acetone (severe DKA)</li>
                            </ul>
                        </div>
                        <div class="cause-category">
                            <h6>Clinical Conditions</h6>
                            <ul>
                                <li>Severe hyperglycemia</li>
                                <li>Chronic kidney disease</li>
                                <li>Shock (lactate, ketones)</li>
                                <li>Laboratory error</li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div class="alternative-formulas">
                    <h5>📝 Alternative Formulas</h5>
                    <div class="alt-formulas-grid">
                        <div class="alt-formula-item">
                            <h6>Simple Formula</h6>
                            <div class="alt-equation">2 × Na⁺ + (Glucose/18) + (BUN/2.8)</div>
                            <p>Most commonly used formula (shown above)</p>
                        </div>
                        <div class="alt-formula-item">
                            <h6>With Ethanol</h6>
                            <div class="alt-equation">2 × Na⁺ + (Glucose/18) + (BUN/2.8) + (Ethanol/4.6)</div>
                            <p>When ethanol level is known (4.6 = conversion factor)</p>
                        </div>
                        <div class="alt-formula-item">
                            <h6>Simplified</h6>
                            <div class="alt-equation">2 × Na⁺ + 10</div>
                            <p>Quick approximation when glucose and BUN are normal</p>
                        </div>
                    </div>
                </div>
                
                <div class="clinical-note">
                    <h5>⚠️ Clinical Notes</h5>
                    <ul>
                        <li><strong>Osmolality vs. Osmolarity:</strong> Osmolality (mOsm/kg water) is preferred over osmolarity (mOsm/L solution)</li>
                        <li><strong>Temperature:</strong> Measured osmolality should be corrected to body temperature</li>
                        <li><strong>Timing:</strong> Calculate osmolar gap promptly as some substances (like ethanol) are metabolized quickly</li>
                        <li><strong>False elevations:</strong> Severe hyperlipidemia or hyperproteinemia can cause pseudohyponatremia and affect calculations</li>
                        <li><strong>Ketones:</strong> In DKA, ketones can contribute to osmolar gap but are not included in standard formula</li>
                        <li><strong>Units:</strong> Ensure consistent units - some labs report glucose in mmol/L (divide by 18 not needed)</li>
                    </ul>
                </div>
            </div>
        `;
    },
    initialize: function(client) {
        let dataLoaded = { na: false, glucose: false, bun: false };
        
        // Auto-populate Sodium
        getMostRecentObservation(client, '2951-2').then(obs => {
            if (obs && obs.valueQuantity) {
                document.getElementById('osmo-na').value = obs.valueQuantity.value.toFixed(0);
                dataLoaded.na = true;
                this.checkAndAutoCalculate(dataLoaded);
            }
        }).catch(error => {
            console.error('Error fetching sodium:', error);
        });
        
        // Auto-populate Glucose
        getMostRecentObservation(client, '2345-7').then(obs => {
            if (obs && obs.valueQuantity) {
                document.getElementById('osmo-glucose').value = obs.valueQuantity.value.toFixed(0);
                dataLoaded.glucose = true;
                this.checkAndAutoCalculate(dataLoaded);
            }
        }).catch(error => {
            console.error('Error fetching glucose:', error);
        });
        
        // Auto-populate BUN
        getMostRecentObservation(client, '3094-0').then(obs => {
            if (obs && obs.valueQuantity) {
                document.getElementById('osmo-bun').value = obs.valueQuantity.value.toFixed(0);
                dataLoaded.bun = true;
                this.checkAndAutoCalculate(dataLoaded);
            }
        }).catch(error => {
            console.error('Error fetching BUN:', error);
        });

        // Manual calculation button
        document.getElementById('calculate-osmolality').addEventListener('click', () => {
            this.calculateOsmolality();
        });
        
        // Auto-calculate on input change
        ['osmo-na', 'osmo-glucose', 'osmo-bun'].forEach(id => {
            document.getElementById(id).addEventListener('input', () => {
                this.calculateOsmolality();
            });
        });
    },
    
    checkAndAutoCalculate: function(dataLoaded) {
        // Auto-calculate if all data is loaded
        if (dataLoaded.na && dataLoaded.glucose && dataLoaded.bun) {
            setTimeout(() => {
                this.calculateOsmolality();
            }, 100); // Small delay to ensure all DOM updates are complete
        }
    },
    
    calculateOsmolality: function() {
        const na = parseFloat(document.getElementById('osmo-na').value);
        const glucose = parseFloat(document.getElementById('osmo-glucose').value);
        const bun = parseFloat(document.getElementById('osmo-bun').value);

        if (isNaN(na) || isNaN(glucose) || isNaN(bun)) {
            document.getElementById('osmolality-result').style.display = 'none';
            return;
        }

        const calculatedOsmolality = (2 * na) + (glucose / 18) + (bun / 2.8);
        
        // Determine interpretation
        let interpretation = '';
        let interpretationClass = '';
        
        if (calculatedOsmolality < 275) {
            interpretation = 'Below normal range';
            interpretationClass = 'low-result';
        } else if (calculatedOsmolality > 295) {
            interpretation = 'Above normal range';
            interpretationClass = 'high-result';
        } else {
            interpretation = 'Within normal range';
            interpretationClass = 'normal-result';
        }

        document.getElementById('osmolality-result').innerHTML = `
            <div class="osmolality-calculation">
                <h4>🧮 Calculation Result</h4>
                <div class="result-main">
                    <div class="result-value">
                        <span class="result-number">${calculatedOsmolality.toFixed(1)}</span>
                        <span class="result-unit">mOsm/kg</span>
                    </div>
                    <div class="result-interpretation ${interpretationClass}">
                        ${interpretation}
                    </div>
                </div>
                
                <div class="calculation-breakdown">
                    <h5>📊 Calculation Breakdown</h5>
                    <div class="breakdown-steps">
                        <div class="step">
                            <span class="step-label">2 × Sodium:</span>
                            <span class="step-value">2 × ${na} = ${(2 * na).toFixed(1)} mOsm/kg</span>
                        </div>
                        <div class="step">
                            <span class="step-label">Glucose/18:</span>
                            <span class="step-value">${glucose}/18 = ${(glucose / 18).toFixed(1)} mOsm/kg</span>
                        </div>
                        <div class="step">
                            <span class="step-label">BUN/2.8:</span>
                            <span class="step-value">${bun}/2.8 = ${(bun / 2.8).toFixed(1)} mOsm/kg</span>
                        </div>
                        <div class="step total-step">
                            <span class="step-label">Total:</span>
                            <span class="step-value">${calculatedOsmolality.toFixed(1)} mOsm/kg</span>
                        </div>
                    </div>
                </div>
                
                <div class="osmolar-gap-info">
                    <h5>🔍 Osmolar Gap Assessment</h5>
                    <p>To calculate osmolar gap, compare this calculated value (${calculatedOsmolality.toFixed(1)} mOsm/kg) with the measured serum osmolality:</p>
                    <div class="gap-formula-display">
                        <strong>Osmolar Gap = Measured Osmolality - ${calculatedOsmolality.toFixed(1)} mOsm/kg</strong>
                    </div>
                    <div class="gap-interpretation-guide">
                        <div class="gap-normal">• Normal gap: &lt; 10 mOsm/kg</div>
                        <div class="gap-elevated">• Elevated gap: &gt; 10 mOsm/kg (suggests unmeasured osmoles)</div>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('osmolality-result').style.display = 'block';
    }
};
