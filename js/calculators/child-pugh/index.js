import { getMostRecentObservation } from '../../utils.js';

export const childPugh = {
    id: 'child-pugh',
    title: 'Child-Pugh Score for Cirrhosis Mortality',
    description: 'Estimates cirrhosis severity.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <div class="form-container modern ariscat-form">
                <div class="input-row vertical">
                    <div class="input-label">Bilirubin (Total)</div>
                    <div class="radio-group vertical-group">
                        <label><input type="radio" name="bilirubin" value="1"> &lt;2 mg/dL (&lt;34.2 μmol/L)</label>
                        <label><input type="radio" name="bilirubin" value="2"> 2-3 mg/dL (34.2-51.3 μmol/L)</label>
                        <label><input type="radio" name="bilirubin" value="3"> >3 mg/dL (>51.3 μmol/L)</label>
                    </div>
                </div>
                <div class="input-row vertical">
                    <div class="input-label">Albumin</div>
                    <div class="radio-group vertical-group">
                        <label><input type="radio" name="albumin" value="1"> >3.5 g/dL (>35 g/L)</label>
                        <label><input type="radio" name="albumin" value="2"> 2.8-3.5 g/dL (28-35 g/L)</label>
                        <label><input type="radio" name="albumin" value="3"> &lt;2.8 g/dL (&lt;28 g/L)</label>
                    </div>
                </div>
                 <div class="input-row vertical">
                    <div class="input-label">INR</div>
                    <div class="radio-group vertical-group">
                        <label><input type="radio" name="inr" value="1"> &lt;1.7</label>
                        <label><input type="radio" name="inr" value="2"> 1.7-2.3</label>
                        <label><input type="radio" name="inr" value="3"> >2.3</label>
                    </div>
                </div>
                <div class="input-row vertical">
                    <div class="input-label">Ascites</div>
                    <div class="radio-group vertical-group">
                        <label><input type="radio" name="ascites" value="1"> Absent</label>
                        <label><input type="radio" name="ascites" value="2"> Slight</label>
                        <label><input type="radio" name="ascites" value="3"> Moderate</label>
                    </div>
                </div>
                 <div class="input-row vertical">
                    <div class="input-label">Encephalopathy</div>
                    <div class="radio-group vertical-group">
                        <label><input type="radio" name="encephalopathy" value="1"> No Encephalopathy</label>
                        <label><input type="radio" name="encephalopathy" value="2"> Grade 1-2</label>
                        <label><input type="radio" name="encephalopathy" value="3"> Grade 3-4</label>
                    </div>
                </div>
            </div>
            <div id="child-pugh-result" class="ariscat-result-box" style="display:none;"></div>
        `;
    },
    initialize: function(client, patient, container) {
        const resultEl = container.querySelector('#child-pugh-result');
        const groups = ['bilirubin', 'albumin', 'inr', 'ascites', 'encephalopathy'];

        const calculate = () => {
            let score = 0;
            const allAnswered = groups.every(group => container.querySelector(`input[name="${group}"]:checked`));

            if (!allAnswered) {
                resultEl.style.display = 'none';
                return;
            }

            groups.forEach(group => {
                score += parseInt(container.querySelector(`input[name="${group}"]:checked`).value);
            });
            
            let classification = '';
            let lifeExpectancy = '';
            let mortality = '';

            if (score <= 6) {
                classification = 'Child Class A';
                lifeExpectancy = '15-20 years';
                mortality = '10%';
            } else if (score <= 9) {
                classification = 'Child Class B';
                lifeExpectancy = '4-14 years';
                mortality = '30%';
            } else {
                classification = 'Child Class C';
                lifeExpectancy = '1-3 years';
                mortality = '82%';
            }

            resultEl.innerHTML = `
                <div class="score-section" style="justify-content: center;">
                    <div class="score-value">${score}</div>
                    <div class="score-label">points</div>
                </div>
                <div class="interpretation-section">
                    <div class="interp-title">${classification}</div>
                    <div class="interp-details">
                        Life Expectancy: ${lifeExpectancy}<br>
                        Abdominal surgery peri-operative mortality: ${mortality}
                    </div>
                </div>
            `;
            resultEl.style.display = 'flex';
        };

        const setRadioFromValue = (groupName, value, ranges) => {
            if (value === null) return;
            const radioToSelect = ranges.find(range => range.condition(value));
            if (radioToSelect) {
                const radio = container.querySelector(`input[name="${groupName}"][value="${radioToSelect.value}"]`);
                if (radio) {
                    radio.checked = true;
                    radio.parentElement.classList.add('selected');
                }
            }
        };

        // Fetch and set lab values
        getMostRecentObservation(client, '1975-2').then(obs => { // Bilirubin mg/dL
            if (obs && obs.valueQuantity) setRadioFromValue('bilirubin', obs.valueQuantity.value, [
                { condition: v => v < 2, value: '1' },
                { condition: v => v >= 2 && v <= 3, value: '2' },
                { condition: v => v > 3, value: '3' },
            ]);
            calculate();
        });
        getMostRecentObservation(client, '1751-7').then(obs => { // Albumin g/L
            if (obs && obs.valueQuantity) setRadioFromValue('albumin', obs.valueQuantity.value / 10, [ // Convert g/L to g/dL
                { condition: v => v > 3.5, value: '1' },
                { condition: v => v >= 2.8 && v <= 3.5, value: '2' },
                { condition: v => v < 2.8, value: '3' },
            ]);
            calculate();
        });
        getMostRecentObservation(client, '34714-6').then(obs => { // INR
            if (obs && obs.valueQuantity) setRadioFromValue('inr', obs.valueQuantity.value, [
                { condition: v => v < 1.7, value: '1' },
                { condition: v => v >= 1.7 && v <= 2.3, value: '2' },
                { condition: v => v > 2.3, value: '3' },
            ]);
            calculate();
        });

        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', (event) => {
                const group = event.target.closest('.radio-group');
                group.querySelectorAll('label').forEach(label => label.classList.remove('selected'));
                event.target.parentElement.classList.add('selected');
                calculate();
            });
        });
    }
};
