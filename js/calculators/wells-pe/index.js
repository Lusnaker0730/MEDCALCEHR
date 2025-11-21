// js/calculators/wells-pe.js
import { getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';

export const wellsPE = {
    id: 'wells-pe',
    title: "Wells' Criteria for Pulmonary Embolism",
    description:
        'Estimates pre-test probability of pulmonary embolism (PE) to guide diagnostic workup.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            <div class="alert info">
                <span class="alert-icon">?¹ï?</span>
                <div class="alert-content">
                    <div class="alert-title">Instructions</div>
                    <p>Check all criteria that apply to the patient. Score interpretation helps guide D-dimer testing and CT angiography decisions.</p>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">
                    <span class="section-title-icon">??</span>
                    <span>Clinical Criteria</span>
                </div>
                
                <div class="checkbox-group">
                    <label class="checkbox-option">
                        <input type="checkbox" id="wells-dvt" data-points="3">
                        <span>Clinical signs and symptoms of DVT <strong>+3</strong></span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" id="wells-alt" data-points="3">
                        <span>PE is #1 diagnosis OR equally likely <strong>+3</strong></span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" id="wells-hr" data-points="1.5">
                        <span>Heart rate > 100 bpm <strong>+1.5</strong></span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" id="wells-immo" data-points="1.5">
                        <span>Immobilization (?? days) or surgery in previous 4 weeks <strong>+1.5</strong></span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" id="wells-prev" data-points="1.5">
                        <span>Previous, objectively diagnosed PE or DVT <strong>+1.5</strong></span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" id="wells-hemo" data-points="1">
                        <span>Hemoptysis <strong>+1</strong></span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" id="wells-mal" data-points="1">
                        <span>Malignancy (with treatment within 6 months, or palliative) <strong>+1</strong></span>
                    </label>
                </div>
            </div>
            
            <div class="result-container" id="wells-result" style="display:none;"></div>

            
            <div class="info-section mt-30">
                <h4>?? Score Interpretation</h4>
                <div class="data-table">
                    <table>
                        <thead>
                            <tr>
                                <th colspan="2">Three-Tier Model</th>
                            </tr>
                            <tr>
                                <th>Score</th>
                                <th>Risk Category</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>0 - 1</td>
                                <td><span class="risk-badge low">Low Risk</span></td>
                            </tr>
                            <tr>
                                <td>2 - 6</td>
                                <td><span class="risk-badge moderate">Moderate Risk</span></td>
                            </tr>
                            <tr>
                                <td>&gt;6</td>
                                <td><span class="risk-badge high">High Risk</span></td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <table class="mt-20">
                        <thead>
                            <tr>
                                <th colspan="2">Two-Tier Model</th>
                            </tr>
                            <tr>
                                <th>Score</th>
                                <th>Clinical Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>??</td>
                                <td>PE Unlikely - Consider D-dimer</td>
                            </tr>
                            <tr>
                                <td>??</td>
                                <td>PE Likely - Proceed to CTA</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="info-section mt-20">
                <h4>?? Evidence Appraisal</h4>
                <div class="formula-box">
                    <p><strong>Original Wells Study:</strong> Performed on cohorts where PE prevalence was approximately 30%.</p>
                    <ul>
                        <li><strong>Geneva Study:</strong> Validated with 12%-29% PE prevalence</li>
                        <li><strong>Largest Study Results:</strong>
                            <ul>
                                <li>Moderate score (2-6): 16.2% PE prevalence</li>
                                <li>High score (&gt;6): 37.5% PE prevalence</li>
                            </ul>
                        </li>
                    </ul>
                </div>
                
                <div class="formula-box mt-15">
                    <p><strong>Christopher Study - Two-Tier Approach:</strong></p>
                    <ul>
                        <li><strong>Score ?? ("PE unlikely"):</strong> D-dimer testing. Overall PE incidence: 12.1%</li>
                        <li><strong>Score ?? ("PE likely"):</strong> Direct CTA. PE diagnosis rate: 20.4%</li>
                        <li><strong>Missed PE rate:</strong> 0.5% at 3-month follow-up in "PE unlikely" group with negative D-dimer</li>
                    </ul>
                </div>
            </div>
            
            <div class="info-section mt-20">
                <h4>?? Reference</h4>
                <p>Wells PS, Anderson DR, Rodger M, et al. Derivation of a simple clinical model to categorize patients probability of pulmonary embolism: increasing the models utility with the SimpliRED D-dimer. <em>Thromb Haemost</em>. 2000;83(3):416-420.</p>
            </div>
        `;
    },
    initialize: function (client) {
        const container = document.querySelector('#calculator-container') || document.body;

        // Calculate function
        const calculate = () => {
            const checkboxes = container.querySelectorAll(
                '.checkbox-option input[type="checkbox"]'
            );
            let score = 0;
            checkboxes.forEach(box => {
                if (box.checked) {
                    score += parseFloat(box.dataset.points);
                }
            });

            let risk = '';
            let riskClass = '';
            let interpretation = '';
            let twoTierModel = '';

            if (score <= 1) {
                risk = 'Low Risk';
                riskClass = 'low';
                interpretation =
                    'PE is unlikely. Consider D-dimer testing. If negative, PE can be safely excluded.';
                twoTierModel = 'PE Unlikely (Score ??)';
            } else if (score <= 6) {
                risk = score <= 4 ? 'Low-Moderate Risk' : 'Moderate-High Risk';
                riskClass = score <= 4 ? 'moderate' : 'high';
                if (score <= 4) {
                    interpretation =
                        'PE is less likely but not excluded. Consider D-dimer testing before proceeding to imaging.';
                    twoTierModel = 'PE Unlikely (Score ??)';
                } else {
                    interpretation =
                        'PE is likely. Proceed directly to CT pulmonary angiography (CTPA) for definitive diagnosis.';
                    twoTierModel = 'PE Likely (Score ??)';
                }
            } else {
                risk = 'High Risk';
                riskClass = 'high';
                interpretation =
                    'PE is highly likely. Proceed directly to CT pulmonary angiography (CTPA). Consider empiric anticoagulation if no contraindications while awaiting imaging.';
                twoTierModel = 'PE Likely (Score ??)';
            }

            const resultEl = container.querySelector('#wells-result');
            resultEl.innerHTML = `
                <div class="result-header">
                    <h4>Wells' PE Score Results</h4>
                </div>
                
                <div class="result-score">
                    <span class="result-score-value">${score}</span>
                    <span class="result-score-unit">points</span>
                </div>
                
                <div class="result-item">
                    <span class="result-item-label">Three-Tier Model</span>
                    <span class="result-item-value"><span class="risk-badge ${riskClass}">${risk}</span></span>
                </div>
                
                <div class="result-item">
                    <span class="result-item-label">Two-Tier Model</span>
                    <span class="result-item-value">${twoTierModel}</span>
                </div>
                
                <div class="alert ${riskClass === 'high' ? 'warning' : 'info'} mt-20">
                    <span class="alert-icon">${riskClass === 'high' ? '? ï?' : '?¹ï?'}</span>
                    <div class="alert-content">
                        <p>${interpretation}</p>
                    </div>
                </div>
            `;
            resultEl.style.display = 'block';
            resultEl.classList.add('show');
        };

        // Auto-populate heart rate checkbox if available
        getMostRecentObservation(client, LOINC_CODES.HEART_RATE).then(hrObs => {
            if (hrObs && hrObs.valueQuantity && hrObs.valueQuantity.value > 100) {
                const hrCheckbox = container.querySelector('#wells-hr');
                if (hrCheckbox) {
                    hrCheckbox.checked = true;
                    hrCheckbox.parentElement.classList.add('selected');
                    // Recalculate after populating
                    calculate();
                }
            }
        });

        // Add visual feedback and auto-calculate
        const checkboxOptions = container.querySelectorAll('.checkbox-option');
        checkboxOptions.forEach(option => {
            const checkbox = option.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', function () {
                if (this.checked) {
                    option.classList.add('selected');
                } else {
                    option.classList.remove('selected');
                }
                // Auto-calculate
                calculate();
            });
        });

        // Initial calculation
        calculate();
    }
};
