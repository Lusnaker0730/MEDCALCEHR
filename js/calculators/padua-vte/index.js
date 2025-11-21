import { getMostRecentObservation, calculateAge } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';

export const paduaVTE = {
    id: 'padua-vte',
    title: 'Padua Prediction Score for Risk of VTE',
    description: 'Determines anticoagulation need in hospitalized patients by risk of VTE.',
    generateHTML: function () {
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
            <div id="padua-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function (client, patient, container) {
        const root = container || document;

        // Auto-populate age
        if (patient && patient.birthDate) {
            const age = calculateAge(patient.birthDate);
            const ageCheckbox = root.querySelector('#padua-age');
            if (age >= 70 && ageCheckbox) {
                ageCheckbox.checked = true;
            }
        }

        // Auto-populate BMI
        getMostRecentObservation(client, LOINC_CODES.BMI).then(obs => {
            if (obs && obs.valueQuantity) {
                const bmi = obs.valueQuantity.value;
                const obesityCheckbox = root.querySelector('#padua-obesity');
                if (bmi >= 30 && obesityCheckbox) {
                    obesityCheckbox.checked = true;
                }
            }
        });

        const calculate = () => {
            const checkboxes = root.querySelectorAll('.check-item input[type="checkbox"]');
            let score = 0;
            checkboxes.forEach(box => {
                if (box.checked) {
                    score += parseInt(box.dataset.points);
                }
            });

            const alertClass = score >= 4 ? 'danger' : 'success';
            const riskLevel = score >= 4 ? 'High Risk for VTE' : 'Low Risk for VTE';
            const recommendation =
                score >= 4
                    ? 'Pharmacologic prophylaxis is recommended.'
                    : 'Pharmacologic prophylaxis may not be necessary.';

            root.querySelector('#padua-result').innerHTML = `
                <div class="result-header"><h4>Padua Score Result</h4></div>
                <div class="result-score">
                    <span class="score-value">${score}</span>
                    <span class="score-label">points</span>
                </div>
                <div class="severity-indicator ${alertClass}">
                    <strong>${riskLevel}</strong>
                </div>
                <div class="alert ${alertClass}">
                    <span class="alert-icon">${alertClass === 'success' ? '✓' : '⚠'}</span>
                    <div class="alert-content">
                        <p><strong>Recommendation:</strong> ${recommendation}</p>
                    </div>
                </div>
            `;
            root.querySelector('#padua-result').style.display = 'block';
        };

        // Add event listeners
        root.querySelectorAll('.check-item input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', calculate);
        });

        calculate();
    }
};
