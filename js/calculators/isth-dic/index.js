import { getMostRecentObservation } from '../../utils.js';

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
                    <div class="input-label">Platelet count, cells x 10⁹/L
                        <span>Enter value for auto-selection</span>
                    </div>
                    <div class="input-with-unit" style="margin-bottom: 10px;">
                        <input type="number" id="platelet-input" step="1" placeholder="Enter platelet count">
                        <span>×10⁹/L</span>
                    </div>
                    <div class="radio-group vertical-group">
                        <label><input type="radio" name="platelet" value="0"> ≥100</label>
                        <label><input type="radio" name="platelet" value="1"> 50 to &lt;100</label>
                        <label><input type="radio" name="platelet" value="2"> &lt;50</label>
                    </div>
                </div>
                <div class="input-row vertical">
                    <div class="input-label">D-dimer level, mg/L FEU
                        <span>Normal &lt;0.5 mg/L, Moderate 0.5-5 mg/L, Severe &gt;5 mg/L</span>
                    </div>
                    <div class="input-with-unit" style="margin-bottom: 10px;">
                        <input type="number" id="ddimer-input" step="0.1" placeholder="Enter D-dimer">
                        <span>mg/L</span>
                    </div>
                    <div class="radio-group vertical-group">
                        <label><input type="radio" name="fibrin_marker" value="0"> No increase (&lt;0.5)</label>
                        <label><input type="radio" name="fibrin_marker" value="2"> Moderate increase (0.5-5)</label>
                        <label><input type="radio" name="fibrin_marker" value="3"> Severe increase (&gt;5)</label>
                    </div>
                </div>
                <div class="input-row vertical">
                    <div class="input-label">PT (Prothrombin Time), seconds
                        <span>Enter actual PT value (normal ~12s) and prolongation will be calculated</span>
                    </div>
                    <div class="input-with-unit" style="margin-bottom: 10px;">
                        <input type="number" id="pt-input" step="0.1" placeholder="Enter PT value">
                        <span>seconds</span>
                    </div>
                    <div class="segmented-control multi">
                        <label><input type="radio" name="pt" value="0"> Prolongation &lt;3s</label>
                        <label><input type="radio" name="pt" value="1"> Prolongation 3 to &lt;6s</label>
                        <label><input type="radio" name="pt" value="2"> Prolongation ≥6s</label>
                    </div>
                </div>
                <div class="input-row vertical">
                    <div class="input-label">Fibrinogen level, g/L
                        <span>Enter value for auto-selection</span>
                    </div>
                    <div class="input-with-unit" style="margin-bottom: 10px;">
                        <input type="number" id="fibrinogen-input" step="0.1" placeholder="Enter fibrinogen">
                        <span>g/L</span>
                    </div>
                    <div class="segmented-control">
                        <label><input type="radio" name="fibrinogen" value="0"> ≥1</label>
                        <label><input type="radio" name="fibrinogen" value="1"> &lt;1</label>
                    </div>
                </div>
            </div>
            <div id="isth-dic-result" class="ariscat-result-box" style="display:none;"></div>
            <div style="margin-top: 30px; text-align: center;">
                <img src="js/calculators/isth-dic/DIC.jpg" alt="ISTH DIC Criteria" style="width: 100%; max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            </div>
        `;
    },
    initialize: function(client, patient, container) {
        const resultEl = container.querySelector('#isth-dic-result');
        const groups = ['platelet', 'fibrin_marker', 'pt', 'fibrinogen'];
        
        // Get input fields
        const plateletInput = container.querySelector('#platelet-input');
        const ddimerInput = container.querySelector('#ddimer-input');
        const ptInput = container.querySelector('#pt-input');
        const fibrinogenInput = container.querySelector('#fibrinogen-input');

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
            if (value === null || value === undefined || value === '') return;
            const radioToSelect = ranges.find(range => range.condition(value));
            if (radioToSelect) {
                const radio = container.querySelector(`input[name="${groupName}"][value="${radioToSelect.value}"]`);
                if (radio) {
                    radio.checked = true;
                    const group = radio.closest('.radio-group, .segmented-control');
                    if (group) {
                        group.querySelectorAll('label').forEach(label => label.classList.remove('selected'));
                    }
                    radio.parentElement.classList.add('selected');
                    calculate();
                }
            }
        };
        
        // Auto-selection from input fields
        plateletInput.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            if (!isNaN(value)) {
                setRadioFromValue('platelet', value, [
                    { condition: v => v >= 100, value: '0' },
                    { condition: v => v >= 50 && v < 100, value: '1' },
                    { condition: v => v < 50, value: '2' },
                ]);
            }
        });
        
        ddimerInput.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            if (!isNaN(value)) {
                setRadioFromValue('fibrin_marker', value, [
                    { condition: v => v < 0.5, value: '0' },
                    { condition: v => v >= 0.5 && v <= 5, value: '2' },
                    { condition: v => v > 5, value: '3' },
                ]);
            }
        });
        
        ptInput.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            if (!isNaN(value)) {
                const prolongation = value - 12; // Assuming normal PT is 12s
                setRadioFromValue('pt', prolongation, [
                    { condition: v => v < 3, value: '0' },
                    { condition: v => v >= 3 && v < 6, value: '1' },
                    { condition: v => v >= 6, value: '2' },
                ]);
            }
        });
        
        fibrinogenInput.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            if (!isNaN(value)) {
                setRadioFromValue('fibrinogen', value, [
                    { condition: v => v >= 1, value: '0' },
                    { condition: v => v < 1, value: '1' },
                ]);
            }
        });

        // Auto-populate from FHIR data
        getMostRecentObservation(client, '26515-7').then(obs => { // Platelets
            if (obs && obs.valueQuantity) {
                const value = obs.valueQuantity.value;
                plateletInput.value = value.toFixed(0);
                setRadioFromValue('platelet', value, [
                    { condition: v => v >= 100, value: '0' },
                    { condition: v => v >= 50 && v < 100, value: '1' },
                    { condition: v => v < 50, value: '2' },
                ]);
            }
        });
        
        getMostRecentObservation(client, '48065-7').then(obs => { // D-dimer mg/L FEU
            if (obs && obs.valueQuantity) {
                const value = obs.valueQuantity.value;
                ddimerInput.value = value.toFixed(2);
                setRadioFromValue('fibrin_marker', value, [
                    { condition: v => v < 0.5, value: '0' },
                    { condition: v => v >= 0.5 && v <= 5, value: '2' },
                    { condition: v => v > 5, value: '3' },
                ]);
            }
        });
        
        getMostRecentObservation(client, '5902-2').then(obs => { // PT seconds
            if (obs && obs.valueQuantity) {
                const value = obs.valueQuantity.value;
                ptInput.value = value.toFixed(1);
                const prolongation = value - 12; // Assuming normal PT is 12s
                setRadioFromValue('pt', prolongation, [
                    { condition: v => v < 3, value: '0' },
                    { condition: v => v >= 3 && v < 6, value: '1' },
                    { condition: v => v >= 6, value: '2' },
                ]);
            }
        });
        
        getMostRecentObservation(client, '3255-7').then(obs => { // Fibrinogen g/L
            if (obs && obs.valueQuantity) {
                const value = obs.valueQuantity.value;
                fibrinogenInput.value = value.toFixed(2);
                setRadioFromValue('fibrinogen', value, [
                    { condition: v => v >= 1, value: '0' },
                    { condition: v => v < 1, value: '1' },
                ]);
            }
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
