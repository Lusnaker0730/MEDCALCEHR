export const wellsDVT = {
    id: 'wells-dvt',
    title: "Wells' Criteria for DVT",
    description: 'Calculates risk of deep vein thrombosis (DVT) based on clinical criteria.',
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
                    <p>Check all criteria that apply to the patient. Score ranges from -2 to +9 points.</p>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">
                    <span class="section-title-icon">📋</span>
                    <span>Clinical Criteria</span>
                </div>
                
                <div class="checkbox-group">
                    <label class="checkbox-option">
                        <input type="checkbox" id="dvt-cancer" data-points="1">
                        <span>Active cancer (treatment or palliation within 6 months) <strong>+1</strong></span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" id="dvt-paralysis" data-points="1">
                        <span>Paralysis, paresis, or recent plaster immobilization of the lower extremities <strong>+1</strong></span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" id="dvt-bedridden" data-points="1">
                        <span>Recently bedridden > 3 days or major surgery within 12 weeks requiring general or regional anesthesia <strong>+1</strong></span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" id="dvt-tenderness" data-points="1">
                        <span>Localized tenderness along the deep venous system <strong>+1</strong></span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" id="dvt-swelling" data-points="1">
                        <span>Entire leg swollen <strong>+1</strong></span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" id="dvt-calf" data-points="1">
                        <span>Calf swelling at least 3 cm larger than asymptomatic side <strong>+1</strong></span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" id="dvt-pitting" data-points="1">
                        <span>Pitting edema confined to the symptomatic leg <strong>+1</strong></span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" id="dvt-collateral" data-points="1">
                        <span>Collateral superficial veins (nonvaricose) <strong>+1</strong></span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" id="dvt-previous" data-points="1">
                        <span>Previously documented DVT <strong>+1</strong></span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" id="dvt-alternative" data-points="-2">
                        <span>Alternative diagnosis at least as likely as DVT <strong>-2</strong></span>
                    </label>
                </div>
            </div>
            
            <div class="result-container" id="wells-dvt-result" style="display:none;"></div>
            
            <div class="info-section mt-30">
                <h4>📊 Interpretation</h4>
                <div class="data-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Score</th>
                                <th>Risk Category</th>
                                <th>Clinical Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>≥3</td>
                                <td><span class="risk-badge high">High Risk</span></td>
                                <td>DVT likely - Consider imaging</td>
                            </tr>
                            <tr>
                                <td>1-2</td>
                                <td><span class="risk-badge moderate">Moderate Risk</span></td>
                                <td>Consider D-dimer and/or imaging</td>
                            </tr>
                            <tr>
                                <td>≤0</td>
                                <td><span class="risk-badge low">Low Risk</span></td>
                                <td>DVT unlikely - Consider D-dimer</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="info-section mt-20">
                <h4>📚 Reference</h4>
                <p>Wells PS, Anderson DR, Bormanis J, et al. Value of assessment of pretest probability of deep-vein thrombosis in clinical management. <em>Lancet</em>. 1997;350(9094):1795-1798.</p>
            </div>
        `;
    },
    initialize: function () {
        const container = document.querySelector('#calculator-container') || document.body;

        // Calculate function
        const calculate = () => {
            const checkboxes = container.querySelectorAll(
                '.checkbox-option input[type="checkbox"]'
            );
            let score = 0;
            checkboxes.forEach(box => {
                if (box.checked) {
                    score += parseInt(box.dataset.points);
                }
            });

            let risk = '';
            let riskClass = '';
            let interpretation = '';

            if (score >= 3) {
                risk = 'High Risk';
                riskClass = 'high';
                interpretation =
                    'DVT is likely. Ultrasound imaging of the lower extremity is recommended. Consider anticoagulation while awaiting results if bleeding risk is low.';
            } else if (score >= 1) {
                risk = 'Moderate Risk';
                riskClass = 'moderate';
                interpretation =
                    'Moderate probability of DVT. Consider D-dimer testing and/or ultrasound imaging based on clinical judgment and D-dimer availability.';
            } else {
                risk = 'Low Risk';
                riskClass = 'low';
                interpretation =
                    'DVT is unlikely. Consider D-dimer testing. If D-dimer is negative, DVT can be safely excluded in most cases.';
            }

            const resultEl = container.querySelector('#wells-dvt-result');
            resultEl.innerHTML = `
                <div class="result-header">
                    <h4>Wells' DVT Score Results</h4>
                </div>
                
                <div class="result-score">
                    <span class="result-score-value">${score}</span>
                    <span class="result-score-unit">points</span>
                </div>
                
                <div class="risk-badge ${riskClass} mt-15">
                    ${risk}
                </div>
                
                <div class="alert ${riskClass === 'high' ? 'warning' : 'info'} mt-20">
                    <span class="alert-icon">${riskClass === 'high' ? '⚠️' : 'ℹ️'}</span>
                    <div class="alert-content">
                        <p>${interpretation}</p>
                    </div>
                </div>
            `;
            resultEl.style.display = 'block';
            resultEl.classList.add('show');
        };

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
