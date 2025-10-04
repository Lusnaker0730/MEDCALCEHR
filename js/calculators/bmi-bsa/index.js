// js/calculators/bmi-bsa.js
import { getMostRecentObservation } from '../../utils.js';

export const bmiBsa = {
    id: 'bmi-bsa',
    title: 'BMI & Body Surface Area (BSA)',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <div class="input-group">
                <label for="bmi-bsa-weight">Weight (kg):</label>
                <input type="number" id="bmi-bsa-weight" placeholder="loading...">
            </div>
            <div class="input-group">
                <label for="bmi-bsa-height">Height (cm):</label>
                <input type="number" id="bmi-bsa-height" placeholder="loading...">
            </div>
            <div id="bmi-bsa-result" class="result" style="display:block;">
                <div class="result-item">
                    <span class="value">-- <span class="unit">kg/m²</span></span>
                    <span class="label">BMI</span>
                </div>
                <div class="result-item">
                    <span class="value">-- <span class="unit">m²</span></span>
                    <span class="label">Body Surface Area (BSA)</span>
                </div>
            </div>
            <div class="formula-section">
                <h4>Formulas</h4>
                <div class="formula-item">
                    <strong>BMI (Body Mass Index):</strong>
                    <div class="formula">BMI = Weight (kg) / Height² (m²)</div>
                </div>
                <div class="formula-item">
                    <strong>BSA (Body Surface Area - Du Bois Formula):</strong>
                    <div class="formula">BSA = 0.007184 × Weight<sup>0.425</sup> (kg) × Height<sup>0.725</sup> (cm)</div>
                </div>
            </div>
        `;
    },
    initialize: function(client, patient, container) {
        const weightInput = container.querySelector('#bmi-bsa-weight');
        const heightInput = container.querySelector('#bmi-bsa-height');
        const resultEl = container.querySelector('#bmi-bsa-result');

        // Function to calculate and update results
        const calculateAndUpdate = () => {
            const weight = parseFloat(weightInput.value);
            const height = parseFloat(heightInput.value);

            if (weight > 0 && height > 0) {
                const heightInMeters = height / 100;
                const bmi = weight / (heightInMeters * heightInMeters);
                const bsa = 0.007184 * Math.pow(weight, 0.425) * Math.pow(height, 0.725); // Du Bois
                
                // Update BMI result
                const bmiValueEl = resultEl.querySelector('.result-item:first-child .value');
                bmiValueEl.innerHTML = `${bmi.toFixed(2)} <span class="unit">kg/m²</span>`;
                
                // Update BSA result
                const bsaValueEl = resultEl.querySelector('.result-item:last-child .value');
                bsaValueEl.innerHTML = `${bsa.toFixed(2)} <span class="unit">m²</span>`;
                
                resultEl.className = 'result calculated';
            } else {
                // Reset to default values if inputs are invalid
                const bmiValueEl = resultEl.querySelector('.result-item:first-child .value');
                bmiValueEl.innerHTML = `-- <span class="unit">kg/m²</span>`;
                
                const bsaValueEl = resultEl.querySelector('.result-item:last-child .value');
                bsaValueEl.innerHTML = `-- <span class="unit">m²</span>`;
                
                resultEl.className = 'result';
            }
        };

        // Add event listeners for automatic calculation
        weightInput.addEventListener('input', calculateAndUpdate);
        heightInput.addEventListener('input', calculateAndUpdate);

        // Auto-populate from FHIR data
        const weightPromise = getMostRecentObservation(client, '29463-7');
        const heightPromise = getMostRecentObservation(client, '8302-2');

        Promise.all([weightPromise, heightPromise]).then(([weightObs, heightObs]) => {
            if (weightObs && weightObs.valueQuantity) {
                weightInput.value = weightObs.valueQuantity.value.toFixed(1);
            } else {
                weightInput.placeholder = "e.g., 70";
            }

            if (heightObs && heightObs.valueQuantity) {
                heightInput.value = heightObs.valueQuantity.value.toFixed(1);
            } else {
                heightInput.placeholder = "e.g., 175";
            }
            
            // Calculate initial results if data was populated
            calculateAndUpdate();
        });
    }
};

