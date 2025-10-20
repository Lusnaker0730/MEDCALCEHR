// js/calculators/wells-pe.js
import { getMostRecentObservation } from '../../utils.js';

export const wellsPE = {
    id: 'wells-pe',
    title: "Wells' Criteria for Pulmonary Embolism",
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <div class="checklist">
                <div class="check-item"><input type="checkbox" id="wells-dvt" data-points="3"><label for="wells-dvt">Clinical signs and symptoms of DVT</label></div>
                <div class="check-item"><input type="checkbox" id="wells-alt" data-points="3"><label for="wells-alt">PE is #1 diagnosis OR equally likely</label></div>
                <div class="check-item"><input type="checkbox" id="wells-hr" data-points="1.5"><label for="wells-hr">Heart rate > 100 bpm</label></div>
                <div class="check-item"><input type="checkbox" id="wells-immo" data-points="1.5"><label for="wells-immo">Immobilization (≥3d) or surgery in previous 4 weeks</label></div>
                <div class="check-item"><input type="checkbox" id="wells-prev" data-points="1.5"><label for="wells-prev">Previous, objectively diagnosed PE or DVT</label></div>
                <div class="check-item"><input type="checkbox" id="wells-hemo" data-points="1"><label for="wells-hemo">Hemoptysis</label></div>
                <div class="check-item"><input type="checkbox" id="wells-mal" data-points="1"><label for="wells-mal">Malignancy (with treatment within 6 mo, or palliative)</label></div>
            </div>
            <button id="calculate-wells">Calculate Score</button>
            <div id="wells-result" class="result" style="display:none;"></div>

            <!-- Facts & Figures Section -->
            <div class="wells-info-section" style="margin-top: 40px; padding: 25px; background: #f5f5f5; border-radius: 10px; border-left: 4px solid #667eea;">
                <h4 style="margin-top: 0; color: #333; font-size: 1.2em; margin-bottom: 20px;">📊 FACTS & FIGURES</h4>
                
                <div style="margin-bottom: 25px;">
                    <h5 style="color: #667eea; margin-bottom: 12px; font-weight: 600;">Score Interpretation:</h5>
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.9em;">
                        <tr style="background: #e8eef7;">
                            <td style="border: 1px solid #ddd; padding: 10px; font-weight: 600;">Score</td>
                            <td style="border: 1px solid #ddd; padding: 10px; font-weight: 600;">Risk Category</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 10px;"><strong>Three-Tier Model</strong></td>
                            <td style="border: 1px solid #ddd; padding: 10px;"></td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 10px;">0 - 1</td>
                            <td style="border: 1px solid #ddd; padding: 10px;">Low Risk</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 10px;">2 - 6</td>
                            <td style="border: 1px solid #ddd; padding: 10px;">Moderate Risk</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 10px;">&gt;6</td>
                            <td style="border: 1px solid #ddd; padding: 10px;">High Risk</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 10px;"><strong>Two Tier Model</strong></td>
                            <td style="border: 1px solid #ddd; padding: 10px;"></td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 10px;">≤4</td>
                            <td style="border: 1px solid #ddd; padding: 10px;">PE Unlikely (with d-dimer)</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #ddd; padding: 10px;">≥5</td>
                            <td style="border: 1px solid #ddd; padding: 10px;">PE Likely (with CTA)</td>
                        </tr>
                    </table>
                </div>

                <h4 style="color: #333; font-size: 1.1em; margin-top: 30px; margin-bottom: 15px;">📋 EVIDENCE APPRAISAL</h4>
                <ul style="margin: 0; padding-left: 20px; line-height: 1.8; font-size: 0.9em; color: #333;">
                    <li>The original Wells study was performed on cohorts where prevalence of PE was high: approximately 30%. Two further emergency department studies validated this tool:
                        <ul style="margin-top: 8px; padding-left: 20px;">
                            <li style="margin-top: 5px;">Geneva: 12%-29% PE prevalence</li>
                        </ul>
                    </li>
                    <li style="margin-top: 12px;">The largest study demonstrated risk stratification with:
                        <ul style="margin-top: 8px; padding-left: 20px;">
                            <li style="margin-top: 5px;">Moderate score of 2-6 having a 16.2% prevalence.</li>
                            <li style="margin-top: 5px;">High score of >6 having a 37.5% prevalence.</li>
                        </ul>
                    </li>
                    <li style="margin-top: 12px;"><strong>The Christopher study divided the Wells scoring system into 2 categories:</strong>
                        <ul style="margin-top: 8px; padding-left: 20px;">
                            <li style="margin-top: 5px;">A score of 4 or less was defined as "PE unlikely" and scored with a d-dimer</li>
                            <li style="margin-top: 5px;">A score of 5 or more was defined as "PE likely" and went straight to CTA</li>
                        </ul>
                    </li>
                    <li style="margin-top: 12px;"><strong>Overall incidence of PE was 12.1% in the "unlikely" group.</strong></li>
                    <li style="margin-top: 12px;">If dimer was negative no further testing was performed.</li>
                    <li style="margin-top: 12px;"><strong>20.4% of all patients who went to CTA had a diagnosis of PE.</strong></li>
                    <li style="margin-top: 12px;">In the "PE unlikely" group: subsequent CTA had an incidence of missed PE on 3 month follow up of 0.5%.</li>
                </ul>
            </div>
        `;
    },
    initialize: function(client) {
        getMostRecentObservation(client, '8867-4').then(hrObs => {
            if (hrObs && hrObs.valueQuantity.value > 100) {
                document.getElementById('wells-hr').checked = true;
            }
        });

        document.getElementById('calculate-wells').addEventListener('click', () => {
            const checkboxes = document.querySelectorAll('.calculator-card .check-item input[type="checkbox"]');
            let score = 0;
            checkboxes.forEach(box => {
                if (box.checked) {
                    score += parseFloat(box.dataset.points);
                }
            });

            let risk = '';
            if (score <= 1) risk = 'Low Risk (PE unlikely)';
            else if (score <= 6) risk = 'Moderate Risk';
            else risk = 'High Risk (PE likely)';

            const resultEl = document.getElementById('wells-result');
            resultEl.innerHTML = `
                <p>Wells' Score: ${score}</p>
                <p>${risk}</p>
            `;
            resultEl.style.display = 'block';
        });
    }
};


