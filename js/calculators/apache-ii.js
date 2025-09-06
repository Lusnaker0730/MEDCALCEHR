import { getMostRecentObservation, calculateAge } from '../utils.js';

// Point allocation functions based on APACHE II score algorithm
const getPoints = {
    temp: (v) => {
        if (v >= 41 || v <= 29.9) return 4; if (v >= 39 || v <= 31.9) return 3;
        if (v <= 33.9) return 2; if (v >= 38.5 || v <= 35.9) return 1; return 0;
    },
    map: (v) => {
        if (v >= 160 || v <= 49) return 4; if (v >= 130) return 3;
        if (v >= 110 || v <= 69) return 2; return 0;
    },
    ph: (v) => {
        if (v >= 7.7 || v < 7.15) return 4; if (v >= 7.6 || v < 7.25) return 3;
        if (v < 7.33) return 2; if (v >= 7.5) return 1; return 0;
    },
    hr: (v) => {
        if (v >= 180 || v <= 39) return 4; if (v >= 140 || v <= 54) return 3;
        if (v >= 110 || v <= 69) return 2; return 0;
    },
    rr: (v) => {
        if (v >= 50 || v <= 5) return 4; if (v >= 35) return 3;
        if (v <= 9) return 2; if (v >= 25 || v <= 11) return 1; return 0;
    },
    sodium: (v) => {
        if (v >= 180 || v <= 110) return 4; if (v >= 160 || v <= 119) return 3;
        if (v >= 155 || v <= 129) return 2; if (v >= 150) return 1; return 0;
    },
    potassium: (v) => {
        if (v >= 7 || v < 2.5) return 4; if (v >= 6) return 3;
        if (v <= 2.9) return 2; if (v >= 5.5 || v <= 3.4) return 1; return 0;
    },
    creatinine: (v, arf) => { // arf is boolean for acute renal failure
        let score = 0;
        const v_mgdl = v / 88.4; // convert umol/L to mg/dL
        if (v_mgdl >= 3.5) score = 4; else if (v_mgdl >= 2.0) score = 3;
        else if (v_mgdl >= 1.5 || v_mgdl < 0.6) score = 2;
        return arf ? score * 2 : score;
    },
    hct: (v) => {
        if (v >= 60 || v < 20) return 4; if (v >= 50 || v < 30) return 2; return 0;
    },
    wbc: (v) => {
        if (v >= 40 || v < 1) return 4; if (v >= 20 || v < 3) return 2;
        if (v >= 15) return 1; return 0;
    },
    gcs: (v) => 15 - v,
    oxygenation: (fio2, pao2, paco2) => {
        if (fio2 >= 0.5) {
            const A_a_gradient = (fio2 * 713) - paco2 / 0.8 - pao2;
            if (A_a_gradient >= 500) return 4; if (A_a_gradient >= 350) return 3;
            if (A_a_gradient >= 200) return 2; return 0;
        } else {
            if (pao2 < 55) return 4; if (pao2 <= 60) return 3;
            if (pao2 <= 70) return 1; return 0;
        }
    },
    age: (v) => {
        if (v >= 75) return 6; if (v >= 65) return 5; if (v >= 55) return 3;
        if (v >= 45) return 2; return 0;
    }
};

