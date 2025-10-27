import { getMostRecentObservation } from '../../utils.js';

// HScore probability calculation using logistic regression formula
const getProbability = score => {
    const probability = 1 / (1 + Math.exp(-(-4.3 + 0.03 * score)));
    return (probability * 100).toFixed(1);
};

export const hscore = {
    id: 'hscore',
    title: 'HScore for Reactive Hemophagocytic Syndrome',
    description: 'Diagnoses reactive hemophagocytic syndrome.',
    generateHTML: function () {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <div class="form-container modern ariscat-form">
                <div class="input-row">
                    <div class="input-label">Known underlying immunosuppression<span>HIV positive or receiving long-term immunosuppressive therapy (i.e., glucocorticoids, cycloSPORINE, azaTHIOprine)</span></div>
                    <div class="segmented-control"><label><input type="radio" name="immuno" value="0"> No</label><label><input type="radio" name="immuno" value="18"> Yes</label></div>
                </div>
                <div class="input-row vertical">
                    <div class="input-label">Temperature, °F (°C)</div>
                    <div class="radio-group vertical-group">
                        <label><input type="radio" name="temp" value="0"> &lt;101.1 (&lt;38.4)</label>
                        <label><input type="radio" name="temp" value="33"> 101.1-102.9 (38.4-39.4)</label>
                        <label><input type="radio" name="temp" value="49"> &gt;102.9 (&gt;39.4)</label>
                    </div>
                </div>
                <div class="input-row vertical">
                    <div class="input-label">Organomegaly</div>
                    <div class="radio-group vertical-group">
                        <label><input type="radio" name="organo" value="0"> No</label>
                        <label><input type="radio" name="organo" value="23"> Hepatosplenomegaly or splenomegaly</label>
                        <label><input type="radio" name="organo" value="38"> Hepatosplenomegaly and splenomegaly</label>
                    </div>
                </div>
                <div class="input-row vertical">
                    <div class="input-label">Number of cytopenias<span>Defined as hemoglobin ≤9.2 g/dL (≤5.71 mmol/L) and/or WBC ≤5,000/mm³ and/or platelets ≤110,000/mm³</span></div>
                    <div class="radio-group vertical-group">
                        <label><input type="radio" name="cytopenias" value="0"> 1 lineage</label>
                        <label><input type="radio" name="cytopenias" value="24"> 2 lineages</label>
                        <label><input type="radio" name="cytopenias" value="34"> 3 lineages</label>
                    </div>
                </div>
                 <div class="input-row vertical">
                    <div class="input-label">Ferritin, ng/mL (or μg/L)</div>
                    <div class="radio-group vertical-group">
                        <label><input type="radio" name="ferritin" value="0"> &lt;2,000</label>
                        <label><input type="radio" name="ferritin" value="35"> 2,000-6,000</label>
                        <label><input type="radio" name="ferritin" value="50"> &gt;6,000</label>
                    </div>
                </div>
                <div class="input-row vertical">
                    <div class="input-label">Triglycerides, mg/dL (mmol/L)</div>
                    <div class="radio-group vertical-group">
                        <label><input type="radio" name="trig" value="0"> &lt;132.7 (&lt;1.5)</label>
                        <label><input type="radio" name="trig" value="44"> 132.7-354 (1.5-4)</label>
                        <label><input type="radio" name="trig" value="64"> &gt;354 (&gt;4)</label>
                    </div>
                </div>
                <div class="input-row vertical">
                    <div class="input-label">Fibrinogen, mg/dL (g/L)</div>
                    <div class="radio-group vertical-group">
                        <label><input type="radio" name="fibrinogen" value="0"> ≥250 (≥2.5)</label>
                        <label><input type="radio" name="fibrinogen" value="30"> ≤250 (≤2.5)</label>
                    </div>
                </div>
                 <div class="input-row">
                    <div class="input-label">AST, U/L</div>
                    <div class="segmented-control"><label><input type="radio" name="ast" value="0"> &lt;30</label><label><input type="radio" name="ast" value="19"> ≥30</label></div>
                </div>
                <div class="input-row">
                    <div class="input-label">Hemophagocytosis features on bone marrow aspirate</div>
                    <div class="segmented-control"><label><input type="radio" name="bma" value="0"> No</label><label><input type="radio" name="bma" value="35"> Yes</label></div>
                </div>
            </div>
             <div id="hscore-result" class="ariscat-result-box" style="display:none;"></div>
            
            <div class="formula-section">
                <h4 class="formula-title">
                    <span class="formula-icon">📋</span>
                    FORMULA
                </h4>
                
                <div class="formula-table-container">
                    <table class="formula-table hscore-table">
                        <thead>
                            <tr>
                                <th>Variable</th>
                                <th>Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="variable-name" rowspan="2">
                                    <strong>Known underlying immunosuppression</strong>
                                </td>
                                <td>No: <span class="points-badge">0</span></td>
                            </tr>
                            <tr>
                                <td>Yes: <span class="points-badge">18</span></td>
                            </tr>
                            
                            <tr>
                                <td class="variable-name" rowspan="3">
                                    <strong>Temperature, °F (°C)</strong>
                                </td>
                                <td>&lt;101.1 (&lt;38.4): <span class="points-badge">0</span></td>
                            </tr>
                            <tr>
                                <td>101.1–102.9 (38.4–39.4): <span class="points-badge">33</span></td>
                            </tr>
                            <tr>
                                <td>&gt;102.9 (&gt;39.4): <span class="points-badge">49</span></td>
                            </tr>
                            
                            <tr>
                                <td class="variable-name" rowspan="3">
                                    <strong>Organomegaly</strong>
                                </td>
                                <td>No: <span class="points-badge">0</span></td>
                            </tr>
                            <tr>
                                <td>Hepatomegaly or splenomegaly: <span class="points-badge">23</span></td>
                            </tr>
                            <tr>
                                <td>Hepatomegaly and splenomegaly: <span class="points-badge">38</span></td>
                            </tr>
                            
                            <tr>
                                <td class="variable-name" rowspan="4">
                                    <strong>Number of cytopenias</strong>
                                    <sup class="footnote-ref">**</sup>
                                </td>
                                <td>1 lineage: <span class="points-badge">0</span></td>
                            </tr>
                            <tr>
                                <td>2 lineages: <span class="points-badge">24</span></td>
                            </tr>
                            <tr>
                                <td>3 lineages: <span class="points-badge">34</span></td>
                            </tr>
                            <tr>
                                <td colspan="1" class="footnote-cell">**Defined as hemoglobin ≤9.2 g/dL and/or WBC ≤5,000/mm³ and/or platelets ≤110,000/mm³</td>
                            </tr>
                            
                            <tr>
                                <td class="variable-name" rowspan="3">
                                    <strong>Ferritin, ng/mL (or μg/L)</strong>
                                </td>
                                <td>&lt;2,000: <span class="points-badge">0</span></td>
                            </tr>
                            <tr>
                                <td>2,000–6,000: <span class="points-badge">35</span></td>
                            </tr>
                            <tr>
                                <td>&gt;6,000: <span class="points-badge">50</span></td>
                            </tr>
                            
                            <tr>
                                <td class="variable-name" rowspan="3">
                                    <strong>Triglycerides, mg/dL (mmol/L)</strong>
                                </td>
                                <td>&lt;132.7 (&lt;1.5): <span class="points-badge">0</span></td>
                            </tr>
                            <tr>
                                <td>132.7–354 (1.5–4): <span class="points-badge">44</span></td>
                            </tr>
                            <tr>
                                <td>&gt;354 (&gt;4): <span class="points-badge">64</span></td>
                            </tr>
                            
                            <tr>
                                <td class="variable-name" rowspan="2">
                                    <strong>Fibrinogen, mg/dL (g/L)</strong>
                                </td>
                                <td>≥250 (≥2.5): <span class="points-badge">0</span></td>
                            </tr>
                            <tr>
                                <td>&lt;250 (&lt;2.5): <span class="points-badge">30</span></td>
                            </tr>
                            
                            <tr>
                                <td class="variable-name" rowspan="2">
                                    <strong>AST, U/L</strong>
                                </td>
                                <td>&lt;30: <span class="points-badge">0</span></td>
                            </tr>
                            <tr>
                                <td>≥30: <span class="points-badge">19</span></td>
                            </tr>
                            
                            <tr>
                                <td class="variable-name" rowspan="2">
                                    <strong>Hemophagocytosis features on bone marrow aspirate</strong>
                                </td>
                                <td>No: <span class="points-badge">0</span></td>
                            </tr>
                            <tr>
                                <td>Yes: <span class="points-badge">35</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="formula-box" style="margin-top: 25px;">
                    <div class="formula-content">
                        <div class="formula-equation">
                            <div style="font-size: 1.2em; margin-bottom: 15px;">
                                <strong>HScore = Sum of Points</strong>
                            </div>
                            <div style="font-size: 1em; color: #4a5568;">
                                Probability of hemophagocytic syndrome = 
                                <span class="formula-fraction" style="display: inline-flex; vertical-align: middle; margin: 0 5px;">
                                    <span class="formula-numerator" style="border-bottom: 2px solid #2d3748; padding: 5px 10px;">1</span>
                                    <span class="formula-denominator" style="padding: 5px 10px; font-size: 0.85em;">1 + e<sup>-(-4.3 + 0.03 × HScore)</sup></span>
                                </span>
                                × 100%
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="interpretation-table">
                    <h5>Interpretation:</h5>
                    <table class="simple-table">
                        <thead>
                            <tr>
                                <th>HScore</th>
                                <th>Probability of hemophagocytic syndrome</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>&lt;90</td><td>&lt;1%</td></tr>
                            <tr><td>90–100</td><td>~1–3%</td></tr>
                            <tr><td>101–110</td><td>~3–5%</td></tr>
                            <tr><td>111–120</td><td>~5–9%</td></tr>
                            <tr><td>121–130</td><td>~9–16%</td></tr>
                            <tr><td>131–140</td><td>~16–25%</td></tr>
                            <tr><td>141–150</td><td>~25–40%</td></tr>
                            <tr><td>151–160</td><td>~40–52%</td></tr>
                            <tr><td>161–170</td><td>~52–64%</td></tr>
                            <tr><td>171–180</td><td>~64–74%</td></tr>
                            <tr><td>181–190</td><td>~74–82%</td></tr>
                            <tr><td>191–200</td><td>~82–88%</td></tr>
                            <tr><td>201–210</td><td>~88–92%</td></tr>
                            <tr><td>211–220</td><td>~92–95%</td></tr>
                            <tr><td>221–230</td><td>~95–96%</td></tr>
                            <tr><td>&gt;241</td><td>&gt;99%</td></tr>
                        </tbody>
                    </table>
                    <p class="interpretation-note">
                        <em>Note: the best cutoff value for the HScore was 169, corresponding to a sensitivity of 93%.</em>
                    </p>
                </div>
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        const resultEl = container.querySelector('#hscore-result');
        const groups = [
            'immuno',
            'temp',
            'organo',
            'cytopenias',
            'ferritin',
            'trig',
            'fibrinogen',
            'ast',
            'bma'
        ];

        const calculate = () => {
            let score = 0;
            const allAnswered = groups.every(group =>
                container.querySelector(`input[name="${group}"]:checked`)
            );

            if (!allAnswered) {
                resultEl.style.display = 'none';
                return;
            }

            groups.forEach(group => {
                score += parseInt(container.querySelector(`input[name="${group}"]:checked`).value);
            });

            const probability = getProbability(score);

            resultEl.innerHTML = `
                <div class="score-section">
                    <div class="score-value">${score}</div>
                    <div class="score-label">points</div>
                    <div class="score-title">HScore</div>
                </div>
                <div class="interpretation-section">
                    <div class="interp-title">&lt;${probability}%</div>
                    <div class="interp-details">Probability of hemophagocytic syndrome</div>
                </div>
            `;
            resultEl.style.display = 'flex';
        };

        const setRadioFromValue = (groupName, value, ranges) => {
            if (value === null) {
                return;
            }
            const radioToSelect = ranges.find(range => range.condition(value));
            if (radioToSelect) {
                const radio = container.querySelector(
                    `input[name="${groupName}"][value="${radioToSelect.value}"]`
                );
                if (radio) {
                    radio.checked = true;
                    radio.parentElement.classList.add('selected');
                }
            }
        };

        // Auto-populate data
        Promise.all([
            getMostRecentObservation(client, '718-7'), // Hgb
            getMostRecentObservation(client, '6690-2'), // WBC
            getMostRecentObservation(client, '26515-7') // Platelets
        ]).then(([hgb, wbc, platelets]) => {
            let cytopeniaCount = 0;
            if (hgb && hgb.valueQuantity.value < 9.2) {
                cytopeniaCount++;
            }
            if (wbc && wbc.valueQuantity.value < 5) {
                cytopeniaCount++;
            } // Assuming x10^9/L -> x10^3/mm^3
            if (platelets && platelets.valueQuantity.value < 110) {
                cytopeniaCount++;
            }

            setRadioFromValue('cytopenias', cytopeniaCount, [
                { condition: v => v <= 1, value: '0' },
                { condition: v => v === 2, value: '24' },
                { condition: v => v === 3, value: '34' }
            ]);
            calculate();
        });

        getMostRecentObservation(client, '8310-5').then(obs => {
            // Temp F
            if (obs) {
                setRadioFromValue('temp', obs.valueQuantity.value, [
                    { condition: v => v < 101.1, value: '0' },
                    { condition: v => v <= 102.9, value: '33' },
                    { condition: v => v > 102.9, value: '49' }
                ]);
            }
            calculate();
        });
        getMostRecentObservation(client, '2276-4').then(obs => {
            // Ferritin
            if (obs) {
                setRadioFromValue('ferritin', obs.valueQuantity.value, [
                    { condition: v => v < 2000, value: '0' },
                    { condition: v => v <= 6000, value: '35' },
                    { condition: v => v > 6000, value: '50' }
                ]);
            }
            calculate();
        });
        getMostRecentObservation(client, '2571-8').then(obs => {
            // Triglycerides mg/dL
            if (obs) {
                setRadioFromValue('trig', obs.valueQuantity.value, [
                    { condition: v => v < 132.7, value: '0' },
                    { condition: v => v <= 354, value: '44' },
                    { condition: v => v > 354, value: '64' }
                ]);
            }
            calculate();
        });
        getMostRecentObservation(client, '3255-7').then(obs => {
            // Fibrinogen g/L -> mg/dL
            if (obs) {
                setRadioFromValue('fibrinogen', obs.valueQuantity.value * 100, [
                    { condition: v => v >= 250, value: '0' },
                    { condition: v => v < 250, value: '30' }
                ]);
            }
            calculate();
        });
        getMostRecentObservation(client, '1920-8').then(obs => {
            // AST
            if (obs) {
                setRadioFromValue('ast', obs.valueQuantity.value, [
                    { condition: v => v < 30, value: '0' },
                    { condition: v => v >= 30, value: '19' }
                ]);
            }
            calculate();
        });

        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', event => {
                const group = event.target.closest('.radio-group, .segmented-control');
                group
                    .querySelectorAll('label')
                    .forEach(label => label.classList.remove('selected'));
                event.target.parentElement.classList.add('selected');
                calculate();
            });
        });
    }
};
