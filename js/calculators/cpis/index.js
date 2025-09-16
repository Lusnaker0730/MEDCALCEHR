
import { getObservation } from '../../utils.js';

export const cpis = {
    id: 'cpis',
    title: 'Clinical Pulmonary Infection Score (CPIS) for VAP',
    description: 'Assists in diagnosing ventilator-associated pneumonia by predicting benefit of pulmonary cultures.',

    generateHTML: () => `
        <div class="form-container">
            <div class="instructions-box dark-blue">
                <strong>INSTRUCTIONS:</strong> Many reviews of the CPIS feel it should not be relied on; we include it because of its popularity but caution users to review the data on its utility first.
            </div>
            <div class="input-row vertical">
                <div class="input-label">Temperature (°C)</div>
                <div class="radio-group vertical-group" data-name="temperature">
                    <label><input type="radio" name="temperature" value="0" checked><span>36.5-38.4</span></label>
                    <label><input type="radio" name="temperature" value="1"><span>38.5-38.9</span></label>
                    <label><input type="radio" name="temperature" value="2"><span>≥39.0 or ≤36.0</span></label>
                </div>
            </div>
            <div class="input-row vertical">
                <div class="input-label">White blood cell count (x10³/μL)</div>
                <div class="radio-group vertical-group" data-name="wbc">
                    <label><input type="radio" name="wbc" value="0" checked><span>4-11</span></label>
                    <label><input type="radio" name="wbc" value="1"><span>&lt;4 or >11</span></label>
                    <label><input type="radio" name="wbc" value="2"><span>Either &lt;4 or >11 plus band forms ≥500</span></label>
                </div>
            </div>
            <div class="input-row vertical">
                <div class="input-label">Tracheal secretions</div>
                <div class="radio-group vertical-group" data-name="secretions">
                    <label><input type="radio" name="secretions" value="0" checked><span>&lt;14+</span></label>
                    <label><input type="radio" name="secretions" value="1"><span>≥14+</span></label>
                    <label><input type="radio" name="secretions" value="2"><span>≥14+ plus purulent secretions</span></label>
                </div>
            </div>
            <div class="input-row">
                <div class="input-label">Oxygenation, PaO₂/FiO₂ ratio</div>
                 <div class="input-with-unit">
                    <input type="number" id="pf_ratio" class="input-field" placeholder="e.g., 300">
                    <span>mmHg</span>
                </div>
                <div class="checkbox-container">
                    <input type="checkbox" id="ards" name="ards">
                    <label for="ards">Patient has ARDS</label>
                </div>
            </div>
             <div class="input-row vertical">
                <div class="input-label">Pulmonary radiography</div>
                <div class="radio-group vertical-group" data-name="radiography">
                    <label><input type="radio" name="radiography" value="0" checked><span>No infiltrate</span></label>
                    <label><input type="radio" name="radiography" value="1"><span>Diffuse or patchy infiltrate</span></label>
                    <label><input type="radio" name="radiography" value="2"><span>Localized infiltrate</span></label>
                </div>
            </div>
            <div class="input-row vertical">
                <div class="input-label">Culture of tracheal aspirate specimen</div>
                <div class="radio-group vertical-group" data-name="culture">
                    <label><input type="radio" name="culture" value="0" checked><span>Pathogenic bacteria cultured ≤1 or no growth</span></label>
                    <label><input type="radio" name="culture" value="1"><span>Pathogenic bacteria cultured >1+</span></label>
                    <label><input type="radio" name="culture" value="2"><span>Pathogenic bacteria cultured >1+ plus same pathogenic bacteria on gram stain >1+</span></label>
                </div>
            </div>
        </div>
        <div class="result-box">
             <div class="result-score" id="result-score">0 points</div>
             <div class="result-interpretation" id="result-interpretation"></div>
        </div>
    `,

    initialize: (client) => {
        const calculate = () => {
            const getRadioValue = (name) => parseInt(document.querySelector(`input[name="${name}"]:checked`)?.value || '0');
            
            const pfRatio = parseFloat(document.getElementById('pf_ratio').value) || 0;
            const hasArds = document.getElementById('ards').checked;
            let oxygenationScore = 0;
            if (pfRatio > 0 && pfRatio <= 240 && !hasArds) {
                oxygenationScore = 2;
            }

            const score = getRadioValue('temperature') + getRadioValue('wbc') + getRadioValue('secretions') + 
                          oxygenationScore + getRadioValue('radiography') + getRadioValue('culture');

            const resultScore = document.getElementById('result-score');
            const resultInterpretation = document.getElementById('result-interpretation');
            
            resultScore.textContent = `${score} points`;

            if (score <= 6) {
                resultInterpretation.innerHTML = 'If the clinical suspicion for VAP is <strong>LOW</strong>, do NOT culture sputum. Evaluate for other potential sources of infection.';
            } else {
                resultInterpretationinnerHTML = 'If the clinical suspicion for VAP is <strong>HIGH</strong>, perform bronchoalveolar lavage (BAL) or mini-BAL.';
            }
        };

        document.querySelectorAll('.form-container input').forEach(input => {
            input.addEventListener('input', calculate);
        });

        // --- FHIR Integration ---
        const setRadio = (name, value) => {
            const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
            if (radio) radio.checked = true;
        };

        getObservation(client, '8310-5').then(obs => { // Temperature
            if (obs && obs.valueQuantity) {
                const temp = obs.valueQuantity.value;
                if (temp >= 39.0 || temp <= 36.0) setRadio('temperature', '2');
                else if (temp >= 38.5) setRadio('temperature', '1');
                else if (temp >= 36.5) setRadio('temperature', '0');
            }
        });

        Promise.all([
            getObservation(client, '6690-2'), // WBC
            getObservation(client, '704-7')   // Band Neutrophils
        ]).then(([wbcObs, bandObs]) => {
            if (wbcObs && wbcObs.valueQuantity) {
                const wbc = wbcObs.valueQuantity.value;
                if (wbc < 4 || wbc > 11) {
                    const bands = bandObs?.valueQuantity?.value || 0;
                    if (bands >= 500) { // Assuming bands are in cells/uL. FHIR can be tricky.
                         setRadio('wbc', '2');
                    } else {
                         setRadio('wbc', '1');
                    }
                } else {
                    setRadio('wbc', '0');
                }
            }
        });

        Promise.all([
            getObservation(client, '2703-7'), // PaO2
            getObservation(client, '19999-9') // FiO2
        ]).then(([pao2Obs, fio2Obs]) => {
            if (pao2Obs?.valueQuantity?.value && fio2Obs?.valueQuantity?.value) {
                const pao2 = pao2Obs.valueQuantity.value;
                const fio2 = fio2Obs.valueQuantity.value; // Assuming FiO2 is a ratio 0-1
                const fio2Value = fio2 > 1 ? fio2 / 100 : fio2; // Handle % vs ratio
                if (fio2Value > 0) {
                    const pfRatio = pao2 / fio2Value;
                    document.getElementById('pf_ratio').value = pfRatio.toFixed(0);
                }
            }
        }).finally(() => {
            setTimeout(calculate, 500);
        });
    }
};
