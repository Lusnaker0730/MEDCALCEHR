
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
    initialize: function(container) {
        container.querySelector('#calculate-ranson').addEventListener('click', () => {
            const inputs = container.querySelectorAll('#ranson-form input[type="checkbox"]:checked');
            const score = inputs.length;
            
            let mortality = '';
            if (score <= 2) {
                mortality = '~0-3%';
            } else if (score <= 4) {
                mortality = '~15-20%';
            } else if (score <= 6) {
                mortality = '~40%';
            } else {
                mortality = '>50% to 100%';
            }

            const resultEl = container.querySelector('#ranson-result');
            resultEl.innerHTML = `<p>Ranson Score: ${score}</p><p>Estimated Mortality: ${mortality}</p>`;
            resultEl.style.display = 'block';
        });
    }
};
