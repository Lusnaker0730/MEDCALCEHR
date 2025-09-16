// js/calculators/mdrd-gfr.js
import { getMostRecentObservation, calculateAge } from '../../utils.js';

export const mdrdGfr = {
    id: 'mdrd-gfr',
    title: 'MDRD GFR Equation',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <div class="input-group">
                <label for="mdrd-creatinine">Serum Creatinine (mg/dL):</label>
                <input type="number" id="mdrd-creatinine" placeholder="loading...">
            </div>
            <div class="input-group">
                <label for="mdrd-age">Age:</label>
                <input type="number" id="mdrd-age" placeholder="loading...">
            </div>
            <div class="input-group">
                <label for="mdrd-gender">Gender:</label>
                <select id="mdrd-gender">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                </select>
            </div>
            <div class="input-group">
                <label for="mdrd-race">Race:</label>
                <select id="mdrd-race">
                    <option value="non-aa">Non-African American</option>
                    <option value="aa">African American</option>
                </select>
            </div>
            <button id="calculate-mdrd">Calculate</button>
            <div id="mdrd-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function(client, patient, container) {
        const creatinineInput = container.querySelector('#mdrd-creatinine');
        const ageInput = container.querySelector('#mdrd-age');
        const genderSelect = container.querySelector('#mdrd-gender');
        
        ageInput.value = calculateAge(patient.birthDate);
        genderSelect.value = patient.gender;

        getMostRecentObservation(client, '2160-0').then(obs => {
            if (obs) creatinineInput.value = obs.valueQuantity.value.toFixed(2);
        });

        container.querySelector('#calculate-mdrd').addEventListener('click', () => {
            const creatinine = parseFloat(creatinineInput.value);
            const age = parseFloat(ageInput.value);
            const isFemale = container.querySelector('#mdrd-gender').value === 'female';
            const isAA = container.querySelector('#mdrd-race').value === 'aa';
            const resultEl = container.querySelector('#mdrd-result');

            if (creatinine > 0 && age > 0) {
                let gfr = 175 * Math.pow(creatinine, -1.154) * Math.pow(age, -0.203);
                if (isFemale) gfr *= 0.742;
                if (isAA) gfr *= 1.212;
                
                resultEl.innerHTML = `<p>eGFR: ${gfr.toFixed(0)} mL/min/1.73m²</p>`;
                resultEl.style.display = 'block';
            } else {
                resultEl.innerText = 'Please enter valid creatinine and age.';
                resultEl.style.display = 'block';
            }
        });
    }
};

