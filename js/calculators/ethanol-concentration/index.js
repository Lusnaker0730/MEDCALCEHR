import { getMostRecentObservation } from '../../utils.js';

export const ethanolConcentration = {
    id: 'ethanol-concentration',
    title: 'Estimated Ethanol (and Toxic Alcohol) Serum Concentration Based on Ingestion',
    description: 'Predicts ethanol concentration based on ingestion of alcohol.',
    generateHTML: function () {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <div class="input-group">
                <label>Amount Ingested (ounces)</label>
                <input type="number" id="eth-amount" value="1.5">
            </div>
            <div class="input-group">
                <label>Alcohol by Volume (%)</label>
                <input type="number" id="eth-abv" value="40">
            </div>
            <div class="input-group">
                <label>Patient Weight (kg)</label>
                <input type="number" id="eth-weight">
            </div>
            <div class="input-group">
                <label>Gender</label>
                <select id="eth-gender">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                </select>
            </div>
            <button id="calculate-ethanol">Calculate Concentration</button>
            <div id="ethanol-result" class="result" style="display:none;"></div>

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
        const weightEl = container.querySelector('#eth-weight');
        container.querySelector('#eth-gender').value = patient.gender;

        getMostRecentObservation(client, '29463-7').then(obs => {
            // Weight
            if (obs && obs.valueQuantity) {
                weightEl.value = obs.valueQuantity.value.toFixed(1);
            }
        });

        container.querySelector('#calculate-ethanol').addEventListener('click', () => {
            const amountOz = parseFloat(container.querySelector('#eth-amount').value);
            const abv = parseFloat(container.querySelector('#eth-abv').value);
            const weightKg = parseFloat(weightEl.value);
            const gender = container.querySelector('#eth-gender').value;

            if (isNaN(amountOz) || isNaN(abv) || isNaN(weightKg)) {
                alert('Please enter all values.');
                return;
            }

            const volumeDistribution = gender === 'male' ? 0.68 : 0.55; // L/kg
            const gramsAlcohol = amountOz * 29.57 * (abv / 100) * 0.789; // oz -> mL -> g
            const concentrationMgDl = (gramsAlcohol * 1000) / (weightKg * volumeDistribution * 10); // mg/dL

            container.querySelector('#ethanol-result').innerHTML = `
                <p>Estimated Peak Serum Ethanol Concentration: ${concentrationMgDl.toFixed(0)} mg/dL</p>
            `;
            container.querySelector('#ethanol-result').style.display = 'block';
        });
    }
};
