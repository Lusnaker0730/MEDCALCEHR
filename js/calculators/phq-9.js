export const phq9 = {
    id: 'phq-9',
    title: 'PHQ-9 (Patient Health Questionnaire-9)',
    generateHTML: function() {
        const questions = [
            "Little interest or pleasure in doing things",
            "Feeling down, depressed, or hopeless",
            "Trouble falling or staying asleep, or sleeping too much",
            "Feeling tired or having little energy",
            "Poor appetite or overeating",
            "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
            "Trouble concentrating on things, such as reading the newspaper or watching television",
            "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual",
            "Thoughts that you would be better off dead or of hurting yourself in some way"
        ];

        let questionsHTML = '<p>Over the last 2 weeks, how often have you been bothered by any of the following problems?</p>';
        questionsHTML += '<div class="form-container">';
        questions.forEach((q, i) => {
            questionsHTML += `
                <div class="form-group">
                    <label>${i + 1}. ${q}</label>
                    <select id="phq9-q${i}">
                        <option value="0">Not at all</option>
                        <option value="1">Several days</option>
                        <option value="2">More than half the days</option>
                        <option value="3">Nearly every day</option>
                    </select>
                </div>
            `;
        });
        questionsHTML += '</div>';

        return `
            <h3>${this.title}</h3>
            ${questionsHTML}
            <button id="calculate-phq9">Calculate Score</button>
            <div id="phq9-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function() {
        document.getElementById('calculate-phq9').addEventListener('click', () => {
            let score = 0;
            for (let i = 0; i < 9; i++) {
                score += parseInt(document.getElementById(`phq9-q${i}`).value);
            }

            let severity = '';
            if (score <= 4) severity = 'Minimal depression';
            else if (score <= 9) severity = 'Mild depression';
            else if (score <= 14) severity = 'Moderate depression';
            else if (score <= 19) severity = 'Moderately severe depression';
            else severity = 'Severe depression';

            const resultEl = document.getElementById('phq9-result');
            resultEl.innerHTML = `
                <p>PHQ-9 Score: ${score}</p>
                <p>Depression Severity: ${severity}</p>
            `;
            resultEl.style.display = 'block';
        });
    }
};
