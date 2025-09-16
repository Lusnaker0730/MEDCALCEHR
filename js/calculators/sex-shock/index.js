
import { getObservation, getPatient, convertToMmolL, convertToMgDl } from '../../utils.js';

export const sexShock = {
    id: 'sex-shock',
    title: 'SEX-SHOCK Risk Score for Cardiogenic Shock',
    description: 'Calculates the risk of in-hospital cardiogenic shock in patients with acute coronary syndrome (ACS).',

    generateHTML: () => `
        <div class="form-container">
            <div class="instructions-box important">
                <strong>IMPORTANT:</strong> External validation has been performed but is not complete for all patient populations. Use caution when applying this score to patients who have not undergone PCI.
            </div>
            <div class="input-row">
                <div class="input-label">Age >70 years</div>
                <div class="segmented-control" data-name="age">
                    <label><input type="radio" name="age" value="0" checked><span>No</span></label>
                    <label><input type="radio" name="age" value="1"><span>Yes</span></label>
                </div>
            </div>
            <div class="input-row">
                <div class="input-label">Sex</div>
                <div class="segmented-control" data-name="sex">
                    <label><input type="radio" name="sex" value="0" checked><span>Male</span></label>
                    <label><input type="radio" name="sex" value="1"><span>Female</span></label>
                </div>
            </div>
            <div class="input-row">
                <div class="input-label">Received PCI</div>
                <div class="segmented-control" data-name="pci">
                    <label><input type="radio" name="pci" value="1" checked><span>No</span></label>
                    <label><input type="radio" name="pci" value="0"><span>Yes</span></label>
                </div>
            </div>
            <div class="input-row">
                <div class="input-label">Post-PCI TIMI flow &lt;3</div>
                <div class="segmented-control" data-name="timi">
                    <label><input type="radio" name="timi" value="0" checked><span>No</span></label>
                    <label><input type="radio" name="timi" value="1"><span>Yes</span></label>
                </div>
            </div>
            <div class="input-row">
                <div class="input-label">Culprit lesion of the left main</div>
                <div class="segmented-control" data-name="left_main">
                    <label><input type="radio" name="left_main" value="0" checked><span>No</span></label>
                    <label><input type="radio" name="left_main" value="1"><span>Yes</span></label>
                </div>
            </div>
            <div class="input-row">
                <div class="input-label">Glycemia >10 mmol/L</div>
                <div class="segmented-control" data-name="glycemia">
                    <label><input type="radio" name="glycemia" value="0" checked><span>No</span></label>
                    <label><input type="radio" name="glycemia" value="1"><span>Yes</span></label>
                </div>
            </div>
            <div class="input-row">
                <div class="input-label">SBP &lt;125 and PP &lt;45 mmHg</div>
                <div class="segmented-control" data-name="bp">
                    <label><input type="radio" name="bp" value="0" checked><span>No</span></label>
                    <label><input type="radio" name="bp" value="1"><span>Yes</span></label>
                </div>
            </div>
            <div class="input-row">
                <div class="input-label">Heart rate >90/min</div>
                <div class="segmented-control" data-name="hr">
                    <label><input type="radio" name="hr" value="0" checked><span>No</span></label>
                    <label><input type="radio" name="hr" value="1"><span>Yes</span></label>
                </div>
            </div>
            <div class="input-row">
                <div class="input-label">Killip Classification class III</div>
                <div class="segmented-control" data-name="killip">
                    <label><input type="radio" name="killip" value="0" checked><span>No</span></label>
                    <label><input type="radio" name="killip" value="1"><span>Yes</span></label>
                </div>
            </div>
            <div class="input-row">
                <div class="input-label">Presentation as cardiac arrest</div>
                <div class="segmented-control" data-name="arrest">
                    <label><input type="radio" name="arrest" value="0" checked><span>No</span></label>
                    <label><input type="radio" name="arrest" value="1"><span>Yes</span></label>
                </div>
            </div>
            <div class="input-row">
                <div class="input-label">Left-ventricular ejection fraction (%)</div>
                <div class="segmented-control" data-name="lvef">
                    <label><input type="radio" name="lvef" value="55"><span>>50</span></label>
                    <label><input type="radio" name="lvef" value="42.5"><span>35-50</span></label>
                    <label><input type="radio" name="lvef" value="30" checked><span>&lt;35</span></label>
                </div>
            </div>
            <div class="input-row">
                <div class="input-label">ST-segment elevation</div>
                <div class="segmented-control" data-name="st_elevation">
                    <label><input type="radio" name="st_elevation" value="0" checked><span>No</span></label>
                    <label><input type="radio" name="st_elevation" value="1"><span>Yes</span></label>
                </div>
            </div>
             <div class="input-row">
                <div class="input-label">Creatinine</div>
                <div class="input-with-unit">
                    <input type="number" id="creatinine" class="input-field" placeholder="1.0">
                    <span>mg/dL</span>
                </div>
            </div>
            <div class="input-row">
                <div class="input-label">C-reactive protein</div>
                <div class="input-with-unit">
                    <input type="number" id="crp" class="input-field" placeholder="50">
                    <span>mg/L</span>
                </div>
            </div>
        </div>
        <div class="result-box">
             <div class="result-score" id="result-score">-%</div>
             <div class="result-interpretation" id="result-interpretation">Risk of in-hospital cardiogenic shock</div>
        </div>
    `,

    initialize: (client) => {
        const calculate = () => {
            const getRadioValue = (name) => parseInt(document.querySelector(`input[name="${name}"]:checked`)?.value || '0');
            const getInputValue = (id) => parseFloat(document.getElementById(id).value) || 0;

            const isFemale = getRadioValue('sex');
            const isAgeOver70 = getRadioValue('age');
            const noPci = getRadioValue('pci');
            const isTimiLow = getRadioValue('timi');
            const isLeftMain = getRadioValue('left_main');
            const isGlycemiaHigh = getRadioValue('glycemia');
            const isBpLow = getRadioValue('bp');
            const isHrHigh = getRadioValue('hr');
            const isKillip3 = getRadioValue('killip');
            const isArrest = getRadioValue('arrest');
            const lvefValue = getRadioValue('lvef');
            const isStElevation = getRadioValue('st_elevation');
            const creatinineValue = getInputValue('creatinine');
            const crpValue = getInputValue('crp');

            // Logistic regression formula from Omerbasic et al., 2017
            const lp = -6.58 + 
                (0.99 * isFemale) + 
                (0.81 * isAgeOver70) + 
                (1.25 * noPci) + 
                (1.25 * isTimiLow) + 
                (1.39 * isLeftMain) + 
                (0.87 * isGlycemiaHigh) + 
                (0.98 * isBpLow) + 
                (0.69 * isHrHigh) + 
                (0.90 * isKillip3) + 
                (1.25 * isArrest) - 
                (0.05 * lvefValue) + 
                (1.13 * isStElevation) + 
                (0.28 * creatinineValue) + 
                (0.01 * crpValue);
            
            const risk = 100 / (1 + Math.exp(-lp));

            document.getElementById('result-score').textContent = `${risk.toFixed(1)}%`;
        };

        document.querySelectorAll('.form-container input').forEach(input => {
            input.addEventListener('input', calculate);
        });

        // --- FHIR Integration ---
        getPatient(client).then(patient => {
            if (patient.gender === 'female') {
                document.querySelector('input[name="sex"][value="1"]').checked = true;
            }
            const age = new Date().getFullYear() - new Date(patient.birthDate).getFullYear();
            if (age > 70) {
                document.querySelector('input[name="age"][value="1"]').checked = true;
            }
        });

        getObservation(client, "8480-6").then(sbpObs => { // SBP
            if (!sbpObs) return;
            getObservation(client, "8462-4").then(dbpObs => { // DBP
                if (!dbpObs) return;
                const sbp = sbpObs.valueQuantity.value;
                const dbp = dbpObs.valueQuantity.value;
                const pp = sbp - dbp;
                if (sbp < 125 && pp < 45) {
                    document.querySelector('input[name="bp"][value="1"]').checked = true;
                }
            });
        });

        getObservation(client, "8867-4").then(hrObs => { // Heart Rate
            if (hrObs && hrObs.valueQuantity.value > 90) {
                document.querySelector('input[name="hr"][value="1"]').checked = true;
            }
        });

        getObservation(client, "2339-0").then(glucoseObs => { // Glucose
            if (glucoseObs) {
                const glucoseMmolL = convertToMmolL(glucoseObs.valueQuantity.value, 'glucose');
                if (glucoseMmolL > 10) {
                    document.querySelector('input[name="glycemia"][value="1"]').checked = true;
                }
            }
        });
        
        getObservation(client, "39156-5").then(lvefObs => { // LVEF
            if (lvefObs) {
                const lvef = lvefObs.valueQuantity.value;
                let lvefRadioValue = '30';
                if (lvef > 50) {
                    lvefRadioValue = '55';
                } else if (lvef >= 35) {
                    lvefRadioValue = '42.5';
                }
                document.querySelector(`input[name="lvef"][value="${lvefRadioValue}"]`).checked = true;
            }
        });

        getObservation(client, "2160-0").then(crObs => { // Creatinine
            if (crObs) {
                document.getElementById('creatinine').value = crObs.valueQuantity.value.toFixed(2);
            }
        });

        getObservation(client, "1988-5").then(crpObs => { // C-reactive protein
            if (crpObs) {
                document.getElementById('crp').value = crpObs.valueQuantity.value.toFixed(1);
            }
        });

        setTimeout(calculate, 500); // Calculate after FHIR data has a chance to populate
    }
};
