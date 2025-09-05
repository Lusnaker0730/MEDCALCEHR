
export const a4tsHit = {
    id: '4ts-hit',
    title: '4Ts Score for Heparin-Induced Thrombocytopenia',
    description: 'Differentiates patients with HIT from those with other causes of thrombocytopenia.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <div class="form-container">
                <div class="form-group">
                    <label>Thrombocytopenia</label>
                    <select id="4ts-platelets">
                        <option value="2">>50% fall in platelets</option>
                        <option value="1">30-50% fall in platelets</option>
                        <option value="0"><30% fall in platelets</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Timing of platelet count fall</label>
                    <select id="4ts-timing">
                        <option value="2">Clear onset between days 5-10</option>
                        <option value="1">Consistent with 5-10 day onset, but not clear</option>
                        <option value="0">Platelet fall < day 4 without prior heparin</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Thrombosis or other sequelae</label>
                    <select id="4ts-thrombosis">
                        <option value="2">New thrombosis confirmed</option>
                        <option value="1">Progressive or recurrent thrombosis</option>
                        <option value="0">None</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Other causes for thrombocytopenia</label>
                    <select id="4ts-other-causes">
                        <option value="2">None apparent</option>
                        <option value="1">Possible</option>
                        <option value="0">Definite</option>
                    </select>
                </div>
            </div>
            <button id="calculate-4ts">Calculate Score</button>
            <div id="4ts-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function() {
        document.getElementById('calculate-4ts').addEventListener('click', () => {
            const platelets = parseInt(document.getElementById('4ts-platelets').value);
            const timing = parseInt(document.getElementById('4ts-timing').value);
            const thrombosis = parseInt(document.getElementById('4ts-thrombosis').value);
            const otherCauses = parseInt(document.getElementById('4ts-other-causes').value);
            const totalScore = platelets + timing + thrombosis + otherCauses;

            let probability = '';
            if (totalScore >= 6) {
                probability = 'High Probability';
            } else if (totalScore >= 4) {
                probability = 'Intermediate Probability';
            } else {
                probability = 'Low Probability';
            }

            document.getElementById('4ts-result').innerHTML = `
                <p>4Ts Score: ${totalScore}</p>
                <p>Probability of HIT: ${probability}</p>
            `;
            document.getElementById('4ts-result').style.display = 'block';
        });
    }
};
