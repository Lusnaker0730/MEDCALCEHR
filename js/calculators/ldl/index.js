// js/calculators/ldl.js
import { getMostRecentObservation } from '../../utils.js';

export const ldl = {
    id: 'ldl',
    title: 'LDL Calculated',
    description: 'Calculates LDL based on total and HDL cholesterol and triglycerides.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p>${this.description}</p>
            <div class="input-group">
                <label for="total-chol">Total Cholesterol (mg/dL):</label>
                <input type="number" id="total-chol" placeholder="loading...">
            </div>
            <div class="input-group">
                <label for="hdl-chol">HDL Cholesterol (mg/dL):</label>
                <input type="number" id="hdl-chol" placeholder="loading...">
            </div>
            <div class="input-group">
                <label for="trig">Triglycerides (mg/dL):</label>
                <input type="number" id="trig" placeholder="loading...">
            </div>
            <button id="calculate-ldl">Calculate LDL</button>
            <div id="ldl-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function(client) {
        // LOINC codes: Total Chol: 2093-3, HDL: 2085-9, Trig: 2571-8
        const totalCholPromise = getMostRecentObservation(client, '2093-3');
        const hdlCholPromise = getMostRecentObservation(client, '2085-9');
        const trigPromise = getMostRecentObservation(client, '2571-8');

        Promise.all([totalCholPromise, hdlCholPromise, trigPromise]).then(([totalChol, hdl, trig]) => {
            const totalCholInput = document.getElementById('total-chol');
            const hdlCholInput = document.getElementById('hdl-chol');
            const trigInput = document.getElementById('trig');

            if (totalChol) totalCholInput.value = totalChol.valueQuantity.value.toFixed(0);
            else totalCholInput.placeholder = "e.g., 200";
            
            if (hdl) hdlCholInput.value = hdl.valueQuantity.value.toFixed(0);
            else hdlCholInput.placeholder = "e.g., 50";

            if (trig) trigInput.value = trig.valueQuantity.value.toFixed(0);
            else trigInput.placeholder = "e.g., 150";
        });

        document.getElementById('calculate-ldl').addEventListener('click', () => {
            const total = parseFloat(document.getElementById('total-chol').value);
            const hdl = parseFloat(document.getElementById('hdl-chol').value);
            const trig = parseFloat(document.getElementById('trig').value);
            const resultEl = document.getElementById('ldl-result');

            if (trig >= 400) {
                resultEl.innerHTML = '<p>LDL cannot be calculated accurately when triglycerides are ≥ 400 mg/dL. Consider a direct LDL measurement.</p>';
                resultEl.style.display = 'block';
                return;
            }

            if (total > 0 && hdl > 0 && trig > 0) {
                const ldlCalculated = total - hdl - (trig / 5);
                resultEl.innerHTML = `<p>Calculated LDL: ${ldlCalculated.toFixed(0)} mg/dL</p>`;
                resultEl.style.display = 'block';
            } else {
                resultEl.innerText = 'Please enter valid values for all fields.';
                resultEl.style.display = 'block';
            }
        });
    }
};
