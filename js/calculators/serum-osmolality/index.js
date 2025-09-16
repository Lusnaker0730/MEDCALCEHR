import { getMostRecentObservation } from '../../utils.js';

export const serumOsmolality = {
    id: 'serum-osmolality',
    title: 'Serum Osmolality/Osmolarity',
    description: 'Calculates expected serum osmolarity, for comparison to measured osmolality to detect unmeasured compounds in the serum.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <div class="input-group">
                <label for="osmo-na">Sodium (Na⁺) (mEq/L)</label>
                <input type="number" id="osmo-na">
            </div>
            <div class="input-group">
                <label for="osmo-glucose">Glucose (mg/dL)</label>
                <input type="number" id="osmo-glucose">
            </div>
            <div class="input-group">
                <label for="osmo-bun">BUN (mg/dL)</label>
                <input type="number" id="osmo-bun">
            </div>
            <button id="calculate-osmolality">Calculate</button>
            <div id="osmolality-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function(client) {
        getMostRecentObservation(client, '2951-2').then(obs => {
            if (obs && obs.valueQuantity) document.getElementById('osmo-na').value = obs.valueQuantity.value.toFixed(0);
        });
        getMostRecentObservation(client, '2345-7').then(obs => {
            if (obs && obs.valueQuantity) document.getElementById('osmo-glucose').value = obs.valueQuantity.value.toFixed(0);
        });
        getMostRecentObservation(client, '3094-0').then(obs => {
            if (obs && obs.valueQuantity) document.getElementById('osmo-bun').value = obs.valueQuantity.value.toFixed(0);
        });

        document.getElementById('calculate-osmolality').addEventListener('click', () => {
            const na = parseFloat(document.getElementById('osmo-na').value);
            const glucose = parseFloat(document.getElementById('osmo-glucose').value);
            const bun = parseFloat(document.getElementById('osmo-bun').value);

            if (isNaN(na) || isNaN(glucose) || isNaN(bun)) {
                alert('Please enter all values.');
                return;
            }

            const calculatedOsmolality = (2 * na) + (glucose / 18) + (bun / 2.8);

            document.getElementById('osmolality-result').innerHTML = `
                <p>Calculated Serum Osmolality: ${calculatedOsmolality.toFixed(1)} mOsm/kg</p>
            `;
            document.getElementById('osmolality-result').style.display = 'block';
        });
    }
};
