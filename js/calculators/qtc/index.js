// js/calculators/qtc.js
import { getMostRecentObservation } from '../../utils.js';

export const qtc = {
    id: 'qtc',
    title: 'Corrected QT Interval (QTc)',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <div class="input-group">
                <label for="qtc-qt">QT Interval (ms):</label>
                <input type="number" id="qtc-qt" placeholder="e.g., 400">
            </div>
            <div class="input-group">
                <label for="qtc-hr">Heart Rate (bpm):</label>
                <input type="number" id="qtc-hr" placeholder="loading...">
            </div>
            <div class="input-group">
                <label for="qtc-formula">Formula:</label>
                <select id="qtc-formula">
                    <option value="bazett">Bazett</option>
                    <option value="fridericia">Fridericia</option>
                    <option value="hodges">Hodges</option>
                    <option value="framingham">Framingham</option>
                </select>
            </div>
            <button id="calculate-qtc">Calculate</button>
            <div id="qtc-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function(client) {
        getMostRecentObservation(client, '8867-4').then(obs => {
            if (obs) document.getElementById('qtc-hr').value = obs.valueQuantity.value.toFixed(0);
        });

        document.getElementById('calculate-qtc').addEventListener('click', () => {
            const qt = parseFloat(document.getElementById('qtc-qt').value);
            const hr = parseFloat(document.getElementById('qtc-hr').value);
            const formula = document.getElementById('qtc-formula').value;
            const resultEl = document.getElementById('qtc-result');

            if (qt > 0 && hr > 0) {
                const rr = 60 / hr;
                let qtcValue;
                switch(formula) {
                    case 'bazett':
                        qtcValue = qt / Math.sqrt(rr);
                        break;
                    case 'fridericia':
                        qtcValue = qt / Math.cbrt(rr);
                        break;
                    case 'hodges':
                        qtcValue = qt + 1.75 * (hr - 60);
                        break;
                    case 'framingham':
                        qtcValue = qt + 154 * (1 - rr);
                        break;
                }
                resultEl.innerHTML = `<p>QTc (${formula}): ${qtcValue.toFixed(0)} ms</p>`;
                resultEl.style.display = 'block';
            } else {
                resultEl.innerText = 'Please enter valid QT and Heart Rate values.';
                resultEl.style.display = 'block';
            }
        });
    }
};

