import { getMostRecentObservation } from '../../utils.js';

// js/calculators/qsofa.js
export const qsofaScore = {
    id: 'qsofa',
    title: 'qSOFA Score for Sepsis',
    description:
        'Identifies patients with suspected infection at risk for poor outcomes (sepsis). Score ≥2 is positive.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            <div class="alert info">
                <span class="alert-icon">ℹ️</span>
                <div class="alert-content">
                    <div class="alert-title">Instructions</div>
                    <p>Check all criteria that apply. A score ≥2 suggests higher risk of mortality or prolonged ICU stay.</p>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">
                    <span class="section-title-icon">📋</span>
                    <span>qSOFA Criteria (check all that apply)</span>
                </div>
                
                <form id="qsofa-form">
                    <div class="checkbox-group">
                        <label class="checkbox-option">
                            <input type="checkbox" id="qsofa-rr" value="1">
                            <span>Respiratory Rate ≥ 22/min</span>
                        </label>
                        
                        <label class="checkbox-option">
                            <input type="checkbox" id="qsofa-ams" value="1">
                            <span>Altered Mental Status (GCS < 15)</span>
                        </label>
                        
                        <label class="checkbox-option">
                            <input type="checkbox" id="qsofa-sbp" value="1">
                            <span>Systolic Blood Pressure ≤ 100 mmHg</span>
                        </label>
                    </div>
                </form>
            </div>
            
            <div class="result-container" id="qsofa-result" style="display:none;"></div>
            
            <div class="info-section mt-30">
                <h4>📊 Interpretation</h4>
                <div class="formula-box">
                    <p><strong>qSOFA Score ≥ 2:</strong> Positive screen; suggests higher risk of poor outcomes in patients with suspected infection.</p>
                    <p><strong>qSOFA Score &lt; 2:</strong> Negative screen; lower risk but continue monitoring if infection suspected.</p>
                </div>
                <div class="formula-box mt-15">
                    <div class="formula-title">Next Steps for Positive qSOFA:</div>
                    <p>• Calculate full SOFA score<br>
                    • Measure serum lactate<br>
                    • Obtain blood cultures<br>
                    • Consider early antibiotic therapy<br>
                    • Assess for organ dysfunction</p>
                </div>
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        // If only one parameter is passed (old style), use it as container
        if (!container && typeof client === 'object' && client.nodeType === 1) {
            container = client;
        }

        // Use document if container is not a DOM element
        const root = container || document;

        // Calculate function
        const calculate = () => {
            const inputs = root.querySelectorAll('#qsofa-form input[type="checkbox"]:checked');
            const score = inputs.length;

            let interpretation = '';
            let riskBadgeClass = '';
            let severityClass = '';

            if (score >= 2) {
                interpretation =
                    'Positive qSOFA: Increased risk of poor outcomes. Consider further sepsis evaluation (SOFA score, lactate, blood cultures).';
                riskBadgeClass = 'high';
                severityClass = 'high';
            } else if (score === 1) {
                interpretation =
                    'Intermediate qSOFA: Monitor closely. Consider early intervention if clinical suspicion is high.';
                riskBadgeClass = 'moderate';
                severityClass = 'moderate';
            } else {
                interpretation =
                    'Negative qSOFA: Lower risk, but continue to monitor if infection is suspected.';
                riskBadgeClass = 'low';
                severityClass = 'low';
            }

            const resultEl = root.querySelector('#qsofa-result');
            resultEl.innerHTML = `
                <div class="result-header">
                    <h4>qSOFA Score Results</h4>
                </div>
                
                <div class="result-score">
                    <span class="result-score-value">${score}</span>
                    <span class="result-score-unit">/ 3 points</span>
                </div>
                
                <div class="risk-badge ${riskBadgeClass} mt-15">
                    ${score >= 2 ? 'Positive Screen' : score === 1 ? 'Intermediate' : 'Negative Screen'}
                </div>
                
                <div class="alert ${severityClass === 'high' ? 'warning' : 'info'} mt-20">
                    <span class="alert-icon">${score >= 2 ? '⚠️' : 'ℹ️'}</span>
                    <div class="alert-content">
                        <p>${interpretation}</p>
                    </div>
                </div>
            `;
            resultEl.style.display = 'block';
            resultEl.classList.add('show');
        };

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

        // Add visual feedback and auto-calculate for checkboxes
        const checkboxOptions = root.querySelectorAll('.checkbox-option');
        checkboxOptions.forEach(option => {
            const checkbox = option.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', function () {
                if (this.checked) {
                    option.classList.add('checked');
                } else {
                    option.classList.remove('checked');
                }
                // Auto-calculate
                calculate();
            });

            // Initialize state
            if (checkbox.checked) {
                option.classList.add('checked');
            }
        });

        // Initial calculation
        calculate();
    }
};
