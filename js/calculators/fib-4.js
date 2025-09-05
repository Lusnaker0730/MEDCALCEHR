// js/calculators/fib-4.js
import { getMostRecentObservation, calculateAge } from '../utils.js';

export const fib4 = {
    id: 'fib-4',
    title: 'Fibrosis-4 (FIB-4) Index',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <div class="input-group">
                <label for="fib4-age">Age:</label>
                <input type="number" id="fib4-age" placeholder="loading...">
            </div>
            <div class="input-group">
                <label for="fib4-ast">AST (U/L):</label>
                <input type="number" id="fib4-ast" placeholder="loading...">
            </div>
            <div class="input-group">
                <label for="fib4-alt">ALT (U/L):</label>
                <input type="number" id="fib4-alt" placeholder="loading...">
            </div>
            <div class="input-group">
                <label for="fib4-plt">Platelet (x10⁹/L):</label>
                <input type="number" id="fib4-plt" placeholder="loading...">
            </div>
            <button id="calculate-fib4">Calculate</button>
            <div id="fib4-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function(client, patient) {
        const ageInput = document.getElementById('fib4-age');
        ageInput.value = calculateAge(patient.birthDate);

        getMostRecentObservation(client, '1920-8').then(obs => { // AST
            if (obs) document.getElementById('fib4-ast').value = obs.valueQuantity.value.toFixed(0);
        });
        getMostRecentObservation(client, '1742-6').then(obs => { // ALT
            if (obs) document.getElementById('fib4-alt').value = obs.valueQuantity.value.toFixed(0);
        });
        getMostRecentObservation(client, '777-3').then(obs => { // Platelets
            if (obs) document.getElementById('fib4-plt').value = obs.valueQuantity.value.toFixed(0);
        });

        document.getElementById('calculate-fib4').addEventListener('click', () => {
            const age = parseFloat(ageInput.value);
            const ast = parseFloat(document.getElementById('fib4-ast').value);
            const alt = parseFloat(document.getElementById('fib4-alt').value);
            const plt = parseFloat(document.getElementById('fib4-plt').value);
            const resultEl = document.getElementById('fib4-result');

            if (age > 0 && ast > 0 && alt > 0 && plt > 0) {
                const fib4_score = (age * ast) / (plt * Math.sqrt(alt));
                
                let interpretation = '';
                if (fib4_score < 1.30) {
                    interpretation = 'Low risk for advanced fibrosis.';
                } else if (fib4_score > 2.67) {
                    interpretation = 'High risk for advanced fibrosis.';
                } else {
                    interpretation = 'Indeterminate risk.';
                }
                
                resultEl.innerHTML = `
                    <p>FIB-4 Score: ${fib4_score.toFixed(2)}</p>
                    <p>${interpretation}</p>
                `;
                resultEl.style.display = 'block';
            } else {
                resultEl.innerText = 'Please enter valid Age, AST, ALT, and Platelet values.';
                resultEl.style.display = 'block';
            }
        });
    }
};

