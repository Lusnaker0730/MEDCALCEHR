
// js/calculators/geneva-score.js
export const genevaScore = {
    id: 'geneva-score',
    title: 'Revised Geneva Score (Simplified)',
    description: 'Estimates the pre-test probability of pulmonary embolism (PE).',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <form id="geneva-form">
                <div class="checkbox-group">
                    <input type="checkbox" id="geneva-age" value="1"><label for="geneva-age">Age > 65 years</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" id="geneva-prev-dvt" value="1"><label for="geneva-prev-dvt">Previous DVT or PE</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" id="geneva-surgery" value="1"><label for="geneva-surgery">Surgery or fracture within 1 month</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" id="geneva-malignancy" value="1"><label for="geneva-malignancy">Active malignancy</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" id="geneva-limb-pain" value="1"><label for="geneva-limb-pain">Unilateral lower limb pain</label>
                </div>
                <div class="checkbox-group">
                    <input type="checkbox" id="geneva-hemoptysis" value="1"><label for="geneva-hemoptysis">Hemoptysis</label>
                </div>
                <div class="input-group">
                    <label for="geneva-hr">Heart Rate (bpm):</label>
                    <input type="number" id="geneva-hr" placeholder="e.g., 85">
                </div>
                 <div class="checkbox-group">
                    <input type="checkbox" id="geneva-palpation" value="1"><label for="geneva-palpation">Pain on deep vein palpation AND unilateral edema</label>
                </div>
            </form>
            <button id="calculate-geneva">Calculate Score</button>
            <div id="geneva-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function(container) {
        const calculateBtn = container.querySelector('#calculate-geneva');
        calculateBtn.addEventListener('click', () => {
            let score = 0;
            const checkboxes = container.querySelectorAll('#geneva-form input[type="checkbox"]:checked');
            checkboxes.forEach(box => {
                score += parseInt(box.value, 10);
            });

            const hr = parseInt(container.querySelector('#geneva-hr').value, 10);
            if (hr >= 75 && hr <= 94) {
                score += 1;
            } else if (hr >= 95) {
                score += 2;
            }

            let probability = '';
            // Using three-level classification
            if (score <= 1) {
                probability = 'Low Clinical Probability';
            } else if (score <= 4) {
                probability = 'Intermediate Clinical Probability';
            } else {
                probability = 'High Clinical Probability';
            }

            const resultEl = container.querySelector('#geneva-result');
            resultEl.innerHTML = `<p>Revised Geneva Score: ${score}</p><p>${probability}</p>`;
            resultEl.style.display = 'block';
        });
    }
};
