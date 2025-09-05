import { getMostRecentObservation, calculateAge } from '../utils.js';

export const crcl = {
    id: 'crcl',
    title: 'Creatinine Clearance (Cockcroft-Gault Equation)',
    description: 'Calculates CrCl according to the Cockcroft-Gault equation.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <div class="input-group">
                <label>Age (years)</label>
                <input type="number" id="crcl-age">
            </div>
            <div class="input-group">
                <label>Weight (kg)</label>
                <input type="number" id="crcl-weight">
            </div>
            <div class="input-group">
                <label>Serum Creatinine (mg/dL)</label>
                <input type="number" id="crcl-scr" step="0.1">
            </div>
            <div class="input-group">
                <label>Gender</label>
                <select id="crcl-gender">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                </select>
            </div>
            <button id="calculate-crcl">Calculate Clearance</button>
            <div id="crcl-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function(client, patient, container) {
        const ageEl = container.querySelector('#crcl-age');
        const weightEl = container.querySelector('#crcl-weight');
        const scrEl = container.querySelector('#crcl-scr');
        const genderEl = container.querySelector('#crcl-gender');

        ageEl.value = calculateAge(patient.birthDate);
        genderEl.value = patient.gender;

        getMostRecentObservation(client, '29463-7').then(obs => { // Weight
            if (obs && obs.valueQuantity) weightEl.value = obs.valueQuantity.value.toFixed(1);
        });
        getMostRecentObservation(client, '2160-0').then(obs => { // Serum Creatinine
            if (obs && obs.valueQuantity) scrEl.value = obs.valueQuantity.value.toFixed(2);
        });

        container.querySelector('#calculate-crcl').addEventListener('click', () => {
            const age = parseInt(ageEl.value);
            const weight = parseFloat(weightEl.value);
            const scr = parseFloat(scrEl.value);
            const gender = genderEl.value;

            if (isNaN(age) || isNaN(weight) || isNaN(scr)) {
                alert('Please enter all values.');
                return;
            }

            let crcl = ((140 - age) * weight) / (72 * scr);
            if (gender === 'female') {
                crcl *= 0.85;
            }

            container.querySelector('#crcl-result').innerHTML = `
                <p>Creatinine Clearance: ${crcl.toFixed(1)} mL/min</p>
            `;
            container.querySelector('#crcl-result').style.display = 'block';
        });
    }
};
