import { getMostRecentObservation, calculateAge } from '../../utils.js';

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
                <div class="check-item"><input type="checkbox" id="padua-age" data-points="1"><label>Age ≥70 years</label></div>
                <div class="check-item"><input type="checkbox" data-points="1"><label>Heart and/or respiratory failure</label></div>
                <div class="check-item"><input type="checkbox" data-points="1"><label>Acute MI or ischemic stroke</label></div>
                <div class="check-item"><input type="checkbox" data-points="1"><label>Acute infection and/or rheumatologic disorder</label></div>
                <div class="check-item"><input type="checkbox" id="padua-obesity" data-points="1"><label>Obesity (BMI ≥30 kg/m²)</label></div>
                <div class="check-item"><input type="checkbox" data-points="1"><label>Ongoing hormonal treatment</label></div>
            </div>
            <button id="calculate-padua">Calculate Score</button>
            <div id="padua-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function(client, patient, container) {
        const root = container || document;
        
        // Auto-populate age
        const age = calculateAge(patient.birthDate);
        const ageCheckbox = root.querySelector('#padua-age');
        if (age >= 70 && ageCheckbox) {
            ageCheckbox.checked = true;
        }
        
        // Auto-populate BMI
        getMostRecentObservation(client, '39156-5').then(obs => {
            if (obs && obs.valueQuantity) {
                const bmi = obs.valueQuantity.value;
                const obesityCheckbox = root.querySelector('#padua-obesity');
                if (bmi >= 30 && obesityCheckbox) {
                    obesityCheckbox.checked = true;
                }
            }
        });
        
        root.querySelector('#calculate-padua').addEventListener('click', () => {
            const checkboxes = root.querySelectorAll('.check-item input[type="checkbox"]');
            let score = 0;
            checkboxes.forEach(box => {
                if (box.checked) {
                    score += parseInt(box.dataset.points);
                }
            });

            let riskLevel = (score >= 4) ? 
                'High Risk for VTE. Pharmacologic prophylaxis is recommended.' : 
                'Low Risk for VTE. Pharmacologic prophylaxis may not be necessary.';

            root.querySelector('#padua-result').innerHTML = `
                <p>Padua Score: ${score}</p>
                <p>${riskLevel}</p>
            `;
            root.querySelector('#padua-result').style.display = 'block';
        });
    }
};
