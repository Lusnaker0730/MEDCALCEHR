// js/calculators/map.js
import { getMostRecentObservation } from '../../utils.js';

export const map = {
    id: 'map',
    title: 'Mean Arterial Pressure (MAP)',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <div class="input-group">
                <label for="map-sbp">Systolic BP (mmHg):</label>
                <input type="number" id="map-sbp" placeholder="loading...">
            </div>
            <div class="input-group">
                <label for="map-dbp">Diastolic BP (mmHg):</label>
                <input type="number" id="map-dbp" placeholder="loading...">
            </div>
            <button id="calculate-map">Calculate</button>
            <div id="map-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function(client) {
        const sbpInput = document.getElementById('map-sbp');
        const dbpInput = document.getElementById('map-dbp');

        // LOINC 85354-9 for Blood Pressure Panel
        getMostRecentObservation(client, '85354-9').then(bpPanel => {
            if (bpPanel && bpPanel.component) {
                const sbpComp = bpPanel.component.find(c => c.code.coding[0].code === '8480-6'); // Systolic
                const dbpComp = bpPanel.component.find(c => c.code.coding[0].code === '8462-4'); // Diastolic

                if (sbpComp) sbpInput.value = sbpComp.valueQuantity.value.toFixed(0);
                else sbpInput.placeholder = 'e.g., 120';
                
                if (dbpComp) dbpInput.value = dbpComp.valueQuantity.value.toFixed(0);
                else dbpInput.placeholder = 'e.g., 80';

            } else {
                sbpInput.placeholder = 'e.g., 120';
                dbpInput.placeholder = 'e.g., 80';
            }
        });

        document.getElementById('calculate-map').addEventListener('click', () => {
            const sbp = parseFloat(sbpInput.value);
            const dbp = parseFloat(dbpInput.value);
            const resultEl = document.getElementById('map-result');

            if (sbp > 0 && dbp > 0 && sbp >= dbp) {
                const mapCalc = dbp + (sbp - dbp) / 3;
                resultEl.innerHTML = `<p>MAP: ${mapCalc.toFixed(1)} mmHg</p>`;
                resultEl.style.display = 'block';
            } else {
                resultEl.innerText = 'Please enter valid SBP and DBP (SBP must be >= DBP).';
                resultEl.style.display = 'block';
            }
        });
    }
};







