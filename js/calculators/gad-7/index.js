// js/calculators/gad-7.js

export const gad7 = {
    id: 'gad-7',
    title: 'GAD-7 (General Anxiety Disorder-7)',
    description: 'Screens for generalized anxiety disorder and monitors treatment response.',
    generateHTML: function () {
        const questions = [
            'Feeling nervous, anxious, or on edge',
            'Not being able to stop or control worrying',
            'Worrying too much about different things',
            'Trouble relaxing',
            'Being so restless that it is hard to sit still',
            'Becoming easily annoyed or irritable',
            'Feeling afraid as if something awful might happen'
        ];

        let html = `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            <div class="alert info">
                <span class="alert-icon">ℹ️</span>
                <div class="alert-content">
                    <p><strong>Instructions:</strong> Over the last 2 weeks, how often have you been bothered by the following problems?</p>
                </div>
            </div>
        `;

        questions.forEach((q, index) => {
            html += `
                <div class="section">
                    <div class="section-title"><span>${index + 1}. ${q}</span></div>
                    <div class="radio-group">
                        <label class="radio-option"><input type="radio" name="gad7-q${index}" value="0" checked><span>Not at all <strong>+0</strong></span></label>
                        <label class="radio-option"><input type="radio" name="gad7-q${index}" value="1"><span>Several days <strong>+1</strong></span></label>
                        <label class="radio-option"><input type="radio" name="gad7-q${index}" value="2"><span>More than half the days <strong>+2</strong></span></label>
                        <label class="radio-option"><input type="radio" name="gad7-q${index}" value="3"><span>Nearly every day <strong>+3</strong></span></label>
                    </div>
                </div>
            `;
        });

        html += '<div id="gad7-result" class="result-container"></div>';
        return html;
    },
    initialize: function (client, patient, container) {
        const calculate = () => {
            let score = 0;
            for (let i = 0; i < 7; i++) {
                const checked = container.querySelector(`input[name="gad7-q${i}"]:checked`);
                if (checked) {
                    score += parseInt(checked.value);
                }
            }

            let severity = '';
            let alertClass = '';
            let recommendation = '';
            if (score <= 4) {
                severity = 'Minimal anxiety';
                alertClass = 'success';
                recommendation = 'Monitor, may not require treatment.';
            } else if (score <= 9) {
                severity = 'Mild anxiety';
                alertClass = 'info';
                recommendation = 'Watchful waiting, reassessment in 4 weeks.';
            } else if (score <= 14) {
                severity = 'Moderate anxiety';
                alertClass = 'warning';
                recommendation = 'Active treatment with counseling and/or pharmacotherapy.';
            } else {
                severity = 'Severe anxiety';
                alertClass = 'danger';
                recommendation =
                    'Active treatment with pharmacotherapy and/or psychotherapy recommended.';
            }

            const resultEl = container.querySelector('#gad7-result');
            resultEl.innerHTML = `
                <div class="result-header"><h4>GAD-7 Result</h4></div>
                <div class="result-score">
                    <span class="score-value">${score}</span>
                    <span class="score-label">/ 21 points</span>
                </div>
                <div class="severity-indicator ${alertClass}">
                    <strong>${severity}</strong>
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
