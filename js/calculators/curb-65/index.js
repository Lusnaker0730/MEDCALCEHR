import { calculateAge, getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';

export const curb65 = {
    id: 'curb-65',
    title: 'CURB-65 Score for Pneumonia Severity',
    description:
        'Estimates mortality of community-acquired pneumonia to help determine inpatient vs. outpatient treatment.',
    generateHTML: function () {
        const criteria = [
            { id: 'curb-confusion', label: '<strong>C</strong>onfusion (new disorientation to person, place, or time)', points: 1 },
            { id: 'curb-bun', label: '<strong>U</strong>rea > 7 mmol/L (BUN > 19 mg/dL)', points: 1 },
            { id: 'curb-rr', label: '<strong>R</strong>espiratory Rate ≥30 breaths/min', points: 1 },
            { id: 'curb-bp', label: '<strong>B</strong>lood Pressure (SBP < 90 or DBP ≤60 mmHg)', points: 1 },
            { id: 'curb-age', label: 'Age ≥<strong>65</strong> years', points: 1 }
        ];

        const criteriaSection = uiBuilder.createSection({
            title: 'CURB-65 Criteria',
            content: criteria.map(item => 
                uiBuilder.createRadioGroup({
                    name: item.id,
                    label: item.label,
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: '1', label: 'Yes (+1)' }
                    ]
                })
            ).join('')
        });

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
            
            ${criteriaSection}
            
            ${uiBuilder.createResultBox({ id: 'curb65-result', title: 'CURB-65 Score Result' })}
            
            <div class="info-section mt-20">
                <h5>Score Interpretation</h5>
                <table class="ui-data-table">
                    <thead>
                        <tr><th>Score</th><th>Mortality</th><th>Recommendation</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>0-1</td><td>0.6-2.7%</td><td>Outpatient treatment</td></tr>
                        <tr><td>2</td><td>6.8%</td><td>Short hospitalization or supervised outpatient</td></tr>
                        <tr><td>3</td><td>14%</td><td>Hospital admission</td></tr>
                        <tr><td>4-5</td><td>27.8%</td><td>Hospital + consider ICU</td></tr>
                    </tbody>
                </table>
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const setRadioValue = (name, value) => {
            const radio = container.querySelector(`input[name="${name}"][value="${value}"]`);
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change'));
            }
        };

        const calculate = () => {
            let score = 0;
            container.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
                score += parseInt(radio.value);
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
                    alertClass = 'ui-alert-success';
                    break;
                case 1:
                    mortality = '2.7%';
                    recommendation = 'Low risk, consider outpatient treatment.';
                    riskLevel = 'Low Risk';
                    alertClass = 'ui-alert-success';
                    break;
                case 2:
                    mortality = '6.8%';
                    recommendation =
                        'Moderate risk, consider short inpatient hospitalization or closely supervised outpatient treatment.';
                    riskLevel = 'Moderate Risk';
                    alertClass = 'ui-alert-warning';
                    break;
                case 3:
                    mortality = '14.0%';
                    recommendation = 'Severe pneumonia; manage in hospital.';
                    riskLevel = 'High Risk';
                    alertClass = 'ui-alert-danger';
                    break;
                case 4:
                case 5:
                    mortality = '27.8%';
                    recommendation =
                        'Severe pneumonia; manage in hospital and assess for ICU admission.';
                    riskLevel = 'Very High Risk';
                    alertClass = 'ui-alert-danger';
                    break;
            }

            const resultBox = container.querySelector('#curb65-result');
            const resultContent = resultBox.querySelector('.ui-result-content');

            resultContent.innerHTML = `
                ${uiBuilder.createResultItem({ 
                    label: 'Total Score', 
                    value: score, 
                    unit: '/ 5 points',
                    interpretation: riskLevel,
                    alertClass: alertClass
                })}
                
                <div class="result-item" style="margin-top: 10px; text-align: center;">
                    <span class="label" style="color: #666;">30-Day Mortality Risk:</span>
                    <span class="value" style="font-weight: 600;">${mortality}</span>
                </div>

                <div class="ui-alert ${alertClass} mt-10">
                    <span class="ui-alert-icon">${alertClass.includes('success') ? '✓' : '⚠️'}</span>
                    <div class="ui-alert-content">
                        <strong>Recommendation:</strong> ${recommendation}
                    </div>
                </div>
            `;
            
            resultBox.classList.add('show');
        };

        // Add event listeners
        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', calculate);
        });

        // FHIR auto-population
        if (patient && patient.birthDate) {
            const age = calculateAge(patient.birthDate);
            if (age >= 65) {
                setRadioValue('curb-age', '1');
            }
        }

        if (client) {
            // Pre-fill vitals
            client.request(`Observation?patient=${client.patient.id}&code=85353-1&_sort=-date&_count=1`)
                .then(response => {
                    if (response.entry && response.entry.length > 0) {
                        const vitals = response.entry[0].resource;
                        const rrComp = vitals.component.find(c => c.code.coding[0].code === LOINC_CODES.RESPIRATORY_RATE);
                        const sbpComp = vitals.component.find(c => c.code.coding[0].code === LOINC_CODES.SYSTOLIC_BP);
                        const dbpComp = vitals.component.find(c => c.code.coding[0].code === LOINC_CODES.DIASTOLIC_BP);
                        if (rrComp && rrComp.valueQuantity.value >= 30) {
                            setRadioValue('curb-rr', '1');
                        }
                        if (
                            (sbpComp && sbpComp.valueQuantity.value < 90) ||
                            (dbpComp && dbpComp.valueQuantity.value <= 60)
                        ) {
                            setRadioValue('curb-bp', '1');
                        }
                    }
                });

            // Pre-fill BUN (LOINC: 6299-8 or 3094-0)
            getMostRecentObservation(client, LOINC_CODES.BUN).then(obs => {
                if (obs && obs.valueQuantity.value > 19) {
                    setRadioValue('curb-bun', '1');
                }
            });
        }

        // Initial calculation
        calculate();
    }
};