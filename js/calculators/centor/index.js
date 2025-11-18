// js/calculators/centor.js
import { calculateAge } from '../../utils.js';

export const centor = {
    id: 'centor',
    title: 'Centor Score (Modified/McIsaac) for Strep Pharyngitis',
    description:
        'Estimates probability that pharyngitis is streptococcal, and suggests management course.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            <div class="section">
                <div class="section-title"><span>Clinical Criteria</span></div>
                <div class="checkbox-group">
                    <label class="checkbox-option"><input type="checkbox" id="tonsillar-exudates" data-points="1"><span>Tonsillar exudates or swelling <strong>+1</strong></span></label>
                    <label class="checkbox-option"><input type="checkbox" id="swollen-nodes" data-points="1"><span>Swollen, tender anterior cervical nodes <strong>+1</strong></span></label>
                    <label class="checkbox-option"><input type="checkbox" id="fever" data-points="1"><span>Temperature > 38°C (100.4°F) <strong>+1</strong></span></label>
                    <label class="checkbox-option"><input type="checkbox" id="no-cough" data-points="1"><span>Absence of cough <strong>+1</strong></span></label>
                </div>
            </div>
            
            <div class="section mt-20">
                <div class="section-title"><span>McIsaac Modification (Age)</span></div>
                <div class="radio-group">
                    <label class="radio-option"><input type="radio" id="age-under-15" name="age-group" value="1"><span>Age 3-14 years <strong>+1</strong></span></label>
                    <label class="radio-option"><input type="radio" id="age-15-44" name="age-group" value="0" checked><span>Age 15-44 years <strong>+0</strong></span></label>
                    <label class="radio-option"><input type="radio" id="age-over-45" name="age-group" value="-1"><span>Age ≥ 45 years <strong>-1</strong></span></label>
                </div>
            </div>
            
            <div id="centor-result" class="result-container"></div>
        `;
    },
    initialize: function (client, patient, container) {
        const calculate = () => {
            let score = 0;
            container
                .querySelectorAll('.checkbox-option input[type="checkbox"]:checked')
                .forEach(item => {
                    score += parseInt(item.dataset.points);
                });
            score += parseInt(container.querySelector('input[name="age-group"]:checked').value);

            let probability = '';
            let recommendation = '';
            let alertClass = '';
            if (score <= 0) {
                probability = '<10%';
                recommendation = 'No antibiotic or throat culture necessary.';
                alertClass = 'success';
            } else if (score === 1) {
                probability = '≈17%';
                recommendation = 'No antibiotic or throat culture necessary.';
                alertClass = 'success';
            } else if (score === 2) {
                probability = '≈35%';
                recommendation = 'Consider throat culture or rapid antigen testing.';
                alertClass = 'warning';
            } else if (score === 3) {
                probability = '≈56%';
                recommendation =
                    'Consider throat culture or rapid antigen testing. May treat empirically.';
                alertClass = 'warning';
            } else {
                probability = '>85%';
                recommendation = 'Empiric antibiotic treatment is justified.';
                alertClass = 'danger';
            }

            const resultEl = container.querySelector('#centor-result');
            resultEl.innerHTML = `
                <div class="result-header"><h4>Centor Score Result</h4></div>
                <div class="result-score">
                    <span class="score-value">${score}</span>
                    <span class="score-label">/ 5 points</span>
                </div>
                <div class="result-item">
                    <span class="label">Probability of Strep:</span>
                    <span class="value">${probability}</span>
                </div>
                <div class="alert ${alertClass}">
                    <span class="alert-icon">${alertClass === 'success' ? '✓' : '⚠'}</span>
                    <div class="alert-content">
                        <p><strong>Recommendation:</strong> ${recommendation}</p>
                    </div>
                </div>
            `;
            resultEl.style.display = 'block';
        };

        if (patient && patient.birthDate) {
        const age = calculateAge(patient.birthDate);
        if (age >= 3 && age <= 14) {
            container.querySelector('#age-under-15').checked = true;
        } else if (age >= 45) {
            container.querySelector('#age-over-45').checked = true;
            }
        }

        container.querySelectorAll('.checkbox-option, .radio-option').forEach(option => {
            const input = option.querySelector('input');
            input.addEventListener('change', () => {
                if (input.type === 'checkbox') {
                    if (input.checked) {
                        option.classList.add('selected');
                    } else {
                        option.classList.remove('selected');
                    }
                } else if (input.type === 'radio') {
                    container.querySelectorAll(`input[name="${input.name}"]`).forEach(radio => {
                        radio.closest('.radio-option').classList.remove('selected');
                    });
                    if (input.checked) {
                        option.classList.add('selected');
                    }
                }
                calculate();
            });
            if (input.checked) {
                option.classList.add('selected');
            }
        });

        calculate();
    }
};
