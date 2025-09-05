export const childPugh = {
    id: 'child-pugh',
    title: 'Child-Pugh Score for Cirrhosis Mortality',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p>Estimates cirrhosis severity.</p>
            <div class="form-container">
                <div class="form-group">
                    <label for="cp-bilirubin">Total Bilirubin (mg/dL)</label>
                    <input type="number" id="cp-bilirubin" step="0.1" placeholder="e.g., 1.5">
                </div>
                <div class="form-group">
                    <label for="cp-albumin">Serum Albumin (g/dL)</label>
                    <input type="number" id="cp-albumin" step="0.1" placeholder="e.g., 3.2">
                </div>
                <div class="form-group">
                    <label for="cp-inr">INR</label>
                    <input type="number" id="cp-inr" step="0.1" placeholder="e.g., 1.5">
                </div>
                <div class="form-group">
                    <label for="cp-ascites">Ascites</label>
                    <select id="cp-ascites">
                        <option value="1">None</option>
                        <option value="2">Slight/Mild (diuretic responsive)</option>
                        <option value="3">Moderate/Severe (diuretic refractory)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="cp-encephalopathy">Hepatic Encephalopathy</label>
                    <select id="cp-encephalopathy">
                        <option value="1">None</option>
                        <option value="2">Grade 1-2 (or controlled)</option>
                        <option value="3">Grade 3-4 (or refractory)</option>
                    </select>
                </div>
            </div>
            <button id="calculate-child-pugh">Calculate Score</button>
            <div id="child-pugh-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function() {
        document.getElementById('calculate-child-pugh').addEventListener('click', () => {
            const bilirubin = parseFloat(document.getElementById('cp-bilirubin').value);
            const albumin = parseFloat(document.getElementById('cp-albumin').value);
            const inr = parseFloat(document.getElementById('cp-inr').value);
            const ascites = parseInt(document.getElementById('cp-ascites').value);
            const encephalopathy = parseInt(document.getElementById('cp-encephalopathy').value);

            if (isNaN(bilirubin) || isNaN(albumin) || isNaN(inr)) {
                alert('Please enter all lab values.');
                return;
            }

            let score = 0;

            // Bilirubin points
            if (bilirubin < 2) score += 1;
            else if (bilirubin <= 3) score += 2;
            else score += 3;

            // Albumin points
            if (albumin > 3.5) score += 1;
            else if (albumin >= 2.8) score += 2;
            else score += 3;
            
            // INR points
            if (inr < 1.7) score += 1;
            else if (inr <= 2.3) score += 2;
            else score += 3;

            score += ascites;
            score += encephalopathy;

            let classification = '';
            let survival1yr = '';
            let survival2yr = '';

            if (score <= 6) {
                classification = 'Class A';
                survival1yr = '100%';
                survival2yr = '85%';
            } else if (score <= 9) {
                classification = 'Class B';
                survival1yr = '81%';
                survival2yr = '57%';
            } else {
                classification = 'Class C';
                survival1yr = '45%';
                survival2yr = '35%';
            }

            const resultEl = document.getElementById('child-pugh-result');
            resultEl.innerHTML = `
                <p>Child-Pugh Score: ${score}</p>
                <p>Classification: ${classification}</p>
                <p>1-Year Survival: ${survival1yr}</p>
                <p>2-Year Survival: ${survival2yr}</p>
            `;
            resultEl.style.display = 'block';
        });
    }
};
