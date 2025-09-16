// js/calculators/wells-pe.js
import { getMostRecentObservation } from '../../utils.js';

export const wellsPE = {
    id: 'wells-pe',
    title: "Wells' Criteria for Pulmonary Embolism",
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <div class="checklist">
                <div class="check-item"><input type="checkbox" id="wells-dvt" data-points="3"><label for="wells-dvt">Clinical signs and symptoms of DVT</label></div>
                <div class="check-item"><input type="checkbox" id="wells-alt" data-points="3"><label for="wells-alt">PE is #1 diagnosis OR equally likely</label></div>
                <div class="check-item"><input type="checkbox" id="wells-hr" data-points="1.5"><label for="wells-hr">Heart rate > 100 bpm</label></div>
                <div class="check-item"><input type="checkbox" id="wells-immo" data-points="1.5"><label for="wells-immo">Immobilization (≥3d) or surgery in previous 4 weeks</label></div>
                <div class="check-item"><input type="checkbox" id="wells-prev" data-points="1.5"><label for="wells-prev">Previous, objectively diagnosed PE or DVT</label></div>
                <div class="check-item"><input type="checkbox" id="wells-hemo" data-points="1"><label for="wells-hemo">Hemoptysis</label></div>
                <div class="check-item"><input type="checkbox" id="wells-mal" data-points="1"><label for="wells-mal">Malignancy (with treatment within 6 mo, or palliative)</label></div>
            </div>
            <button id="calculate-wells">Calculate Score</button>
            <div id="wells-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function(client) {
        getMostRecentObservation(client, '8867-4').then(hrObs => {
            if (hrObs && hrObs.valueQuantity.value > 100) {
                document.getElementById('wells-hr').checked = true;
            }
        });

        document.getElementById('calculate-wells').addEventListener('click', () => {
            const checkboxes = document.querySelectorAll('.calculator-card .check-item input[type="checkbox"]');
            let score = 0;
            checkboxes.forEach(box => {
                if (box.checked) {
                    score += parseFloat(box.dataset.points);
                }
            });

            let risk = '';
            if (score <= 1) risk = 'Low Risk (PE unlikely)';
            else if (score <= 6) risk = 'Moderate Risk';
            else risk = 'High Risk (PE likely)';

            const resultEl = document.getElementById('wells-result');
            resultEl.innerHTML = `
                <p>Wells' Score: ${score}</p>
                <p>${risk}</p>
            `;
            resultEl.style.display = 'block';
        });
    }
};


