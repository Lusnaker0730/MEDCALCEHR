export const phq9 = {
    id: 'phq-9',
    title: 'PHQ-9 (Patient Health Questionnaire-9)',
    description: 'Screens for depression and monitors treatment response.',
    generateHTML: function () {
        const questions = [
            'Little interest or pleasure in doing things',
            'Feeling down, depressed, or hopeless',
            'Trouble falling or staying asleep, or sleeping too much',
            'Feeling tired or having little energy',
            'Poor appetite or overeating',
            'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
            'Trouble concentrating on things, such as reading the newspaper or watching television',
            'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual',
            'Thoughts that you would be better off dead or of hurting yourself in some way'
        ];

        let html = `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            <div class="alert info">
                <span class="alert-icon">ℹ️</span>
                <div class="alert-content">
                    <p><strong>Instructions:</strong> Over the last 2 weeks, how often have you been bothered by any of the following problems?</p>
                </div>
            </div>
        `;

        questions.forEach((q, i) => {
            html += `
                <div class="section">
                    <div class="section-title"><span>${i + 1}. ${q}</span></div>
                    <div class="radio-group">
                        <label class="radio-option"><input type="radio" name="phq9-q${i}" value="0" checked><span>Not at all <strong>+0</strong></span></label>
                        <label class="radio-option"><input type="radio" name="phq9-q${i}" value="1"><span>Several days <strong>+1</strong></span></label>
                        <label class="radio-option"><input type="radio" name="phq9-q${i}" value="2"><span>More than half the days <strong>+2</strong></span></label>
                        <label class="radio-option"><input type="radio" name="phq9-q${i}" value="3"><span>Nearly every day <strong>+3</strong></span></label>
                    </div>
                </div>
            `;
        });

        html += `<div id="phq9-result" class="result-container"></div>`;
        return html;
    },
    initialize: function (client, patient, container) {
        const calculate = () => {
            let score = 0;
            for (let i = 0; i < 9; i++) {
                const checked = container.querySelector(`input[name="phq9-q${i}"]:checked`);
                if (checked) {
                    score += parseInt(checked.value);
                }
            }

            let severity = '';
            let alertClass = '';
            if (score <= 4) {
                severity = 'Minimal depression';
                alertClass = 'success';
            } else if (score <= 9) {
                severity = 'Mild depression';
                alertClass = 'info';
            } else if (score <= 14) {
                severity = 'Moderate depression';
                alertClass = 'warning';
            } else if (score <= 19) {
                severity = 'Moderately severe depression';
                alertClass = 'danger';
            } else {
                severity = 'Severe depression';
                alertClass = 'danger';
            }

            const resultEl = container.querySelector('#phq9-result');
            resultEl.innerHTML = `
                <div class="result-header"><h4>PHQ-9 Result</h4></div>
                <div class="result-score">
                    <span class="score-value">${score}</span>
                    <span class="score-label">/ 27 points</span>
                </div>
                <div class="severity-indicator ${alertClass}">
                    <strong>${severity}</strong>
                </div>
                <div class="alert ${alertClass}">
                    <span class="alert-icon">${alertClass === 'success' ? '✓' : '⚠'}</span>
                    <div class="alert-content">
                        <p><strong>Recommendation:</strong> ${score <= 4 ? 'Monitor, may not require treatment.' : score <= 14 ? 'Consider counseling, follow-up, and/or pharmacotherapy.' : 'Active treatment with pharmacotherapy and/or psychotherapy recommended.'}</p>
                    </div>
                </div>
            `;
            resultEl.style.display = 'block';
        };

        container.querySelectorAll('.radio-option').forEach(option => {
            const radio = option.querySelector('input[type="radio"]');
            radio.addEventListener('change', () => {
                const name = radio.name;
                container.querySelectorAll(`input[name="${name}"]`).forEach(r => {
                    r.closest('.radio-option').classList.remove('selected');
                });
                if (radio.checked) {
                    option.classList.add('selected');
                }
                calculate();
            });
            if (radio.checked) {
                option.classList.add('selected');
            }
        });

        calculate();
    }
};
