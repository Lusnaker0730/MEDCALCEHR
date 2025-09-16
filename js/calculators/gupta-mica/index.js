// js/calculators/gupta-mica.js
import { calculateAge } from '../../utils.js';

export const guptaMica = {
    id: 'gupta-mica',
    title: 'Gupta Perioperative Risk for Myocardial Infarction or Cardiac Arrest (MICA)',
    description: 'Predicts risk of MI or cardiac arrest after surgery.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p>${this.description}</p>
            <div class="input-group"><label for="mica-age">Age (years):</label><input type="number" id="mica-age" placeholder="loading..."></div>
            <div class="input-group">
                <label for="mica-asa">ASA Class:</label>
                <select id="mica-asa">
                    <option value="1">Class 1</option>
                    <option value="2">Class 2</option>
                    <option value="3" selected>Class 3</option>
                    <option value="4">Class 4</option>
                    <option value="5">Class 5</option>
                </select>
            </div>
            <div class="input-group"><label for="mica-creat">Preoperative Creatinine (mg/dL):</label><input type="number" id="mica-creat" placeholder="loading..."></div>
            <div class="input-group"><label for="mica-status">Functional Status:</label>
                <select id="mica-status">
                    <option value="independent">Independent</option>
                    <option value="partially-dependent" selected>Partially Dependent</option>
                    <option value="totally-dependent">Totally Dependent</option>
                </select>
            </div>
            <div class="input-group"><label for="mica-site">Surgical Site:</label>
                <select id="mica-site">
                    <option value="low-risk">Low Risk</option>
                    <option value="high-risk" selected>High Risk (e.g., vascular, thoracic, abdominal)</option>
                </select>
            </div>
            <button id="calculate-mica">Calculate MICA Risk</button>
            <div id="mica-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function(client, patient) {
        document.getElementById('mica-age').value = calculateAge(patient.birthDate);
        getMostRecentObservation(client, '2160-0').then(obs => {
            if(obs) document.getElementById('mica-creat').value = obs.valueQuantity.value.toFixed(1);
        });

        document.getElementById('calculate-mica').addEventListener('click', () => {
            const age = parseInt(document.getElementById('mica-age').value);
            const asa = parseInt(document.getElementById('mica-asa').value);
            const creat = parseFloat(document.getElementById('mica-creat').value);
            const status = document.getElementById('mica-status').value;
            const site = document.getElementById('mica-site').value;
            
            let points = 0;
            if (age >= 70) points += (age >= 80 ? 7 : 3);
            if (asa >= 3) points += (asa === 3 ? 2 : (asa === 4 ? 6 : 9));
            if (creat > 1.5) points += 2;
            if (status !== 'independent') points += (status === 'partially-dependent' ? 3 : 6);
            if (site === 'high-risk') points += 2;

            // This is a simplified risk mapping based on the point system.
            // Original paper provides more granular probabilities.
            let riskPercent = '';
            if (points <= 3) riskPercent = '<1%';
            else if (points <= 6) riskPercent = '1-2%';
            else if (points <= 9) riskPercent = '2-5%';
            else if (points <= 12) riskPercent = '5-10%';
            else riskPercent = '>10%';

            const resultEl = document.getElementById('mica-result');
            resultEl.innerHTML = `
                <p><strong>MICA Points:</strong> ${points}</p>
                <p><strong>Estimated Risk of Postoperative MI or Cardiac Arrest:</strong> ${riskPercent}</p>
            `;
            resultEl.style.display = 'block';
        });
    }
};
