import { getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';

export const abgAnalyzer = {
    id: 'abg-analyzer',
    title: 'Arterial Blood Gas (ABG) Analyzer',
    description: 'Interprets ABG.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>

            <div class="alert warning">
                <strong>?†Ô? Important</strong>
                <p>This analyzer should not substitute for clinical context. Sodium and chloride are required for anion gap calculation.</p>
            </div>

            <div class="section">
                <div class="section-title">pH</div>
                <input type="number" id="abg-ph" step="0.01" placeholder="e.g., 7.3">
            </div>

            <div class="section">
                <div class="section-title">PCO??/div>
                <div class="input-with-unit">
                    <input type="number" id="abg-pco2" placeholder="e.g., 46">
                    <span>mm Hg</span>
                </div>
            </div>

            <div class="section">
                <div class="section-title">HCO?É‚Åª</div>
                <div class="input-with-unit">
                    <input type="number" id="abg-hco3" placeholder="e.g., 26">
                    <span>mEq/L</span>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Sodium</div>
                <div class="input-with-unit">
                    <input type="number" id="abg-sodium" placeholder="e.g., 145">
                    <span>mEq/L</span>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Chloride</div>
                <div class="input-with-unit">
                    <input type="number" id="abg-chloride" placeholder="e.g., 145">
                    <span>mEq/L</span>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Albumin</div>
                <div class="input-with-unit">
                    <input type="number" id="abg-albumin" placeholder="e.g., 5">
                    <span>g/L</span>
                </div>
                <small class="help-text">NOTE: Normal albumin levels are typically 4 g/dL in US units and 40 g/L in SI units.</small>
            </div>

            <div class="section">
                <div class="section-title">If respiratory process present, chronicity</div>
                <div class="radio-group">
                    <label class="radio-option selected">
                        <input type="radio" name="chronicity" value="acute" checked>
                        <span class="radio-label">Acute</span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="chronicity" value="chronic">
                        <span class="radio-label">Chronic</span>
                    </label>
                </div>
            </div>

            <div id="abg-result" class="result-container">
                <div class="result-header">ABG Analysis</div>
                <div id="abg-primary-disorder" style="font-size: 3rem; font-weight: bold; color: #667eea; margin: 30px 0; text-align: center; line-height: 1.3;">
                    Please fill out required fields.
                </div>
                <div id="abg-details" style="font-size: 1.3rem; line-height: 1.8; color: #2d3748; margin-top: 20px;"></div>
            </div>

            <div class="chart-container">
                <img src="js/calculators/abg-analyzer/ABG-interpretation.avif" alt="ABG Interpretation Reference Image" class="reference-image" />
            </div>

            <div class="info-section">
                <h4>?? Reference</h4>
                <p>Baillie, J K. (2008). Simple, easily memorised "rules of thumb" for the rapid assessment of physiological compensation for respiratory acid-base disorders. <em>Thorax</em>, 63(3), 289-290.</p>
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        const fields = {
            ph: container.querySelector('#abg-ph'),
            pco2: container.querySelector('#abg-pco2'),
            hco3: container.querySelector('#abg-hco3'),
            sodium: container.querySelector('#abg-sodium'),
            chloride: container.querySelector('#abg-chloride'),
            albumin: container.querySelector('#abg-albumin')
        };
        const primaryDisorderEl = container.querySelector('#abg-primary-disorder');
        const detailsEl = container.querySelector('#abg-details');
        const resultContainer = container.querySelector('#abg-result');

        const interpret = () => {
            const vals = {};
            for (const key in fields) {
                const val = parseFloat(fields[key].value);
                if (isNaN(val)) {
                    primaryDisorderEl.textContent = 'Please fill out required fields.';
                    detailsEl.innerHTML = '';
                    resultContainer.classList.remove('show');
                    return;
                }
                vals[key] = val;
            }

            resultContainer.classList.add('show');

            let primaryDisorder = '';
            let compensation = '';
            const interpretation = [];

            // Step 1: Determine primary disorder
            if (vals.ph < 7.35) {
                // Acidosis
                if (vals.pco2 > 45) {
                    primaryDisorder = 'Respiratory Acidosis';
                } else if (vals.hco3 < 22) {
                    primaryDisorder = 'Metabolic Acidosis';
                } else {
                    primaryDisorder = 'Mixed Acidosis';
                }
            } else if (vals.ph > 7.45) {
                // Alkalosis
                if (vals.pco2 < 35) {
                    primaryDisorder = 'Respiratory Alkalosis';
                } else if (vals.hco3 > 26) {
                    primaryDisorder = 'Metabolic Alkalosis';
                } else {
                    primaryDisorder = 'Mixed Alkalosis';
                }
            } else {
                // pH is normal
                if (vals.pco2 > 45 && vals.hco3 > 26) {
                    interpretation.push(
                        'pH is normal, consider underlying Metabolic Alkalosis and Respiratory Acidosis.'
                    );
                } else if (vals.pco2 < 35 && vals.hco3 < 22) {
                    interpretation.push(
                        'pH is normal, consider underlying Metabolic Acidosis and Respiratory Alkalosis.'
                    );
                } else {
                    interpretation.push('Normal acid-base status.');
                }
            }

            if (primaryDisorder) {
                interpretation.push(`<strong>Primary ${primaryDisorder}</strong>`);
            }

            // Step 2: Anion Gap for Metabolic Acidosis
            if (primaryDisorder.includes('Metabolic Acidosis')) {
                const anionGap = vals.sodium - (vals.chloride + vals.hco3);
                // Albumin is in g/L. Normal is ~40g/L. Standard formula uses g/dL (normal ~4.0).
                // Corrected AG = AG + 2.5 * (Normal Albumin - Observed Albumin in g/dL)
                const albumin_g_dL = vals.albumin / 10;
                const correctedAG = anionGap + 2.5 * (4.0 - albumin_g_dL);

                if (correctedAG > 12) {
                    interpretation[0] =
                        '<strong>This is a High-Anion Gap Metabolic Acidosis.</strong>';
                    const deltaDelta = correctedAG - 12 + vals.hco3;
                    if (deltaDelta > 28) {
                        interpretation.push(
                            'with an underlying Metabolic Alkalosis (Delta-Delta > 28).'
                        );
                    }
                    if (deltaDelta < 22) {
                        interpretation.push(
                            'with an underlying Non-Gap Metabolic Acidosis (Delta-Delta < 22).'
                        );
                    }
                } else {
                    interpretation[0] = '<strong>This is a Non-Gap Metabolic Acidosis.</strong>';
                }
            }

            // Step 3: Compensation
            if (primaryDisorder === 'Metabolic Acidosis') {
                const expectedPCO2 = 1.5 * vals.hco3 + 8; // Winter's Formula
                if (Math.abs(vals.pco2 - expectedPCO2) <= 2) {
                    compensation = 'Appropriately Compensated by Respiratory Alkalosis.';
                } else {
                    compensation = 'with Inappropriate Respiratory Compensation.';
                }
            } else if (primaryDisorder === 'Metabolic Alkalosis') {
                const expectedPCO2 = 0.7 * vals.hco3 + 21;
                if (Math.abs(vals.pco2 - expectedPCO2) <= 5) {
                    compensation = 'Appropriately Compensated by Respiratory Acidosis.';
                } else {
                    compensation = 'with Inappropriate Respiratory Compensation.';
                }
            } else if (primaryDisorder === 'Respiratory Acidosis') {
                const chronicity = container.querySelector(
                    'input[name="chronicity"]:checked'
                ).value;
                const deltaPCO2 = (vals.pco2 - 40) / 10;
                let expectedHCO3;
                if (chronicity === 'acute') {
                    expectedHCO3 = 24 + 1 * deltaPCO2;
                } else {
                    // chronic
                    expectedHCO3 = 24 + 4 * deltaPCO2;
                }
                if (Math.abs(vals.hco3 - expectedHCO3) <= 2) {
                    compensation = 'Appropriately Compensated by Metabolic Alkalosis.';
                } else {
                    compensation = 'with Inappropriate Metabolic Compensation.';
                }
            } else if (primaryDisorder === 'Respiratory Alkalosis') {
                const chronicity = container.querySelector(
                    'input[name="chronicity"]:checked'
                ).value;
                const deltaPCO2 = (40 - vals.pco2) / 10;
                let expectedHCO3;
                if (chronicity === 'acute') {
                    expectedHCO3 = 24 - 2 * deltaPCO2;
                } else {
                    // chronic
                    expectedHCO3 = 24 - 5 * deltaPCO2;
                }
                if (Math.abs(vals.hco3 - expectedHCO3) <= 2) {
                    compensation = 'Appropriately Compensated by Metabolic Acidosis.';
                } else {
                    compensation = 'with Inappropriate Metabolic Compensation.';
                }
            }

            if (compensation) {
                interpretation.push(compensation);
            }

            // Display primary disorder prominently
            if (primaryDisorder) {
                primaryDisorderEl.innerHTML = `<strong>${primaryDisorder}</strong>`;
            } else if (interpretation.length > 0 && interpretation[0].includes('Normal')) {
                primaryDisorderEl.textContent = 'Normal Acid-Base Status';
            } else {
                primaryDisorderEl.innerHTML = interpretation[0] || 'Unknown';
            }

            // Display details (compensation and additional info)
            const details = interpretation.slice(1);
            if (details.length > 0) {
                detailsEl.innerHTML = details
                    .map(item => `<p style="margin: 10px 0;">${item}</p>`)
                    .join('');
            } else {
                detailsEl.innerHTML = '';
            }
        };

        // Auto-populate data
        getMostRecentObservation(client, '11558-4').then(obs => {
            if (obs) {
                fields.ph.value = obs.valueQuantity.value.toFixed(2);
            }
            interpret();
        }); // pH
        getMostRecentObservation(client, '11557-6').then(obs => {
            if (obs) {
                fields.pco2.value = obs.valueQuantity.value.toFixed(0);
            }
            interpret();
        }); // PCO2
        getMostRecentObservation(client, '14627-4').then(obs => {
            if (obs) {
                fields.hco3.value = obs.valueQuantity.value.toFixed(0);
            }
            interpret();
        }); // HCO3
        getMostRecentObservation(client, LOINC_CODES.SODIUM).then(obs => {
            if (obs) {
                fields.sodium.value = obs.valueQuantity.value.toFixed(0);
            }
            interpret();
        }); // Sodium
        getMostRecentObservation(client, '2075-0').then(obs => {
            if (obs) {
                fields.chloride.value = obs.valueQuantity.value.toFixed(0);
            }
            interpret();
        }); // Chloride
        getMostRecentObservation(client, LOINC_CODES.ALBUMIN).then(obs => {
            if (obs) {
                fields.albumin.value = obs.valueQuantity.value.toFixed(0);
            }
            interpret();
        }); // Albumin g/L

        // Add event listeners for radio buttons
        container.querySelectorAll('.radio-option input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', () => {
                // Add visual feedback
                const parent = radio.closest('.radio-option');
                const siblings = parent.parentElement.querySelectorAll('.radio-option');
                siblings.forEach(s => s.classList.remove('selected'));
                parent.classList.add('selected');

                interpret();
            });
        });

        // Add event listeners for text inputs
        container.querySelectorAll('input[type="number"]').forEach(input => {
            input.addEventListener('input', interpret);
        });
    }
};
