import { getMostRecentObservation, calculateAge } from '../utils.js';

export const covid4cScore = {
    id: '4c-mortality-covid',
    title: '4C Mortality Score for COVID-19',
    description: 'Predicts in-hospital mortality in patients admitted with COVID-19.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <div class="sofa-grid">
                <div class="sofa-item"><label>Age (years)</label><input type="number" id="c4-age"></div>
                <div class="sofa-item"><label>Sex</label><select id="c4-sex"><option value="0">Female</option><option value="1">Male</option></select></div>
                <div class="sofa-item"><label>Number of comorbidities</label><input type="number" id="c4-comorbidities" placeholder="0, 1, 2, 3+"></div>
                <div class="sofa-item"><label>Respiratory Rate (breaths/min)</label><input type="number" id="c4-rr"></div>
                <div class="sofa-item"><label>Oxygen Saturation (%)</label><input type="number" id="c4-o2-sat"></div>
                <div class="sofa-item"><label>Glasgow Coma Scale</label><select id="c4-gcs"><option value="0">15</option><option value="2">14-9</option><option value="2">8-3</option></select></div>
                <div class="sofa-item"><label>Urea (mg/dL)</label><input type="number" id="c4-urea"></div>
                <div class="sofa-item"><label>C-Reactive Protein (mg/L)</label><input type="number" id="c4-crp"></div>
            </div>
            <button id="calculate-c4">Calculate Score</button>
            <div id="c4-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function(client, patient, container) {
        const ageEl = container.querySelector('#c4-age');
        const sexEl = container.querySelector('#c4-sex');
        const comorbiditiesEl = container.querySelector('#c4-comorbidities');
        const rrEl = container.querySelector('#c4-rr');
        const o2SatEl = container.querySelector('#c4-o2-sat');
        const gcsEl = container.querySelector('#c4-gcs');
        const ureaEl = container.querySelector('#c4-urea');
        const crpEl = container.querySelector('#c4-crp');

        // Pre-populate from patient demographics
        ageEl.value = calculateAge(patient.birthDate);
        sexEl.value = patient.gender === 'male' ? '1' : '0';

        // Fetch and pre-populate observations
        getMostRecentObservation(client, '9279-1').then(obs => { // Respiratory Rate
            if (obs && obs.valueQuantity) rrEl.value = obs.valueQuantity.value.toFixed(0);
        });
        getMostRecentObservation(client, '59408-5').then(obs => { // O2 Saturation
            if (obs && obs.valueQuantity) o2SatEl.value = obs.valueQuantity.value.toFixed(0);
        });
        getMostRecentObservation(client, '9269-2').then(obs => { // GCS
            if (obs && obs.valueQuantity) {
                const gcsScore = obs.valueQuantity.value;
                if (gcsScore < 15) {
                    gcsEl.value = '2';
                } else {
                    gcsEl.value = '0';
                }
            }
        });
        getMostRecentObservation(client, '3094-0').then(obs => { // Urea (BUN)
            if (obs && obs.valueQuantity) ureaEl.value = obs.valueQuantity.value.toFixed(0);
        });
        getMostRecentObservation(client, '1988-5').then(obs => { // C-Reactive Protein
            if (obs && obs.valueQuantity) crpEl.value = obs.valueQuantity.value.toFixed(1);
        });

        // Fetch and count comorbidities as an approximation
        client.patient.request('Condition').then(response => {
            if (response && response.total) {
                comorbiditiesEl.value = response.total;
            }
        });

        container.querySelector('#calculate-c4').addEventListener('click', () => {
            let score = 0;
            const age = parseInt(ageEl.value);
            const comorbidities = parseInt(comorbiditiesEl.value);
            const rr = parseInt(rrEl.value);
            const o2Sat = parseInt(o2SatEl.value);
            const urea = parseInt(ureaEl.value);
            const crp = parseInt(crpEl.value);

            if (isNaN(age) || isNaN(comorbidities) || isNaN(rr) || isNaN(o2Sat) || isNaN(urea) || isNaN(crp)) {
                alert('Please enter all values.');
                return;
            }

            // Points Calculation
            if (age >= 50 && age <= 59) score += 2; else if (age <= 69) score += 4; else if (age <= 79) score += 6; else if (age >= 80) score += 7;
            score += parseInt(sexEl.value);
            if (comorbidities === 1) score += 1; else if (comorbidities === 2) score += 2; else if (comorbidities >= 3) score += 3;
            if (rr >= 20 && rr <= 29) score += 1; else if (rr >= 30) score += 2;
            if (o2Sat >= 92) score += 0; else score += 2;
            score += parseInt(gcsEl.value);
            if (urea >= 20 && urea < 40) score += 1; else if (urea >= 40) score += 3;
            if (crp >= 50 && crp < 100) score += 1; else if (crp >= 100) score += 2;

            const riskMap = {
                0: '1.2%', 1: '1.2%', 2: '1.2%', 3: '2.4%', 4: '4.4%', 5: '7.0%', 6: '9.3%', 7: '13.4%', 8: '16.9%', 9: '23.0%',
                10: '27.4%', 11: '33.2%', 12: '38.6%', 13: '45.1%', 14: '52.0%', 15: '61.5%', 16: '61.5%', 17: '61.5%',
                18: '61.5%', 19: '61.5%', 20: '61.5%', 21: '61.5%'
            };
            
            const mortalityRisk = riskMap[score] || 'N/A';
            
            const resultEl = container.querySelector('#c4-result');
            resultEl.innerHTML = `
                <p>4C Mortality Score: ${score}</p>
                <p>In-hospital Mortality Risk: ${mortalityRisk}</p>
            `;
            resultEl.style.display = 'block';
        });
    }
};
