// js/calculators/fena.js
import { getMostRecentObservation } from '../../utils.js';

export const fena = {
    id: 'fena',
    title: 'Fractional Excretion of Sodium (FENa)',
    description: 'Determines if renal failure is due to prerenal or intrinsic pathology.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p>${this.description}</p>
            <div class="input-group">
                <label for="urine-na">Urine Sodium (mEq/L):</label>
                <input type="number" id="urine-na" placeholder="loading...">
            </div>
            <div class="input-group">
                <label for="serum-na">Serum Sodium (mEq/L):</label>
                <input type="number" id="serum-na" placeholder="loading...">
            </div>
            <div class="input-group">
                <label for="urine-creat">Urine Creatinine (mg/dL):</label>
                <input type="number" id="urine-creat" placeholder="loading...">
            </div>
            <div class="input-group">
                <label for="serum-creat">Serum Creatinine (mg/dL):</label>
                <input type="number" id="serum-creat" placeholder="loading...">
            </div>
            <button id="calculate-fena">Calculate FENa</button>
            <div id="fena-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function(client) {
        // LOINC: Urine Na: 2955-3, Serum Na: 2951-2, Urine Creat: 2161-8, Serum Creat: 2160-0
        const uNaPromise = getMostRecentObservation(client, '2955-3');
        const sNaPromise = getMostRecentObservation(client, '2951-2');
        const uCrPromise = getMostRecentObservation(client, '2161-8');
        const sCrPromise = getMostRecentObservation(client, '2160-0');

        Promise.all([uNaPromise, sNaPromise, uCrPromise, sCrPromise]).then(([uNa, sNa, uCr, sCr]) => {
            if (uNa) document.getElementById('urine-na').value = uNa.valueQuantity.value.toFixed(0);
            else document.getElementById('urine-na').placeholder = "e.g., 20";
            if (sNa) document.getElementById('serum-na').value = sNa.valueQuantity.value.toFixed(0);
            else document.getElementById('serum-na').placeholder = "e.g., 140";
            if (uCr) document.getElementById('urine-creat').value = uCr.valueQuantity.value.toFixed(0);
            else document.getElementById('urine-creat').placeholder = "e.g., 100";
            if (sCr) document.getElementById('serum-creat').value = sCr.valueQuantity.value.toFixed(1);
            else document.getElementById('serum-creat').placeholder = "e.g., 2.5";
        });

        document.getElementById('calculate-fena').addEventListener('click', () => {
            const uNa = parseFloat(document.getElementById('urine-na').value);
            const sNa = parseFloat(document.getElementById('serum-na').value);
            const uCr = parseFloat(document.getElementById('urine-creat').value);
            const sCr = parseFloat(document.getElementById('serum-creat').value);
            const resultEl = document.getElementById('fena-result');

            if (uNa > 0 && sNa > 0 && uCr > 0 && sCr > 0) {
                const fenaValue = ((uNa / sNa) / (uCr / sCr)) * 100;
                let interpretation = '';
                if (fenaValue < 1) {
                    interpretation = 'FENa < 1% suggests a prerenal cause of AKI.';
                } else if (fenaValue > 2) {
                    interpretation = 'FENa > 2% suggests an intrinsic cause (e.g., ATN).';
                } else {
                    interpretation = 'FENa between 1% and 2% is indeterminate.';
                }

                resultEl.innerHTML = `
                    <p>FENa: ${fenaValue.toFixed(2)}%</p>
                    <p><strong>Interpretation:</strong> ${interpretation}</p>
                `;
                resultEl.style.display = 'block';
            } else {
                resultEl.innerText = 'Please enter valid values for all fields.';
                resultEl.style.display = 'block';
            }
        });
    }
};
