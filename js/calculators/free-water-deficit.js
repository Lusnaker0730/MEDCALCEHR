// js/calculators/free-water-deficit.js
import { getMostRecentObservation } from '../utils.js';

export const freeWaterDeficit = {
    id: 'free-water-deficit',
    title: 'Free Water Deficit in Hypernatremia',
    description: 'Calculates free water deficit by estimated total body water in a patient with hypernatremia or dehydration.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p>${this.description}</p>
            <div class="input-group">
                <label for="fwd-weight">Weight (kg):</label>
                <input type="number" id="fwd-weight" placeholder="loading...">
            </div>
            <div class="input-group">
                <label for="fwd-sodium">Serum Sodium (mEq/L):</label>
                <input type="number" id="fwd-sodium" placeholder="loading...">
            </div>
             <div class="input-group">
                <label for="fwd-gender">Gender:</label>
                <select id="fwd-gender">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                </select>
            </div>
            <button id="calculate-fwd">Calculate Deficit</button>
            <div id="fwd-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function(client, patient) {
        document.getElementById('fwd-weight').value = patient.weight || '';
        document.getElementById('fwd-gender').value = patient.gender || 'male';

        getMostRecentObservation(client, '29463-7').then(obs => { 
            if(obs) document.getElementById('fwd-weight').value = obs.valueQuantity.value.toFixed(1);
        });
        getMostRecentObservation(client, '2951-2').then(obs => {
            if(obs) document.getElementById('fwd-sodium').value = obs.valueQuantity.value.toFixed(0);
        });

        document.getElementById('calculate-fwd').addEventListener('click', () => {
            const weight = parseFloat(document.getElementById('fwd-weight').value);
            const sodium = parseFloat(document.getElementById('fwd-sodium').value);
            const isMale = document.getElementById('fwd-gender').value === 'male';
            const resultEl = document.getElementById('fwd-result');

            if (weight > 0 && sodium > 140) {
                const tbwFactor = isMale ? 0.6 : 0.5;
                const totalBodyWater = weight * tbwFactor;
                const deficit = totalBodyWater * ((sodium / 140) - 1);
                
                resultEl.innerHTML = `
                    <p>Free Water Deficit: ${deficit.toFixed(1)} L</p>
                    <small><em>This should be corrected slowly (e.g., over 48-72 hours) to avoid cerebral edema. Maximum rate of sodium correction is typically 0.5 mEq/L/hr.</em></small>
                `;
                resultEl.style.display = 'block';
            } else if (sodium <= 140) {
                 resultEl.innerText = 'This calculation is intended for patients with hypernatremia (Sodium > 140 mEq/L).';
                 resultEl.style.display = 'block';
            } else {
                resultEl.innerText = 'Please enter a valid weight and sodium level.';
                resultEl.style.display = 'block';
            }
        });
    }
};
