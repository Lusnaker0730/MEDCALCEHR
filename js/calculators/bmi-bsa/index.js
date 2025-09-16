// js/calculators/bmi-bsa.js
import { getMostRecentObservation } from '../../utils.js';

export const bmiBsa = {
    id: 'bmi-bsa',
    title: 'BMI & Body Surface Area (BSA)',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <div class="input-group">
                <label for="weight">Weight (kg):</label>
                <input type="number" id="weight" placeholder="loading...">
            </div>
            <div class="input-group">
                <label for="height">Height (cm):</label>
                <input type="number" id="height" placeholder="loading...">
            </div>
            <button id="calculate-bmi-bsa">Calculate</button>
            <div id="bmi-bsa-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function(client) {
        const weightPromise = getMostRecentObservation(client, '29463-7');
        const heightPromise = getMostRecentObservation(client, '8302-2');

        Promise.all([weightPromise, heightPromise]).then(([weightObs, heightObs]) => {
            const weightInput = document.getElementById('weight');
            const heightInput = document.getElementById('height');
            
            if (weightObs) weightInput.value = weightObs.valueQuantity.value.toFixed(1);
            else weightInput.placeholder = "e.g., 70";

            if (heightObs) heightInput.value = heightObs.valueQuantity.value.toFixed(1);
            else heightInput.placeholder = "e.g., 175";
        });

        document.getElementById('calculate-bmi-bsa').addEventListener('click', () => {
            const weight = parseFloat(document.getElementById('weight').value);
            const height = parseFloat(document.getElementById('height').value);
            const resultEl = document.getElementById('bmi-bsa-result');

            if (weight > 0 && height > 0) {
                const heightInMeters = height / 100;
                const bmi = weight / (heightInMeters * heightInMeters);
                const bsa = 0.007184 * Math.pow(weight, 0.425) * Math.pow(height, 0.725); // Du Bois
                resultEl.innerHTML = `<p>BMI: ${bmi.toFixed(2)} kg/m²</p><p>BSA: ${bsa.toFixed(2)} m²</p>`;
                resultEl.style.display = 'block';
            } else {
                resultEl.innerText = 'Please enter valid weight and height.';
                resultEl.style.display = 'block';
            }
        });
    }
};

