import { getMostRecentObservation, calculateAge } from '../../utils.js';

// js/calculators/ranson.js
export const ransonScore = {
    id: 'ranson-score',
    title: 'Ranson Score for Pancreatitis',
    description: 'Predicts severity and mortality of acute pancreatitis (for non-gallstone cases).',
    generateHTML: function () {
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
            <div id="ranson-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function (client, patient, container) {
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

        // Auto-populate age
        const age = calculateAge(patient.birthDate);
        const ageCheckbox = root.querySelector('#ranson-age');
        if (age > 55 && ageCheckbox) {
            ageCheckbox.checked = true;
        }

        // Auto-populate WBC
        getMostRecentObservation(client, '6690-2').then(obs => {
            if (obs && obs.valueQuantity) {
                const wbc = obs.valueQuantity.value * 1000; // Convert from K/uL to /mm³
                const wbcCheckbox = root.querySelector('#ranson-wbc');
                if (wbc > 16000 && wbcCheckbox) {
                    wbcCheckbox.checked = true;
                }
            }
        });

        // Auto-populate glucose
        getMostRecentObservation(client, '2345-7').then(obs => {
            if (obs && obs.valueQuantity) {
                let glucose = obs.valueQuantity.value;
                // Convert if needed (mmol/L to mg/dL: multiply by 18.0182)
                if (obs.valueQuantity.unit === 'mmol/L') {
                    glucose = glucose * 18.0182;
                }
                const glucoseCheckbox = root.querySelector('#ranson-glucose');
                if (glucose > 200 && glucoseCheckbox) {
                    glucoseCheckbox.checked = true;
                }
            }
        });

        // Auto-populate AST
        getMostRecentObservation(client, '1920-8').then(obs => {
            if (obs && obs.valueQuantity) {
                const ast = obs.valueQuantity.value;
                const astCheckbox = root.querySelector('#ranson-ast');
                if (ast > 250 && astCheckbox) {
                    astCheckbox.checked = true;
                }
            }
        });

        // Auto-populate LDH
        getMostRecentObservation(client, '2532-0').then(obs => {
            if (obs && obs.valueQuantity) {
                const ldh = obs.valueQuantity.value;
                const ldhCheckbox = root.querySelector('#ranson-ldh');
                if (ldh > 350 && ldhCheckbox) {
                    ldhCheckbox.checked = true;
                }
            }
        });

        // Auto-populate calcium
        getMostRecentObservation(client, '17861-6').then(obs => {
            if (obs && obs.valueQuantity) {
                let calcium = obs.valueQuantity.value;
                // Convert if needed (mmol/L to mg/dL: multiply by 4.008)
                if (obs.valueQuantity.unit === 'mmol/L') {
                    calcium = calcium * 4.008;
                }
                const calciumCheckbox = root.querySelector('#ranson-calcium');
                if (calcium < 8.0 && calciumCheckbox) {
                    calciumCheckbox.checked = true;
                }
            }
        });

        const calculate = () => {
            const inputs = root.querySelectorAll('#ranson-form input[type="checkbox"]:checked');
            const score = inputs.length;

            let mortality = '';
            let severity = '';
            let alertClass = '';

            if (score <= 2) {
                mortality = '~0-3%';
                severity = 'Low Risk';
                alertClass = 'success';
            } else if (score <= 4) {
                mortality = '~15-20%';
                severity = 'Moderate Risk';
                alertClass = 'warning';
            } else if (score <= 6) {
                mortality = '~40%';
                severity = 'High Risk';
                alertClass = 'danger';
            } else {
                mortality = '>50% to 100%';
                severity = 'Very High Risk';
                alertClass = 'danger';
            }

            const resultEl = root.querySelector('#ranson-result');
            resultEl.innerHTML = `
                <div class="result-header"><h4>Ranson Score Result</h4></div>
                <div class="result-score">
                    <span class="score-value">${score}</span>
                    <span class="score-label">/ 11 points</span>
                </div>
                <div class="severity-indicator ${alertClass}">
                    <strong>${severity}</strong>
                </div>
                <div class="result-item">
                    <span class="label">Estimated Mortality:</span>
                    <span class="value">${mortality}</span>
                </div>
                <div class="alert ${alertClass}">
                    <span class="alert-icon">${alertClass === 'success' ? '✓' : '⚠'}</span>
                    <div class="alert-content">
                        <p><strong>Mortality by Score:</strong> 0-2: 0-3% | 3-4: 15-20% | 5-6: ~40% | ≥7: >50%</p>
                    </div>
                </div>
            `;
            resultEl.style.display = 'block';
        };

        // Add event listeners to all checkboxes
        root.querySelectorAll('#ranson-form input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', calculate);
        });

        calculate();
    }
};
