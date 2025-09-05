import { getMostRecentObservation, calculateAge } from '../utils.js';

export const sixMwd = {
    id: '6mwd',
    title: '6 Minute Walk Distance',
    description: 'Calculates reference values for distance walked, as a measure of functional status.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <div class="input-group">
                <label>Age (years)</label>
                <input type="number" id="mwd6-age">
            </div>
            <div class="input-group">
                <label>Gender</label>
                <select id="mwd6-gender">
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                </select>
            </div>
            <div class="input-group">
                <label>Height (cm)</label>
                <input type="number" id="mwd6-height">
            </div>
            <div class="input-group">
                <label>Weight (kg)</label>
                <input type="number" id="mwd6-weight">
            </div>
            <button id="calculate-mwd6">Calculate Reference Distance</button>
            <div id="mwd6-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function(client, patient, container) {
        // Auto-populate fields
        const ageEl = container.querySelector('#mwd6-age');
        const genderEl = container.querySelector('#mwd6-gender');
        const heightEl = container.querySelector('#mwd6-height');
        const weightEl = container.querySelector('#mwd6-weight');

        ageEl.value = calculateAge(patient.birthDate);
        genderEl.value = patient.gender;

        getMostRecentObservation(client, '8302-2').then(obs => { // Height
            if (obs && obs.valueQuantity) heightEl.value = obs.valueQuantity.value.toFixed(1);
        });
        getMostRecentObservation(client, '29463-7').then(obs => { // Weight
            if (obs && obs.valueQuantity) weightEl.value = obs.valueQuantity.value.toFixed(1);
        });

        container.querySelector('#calculate-mwd6').addEventListener('click', () => {
            const age = parseInt(ageEl.value);
            const gender = genderEl.value;
            const height = parseInt(heightEl.value);
            const weight = parseInt(weightEl.value);

            if (isNaN(age) || isNaN(height) || isNaN(weight)) {
                alert('Please enter all values.');
                return;
            }

            let referenceDistance = 0;
            if (gender === 'male') {
                referenceDistance = (7.57 * height) - (5.02 * age) - (1.76 * weight) - 309;
            } else { // female
                referenceDistance = (2.11 * height) - (2.29 * weight) - (5.78 * age) + 667;
            }

            container.querySelector('#mwd6-result').innerHTML = `
                <p>Predicted 6-Minute Walk Distance: ${referenceDistance.toFixed(0)} meters</p>
            `;
            container.querySelector('#mwd6-result').style.display = 'block';
        });
    }
};
