// js/calculators/meld-na.js
import { getMostRecentObservation } from '../../utils.js';

export const meldNa = {
    id: 'meld-na',
    title: 'MELD-Na (UNOS/OPTN)',
    description: 'Quantifies end-stage liver disease for transplant planning with sodium.',
    generateHTML: function () {
        return `
            <h3>${this.title}</h3>
            <p>${this.description}</p>
            
            <div class="input-group">
                <label for="meld-na-bili">Bilirubin (mg/dL):</label>
                <input type="number" id="meld-na-bili" placeholder="e.g., 3.0" min="0" step="0.1">
            </div>
            <div class="input-group">
                <label for="meld-na-inr">INR:</label>
                <input type="number" id="meld-na-inr" placeholder="e.g., 1.5" min="0" step="0.01">
            </div>
            <div class="input-group">
                <label for="meld-na-creat">Creatinine (mg/dL):</label>
                <input type="number" id="meld-na-creat" placeholder="e.g., 1.5" min="0" step="0.1">
            </div>
            <div class="input-group">
                <label for="meld-na-sodium">Sodium (mEq/L):</label>
                <input type="number" id="meld-na-sodium" placeholder="e.g., 130" min="100" max="155" step="1">
            </div>
            <div class="check-item">
                <input type="checkbox" id="meld-na-dialysis">
                <label for="meld-na-dialysis">Patient on dialysis twice in the last week</label>
            </div>
            
            <div id="meld-na-result" class="result" style="display:none;"></div>

            <!-- Formula Section -->
            <div class="formula-section">
                <h4>📐 MELD-Na Calculation Formula</h4>
                <p style="font-size: 0.9em; color: #666; margin-bottom: 15px;">The MELD-Na score incorporates sodium level to improve prognostic accuracy for end-stage liver disease.</p>
                
                <!-- Step 1: Calculate MELD -->
                <div style="background: #f5f7fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                    <h5 style="margin-top: 0; color: #333;">Step 1: Calculate Original MELD Score</h5>
                    <p style="font-family: monospace; background: white; padding: 15px; border-radius: 5px; overflow-x: auto; margin-bottom: 10px;">
                        MELD = 0.957 × ln(Creatinine) + 0.378 × ln(Bilirubin)<br>
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ 1.120 × ln(INR) + 0.643
                    </p>
                    <p style="font-size: 0.85em; color: #555;">
                        <strong>UNOS/OPTN Rules for MELD:</strong>
                    </p>
                    <ul style="font-size: 0.85em; color: #555; margin: 5px 0; padding-left: 20px;">
                        <li>Bilirubin: minimum 1.0 mg/dL</li>
                        <li>INR: minimum 1.0</li>
                        <li>Creatinine: minimum 1.0 mg/dL, maximum 4.0 mg/dL (or if on dialysis)</li>
                    </ul>
                </div>

                <!-- Step 2: Calculate MELD-Na -->
                <div style="background: #e3f2fd; padding: 20px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #2196F3;">
                    <h5 style="margin-top: 0; color: #1976D2;">Step 2: Adjust for Sodium (if MELD > 11)</h5>
                    <p style="font-family: monospace; background: white; padding: 15px; border-radius: 5px; overflow-x: auto; margin-bottom: 10px;">
                        MELD-Na = MELD + 1.32 × (137 - Sodium) - (0.033 × MELD × (137 - Sodium))
                    </p>
                    <p style="font-size: 0.85em; color: #555; margin-top: 10px;">
                        <strong>Notes:</strong>
                    </p>
                    <ul style="font-size: 0.85em; color: #555; margin: 5px 0; padding-left: 20px;">
                        <li>Applied only if MELD score > 11</li>
                        <li>Sodium is capped at 125-137 mEq/L for the calculation</li>
                        <li>Final MELD-Na Score: minimum 6, maximum 40</li>
                    </ul>
                </div>

                <!-- Parameters -->
                <div style="background: #f1f8e9; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #c5e1a5;">
                    <h5 style="margin-top: 0; color: #33691e;">📋 Parameters:</h5>
                    <ul style="margin: 10px 0; padding-left: 20px; font-size: 0.9em;">
                        <li><strong>Bilirubin:</strong> Total serum bilirubin (mg/dL)</li>
                        <li><strong>INR:</strong> International Normalized Ratio for prothrombin time</li>
                        <li><strong>Creatinine:</strong> Serum creatinine (mg/dL)</li>
                        <li><strong>Sodium:</strong> Serum sodium (mEq/L)</li>
                        <li><strong>Dialysis:</strong> Two or more dialysis sessions in the prior week</li>
                    </ul>
                </div>

                <!-- Clinical Interpretation -->
                <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #f39c12;">
                    <h5 style="margin-top: 0; color: #d68910;">📊 MELD-Na Score Interpretation & 90-Day Mortality:</h5>
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.9em;">
                        <tr style="background: #fff8e1;">
                            <th style="border: 1px solid #ffeaa7; padding: 8px; text-align: left;"><strong>MELD-Na Score</strong></th>
                            <th style="border: 1px solid #ffeaa7; padding: 8px; text-align: left;"><strong>90-Day Mortality</strong></th>
                            <th style="border: 1px solid #ffeaa7; padding: 8px; text-align: left;"><strong>Clinical Status</strong></th>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ffeaa7; padding: 8px;">&lt;17</td>
                            <td style="border: 1px solid #ffeaa7; padding: 8px;"><strong>&lt;2%</strong></td>
                            <td style="border: 1px solid #ffeaa7; padding: 8px;">Low Risk</td>
                        </tr>
                        <tr style="background: #f5f5f5;">
                            <td style="border: 1px solid #ffeaa7; padding: 8px;">17-20</td>
                            <td style="border: 1px solid #ffeaa7; padding: 8px;"><strong>3-4%</strong></td>
                            <td style="border: 1px solid #ffeaa7; padding: 8px;">Low-Moderate Risk</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ffeaa7; padding: 8px;">21-22</td>
                            <td style="border: 1px solid #ffeaa7; padding: 8px;"><strong>7-10%</strong></td>
                            <td style="border: 1px solid #ffeaa7; padding: 8px;">Moderate Risk</td>
                        </tr>
                        <tr style="background: #f5f5f5;">
                            <td style="border: 1px solid #ffeaa7; padding: 8px;">23-26</td>
                            <td style="border: 1px solid #ffeaa7; padding: 8px;"><strong>14-15%</strong></td>
                            <td style="border: 1px solid #ffeaa7; padding: 8px;">Moderate-High Risk</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ffeaa7; padding: 8px;">27-31</td>
                            <td style="border: 1px solid #ffeaa7; padding: 8px;"><strong>27-32%</strong></td>
                            <td style="border: 1px solid #ffeaa7; padding: 8px;">High Risk</td>
                        </tr>
                        <tr style="background: #f5f5f5;">
                            <td style="border: 1px solid #ffeaa7; padding: 8px;">≥32</td>
                            <td style="border: 1px solid #ffeaa7; padding: 8px;"><strong>65-66%</strong></td>
                            <td style="border: 1px solid #ffeaa7; padding: 8px;">Very High Risk</td>
                        </tr>
                    </table>
                </div>

                <!-- Clinical Notes -->
                <div style="background: #fef5e7; padding: 15px; border-radius: 8px; border-left: 4px solid #f39c12;">
                    <h5 style="margin-top: 0; color: #d68910;">📌 Important Clinical Notes:</h5>
                    <ul style="margin: 10px 0; padding-left: 20px; font-size: 0.85em; color: #555;">
                        <li><strong>Accuracy:</strong> MELD-Na has superior predictive accuracy compared to MELD alone for 90-day mortality</li>
                        <li><strong>Transplant Listing:</strong> Generally used for liver transplant priority allocation</li>
                        <li><strong>Sodium Impact:</strong> Hyponatremia (low sodium) indicates poor prognosis and increases MELD-Na score</li>
                        <li><strong>Update Frequency:</strong> Scores should be updated regularly (typically monthly) for patients awaiting transplant</li>
                        <li><strong>Limitations:</strong> May underestimate risk in fulminant hepatitis or acute liver failure</li>
                        <li><strong>Exceptions Points:</strong> Some patients with specific diagnoses (HCC, polycystic liver, etc.) may receive additional priority points</li>
                    </ul>
                </div>
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        // Get all input elements using container.querySelector
        const biliInput = container.querySelector('#meld-na-bili');
        const inrInput = container.querySelector('#meld-na-inr');
        const creatInput = container.querySelector('#meld-na-creat');
        const sodiumInput = container.querySelector('#meld-na-sodium');
        const dialysisCheckbox = container.querySelector('#meld-na-dialysis');
        const resultEl = container.querySelector('#meld-na-result');

        // LOINC: Bili: 1975-2, INR: 34714-6, Creat: 2160-0, Sodium: 2951-2
        const biliPromise = client
            ? getMostRecentObservation(client, '1975-2')
            : Promise.resolve(null);
        const inrPromise = client
            ? getMostRecentObservation(client, '34714-6')
            : Promise.resolve(null);
        const creatPromise = client
            ? getMostRecentObservation(client, '2160-0')
            : Promise.resolve(null);
        const sodiumPromise = client
            ? getMostRecentObservation(client, '2951-2')
            : Promise.resolve(null);

        Promise.all([biliPromise, inrPromise, creatPromise, sodiumPromise])
            .then(([bili, inr, creat, sodium]) => {
                if (bili && bili.valueQuantity) {
                    biliInput.value = bili.valueQuantity.value.toFixed(1);
                }
                if (inr && inr.valueQuantity) {
                    inrInput.value = inr.valueQuantity.value.toFixed(2);
                }
                if (creat && creat.valueQuantity) {
                    creatInput.value = creat.valueQuantity.value.toFixed(1);
                }
                if (sodium && sodium.valueQuantity) {
                    sodiumInput.value = sodium.valueQuantity.value.toFixed(0);
                }
                // Trigger calculation after loading data
                calculateAndUpdate();
            })
            .catch(err => console.log('Lab data not fully available'));

        const calculateAndUpdate = () => {
            const bili = parseFloat(biliInput.value);
            const inr = parseFloat(inrInput.value);
            const creat = parseFloat(creatInput.value);
            const sodium = parseFloat(sodiumInput.value);
            const onDialysis = dialysisCheckbox.checked;

            // Check if all values are valid
            if (isNaN(bili) || isNaN(inr) || isNaN(creat) || isNaN(sodium)) {
                resultEl.style.display = 'none';
                return;
            }

            // Apply UNOS/OPTN rules
            const adjustedBili = Math.max(bili, 1.0);
            const adjustedInr = Math.max(inr, 1.0);
            let adjustedCreat = Math.max(creat, 1.0);
            if (onDialysis || adjustedCreat > 4.0) {
                adjustedCreat = 4.0;
            }

            // Calculate original MELD
            let meldScore =
                0.957 * Math.log(adjustedCreat) +
                0.378 * Math.log(adjustedBili) +
                1.12 * Math.log(adjustedInr) +
                0.643;
            meldScore = Math.round(meldScore * 10) / 10;

            // Calculate MELD-Na
            let meldNaScore = meldScore;
            if (meldScore > 11) {
                const adjustedSodium = Math.max(125, Math.min(137, sodium));
                meldNaScore =
                    meldScore +
                    1.32 * (137 - adjustedSodium) -
                    0.033 * meldScore * (137 - adjustedSodium);
            }

            // Final score capping
            meldNaScore = Math.max(6, Math.min(40, meldNaScore));
            meldNaScore = Math.round(meldNaScore);

            // Determine risk category and mortality
            let riskCategory = '';
            let mortalityRate = '';
            let riskColor = '';
            if (meldNaScore < 17) {
                riskCategory = 'Low Risk';
                mortalityRate = '<2%';
                riskColor = '#388e3c';
            } else if (meldNaScore < 21) {
                riskCategory = 'Low-Moderate Risk';
                mortalityRate = '3-4%';
                riskColor = '#7cb342';
            } else if (meldNaScore < 23) {
                riskCategory = 'Moderate Risk';
                mortalityRate = '7-10%';
                riskColor = '#ffa726';
            } else if (meldNaScore < 27) {
                riskCategory = 'Moderate-High Risk';
                mortalityRate = '14-15%';
                riskColor = '#ff7043';
            } else if (meldNaScore < 32) {
                riskCategory = 'High Risk';
                mortalityRate = '27-32%';
                riskColor = '#d32f2f';
            } else {
                riskCategory = 'Very High Risk';
                mortalityRate = '65-66%';
                riskColor = '#b71c1c';
            }

            resultEl.innerHTML = `
                <div class="result-item">
                    <span class="value">${meldNaScore}</span>
                    <span class="label">MELD-Na Score</span>
                </div>
                <div style="background: ${riskColor}20; border-left: 4px solid ${riskColor}; padding: 15px; border-radius: 5px; margin-top: 15px;">
                    <div style="font-size: 0.95em; margin-bottom: 8px;">
                        <strong style="color: ${riskColor};">📊 Risk Category:</strong> <span style="color: ${riskColor}; font-weight: bold;">${riskCategory}</span>
                    </div>
                    <div style="font-size: 0.95em;">
                        <strong style="color: ${riskColor};">⚠️ 90-Day Mortality:</strong> <span style="color: ${riskColor}; font-weight: bold;">${mortalityRate}</span>
                    </div>
                </div>
                <div style="margin-top: 15px; padding: 12px; background: #e3f2fd; border-radius: 5px; font-size: 0.85em; border-left: 4px solid #2196F3;">
                    <strong>Score Breakdown:</strong><br>
                    • Original MELD: ${meldScore.toFixed(1)}<br>
                    • Adjusted Bilirubin (min 1.0): ${adjustedBili.toFixed(1)} mg/dL<br>
                    • Adjusted INR (min 1.0): ${adjustedInr.toFixed(2)}<br>
                    • Adjusted Creatinine (max 4.0${onDialysis ? ', on dialysis' : ''}): ${adjustedCreat.toFixed(1)} mg/dL
                </div>
            `;
            resultEl.style.display = 'block';
        };

        // Add event listeners for automatic calculation
        biliInput.addEventListener('input', calculateAndUpdate);
        inrInput.addEventListener('input', calculateAndUpdate);
        creatInput.addEventListener('input', calculateAndUpdate);
        sodiumInput.addEventListener('input', calculateAndUpdate);
        dialysisCheckbox.addEventListener('change', calculateAndUpdate);
    }
};
