
import { getPatientConditions, getObservation } from '../../utils.js';

export const bacterialMeningitisScore = {
    id: 'bacterial-meningitis-score',
    title: 'Bacterial Meningitis Score for Children',
    description: 'Rules out bacterial meningitis in children aged 29 days to 19 years.',

    generateHTML: () => `
        <div class="form-container">
            <div class="instructions-box bms-instructions">
                <div class="instruction-header">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 10px;">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="16" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                    <strong>INSTRUCTIONS</strong>
                </div>
                <p>Use in patients aged <strong>29 days to 19 years</strong> with CSF WBC ≥10 cells/μL.</p>
                <p style="margin-top: 8px;"><strong>Do not use if:</strong> Patient is critically ill, recently received antibiotics, has a VP shunt or recent neurosurgery, is immunosuppressed, or has other bacterial infection requiring antibiotics (including Lyme disease).</p>
            </div>
            
            <div class="bms-criteria-section">
                <div class="input-row bms-input-row">
                    <div class="input-label bms-label">
                        <span class="label-icon">🔬</span>
                        <div>
                            <div class="label-main">CSF Gram stain positive</div>
                            <div class="label-sub">Cerebrospinal fluid microscopy</div>
                        </div>
                    </div>
                    <div class="segmented-control bms-control" data-name="gram_stain">
                        <label><input type="radio" name="gram_stain" value="0" checked><span>No <strong>0</strong></span></label>
                        <label><input type="radio" name="gram_stain" value="2"><span>Yes <strong>+2</strong></span></label>
                    </div>
                </div>
                
                <div class="input-row bms-input-row">
                    <div class="input-label bms-label">
                        <span class="label-icon">🧪</span>
                        <div>
                            <div class="label-main">CSF ANC ≥1,000 cells/μL</div>
                            <div class="label-sub">Absolute neutrophil count in CSF</div>
                        </div>
                    </div>
                    <div class="segmented-control bms-control" data-name="csf_anc">
                        <label><input type="radio" name="csf_anc" value="0" checked><span>No <strong>0</strong></span></label>
                        <label><input type="radio" name="csf_anc" value="1"><span>Yes <strong>+1</strong></span></label>
                    </div>
                </div>
                
                <div class="input-row bms-input-row">
                    <div class="input-label bms-label">
                        <span class="label-icon">📊</span>
                        <div>
                            <div class="label-main">CSF protein ≥80 mg/dL (800 mg/L)</div>
                            <div class="label-sub">Protein concentration in CSF</div>
                        </div>
                    </div>
                    <div class="segmented-control bms-control" data-name="csf_protein">
                        <label><input type="radio" name="csf_protein" value="0" checked><span>No <strong>0</strong></span></label>
                        <label><input type="radio" name="csf_protein" value="1"><span>Yes <strong>+1</strong></span></label>
                    </div>
                </div>
                
                <div class="input-row bms-input-row">
                    <div class="input-label bms-label">
                        <span class="label-icon">💉</span>
                        <div>
                            <div class="label-main">Peripheral blood ANC ≥10,000 cells/μL</div>
                            <div class="label-sub">Absolute neutrophil count in blood</div>
                        </div>
                    </div>
                    <div class="segmented-control bms-control" data-name="blood_anc">
                        <label><input type="radio" name="blood_anc" value="0" checked><span>No <strong>0</strong></span></label>
                        <label><input type="radio" name="blood_anc" value="1"><span>Yes <strong>+1</strong></span></label>
                    </div>
                </div>
                
                <div class="input-row bms-input-row">
                    <div class="input-label bms-label">
                        <span class="label-icon">⚡</span>
                        <div>
                            <div class="label-main">Seizure at (or prior to) initial presentation</div>
                            <div class="label-sub">Any seizure activity documented</div>
                        </div>
                    </div>
                    <div class="segmented-control bms-control" data-name="seizure">
                        <label><input type="radio" name="seizure" value="0" checked><span>No <strong>0</strong></span></label>
                        <label><input type="radio" name="seizure" value="1"><span>Yes <strong>+1</strong></span></label>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="result-box bms-result" id="bms-result-box">
            <div class="bms-result-content">
                <div class="result-score-section">
                    <div class="result-label">Total Score</div>
                    <div class="result-score bms-score" id="result-score">0</div>
                    <div class="result-points">points</div>
                </div>
                <div class="result-divider"></div>
                <div class="result-interpretation-section">
                    <div class="result-risk-icon" id="risk-icon">✓</div>
                    <div class="result-interpretation bms-interpretation" id="result-interpretation">Very low risk for bacterial meningitis.</div>
                </div>
            </div>
        </div>
    `,

    initialize: (client) => {
        const calculate = () => {
            const score = Array.from(document.querySelectorAll('.form-container input:checked')).reduce((acc, input) => {
                return acc + parseInt(input.value);
            }, 0);

            const resultScore = document.getElementById('result-score');
            const resultInterpretation = document.getElementById('result-interpretation');
            const resultBox = document.getElementById('bms-result-box');
            const riskIcon = document.getElementById('risk-icon');

            resultScore.textContent = score;

            if (score === 0) {
                resultInterpretation.textContent = 'Very low risk for bacterial meningitis.';
                resultBox.className = 'result-box bms-result bms-very-low-risk';
                riskIcon.textContent = '✓';
            } else {
                resultInterpretation.textContent = 'NOT very low risk for bacterial meningitis.';
                resultBox.className = 'result-box bms-result bms-not-low-risk';
                riskIcon.textContent = '⚠';
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
