// js/calculators/sofa.js
import { getMostRecentObservation } from '../../utils.js';

export const sofa = {
    id: 'sofa',
    title: 'Sequential Organ Failure Assessment (SOFA) Score',
    description: 'Predicts ICU mortality based on lab results and clinical data.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p>${this.description}</p>

            <div class="sofa-grid">
                <!-- Respiration -->
                <div class="sofa-item">
                    <label>Respiration (PaO₂/FiO₂)</label>
                    <select id="sofa-resp">
                        <option value="4" data-label="<100 with respiratory support">&ge;400</option>
                        <option value="3" data-label="<200 with respiratory support">&lt;400</option>
                        <option value="2">&lt;300</option>
                        <option value="1">&lt;200 with respiratory support</option>
                        <option value="0">&lt;100 with respiratory support</option>
                    </select>
                </div>

                <!-- Coagulation -->
                <div class="sofa-item">
                    <label>Coagulation (Platelets x10³/µL)</label>
                    <select id="sofa-coag">
                        <option value="4">&ge;150</option>
                        <option value="3">&lt;150</option>
                        <option value="2">&lt;100</option>
                        <option value="1">&lt;50</option>
                        <option value="0">&lt;20</option>
                    </select>
                </div>

                <!-- Liver -->
                <div class="sofa-item">
                    <label>Liver (Bilirubin mg/dL)</label>
                    <select id="sofa-liver">
                        <option value="4">&lt;1.2</option>
                        <option value="3">1.2-1.9</option>
                        <option value="2">2.0-5.9</option>
                        <option value="1">6.0-11.9</option>
                        <option value="0">&ge;12.0</option>
                    </select>
                </div>

                <!-- Cardiovascular -->
                <div class="sofa-item">
                    <label>Cardiovascular (Hypotension)</label>
                    <select id="sofa-cardio">
                        <option value="4">No hypotension</option>
                        <option value="3">MAP &lt;70 mmHg</option>
                        <option value="2">Dopamine &le;5 or Dobutamine (any dose)</option>
                        <option value="1">Dopamine >5 or Epinephrine &le;0.1 or Norepinephrine &le;0.1</option>
                        <option value="0">Dopamine >15 or Epinephrine >0.1 or Norepinephrine >0.1</option>
                    </select>
                </div>

                <!-- CNS -->
                <div class="sofa-item">
                    <label>CNS (Glasgow Coma Scale)</label>
                    <select id="sofa-cns">
                        <option value="4">15</option>
                        <option value="3">13-14</option>
                        <option value="2">10-12</option>
                        <option value="1">6-9</option>
                        <option value="0"> &lt;6</option>
                    </select>
                </div>

                <!-- Renal -->
                <div class="sofa-item">
                    <label>Renal (Creatinine mg/dL)</label>
                    <select id="sofa-renal">
                        <option value="4">&lt;1.2</option>
                        <option value="3">1.2-1.9</option>
                        <option value="2">2.0-3.4</option>
                        <option value="1">3.5-4.9</option>
                        <option value="0">&ge;5.0 or Urine output &lt;200 mL/day</option>
                    </select>
                </div>
            </div>

            <button id="calculate-sofa">Calculate SOFA Score</button>
            <div id="sofa-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function(client) {
        // Attempt to pre-fill some values
        // Note: Full automation would require a lot of different observations.
        // This is a simplified pre-fill.
        getMostRecentObservation(client, '2160-0').then(platelets => { // Platelets
            if(platelets) {
                const val = platelets.valueQuantity.value;
                const select = document.getElementById('sofa-coag');
                if (val < 20) select.value = "0";
                else if (val < 50) select.value = "1";
                else if (val < 100) select.value = "2";
                else if (val < 150) select.value = "3";
                else select.value = "4";
            }
        });
        getMostRecentObservation(client, '21232-4').then(creatinine => { // Creatinine
            if(creatinine) {
                const val = creatinine.valueQuantity.value;
                const select = document.getElementById('sofa-renal');
                if (val >= 5.0) select.value = "0";
                else if (val >= 3.5) select.value = "1";
                else if (val >= 2.0) select.value = "2";
                else if (val >= 1.2) select.value = "3";
                else select.value = "4";
            }
        });

        document.getElementById('calculate-sofa').addEventListener('click', () => {
            let score = 0;
            const selectors = ['sofa-resp', 'sofa-coag', 'sofa-liver', 'sofa-cardio', 'sofa-cns', 'sofa-renal'];
            selectors.forEach(id => {
                score += (4 - parseInt(document.getElementById(id).value));
            });
            
            // Mortality correlation is complex, often based on change in score.
            // Here we'll just show the score.
            const resultEl = document.getElementById('sofa-result');
            resultEl.innerHTML = `
                <p><strong>Total SOFA Score:</strong> ${score}</p>
                <small><em>A higher score is associated with increased mortality. A score change (ΔSOFA) over 48h is also a key predictor.</em></small>
            `;
            resultEl.style.display = 'block';
        });
    }
};