export const apacheIi = {
    id: 'apache-ii',
    title: 'APACHE II Score',
    description: 'Estimates ICU mortality.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <div class="form-container modern">
                <div class="input-row ariscat-form">
                    <div class="input-label">History of severe organ failure or immunocompromise<span>Heart Failure Class IV, cirrhosis, chronic lung disease, or dialysis-dependent</span></div>
                    <div class="segmented-control"><label><input type="radio" name="chronic" value="5"> Yes</label><label><input type="radio" name="chronic" value="0"> No</label></div>
                </div>
                <div class="input-row"><label>Age</label><div class="input-with-unit"><input type="number" id="apache-age"><span>years</span></div></div>
                <div class="input-row"><label>Temperature</label><div class="input-with-unit"><input type="number" id="apache-temp" placeholder="Norm: 36.1 - 37.8"><span>°C</span></div></div>
                <div class="input-row"><label>Mean arterial pressure</label><div class="input-with-unit"><input type="number" id="apache-map" placeholder="Norm: 70 - 100"><span>mm Hg</span></div></div>
                <div class="input-row"><label>pH</label><input type="number" id="apache-ph" step="0.01" placeholder="Norm: 7.38 - 7.44"></div>
                <div class="input-row"><label>Heart rate/pulse</label><div class="input-with-unit"><input type="number" id="apache-hr" placeholder="Norm: 60 - 100"><span>beats/min</span></div></div>
                <div class="input-row"><label>Respiratory rate</label><div class="input-with-unit"><input type="number" id="apache-rr" placeholder="Norm: 12 - 20"><span>breaths/min</span></div></div>
                <div class="input-row"><label>Sodium</label><div class="input-with-unit"><input type="number" id="apache-sodium" placeholder="Norm: 136 - 145"><span>mmol/L</span></div></div>
                <div class="input-row"><label>Potassium</label><div class="input-with-unit"><input type="number" id="apache-potassium" placeholder="Norm: 3.5 - 5.2"><span>mmol/L</span></div></div>
                <div class="input-row"><label>Creatinine</label><div class="input-with-unit"><input type="number" id="apache-creatinine" placeholder="Norm: 62 - 115"><span>μmol/L</span></div></div>
                <div class="input-row ariscat-form">
                    <div class="input-label">Acute renal failure<span>Note: "acute renal failure" was not defined in the original study. Use clinical judgment to determine whether patient has acute kidney injury.</span></div>
                    <div class="segmented-control"><label><input type="radio" name="arf" value="1"> Yes</label><label><input type="radio" name="arf" value="0"> No</label></div>
                </div>
                <div class="input-row"><label>Hematocrit</label><div class="input-with-unit"><input type="number" id="apache-hct" placeholder="Norm: 36 - 51"><span>%</span></div></div>
                <div class="input-row"><label>White blood cell count</label><div class="input-with-unit"><input type="number" id="apache-wbc" placeholder="Norm: 3.7 - 10.7"><span>x 10⁹ cells/L</span></div></div>
                <div class="input-row"><label>Glasgow Coma Scale</label><div class="input-with-unit"><input type="number" id="apache-gcs" placeholder="Norm: 3 - 15"><span>points</span></div></div>
                <div class="input-row vertical ariscat-form">
                    <div class="input-label">Oxygenation (choose one method)</div>
                    <div class="radio-group vertical-group" id="apache-oxygen-method">
                        <label><input type="radio" name="oxy_method" value="fio2_pao2" checked> FiO₂ and PaO₂</label>
                        <label><input type="radio" name="oxy_method" value="pao2_only"> PaO₂ only (if FiO₂ < 0.5)</label>
                    </div>
                </div>
                 <div class="input-row" id="fio2_pao2_inputs">
                    <label for="apache-fio2">FiO₂</label><input type="number" id="apache-fio2" step="0.1" placeholder="e.g. 0.5">
                    <label for="apache-pao2">PaO₂</label><input type="number" id="apache-pao2" placeholder="mmHg">
                    <label for="apache-paco2">PaCO₂</label><input type="number" id="apache-paco2" placeholder="mmHg">
                </div>
                <div class="input-row" id="pao2_only_inputs" style="display:none;">
                     <label for="apache-pao2-only">PaO₂</label><input type="number" id="apache-pao2-only" placeholder="mmHg">
                </div>
            </div>
            <div id="apache-result" class="result-box ttkg-result" style="display:block;">
                <div class="result-title">Result:</div>
                <div class="result-value">Please fill out required fields.</div>
            </div>
        `;
    },
    initialize: function(client, patient, container) {
        const fields = ['age', 'temp', 'map', 'ph', 'hr', 'rr', 'sodium', 'potassium', 'creatinine', 'hct', 'wbc', 'gcs', 'fio2', 'pao2', 'paco2', 'pao2-only'];
        const elements = {};
        fields.forEach(f => elements[f] = container.querySelector(`#apache-${f.replace('-','_')}`));
        const resultValueEl = container.querySelector('#apache-result .result-value');

        const calculate = () => {
            let score = 0;
            const vals = {};
            fields.forEach(f => vals[f] = parseFloat(elements[f].value));
            
            const arf = container.querySelector('input[name="arf"]:checked')?.value === '1';
            const chronic = container.querySelector('input[name="chronic"]:checked')?.value === '5';

            try {
                let aps = 0;
                aps += getPoints.temp(vals.temp);
                aps += getPoints.map(vals.map);
                aps += getPoints.ph(vals.ph);
                aps += getPoints.hr(vals.hr);
                aps += getPoints.rr(vals.rr);
                aps += getPoints.sodium(vals.sodium);
                aps += getPoints.potassium(vals.potassium);
                aps += getPoints.creatinine(vals.creatinine, arf);
                aps += getPoints.hct(vals.hct);
                aps += getPoints.wbc(vals.wbc);
                aps += getPoints.gcs(vals.gcs);
                
                const oxyMethod = container.querySelector('input[name="oxy_method"]:checked').value;
                if (oxyMethod === 'fio2_pao2' && vals.fio2 >= 0.5) {
                    aps += getPoints.oxygenation(vals.fio2, vals.pao2, vals.paco2);
                } else {
                    aps += getPoints.oxygenation(0.21, vals.pao2_only || vals.pao2, null);
                }
                
                let agePoints = getPoints.age(vals.age);
                let chronicPoints = chronic ? 5 : 0;
                
                score = aps + agePoints + chronicPoints;
                const mortality = (Math.exp(-3.517 + (0.146 * score)) / (1 + Math.exp(-3.517 + (0.146 * score)))) * 100;

                resultValueEl.innerHTML = `
                    <div style="font-size: 1.5em; font-weight: bold;">APACHE II Score: ${score}</div>
                    Predicted ICU Mortality: ${mortality.toFixed(1)}%
                `;
                 container.querySelector('#apache-result').className = 'result-box ttkg-result calculated';
            } catch (e) {
                 resultValueEl.textContent = 'Please fill out all required fields.';
                 container.querySelector('#apache-result').className = 'result-box ttkg-result';
            }
        };
        
        // Event Listeners
        container.querySelectorAll('input').forEach(input => input.addEventListener('input', calculate));
        container.querySelectorAll('input[name="oxy_method"]').forEach(radio => radio.addEventListener('change', () => {
            const useFio2 = container.querySelector('input[name="oxy_method"]:checked').value === 'fio2_pao2';
            container.querySelector('#fio2_pao2_inputs').style.display = useFio2 ? 'flex' : 'none';
            container.querySelector('#pao2_only_inputs').style.display = useFio2 ? 'none' : 'flex';
        }));

        // Auto-populate
        elements.age.value = calculateAge(patient.birthDate);
        getMostRecentObservation(client, '8310-5').then(obs => { if(obs) elements.temp.value = obs.valueQuantity.value.toFixed(1); calculate(); });
        getMostRecentObservation(client, '8478-0').then(obs => { if(obs) elements.map.value = obs.valueQuantity.value.toFixed(0); calculate(); });
        getMostRecentObservation(client, '11558-4').then(obs => { if(obs) elements.ph.value = obs.valueQuantity.value.toFixed(2); calculate(); });
        getMostRecentObservation(client, '8867-4').then(obs => { if(obs) elements.hr.value = obs.valueQuantity.value.toFixed(0); calculate(); });
        getMostRecentObservation(client, '9279-1').then(obs => { if(obs) elements.rr.value = obs.valueQuantity.value.toFixed(0); calculate(); });
        getMostRecentObservation(client, '2951-2').then(obs => { if(obs) elements.sodium.value = obs.valueQuantity.value.toFixed(0); calculate(); });
        getMostRecentObservation(client, '2823-3').then(obs => { if(obs) elements.potassium.value = obs.valueQuantity.value.toFixed(1); calculate(); });
        getMostRecentObservation(client, '2160-0').then(obs => { if(obs) elements.creatinine.value = obs.valueQuantity.value.toFixed(0); calculate(); });
        getMostRecentObservation(client, '4544-3').then(obs => { if(obs) elements.hct.value = obs.valueQuantity.value.toFixed(1); calculate(); });
        getMostRecentObservation(client, '6690-2').then(obs => { if(obs) elements.wbc.value = obs.valueQuantity.value.toFixed(1); calculate(); });
        getMostRecentObservation(client, '9269-2').then(obs => { if(obs) elements.gcs.value = obs.valueQuantity.value.toFixed(0); calculate(); });
        getMostRecentObservation(client, '11556-8').then(obs => { if(obs) { elements.pao2.value = obs.valueQuantity.value.toFixed(0); elements.pao2_only.value = obs.valueQuantity.value.toFixed(0); } calculate(); });
        getMostRecentObservation(client, '11557-6').then(obs => { if(obs) elements.paco2.value = obs.valueQuantity.value.toFixed(0); calculate(); });

        calculate();
    }
};
