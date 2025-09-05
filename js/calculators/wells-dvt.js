export const wellsDVT = {
    id: 'wells-dvt',
    title: "Wells' Criteria for DVT",
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p>Calculates risk of DVT based on clinical criteria.</p>
            <div class="checklist">
                <div class="check-item"><input type="checkbox" id="dvt-cancer" data-points="1"><label for="dvt-cancer">Active cancer (treatment or palliation within 6 months)</label></div>
                <div class="check-item"><input type="checkbox" id="dvt-paralysis" data-points="1"><label for="dvt-paralysis">Paralysis, paresis, or recent plaster immobilization of the lower extremities</label></div>
                <div class="check-item"><input type="checkbox" id="dvt-bedridden" data-points="1"><label for="dvt-bedridden">Recently bedridden > 3 days or major surgery within 12 weeks requiring general or regional anesthesia</label></div>
                <div class="check-item"><input type="checkbox" id="dvt-tenderness" data-points="1"><label for="dvt-tenderness">Localized tenderness along the deep venous system</label></div>
                <div class="check-item"><input type="checkbox" id="dvt-swelling" data-points="1"><label for="dvt-swelling">Entire leg swollen</label></div>
                <div class="check-item"><input type="checkbox" id="dvt-calf" data-points="1"><label for="dvt-calf">Calf swelling at least 3 cm larger than asymptomatic side</label></div>
                <div class="check-item"><input type="checkbox" id="dvt-pitting" data-points="1"><label for="dvt-pitting">Pitting edema confined to the symptomatic leg</label></div>
                <div class="check-item"><input type="checkbox" id="dvt-collateral" data-points="1"><label for="dvt-collateral">Collateral superficial veins (nonvaricose)</label></div>
                <div class="check-item"><input type="checkbox" id="dvt-previous" data-points="1"><label for="dvt-previous">Previously documented DVT</label></div>
                <div class="check-item"><input type="checkbox" id="dvt-alternative" data-points="-2"><label for="dvt-alternative">Alternative diagnosis at least as likely as DVT</label></div>
            </div>
            <button id="calculate-wells-dvt">Calculate Score</button>
            <div id="wells-dvt-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function() {
        document.getElementById('calculate-wells-dvt').addEventListener('click', () => {
            const checkboxes = document.querySelectorAll('.calculator-card .check-item input[type="checkbox"]');
            let score = 0;
            checkboxes.forEach(box => {
                if (box.checked) {
                    score += parseInt(box.dataset.points);
                }
            });

            let risk = '';
            if (score >= 3) {
                risk = 'High Risk (DVT likely)';
            } else if (score >= 1) {
                risk = 'Moderate Risk';
            } else {
                risk = 'Low Risk (DVT unlikely)';
            }

            const resultEl = document.getElementById('wells-dvt-result');
            resultEl.innerHTML = `
                <p>Wells' Score for DVT: ${score}</p>
                <p>Risk: ${risk}</p>
            `;
            resultEl.style.display = 'block';
        });
    }
};
