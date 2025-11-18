// js/calculators/perc.js
import { calculateAge } from '../../utils.js';

export const perc = {
    id: 'perc',
    title: 'PERC Rule for Pulmonary Embolism',
    description: 'Rules out PE if no criteria are present and pre-test probability is ≤15%.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            <div class="alert warning">
                <span class="alert-icon">⚠</span>
                <div class="alert-content">
                    <p><strong>Important:</strong> PERC is only valid when pre-test probability for PE is ≤15%.</p>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title"><span>PERC Criteria</span></div>
                <div class="checkbox-group">
                    <label class="checkbox-option"><input type="checkbox" id="age50"><span>Age ≥ 50 years</span></label>
                    <label class="checkbox-option"><input type="checkbox" id="hr100"><span>Heart rate ≥ 100 bpm</span></label>
                    <label class="checkbox-option"><input type="checkbox" id="o2sat"><span>Room air SaO₂ < 95%</span></label>
                    <label class="checkbox-option"><input type="checkbox" id="hemoptysis"><span>Hemoptysis (coughing up blood)</span></label>
                    <label class="checkbox-option"><input type="checkbox" id="exogenous-estrogen"><span>Exogenous estrogen use</span></label>
                    <label class="checkbox-option"><input type="checkbox" id="prior-dvt-pe"><span>History of DVT or PE</span></label>
                    <label class="checkbox-option"><input type="checkbox" id="unilateral-swelling"><span>Unilateral leg swelling</span></label>
                    <label class="checkbox-option"><input type="checkbox" id="trauma-surgery"><span>Recent trauma or surgery requiring hospitalization</span></label>
                </div>
            </div>
            
            <div id="perc-result" class="result-container"></div>
        `;
    },
    initialize: function (client, patient, container) {
        const calculate = () => {
            const criteriaMet = [];
            container.querySelectorAll('.checkbox-option input[type="checkbox"]').forEach(box => {
                if (box.checked) {
                    criteriaMet.push(box.id);
                }
            });

            const resultEl = container.querySelector('#perc-result');
            if (criteriaMet.length === 0) {
                resultEl.innerHTML = `
                    <div class="result-header"><h4>PERC Rule Result</h4></div>
                    <div class="severity-indicator success">
                        <strong>PERC Negative</strong>
                    </div>
                    <div class="alert success">
                        <span class="alert-icon">✓</span>
                        <div class="alert-content">
                            <p><strong>Result:</strong> PE may be ruled out. No further testing is indicated if pre-test probability is low (≤15%).</p>
                        </div>
                    </div>
                `;
            } else {
                resultEl.innerHTML = `
                    <div class="result-header"><h4>PERC Rule Result</h4></div>
                    <div class="severity-indicator danger">
                        <strong>PERC Positive</strong>
                    </div>
                    <div class="result-item">
                        <span class="label">Criteria Met:</span>
                        <span class="value">${criteriaMet.length} / 8</span>
                    </div>
                    <div class="alert danger">
                        <span class="alert-icon">⚠</span>
                        <div class="alert-content">
                            <p><strong>Result:</strong> The rule is positive. PE is NOT ruled out. Further testing (e.g., D-dimer, imaging) should be considered.</p>
                        </div>
                    </div>
                `;
            }
            resultEl.style.display = 'block';
        };

        // Pre-fill age
        if (patient && patient.birthDate) {
        const age = calculateAge(patient.birthDate);
        if (age >= 50) {
            container.querySelector('#age50').checked = true;
            }
        }

        // Pre-fill heart rate and O2 saturation from most recent vitals
        if (client && patient && patient.id) {
        client
            .request(`Observation?patient=${patient.id}&code=85353-1&_sort=-date&_count=1`)
            .then(response => {
                if (response.entry && response.entry.length > 0) {
                    const vitals = response.entry[0].resource;
                    const hrComponent = vitals.component.find(
                        c => c.code.coding[0].code === '8867-4'
                    );
                    const o2Component = vitals.component.find(
                        c => c.code.coding[0].code === '59408-5'
                    );

                    if (hrComponent && hrComponent.valueQuantity.value >= 100) {
                        container.querySelector('#hr100').checked = true;
                    }
                    if (o2Component && o2Component.valueQuantity.value < 95) {
                        container.querySelector('#o2sat').checked = true;
                    }
                    calculate();
                }
            });
        }

        // Visual feedback and auto-calculation
        container.querySelectorAll('.checkbox-option').forEach(option => {
            const checkbox = option.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    option.classList.add('selected');
                } else {
                    option.classList.remove('selected');
                }
                calculate();
            });
            if (checkbox.checked) {
                option.classList.add('selected');
            }
        });

        calculate();
    }
};
