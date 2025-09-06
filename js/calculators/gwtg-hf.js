import { getMostRecentObservation, calculateAge } from '../utils.js';

// Point allocation functions based on GWTG-HF score algorithm
const getPoints = {
    sbp: (v) => {
        if (v < 90) return 28; if (v < 100) return 23; if (v < 110) return 18; if (v < 120) return 14;
        if (v < 130) return 9; if (v < 140) return 5; return 0;
    },
    bun: (v) => {
        if (v < 20) return 0; if (v < 30) return 4; if (v < 40) return 9; if (v < 50) return 13;
        if (v < 60) return 18; if (v < 70) return 22; return 28;
    },
    sodium: (v) => {
        if (v > 140) return 4; if (v > 135) return 2; return 0;
    },
    age: (v) => {
        if (v < 40) return 0; if (v < 50) return 7; if (v < 60) return 14; if (v < 70) return 21;
        if (v < 80) return 28; return 28;
    },
    hr: (v) => {
        if (v < 70) return 0; if (v < 80) return 1; if (v < 90) return 3; if (v < 100) return 5;
        if (v < 110) return 6; return 8;
    },
};

const getMortality = (score) => {
    if (score <= 32) return '<1%';
    if (score <= 41) return '1-2%'; // MDCalc combines some ranges
    if (score <= 50) return '2-5%';
    if (score <= 56) return '5-10%';
    if (score <= 61) return '10-15%';
    if (score <= 65) return '15-20%';
    if (score <= 72) return '20-30%';
    if (score <= 74) return '30-40%';
    if (score <= 79) return '40-50%';
    return '>50%';
};

export const gwtgHf = {
    id: 'gwtg-hf',
    title: 'GWTG-Heart Failure Risk Score',
    description: 'Predicts in-hospital all-cause heart failure mortality.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <div class="instructions-box important">
                <strong>IMPORTANT</strong>
                <p>This calculator includes inputs based on race, which may or may not provide better estimates, so we have decided to make race optional. For the same other inputs, this calculator estimates lower in-hospital mortality risk in Black patients.</p>
            </div>
            <div class="form-container modern">
                <div class="input-row">
                    <label for="gwtg-sbp">Systolic BP</label>
                    <div class="input-with-unit">
                        <input type="number" id="gwtg-sbp"><span>mm Hg</span>
                    </div>
                </div>
                <div class="input-row">
                    <label for="gwtg-bun">BUN</label>
                    <div class="input-with-unit">
                        <input type="number" id="gwtg-bun"><span>mg/dL</span>
                    </div>
                </div>
                <div class="input-row">
                    <label for="gwtg-sodium">Sodium</label>
                    <div class="input-with-unit">
                        <input type="number" id="gwtg-sodium"><span>mEq/L</span>
                    </div>
                </div>
                <div class="input-row">
                    <label for="gwtg-age">Age</label>
                    <div class="input-with-unit">
                        <input type="number" id="gwtg-age"><span>years</span>
                    </div>
                </div>
                <div class="input-row">
                    <label for="gwtg-hr">Heart rate</label>
                    <div class="input-with-unit">
                        <input type="number" id="gwtg-hr"><span>beats/min</span>
                    </div>
                </div>
                <div class="input-row ariscat-form">
                    <div class="input-label">COPD history</div>
                    <div class="segmented-control">
                        <label><input type="radio" name="copd" value="0"> No</label>
                        <label><input type="radio" name="copd" value="2"> Yes</label>
                    </div>
                </div>
                <div class="input-row ariscat-form">
                    <div class="input-label">
                        Black race
                        <span>Race may/may not provide better estimates of in-hospital mortality; optional</span>
                    </div>
                    <div class="segmented-control">
                        <label><input type="radio" name="race" value="0"> No</label>
                        <label><input type="radio" name="race" value="-3"> Yes</label>
                    </div>
                </div>
            </div>
            <div id="gwtg-hf-result" class="ariscat-result-box" style="display:none;"></div>
        `;
    },
    initialize: function(client, patient, container) {
        const fields = {
            sbp: container.querySelector('#gwtg-sbp'),
            bun: container.querySelector('#gwtg-bun'),
            sodium: container.querySelector('#gwtg-sodium'),
            age: container.querySelector('#gwtg-age'),
            hr: container.querySelector('#gwtg-hr'),
            copd: container.querySelector('input[name="copd"]:checked'),
            race: container.querySelector('input[name="race"]:checked'),
        };
        const resultEl = container.querySelector('#gwtg-hf-result');

        const calculate = () => {
            fields.copd = container.querySelector('input[name="copd"]:checked');
            fields.race = container.querySelector('input[name="race"]:checked');
            const allFilled = ['sbp', 'bun', 'sodium', 'age', 'hr', 'copd'].every(key => fields[key] && fields[key].value !== '');

            if (!allFilled) {
                resultEl.style.display = 'none';
                return;
            }

            let score = 0;
            score += getPoints.sbp(parseFloat(fields.sbp.value));
            score += getPoints.bun(parseFloat(fields.bun.value));
            score += getPoints.sodium(parseFloat(fields.sodium.value));
            score += getPoints.age(parseFloat(fields.age.value));
            score += getPoints.hr(parseFloat(fields.hr.value));
            score += parseInt(fields.copd.value);
            if (fields.race) { // Race is optional
                score += parseInt(fields.race.value);
            }
            
            const mortality = getMortality(score);

            resultEl.innerHTML = `
                <div class="score-section" style="flex-basis: 40%;">
                    <div class="score-value">${score}</div>
                    <div class="score-label">points</div>
                </div>
                <div class="interpretation-section" style="flex-basis: 60%; justify-content: center;">
                     <div class="interp-details" style="font-size: 1.2em; font-weight: bold; margin-top: 0;">${mortality} predicted in-hospital all-cause mortality</div>
                </div>
            `;
            resultEl.style.display = 'flex';
        };

        // Auto-populate data
        fields.age.value = calculateAge(patient.birthDate);
        getMostRecentObservation(client, '8480-6').then(obs => { if(obs) fields.sbp.value = obs.valueQuantity.value.toFixed(0); calculate(); });
        getMostRecentObservation(client, '3094-0').then(obs => { if(obs) fields.bun.value = obs.valueQuantity.value.toFixed(0); calculate(); }); // BUN
        getMostRecentObservation(client, '2951-2').then(obs => { if(obs) fields.sodium.value = obs.valueQuantity.value.toFixed(0); calculate(); });
        getMostRecentObservation(client, '8867-4').then(obs => { if(obs) fields.hr.value = obs.valueQuantity.value.toFixed(0); calculate(); });

        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', () => {
                if (input.type === 'radio') {
                    const group = input.closest('.segmented-control');
                    group.querySelectorAll('label').forEach(label => label.classList.remove('selected'));
                    input.parentElement.classList.add('selected');
                }
                calculate();
            });
        });

        calculate();
    }
};
