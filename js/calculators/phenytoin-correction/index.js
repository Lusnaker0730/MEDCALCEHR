import { getMostRecentObservation } from '../../utils.js';

export const phenytoinCorrection = {
    id: 'phenytoin-correction',
    title: 'Phenytoin (Dilantin) Correction for Albumin/Renal Failure',
    description: 'Corrects serum phenytoin level for renal failure and/or hypoalbuminemia.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <div class="input-group">
                <label>Total Phenytoin Level (mcg/mL)</label>
                <input type="number" id="pheny-total" step="0.1">
            </div>
            <div class="input-group">
                <label>Albumin (g/dL)</label>
                <input type="number" id="pheny-albumin" step="0.1">
            </div>
            <div class="input-group">
                <label>Patient has Renal Failure (CrCl < 10 mL/min)?</label>
                <select id="pheny-renal">
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                </select>
            </div>
            <button id="calculate-phenytoin">Calculate Corrected Level</button>
            <div id="phenytoin-result" class="result" style="display:none;"></div>
            
            <div class="formula-section">
                <h4>📐 Formula</h4>
                <div class="formula-box">
                    <div class="formula-title">Corrected Phenytoin Level (mcg/mL) =</div>
                    <div class="formula-equation">
                        <span class="formula-main">Total Phenytoin / [((1-K) × Albumin/4.4) + K]</span>
                    </div>
                </div>
                
                <div class="formula-explanation">
                    <h5>📋 Formula Components</h5>
                    <ul>
                        <li><strong>Total Phenytoin:</strong> Measured serum phenytoin level (mcg/mL)</li>
                        <li><strong>Albumin:</strong> Serum albumin level (g/dL)</li>
                        <li><strong>K (Correction Factor):</strong>
                            <ul style="margin-top: 8px; padding-left: 20px;">
                                <li>K = 0.1 (Normal renal function)</li>
                                <li>K = 0.2 (Renal failure, CrCl < 10 mL/min)</li>
                            </ul>
                        </li>
                        <li><strong>4.4:</strong> Normal albumin reference value (g/dL)</li>
                    </ul>
                </div>
                
                <div class="normal-values">
                    <h5>📊 Therapeutic Ranges</h5>
                    <div class="values-grid">
                        <div class="value-item therapeutic-range">
                            <strong>Therapeutic Range:</strong><br>10-20 mcg/mL
                        </div>
                        <div class="value-item toxic-range">
                            <strong>Toxic Level:</strong><br>>20 mcg/mL
                        </div>
                        <div class="value-item subtherapeutic-range">
                            <strong>Subtherapeutic:</strong><br><10 mcg/mL
                        </div>
                    </div>
                </div>
                
                <div class="clinical-scenarios">
                    <h5>🔍 Clinical Scenarios</h5>
                    <div class="scenarios-grid">
                        <div class="scenario-category">
                            <h6>Normal Renal Function (K = 0.1)</h6>
                            <ul>
                                <li>CrCl ≥ 10 mL/min</li>
                                <li>Normal kidney function</li>
                                <li>Standard protein binding</li>
                                <li>Use K = 0.1 in formula</li>
                            </ul>
                        </div>
                        <div class="scenario-category">
                            <h6>Renal Failure (K = 0.2)</h6>
                            <ul>
                                <li>CrCl < 10 mL/min</li>
                                <li>End-stage renal disease</li>
                                <li>Dialysis patients</li>
                                <li>Reduced protein binding</li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div class="correction-rationale">
                    <h5>🧬 Why Correction is Needed</h5>
                    <div class="rationale-grid">
                        <div class="rationale-item">
                            <h6>Protein Binding</h6>
                            <p>Phenytoin is ~90% protein-bound to albumin. Only the free (unbound) fraction is pharmacologically active.</p>
                        </div>
                        <div class="rationale-item">
                            <h6>Hypoalbuminemia</h6>
                            <p>Low albumin increases free phenytoin fraction, making total levels misleading. Correction estimates the equivalent level at normal albumin.</p>
                        </div>
                        <div class="rationale-item">
                            <h6>Renal Failure</h6>
                            <p>Uremic toxins compete for protein binding sites, further increasing free phenytoin fraction.</p>
                        </div>
                    </div>
                </div>
                
                <div class="clinical-note">
                    <h5>⚠️ Clinical Notes</h5>
                    <ul>
                        <li><strong>Free phenytoin levels:</strong> Direct measurement of free phenytoin (therapeutic range: 1-2 mcg/mL) is preferred when available</li>
                        <li><strong>Pregnancy:</strong> Protein binding changes during pregnancy; consider free levels</li>
                        <li><strong>Critical illness:</strong> Hypoalbuminemia is common; correction is especially important</li>
                        <li><strong>Drug interactions:</strong> Some drugs can displace phenytoin from protein binding sites</li>
                        <li><strong>Limitations:</strong> Formula is an approximation; clinical correlation is essential</li>
                    </ul>
                </div>
            </div>
        `;
    },
    initialize: function(client, patient, container) {
        const totalEl = container.querySelector('#pheny-total');
        const albuminEl = container.querySelector('#pheny-albumin');
        const renalEl = container.querySelector('#pheny-renal');

        getMostRecentObservation(client, '4038-8').then(obs => { // Phenytoin
            if (obs && obs.valueQuantity) totalEl.value = obs.valueQuantity.value.toFixed(1);
        });
        getMostRecentObservation(client, '1751-7').then(obs => { // Albumin
            if (obs && obs.valueQuantity) albuminEl.value = obs.valueQuantity.value.toFixed(1);
        });

        container.querySelector('#calculate-phenytoin').addEventListener('click', () => {
            const totalPhenytoin = parseFloat(totalEl.value);
            const albumin = parseFloat(albuminEl.value);
            const hasRenalFailure = renalEl.value === 'yes';

            if (isNaN(totalPhenytoin) || isNaN(albumin)) {
                alert('Please enter all values.');
                return;
            }

            const K = hasRenalFailure ? 0.2 : 0.1;
            const correctedPhenytoin = totalPhenytoin / (( (1-K) * albumin / 4.4) + K);

            container.querySelector('#phenytoin-result').innerHTML = `
                <p>Corrected Phenytoin Level: ${correctedPhenytoin.toFixed(1)} mcg/mL</p>
                <p>Therapeutic range is typically 10-20 mcg/mL.</p>
            `;
            container.querySelector('#phenytoin-result').style.display = 'block';
        });
    }
};
