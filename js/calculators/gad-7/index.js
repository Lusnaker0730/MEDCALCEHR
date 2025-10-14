// js/calculators/gad-7.js

export const gad7 = {
    id: 'gad-7',
    title: 'GAD-7 (General Anxiety Disorder-7)',
    description: 'Measures severity of anxiety.',
    generateHTML: function() {
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
            <h3>${this.title}</h3>
            <p>${this.description}</p>
            <div class="gad7-instructions">
                <p><strong>Over the last 2 weeks, how often have you been bothered by the following problems?</strong></p>
            </div>
            <div class="gad7-questions">
        `;

        questions.forEach((q, index) => {
            html += `
                <div class="gad7-question">
                    <div class="question-header">
                        <span class="question-number">${index + 1}</span>
                        <p class="question-text"><strong>${q}</strong></p>
                    </div>
                    <div class="gad7-options">
                        <label class="radio-label">
                            <input type="radio" name="gad7-q${index}" value="0" checked>
                            <span class="radio-custom"></span>
                            <span class="radio-text">Not at all <span class="score-badge">(0)</span></span>
                        </label>
                        <label class="radio-label">
                            <input type="radio" name="gad7-q${index}" value="1">
                            <span class="radio-custom"></span>
                            <span class="radio-text">Several days <span class="score-badge">(1)</span></span>
                        </label>
                        <label class="radio-label">
                            <input type="radio" name="gad7-q${index}" value="2">
                            <span class="radio-custom"></span>
                            <span class="radio-text">More than half the days <span class="score-badge">(2)</span></span>
                        </label>
                        <label class="radio-label">
                            <input type="radio" name="gad7-q${index}" value="3">
                            <span class="radio-custom"></span>
                            <span class="radio-text">Nearly every day <span class="score-badge">(3)</span></span>
                        </label>
                    </div>
                </div>
            `;
        });

        html += `
            </div>
            <button id="calculate-gad7">Calculate GAD-7 Score</button>
            <div id="gad7-result" class="result" style="display:none;"></div>
            <div class="gad7-scoring-guide">
                <h4>Score Interpretation:</h4>
                <div class="scoring-grid">
                    <div class="scoring-item minimal">
                        <span class="score-range">0-4</span>
                        <span class="severity-label">Minimal</span>
                    </div>
                    <div class="scoring-item mild">
                        <span class="score-range">5-9</span>
                        <span class="severity-label">Mild</span>
                    </div>
                    <div class="scoring-item moderate">
                        <span class="score-range">10-14</span>
                        <span class="severity-label">Moderate</span>
                    </div>
                    <div class="scoring-item severe">
                        <span class="score-range">15-21</span>
                        <span class="severity-label">Severe</span>
                    </div>
                </div>
            </div>
        `;
        return html;
    },
    initialize: function() {
        document.getElementById('calculate-gad7').addEventListener('click', () => {
            let score = 0;
            for (let i = 0; i < 7; i++) {
                score += parseInt(document.querySelector(`input[name="gad7-q${i}"]:checked`).value);
            }

            let severity = '';
            let severityClass = '';
            let recommendation = '';
            if (score <= 4) {
                severity = 'Minimal anxiety';
                severityClass = 'minimal';
                recommendation = 'Monitor; may not require treatment.';
            } else if (score <= 9) {
                severity = 'Mild anxiety';
                severityClass = 'mild';
                recommendation = 'Watchful waiting; consider psychoeducation.';
            } else if (score <= 14) {
                severity = 'Moderate anxiety';
                severityClass = 'moderate';
                recommendation = 'Consider therapy or pharmacotherapy.';
            } else { // score >= 15
                severity = 'Severe anxiety';
                severityClass = 'severe';
                recommendation = 'Active treatment with therapy and/or pharmacotherapy is indicated.';
            }

            const resultEl = document.getElementById('gad7-result');
            resultEl.innerHTML = `
                <div class="gad7-result-card ${severityClass}">
                    <div class="result-score">
                        <span class="score-label">GAD-7 Score:</span>
                        <span class="score-value">${score}</span>
                    </div>
                    <div class="result-severity ${severityClass}">
                        <span class="severity-icon">●</span>
                        <span class="severity-text">Anxiety Severity: ${severity}</span>
                    </div>
                    <div class="result-recommendation">
                        <div class="recommendation-header">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z" fill="currentColor"/>
                            </svg>
                            <span>Recommendation</span>
                        </div>
                        <p>${recommendation}</p>
                    </div>
                </div>
            `;
            resultEl.style.display = 'block';
            
            // Smooth scroll to result
            resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
    }
};
