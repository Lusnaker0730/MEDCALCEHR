// js/calculators/curb-65.js
import { calculateAge, getMostRecentObservation } from '../../utils.js';

export const curb65 = {
    id: 'curb-65',
    title: 'CURB-65 Score for Pneumonia Severity',
    description: 'Estimates mortality of community-acquired pneumonia to help determine inpatient vs. outpatient treatment.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p>${this.description}</p>
            <div class="checklist">
                <div class="check-item"><input type="checkbox" id="curb-confusion"><label for="curb-confusion"><strong>C</strong>onfusion (new disorientation to person, place, or time)</label></div>
                <div class="check-item"><input type="checkbox" id="curb-bun"><label for="curb-bun"><strong>U</strong>rea > 7 mmol/L (BUN > 19 mg/dL)</label></div>
                <div class="check-item"><input type="checkbox" id="curb-rr"><label for="curb-rr"><strong>R</strong>espiratory Rate ≥ 30 breaths/min</label></div>
                <div class="check-item"><input type="checkbox" id="curb-bp"><label for="curb-bp"><strong>B</strong>lood Pressure (SBP < 90 mmHg or DBP ≤ 60 mmHg)</label></div>
                <div class="check-item"><input type="checkbox" id="curb-age"><label for="curb-age">Age ≥ <strong>65</strong> years</label></div>
            </div>
            <button id="calculate-curb65">Calculate CURB-65 Score</button>
            <div id="curb65-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function(client, patient, container) {
        const age = calculateAge(patient.birthDate);
        if (age >= 65) {
            container.querySelector('#curb-age').checked = true;
        }

        // Pre-fill vitals
        client.request(`Observation?patient=${client.patient.id}&code=85353-1&_sort=-date&_count=1`).then(response => {
            if (response.entry && response.entry.length > 0) {
                const vitals = response.entry[0].resource;
                const rrComp = vitals.component.find(c => c.code.coding[0].code === '9279-1');
                const sbpComp = vitals.component.find(c => c.code.coding[0].code === '8480-6');
                const dbpComp = vitals.component.find(c => c.code.coding[0].code === '8462-4');
                if (rrComp && rrComp.valueQuantity.value >= 30) container.querySelector('#curb-rr').checked = true;
                if ((sbpComp && sbpComp.valueQuantity.value < 90) || (dbpComp && dbpComp.valueQuantity.value <= 60)) {
                    container.querySelector('#curb-bp').checked = true;
                }
            }
        });
        // Pre-fill BUN (LOINC: 6299-8 or 3094-0)
        getMostRecentObservation(client, '3094-0').then(obs => { // Switched to 3094-0 for better sandbox compatibility
            if(obs && obs.valueQuantity.value > 19) container.querySelector('#curb-bun').checked = true;
        });

        container.querySelector('#calculate-curb65').addEventListener('click', () => {
            let score = 0;
            container.querySelectorAll('.checklist input[type="checkbox"]').forEach(box => {
                if (box.checked) score++;
            });

            let mortality = '';
            let recommendation = '';
            switch(score) {
                case 0:
                    mortality = '0.6%';
                    recommendation = 'Low risk, consider outpatient treatment.';
                    break;
                case 1:
                    mortality = '2.7%';
                     recommendation = 'Low risk, consider outpatient treatment.';
                    break;
                case 2:
                    mortality = '6.8%';
                    recommendation = 'Moderate risk, consider short inpatient hospitalization or closely supervised outpatient treatment.';
                    break;
                case 3:
                    mortality = '14.0%';
                    recommendation = 'Severe pneumonia; manage in hospital.';
                    break;
                case 4:
                case 5:
                    mortality = '27.8%';
                    recommendation = 'Severe pneumonia; manage in hospital and assess for ICU admission.';
                    break;
            }

            const resultEl = container.querySelector('#curb65-result');
            resultEl.innerHTML = `
                <p><strong>CURB-65 Score:</strong> ${score}</p>
                <p><strong>30-Day Mortality Risk:</strong> ~${mortality}</p>
                <hr>
                <p><strong>Recommendation:</strong> ${recommendation}</p>
            `;
            resultEl.style.display = 'block';
        });
    }
};
