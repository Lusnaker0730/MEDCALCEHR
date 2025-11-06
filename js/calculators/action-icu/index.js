import { getMostRecentObservation, calculateAge } from '../../utils.js';

export const actionIcu = {
    id: 'action-icu',
    title: 'ACTION ICU Score for Intensive Care in NSTEMI',
    description:
        'Risk of complications requiring ICU care among initially uncomplicated patients with NSTEMI.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>

            <div class="alert info">
                <strong>📋 NSTEMI Risk Assessment</strong>
                <p>For initially hemodynamically stable adults with NSTEMI</p>
            </div>

            <div class="section">
                <div class="section-title">Age, years</div>
                <div class="radio-group" data-action-group="age">
                    <label class="radio-option">
                        <input type="radio" name="age" value="0">
                        <span class="radio-label">&lt;70 <strong>0</strong></span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="age" value="1">
                        <span class="radio-label">≥70 <strong>+1</strong></span>
                    </label>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Serum creatinine, mg/dL</div>
                <div class="radio-group" data-action-group="creatinine">
                    <label class="radio-option">
                        <input type="radio" name="creatinine" value="0">
                        <span class="radio-label">&lt;1.1 <strong>0</strong></span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="creatinine" value="1">
                        <span class="radio-label">≥1.1 <strong>+1</strong></span>
                    </label>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Heart rate, bpm</div>
                <div class="radio-group" data-action-group="hr">
                    <label class="radio-option">
                        <input type="radio" name="hr" value="0">
                        <span class="radio-label">&lt;85 <strong>0</strong></span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="hr" value="1">
                        <span class="radio-label">85-100 <strong>+1</strong></span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="hr" value="3">
                        <span class="radio-label">≥100 <strong>+3</strong></span>
                    </label>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Systolic blood pressure, mmHg</div>
                <div class="radio-group" data-action-group="sbp">
                    <label class="radio-option">
                        <input type="radio" name="sbp" value="0">
                        <span class="radio-label">≥145 <strong>0</strong></span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="sbp" value="1">
                        <span class="radio-label">125-145 <strong>+1</strong></span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="sbp" value="3">
                        <span class="radio-label">&lt;125 <strong>+3</strong></span>
                    </label>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Ratio of initial troponin to upper limit of normal</div>
                <div class="radio-group" data-action-group="troponin">
                    <label class="radio-option">
                        <input type="radio" name="troponin" value="0">
                        <span class="radio-label">&lt;12 <strong>0</strong></span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="troponin" value="2">
                        <span class="radio-label">≥12 <strong>+2</strong></span>
                    </label>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Signs or symptoms of heart failure</div>
                <div class="radio-group" data-action-group="hf">
                    <label class="radio-option">
                        <input type="radio" name="hf" value="0">
                        <span class="radio-label">No <strong>0</strong></span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="hf" value="5">
                        <span class="radio-label">Yes <strong>+5</strong></span>
                    </label>
                </div>
            </div>

            <div class="section">
                <div class="section-title">ST segment depression on EKG</div>
                <div class="radio-group" data-action-group="st">
                    <label class="radio-option">
                        <input type="radio" name="st" value="0">
                        <span class="radio-label">No <strong>0</strong></span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="st" value="1">
                        <span class="radio-label">Yes <strong>+1</strong></span>
                    </label>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Prior revascularization</div>
                <div class="radio-group" data-action-group="revasc">
                    <label class="radio-option">
                        <input type="radio" name="revasc" value="0">
                        <span class="radio-label">Yes <strong>0</strong></span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="revasc" value="1">
                        <span class="radio-label">No <strong>+1</strong></span>
                    </label>
                </div>
            </div>

            <div id="action-icu-result" class="result-container"></div>

            <div class="chart-container">
                <img src="js/calculators/action-icu/action-icu.png" alt="ACTION ICU Score Reference Image" class="reference-image" />
                <img src="js/calculators/action-icu/jah33242-fig-0003.jpg" alt="ACTION ICU Score Reference Image 2" class="reference-image" style="margin-top: 15px;" />
            </div>

            <div class="info-section">
                <h4>📚 Reference</h4>
                <p>Fanaroff, A. C., et al. (2018). Risk Score to Predict Need for Intensive Care in Initially Hemodynamically Stable Adults With Non–ST‐Segment–Elevation Myocardial Infarction. <em>Journal of the American Heart Association</em>, 7(11).</p>
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        const riskMap = [
            3.4, 4.8, 6.7, 9.2, 12.5, 16.7, 21.7, 27.5, 33.9, 40.8, 48.0, 55.4, 62.7, 69.6, 76.0,
            81.7, 86.6, 90.6
        ]; // Index is score, value is risk %

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
                const riskPercent =
                    score < riskMap.length ? riskMap[score] : riskMap[riskMap.length - 1];
                const resultEl = container.querySelector('#action-icu-result');

                let riskLevel = 'low';
                let riskDescription = 'Low Risk';
                if (riskPercent >= 20) {
                    riskLevel = 'high';
                    riskDescription = 'High Risk';
                } else if (riskPercent >= 10) {
                    riskLevel = 'medium';
                    riskDescription = 'Moderate Risk';
                }

                resultEl.innerHTML = `
                    <div class="result-header">
                        <h3>ACTION ICU Score</h3>
                    </div>
                    <div class="result-score" style="font-size: 4rem; font-weight: bold; color: #667eea;">${score}</div>
                    <div class="result-label">points</div>
                    
                    <div class="result-item">
                        <span class="result-label">ICU Risk:</span>
                        <span class="result-value" style="font-size: 2.5rem; font-weight: bold; color: #667eea;">${riskPercent.toFixed(1)}%</span>
                    </div>
                    
                    <div class="severity-indicator ${riskLevel}">${riskDescription}</div>
                    
                    <div class="alert info">
                        <strong>📊 Interpretation</strong>
                        <p>Risk of complications requiring ICU care among initially uncomplicated patients with NSTEMI, including:</p>
                        <ul style="margin: 8px 0 0 20px; text-align: left;">
                            <li>Cardiac arrest</li>
                            <li>Cardiogenic shock</li>
                            <li>High-grade AV block</li>
                            <li>Respiratory failure</li>
                            <li>Stroke</li>
                            <li>Death during index admission</li>
                        </ul>
                    </div>
                `;
                resultEl.classList.add('show');
            } else {
                const resultEl = container.querySelector('#action-icu-result');
                resultEl.classList.remove('show');
            }
        };

        const setRadioWithValue = (name, value, conditions) => {
            if (value === null) {
                return;
            }
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

        getMostRecentObservation(client, '2160-0').then(obs => {
            // Serum Creatinine
            if (obs && obs.valueQuantity) {
                setRadioWithValue('creatinine', obs.valueQuantity.value, [
                    v => v < 1.1,
                    v => v >= 1.1
                ]);
            }
            calculate();
        });
        getMostRecentObservation(client, '8867-4').then(obs => {
            // Heart Rate
            if (obs && obs.valueQuantity) {
                setRadioWithValue('hr', obs.valueQuantity.value, [
                    v => v < 85,
                    v => v >= 85 && v <= 100,
                    v => v > 100
                ]);
            }
            calculate();
        });
        getMostRecentObservation(client, '8480-6').then(obs => {
            // Systolic Blood Pressure
            if (obs && obs.valueQuantity) {
                setRadioWithValue('sbp', obs.valueQuantity.value, [
                    v => v >= 145,
                    v => v >= 125 && v < 145,
                    v => v < 125
                ]);
            }
            calculate();
        });

        container.querySelectorAll('.radio-option').forEach(option => {
            option.addEventListener('click', () => {
                const input = option.querySelector('input[type="radio"]');
                if (input) {
                    input.checked = true;
                    const radioGroup = option.closest('.radio-group');
                    radioGroup.querySelectorAll('.radio-option').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    option.classList.add('selected');
                    calculate();
                }
            });
        });

        calculate(); // Initial calculation
    }
};
