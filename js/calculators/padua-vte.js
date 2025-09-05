export const paduaVTE = {
    id: 'padua-vte',
    title: 'Padua Prediction Score for Risk of VTE',
    description: 'Determines anticoagulation need in hospitalized patients by risk of VTE.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <div class="checklist">
                <div class="check-item"><input type="checkbox" data-points="3"><label>Active cancer</label></div>
                <div class="check-item"><input type="checkbox" data-points="3"><label>Previous VTE (excluding superficial vein thrombosis)</label></div>
                <div class="check-item"><input type="checkbox" data-points="3"><label>Reduced mobility (bedrest with bathroom privileges for ≥3 days)</label></div>
                <div class="check-item"><input type="checkbox" data-points="3"><label>Known thrombophilic condition</label></div>
                <div class="check-item"><input type="checkbox" data-points="2"><label>Recent (≤1 month) trauma and/or surgery</label></div>
                <div class="check-item"><input type="checkbox" data-points="1"><label>Age ≥70 years</label></div>
                <div class="check-item"><input type="checkbox" data-points="1"><label>Heart and/or respiratory failure</label></div>
                <div class="check-item"><input type="checkbox" data-points="1"><label>Acute MI or ischemic stroke</label></div>
                <div class="check-item"><input type="checkbox" data-points="1"><label>Acute infection and/or rheumatologic disorder</label></div>
                <div class="check-item"><input type="checkbox" data-points="1"><label>Obesity (BMI ≥30 kg/m²)</label></div>
                <div class="check-item"><input type="checkbox" data-points="1"><label>Ongoing hormonal treatment</label></div>
            </div>
            <button id="calculate-padua">Calculate Score</button>
            <div id="padua-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function() {
        document.getElementById('calculate-padua').addEventListener('click', () => {
            const checkboxes = document.querySelectorAll('#calculator-container .check-item input[type="checkbox"]');
            let score = 0;
            checkboxes.forEach(box => {
                if (box.checked) {
                    score += parseInt(box.dataset.points);
                }
            });

            let riskLevel = (score >= 4) ? 
                'High Risk for VTE. Pharmacologic prophylaxis is recommended.' : 
                'Low Risk for VTE. Pharmacologic prophylaxis may not be necessary.';

            document.getElementById('padua-result').innerHTML = `
                <p>Padua Score: ${score}</p>
                <p>${riskLevel}</p>
            `;
            document.getElementById('padua-result').style.display = 'block';
        });
    }
};
