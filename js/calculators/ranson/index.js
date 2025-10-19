
// js/calculators/ranson.js
export const ransonScore = {
    id: 'ranson-score',
    title: 'Ranson Score for Pancreatitis',
    description: 'Predicts severity and mortality of acute pancreatitis (for non-gallstone cases).',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <form id="ranson-form">
                <h4>At Admission or On Diagnosis</h4>
                <div class="checkbox-group">
                    <input type="checkbox" id="ranson-age" value="1"><label for="ranson-age">Age > 55 years</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" id="ranson-wbc" value="1"><label for="ranson-wbc">WBC count > 16,000/mm³</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" id="ranson-glucose" value="1"><label for="ranson-glucose">Blood glucose > 200 mg/dL</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" id="ranson-ast" value="1"><label for="ranson-ast">Serum AST > 250 IU/L</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" id="ranson-ldh" value="1"><label for="ranson-ldh">Serum LDH > 350 IU/L</label>
                </div>

                <h4>During Initial 48 Hours</h4>
                <div class="checkbox-group">
                    <input type="checkbox" id="ranson-calcium" value="1"><label for="ranson-calcium">Serum calcium < 8.0 mg/dL</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" id="ranson-hct" value="1"><label for="ranson-hct">Hematocrit fall > 10%</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" id="ranson-paO2" value="1"><label for="ranson-paO2">PaO₂ < 60 mmHg</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" id="ranson-bun" value="1"><label for="ranson-bun">BUN increase > 5 mg/dL</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" id="ranson-base" value="1"><label for="ranson-base">Base deficit > 4 mEq/L</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" id="ranson-fluid" value="1"><label for="ranson-fluid">Fluid sequestration > 6 L</label>
                </div>
            </form>
            <button id="calculate-ranson">Calculate Score</button>
            <div id="ranson-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function(client, patient, container) {
        // If only one parameter is passed (old style), use it as container
        if (!container && typeof client === 'object' && client.nodeType === 1) {
            container = client;
        }
        
        // Use document if container is not a DOM element
        const root = container || document;
        
        const calculateBtn = root.querySelector('#calculate-ranson');
        if (!calculateBtn) {
            console.error('Calculate button not found');
            return;
        }
        
        calculateBtn.addEventListener('click', () => {
            const inputs = root.querySelectorAll('#ranson-form input[type="checkbox"]:checked');
            const score = inputs.length;
            
            let mortality = '';
            let riskLevel = '';
            let bgColor = '';
            
            if (score <= 2) {
                mortality = '~0-3%';
                riskLevel = 'Low Risk';
                bgColor = '#28a745';
            } else if (score <= 4) {
                mortality = '~15-20%';
                riskLevel = 'Moderate Risk';
                bgColor = '#ffc107';
            } else if (score <= 6) {
                mortality = '~40%';
                riskLevel = 'High Risk';
                bgColor = '#fd7e14';
            } else {
                mortality = '>50% to 100%';
                riskLevel = 'Very High Risk';
                bgColor = '#dc3545';
            }

            const resultEl = root.querySelector('#ranson-result');
            resultEl.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <h3 style="margin: 0 0 10px 0; color: #333;">Ranson's Criteria Score</h3>
                    <div style="font-size: 3em; font-weight: bold; color: ${bgColor}; margin: 15px 0;">
                        ${score}
                    </div>
                    <div style="display: inline-block; padding: 8px 16px; background: ${bgColor}; color: white; border-radius: 20px; font-weight: 600; margin: 10px 0;">
                        ${riskLevel}
                    </div>
                    <p style="font-size: 1.2em; margin: 15px 0 0 0; color: #495057;">
                        <strong>Estimated Mortality:</strong> ${mortality}
                    </p>
                </div>
                <div style="margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; font-size: 0.9em; color: #666;">
                    <strong>Mortality by Score:</strong><br>
                    0-2: 0-3% mortality<br>
                    3-4: 15-20% mortality<br>
                    5-6: ~40% mortality<br>
                    ≥7: >50% mortality
                </div>
            `;
            resultEl.style.display = 'block';
            resultEl.style.backgroundColor = score <= 2 ? '#d4edda' : (score <= 4 ? '#fff3cd' : (score <= 6 ? '#fff3cd' : '#f8d7da'));
            resultEl.style.borderColor = score <= 2 ? '#c3e6cb' : (score <= 4 ? '#ffc107' : (score <= 6 ? '#fd7e14' : '#f5c6cb'));
        });
    }
};
