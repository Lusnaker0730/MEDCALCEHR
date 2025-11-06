import { getMostRecentObservation } from '../../utils.js';

export const ethanolConcentration = {
    id: 'ethanol-concentration',
    title: 'Estimated Ethanol (and Toxic Alcohol) Serum Concentration Based on Ingestion',
    description: 'Predicts ethanol concentration based on ingestion of alcohol.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>

            <div class="section">
                <div class="section-title">Amount Ingested</div>
                <div class="input-with-unit">
                    <input type="number" id="eth-amount" value="1.5" step="0.1">
                    <span>ounces</span>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Alcohol by Volume</div>
                <div class="input-with-unit">
                    <input type="number" id="eth-abv" value="40" step="1">
                    <span>%</span>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Patient Weight</div>
                <div class="input-with-unit">
                    <input type="number" id="eth-weight" placeholder="70" step="0.1">
                    <span>kg</span>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Gender</div>
                <div class="radio-group">
                    <label class="radio-option"><input type="radio" name="eth-gender" value="male" checked><span class="radio-label">Male (Vd = 0.68 L/kg)</span></label>
                    <label class="radio-option"><input type="radio" name="eth-gender" value="female"><span class="radio-label">Female (Vd = 0.55 L/kg)</span></label>
                </div>
            </div>

            <div id="ethanol-result" class="result-container"></div>

            <div class="formula-section">
                <h4>🧮 Calculation Formula</h4>
                
                <div class="formula-steps">
                    <div class="formula-step">
                        <h5>Step 1: Calculate Volume of Alcohol</h5>
                        <div class="formula-box">
                            <strong>Volume (mL)</strong> = Amount (oz) × 29.57 mL/oz
                        </div>
                        <p class="formula-note">Convert ounces to milliliters (1 oz = 29.57 mL)</p>
                    </div>

                    <div class="formula-step">
                        <h5>Step 2: Calculate Grams of Pure Alcohol</h5>
                        <div class="formula-box">
                            <strong>Grams of Alcohol</strong> = Volume (mL) × (ABV% / 100) × 0.789 g/mL
                        </div>
                        <p class="formula-note">
                            • ABV% = Alcohol by Volume percentage<br>
                            • 0.789 g/mL = density of ethanol
                        </p>
                    </div>

                    <div class="formula-step">
                        <h5>Step 3: Calculate Serum Concentration</h5>
                        <div class="formula-box">
                            <strong>Concentration (mg/dL)</strong> = (Grams × 1000 mg/g) / (Weight (kg) × Vd × 10 dL/L)
                        </div>
                        <p class="formula-note">
                            <strong>Volume of Distribution (Vd):</strong><br>
                            • Male: 0.68 L/kg<br>
                            • Female: 0.55 L/kg
                        </p>
                    </div>

                    <div class="formula-step combined">
                        <h5>Combined Formula</h5>
                        <div class="formula-box highlight">
                            <strong>Peak Serum Ethanol (mg/dL)</strong> = 
                            <div class="fraction">
                                <div class="numerator">Amount (oz) × 29.57 × (ABV% / 100) × 0.789 × 1000</div>
                                <div class="denominator">Weight (kg) × Vd × 10</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="clinical-notes">
                    <h5>📋 Clinical Notes</h5>
                    <ul>
                        <li><strong>Assumptions:</strong> This calculation assumes complete absorption and no metabolism</li>
                        <li><strong>Peak concentration:</strong> Typically occurs 30-90 minutes after ingestion on empty stomach</li>
                        <li><strong>Metabolism:</strong> Average elimination rate is ~15-20 mg/dL/hour</li>
                        <li><strong>Legal limit (US):</strong> 80 mg/dL (0.08%) for driving</li>
                        <li><strong>Severe intoxication:</strong> Usually >300 mg/dL</li>
                        <li><strong>Potentially fatal:</strong> >400-500 mg/dL</li>
                    </ul>
                </div>

                <div class="common-drinks">
                    <h5>🍺 Common Alcoholic Beverages</h5>
                    <div class="drinks-grid">
                        <div class="drink-card">
                            <strong>Beer</strong>
                            <p>12 oz, 5% ABV</p>
                        </div>
                        <div class="drink-card">
                            <strong>Wine</strong>
                            <p>5 oz, 12% ABV</p>
                        </div>
                        <div class="drink-card">
                            <strong>Spirits</strong>
                            <p>1.5 oz, 40% ABV</p>
                        </div>
                        <div class="drink-card">
                            <strong>Fortified Wine</strong>
                            <p>3.5 oz, 17% ABV</p>
                        </div>
                    </div>
                    <p class="drinks-note">Each contains approximately 14 grams (0.6 oz) of pure alcohol = 1 standard drink</p>
                </div>
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        const amountEl = container.querySelector('#eth-amount');
        const abvEl = container.querySelector('#eth-abv');
        const weightEl = container.querySelector('#eth-weight');
        const resultEl = container.querySelector('#ethanol-result');

        // Set default gender based on patient
        if (patient && patient.gender) {
            const genderRadio = container.querySelector(
                `input[name="eth-gender"][value="${patient.gender}"]`
            );
            if (genderRadio) {
                genderRadio.checked = true;
                genderRadio.closest('.radio-option').classList.add('selected');
            }
        }

        // FHIR auto-populate weight
        getMostRecentObservation(client, '29463-7').then(obs => {
            if (obs && obs.valueQuantity) {
                weightEl.value = obs.valueQuantity.value.toFixed(1);
                calculate();
            }
        });

        const calculate = () => {
            const amountOz = parseFloat(amountEl.value);
            const abv = parseFloat(abvEl.value);
            const weightKg = parseFloat(weightEl.value);
            const genderEl = container.querySelector('input[name="eth-gender"]:checked');

            if (isNaN(amountOz) || isNaN(abv) || isNaN(weightKg) || !genderEl) {
                resultEl.classList.remove('show');
                return;
            }

            const gender = genderEl.value;
            const volumeDistribution = gender === 'male' ? 0.68 : 0.55; // L/kg
            const gramsAlcohol = amountOz * 29.57 * (abv / 100) * 0.789; // oz -> mL -> g
            const concentrationMgDl = (gramsAlcohol * 1000) / (weightKg * volumeDistribution * 10); // mg/dL

            let severityLevel = 'low';
            let severityText = 'Below Legal Limit';
            if (concentrationMgDl >= 400) {
                severityLevel = 'high';
                severityText = 'Potentially Fatal Level';
            } else if (concentrationMgDl >= 300) {
                severityLevel = 'high';
                severityText = 'Severe Intoxication';
            } else if (concentrationMgDl >= 80) {
                severityLevel = 'medium';
                severityText = 'Above Legal Limit (0.08%)';
            }

            resultEl.innerHTML = `
                <div class="result-header">
                    <h3>Estimated Peak Serum Ethanol Concentration</h3>
                </div>
                <div class="result-score" style="font-size: 4rem; font-weight: bold; color: #667eea;">${concentrationMgDl.toFixed(0)}</div>
                <div class="result-label">mg/dL</div>
                
                <div class="severity-indicator ${severityLevel}">${severityText}</div>
                
                <div class="alert info">
                    <strong>📊 Clinical Reference</strong>
                    <ul style="margin: 8px 0 0 20px; text-align: left;">
                        <li><strong>Legal limit (US driving):</strong> 80 mg/dL (0.08%)</li>
                        <li><strong>Severe intoxication:</strong> Usually >300 mg/dL</li>
                        <li><strong>Potentially fatal:</strong> >400-500 mg/dL</li>
                        <li><strong>Metabolism rate:</strong> ~15-20 mg/dL/hour</li>
                        <li><strong>Peak time:</strong> 30-90 min after ingestion (empty stomach)</li>
                    </ul>
                </div>
            `;
            resultEl.classList.add('show');
        };

        // Add visual feedback for radio options
        container.querySelectorAll('.radio-option').forEach(option => {
            option.addEventListener('click', () => {
                const input = option.querySelector('input[type="radio"]');
                if (input) {
                    input.checked = true;
                    const radioGroup = option.closest('.radio-group');
                    radioGroup.querySelectorAll('.radio-option').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    option.classList.add('selected');
                    calculate();
                }
            });
        });

        // Add event listeners for number inputs
        amountEl.addEventListener('input', calculate);
        abvEl.addEventListener('input', calculate);
        weightEl.addEventListener('input', calculate);

        // Initial calculation
        calculate();
    }
};
