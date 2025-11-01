import { calculateAge } from '../../utils.js';

export const heartScore = {
    id: 'heart-score',
    title: 'HEART Score for Major Cardiac Events',
    description:
        'Predicts 6-week risk of major adverse cardiac events in patients with chest pain.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            <div class="alert warning">
                <span class="alert-icon">⚠️</span>
                <div class="alert-content">
                    <div class="alert-title">Inclusion Criteria</div>
                    <p>Use in patients ≥21 years old presenting with symptoms suggestive of ACS. <strong>Do not use if:</strong> new ST-segment elevation ≥1 mm, hypotension, life expectancy &lt;1 year, or noncardiac illness requiring admission.</p>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">
                    <span class="section-title-icon">📋</span>
                    <span>History</span>
                </div>
                <div class="radio-group">
                    <label class="radio-option">
                        <input type="radio" name="history" value="0" checked>
                        <span>Slightly suspicious <strong>0</strong></span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="history" value="1">
                        <span>Moderately suspicious <strong>+1</strong></span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="history" value="2">
                        <span>Highly suspicious <strong>+2</strong></span>
                    </label>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">
                    <span class="section-title-icon">📊</span>
                    <span>EKG</span>
                </div>
                <div class="help-text mb-10">1 point: No ST deviation but LBBB, LVH, repolarization changes; 2 points: ST deviation not due to LBBB, LVH, or digoxin</div>
                <div class="radio-group">
                    <label class="radio-option">
                        <input type="radio" name="ecg" value="0" checked>
                        <span>Normal <strong>0</strong></span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="ecg" value="1">
                        <span>Non-specific repolarization disturbance <strong>+1</strong></span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="ecg" value="2">
                        <span>Significant ST deviation <strong>+2</strong></span>
                    </label>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">
                    <span class="section-title-icon">👤</span>
                    <span>Age</span>
                </div>
                <div class="radio-group">
                    <label class="radio-option">
                        <input type="radio" name="age" value="0" checked>
                        <span>&lt;45 years <strong>0</strong></span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="age" value="1">
                        <span>45-64 years <strong>+1</strong></span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="age" value="2">
                        <span>≥65 years <strong>+2</strong></span>
                    </label>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">
                    <span class="section-title-icon">⚡</span>
                    <span>Risk Factors</span>
                </div>
                <div class="help-text mb-10">Risk factors: HTN, hypercholesterolemia, DM, obesity (BMI &gt;30), smoking (current or quit ≤3 mo), positive family history (parent/sibling with CVD before age 65), atherosclerotic disease (prior MI, PCI/CABG, CVA/TIA, PAD)</div>
                <div class="radio-group">
                    <label class="radio-option">
                        <input type="radio" name="risk" value="0" checked>
                        <span>No known risk factors <strong>0</strong></span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="risk" value="1">
                        <span>1-2 risk factors <strong>+1</strong></span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="risk" value="2">
                        <span>≥3 risk factors or history of atherosclerotic disease <strong>+2</strong></span>
                    </label>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">
                    <span class="section-title-icon">🔬</span>
                    <span>Initial Troponin</span>
                </div>
                <div class="help-text mb-10">Use local, regular sensitivity troponin assays and corresponding cutoffs</div>
                <div class="radio-group">
                    <label class="radio-option">
                        <input type="radio" name="troponin" value="0" checked>
                        <span>≤normal limit <strong>0</strong></span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="troponin" value="1">
                        <span>1-3× normal limit <strong>+1</strong></span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="troponin" value="2">
                        <span>&gt;3× normal limit <strong>+2</strong></span>
                    </label>
                </div>
            </div>
            
            <button class="btn-calculate" id="calculate-heart">Calculate HEART Score</button>
            
            <div id="heart-score-result" class="result-container" style="display:none;"></div>
            
            <div class="formula-section">
                <h4 class="formula-title">
                    <span class="formula-icon">📋</span>
                    FORMULA
                </h4>
                <p class="formula-subtitle">Addition of the selected points:</p>
                
                <div class="formula-table-container">
                    <table class="formula-table">
                        <thead>
                            <tr>
                                <th>Variable</th>
                                <th>0 points</th>
                                <th>1 point</th>
                                <th>2 points</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td class="variable-name">
                                    <strong>History</strong>
                                    <sup class="footnote-ref">1</sup>
                                </td>
                                <td>Slightly suspicious</td>
                                <td>Moderately suspicious</td>
                                <td>Highly suspicious</td>
                            </tr>
                            <tr>
                                <td class="variable-name">
                                    <strong>EKG</strong>
                                </td>
                                <td>Normal</td>
                                <td>Non-specific repolarization disturbance<sup class="footnote-ref">2</sup></td>
                                <td>Significant ST deviation<sup class="footnote-ref">3</sup></td>
                            </tr>
                            <tr>
                                <td class="variable-name">
                                    <strong>Age (years)</strong>
                                </td>
                                <td>&lt;45</td>
                                <td>45–64</td>
                                <td>≥65</td>
                            </tr>
                            <tr>
                                <td class="variable-name">
                                    <strong>Risk factors</strong>
                                    <sup class="footnote-ref">4</sup>
                                </td>
                                <td>No known risk factors</td>
                                <td>1–2 risk factors</td>
                                <td>≥3 risk factors or history of atherosclerotic disease</td>
                            </tr>
                            <tr>
                                <td class="variable-name">
                                    <strong>Initial troponin</strong>
                                    <sup class="footnote-ref">5</sup>
                                </td>
                                <td>≤normal limit</td>
                                <td>1–3× normal limit</td>
                                <td>>3× normal limit</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="formula-footnotes">
                    <ol>
                        <li>e.g. Retrosternal pain, pressure, radiation to jaw/left shoulder/arms, duration 5–15 min, initiated by exercise/cold/emotion, perspiration, nausea/vomiting, reaction on nitrates within mins, patient recognizes symptoms. Low risk features of chest pain include: well localized, sharp, non-exertional, no diaphoresis, no nausea or vomiting, and reproducible with palpation.</li>
                        <li>LBBB, typical changes of LVH, repolarization disorders suggesting digoxin, unchanged known repolarization disorders.</li>
                        <li>Significant ST-segment deviation without LBBB, LVH, or digoxin.</li>
                        <li>HTN, hypercholesterolemia, DM, obesity (BMI >30 kg/m²), smoking (current, or smoking cessation ≤3 mo), positive family history (parent or sibling with CVD before age 65).</li>
                        <li>Use local, regular sensitivity troponin assays and corresponding cutoffs.</li>
                    </ol>
                </div>
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        const calculate = () => {
            const groups = ['history', 'ecg', 'age', 'risk', 'troponin'];
            let score = 0;
            let allAnswered = true;

            groups.forEach(groupName => {
                const checkedRadio = container.querySelector(`input[name="${groupName}"]:checked`);
                if (checkedRadio) {
                    score += parseInt(checkedRadio.value);
                } else {
                    allAnswered = false;
                }
            });

            if (allAnswered) {
                let riskCategory = '';
                let riskRange = '';
                let maceRate = '';

                if (score <= 3) {
                    riskCategory = 'Low Score';
                    riskRange = '0-3 points';
                    maceRate = '0.9-1.7%';
                } else if (score <= 6) {
                    riskCategory = 'Moderate Score';
                    riskRange = '4-6 points';
                    maceRate = '12-16.6%';
                } else {
                    riskCategory = 'High Score';
                    riskRange = '7-10 points';
                    maceRate = '50-65%';
                }

                const resultEl = container.querySelector('#heart-score-result');
                resultEl.innerHTML = `
                    <div class="score-section">
                        <div class="score-value">${score}</div>
                        <div class="score-label">points</div>
                        <div class="score-title">${riskCategory} (${riskRange})</div>
                    </div>
                    <div class="interpretation-section">
                        <div class="interp-details" style="font-size: 1.2em; font-weight: bold; margin-top: 0;">Risk of MACE of ${maceRate}</div>
                    </div>
                `;
                resultEl.style.display = 'flex';
            } else {
                container.querySelector('#heart-score-result').style.display = 'none';
            }
        };

        const patientAge = calculateAge(patient.birthDate);
        const ageRadios = container.querySelectorAll('input[name="age"]');
        if (patientAge < 45) {
            ageRadios[0].checked = true;
        } else if (patientAge <= 64) {
            ageRadios[1].checked = true;
        } else {
            ageRadios[2].checked = true;
        }
        ageRadios.forEach(r => {
            if (r.checked) {
                r.parentElement.classList.add('selected');
            }
        });

        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', event => {
                const group = event.target.closest('.segmented-control, .radio-group');
                group
                    .querySelectorAll('label')
                    .forEach(label => label.classList.remove('selected'));
                event.target.parentElement.classList.add('selected');
                calculate();
            });
        });

        calculate();
    }
};
