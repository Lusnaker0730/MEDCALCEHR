import { calculateAge } from '../utils.js';

export const heartScore = {
    id: 'heart-score',
    title: 'HEART Score for Major Cardiac Events',
    description: 'Predicts 6-week risk of major adverse cardiac events in patients with chest pain.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <div class="instructions-box">
                <strong>INSTRUCTIONS</strong>
                <p>Use in patients ≥21 years old presenting with symptoms suggestive of ACS. Do not use if new ST-segment elevation ≥1 mm or other new EKG changes, hypotension, life expectancy less than 1 year, or noncardiac medical/surgical/psychiatric illness determined by the provider to require admission.</p>
            </div>
            <div class="form-container modern ariscat-form">
                <div class="input-row vertical">
                    <div class="input-label">History</div>
                    <div class="radio-group vertical-group" data-heart-group="history">
                        <label><input type="radio" name="history" value="0"> Slightly suspicious</label>
                        <label><input type="radio" name="history" value="1"> Moderately suspicious</label>
                        <label><input type="radio" name="history" value="2"> Highly suspicious</label>
                    </div>
                </div>
                <div class="input-row vertical">
                    <div class="input-label">
                        EKG
                        <span>1 point: No ST deviation but LBBB, LVH, repolarization changes (e.g. digoxin); 2 points: ST deviation not due to LBBB, LVH, or digoxin</span>
                    </div>
                    <div class="radio-group vertical-group" data-heart-group="ecg">
                        <label><input type="radio" name="ecg" value="0"> Normal</label>
                        <label><input type="radio" name="ecg" value="1"> Non-specific repolarization disturbance</label>
                        <label><input type="radio" name="ecg" value="2"> Significant ST deviation</label>
                    </div>
                </div>
                <div class="input-row">
                    <div class="input-label">Age</div>
                    <div class="segmented-control multi" data-heart-group="age">
                        <label><input type="radio" name="age" value="0"> &lt;45</label>
                        <label><input type="radio" name="age" value="1"> 45-64</label>
                        <label><input type="radio" name="age" value="2"> &ge;65</label>
                    </div>
                </div>
                <div class="input-row vertical">
                    <div class="input-label">
                        Risk factors
                        <span>Risk factors: HTN, hypercholesterolemia, DM, obesity (BMI >30 kg/m²), smoking (current, or smoking cessation ≤3 mo), positive family history (parent or sibling with CVD before age 65); atherosclerotic disease: prior MI, PCI/CABG, CVA/TIA, or peripheral arterial disease</span>
                    </div>
                    <div class="radio-group vertical-group" data-heart-group="risk">
                        <label><input type="radio" name="risk" value="0"> No known risk factors</label>
                        <label><input type="radio" name="risk" value="1"> 1-2 risk factors</label>
                        <label><input type="radio" name="risk" value="2"> ≥3 risk factors or history of atherosclerotic disease</label>
                    </div>
                </div>
                <div class="input-row vertical">
                    <div class="input-label">
                        Initial troponin
                        <span>Use local, regular sensitivity troponin assays and corresponding cutoffs</span>
                    </div>
                    <div class="radio-group vertical-group" data-heart-group="troponin">
                        <label><input type="radio" name="troponin" value="0"> ≤normal limit</label>
                        <label><input type="radio" name="troponin" value="1"> 1-3× normal limit</label>
                        <label><input type="radio" name="troponin" value="2"> >3× normal limit</label>
                    </div>
                </div>
            </div>
            <div id="heart-score-result" class="ariscat-result-box" style="display:none;"></div>
        `;
    },
    initialize: function(client, patient, container) {
        const calculate = () => {
            const groups = ['history', 'ecg', 'age', 'risk', 'troponin'];
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
                let riskCategory = '';
                let riskRange = '';
                let maceRate = '';

                if (score <= 3) {
                    riskCategory = 'Low Score';
                    riskRange = '0-3 points';
                    maceRate = '0.9-1.7%';
                } else if (score <= 6) {
                    riskCategory = 'Moderate Score';
                    riskRange = '4-6 points';
                    maceRate = '12-16.6%';
                } else {
                    riskCategory = 'High Score';
                    riskRange = '7-10 points';
                    maceRate = '50-65%';
                }

                const resultEl = container.querySelector('#heart-score-result');
                resultEl.innerHTML = `
                    <div class="score-section">
                        <div class="score-value">${score}</div>
                        <div class="score-label">points</div>
                        <div class="score-title">${riskCategory} (${riskRange})</div>
                    </div>
                    <div class="interpretation-section">
                        <div class="interp-details" style="font-size: 1.2em; font-weight: bold; margin-top: 0;">Risk of MACE of ${maceRate}</div>
                    </div>
                `;
                resultEl.style.display = 'flex';
            } else {
                container.querySelector('#heart-score-result').style.display = 'none';
            }
        };

        const patientAge = calculateAge(patient.birthDate);
        const ageRadios = container.querySelectorAll('input[name="age"]');
        if (patientAge < 45) {
            ageRadios[0].checked = true;
        } else if (patientAge <= 64) {
            ageRadios[1].checked = true;
        } else {
            ageRadios[2].checked = true;
        }
        ageRadios.forEach(r => { if(r.checked) r.parentElement.classList.add('selected')});

        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', (event) => {
                const group = event.target.closest('.segmented-control, .radio-group');
                group.querySelectorAll('label').forEach(label => label.classList.remove('selected'));
                event.target.parentElement.classList.add('selected');
                calculate();
            });
        });

        calculate();
    }
};
