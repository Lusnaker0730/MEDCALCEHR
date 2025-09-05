export const heartScore = {
    id: 'heart-score',
    title: 'HEART Score for Major Cardiac Events',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p>Predicts 6-week risk of major adverse cardiac events in patients with chest pain.</p>
            <div class="form-container">
                <div class="form-group">
                    <label>History</label>
                    <select id="heart-history">
                        <option value="0">Slightly suspicious</option>
                        <option value="1">Moderately suspicious</option>
                        <option value="2">Highly suspicious</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>ECG</label>
                    <select id="heart-ecg">
                        <option value="0">Normal</option>
                        <option value="1">Non-specific repolarization disturbance</option>
                        <option value="2">Significant ST deviation</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Age</label>
                    <select id="heart-age">
                        <option value="0">&lt; 45</option>
                        <option value="1">45-64</option>
                        <option value="2">&ge; 65</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Risk factors</label>
                    <select id="heart-risk">
                        <option value="0">No known risk factors</option>
                        <option value="1">1-2 risk factors</option>
                        <option value="2">&ge; 3 risk factors</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Troponin</label>
                    <select id="heart-troponin">
                        <option value="0">&le; Normal limit</option>
                        <option value="1">1-3x Normal limit</option>
                        <option value="2">&gt; 3x Normal limit</option>
                    </select>
                </div>
            </div>
            <button id="calculate-heart-score">Calculate Score</button>
            <div id="heart-score-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function() {
        document.getElementById('calculate-heart-score').addEventListener('click', () => {
            const history = parseInt(document.getElementById('heart-history').value);
            const ecg = parseInt(document.getElementById('heart-ecg').value);
            const age = parseInt(document.getElementById('heart-age').value);
            const riskFactors = parseInt(document.getElementById('heart-risk').value);
            const troponin = parseInt(document.getElementById('heart-troponin').value);

            const score = history + ecg + age + riskFactors + troponin;

            let risk = '';
            let maceRate = '';

            if (score <= 3) {
                risk = 'Low';
                maceRate = '0.9-1.7%';
            } else if (score <= 6) {
                risk = 'Moderate';
                maceRate = '12-16.6%';
            } else {
                risk = 'High';
                maceRate = '50-65%';
            }

            const resultEl = document.getElementById('heart-score-result');
            resultEl.innerHTML = `
                <p>HEART Score: ${score}</p>
                <p>Risk of Major Adverse Cardiac Event (MACE): ${maceRate}</p>
                <p>Recommendation: Score ${score} is ${risk} risk. Consider discharge, admission, or invasive strategies accordingly.</p>
            `;
            resultEl.style.display = 'block';
        });
    }
};
