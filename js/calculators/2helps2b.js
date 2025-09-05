
export const helps2bScore = {
    id: '2helps2b-score',
    title: '2HELPS2B Score',
    description: 'Estimates seizure risk in acutely ill patients undergoing continuous EEG (cEEG).',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p class.description">${this.description}</p>
            <div class="checklist">
                <div class="check-item"><input type="checkbox" data-points="1"><label>Recent (within 7 days) clinical seizure</label></div>
                <div class="check-item"><input type="checkbox" data-points="1"><label>Brief rhythmic discharges (BRDs)</label></div>
                <div class="check-item"><input type="checkbox" data-points="1"><label>Frequent periodic/rhythmic discharges (>1.5 Hz)</label></div>
                <div class="check-item"><input type="checkbox" data-points="1"><label>Plus (+) modifier LPDs/LRDAs</label></div>
                <div class="check-item"><input type="checkbox" data-points="1"><label>Sporadic epileptiform discharges</label></div>
                <div class="check-item"><input type="checkbox" data-points="2"><label>History of seizures (epilepsy)</label></div>
                <div class="check-item"><input type="checkbox" data-points="2"><label>Coma or stupor</label></div>
            </div>
            <button id="calculate-2helps2b">Calculate Score</button>
            <div id="2helps2b-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function() {
        document.getElementById('calculate-2helps2b').addEventListener('click', () => {
            const checkboxes = document.querySelectorAll('#calculator-container .check-item input[type="checkbox"]');
            let score = 0;
            checkboxes.forEach(box => {
                if (box.checked) {
                    score += parseInt(box.dataset.points);
                }
            });

            const riskMap = {
                0: "5%", 1: "12%", 2: "27%", 3: "50%", 4: "73%", 5: "88%", 6: "95%", 7: ">95%"
            };

            const seizureRisk = riskMap[score] || ">95%";

            document.getElementById('2helps2b-result').innerHTML = `
                <p>2HELPS2B Score: ${score}</p>
                <p>Risk of Seizure within 72 hours: ${seizureRisk}</p>
            `;
            document.getElementById('2helps2b-result').style.display = 'block';
        });
    }
};
