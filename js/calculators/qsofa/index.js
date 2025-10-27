import { getMostRecentObservation } from '../../utils.js';

// js/calculators/qsofa.js
export const qsofaScore = {
    id: 'qsofa',
    title: 'qSOFA Score for Sepsis',
    description:
        'Identifies patients with suspected infection at risk for poor outcomes (sepsis). Score ≥2 is positive.',
    generateHTML: function () {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <form id="qsofa-form">
                <div class="checkbox-group">
                    <input type="checkbox" id="qsofa-rr" value="1">
                    <label for="qsofa-rr">Respiratory Rate ≥ 22/min</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" id="qsofa-ams" value="1">
                    <label for="qsofa-ams">Altered Mental Status (GCS < 15)</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" id="qsofa-sbp" value="1">
                    <label for="qsofa-sbp">Systolic Blood Pressure ≤ 100 mmHg</label>
                </div>
            </form>
            <button id="calculate-qsofa">Calculate Score</button>
            <div id="qsofa-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function (client, patient, container) {
        // If only one parameter is passed (old style), use it as container
        if (!container && typeof client === 'object' && client.nodeType === 1) {
            container = client;
        }

        // Use document if container is not a DOM element
        const root = container || document;

        const calculateBtn = root.querySelector('#calculate-qsofa');
        if (!calculateBtn) {
            console.error('Calculate button not found');
            return;
        }

        // Auto-populate respiratory rate
        getMostRecentObservation(client, '9279-1').then(obs => {
            if (obs && obs.valueQuantity) {
                const rr = obs.valueQuantity.value;
                const rrCheckbox = root.querySelector('#qsofa-rr');
                if (rr >= 22 && rrCheckbox) {
                    rrCheckbox.checked = true;
                }
            }
        });

        // Auto-populate systolic blood pressure
        getMostRecentObservation(client, '8480-6').then(obs => {
            if (obs && obs.valueQuantity) {
                const sbp = obs.valueQuantity.value;
                const sbpCheckbox = root.querySelector('#qsofa-sbp');
                if (sbp <= 100 && sbpCheckbox) {
                    sbpCheckbox.checked = true;
                }
            }
        });

        calculateBtn.addEventListener('click', () => {
            const inputs = root.querySelectorAll('#qsofa-form input[type="checkbox"]:checked');
            const score = inputs.length;

            let interpretation = '';
            let riskLevel = '';
            let bgColor = '';

            if (score >= 2) {
                interpretation =
                    'Positive qSOFA: Increased risk of poor outcomes. Consider further sepsis evaluation (SOFA score, lactate, blood cultures).';
                riskLevel = 'High Risk';
                bgColor = '#dc3545';
            } else if (score === 1) {
                interpretation =
                    'Intermediate qSOFA: Monitor closely. Consider early intervention if clinical suspicion is high.';
                riskLevel = 'Moderate Risk';
                bgColor = '#ffc107';
            } else {
                interpretation =
                    'Negative qSOFA: Lower risk, but continue to monitor if infection is suspected.';
                riskLevel = 'Low Risk';
                bgColor = '#28a745';
            }

            const resultEl = root.querySelector('#qsofa-result');
            resultEl.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <h3 style="margin: 0 0 10px 0; color: #333;">qSOFA Score</h3>
                    <div style="font-size: 3em; font-weight: bold; color: ${bgColor}; margin: 15px 0;">
                        ${score}
                    </div>
                    <div style="display: inline-block; padding: 8px 16px; background: ${bgColor}; color: white; border-radius: 20px; font-weight: 600; margin: 10px 0;">
                        ${riskLevel}
                    </div>
                    <p style="font-size: 1em; margin: 15px 0 0 0; color: #495057; line-height: 1.5;">
                        ${interpretation}
                    </p>
                </div>
                <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; font-size: 0.9em; color: #666;">
                    <strong>qSOFA Criteria:</strong><br>
                    • Respiratory rate ≥ 22/min<br>
                    • Altered mental status (GCS < 15)<br>
                    • Systolic BP ≤ 100 mmHg<br><br>
                    <strong>Score ≥ 2</strong> suggests higher risk of mortality or prolonged ICU stay
                </div>
            `;
            resultEl.style.display = 'block';
            resultEl.style.backgroundColor =
                score >= 2 ? '#f8d7da' : score === 1 ? '#fff3cd' : '#d4edda';
            resultEl.style.borderColor =
                score >= 2 ? '#f5c6cb' : score === 1 ? '#ffc107' : '#c3e6cb';
        });
    }
};
