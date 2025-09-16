// js/calculators/homa-ir.js
import { getMostRecentObservation } from '../../utils.js';

export const homaIr = {
    id: 'homa-ir',
    title: 'HOMA-IR (Homeostatic Model Assessment for Insulin Resistance)',
    description: 'Approximates insulin resistance.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p>${this.description}</p>
            <div class="input-group">
                <label for="homa-glucose">Fasting Glucose (mg/dL):</label>
                <input type="number" id="homa-glucose" placeholder="loading...">
            </div>
            <div class="input-group">
                <label for="homa-insulin">Fasting Insulin (µU/mL):</label>
                <input type="number" id="homa-insulin" placeholder="loading...">
            </div>
            <button id="calculate-homa-ir">Calculate HOMA-IR</button>
            <div id="homa-ir-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function(client) {
        // LOINC: Fasting Glucose: 2339-0, Insulin: 20448-7
        getMostRecentObservation(client, '2339-0').then(obs => {
            if(obs) document.getElementById('homa-glucose').value = obs.valueQuantity.value.toFixed(0);
            else document.getElementById('homa-glucose').placeholder = 'e.g., 95';
        });
        getMostRecentObservation(client, '20448-7').then(obs => {
            if(obs) document.getElementById('homa-insulin').value = obs.valueQuantity.value.toFixed(1);
            else document.getElementById('homa-insulin').placeholder = 'e.g., 10';
        });

        document.getElementById('calculate-homa-ir').addEventListener('click', () => {
            const glucose = parseFloat(document.getElementById('homa-glucose').value);
            const insulin = parseFloat(document.getElementById('homa-insulin').value);
            const resultEl = document.getElementById('homa-ir-result');

            if (glucose > 0 && insulin > 0) {
                const homaIrScore = (glucose * insulin) / 405;
                let interpretation = '';
                if (homaIrScore > 2.9) {
                    interpretation = 'High likelihood of insulin resistance.';
                } else if (homaIrScore > 1.9) {
                    interpretation = 'Early insulin resistance is likely.';
                } else {
                    interpretation = 'Optimal insulin sensitivity.';
                }
                
                resultEl.innerHTML = `
                    <p>HOMA-IR Score: ${homaIrScore.toFixed(2)}</p>
                    <p><strong>Interpretation:</strong> ${interpretation}</p>
                `;
                resultEl.style.display = 'block';
            } else {
                resultEl.innerText = 'Please enter valid glucose and insulin values.';
                resultEl.style.display = 'block';
            }
        });
    }
};
