// js/calculators/ariscat.js
import { calculateAge } from '../../utils.js';

export const ariscat = {
    id: 'ariscat',
    title: 'ARISCAT Score for Postoperative Pulmonary Complications',
    description:
        'Predicts risk of pulmonary complications after surgery, including respiratory failure.',
    generateHTML: function () {
        return `
            <h3>${this.title}</h3>
            <p>${this.description}</p>
            <div class="form-container modern ariscat-form">
                <div class="input-row">
                    <div class="input-label">Age, years</div>
                    <div class="segmented-control multi" data-ariscat-group="age">
                        <label><input type="radio" name="age" value="0"> &le;50</label>
                        <label><input type="radio" name="age" value="3"> 51-80</label>
                        <label><input type="radio" name="age" value="16"> >80</label>
                    </div>
                </div>
                <div class="input-row">
                    <div class="input-label">Preoperative SpO₂</div>
                    <div class="segmented-control multi" data-ariscat-group="spo2">
                        <label><input type="radio" name="spo2" value="0"> &ge;96%</label>
                        <label><input type="radio" name="spo2" value="8"> 91-95%</label>
                        <label><input type="radio" name="spo2" value="24"> &le;90%</label>
                    </div>
                </div>
                <div class="input-row">
                    <div class="input-label">
                        Respiratory infection in the last month
                        <span>Either upper or lower (i.e., URI, bronchitis, pneumonia), with fever and antibiotic treatment</span>
                    </div>
                    <div class="segmented-control" data-ariscat-group="resp">
                        <label><input type="radio" name="resp" value="0"> No</label>
                        <label><input type="radio" name="resp" value="17"> Yes</label>
                    </div>
                </div>
                <div class="input-row">
                    <div class="input-label">Preoperative anemia (Hgb &le;10 g/dL)</div>
                    <div class="segmented-control" data-ariscat-group="anemia">
                        <label><input type="radio" name="anemia" value="0"> No</label>
                        <label><input type="radio" name="anemia" value="11"> Yes</label>
                    </div>
                </div>
                <div class="input-row vertical">
                    <div class="input-label">Surgical incision</div>
                    <div class="radio-group vertical-group" data-ariscat-group="site">
                        <label><input type="radio" name="site" value="0"> Peripheral</label>
                        <label><input type="radio" name="site" value="15"> Upper abdominal</label>
                        <label><input type="radio" name="site" value="24"> Intrathoracic</label>
                    </div>
                </div>
                 <div class="input-row vertical">
                    <div class="input-label">Duration of surgery</div>
                    <div class="radio-group vertical-group" data-ariscat-group="duration">
                        <label><input type="radio" name="duration" value="0"> <2 hrs</label>
                        <label><input type="radio" name="duration" value="16"> 2-3 hrs</label>
                        <label><input type="radio" name="duration" value="23"> >3 hrs</label>
                    </div>
                </div>
                <div class="input-row">
                    <div class="input-label">Emergency procedure?</div>
                    <div class="segmented-control" data-ariscat-group="emergency">
                        <label><input type="radio" name="emergency" value="0"> No</label>
                        <label><input type="radio" name="emergency" value="8"> Yes</label>
                    </div>
                </div>
            </div>
            <div id="ariscat-result" class="ariscat-result-box" style="display:none;"></div>
        `;
    },
    initialize: function (client, patient, container) {
        const calculate = () => {
            const groups = ['age', 'spo2', 'resp', 'anemia', 'site', 'duration', 'emergency'];
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
                let riskInfo = '';
                if (score < 26) {
                    riskCategory = 'Low risk';
                    riskInfo = '1.6% risk of in-hospital post-op pulmonary complications';
                } else if (score <= 44) {
                    riskCategory = 'Intermediate risk';
                    riskInfo = '13.3% risk of in-hospital post-op pulmonary complications';
                } else {
                    riskCategory = 'High risk';
                    riskInfo = '42.1% risk of in-hospital post-op pulmonary complications';
                }

                const resultEl = container.querySelector('#ariscat-result');
                resultEl.innerHTML = `
                    <div class="score-section">
                        <div class="score-value">${score}</div>
                        <div class="score-label">points</div>
                        <div class="score-title">ARISCAT Score</div>
                    </div>
                    <div class="interpretation-section">
                        <div class="interp-title">${riskCategory}</div>
                        <div class="interp-details">${riskInfo} (composite including respiratory failure, respiratory infection, pleural effusion, atelectasis, pneumothorax, bronchospasm, aspiration pneumonitis)</div>
                    </div>
                `;
                resultEl.style.display = 'flex';
            } else {
                container.querySelector('#ariscat-result').style.display = 'none';
            }
        };

        if (patient && patient.birthDate) {
        const patientAge = calculateAge(patient.birthDate);
        const ageRadios = container.querySelectorAll('input[name="age"]');
        if (patientAge <= 50) {
            ageRadios[0].checked = true;
        } else if (patientAge <= 80) {
            ageRadios[1].checked = true;
        } else {
            ageRadios[2].checked = true;
        }
        ageRadios.forEach(r => {
            if (r.checked) {
                r.parentElement.classList.add('selected');
            }
        });
        }

        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', event => {
                const group = event.target.closest('.segmented-control, .radio-group');
                group
                    .querySelectorAll('label')
                    .forEach(label => label.classList.remove('selected'));
                event.target.parentElement.classList.add('selected');
                calculate();
            });
        });

        calculate();
    }
};
