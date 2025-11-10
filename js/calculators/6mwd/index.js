import { getMostRecentObservation, calculateAge } from '../../utils.js';

export const sixMwd = {
    id: '6mwd',
    title: '6 Minute Walk Distance',
    description:
        'Calculates reference values for distance walked, as a measure of functional status.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>

            <div class="section">
                <div class="section-title">Sex</div>
                <div class="radio-group" id="mwd6-gender">
                    <label class="radio-option">
                        <input type="radio" name="gender" value="male">
                        <span class="radio-label">Male</span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="gender" value="female">
                        <span class="radio-label">Female</span>
                    </label>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Height</div>
                <div class="input-with-unit">
                    <input type="number" id="mwd6-height" placeholder="e.g., 175">
                    <span>cm</span>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Age</div>
                <div class="input-with-unit">
                    <input type="number" id="mwd6-age" placeholder="e.g., 62">
                    <span>years</span>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Weight</div>
                <div class="input-with-unit">
                    <input type="number" id="mwd6-weight" placeholder="e.g., 88">
                    <span>kg</span>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Distance walked (optional)</div>
                <div class="input-with-unit">
                    <input type="number" id="mwd6-distance" placeholder="e.g., 400">
                    <span>m</span>
                </div>
                <small class="help-text">Enter actual distance if you want to see percentage of expected</small>
            </div>

            <div id="mwd6-result" class="result-container"></div>

            <div class="chart-container">
                <img src="js/calculators/6mwd/6mwd.png" alt="6 Minute Walk Distance Reference Image" class="reference-image" />
            </div>

            <div class="info-section">
                <h4>📚 Reference</h4>
                <p>Enright, P L, & Sherrill, D L. (1998). Reference equations for the six-minute walk in healthy adults. <em>American journal of respiratory and critical care medicine</em>, 158(5 Pt 1), 1384-7.</p>
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
                resultEl.classList.remove('show');
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
                <div class="result-header">6 Minute Walk Distance Results</div>
                <div class="result-score">
                    <span style="font-size: 4rem; font-weight: bold; color: #667eea;">${expectedDistance.toFixed(0)}</span>
                    <span style="font-size: 1.2rem; color: #718096; margin-left: 10px;">meters</span>
                </div>
                <div class="result-label">Expected 6 Minute Walk Distance for healthy patient</div>
                ${
    !isNaN(percentage)
        ? `
                <div class="result-item" style="margin-top: 20px;">
                    <span class="label">Percentage of expected distance</span>
                    <span class="value" style="font-size: 2rem; font-weight: bold; color: #667eea;">${percentage.toFixed(0)}%</span>
                </div>`
        : ''
}
                <div class="result-item">
                    <span class="label">Lower limit of normal</span>
                    <span class="value">${lowerLimitNormal.toFixed(0)} meters</span>
                </div>
            `;
            resultEl.classList.add('show');
        };

        // Auto-populate and setup listeners
        if (patient && patient.birthDate) {
            ageEl.value = calculateAge(patient.birthDate);
        }

        if (patient && patient.gender) {
            const patientGender = patient.gender;
            const genderRadio = container.querySelector(
                `input[name="gender"][value="${patientGender}"]`
            );
            if (genderRadio) {
                genderRadio.checked = true;
                genderRadio.closest('.radio-option').classList.add('selected');
            }
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

        // Add event listeners for radio buttons
        container.querySelectorAll('.radio-option input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', () => {
                // Add visual feedback
                const parent = radio.closest('.radio-option');
                const siblings = parent.parentElement.querySelectorAll('.radio-option');
                siblings.forEach(s => s.classList.remove('selected'));
                parent.classList.add('selected');

                calculate();
            });
        });

        // Add event listeners for text inputs
        container.querySelectorAll('input[type="number"]').forEach(input => {
            input.addEventListener('input', calculate);
        });

        calculate(); // Initial calculation
    }
};
