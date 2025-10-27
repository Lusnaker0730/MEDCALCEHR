import { getMostRecentObservation } from '../../utils.js';

export const abgAnalyzer = {
    id: 'abg-analyzer',
    title: 'Arterial Blood Gas (ABG) Analyzer',
    description: 'Interprets ABG.',
    generateHTML: function () {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <div class="instructions-box dark-blue">
                <strong>INSTRUCTIONS</strong>
                <p>This analyzer should not substitute for clinical context. Sodium and chloride are required for anion gap calculation.</p>
            </div>
            <div class="form-container modern">
                <div class="input-row"><label for="abg-ph">pH</label><input type="number" id="abg-ph" step="0.01"></div>
                <div class="input-row"><label for="abg-pco2">PCO₂</label><div class="input-with-unit"><input type="number" id="abg-pco2"><span>mm Hg</span></div></div>
                <div class="input-row"><label for="abg-hco3">HCO₃⁻</label><div class="input-with-unit"><input type="number" id="abg-hco3"><span>mEq/L</span></div></div>
                <div class="input-row"><label for="abg-sodium">Sodium</label><div class="input-with-unit"><input type="number" id="abg-sodium"><span>mEq/L</span></div></div>
                <div class="input-row"><label for="abg-chloride">Chloride</label><div class="input-with-unit"><input type="number" id="abg-chloride"><span>mEq/L</span></div></div>
                <div class="input-row">
                    <label for="abg-albumin">Albumin<span>NOTE: Normal albumin levels are typically 4 g/dL in US units and 40 g/L in SI units.</span></label>
                    <div class="input-with-unit"><input type="number" id="abg-albumin"><span>g/L</span></div>
                </div>
                <div class="input-row ariscat-form">
                    <div class="input-label">If respiratory process present, chronicity</div>
                    <div class="segmented-control">
                        <label><input type="radio" name="chronicity" value="acute" checked> Acute</label>
                        <label><input type="radio" name="chronicity" value="chronic"> Chronic</label>
                    </div>
                </div>
            </div>
            <div id="abg-result" class="result-box ttkg-result" style="display:block;">
                <div class="result-value">Please fill out required fields.</div>
            </div>
            <div class="references">
                <h4>Reference</h4>
                <p>Baillie, J K. (2008). Simple, easily memorised “rules of thumb” for the rapid assessment of physiological compensation for respiratory acid-base disorders. <em>Thorax</em>, 63(3), 289-290.</p>
                <img src="js/calculators/abg-analyzer/ABG-interpretation.avif" alt="ABG Interpretation Reference Image" />
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
        const resultValueEl = container.querySelector('#abg-result .result-value');

        const interpret = () => {
            const vals = {};
            for (const key in fields) {
                const val = parseFloat(fields[key].value);
                if (isNaN(val)) {
                    resultValueEl.textContent = 'Please fill out required fields.';
                    container.querySelector('#abg-result').className = 'result-box ttkg-result';
                    return;
                }
                vals[key] = val;
            }

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

            container.querySelector('#abg-result').className = 'result-box ttkg-result calculated';
            resultValueEl.innerHTML = interpretation.join('<br>');
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
        getMostRecentObservation(client, '2951-2').then(obs => {
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
        getMostRecentObservation(client, '1751-7').then(obs => {
            if (obs) {
                fields.albumin.value = obs.valueQuantity.value.toFixed(0);
            }
            interpret();
        }); // Albumin g/L

        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', () => {
                if (input.type === 'radio') {
                    const group = input.closest('.segmented-control');
                    group
                        .querySelectorAll('label')
                        .forEach(label => label.classList.remove('selected'));
                    input.parentElement.classList.add('selected');
                }
                interpret();
            });
        });
    }
};
