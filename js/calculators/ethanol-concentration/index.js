import { getMostRecentObservation } from '../../utils.js';

export const ethanolConcentration = {
    id: 'ethanol-concentration',
    title: 'Estimated Ethanol (and Toxic Alcohol) Serum Concentration Based on Ingestion',
    description: 'Predicts ethanol concentration based on ingestion of alcohol.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <div class="input-group">
                <label>Amount Ingested (ounces)</label>
                <input type="number" id="eth-amount" value="1.5">
            </div>
            <div class="input-group">
                <label>Alcohol by Volume (%)</label>
                <input type="number" id="eth-abv" value="40">
            </div>
            <div class="input-group">
                <label>Patient Weight (kg)</label>
                <input type="number" id="eth-weight">
            </div>
            <div class="input-group">
                <label>Gender</label>
                <select id="eth-gender">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                </select>
            </div>
            <button id="calculate-ethanol">Calculate Concentration</button>
            <div id="ethanol-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function(client, patient, container) {
        const weightEl = container.querySelector('#eth-weight');
        container.querySelector('#eth-gender').value = patient.gender;

        getMostRecentObservation(client, '29463-7').then(obs => { // Weight
            if (obs && obs.valueQuantity) weightEl.value = obs.valueQuantity.value.toFixed(1);
        });

        container.querySelector('#calculate-ethanol').addEventListener('click', () => {
            const amountOz = parseFloat(container.querySelector('#eth-amount').value);
            const abv = parseFloat(container.querySelector('#eth-abv').value);
            const weightKg = parseFloat(weightEl.value);
            const gender = container.querySelector('#eth-gender').value;

            if (isNaN(amountOz) || isNaN(abv) || isNaN(weightKg)) {
                alert('Please enter all values.');
                return;
            }

            const volumeDistribution = gender === 'male' ? 0.68 : 0.55; // L/kg
            const gramsAlcohol = amountOz * 29.57 * (abv / 100) * 0.789; // oz -> mL -> g
            const concentrationMgDl = (gramsAlcohol * 1000) / (weightKg * volumeDistribution * 10); // mg/dL

            container.querySelector('#ethanol-result').innerHTML = `
                <p>Estimated Peak Serum Ethanol Concentration: ${concentrationMgDl.toFixed(0)} mg/dL</p>
            `;
            container.querySelector('#ethanol-result').style.display = 'block';
        });
    }
};
