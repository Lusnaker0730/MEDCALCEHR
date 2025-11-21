import { getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';

export const tpaDosing = {
    id: 'tpa-dosing',
    title: 'tPA (Alteplase) Dosing for Ischemic Stroke',
    description:
        'Calculates tPA (alteplase) dosing for acute ischemic stroke based on patient weight.',
    generateHTML: function () {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <div class="input-group">
                <label>Weight (kg)</label>
                <input type="number" id="tpa-weight">
            </div>
            <div id="tpa-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function (client, patient, container) {
        const weightEl = container.querySelector('#tpa-weight');

        getMostRecentObservation(client, LOINC_CODES.WEIGHT).then(obs => {
            // Weight
            if (obs && obs.valueQuantity) {
                weightEl.value = obs.valueQuantity.value.toFixed(1);
            }
        });

        const calculate = () => {
            let weight = parseFloat(weightEl.value);

            if (isNaN(weight)) {
                container.querySelector('#tpa-result').style.display = 'none';
                return;
            }

            // If weight > 100 kg, use 100 kg for calculation as max dose is 90mg.
            if (weight > 100) {
                weight = 100;
            }

            const totalDose = weight * 0.9;
            const bolusDose = totalDose * 0.1;
            const infusionDose = totalDose * 0.9;

            container.querySelector('#tpa-result').innerHTML = `
                <p><strong>Total Dose (0.9 mg/kg, max 90mg):</strong> ${totalDose.toFixed(2)} mg</p>
                <p><strong>Bolus Dose (10% of total):</strong> ${bolusDose.toFixed(2)} mg (give over 1 minute)</p>
                <p><strong>Infusion Dose (90% of total):</strong> ${infusionDose.toFixed(2)} mg (infuse over 60 minutes)</p>
            `;
            container.querySelector('#tpa-result').style.display = 'block';
        };

        // Add event listener for auto-calculation
        weightEl.addEventListener('input', calculate);

        // Initial calculation
        calculate();
    }
};
