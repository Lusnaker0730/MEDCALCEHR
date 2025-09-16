import { getMostRecentObservation } from '../../utils.js';

export const serumAnionGap = {
    id: 'serum-anion-gap',
    title: 'Serum Anion Gap',
    description: 'Evaluates states of metabolic acidosis.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <div class="input-group">
                <label for="sag-na">Sodium (Na⁺) (mEq/L)</label>
                <input type="number" id="sag-na" placeholder="Enter Sodium">
            </div>
            <div class="input-group">
                <label for="sag-cl">Chloride (Cl⁻) (mEq/L)</label>
                <input type="number" id="sag-cl" placeholder="Enter Chloride">
            </div>
            <div class="input-group">
                <label for="sag-hco3">Bicarbonate (HCO₃⁻) (mEq/L)</label>
                <input type="number" id="sag-hco3" placeholder="Enter Bicarbonate">
            </div>
            <button id="calculate-sag">Calculate Anion Gap</button>
            <div id="sag-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function(client) {
        // Fetch recent lab values
        getMostRecentObservation(client, '2951-2').then(obs => {
            if (obs && obs.valueQuantity) document.getElementById('sag-na').value = obs.valueQuantity.value.toFixed(0);
        });
        getMostRecentObservation(client, '2075-0').then(obs => {
            if (obs && obs.valueQuantity) document.getElementById('sag-cl').value = obs.valueQuantity.value.toFixed(0);
        });
        getMostRecentObservation(client, '1963-8').then(obs => {
            if (obs && obs.valueQuantity) document.getElementById('sag-hco3').value = obs.valueQuantity.value.toFixed(0);
        });

        document.getElementById('calculate-sag').addEventListener('click', () => {
            const na = parseFloat(document.getElementById('sag-na').value);
            const cl = parseFloat(document.getElementById('sag-cl').value);
            const hco3 = parseFloat(document.getElementById('sag-hco3').value);

            if (isNaN(na) || isNaN(cl) || isNaN(hco3)) {
                alert('Please enter all values.');
                return;
            }

            const anionGap = na - (cl + hco3);
            
            let interpretation = '';
            if (anionGap > 12) {
                interpretation = 'High Anion Gap: Suggests metabolic acidosis (e.g., DKA, lactic acidosis, renal failure, toxic ingestions).';
            } else if (anionGap < 6) {
                interpretation = 'Low Anion Gap: Less common, may be due to lab error, hypoalbuminemia, or paraproteinemia.';
            } else {
                interpretation = 'Normal Anion Gap: Metabolic acidosis, if present, is likely non-anion gap (e.g., diarrhea, renal tubular acidosis).';
            }

            const resultEl = document.getElementById('sag-result');
            resultEl.innerHTML = `
                <p>Serum Anion Gap: ${anionGap.toFixed(1)} mEq/L</p>
                <p>Interpretation: ${interpretation}</p>
            `;
            resultEl.style.display = 'block';
        });
    }
};
