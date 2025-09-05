// js/calculators/sodium-correction.js
import { getMostRecentObservation } from '../utils.js';

export const sodiumCorrection = {
    id: 'sodium-correction',
    title: 'Sodium Correction for Hyperglycemia',
    description: 'Calculates the actual sodium level in patients with hyperglycemia.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p>Calculates the actual sodium level in patients with hyperglycemia.</p>
            <div class="input-group">
                <label for="measured-sodium">Measured Sodium (mEq/L):</label>
                <input type="number" id="measured-sodium" placeholder="loading...">
            </div>
            <div class="input-group">
                <label for="glucose">Glucose (mg/dL):</label>
                <input type="number" id="glucose" placeholder="loading...">
            </div>
            <button id="calculate-sodium-correction">Calculate</button>
            <div id="sodium-correction-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function(client) {
        const sodiumInput = document.getElementById('measured-sodium');
        const glucoseInput = document.getElementById('glucose');

        const sodiumPromise = getMostRecentObservation(client, '2951-2');
        const glucosePromise = getMostRecentObservation(client, '2345-7');

        Promise.all([sodiumPromise, glucosePromise]).then(([sodiumObs, glucoseObs]) => {
            if (sodiumObs) sodiumInput.value = sodiumObs.valueQuantity.value.toFixed(0);
            else sodiumInput.placeholder = "e.g., 135";

            if (glucoseObs) glucoseInput.value = glucoseObs.valueQuantity.value.toFixed(0);
            else glucoseInput.placeholder = "e.g., 400";
        });
        
        document.getElementById('calculate-sodium-correction').addEventListener('click', () => {
            const measuredSodium = parseFloat(sodiumInput.value);
            const glucose = parseFloat(glucoseInput.value);
            const resultEl = document.getElementById('sodium-correction-result');

            if (measuredSodium > 0 && glucose > 0) {
                // Using the Hillier, et al. formula (correction factor of 1.6 for glucose up to 400)
                let correctionFactor = 1.6;
                let note = "A correction factor of 2.4 mEq/L may be used for glucose > 400 mg/dL.";
                if (glucose > 400) {
                    // For simplicity, this calculator will stick with the 1.6 factor but notify the user.
                    // A more advanced version could allow user to select the factor.
                }

                const correctedSodium = measuredSodium + correctionFactor * ((glucose - 100) / 100);
                
                resultEl.innerHTML = `
                    <p>Corrected Sodium: ${correctedSodium.toFixed(1)} mEq/L</p>
                    <small><em>Note: ${note}</em></small>
                `;
                resultEl.style.display = 'block';

            } else {
                resultEl.innerText = 'Please enter valid sodium and glucose values.';
                resultEl.style.display = 'block';
            }
        });
    }
};
