
import { getPatientConditions, getObservation } from '../../utils.js';

export const bacterialMeningitisScore = {
    id: 'bacterial-meningitis-score',
    title: 'Bacterial Meningitis Score for Children',
    description: 'Rules out bacterial meningitis in children aged 29 days to 19 years.',

    generateHTML: () => `
        <div class="form-container">
            <div class="instructions-box dark-blue">
                <strong>INSTRUCTIONS:</strong> Use in patients aged 29 days to 19 years with CSF WBC ≥10 cells/μL. Do not use if patient is critically ill, recently received antibiotics, has a VP shunt or recent neurosurgery, is immunosuppressed, or has other bacterial infection requiring antibiotics (including Lyme disease).
            </div>
            <div class="input-row">
                <div class="input-label">CSF Gram stain positive</div>
                <div class="segmented-control" data-name="gram_stain">
                    <label><input type="radio" name="gram_stain" value="0" checked><span>No <strong>0</strong></span></label>
                    <label><input type="radio" name="gram_stain" value="2"><span>Yes <strong>+2</strong></span></label>
                </div>
            </div>
            <div class="input-row">
                <div class="input-label">CSF ANC ≥1,000 cells/μL</div>
                <div class="segmented-control" data-name="csf_anc">
                    <label><input type="radio" name="csf_anc" value="0" checked><span>No <strong>0</strong></span></label>
                    <label><input type="radio" name="csf_anc" value="1"><span>Yes <strong>+1</strong></span></label>
                </div>
            </div>
            <div class="input-row">
                <div class="input-label">CSF protein ≥80 mg/dL (800 mg/L)</div>
                <div class="segmented-control" data-name="csf_protein">
                    <label><input type="radio" name="csf_protein" value="0" checked><span>No <strong>0</strong></span></label>
                    <label><input type="radio" name="csf_protein" value="1"><span>Yes <strong>+1</strong></span></label>
                </div>
            </div>
            <div class="input-row">
                <div class="input-label">Peripheral blood ANC ≥10,000 cells/μL</div>
                <div class="segmented-control" data-name="blood_anc">
                    <label><input type="radio" name="blood_anc" value="0" checked><span>No <strong>0</strong></span></label>
                    <label><input type="radio" name="blood_anc" value="1"><span>Yes <strong>+1</strong></span></label>
                </div>
            </div>
            <div class="input-row">
                <div class="input-label">Seizure at (or prior to) initial presentation</div>
                <div class="segmented-control" data-name="seizure">
                    <label><input type="radio" name="seizure" value="0" checked><span>No <strong>0</strong></span></label>
                    <label><input type="radio" name="seizure" value="1"><span>Yes <strong>+1</strong></span></label>
                </div>
            </div>
        </div>
        <div class="result-box bms-result">
             <div class="result-score" id="result-score">0 points</div>
             <div class="result-interpretation" id="result-interpretation">Very low risk for bacterial meningitis.</div>
        </div>
    `,

    initialize: (client) => {
        const calculate = () => {
            const score = Array.from(document.querySelectorAll('.form-container input:checked')).reduce((acc, input) => {
                return acc + parseInt(input.value);
            }, 0);

            const resultScore = document.getElementById('result-score');
            const resultInterpretation = document.getElementById('result-interpretation');

            resultScore.textContent = `${score} points`;

            if (score === 0) {
                resultInterpretation.textContent = 'Very low risk for bacterial meningitis.';
            } else {
                resultInterpretation.textContent = 'NOT very low risk for bacterial meningitis.';
            }
        };

        document.querySelectorAll('.form-container input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', calculate);
        });

        // --- FHIR Integration ---
        const setRadio = (name, value) => {
            const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
            if (radio) radio.checked = true;
        };

        // CSF Gram Stain (LOINC: 664-3) - checking for positive result
        getObservation(client, '664-3').then(obs => {
            if (obs && obs.valueCodeableConcept) {
                // Assuming positive if a code indicating presence is found (example SNOMED code)
                const isPositive = obs.valueCodeableConcept.coding.some(c => c.code === '260348003');
                if (isPositive) setRadio('gram_stain', '2');
            }
        });

        // CSF ANC (LOINC: 26485-3)
        getObservation(client, '26485-3').then(obs => {
            if (obs && obs.valueQuantity && obs.valueQuantity.value >= 1000) {
                setRadio('csf_anc', '1');
            }
        });

        // CSF Protein (LOINC: 3137-7)
        getObservation(client, '3137-7').then(obs => {
            if (obs && obs.valueQuantity && obs.valueQuantity.value >= 80) {
                setRadio('csf_protein', '1');
            }
        });

        // Peripheral Blood ANC (LOINC: 751-8)
        getObservation(client, '751-8').then(obs => {
            if (obs && obs.valueQuantity && obs.valueQuantity.value >= 10000) {
                setRadio('blood_anc', '1');
            }
        });

        // Seizure (SNOMED: 91175000)
        getPatientConditions(client, ['91175000']).then(conditions => {
            if (conditions.length > 0) {
                setRadio('seizure', '1');
            }
        }).finally(() => {
            setTimeout(calculate, 500); // Calculate after all FHIR data has populated
        });
    }
};
