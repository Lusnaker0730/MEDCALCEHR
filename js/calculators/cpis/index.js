// js/calculators/cpis/index.js
import { getMostRecentObservation, getPatientConditions } from '../../utils.js';

export const cpis = {
    id: 'cpis',
    title: 'Clinical Pulmonary Infection Score (CPIS) for VAP',
    description: 'Predicts ventilator-associated pneumonia (VAP) likelihood in patients on mechanical ventilation.',

    generateHTML: () => `
        <div class="form-container">
            <div class="instructions-box cpis-instructions">
                <div class="instruction-header">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 10px;">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    <strong>CLINICAL PULMONARY INFECTION SCORE (CPIS)</strong>
                </div>
                <p>Use in mechanically ventilated patients to assess for ventilator-associated pneumonia (VAP).</p>
                <p style="margin-top: 8px;"><strong>Interpretation:</strong> Score ≥6 suggests high likelihood of VAP. Consider in patients with new or worsening infiltrate on chest imaging.</p>
            </div>
            
            <div class="cpis-criteria-section">
                <!-- Temperature -->
                <div class="input-row cpis-input-row">
                    <div class="input-label cpis-label">
                        <span class="label-icon">🌡️</span>
                        <div>
                            <div class="label-main">Temperature</div>
                            <div class="label-sub">Core body temperature</div>
                        </div>
                    </div>
                    <div class="segmented-control cpis-control multi" data-name="temperature">
                        <label><input type="radio" name="temperature" value="0" checked><span>36.5-38.4°C <strong>0</strong></span></label>
                        <label><input type="radio" name="temperature" value="1"><span>38.5-38.9°C <strong>1</strong></span></label>
                        <label><input type="radio" name="temperature" value="2"><span>≥39 or ≤36°C <strong>2</strong></span></label>
                    </div>
                </div>

                <!-- WBC Count -->
                <div class="input-row cpis-input-row">
                    <div class="input-label cpis-label">
                        <span class="label-icon">🔬</span>
                        <div>
                            <div class="label-main">White Blood Cell Count</div>
                            <div class="label-sub">WBC count and band forms</div>
                        </div>
                    </div>
                    <div class="segmented-control cpis-control multi" data-name="wbc">
                        <label><input type="radio" name="wbc" value="0" checked><span>4-11 × 10³/μL <strong>0</strong></span></label>
                        <label><input type="radio" name="wbc" value="1"><span>&lt;4 or &gt;11 × 10³/μL <strong>1</strong></span></label>
                        <label><input type="radio" name="wbc" value="2"><span>&lt;4 or &gt;11 + bands ≥50% <strong>2</strong></span></label>
                    </div>
                </div>

                <!-- Tracheal Secretions -->
                <div class="input-row cpis-input-row">
                    <div class="input-label cpis-label">
                        <span class="label-icon">💧</span>
                        <div>
                            <div class="label-main">Tracheal Secretions</div>
                            <div class="label-sub">Amount and purulence</div>
                        </div>
                    </div>
                    <div class="segmented-control cpis-control multi" data-name="secretions">
                        <label><input type="radio" name="secretions" value="0" checked><span>Few <strong>0</strong></span></label>
                        <label><input type="radio" name="secretions" value="1"><span>Moderate <strong>1</strong></span></label>
                        <label><input type="radio" name="secretions" value="2"><span>Large/Purulent <strong>2</strong></span></label>
                    </div>
                </div>

                <!-- Oxygenation -->
                <div class="input-row cpis-input-row">
                    <div class="input-label cpis-label">
                        <span class="label-icon">🫁</span>
                        <div>
                            <div class="label-main">Oxygenation: PaO₂/FiO₂ (mmHg)</div>
                            <div class="label-sub">Arterial oxygen partial pressure to fractional inspired oxygen ratio</div>
                        </div>
                    </div>
                    <div class="segmented-control cpis-control" data-name="oxygenation">
                        <label><input type="radio" name="oxygenation" value="0" checked><span>&gt;240 or ARDS <strong>0</strong></span></label>
                        <label><input type="radio" name="oxygenation" value="2"><span>≤240 and no ARDS <strong>2</strong></span></label>
                    </div>
                </div>

                <!-- Chest X-ray -->
                <div class="input-row cpis-input-row">
                    <div class="input-label cpis-label">
                        <span class="label-icon">🩻</span>
                        <div>
                            <div class="label-main">Chest Radiograph Infiltrate</div>
                            <div class="label-sub">Pattern on chest imaging</div>
                        </div>
                    </div>
                    <div class="segmented-control cpis-control multi" data-name="chest_xray">
                        <label><input type="radio" name="chest_xray" value="0" checked><span>No infiltrate <strong>0</strong></span></label>
                        <label><input type="radio" name="chest_xray" value="1"><span>Diffuse <strong>1</strong></span></label>
                        <label><input type="radio" name="chest_xray" value="2"><span>Localized <strong>2</strong></span></label>
                    </div>
                </div>

                <!-- Culture -->
                <div class="input-row cpis-input-row">
                    <div class="input-label cpis-label">
                        <span class="label-icon">🧫</span>
                        <div>
                            <div class="label-main">Culture of Tracheal Aspirate</div>
                            <div class="label-sub">Semi-quantitative culture result</div>
                        </div>
                    </div>
                    <div class="segmented-control cpis-control multi" data-name="culture">
                        <label><input type="radio" name="culture" value="0" checked><span>No/Few pathogens <strong>0</strong></span></label>
                        <label><input type="radio" name="culture" value="1"><span>Moderate/Many <strong>1</strong></span></label>
                        <label><input type="radio" name="culture" value="2"><span>Same on Gram stain <strong>2</strong></span></label>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="result-box cpis-result" id="cpis-result-box">
            <div class="cpis-result-content">
                <div class="result-score-section">
                    <div class="result-label">CPIS Score</div>
                    <div class="result-score cpis-score" id="result-score">0</div>
                    <div class="result-points">points</div>
                </div>
                <div class="result-divider"></div>
                <div class="result-interpretation-section">
                    <div class="result-risk-icon" id="risk-icon">✓</div>
                    <div class="result-interpretation cpis-interpretation" id="result-interpretation">
                        <div class="interpretation-text" id="interpretation-text">Low likelihood of VAP</div>
                        <div class="interpretation-detail" id="interpretation-detail">Score &lt;6 suggests VAP is less likely</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="cpis-management-box" id="management-box" style="display:none;">
            <h4>📋 Clinical Management Considerations</h4>
            <div id="management-content"></div>
        </div>

        <div class="cpis-additional-note">
            <strong>⚕️ Clinical Note:</strong> Scores ≥ 7 may indicate higher likelihood of VAP and need for BAL or mini-BAL.
        </div>

        <div class="references">
            <h4>📚 References</h4>
            <ol>
                <li>
                    Schurink CAM, Nieuwenhoven CAV, Jacobs JA, Rozenberg-Arska M, Joore HCA, Buskens E, Hoepelman AIM, Bonten MJM. 
                    <strong>Clinical pulmonary infection score for ventilator-associated pneumonia: accuracy and inter-observer variability.</strong> 
                    <em>Intensive Care Med.</em> 2004 Feb;30(2):217-224. 
                    <a href="https://doi.org/10.1007/s00134-003-2018-2" target="_blank">doi: 10.1007/s00134-003-2018-2</a>. 
                    Epub 2003 Oct 18. PMID: 14566455.
                </li>
            </ol>
        </div>
    `,

    initialize: (client) => {
        const calculate = () => {
            const score = Array.from(document.querySelectorAll('.form-container input:checked')).reduce((acc, input) => {
                return acc + parseInt(input.value);
            }, 0);

            const resultScore = document.getElementById('result-score');
            const interpretationText = document.getElementById('interpretation-text');
            const interpretationDetail = document.getElementById('interpretation-detail');
            const resultBox = document.getElementById('cpis-result-box');
            const riskIcon = document.getElementById('risk-icon');
            const managementBox = document.getElementById('management-box');
            const managementContent = document.getElementById('management-content');

            resultScore.textContent = score;

            if (score < 6) {
                interpretationText.textContent = 'Low likelihood of VAP';
                interpretationDetail.textContent = 'Score <6 suggests VAP is less likely';
                resultBox.className = 'result-box cpis-result cpis-low-risk';
                riskIcon.textContent = '✓';
                
                managementContent.innerHTML = `
                    <ul>
                        <li><strong>Continue monitoring:</strong> Serial clinical assessments</li>
                        <li><strong>Standard care:</strong> Ventilator bundle adherence</li>
                        <li><strong>Re-evaluate:</strong> If clinical deterioration occurs</li>
                        <li><strong>Consider:</strong> Alternative diagnoses for symptoms</li>
                    </ul>
                `;
            } else {
                interpretationText.textContent = 'High likelihood of VAP';
                interpretationDetail.textContent = 'Score ≥6 suggests VAP is likely';
                resultBox.className = 'result-box cpis-result cpis-high-risk';
                riskIcon.textContent = '⚠';
                
                managementContent.innerHTML = `
                    <ul>
                        <li><strong>Obtain cultures:</strong> Tracheal aspirate or BAL before antibiotics</li>
                        <li><strong>Initiate antibiotics:</strong> Empiric coverage based on local antibiogram</li>
                        <li><strong>Imaging:</strong> Consider CT chest if diagnosis unclear</li>
                        <li><strong>De-escalate:</strong> Based on culture results and clinical response</li>
                        <li><strong>Duration:</strong> Typically 7-8 days for VAP (adjust based on pathogen)</li>
                        <li><strong>Source control:</strong> Optimize ventilator settings, consider bronchoscopy</li>
                    </ul>
                `;
            }

            managementBox.style.display = 'block';
        };

        document.querySelectorAll('.form-container input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', calculate);
        });

        // --- FHIR Integration ---
        const setRadio = (name, value) => {
            const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change'));
            }
        };

        if (!client) {
            calculate();
            return;
        }

        // Temperature (LOINC: 8310-5 - Body temperature)
        getMostRecentObservation(client, '8310-5').then(obs => {
            if (obs && obs.valueQuantity) {
                let tempC = obs.valueQuantity.value;
                // Convert to Celsius if in Fahrenheit
                if (obs.valueQuantity.unit === 'degF' || obs.valueQuantity.code === '[degF]') {
                    tempC = (tempC - 32) * 5/9;
                }
                
                if (tempC >= 36.5 && tempC <= 38.4) {
                    setRadio('temperature', '0');
                } else if (tempC >= 38.5 && tempC <= 38.9) {
                    setRadio('temperature', '1');
                } else {
                    setRadio('temperature', '2');
                }
            }
        }).catch(err => console.log('Temperature data not available'));

        // WBC Count (LOINC: 6690-2 - Leukocytes [#/volume] in Blood by Automated count)
        getMostRecentObservation(client, '6690-2').then(obs => {
            if (obs && obs.valueQuantity) {
                const wbc = obs.valueQuantity.value;
                if (wbc >= 4 && wbc <= 11) {
                    setRadio('wbc', '0');
                } else {
                    setRadio('wbc', '1'); // Default to 1, would need band % for score of 2
                }
            }
        }).catch(err => console.log('WBC data not available'));

        // PaO2/FiO2 ratio - would need both PaO2 and FiO2 values
        // LOINC: 50984-4 - Oxygen [Partial pressure] in Arterial blood
        // LOINC: 3150-0 - Inhaled oxygen concentration
        
        Promise.all([
            getMostRecentObservation(client, '50984-4'),
            getMostRecentObservation(client, '3150-0')
        ]).then(([pao2Obs, fio2Obs]) => {
            if (pao2Obs && pao2Obs.valueQuantity && fio2Obs && fio2Obs.valueQuantity) {
                const pao2 = pao2Obs.valueQuantity.value;
                let fio2 = fio2Obs.valueQuantity.value;
                
                // FiO2 might be as percentage or decimal
                if (fio2 > 1) fio2 = fio2 / 100;
                
                const ratio = pao2 / fio2;
                
                if (ratio > 240) {
                    setRadio('oxygenation', '0');
                } else {
                    setRadio('oxygenation', '2');
                }
            }
        }).catch(err => console.log('Oxygenation data not available'));

        // Calculate initial score
        setTimeout(calculate, 500);
    }
};

