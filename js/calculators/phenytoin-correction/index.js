import { getMostRecentObservation } from '../../utils.js';

export const phenytoinCorrection = {
    id: 'phenytoin-correction',
    title: 'Phenytoin (Dilantin) Correction for Albumin/Renal Failure',
    description: 'Corrects serum phenytoin level for renal failure and/or hypoalbuminemia.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <div class="input-group">
                <label>Total Phenytoin Level (mcg/mL)</label>
                <input type="number" id="pheny-total" step="0.1">
            </div>
            <div class="input-group">
                <label>Albumin (g/dL)</label>
                <input type="number" id="pheny-albumin" step="0.1">
            </div>
            <div class="input-group">
                <label>Patient has Renal Failure (CrCl < 10 mL/min)?</label>
                <select id="pheny-renal">
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                </select>
            </div>
            <button id="calculate-phenytoin">Calculate Corrected Level</button>
            <div id="phenytoin-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function(client, patient, container) {
        const totalEl = container.querySelector('#pheny-total');
        const albuminEl = container.querySelector('#pheny-albumin');
        const renalEl = container.querySelector('#pheny-renal');

        getMostRecentObservation(client, '4038-8').then(obs => { // Phenytoin
            if (obs && obs.valueQuantity) totalEl.value = obs.valueQuantity.value.toFixed(1);
        });
        getMostRecentObservation(client, '1751-7').then(obs => { // Albumin
            if (obs && obs.valueQuantity) albuminEl.value = obs.valueQuantity.value.toFixed(1);
        });

        container.querySelector('#calculate-phenytoin').addEventListener('click', () => {
            const totalPhenytoin = parseFloat(totalEl.value);
            const albumin = parseFloat(albuminEl.value);
            const hasRenalFailure = renalEl.value === 'yes';

            if (isNaN(totalPhenytoin) || isNaN(albumin)) {
                alert('Please enter all values.');
                return;
            }

            const K = hasRenalFailure ? 0.2 : 0.1;
            const correctedPhenytoin = totalPhenytoin / (( (1-K) * albumin / 4.4) + K);

            container.querySelector('#phenytoin-result').innerHTML = `
                <p>Corrected Phenytoin Level: ${correctedPhenytoin.toFixed(1)} mcg/mL</p>
                <p>Therapeutic range is typically 10-20 mcg/mL.</p>
            `;
            container.querySelector('#phenytoin-result').style.display = 'block';
        });
    }
};
