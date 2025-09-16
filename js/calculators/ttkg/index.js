import { getMostRecentObservation } from '../../utils.js';

export const ttkg = {
    id: 'ttkg',
    title: 'Transtubular Potassium Gradient (TTKG)',
    description: 'May help in assessment of hyperkalemia or hypokalemia.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <div class="form-container modern">
                <div class="input-row">
                    <label for="ttkg-urine-k">Urine potassium</label>
                    <div class="input-with-unit">
                        <input type="number" id="ttkg-urine-k">
                        <span>mEq/L</span>
                    </div>
                </div>
                <div class="input-row">
                    <label for="ttkg-serum-k">Serum potassium</label>
                    <div class="input-with-unit">
                        <input type="number" id="ttkg-serum-k" placeholder="Norm: 3.5 - 5.2">
                        <span>mEq/L</span>
                    </div>
                </div>
                <div class="input-row">
                    <label for="ttkg-urine-osmo">Urine osmolality</label>
                    <div class="input-with-unit">
                        <input type="number" id="ttkg-urine-osmo" placeholder="Norm: 500 - 800">
                        <span>mOsm/kg</span>
                    </div>
                </div>
                <div class="input-row">
                    <label for="ttkg-serum-osmo">Serum osmolality</label>
                    <div class="input-with-unit">
                        <input type="number" id="ttkg-serum-osmo" placeholder="Norm: 275 - 295">
                        <span>mOsm/kg</span>
                    </div>
                </div>
            </div>
            <div id="ttkg-result" class="result-box ttkg-result" style="display:block;">
                <div class="result-title">Result:</div>
                <div class="result-value">Please fill out required fields.</div>
            </div>
        `;
    },
    initialize: function(client, patient, container) {
        const urineKEl = container.querySelector('#ttkg-urine-k');
        const serumKEl = container.querySelector('#ttkg-serum-k');
        const urineOsmoEl = container.querySelector('#ttkg-urine-osmo');
        const serumOsmoEl = container.querySelector('#ttkg-serum-osmo');
        const resultEl = container.querySelector('#ttkg-result');
        const resultValueEl = container.querySelector('#ttkg-result .result-value');

        const calculate = () => {
            const urineK = parseFloat(urineKEl.value);
            const serumK = parseFloat(serumKEl.value);
            const urineOsmo = parseFloat(urineOsmoEl.value);
            const serumOsmo = parseFloat(serumOsmoEl.value);

            if (isNaN(urineK) || isNaN(serumK) || isNaN(urineOsmo) || isNaN(serumOsmo)) {
                resultValueEl.textContent = 'Please fill out required fields.';
                resultEl.className = 'result-box ttkg-result'; // Reset to default color
                return;
            }

            if (serumK === 0 || urineOsmo === 0) {
                 resultValueEl.textContent = 'Serum potassium and Urine osmolality cannot be zero.';
                 resultEl.className = 'result-box ttkg-result error'; // Add error class
                 return;
            }

            resultEl.className = 'result-box ttkg-result calculated'; // Add calculated class for styling

            const ttkgValue = (urineK * serumOsmo) / (serumK * urineOsmo);
            
            let interpretation = '';
            if (serumK < 3.5) { // Hypokalemia
                if (ttkgValue < 3) {
                    interpretation = 'Suggests renal potassium loss is not the primary cause of hypokalemia (e.g., GI loss, transcellular shift).';
                } else {
                    interpretation = 'Suggests renal potassium wasting.';
                }
            } else if (serumK > 5.2) { // Hyperkalemia
                 if (ttkgValue > 10) {
                    interpretation = 'Suggests hyperkalemia is driven by high potassium intake (dietary or iatrogenic).';
                } else if (ttkgValue < 7) {
                    interpretation = 'Suggests an issue with aldosterone (e.g., hypoaldosteronism or aldosterone resistance).';
                }
            }

            resultValueEl.innerHTML = `TTKG = ${ttkgValue.toFixed(2)}${interpretation ? `<small>${interpretation}</small>` : ''}`;
        };
        
        // LOINC codes for observations
        getMostRecentObservation(client, '2829-0').then(obs => { // Urine potassium
            if (obs && obs.valueQuantity) urineKEl.value = obs.valueQuantity.value.toFixed(1);
            calculate();
        });
        getMostRecentObservation(client, '2823-3').then(obs => { // Serum potassium
            if (obs && obs.valueQuantity) serumKEl.value = obs.valueQuantity.value.toFixed(1);
            calculate();
        });
        getMostRecentObservation(client, '2697-2').then(obs => { // Urine osmolality
            if (obs && obs.valueQuantity) urineOsmoEl.value = obs.valueQuantity.value.toFixed(1);
            calculate();
        });
        getMostRecentObservation(client, '2695-6').then(obs => { // Serum osmolality
            if (obs && obs.valueQuantity) serumOsmoEl.value = obs.valueQuantity.value.toFixed(1);
            calculate();
        });

        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculate);
        });

        calculate();
    }
};
