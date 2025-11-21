// js/calculators/sodium-correction.js
import {
    getMostRecentObservation,
    createUnitSelector,
    initializeUnitConversion,
    getValueInStandardUnit
} from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';

export const sodiumCorrection = {
    id: 'sodium-correction',
    title: 'Sodium Correction for Hyperglycemia',
    description: 'Calculates the actual sodium level in patients with hyperglycemia.',
    generateHTML: function () {
        return `
            <h3>${this.title}</h3>
            <p>Calculates the actual sodium level in patients with hyperglycemia.</p>
            <div class="input-group">
                <label for="measured-sodium">Measured Sodium (mEq/L):</label>
                <input type="number" id="measured-sodium" placeholder="loading...">
            </div>
            <div class="input-group">
                <label for="glucose">Glucose:</label>
                ${createUnitSelector('glucose', 'glucose', ['mg/dL', 'mmol/L'], 'mg/dL')}
            </div>
            <div id="sodium-correction-result" class="result" style="display:none;"></div>
            
            <div class="formula-section">
                <h4>?? Formula</h4>
                <div class="formula-box">
                    <div class="formula-title">Corrected Sodium (mEq/L) =</div>
                    <div class="formula-equation">
                        <span class="formula-main">Measured Na??+ [Correction Factor ? (Glucose - 100) / 100]</span>
                    </div>
                </div>
                
                <div class="formula-explanation">
                    <h5>?? Formula Components</h5>
                    <ul>
                        <li><strong>Measured Na??</strong> Laboratory-measured serum sodium (mEq/L)</li>
                        <li><strong>Glucose:</strong> Serum glucose concentration (mg/dL)</li>
                        <li><strong>Correction Factor:</strong>
                            <ul style="margin-top: 8px; padding-left: 20px;">
                                <li>1.6 mEq/L per 100 mg/dL glucose (Hillier formula - most common)</li>
                                <li>2.4 mEq/L per 100 mg/dL glucose (for glucose > 400 mg/dL)</li>
                            </ul>
                        </li>
                        <li><strong>100:</strong> Reference glucose level (mg/dL)</li>
                        <li><strong>Purpose:</strong> Corrects for the osmotic effect of hyperglycemia on sodium concentration</li>
                    </ul>
                </div>
                
                <div class="normal-values">
                    <h5>?? Normal Values & Correction Factors</h5>
                    <div class="values-grid">
                        <div class="value-item normal-range">
                            <strong>Normal Sodium:</strong><br>136-145 mEq/L
                        </div>
                        <div class="value-item normal-glucose">
                            <strong>Normal Glucose:</strong><br>70-100 mg/dL
                        </div>
                        <div class="value-item correction-factor">
                            <strong>Correction Factor:</strong><br>1.6 (standard)<br>2.4 (severe hyperglycemia)
                        </div>
                    </div>
                </div>
                
                <div class="correction-scenarios">
                    <h5>?? Correction Factor Selection</h5>
                    <div class="scenarios-grid">
                        <div class="scenario-category">
                            <h6>Standard Correction (1.6 mEq/L)</h6>
                            <ul>
                                <li>Glucose ??400 mg/dL</li>
                                <li>Most commonly used</li>
                                <li>Based on Hillier et al. study</li>
                                <li>Widely accepted in clinical practice</li>
                            </ul>
                        </div>
                        <div class="scenario-category">
                            <h6>Higher Correction (2.4 mEq/L)</h6>
                            <ul>
                                <li>Glucose > 400 mg/dL</li>
                                <li>Severe hyperglycemia</li>
                                <li>Alternative correction factor</li>
                                <li>May be more accurate in extreme cases</li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div class="physiological-basis">
                    <h5>?зм Physiological Basis</h5>
                    <div class="physiology-grid">
                        <div class="physiology-item">
                            <h6>Osmotic Effect</h6>
                            <p>Hyperglycemia increases plasma osmolality, causing water to shift from intracellular to extracellular space, diluting sodium concentration.</p>
                        </div>
                        <div class="physiology-item">
                            <h6>Pseudohyponatremia</h6>
                            <p>The measured sodium appears low due to dilution, but the corrected value represents what sodium would be at normal glucose levels.</p>
                        </div>
                        <div class="physiology-item">
                            <h6>Clinical Significance</h6>
                            <p>Helps distinguish true hyponatremia from glucose-induced dilutional hyponatremia, guiding appropriate treatment decisions.</p>
                        </div>
                    </div>
                </div>
                
                <div class="alternative-formulas">
                    <h5>?? Alternative Formulas</h5>
                    <div class="alt-formulas-grid">
                        <div class="alt-formula-item">
                            <h6>Hillier Formula (Standard)</h6>
                            <div class="alt-equation">Na??+ 1.6 ? [(Glucose - 100) / 100]</div>
                            <p>Most widely used correction formula</p>
                        </div>
                        <div class="alt-formula-item">
                            <h6>Katz Formula</h6>
                            <div class="alt-equation">Na??+ 2.4 ? [(Glucose - 100) / 100]</div>
                            <p>Alternative with higher correction factor</p>
                        </div>
                        <div class="alt-formula-item">
                            <h6>Simplified</h6>
                            <div class="alt-equation">Na??+ 1.6 ? (Glucose / 100 - 1)</div>
                            <p>Mathematically equivalent to Hillier formula</p>
                        </div>
                    </div>
                </div>
                
                <div class="clinical-note">
                    <h5>?ая? Clinical Notes</h5>
                    <ul>
                        <li><strong>Timing:</strong> Correction should be calculated using simultaneous sodium and glucose measurements</li>
                        <li><strong>Treatment implications:</strong> Corrected sodium helps determine if sodium replacement is needed</li>
                        <li><strong>DKA management:</strong> Essential for proper fluid and electrolyte management in diabetic ketoacidosis</li>
                        <li><strong>Limitations:</strong> Formula may be less accurate in severe hyperglycemia (>1000 mg/dL)</li>
                        <li><strong>Other causes:</strong> Consider other causes of hyponatremia if corrected sodium remains low</li>
                        <li><strong>Monitoring:</strong> Recheck sodium as glucose levels normalize during treatment</li>
                    </ul>
                </div>
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        const sodiumInput = container.querySelector('#measured-sodium');
        const resultEl = container.querySelector('#sodium-correction-result');

        const calculateAndUpdate = () => {
            const measuredSodium = parseFloat(sodiumInput.value);
            const glucoseMgDl = getValueInStandardUnit(container, 'glucose', 'mg/dL');

            if (measuredSodium > 0 && glucoseMgDl > 0) {
                // Using the Hillier formula (correction factor of 1.6)
                const correctionFactor = 1.6;
                let note = '';
                let noteClass = '';

                if (glucoseMgDl > 400) {
                    note =
                        '?ая? For glucose > 400 mg/dL, consider using correction factor of 2.4 mEq/L';
                    noteClass = 'warning-note';
                }

                const correctedSodium =
                    measuredSodium + correctionFactor * ((glucoseMgDl - 100) / 100);
                const glucoseMmol = glucoseMgDl * 0.0555;

                // Determine sodium status
                let status = '';
                let statusColor = '';
                if (correctedSodium < 136) {
                    status = 'Low (Hyponatremia)';
                    statusColor = '#2196f3';
                } else if (correctedSodium > 145) {
                    status = 'High (Hypernatremia)';
                    statusColor = '#ff5722';
                } else {
                    status = 'Normal';
                    statusColor = '#4caf50';
                }

                resultEl.innerHTML = `
                    <div style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; margin-bottom: 15px;">
                        <div style="font-size: 1.1em; margin-bottom: 8px;">Corrected Sodium:</div>
                        <div style="font-size: 2.2em; font-weight: bold;">${correctedSodium.toFixed(1)} mEq/L</div>
                        <div style="margin-top: 10px; padding: 8px; background: ${statusColor}; border-radius: 5px; font-size: 0.95em;">
                            ${status}
                        </div>
                    </div>
                    <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                        <h4 style="margin: 0 0 10px 0; font-size: 1em;">Calculation Details:</h4>
                        <div style="font-size: 0.9em; line-height: 1.6;">
                            <div><strong>Measured Sodium:</strong> ${measuredSodium} mEq/L</div>
                            <div><strong>Glucose:</strong> ${glucoseMgDl.toFixed(0)} mg/dL (${glucoseMmol.toFixed(1)} mmol/L)</div>
                            <div><strong>Correction Factor:</strong> ${correctionFactor} mEq/L</div>
                            <div><strong>Correction:</strong> +${(correctionFactor * ((glucoseMgDl - 100) / 100)).toFixed(1)} mEq/L</div>
                        </div>
                    </div>
                    ${note ? `<div style="background: #fff3cd; padding: 12px; border-radius: 6px; border-left: 4px solid #ffc107; font-size: 0.9em;">${note}</div>` : ''}
                    <div style="margin-top: 10px; font-size: 0.85em; color: #666;">
                        Normal sodium: 136-145 mEq/L
                    </div>
                `;
                resultEl.style.display = 'block';
            } else {
                resultEl.style.display = 'none';
            }
        };

        // Initialize unit conversion
        initializeUnitConversion(container, 'glucose', calculateAndUpdate);

        // Auto-populate from FHIR data
        const sodiumPromise = getMostRecentObservation(client, LOINC_CODES.SODIUM);
        const glucosePromise = getMostRecentObservation(client, LOINC_CODES.GLUCOSE);

        Promise.all([sodiumPromise, glucosePromise]).then(([sodiumObs, glucoseObs]) => {
            if (sodiumObs && sodiumObs.valueQuantity) {
                sodiumInput.value = sodiumObs.valueQuantity.value.toFixed(0);
            } else {
                sodiumInput.placeholder = 'e.g., 135';
            }

            if (glucoseObs && glucoseObs.valueQuantity) {
                const glucoseInput = container.querySelector('#glucose');
                if (glucoseInput) {
                    glucoseInput.value = glucoseObs.valueQuantity.value.toFixed(0);
                }
            }

            calculateAndUpdate();
        });

        // Add event listener for sodium input
        sodiumInput.addEventListener('input', calculateAndUpdate);

        // Initial calculation
        calculateAndUpdate();
    }
};
