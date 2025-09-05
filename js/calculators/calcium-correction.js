// js/calculators/calcium-correction.js
import { getMostRecentObservation } from '../utils.js';

export const calciumCorrection = {
    id: 'calcium-correction',
    title: 'Calcium Correction for Albumin',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <div class="input-group">
                <label for="ca-total">Total Calcium (mg/dL):</label>
                <input type="number" id="ca-total" placeholder="loading...">
            </div>
            <div class="input-group">
                <label for="ca-albumin">Albumin (g/dL):</label>
                <input type="number" id="ca-albumin" placeholder="loading...">
            </div>
            <button id="calculate-ca">Calculate</button>
            <div id="ca-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function(client) {
        getMostRecentObservation(client, '17861-6').then(obs => {
            if (obs) document.getElementById('ca-total').value = obs.valueQuantity.value.toFixed(1);
        });
        getMostRecentObservation(client, '1751-7').then(obs => {
            if (obs) document.getElementById('ca-albumin').value = obs.valueQuantity.value.toFixed(1);
        });

        document.getElementById('calculate-ca').addEventListener('click', () => {
            const totalCalcium = parseFloat(document.getElementById('ca-total').value);
            const albumin = parseFloat(document.getElementById('ca-albumin').value);
            const resultEl = document.getElementById('ca-result');

            if (totalCalcium > 0 && albumin > 0) {
                const correctedCalcium = totalCalcium + 0.8 * (4.0 - albumin);
                resultEl.innerHTML = `<p>Corrected Calcium: ${correctedCalcium.toFixed(2)} mg/dL</p>`;
                resultEl.style.display = 'block';
            } else {
                resultEl.innerText = 'Please enter valid Total Calcium and Albumin values.';
                resultEl.style.display = 'block';
            }
        });
    }
};

