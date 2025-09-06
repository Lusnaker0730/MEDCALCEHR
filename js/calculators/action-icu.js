import { getMostRecentObservation, calculateAge } from '../utils.js';

export const actionIcu = {
    id: 'action-icu',
    title: 'ACTION ICU Score for NSTEMI',
    description: 'Risk of complications requiring ICU care among initially uncomplicated patients with NSTEMI.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <div class="form-container modern ariscat-form">
                <div class="input-row">
                    <div class="input-label">Age, years</div>
                    <div class="segmented-control" data-action-group="age">
                        <label><input type="radio" name="age" value="0"> &lt;70</label>
                        <label><input type="radio" name="age" value="1"> &ge;70</label>
                    </div>
                </div>
                <div class="input-row">
                    <div class="input-label">Serum creatinine, mg/dL</div>
                    <div class="segmented-control" data-action-group="creatinine">
                        <label><input type="radio" name="creatinine" value="0"> &lt;1.1</label>
                        <label><input type="radio" name="creatinine" value="1"> &ge;1.1</label>
                    </div>
                </div>
                <div class="input-row">
                    <div class="input-label">Heart rate, bpm</div>
                    <div class="segmented-control multi" data-action-group="hr">
                        <label><input type="radio" name="hr" value="0"> &lt;85</label>
                        <label><input type="radio" name="hr" value="1"> 85-100</label>
                        <label><input type="radio" name="hr" value="3"> &ge;100</label>
                    </div>
                </div>
                <div class="input-row vertical">
                    <div class="input-label">Systolic blood pressure, mmHg</div>
                    <div class="radio-group vertical-group" data-action-group="sbp">
                        <label><input type="radio" name="sbp" value="0"> &ge;145</label>
                        <label><input type="radio" name="sbp" value="1"> 125-145</label>
                        <label><input type="radio" name="sbp" value="3"> &lt;125</label>
                    </div>
                </div>
                <div class="input-row">
                    <div class="input-label">Ratio of initial troponin to upper limit of normal</div>
                    <div class="segmented-control" data-action-group="troponin">
                        <label><input type="radio" name="troponin" value="0"> &lt;12</label>
                        <label><input type="radio" name="troponin" value="2"> &ge;12</label>
                    </div>
                </div>
                <div class="input-row">
                    <div class="input-label">Signs or symptoms of heart failure</div>
                    <div class="segmented-control" data-action-group="hf">
                        <label><input type="radio" name="hf" value="0"> No</label>
                        <label><input type="radio" name="hf" value="5"> Yes</label>
                    </div>
                </div>
                <div class="input-row">
                    <div class="input-label">ST segment depression on EKG</div>
                    <div class="segmented-control" data-action-group="st">
                        <label><input type="radio" name="st" value="0"> No</label>
                        <label><input type="radio" name="st" value="1"> Yes</label>
                    </div>
                </div>
                <div class="input-row">
                    <div class="input-label">Prior revascularization</div>
                    <div class="segmented-control" data-action-group="revasc">
                        <label><input type="radio" name="revasc" value="0"> Yes</label>
                        <label><input type="radio" name="revasc" value="1"> No</label>
                    </div>
                </div>
            </div>
            <div id="action-icu-result" class="ariscat-result-box" style="display:none;"></div>
        `;
    },
    initialize: function(client, patient, container) {
        const riskMap = [3.4, 4.8, 6.7, 9.2, 12.5, 16.7, 21.7, 27.5, 33.9, 40.8, 48.0, 55.4, 62.7, 69.6, 76.0, 81.7, 86.6, 90.6]; // Index is score, value is risk %

        const calculate = () => {
            const groups = ['age', 'creatinine', 'hr', 'sbp', 'troponin', 'hf', 'st', 'revasc'];
            let score = 0;
            let allAnswered = true;

            groups.forEach(groupName => {
                const checkedRadio = container.querySelector(`input[name="${groupName}"]:checked`);
                if (checkedRadio) {
                    score += parseInt(checkedRadio.value);
                } else {
                    allAnswered = false;
                }
            });

            if (allAnswered) {
                const riskPercent = score < riskMap.length ? riskMap[score] : riskMap[riskMap.length - 1];
                const resultEl = container.querySelector('#action-icu-result');
                resultEl.innerHTML = `
                    <div class="score-section">
                        <div class="score-value">${score}</div>
                        <div class="score-label">points</div>
                        <div class="score-title">ACTION ICU Score</div>
                    </div>
                    <div class="interpretation-section">
                        <div class="interp-title">${riskPercent.toFixed(1)}%</div>
                        <div class="interp-details">Risk of complications requiring ICU care among initially uncomplicated patients with NSTEMI (cardiac arrest, shock, high-grade AV block, respiratory failure, stroke, or death during index admission)</div>
                    </div>
                `;
                resultEl.style.display = 'flex';
            } else {
                container.querySelector('#action-icu-result').style.display = 'none';
            }
        };

        const setRadioWithValue = (name, value, conditions) => {
            if (value === null) return;
            for (const [radioIndex, condition] of conditions.entries()) {
                if (condition(value)) {
                    const radio = container.querySelectorAll(`input[name="${name}"]`)[radioIndex];
                    if (radio) {
                        radio.checked = true;
                        radio.parentElement.classList.add('selected');
                    }
                    break;
                }
            }
        };

        const patientAge = calculateAge(patient.birthDate);
        setRadioWithValue('age', patientAge, [v => v < 70, v => v >= 70]);
        
        getMostRecentObservation(client, '2160-0').then(obs => { // Serum Creatinine
            if (obs && obs.valueQuantity) setRadioWithValue('creatinine', obs.valueQuantity.value, [v => v < 1.1, v => v >= 1.1]);
            calculate();
        });
        getMostRecentObservation(client, '8867-4').then(obs => { // Heart Rate
            if (obs && obs.valueQuantity) setRadioWithValue('hr', obs.valueQuantity.value, [v => v < 85, v => v >= 85 && v <= 100, v => v > 100]);
            calculate();
        });
        getMostRecentObservation(client, '8480-6').then(obs => { // Systolic Blood Pressure
             if (obs && obs.valueQuantity) setRadioWithValue('sbp', obs.valueQuantity.value, [v => v >= 145, v => v >= 125 && v < 145, v => v < 125]);
             calculate();
        });
        
        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', (event) => {
                const group = event.target.closest('.segmented-control, .radio-group');
                group.querySelectorAll('label').forEach(label => label.classList.remove('selected'));
                event.target.parentElement.classList.add('selected');
                calculate();
            });
        });
        
        calculate(); // Initial calculation
    }
};
