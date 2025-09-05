// js/calculators/ariscat.js
import { calculateAge } from '../utils.js';

export const ariscat = {
    id: 'ariscat',
    title: 'ARISCAT Score for Postoperative Pulmonary Complications',
    description: 'Predicts risk of pulmonary complications after surgery, including respiratory failure.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p>${this.description}</p>
            <div class="input-group"><label for="ariscat-age">Age (years):</label><input type="number" id="ariscat-age" placeholder="loading..."></div>
            <div class="input-group"><label for="ariscat-spo2">Preoperative SpO₂:</label>
                <select id="ariscat-spo2">
                    <option value="0">&ge;96%</option>
                    <option value="8">91-95%</option>
                    <option value="24">&le;90%</option>
                </select>
            </div>
            <div class="input-group"><label for="ariscat-resp">Respiratory infection in last month?</label><select id="ariscat-resp"><option value="0">No</option><option value="17">Yes</option></select></div>
            <div class="input-group"><label for="ariscat-anemia">Preoperative anemia (<10 g/dL)?</label><select id="ariscat-anemia"><option value="0">No</option><option value="11">Yes</option></select></div>
            <div class="input-group"><label for="ariscat-site">Surgical incision site:</label>
                <select id="ariscat-site">
                    <option value="0">Peripheral</option>
                    <option value="15">Upper abdominal</option>
                    <option value="24">Intrathoracic</option>
                </select>
            </div>
             <div class="input-group"><label for="ariscat-duration">Duration of surgery (hours):</label>
                <select id="ariscat-duration">
                    <option value="0"><2 hours</option>
                    <option value="16">2-3 hours</option>
                    <option value="23">>3 hours</option>
                </select>
            </div>
            <div class="input-group"><label for="ariscat-emergency">Emergency procedure?</label><select id="ariscat-emergency"><option value="0">No</option><option value="8">Yes</option></select></div>
            <button id="calculate-ariscat">Calculate ARISCAT Score</button>
            <div id="ariscat-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function(client, patient) {
        document.getElementById('ariscat-age').value = calculateAge(patient.birthDate);
        
        document.getElementById('calculate-ariscat').addEventListener('click', () => {
            const age = parseInt(document.getElementById('ariscat-age').value);
            let agePoints = 0;
            if (age >= 65 && age <= 80) agePoints = 3;
            else if (age > 80) agePoints = 16;
            
            let score = agePoints +
                parseInt(document.getElementById('ariscat-spo2').value) +
                parseInt(document.getElementById('ariscat-resp').value) +
                parseInt(document.getElementById('ariscat-anemia').value) +
                parseInt(document.getElementById('ariscat-site').value) +
                parseInt(document.getElementById('ariscat-duration').value) +
                parseInt(document.getElementById('ariscat-emergency').value);

            let riskCategory = '';
            let riskPercent = '';
            if (score < 26) {
                riskCategory = 'Low Risk';
                riskPercent = '1.6%';
            } else if (score <= 44) {
                riskCategory = 'Intermediate Risk';
                riskPercent = '13.3%';
            } else {
                riskCategory = 'High Risk';
                riskPercent = '42.1%';
            }

            const resultEl = document.getElementById('ariscat-result');
            resultEl.innerHTML = `
                <p><strong>ARISCAT Score:</strong> ${score}</p>
                <p><strong>Risk Category:</strong> ${riskCategory}</p>
                <p><strong>Incidence of Postoperative Pulmonary Complications:</strong> ~${riskPercent}</p>
            `;
            resultEl.style.display = 'block';
        });
    }
};
