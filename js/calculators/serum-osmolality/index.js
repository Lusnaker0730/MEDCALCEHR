import {
    getMostRecentObservation,
    createUnitSelector,
    initializeUnitConversion,
    getValueInStandardUnit
} from '../../utils.js';

export const serumOsmolality = {
    id: 'serum-osmolality',
    title: 'Serum Osmolality/Osmolarity',
    description:
        'Calculates expected serum osmolarity, for comparison to measured osmolality to detect unmeasured compounds in the serum.',
    generateHTML: function () {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <div class="input-group">
                <label for="osmo-na">Sodium (Na⁺) (mEq/L)</label>
                <input type="number" id="osmo-na">
            </div>
            <div class="input-group">
                <label for="osmo-glucose">Glucose:</label>
                ${createUnitSelector('osmo-glucose', 'glucose', ['mg/dL', 'mmol/L'], 'mg/dL')}
            </div>
            <div class="input-group">
                <label for="osmo-bun">BUN:</label>
                ${createUnitSelector('osmo-bun', 'bun', ['mg/dL', 'mmol/L'], 'mg/dL')}
            </div>
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
    initialize: function (client, patient, container) {
        const naInput = container.querySelector('#osmo-na');
        const resultEl = container.querySelector('#osmolality-result');

        const calculateAndUpdate = () => {
            const na = parseFloat(naInput.value);
            const glucoseMgDl = getValueInStandardUnit(container, 'osmo-glucose', 'mg/dL');
            const bunMgDl = getValueInStandardUnit(container, 'osmo-bun', 'mg/dL');

            if (isNaN(na) || !glucoseMgDl || !bunMgDl) {
                resultEl.style.display = 'none';
                return;
            }

            const calculatedOsmolality = 2 * na + glucoseMgDl / 18 + bunMgDl / 2.8;

            // Determine interpretation
            let interpretation = '';
            let interpretationColor = '';

            if (calculatedOsmolality < 275) {
                interpretation = 'Below normal range';
                interpretationColor = '#2196f3';
            } else if (calculatedOsmolality > 295) {
                interpretation = 'Above normal range';
                interpretationColor = '#ff5722';
            } else {
                interpretation = 'Within normal range';
                interpretationColor = '#4caf50';
            }

            const glucoseMmol = glucoseMgDl * 0.0555;
            const bunMmol = bunMgDl * 0.357;

            resultEl.innerHTML = `
                <div style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; margin-bottom: 15px;">
                    <div style="font-size: 1.1em; margin-bottom: 8px;">Calculated Serum Osmolality:</div>
                    <div style="font-size: 2.2em; font-weight: bold;">${calculatedOsmolality.toFixed(1)} mOsm/kg</div>
                    <div style="margin-top: 10px; padding: 8px; background: ${interpretationColor}; border-radius: 5px; font-size: 0.95em;">
                        ${interpretation}
                    </div>
                </div>
                
                <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                    <h4 style="margin: 0 0 10px 0; font-size: 1em;">📊 Calculation Breakdown</h4>
                    <div style="font-size: 0.9em; line-height: 1.8;">
                        <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                            <span><strong>2 × Sodium:</strong></span>
                            <span>2 × ${na} = ${(2 * na).toFixed(1)} mOsm/kg</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                            <span><strong>Glucose/18:</strong></span>
                            <span>${glucoseMgDl.toFixed(0)}/18 = ${(glucoseMgDl / 18).toFixed(1)} mOsm/kg</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 5px 0;">
                            <span><strong>BUN/2.8:</strong></span>
                            <span>${bunMgDl.toFixed(0)}/2.8 = ${(bunMgDl / 2.8).toFixed(1)} mOsm/kg</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 10px 0; border-top: 2px solid #ddd; margin-top: 5px; font-weight: bold;">
                            <span>Total:</span>
                            <span>${calculatedOsmolality.toFixed(1)} mOsm/kg</span>
                        </div>
                    </div>
                </div>
                
                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                    <h4 style="margin: 0 0 10px 0; font-size: 1em;">🔍 Osmolar Gap Assessment</h4>
                    <p style="font-size: 0.9em; margin-bottom: 10px;">To calculate osmolar gap, compare this calculated value with the measured serum osmolality:</p>
                    <div style="background: white; padding: 10px; border-radius: 5px; font-weight: bold; text-align: center; margin: 10px 0;">
                        Osmolar Gap = Measured Osmolality - ${calculatedOsmolality.toFixed(1)} mOsm/kg
                    </div>
                    <div style="font-size: 0.85em;">
                        <div style="padding: 5px 0;">✓ <strong>Normal gap:</strong> &lt; 10 mOsm/kg</div>
                        <div style="padding: 5px 0;">⚠️ <strong>Elevated gap:</strong> &gt; 10 mOsm/kg (suggests unmeasured osmoles)</div>
                    </div>
                </div>
                
                <div style="font-size: 0.85em; color: #666; margin-top: 10px;">
                    Normal osmolality: 275-295 mOsm/kg
                </div>
            `;
            resultEl.style.display = 'block';
        };

        // Initialize unit conversions
        initializeUnitConversion(container, 'osmo-glucose', calculateAndUpdate);
        initializeUnitConversion(container, 'osmo-bun', calculateAndUpdate);

        // Auto-populate Sodium
        getMostRecentObservation(client, '2951-2')
            .then(obs => {
                if (obs && obs.valueQuantity) {
                    naInput.value = obs.valueQuantity.value.toFixed(0);
                }
                calculateAndUpdate();
            })
            .catch(error => {
                console.error('Error fetching sodium:', error);
            });

        // Auto-populate Glucose
        getMostRecentObservation(client, '2345-7')
            .then(obs => {
                if (obs && obs.valueQuantity) {
                    const glucoseInput = container.querySelector('#osmo-glucose');
                    if (glucoseInput) {
                        glucoseInput.value = obs.valueQuantity.value.toFixed(0);
                    }
                }
                calculateAndUpdate();
            })
            .catch(error => {
                console.error('Error fetching glucose:', error);
            });

        // Auto-populate BUN
        getMostRecentObservation(client, '3094-0')
            .then(obs => {
                if (obs && obs.valueQuantity) {
                    const bunInput = container.querySelector('#osmo-bun');
                    if (bunInput) {
                        bunInput.value = obs.valueQuantity.value.toFixed(0);
                    }
                }
                calculateAndUpdate();
            })
            .catch(error => {
                console.error('Error fetching BUN:', error);
            });

        // Add event listener for sodium input
        naInput.addEventListener('input', calculateAndUpdate);

        // Initial calculation
        calculateAndUpdate();
    }
};
