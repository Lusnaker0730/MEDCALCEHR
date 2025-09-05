// js/calculators/ibw.js
import { getMostRecentObservation } from '../utils.js';

export const ibw = {
    id: 'ibw',
    title: 'Ideal & Adjusted Body Weight',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <div class="input-group">
                <label for="ibw-height">Height (cm):</label>
                <input type="number" id="ibw-height" placeholder="loading...">
            </div>
            <div class="input-group">
                <label for="ibw-gender">Gender:</label>
                <select id="ibw-gender">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                </select>
            </div>
            <div class="input-group">
                <label for="ibw-actual">Actual Weight (kg):</label>
                <input type="number" id="ibw-actual" placeholder="loading...">
            </div>
            <button id="calculate-ibw">Calculate</button>
            <div id="ibw-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function(client, patient) {
        const heightInput = document.getElementById('ibw-height');
        const genderSelect = document.getElementById('ibw-gender');
        const actualWeightInput = document.getElementById('ibw-actual');

        genderSelect.value = patient.gender;
        
        getMostRecentObservation(client, '8302-2').then(obs => {
            if (obs) heightInput.value = obs.valueQuantity.value.toFixed(1);
        });
        getMostRecentObservation(client, '29463-7').then(obs => {
            if (obs) actualWeightInput.value = obs.valueQuantity.value.toFixed(1);
        });

        document.getElementById('calculate-ibw').addEventListener('click', () => {
            const heightCm = parseFloat(heightInput.value);
            const isMale = genderSelect.value === 'male';
            const actualWeight = parseFloat(actualWeightInput.value);
            const resultEl = document.getElementById('ibw-result');

            if (heightCm > 0) {
                const heightIn = heightCm / 2.54;
                let ibw = 0;
                if (heightIn > 60) {
                    if (isMale) {
                        ibw = 50 + 2.3 * (heightIn - 60);
                    } else {
                        ibw = 45.5 + 2.3 * (heightIn - 60);
                    }
                } else {
                    // For simplicity, handle this edge case. A more complex formula might be needed for < 5ft.
                    ibw = isMale ? 50 : 45.5; 
                }

                let resultHTML = `<p>Ideal Body Weight: ${ibw.toFixed(1)} kg</p>`;

                if (actualWeight > 0 && actualWeight > ibw) {
                    const adjBw = ibw + 0.4 * (actualWeight - ibw);
                    resultHTML += `<p>Adjusted Body Weight: ${adjBw.toFixed(1)} kg</p>`;
                }

                resultEl.innerHTML = resultHTML;
                resultEl.style.display = 'block';
            } else {
                resultEl.innerText = 'Please enter a valid height.';
                resultEl.style.display = 'block';
            }
        });
    }
};

