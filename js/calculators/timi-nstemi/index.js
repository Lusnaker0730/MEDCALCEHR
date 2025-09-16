
import { getPatient, getPatientConditions, getObservation } from '../../utils.js';

export const timiNstemi = {
    id: 'timi-nstemi',
    title: 'TIMI Risk Score for UA/NSTEMI',
    description: 'Estimates mortality for patients with unstable angina and non-ST elevation MI.',

    generateHTML: () => `
        <div class="form-container">
            <div class="input-row">
                <div class="input-label">Age ≥65</div>
                <div class="segmented-control" data-name="age">
                    <label><input type="radio" name="age" value="0" checked><span>No <strong>0</strong></span></label>
                    <label><input type="radio" name="age" value="1"><span>Yes <strong>+1</strong></span></label>
                </div>
            </div>
            <div class="input-row">
                <div class="input-label">≥3 CAD risk factors
                    <small>Hypertension, hypercholesterolemia, diabetes, family history of CAD, or current smoker</small>
                </div>
                <div class="segmented-control" data-name="cad_risk">
                    <label><input type="radio" name="cad_risk" value="0" checked><span>No <strong>0</strong></span></label>
                    <label><input type="radio" name="cad_risk" value="1"><span>Yes <strong>+1</strong></span></label>
                </div>
            </div>
            <div class="input-row">
                <div class="input-label">Known CAD (stenosis ≥50%)</div>
                <div class="segmented-control" data-name="known_cad">
                    <label><input type="radio" name="known_cad" value="0" checked><span>No <strong>0</strong></span></label>
                    <label><input type="radio" name="known_cad" value="1"><span>Yes <strong>+1</strong></span></label>
                </div>
            </div>
            <div class="input-row">
                <div class="input-label">ASA use in past 7 days</div>
                <div class="segmented-control" data-name="asa">
                    <label><input type="radio" name="asa" value="0" checked><span>No <strong>0</strong></span></label>
                    <label><input type="radio" name="asa" value="1"><span>Yes <strong>+1</strong></span></label>
                </div>
            </div>
            <div class="input-row">
                <div class="input-label">Severe angina (≥2 episodes in 24 hrs)</div>
                <div class="segmented-control" data-name="angina">
                    <label><input type="radio" name="angina" value="0" checked><span>No <strong>0</strong></span></label>
                    <label><input type="radio" name="angina" value="1"><span>Yes <strong>+1</strong></span></label>
                </div>
            </div>
            <div class="input-row">
                <div class="input-label">EKG ST changes ≥0.5mm</div>
                <div class="segmented-control" data-name="ekg">
                    <label><input type="radio" name="ekg" value="0" checked><span>No <strong>0</strong></span></label>
                    <label><input type="radio" name="ekg" value="1"><span>Yes <strong>+1</strong></span></label>
                </div>
            </div>
            <div class="input-row">
                <div class="input-label">Positive cardiac marker</div>
                <div class="segmented-control" data-name="marker">
                    <label><input type="radio" name="marker" value="0" checked><span>No <strong>0</strong></span></label>
                    <label><input type="radio" name="marker" value="1"><span>Yes <strong>+1</strong></span></label>
                </div>
            </div>
        </div>
        <div class="result-box">
             <div class="result-score" id="result-score">0 points</div>
             <div class="result-interpretation" id="result-interpretation">5% risk at 14 days</div>
        </div>
    `,

    initialize: (client) => {
        const riskMapping = {
            0: '5%', 1: '5%', 2: '8%', 3: '13%', 4: '20%', 5: '26%', 6: '41%', 7: '41%'
        };

        const calculate = () => {
            const score = Array.from(document.querySelectorAll('.form-container input:checked')).reduce((acc, input) => {
                return acc + parseInt(input.value);
            }, 0);

            const risk = riskMapping[score] || 'N/A';
            document.getElementById('result-score').textContent = `${score} points`;
            document.getElementById('result-interpretation').textContent = `${risk} risk at 14 days of: all-cause mortality, new or recurrent MI, or severe recurrent ischemia requiring urgent revascularization.`;
        };

        document.querySelectorAll('.form-container input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', calculate);
        });

        // --- FHIR Integration ---
        const setRadio = (name, value) => {
            const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
            if (radio) radio.checked = true;
        };

        getPatient(client).then(patient => {
            const age = new Date().getFullYear() - new Date(patient.birthDate).getFullYear();
            if (age >= 65) setRadio('age', '1');
        });

        const cadRiskFactorsCodes = [
            '38341003', // Hypertension
            '55822004', // Hypercholesterolemia
            '44054006', // Diabetes
        ];
        getPatientConditions(client, cadRiskFactorsCodes).then(conditions => {
            getObservation(client, "72166-2").then(smokingObs => { // Smoking status
                let riskCount = conditions.length;
                if (smokingObs && smokingObs.valueCodeableConcept && smokingObs.valueCodeableConcept.coding.some(c => ['449868002', '428041000124106'].includes(c.code))) {
                    riskCount++;
                }
                if (riskCount >= 3) setRadio('cad_risk', '1');
            });
        });
        
        getPatientConditions(client, ['53741008']).then(conditions => { // Known CAD
            if (conditions.length > 0) setRadio('known_cad', '1');
        });

        client.patient.request(`MedicationStatement?status=active&category=outpatient`).then(meds => {
             if (meds.entry) {
                const hasAspirin = meds.entry.some(e => 
                    e.resource.medicationCodeableConcept &&
                    e.resource.medicationCodeableConcept.coding.some(c => c.code === '1191') // RxNorm for Aspirin
                );
                if (hasAspirin) setRadio('asa', '1');
            }
        });

        const troponinCodes = ['30239-8', '15056-5', '10839-9', '32195-5']; // Troponin T and I
        Promise.all(troponinCodes.map(code => getObservation(client, code))).then(observations => {
            const positiveMarker = observations.some(obs => {
                if (!obs || !obs.valueQuantity || !obs.referenceRange || !obs.referenceRange[0].high) return false;
                return obs.valueQuantity.value > obs.referenceRange[0].high.value;
            });
            if (positiveMarker) setRadio('marker', '1');
        }).finally(() => {
            setTimeout(calculate, 500); // Calculate after all FHIR data has a chance to populate
        });
    }
};
