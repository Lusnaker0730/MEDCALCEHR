// js/calculators/centor.js
import { calculateAge } from '../utils.js';

export const centor = {
    id: 'centor',
    title: 'Centor Score (Modified/McIsaac) for Strep Pharyngitis',
    description: 'Estimates probability that pharyngitis is streptococcal, and suggests management course.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p>${this.description}</p>
            <div class="checklist">
                <div class="check-item"><input type="checkbox" id="tonsillar-exudates" data-points="1"><label for="tonsillar-exudates">Tonsillar exudates or swelling</label></div>
                <div class="check-item"><input type="checkbox" id="swollen-nodes" data-points="1"><label for="swollen-nodes">Swollen, tender anterior cervical nodes</label></div>
                <div class="check-item"><input type="checkbox" id="fever" data-points="1"><label for="fever">Temperature > 38°C (100.4°F)</label></div>
                <div class="check-item"><input type="checkbox" id="no-cough" data-points="1"><label for="no-cough">Absence of cough</label></div>
            </div>
            <h4>McIsaac Modification (Age):</h4>
            <div class="input-group-radio">
                <input type="radio" id="age-under-15" name="age-group" value="1"><label for="age-under-15">Age 3-14 years (+1)</label>
            </div>
             <div class="input-group-radio">
                <input type="radio" id="age-15-44" name="age-group" value="0" checked><label for="age-15-44">Age 15-44 years (+0)</label>
            </div>
             <div class="input-group-radio">
                <input type="radio" id="age-over-45" name="age-group" value="-1"><label for="age-over-45">Age ≥ 45 years (-1)</label>
            </div>
            <button id="calculate-centor">Calculate Score</button>
            <div id="centor-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function(client, patient) {
        const age = calculateAge(patient.birthDate);
        if (age >= 3 && age <= 14) {
            document.getElementById('age-under-15').checked = true;
        } else if (age >= 45) {
            document.getElementById('age-over-45').checked = true;
        }

        document.getElementById('calculate-centor').addEventListener('click', () => {
            let score = 0;
            document.querySelectorAll('.checklist input[type="checkbox"]:checked').forEach(item => {
                score += parseInt(item.dataset.points);
            });
            score += parseInt(document.querySelector('input[name="age-group"]:checked').value);

            let probability = '';
            let recommendation = '';
            if (score <= 0) {
                probability = '<10%';
                recommendation = 'No antibiotic or throat culture necessary.';
            } else if (score === 1) {
                probability = '≈17%';
                recommendation = 'No antibiotic or throat culture necessary.';
            } else if (score === 2) {
                probability = '≈35%';
                recommendation = 'Consider throat culture or rapid antigen testing.';
            } else if (score === 3) {
                probability = '≈56%';
                recommendation = 'Consider throat culture or rapid antigen testing. May treat empirically.';
            } else { // score >= 4
                probability = '>85%';
                recommendation = 'Empiric antibiotic treatment is justified.';
            }

            const resultEl = document.getElementById('centor-result');
            resultEl.innerHTML = `
                <p><strong>Modified Centor (McIsaac) Score:</strong> ${score}</p>
                <p><strong>Probability of Strep Pharyngitis:</strong> ${probability}</p>
                <hr>
                <p><strong>Recommendation:</strong> ${recommendation}</p>
            `;
            resultEl.style.display = 'block';
        });
    }
};
