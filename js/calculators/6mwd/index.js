import { getMostRecentObservation, calculateAge } from '../../utils.js';

export const sixMwd = {
    id: '6mwd',
    title: '6 Minute Walk Distance',
    description:
        'Calculates reference values for distance walked, as a measure of functional status.',
    generateHTML: function () {
        return `
            <h3>${this.title}</h3>
            <p class.description">${this.description}</p>
            <div class="form-container modern">
                <div class="input-row">
                    <label>Sex</label>
                    <div class="segmented-control" id="mwd6-gender">
                        <label><input type="radio" name="gender" value="male"> Male</label>
                        <label><input type="radio" name="gender" value="female"> Female</label>
                    </div>
                </div>
                <div class="input-row">
                    <label for="mwd6-height">Height</label>
                    <div class="input-with-unit">
                        <input type="number" id="mwd6-height">
                        <span>cm</span>
                    </div>
                </div>
                <div class="input-row">
                    <label for="mwd6-age">Age</label>
                    <div class="input-with-unit">
                        <input type="number" id="mwd6-age">
                        <span>years</span>
                    </div>
                </div>
                <div class="input-row">
                    <label for="mwd6-weight">Weight</label>
                    <div class="input-with-unit">
                        <input type="number" id="mwd6-weight">
                        <span>kg</span>
                    </div>
                </div>
                <div class="input-row">
                    <label for="mwd6-distance">Distance walked</label>
                    <div class="input-with-unit">
                        <input type="number" id="mwd6-distance" placeholder="Optional">
                        <span>m</span>
                    </div>
                </div>
            </div>
            <div id="mwd6-result" class="result-grid" style="display:none;"></div>
            <div class="references">
                <h4>Reference</h4>
                <p>Enright, P L, & Sherrill, D L. (1998). Reference equations for the six-minute walk in healthy adults. <em>American journal of respiratory and critical care medicine</em>, 158(5 Pt 1), 1384-7.</p>
                <img src="js/calculators/6mwd/6mwd.png" alt="6 Minute Walk Distance Reference Image" />
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        const ageEl = container.querySelector('#mwd6-age');
        const genderEl = container.querySelector('#mwd6-gender');
        const heightEl = container.querySelector('#mwd6-height');
        const weightEl = container.querySelector('#mwd6-weight');
        const distanceEl = container.querySelector('#mwd6-distance');
        const resultEl = container.querySelector('#mwd6-result');

        const calculate = () => {
            const age = parseInt(ageEl.value);
            const genderRadio = container.querySelector('input[name="gender"]:checked');
            const height = parseInt(heightEl.value);
            const weight = parseInt(weightEl.value);
            const actualDistance = parseInt(distanceEl.value);

            if (isNaN(age) || !genderRadio || isNaN(height) || isNaN(weight)) {
                resultEl.style.display = 'none';
                return;
            }

            const gender = genderRadio.value;
            let expectedDistance = 0;
            // Enright, F. (2003). The six-minute walk test. Respiratory Care, 48(8), 783-785.
            if (gender === 'male') {
                expectedDistance = 7.57 * height - 5.02 * age - 1.76 * weight - 309;
            } else {
                // female
                expectedDistance = 2.11 * height - 2.29 * weight - 5.78 * age + 667;
            }

            // Lolkema, D. (2006). Reference values for the 6-minute walk test in a healthy Dutch population aged 40–70 years: a cross-sectional study.
            const lowerLimitNormal = expectedDistance - 153; // for men and women

            let percentage = NaN;
            if (!isNaN(actualDistance)) {
                percentage = (actualDistance / expectedDistance) * 100;
            }

            resultEl.innerHTML = `
                <div class="result-item">
                    <span class="value">${expectedDistance.toFixed(0)} <span class="unit">meters</span></span>
                    <span class="label">Expected 6 Minute Walk Distance for healthy patient</span>
                </div>
                ${
    !isNaN(percentage)
        ? `
                <div class="result-item">
                    <span class="value">${percentage.toFixed(0)}<span class="unit">%</span></span>
                    <span class="label">Percentage of expected distance for healthy patient</span>
                </div>`
        : ''
}
                <div class="result-item">
                    <span class="value">${lowerLimitNormal.toFixed(0)} <span class="unit">meters</span></span>
                    <span class="label">Lower limit of normal</span>
                </div>
            `;
            resultEl.style.display = 'grid';
        };

        // Auto-populate and setup listeners
        ageEl.value = calculateAge(patient.birthDate);
        const patientGender = patient.gender;
        const genderRadio = container.querySelector(
            `input[name="gender"][value="${patientGender}"]`
        );
        if (genderRadio) {
            genderRadio.checked = true;
            genderRadio.parentElement.classList.add('selected');
        }

        getMostRecentObservation(client, '8302-2').then(obs => {
            if (obs && obs.valueQuantity) {
                heightEl.value = obs.valueQuantity.value.toFixed(1);
            }
            calculate();
        });
        getMostRecentObservation(client, '29463-7').then(obs => {
            if (obs && obs.valueQuantity) {
                weightEl.value = obs.valueQuantity.value.toFixed(1);
            }
            calculate();
        });

        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculate);
        });

        container.querySelectorAll('.segmented-control input').forEach(radio => {
            radio.addEventListener('change', event => {
                container
                    .querySelectorAll('.segmented-control label')
                    .forEach(label => label.classList.remove('selected'));
                event.target.parentElement.classList.add('selected');
                calculate();
            });
        });

        calculate(); // Initial calculation
    }
};
