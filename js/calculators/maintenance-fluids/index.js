// js/calculators/maintenance-fluids.js
import { getMostRecentObservation } from '../../utils.js';

export const maintenanceFluids = {
    id: 'maintenance-fluids',
    title: 'Maintenance Fluids Calculations',
    description: 'Calculates maintenance fluid requirements by weight.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p>Calculates maintenance fluid requirements by weight (Holliday-Segar method).</p>
            <div class.input-group>
                <label for="weight-fluids">Weight (kg):</label>
                <input type="number" id="weight-fluids" placeholder="loading...">
            </div>
            <button id="calculate-fluids">Calculate</button>
            <div id="fluids-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function(client) {
        const weightInput = document.getElementById('weight-fluids');
        getMostRecentObservation(client, '29463-7').then(weightObs => {
            if (weightObs) {
                weightInput.value = weightObs.valueQuantity.value.toFixed(1);
            } else {
                weightInput.placeholder = "e.g., 70";
            }
        });

        document.getElementById('calculate-fluids').addEventListener('click', () => {
            const weight = parseFloat(weightInput.value);
            const resultEl = document.getElementById('fluids-result');

            if (weight > 0) {
                let hourlyRate = 0;
                if (weight <= 10) {
                    hourlyRate = weight * 4;
                } else if (weight <= 20) {
                    hourlyRate = (10 * 4) + ((weight - 10) * 2);
                } else {
                    hourlyRate = (10 * 4) + (10 * 2) + ((weight - 20) * 1);
                }
                const dailyRate = hourlyRate * 24;

                resultEl.innerHTML = `
                    <p>IV Fluid Rate: ${hourlyRate.toFixed(1)} mL/hr</p>
                    <p>Total Daily Fluids: ${dailyRate.toFixed(1)} mL/day</p>
                `;
                resultEl.style.display = 'block';
            } else {
                resultEl.innerText = 'Please enter a valid weight.';
                resultEl.style.display = 'block';
            }
        });
    }
};
