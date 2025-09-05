import { getMostRecentObservation } from '../utils.js';

export const abl = {
    id: 'abl',
    title: 'Maximum Allowable Blood Loss (ABL) Without Transfusion',
    description: 'Calculates the allowable blood loss for a patient before a transfusion may be indicated.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <div class="input-group">
                <label>Weight (kg)</label>
                <input type="number" id="abl-weight">
            </div>
            <div class="input-group">
                <label>Initial Hematocrit (%)</label>
                <input type="number" id="abl-hct-initial">
            </div>
            <div class="input-group">
                <label>Final (Lowest Allowable) Hematocrit (%)</label>
                <input type="number" id="abl-hct-final" value="30">
            </div>
            <button id="calculate-abl">Calculate ABL</button>
            <div id="abl-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function(client, patient, container) {
        const weightEl = container.querySelector('#abl-weight');
        const hctInitialEl = container.querySelector('#abl-hct-initial');

        getMostRecentObservation(client, '29463-7').then(obs => { // Weight
            if (obs && obs.valueQuantity) weightEl.value = obs.valueQuantity.value.toFixed(1);
        });
        getMostRecentObservation(client, '4544-3').then(obs => { // Hematocrit
            if (obs && obs.valueQuantity) hctInitialEl.value = obs.valueQuantity.value.toFixed(1);
        });

        container.querySelector('#calculate-abl').addEventListener('click', () => {
            const weight = parseFloat(weightEl.value);
            const hctInitial = parseFloat(hctInitialEl.value);
            const hctFinal = parseFloat(container.querySelector('#abl-hct-final').value);
            const gender = patient.gender;

            if (isNaN(weight) || isNaN(hctInitial) || isNaN(hctFinal)) {
                alert('Please enter all values.');
                return;
            }

            // Average blood volume in mL/kg by gender
            const avgBloodVolume = gender === 'male' ? 75 : 65;
            const ebv = weight * avgBloodVolume; // Estimated Blood Volume in mL
            const hctAvg = (hctInitial + hctFinal) / 2;

            const ablValue = ebv * (hctInitial - hctFinal) / hctAvg;

            container.querySelector('#abl-result').innerHTML = `
                <p>Estimated Blood Volume (EBV): ${ebv.toFixed(0)} mL</p>
                <p>Maximum Allowable Blood Loss (ABL): ${ablValue.toFixed(0)} mL</p>
            `;
            container.querySelector('#abl-result').style.display = 'block';
        });
    }
};
