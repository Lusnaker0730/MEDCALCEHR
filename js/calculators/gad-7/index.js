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
            <p>Over the last 2 weeks, how often have you been bothered by the following problems?</p>
            <div class="gad7-questions">
        `;

        questions.forEach((q, index) => {
            html += `
                <div class="gad7-question">
                    <p>${index + 1}. ${q}</p>
                    <div class="gad7-options">
                        <label><input type="radio" name="gad7-q${index}" value="0" checked> Not at all (0)</label>
                        <label><input type="radio" name="gad7-q${index}" value="1"> Several days (1)</label>
                        <label><input type="radio" name="gad7-q${index}" value="2"> More than half the days (2)</label>
                        <label><input type="radio" name="gad7-q${index}" value="3"> Nearly every day (3)</label>
                    </div>
                </div>
            `;
        });

        html += `
            </div>
            <button id="calculate-gad7">Calculate GAD-7 Score</button>
            <div id="gad7-result" class="result" style="display:none;"></div>
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
            let recommendation = '';
            if (score <= 4) {
                severity = 'Minimal anxiety';
                recommendation = 'Monitor; may not require treatment.';
            } else if (score <= 9) {
                severity = 'Mild anxiety';
                recommendation = 'Watchful waiting; consider psychoeducation.';
            } else if (score <= 14) {
                severity = 'Moderate anxiety';
                recommendation = 'Consider therapy or pharmacotherapy.';
            } else { // score >= 15
                severity = 'Severe anxiety';
                recommendation = 'Active treatment with therapy and/or pharmacotherapy is indicated.';
            }

            const resultEl = document.getElementById('gad7-result');
            resultEl.innerHTML = `
                <p><strong>GAD-7 Score:</strong> ${score}</p>
                <p><strong>Anxiety Severity:</strong> ${severity}</p>
                <hr>
                <p><strong>Recommendation:</strong> ${recommendation}</p>
            `;
            resultEl.style.display = 'block';
        });
    }
};
