import { getPatient, getMostRecentObservation, getPatientConditions } from '../../utils.js';

export const fourPeps = {
    id: '4peps',
    title: '4-Level Pulmonary Embolism Clinical Probability Score (4PEPS)',
    description: 'Rules out PE based on clinical criteria.',
    generateHTML: () => `
        <div class="calculator-header">
            <h3>4-Level Pulmonary Embolism Clinical Probability Score (4PEPS)</h3>
            <p class="description">Rules out PE based on clinical criteria.</p>
        </div>
        
        <div class="alert info">
            <strong>📋 Instructions</strong>
            <p>The timing of vital sign values were not formally assessed by this study; we recommend using clinician judgment to assess which vital sign should be used for the 4PEPS score.</p>
        </div>
        <div class="section">
            <div class="section-title">Age</div>
            <div class="input-with-unit">
                <input type="number" id="fourpeps-age" placeholder="e.g., 70">
                <span>years</span>
            </div>
            <small class="help-text">+2 points if >74 years</small>
        </div>
        
        <div class="section">
            <div class="section-title">Sex</div>
            <div class="radio-group" data-name="sex">
                <label class="radio-option">
                    <input type="radio" name="sex" value="0">
                    <span class="radio-label">Female <strong>0</strong></span>
                </label>
                <label class="radio-option selected">
                    <input type="radio" name="sex" value="2" checked>
                    <span class="radio-label">Male <strong>+2</strong></span>
                </label>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">Chronic respiratory disease</div>
            <div class="radio-group" data-name="resp_disease">
                <label class="radio-option selected">
                    <input type="radio" name="resp_disease" value="0" checked>
                    <span class="radio-label">No <strong>0</strong></span>
                </label>
                <label class="radio-option">
                    <input type="radio" name="resp_disease" value="-1">
                    <span class="radio-label">Yes <strong>-1</strong></span>
                </label>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">Heart rate &lt;80</div>
            <div class="radio-group" data-name="hr">
                <label class="radio-option selected">
                    <input type="radio" name="hr" value="0" checked>
                    <span class="radio-label">No <strong>0</strong></span>
                </label>
                <label class="radio-option">
                    <input type="radio" name="hr" value="-1">
                    <span class="radio-label">Yes <strong>-1</strong></span>
                </label>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">Chest pain AND acute dyspnea</div>
            <div class="radio-group" data-name="chest_pain">
                <label class="radio-option selected">
                    <input type="radio" name="chest_pain" value="0" checked>
                    <span class="radio-label">No <strong>0</strong></span>
                </label>
                <label class="radio-option">
                    <input type="radio" name="chest_pain" value="1">
                    <span class="radio-label">Yes <strong>+1</strong></span>
                </label>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">Current estrogen use</div>
            <div class="radio-group" data-name="estrogen">
                <label class="radio-option selected">
                    <input type="radio" name="estrogen" value="0" checked>
                    <span class="radio-label">No <strong>0</strong></span>
                </label>
                <label class="radio-option">
                    <input type="radio" name="estrogen" value="2">
                    <span class="radio-label">Yes <strong>+2</strong></span>
                </label>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">Prior history of VTE</div>
            <div class="radio-group" data-name="vte">
                <label class="radio-option selected">
                    <input type="radio" name="vte" value="0" checked>
                    <span class="radio-label">No <strong>0</strong></span>
                </label>
                <label class="radio-option">
                    <input type="radio" name="vte" value="2">
                    <span class="radio-label">Yes <strong>+2</strong></span>
                </label>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">Syncope</div>
            <div class="radio-group" data-name="syncope">
                <label class="radio-option selected">
                    <input type="radio" name="syncope" value="0" checked>
                    <span class="radio-label">No <strong>0</strong></span>
                </label>
                <label class="radio-option">
                    <input type="radio" name="syncope" value="2">
                    <span class="radio-label">Yes <strong>+2</strong></span>
                </label>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">Immobility within the last four weeks</div>
            <div class="radio-group" data-name="immobility">
                <label class="radio-option selected">
                    <input type="radio" name="immobility" value="0" checked>
                    <span class="radio-label">No <strong>0</strong></span>
                </label>
                <label class="radio-option">
                    <input type="radio" name="immobility" value="2">
                    <span class="radio-label">Yes <strong>+2</strong></span>
                </label>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">O₂ saturation &lt;95%</div>
            <div class="radio-group" data-name="o2_sat">
                <label class="radio-option selected">
                    <input type="radio" name="o2_sat" value="0" checked>
                    <span class="radio-label">No <strong>0</strong></span>
                </label>
                <label class="radio-option">
                    <input type="radio" name="o2_sat" value="3">
                    <span class="radio-label">Yes <strong>+3</strong></span>
                </label>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">Calf pain and/or unilateral lower limb edema</div>
            <div class="radio-group" data-name="calf_pain">
                <label class="radio-option selected">
                    <input type="radio" name="calf_pain" value="0" checked>
                    <span class="radio-label">No <strong>0</strong></span>
                </label>
                <label class="radio-option">
                    <input type="radio" name="calf_pain" value="3">
                    <span class="radio-label">Yes <strong>+3</strong></span>
                </label>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">PE is the most likely diagnosis</div>
            <div class="radio-group" data-name="pe_likely">
                <label class="radio-option selected">
                    <input type="radio" name="pe_likely" value="0" checked>
                    <span class="radio-label">No <strong>0</strong></span>
                </label>
                <label class="radio-option">
                    <input type="radio" name="pe_likely" value="5">
                    <span class="radio-label">Yes <strong>+5</strong></span>
                </label>
            </div>
        </div>
        <div class="result-container">
            <div class="result-header">4PEPS Score</div>
            <div class="result-score" id="fourpeps-score">7</div>
            <div class="result-item">
                <span class="label">Clinical Pretest Probability</span>
                <span class="value" id="fourpeps-probability">20-65%</span>
            </div>
            <div class="result-item">
                <span class="label">Risk Level</span>
                <span class="value risk-badge" id="fourpeps-risk-level">Moderate CPP</span>
            </div>
            <div class="alert info" id="fourpeps-recommendation-alert">
                <strong>💡 Recommendation</strong>
                <p id="fourpeps-recommendation">PE can be ruled out if D-dimer level &lt;0.5 µg/mL OR &lt;(age x 0.01) µg/mL</p>
            </div>
        </div>

        <div class="chart-container">
            <img src="js/calculators/4peps/4PEPS.png" alt="4PEPS Score Reference" class="reference-image" />
        </div>

        <div class="info-section">
            <h4>📚 Reference</h4>
            <p>Roy, P. M., et al. (2021). Derivation and Validation of a 4-Level Clinical Pretest Probability Score for Suspected Pulmonary Embolism to Safely Decrease Imaging Testing. <em>JAMA Cardiology</em>, 6(6), 669–677. <a href="https://doi.org/10.1001/jamacardio.2021.0064" target="_blank">doi:10.1001/jamacardio.2021.0064</a>.</p>
        </div>
    `,
    initialize: async (client, patient, container) => {
        const root = container || document;
        
        const calculate = () => {
            let score = 0;

            const ageInput = root.querySelector('#fourpeps-age');
            const age = parseInt(ageInput.value);
            if (!isNaN(age) && age > 74) {
                score += 2;
            }

            // Get scores from all radio buttons
            root.querySelectorAll('.radio-group').forEach(group => {
                const checked = group.querySelector('input[type="radio"]:checked');
                if (checked) {
                    score += parseInt(checked.value);
                }
            });

            let probability = '';
            let riskLevel = '';
            let recommendation = '';

            if (score <= 3) {
                probability = '2-7%';
                riskLevel = 'Low CPP';
                recommendation =
                    'PE can be ruled out if 4PEPS score is 0-3 and D-dimer is negative (using age-adjusted threshold).';
            } else if (score <= 9) {
                probability = '20-65%';
                riskLevel = 'Moderate CPP';
                recommendation =
                    'PE can be ruled out if D-dimer level <0.5 µg/mL OR <(age x 0.01) µg/mL';
            } else {
                probability = '66-95%';
                riskLevel = 'High CPP';
                recommendation = 'Imaging (e.g., CTPA) is recommended.';
            }

            const resultContainer = root.querySelector('.result-container');
            const scoreEl = root.querySelector('#fourpeps-score');
            const probabilityEl = root.querySelector('#fourpeps-probability');
            const riskLevelEl = root.querySelector('#fourpeps-risk-level');
            const recommendationEl = root.querySelector('#fourpeps-recommendation');

            if (resultContainer) {
                resultContainer.classList.add('show');
            }

            if (scoreEl) scoreEl.textContent = score;
            if (probabilityEl) probabilityEl.textContent = probability;
            if (riskLevelEl) riskLevelEl.textContent = riskLevel;
            if (recommendationEl) recommendationEl.innerHTML = recommendation;
        };

        // Add event listeners for all radio buttons
        root.querySelectorAll('.radio-option input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', () => {
                // Add visual feedback
                const parent = radio.closest('.radio-option');
                const siblings = parent.parentElement.querySelectorAll('.radio-option');
                siblings.forEach(s => s.classList.remove('selected'));
                parent.classList.add('selected');
                
                calculate();
            });
        });

        root.querySelector('#fourpeps-age').addEventListener('input', calculate);

        // FHIR auto-population
        try {
            const patientData = await getPatient(client);
            if (patientData) {
                if (patientData.birthDate) {
                    const age = calculateAge(patientData.birthDate);
                    const ageInput = root.querySelector('#fourpeps-age');
                    if (ageInput) {
                        ageInput.value = age;
                    }
                }
                if (patientData.gender) {
                    const sexGroup = root.querySelector('[data-name="sex"]');
                    const radioValue = patientData.gender === 'male' ? '2' : '0';
                    const radioToCheck = sexGroup.querySelector(`input[value="${radioValue}"]`);
                    if (radioToCheck) {
                        radioToCheck.checked = true;
                        radioToCheck.closest('.radio-option').classList.add('selected');
                        // Remove selected from other options
                        sexGroup.querySelectorAll('.radio-option').forEach(opt => {
                            if (opt !== radioToCheck.closest('.radio-option')) {
                                opt.classList.remove('selected');
                            }
                        });
                    }
                }
            }

            const chronicRespCodes = ['13645005', 'J44.9']; // COPD
            const vteCodes = ['I82.90', '451574005']; // VTE history

            const [conditions, hrObs, o2Obs] = await Promise.all([
                getPatientConditions(client, [...chronicRespCodes, ...vteCodes]),
                getMostRecentObservation(client, '8867-4'), // Heart rate
                getMostRecentObservation(client, '59408-5') // O2 Sat on Room Air
            ]);

            if (conditions) {
                if (conditions.some(c => chronicRespCodes.includes(c.code.coding[0].code))) {
                    const group = root.querySelector('[data-name="resp_disease"]');
                    const radioToCheck = group.querySelector('input[value="-1"]');
                    if (radioToCheck) {
                        radioToCheck.checked = true;
                        const parent = radioToCheck.closest('.radio-option');
                        group.querySelectorAll('.radio-option').forEach(opt => opt.classList.remove('selected'));
                        parent.classList.add('selected');
                    }
                }
                if (conditions.some(c => vteCodes.includes(c.code.coding[0].code))) {
                    const group = root.querySelector('[data-name="vte"]');
                    const radioToCheck = group.querySelector('input[value="2"]');
                    if (radioToCheck) {
                        radioToCheck.checked = true;
                        const parent = radioToCheck.closest('.radio-option');
                        group.querySelectorAll('.radio-option').forEach(opt => opt.classList.remove('selected'));
                        parent.classList.add('selected');
                    }
                }
            }

            if (hrObs && hrObs.value < 80) {
                const group = root.querySelector('[data-name="hr"]');
                const radioToCheck = group.querySelector('input[value="-1"]');
                if (radioToCheck) {
                    radioToCheck.checked = true;
                    const parent = radioToCheck.closest('.radio-option');
                    group.querySelectorAll('.radio-option').forEach(opt => opt.classList.remove('selected'));
                    parent.classList.add('selected');
                }
            }

            if (o2Obs && o2Obs.value < 95) {
                const group = root.querySelector('[data-name="o2_sat"]');
                const radioToCheck = group.querySelector('input[value="3"]');
                if (radioToCheck) {
                    radioToCheck.checked = true;
                    const parent = radioToCheck.closest('.radio-option');
                    group.querySelectorAll('.radio-option').forEach(opt => opt.classList.remove('selected'));
                    parent.classList.add('selected');
                }
            }
        } catch (error) {
            console.error('Error auto-populating 4PEPS:', error);
        } finally {
            calculate();
        }
    }
};

function calculateAge(birthDate) {
    const today = new Date();
    const birthDateObj = new Date(birthDate);
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const m = today.getMonth() - birthDateObj.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
        age--;
    }
    return age;
}
