import { getMostRecentObservation, calculateAge } from '../utils.js';

export const nafldFibrosisScore = {
    id: 'nafld-fibrosis-score',
    title: 'NAFLD (Non-Alcoholic Fatty Liver Disease) Fibrosis Score',
    description: 'Estimates amount of scarring in the liver based on several laboratory tests.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <div class="input-group">
                <label>Age (years)</label>
                <input type="number" id="nafld-age">
            </div>
            <div class="input-group">
                <label>BMI (kg/m²)</label>
                <input type="number" id="nafld-bmi" step="0.1">
            </div>
            <div class="input-group">
                <label>Impaired Fasting Glucose / Diabetes?</label>
                <select id="nafld-diabetes">
                    <option value="0">No</option>
                    <option value="1">Yes</option>
                </select>
            </div>
            <div class="input-group">
                <label>AST (U/L)</label>
                <input type="number" id="nafld-ast">
            </div>
            <div class="input-group">
                <label>ALT (U/L)</label>
                <input type="number" id="nafld-alt">
            </div>
            <div class="input-group">
                <label>Platelet Count (x10⁹/L)</label>
                <input type="number" id="nafld-platelet">
            </div>
            <div class="input-group">
                <label>Albumin (g/dL)</label>
                <input type="number" id="nafld-albumin" step="0.1">
            </div>
            <button id="calculate-nafld">Calculate Score</button>
            <div id="nafld-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function(client, patient, container) {
        const ageEl = container.querySelector('#nafld-age');
        const bmiEl = container.querySelector('#nafld-bmi');
        const astEl = container.querySelector('#nafld-ast');
        const altEl = container.querySelector('#nafld-alt');
        const plateletEl = container.querySelector('#nafld-platelet');
        const albuminEl = container.querySelector('#nafld-albumin');

        ageEl.value = calculateAge(patient.birthDate);

        // Fetch observations
        getMostRecentObservation(client, '39156-5').then(obs => { // BMI
            if (obs && obs.valueQuantity) bmiEl.value = obs.valueQuantity.value.toFixed(1);
        });
        getMostRecentObservation(client, '1920-8').then(obs => { // AST
            if (obs && obs.valueQuantity) astEl.value = obs.valueQuantity.value.toFixed(0);
        });
        getMostRecentObservation(client, '1742-6').then(obs => { // ALT
            if (obs && obs.valueQuantity) altEl.value = obs.valueQuantity.value.toFixed(0);
        });
        getMostRecentObservation(client, '777-3').then(obs => { // Platelet
            if (obs && obs.valueQuantity) plateletEl.value = obs.valueQuantity.value.toFixed(0);
        });
        getMostRecentObservation(client, '1751-7').then(obs => { // Albumin
            if (obs && obs.valueQuantity) albuminEl.value = obs.valueQuantity.value.toFixed(1);
        });

        container.querySelector('#calculate-nafld').addEventListener('click', () => {
            const age = parseInt(ageEl.value);
            const bmi = parseFloat(bmiEl.value);
            const diabetes = parseInt(container.querySelector('#nafld-diabetes').value);
            const ast = parseInt(astEl.value);
            const alt = parseInt(altEl.value);
            const platelet = parseInt(plateletEl.value);
            const albumin = parseFloat(albuminEl.value);

            if (isNaN(age) || isNaN(bmi) || isNaN(ast) || isNaN(alt) || isNaN(platelet) || isNaN(albumin)) {
                alert('Please enter all values.');
                return;
            }

            const score = -1.675 + (0.037 * age) + (0.094 * bmi) + (1.13 * diabetes) + (0.99 * (ast / alt)) - (0.013 * platelet) - (0.66 * albumin);
            
            let interpretation = '';
            if (score < -1.455) {
                interpretation = 'F0-F2 Fibrosis (low risk of advanced fibrosis).';
            } else if (score <= 0.675) {
                interpretation = 'Indeterminate Score.';
            } else {
                interpretation = 'F3-F4 Fibrosis (high risk of advanced fibrosis).';
            }

            container.querySelector('#nafld-result').innerHTML = `
                <p>NAFLD Fibrosis Score: ${score.toFixed(3)}</p>
                <p>Interpretation: ${interpretation}</p>
            `;
            container.querySelector('#nafld-result').style.display = 'block';
        });
    }
};
