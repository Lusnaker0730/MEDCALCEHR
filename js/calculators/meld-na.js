// js/calculators/meld-na.js
import { getMostRecentObservation } from '../utils.js';

export const meldNa = {
    id: 'meld-na',
    title: 'MELD Na (UNOS/OPTN)',
    description: 'Quantifies end-stage liver disease for transplant planning with sodium.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p>${this.description}</p>
            <div class="input-group">
                <label for="bili">Bilirubin (mg/dL):</label>
                <input type="number" id="bili" placeholder="loading...">
            </div>
            <div class="input-group">
                <label for="inr">INR:</label>
                <input type="number" id="inr" placeholder="loading...">
            </div>
            <div class="input-group">
                <label for="creat">Creatinine (mg/dL):</label>
                <input type="number" id="creat" placeholder="loading...">
            </div>
            <div class="input-group">
                <label for="sodium">Sodium (mEq/L):</label>
                <input type="number" id="sodium" placeholder="loading...">
            </div>
            <div class="check-item">
                <input type="checkbox" id="dialysis"><label for="dialysis">Patient on dialysis twice in the last week</label>
            </div>
            <button id="calculate-meld-na">Calculate MELD-Na</button>
            <div id="meld-na-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function(client) {
        // LOINC: Bili: 1975-2, INR: 34714-6, Creat: 2160-0, Sodium: 2951-2
        const biliPromise = getMostRecentObservation(client, '1975-2');
        const inrPromise = getMostRecentObservation(client, '34714-6');
        const creatPromise = getMostRecentObservation(client, '2160-0');
        const sodiumPromise = getMostRecentObservation(client, '2951-2');

        Promise.all([biliPromise, inrPromise, creatPromise, sodiumPromise]).then(([bili, inr, creat, sodium]) => {
            if (bili) document.getElementById('bili').value = bili.valueQuantity.value.toFixed(1);
            else document.getElementById('bili').placeholder = "e.g., 3.0";
            if (inr) document.getElementById('inr').value = inr.valueQuantity.value.toFixed(1);
            else document.getElementById('inr').placeholder = "e.g., 1.5";
            if (creat) document.getElementById('creat').value = creat.valueQuantity.value.toFixed(1);
            else document.getElementById('creat').placeholder = "e.g., 2.5";
            if (sodium) document.getElementById('sodium').value = sodium.valueQuantity.value.toFixed(0);
            else document.getElementById('sodium').placeholder = "e.g., 130";
        });
        
        document.getElementById('calculate-meld-na').addEventListener('click', () => {
            let bili = parseFloat(document.getElementById('bili').value);
            let inr = parseFloat(document.getElementById('inr').value);
            let creat = parseFloat(document.getElementById('creat').value);
            let sodium = parseFloat(document.getElementById('sodium').value);
            const onDialysis = document.getElementById('dialysis').checked;
            const resultEl = document.getElementById('meld-na-result');

            if (isNaN(bili) || isNaN(inr) || isNaN(creat) || isNaN(sodium)) {
                resultEl.innerText = 'Please enter valid values for all lab fields.';
                resultEl.style.display = 'block';
                return;
            }

            // Apply UNOS/OPTN rules
            if (bili < 1.0) bili = 1.0;
            if (inr < 1.0) inr = 1.0;
            if (creat < 1.0) creat = 1.0;
            if (onDialysis || creat > 4.0) creat = 4.0;
            
            // Calculate original MELD
            let meldScore = 0.957 * Math.log(creat) + 0.378 * Math.log(bili) + 1.120 * Math.log(inr) + 0.643;
            meldScore = Math.round(meldScore * 10);

            // Calculate MELD-Na
            let meldNaScore = meldScore;
            if (meldScore > 11) {
                if (sodium < 125) sodium = 125;
                if (sodium > 137) sodium = 137;
                meldNaScore += 1.32 * (137 - sodium) - (0.033 * meldScore * (137 - sodium));
            }

            // Final score capping
            if (meldNaScore < 6) meldNaScore = 6;
            if (meldNaScore > 40) meldNaScore = 40;

            resultEl.innerHTML = `<p>MELD-Na Score: ${Math.round(meldNaScore)}</p>`;
            resultEl.style.display = 'block';
        });
    }
};
