// js/calculators/curb-65.js
import { calculateAge, getMostRecentObservation } from '../../utils.js';

export const curb65 = {
    id: 'curb-65',
    title: 'CURB-65 Score for Pneumonia Severity',
    description:
        'Estimates mortality of community-acquired pneumonia to help determine inpatient vs. outpatient treatment.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            <div class="alert info">
                <span class="alert-icon">ℹ️</span>
                <div class="alert-content">
                    <p>Check all criteria that apply. Score automatically calculates.</p>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">
                    <span>CURB-65 Criteria</span>
                </div>
                <div class="checkbox-group">
                    <label class="checkbox-option">
                        <input type="checkbox" id="curb-confusion">
                        <span><strong>C</strong>onfusion (new disorientation to person, place, or time) <strong>+1</strong></span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" id="curb-bun">
                        <span><strong>U</strong>rea > 7 mmol/L (BUN > 19 mg/dL) <strong>+1</strong></span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" id="curb-rr">
                        <span><strong>R</strong>espiratory Rate ≥ 30 breaths/min <strong>+1</strong></span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" id="curb-bp">
                        <span><strong>B</strong>lood Pressure (SBP < 90 or DBP ≤ 60 mmHg) <strong>+1</strong></span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" id="curb-age">
                        <span>Age ≥ <strong>65</strong> years <strong>+1</strong></span>
                    </label>
                </div>
            </div>
            
            <div id="curb65-result" class="result-container" style="display:none;"></div>
            
            <div class="info-section mt-20">
                <h5>Score Interpretation</h5>
                <div class="data-table">
                    <div class="data-row">
                        <span>0-1 points</span>
                        <span>0.6-2.7% mortality - Outpatient treatment</span>
                    </div>
                    <div class="data-row">
                        <span>2 points</span>
                        <span>6.8% mortality - Short hospitalization or supervised outpatient</span>
                    </div>
                    <div class="data-row">
                        <span>3 points</span>
                        <span>14% mortality - Hospital admission</span>
                    </div>
                    <div class="data-row">
                        <span>4-5 points</span>
                        <span>27.8% mortality - Hospital + consider ICU</span>
                    </div>
                </div>
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        // Auto-calculation function
        const calculate = () => {
            let score = 0;
            container.querySelectorAll('.checkbox-option input[type="checkbox"]').forEach(box => {
                if (box.checked) {
                    score++;
                }
            });

            let mortality = '';
            let recommendation = '';
            let riskLevel = '';
            let alertClass = '';

            switch (score) {
                case 0:
                    mortality = '0.6%';
                    recommendation = 'Low risk, consider outpatient treatment.';
                    riskLevel = 'Low Risk';
                    alertClass = 'success';
                    break;
                case 1:
                    mortality = '2.7%';
                    recommendation = 'Low risk, consider outpatient treatment.';
                    riskLevel = 'Low Risk';
                    alertClass = 'success';
                    break;
                case 2:
                    mortality = '6.8%';
                    recommendation =
                        'Moderate risk, consider short inpatient hospitalization or closely supervised outpatient treatment.';
                    riskLevel = 'Moderate Risk';
                    alertClass = 'warning';
                    break;
                case 3:
                    mortality = '14.0%';
                    recommendation = 'Severe pneumonia; manage in hospital.';
                    riskLevel = 'High Risk';
                    alertClass = 'danger';
                    break;
                case 4:
                case 5:
                    mortality = '27.8%';
                    recommendation =
                        'Severe pneumonia; manage in hospital and assess for ICU admission.';
                    riskLevel = 'Very High Risk';
                    alertClass = 'danger';
                    break;
            }

            const resultEl = container.querySelector('#curb65-result');
            resultEl.innerHTML = `
                <div class="result-header">
                    <h4>CURB-65 Score Result</h4>
                </div>
                <div class="result-score">
                    <span class="score-value">${score}</span>
                    <span class="score-label">/ 5 points</span>
                </div>
                <div class="result-item">
                    <span class="label">30-Day Mortality Risk:</span>
                    <span class="value">${mortality}</span>
                </div>
                <div class="severity-indicator ${alertClass}">
                    <strong>${riskLevel}</strong>
                </div>
                <div class="alert ${alertClass}">
                    <span class="alert-icon">${alertClass === 'success' ? '✓' : alertClass === 'warning' ? '⚠' : '⚠'}</span>
                    <div class="alert-content">
                        <p><strong>Recommendation:</strong></p>
                        <p>${recommendation}</p>
                    </div>
                </div>
            `;
            resultEl.style.display = 'block';
        };

        // FHIR auto-population
        const age = calculateAge(patient.birthDate);
        if (age >= 65) {
            container.querySelector('#curb-age').checked = true;
        }

        // Pre-fill vitals
        client
            .request(`Observation?patient=${client.patient.id}&code=85353-1&_sort=-date&_count=1`)
            .then(response => {
                if (response.entry && response.entry.length > 0) {
                    const vitals = response.entry[0].resource;
                    const rrComp = vitals.component.find(c => c.code.coding[0].code === '9279-1');
                    const sbpComp = vitals.component.find(c => c.code.coding[0].code === '8480-6');
                    const dbpComp = vitals.component.find(c => c.code.coding[0].code === '8462-4');
                    if (rrComp && rrComp.valueQuantity.value >= 30) {
                        container.querySelector('#curb-rr').checked = true;
                    }
                    if (
                        (sbpComp && sbpComp.valueQuantity.value < 90) ||
                        (dbpComp && dbpComp.valueQuantity.value <= 60)
                    ) {
                        container.querySelector('#curb-bp').checked = true;
                    }
                    calculate();
                }
            });

        // Pre-fill BUN (LOINC: 6299-8 or 3094-0)
        getMostRecentObservation(client, '3094-0').then(obs => {
            if (obs && obs.valueQuantity.value > 19) {
                container.querySelector('#curb-bun').checked = true;
                calculate();
            }
        });

        // Add visual feedback for checkbox options
        container.querySelectorAll('.checkbox-option').forEach(option => {
            const checkbox = option.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    option.classList.add('selected');
                } else {
                    option.classList.remove('selected');
                }
                calculate();
            });
            // Initialize state
            if (checkbox.checked) {
                option.classList.add('selected');
            }
        });

        // Initial calculation
        calculate();
    }
};
