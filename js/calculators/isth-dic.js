
export const isthDic = {
    id: 'isth-dic',
    title: 'ISTH Criteria for Disseminated Intravascular Coagulation (DIC)',
    description: 'Diagnoses overt disseminated intravascular coagulation (DIC).',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <div class="instructions-box important">
                <strong>IMPORTANT</strong>
                <p>Tips for COVID-19: This is one measure of COVID-19 associated coagulopathy, which was associated with poor prognosis (Tang 2020).</p>
            </div>
            <div class="instructions-box dark-blue">
                <strong>INSTRUCTIONS</strong>
                <p>Use only in patients with clinical suspicion for DIC (e.g. excessive bleeding in the setting of malignancy, severe infection or sepsis, obstetric complications, trauma).</p>
            </div>
             <div class="form-container modern ariscat-form">
                <div class="input-row vertical">
                    <div class="input-label">Platelet count, cells x 10⁹/L</div>
                    <div class="radio-group vertical-group">
                        <label><input type="radio" name="platelet" value="0"> ≥100</label>
                        <label><input type="radio" name="platelet" value="1"> 50 to &lt;100</label>
                        <label><input type="radio" name="platelet" value="2"> &lt;50</label>
                    </div>
                </div>
                <div class="input-row vertical">
                    <div class="input-label">Elevated levels of a fibrin-related marker (e.g. D-dimer, fibrin degradation products)<span>Use lab-specific cutoff values</span></div>
                    <div class="radio-group vertical-group">
                        <label><input type="radio" name="fibrin_marker" value="0"> No increase</label>
                        <label><input type="radio" name="fibrin_marker" value="2"> Moderate increase</label>
                        <label><input type="radio" name="fibrin_marker" value="3"> Severe increase</label>
                    </div>
                </div>
                <div class="input-row">
                    <div class="input-label">Prolonged PT, seconds</div>
                    <div class="segmented-control multi">
                        <label><input type="radio" name="pt" value="0"> &lt;3</label>
                        <label><input type="radio" name="pt" value="1"> 3 to &lt;6</label>
                        <label><input type="radio" name="pt" value="2"> ≥6</label>
                    </div>
                </div>
                <div class="input-row">
                    <div class="input-label">Fibrinogen level, g/L</div>
                    <div class="segmented-control">
                        <label><input type="radio" name="fibrinogen" value="0"> ≥1</label>
                        <label><input type="radio" name="fibrinogen" value="1"> &lt;1</label>
                    </div>
                </div>
            </div>
            <div id="isth-dic-result" class="ariscat-result-box" style="display:none;"></div>
        `;
    },
    initialize: function(client, patient, container) {
        const resultEl = container.querySelector('#isth-dic-result');
        const groups = ['platelet', 'fibrin_marker', 'pt', 'fibrinogen'];

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
            
            let interpretation = '';
            if (score >= 5) {
                interpretation = 'Score ≥5 is compatible with overt DIC. Repeat score daily.';
            } else {
                interpretation = 'Score <5 is not suggestive of overt DIC, may be non-overt DIC; repeat within next 1-2 days and manage clinically as appropriate.';
            }

            resultEl.innerHTML = `
                <div class="score-section" style="justify-content: center;">
                    <div class="score-value">${score}</div>
                    <div class="score-label">points</div>
                </div>
                <div class="interpretation-section">
                    <div class="interp-details">${interpretation}</div>
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

        getMostRecentObservation(client, '26515-7').then(obs => { // Platelets
            if (obs && obs.valueQuantity) setRadioFromValue('platelet', obs.valueQuantity.value, [
                { condition: v => v >= 100, value: '0' },
                { condition: v => v >= 50 && v < 100, value: '1' },
                { condition: v => v < 50, value: '2' },
            ]);
            calculate();
        });
        getMostRecentObservation(client, '3255-7').then(obs => { // Fibrinogen g/L
            if (obs && obs.valueQuantity) setRadioFromValue('fibrinogen', obs.valueQuantity.value, [
                { condition: v => v >= 1, value: '0' },
                { condition: v => v < 1, value: '1' },
            ]);
            calculate();
        });
        getMostRecentObservation(client, '5902-2').then(obs => { // PT seconds
            // This requires a normal PT value to calculate prolongation. We'll assume 12s as a typical normal.
            if (obs && obs.valueQuantity) {
                 const prolongation = obs.valueQuantity.value - 12;
                 setRadioFromValue('pt', prolongation, [
                    { condition: v => v < 3, value: '0' },
                    { condition: v => v >= 3 && v < 6, value: '1' },
                    { condition: v => v >= 6, value: '2' },
                ]);
            }
            calculate();
        });


        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', (event) => {
                const group = event.target.closest('.radio-group, .segmented-control');
                group.querySelectorAll('label').forEach(label => label.classList.remove('selected'));
                event.target.parentElement.classList.add('selected');
                calculate();
            });
        });
    }
};
