
export const a4sDelirium = {
    id: '4as-delirium',
    title: "4 A's Test for Delirium Screening",
    description: 'Diagnoses delirium in older patients.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <div class="form-container">
                <div class="form-group">
                    <label>1. Alertness</label>
                    <select id="4as-alertness">
                        <option value="0">Normal (fully alert, but not agitated)</option>
                        <option value="0">Mild sleepiness for <10 seconds after waking, then normal</option>
                        <option value="4">Clearly abnormal (drowsy, agitated, or stuporous)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>2. AMT4 (Age, date of birth, place, current year)</label>
                    <select id="4as-amt4">
                        <option value="0">No mistakes</option>
                        <option value="1">1 mistake</option>
                        <option value="2">2 or more mistakes / untestable</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>3. Attention (Months of the year backwards)</label>
                    <select id="4as-attention">
                        <option value="0">7 or more correct</option>
                        <option value="1">Starts but scores <7 / refuses to start</option>
                        <option value="2">Untestable (drowsy, inattentive)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>4. Acute change or fluctuating course</label>
                    <select id="4as-change">
                        <option value="0">No</option>
                        <option value="4">Yes (from patient, collateral, or observation)</option>
                    </select>
                </div>
            </div>
            <button id="calculate-4as">Calculate Score</button>
            <div id="4as-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function() {
        document.getElementById('calculate-4as').addEventListener('click', () => {
            const alertness = parseInt(document.getElementById('4as-alertness').value);
            const amt4 = parseInt(document.getElementById('4as-amt4').value);
            const attention = parseInt(document.getElementById('4as-attention').value);
            const change = parseInt(document.getElementById('4as-change').value);

            const totalScore = alertness + amt4 + attention + change;

            let interpretation = '';
            if (totalScore >= 4) {
                interpretation = 'Possible delirium +/- cognitive impairment.';
            } else if (totalScore >= 1) {
                interpretation = 'Possible cognitive impairment.';
            } else {
                interpretation = 'Delirium or severe cognitive impairment unlikely.';
            }

            document.getElementById('4as-result').innerHTML = `
                <p>4 A's Test Score: ${totalScore}</p>
                <p>Interpretation: ${interpretation}</p>
            `;
            document.getElementById('4as-result').style.display = 'block';
        });
    }
};
