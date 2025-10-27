import { getMostRecentObservation } from '../../utils.js';

export const bwps = {
    id: 'bwps',
    title: 'Burch-Wartofsky Point Scale (BWPS) for Thyrotoxicosis',
    description: 'Predicts likelihood that biochemical thyrotoxicosis is thyroid storm.',
    generateHTML: function () {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <div class="instructions-box dark-blue">
                <strong>INSTRUCTIONS</strong>
                <p>Use in patients ≥18 years old with biochemical thyrotoxicosis.</p>
            </div>
            <div class="form-container modern">
                <div class="input-row">
                    <label for="bwps-temp">Temperature °F (°C)</label>
                    <select id="bwps-temp">
                        <option value="0">&lt;99</option>
                        <option value="5">99-99.9 (37.2-37.7)</option>
                        <option value="10">100-100.9 (37.8-38.2)</option>
                        <option value="15">101-101.9 (38.3-38.8)</option>
                        <option value="20">102-102.9 (38.9-39.2)</option>
                        <option value="25">103-103.9 (39.3-39.9)</option>
                        <option value="30">≥104.0 (≥40.0)</option>
                    </select>
                </div>
                 <div class="input-row">
                    <label for="bwps-cns">Central nervous system effects</label>
                    <select id="bwps-cns">
                        <option value="0">Absent</option>
                        <option value="10">Mild (agitation)</option>
                        <option value="20">Moderate (delirium, psychosis, extreme lethargy)</option>
                        <option value="30">Severe (seizures, coma)</option>
                    </select>
                </div>
                 <div class="input-row">
                    <label for="bwps-gi">Gastrointestinal-hepatic dysfunction</label>
                    <select id="bwps-gi">
                        <option value="0">Absent</option>
                        <option value="10">Moderate (diarrhea, nausea/vomiting, abdominal pain)</option>
                        <option value="20">Severe (unexplained jaundice)</option>
                    </select>
                </div>
                <div class="input-row">
                    <label for="bwps-hr">Heart Rate (beats/minute)</label>
                    <select id="bwps-hr">
                        <option value="0">&lt;90</option>
                        <option value="5">90-109</option>
                        <option value="10">110-119</option>
                        <option value="15">120-129</option>
                        <option value="20">130-139</option>
                        <option value="25">≥140</option>
                    </select>
                </div>
                 <div class="input-row">
                    <label for="bwps-chf">Congestive Heart Failure</label>
                    <select id="bwps-chf">
                        <option value="0">Absent</option>
                        <option value="5">Mild (pedal edema)</option>
                        <option value="10">Moderate (bibasilar rales)</option>
                        <option value="15">Severe (pulmonary edema)</option>
                    </select>
                </div>
                 <div class="input-row">
                    <label for="bwps-afib">Atrial fibrillation present</label>
                    <select id="bwps-afib">
                        <option value="0">No</option>
                        <option value="10">Yes</option>
                    </select>
                </div>
                <div class="input-row">
                    <label for="bwps-precip">Precipitating event</label>
                    <select id="bwps-precip">
                        <option value="0">No</option>
                        <option value="10">Yes</option>
                    </select>
                </div>
            </div>
            <div id="bwps-result" class="result-box ttkg-result" style="display:block;">
                 <div class="result-title">Result:</div>
                <div class="result-value">Please fill out required fields.</div>
            </div>
            <div class="references">
                <h4>Reference</h4>
                <p>Burch, H. B., & Wartofsky, L. (1993). Life-threatening thyrotoxicosis. Thyroid storm. <em>Endocrinology and metabolism clinics of North America</em>, 22(2), 263-277.</p>
                <p><strong>PMID:</strong> 8325286</p>
                <p><strong>Abstract:</strong> Although important strides in recognition and therapy have significantly reduced the mortality in this disorder from the nearly 100% fatality rate noted by Lahey, survival is by no means guaranteed. More recent series have yielded fatality rates between 20% and 50%. Thyroid storm is a dreaded, fortunately rare complication of a very common disorder. Most cases of thyroid storm occur following a precipitating event or intercurrent illness. Effective management is predicated on a prompt recognition of impending thyroid storm which is, in turn, dependent on a thorough knowledge of both the typical and atypical presentations of this disorder.</p>
                <img src="js/calculators/bwps/CR02708022_t2_0.jfif" alt="BWPS Scoring Table" style="max-width: 100%; height: auto; margin-top: 15px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" />
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        const fields = ['temp', 'cns', 'gi', 'hr', 'chf', 'afib', 'precip'];
        const resultValueEl = container.querySelector('#bwps-result .result-value');
        const resultEl = container.querySelector('#bwps-result');

        const calculate = () => {
            let score = 0;
            let allAnswered = true;
            fields.forEach(id => {
                const el = container.querySelector(`#bwps-${id}`);
                if (el.value === '') {
                    allAnswered = false;
                } else {
                    score += parseInt(el.value);
                }
            });

            if (!allAnswered) {
                resultValueEl.textContent = 'Please fill out required fields.';
                resultEl.className = 'result-box ttkg-result';
                return;
            }

            let interpretation = '';
            if (score >= 45) {
                interpretation = 'Score ≥45 is highly suggestive of thyroid storm.';
            } else if (score >= 25) {
                interpretation = 'Score 25-44 suggests impending storm.';
            } else {
                interpretation = 'Score <25 is unlikely to represent thyroid storm.';
            }

            resultEl.className = 'result-box ttkg-result calculated';
            resultValueEl.innerHTML = `
                <div style="font-size: 1.5em; font-weight: bold;">${score} points</div>
                ${interpretation}
            `;
        };

        // Auto-populate data
        getMostRecentObservation(client, '8310-5').then(obs => {
            // Temperature F
            if (obs && obs.valueQuantity) {
                const tempF = obs.valueQuantity.value;
                const tempSelect = container.querySelector('#bwps-temp');
                if (tempF < 99) {
                    tempSelect.value = '0';
                } else if (tempF < 100) {
                    tempSelect.value = '5';
                } else if (tempF < 101) {
                    tempSelect.value = '10';
                } else if (tempF < 102) {
                    tempSelect.value = '15';
                } else if (tempF < 103) {
                    tempSelect.value = '20';
                } else if (tempF < 104) {
                    tempSelect.value = '25';
                } else {
                    tempSelect.value = '30';
                }
            }
            calculate();
        });
        getMostRecentObservation(client, '8867-4').then(obs => {
            // Heart Rate
            if (obs && obs.valueQuantity) {
                const hr = obs.valueQuantity.value;
                const hrSelect = container.querySelector('#bwps-hr');
                if (hr < 90) {
                    hrSelect.value = '0';
                } else if (hr < 110) {
                    hrSelect.value = '5';
                } else if (hr < 120) {
                    hrSelect.value = '10';
                } else if (hr < 130) {
                    hrSelect.value = '15';
                } else if (hr < 140) {
                    hrSelect.value = '20';
                } else {
                    hrSelect.value = '25';
                }
            }
            calculate();
        });

        fields.forEach(id => {
            container.querySelector(`#bwps-${id}`).addEventListener('change', calculate);
        });

        calculate();
    }
};
