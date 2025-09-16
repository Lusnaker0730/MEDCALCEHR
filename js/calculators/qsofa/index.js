
// js/calculators/qsofa.js
export const qsofaScore = {
    id: 'qsofa',
    title: 'qSOFA Score for Sepsis',
    description: 'Identifies patients with suspected infection at risk for poor outcomes (sepsis). Score ≥2 is positive.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <form id="qsofa-form">
                <div class="checkbox-group">
                    <input type="checkbox" id="qsofa-rr" value="1">
                    <label for="qsofa-rr">Respiratory Rate ≥ 22/min</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" id="qsofa-ams" value="1">
                    <label for="qsofa-ams">Altered Mental Status (GCS < 15)</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" id="qsofa-sbp" value="1">
                    <label for="qsofa-sbp">Systolic Blood Pressure ≤ 100 mmHg</label>
                </div>
            </form>
            <button id="calculate-qsofa">Calculate Score</button>
            <div id="qsofa-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function(container) {
        container.querySelector('#calculate-qsofa').addEventListener('click', () => {
            const inputs = container.querySelectorAll('#qsofa-form input[type="checkbox"]:checked');
            const score = inputs.length;
            
            let interpretation = '';
            if (score >= 2) {
                interpretation = 'Positive qSOFA: Increased risk of poor outcomes. Consider further sepsis evaluation.';
            } else {
                interpretation = 'Negative qSOFA: Lower risk, but continue to monitor if infection is suspected.';
            }

            const resultEl = container.querySelector('#qsofa-result');
            resultEl.innerHTML = `<p>qSOFA Score: ${score}</p><p>${interpretation}</p>`;
            resultEl.style.display = 'block';
        });
    }
};
