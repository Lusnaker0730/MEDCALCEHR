import { getPatient, getMostRecentObservation, getPatientConditions } from '../../utils.js';

export const fourPeps = {
    id: '4peps',
    title: '4-Level Pulmonary Embolism Clinical Probability Score (4PEPS)',
    description: 'Rules out PE based on clinical criteria.',
    generateHTML: () => `
        <div class="instructions-box dark-blue">
            <strong>INSTRUCTIONS</strong>
            <p>The timing of vital sign values were not formally assessed by this study; we recommend using clinician judgment to assess which vital sign should be used for the 4PEPS score.</p>
        </div>
        <div class="form-container">
            <div class="input-row-new">
                <div class="input-label-new">Age</div>
                <div class="input-control-new">
                    <div class="input-with-unit">
                        <input type="number" id="fourpeps-age" placeholder="e.g., 70">
                        <span>years</span>
                    </div>
                </div>
            </div>
            <div class="input-row-new">
                <div class="input-label-new">Sex</div>
                <div class="input-control-new">
                    <div class="segmented-control" data-name="sex">
                        <button data-value="0">Female <strong>0</strong></button>
                        <button data-value="2" class="active">Male <strong>+2</strong></button>
                    </div>
                </div>
            </div>
            <div class="input-row-new">
                <div class="input-label-new">Chronic respiratory disease</div>
                <div class="input-control-new">
                    <div class="segmented-control" data-name="resp_disease">
                        <button data-value="0" class="active">No <strong>0</strong></button>
                        <button data-value="-1">Yes <strong>-1</strong></button>
                    </div>
                </div>
            </div>
            <div class="input-row-new">
                <div class="input-label-new">Heart rate &lt;80</div>
                <div class="input-control-new">
                    <div class="segmented-control" data-name="hr">
                        <button data-value="0" class="active">No <strong>0</strong></button>
                        <button data-value="-1">Yes <strong>-1</strong></button>
                    </div>
                </div>
            </div>
            <div class="input-row-new">
                <div class="input-label-new">Chest pain AND acute dyspnea</div>
                <div class="input-control-new">
                    <div class="segmented-control" data-name="chest_pain">
                        <button data-value="0" class="active">No <strong>0</strong></button>
                        <button data-value="1">Yes <strong>+1</strong></button>
                    </div>
                </div>
            </div>
            <div class="input-row-new">
                <div class="input-label-new">Current estrogen use</div>
                <div class="input-control-new">
                    <div class="segmented-control" data-name="estrogen">
                        <button data-value="0" class="active">No <strong>0</strong></button>
                        <button data-value="2">Yes <strong>+2</strong></button>
                    </div>
                </div>
            </div>
            <div class="input-row-new">
                <div class="input-label-new">Prior history of VTE</div>
                <div class="input-control-new">
                    <div class="segmented-control" data-name="vte">
                        <button data-value="0" class="active">No <strong>0</strong></button>
                        <button data-value="2">Yes <strong>+2</strong></button>
                    </div>
                </div>
            </div>
            <div class="input-row-new">
                <div class="input-label-new">Syncope</div>
                <div class="input-control-new">
                    <div class="segmented-control" data-name="syncope">
                        <button data-value="0" class="active">No <strong>0</strong></button>
                        <button data-value="2">Yes <strong>+2</strong></button>
                    </div>
                </div>
            </div>
            <div class="input-row-new">
                <div class="input-label-new">Immobility within the last four weeks</div>
                <div class="input-control-new">
                    <div class="segmented-control" data-name="immobility">
                        <button data-value="0" class="active">No <strong>0</strong></button>
                        <button data-value="2">Yes <strong>+2</strong></button>
                    </div>
                </div>
            </div>
            <div class="input-row-new">
                <div class="input-label-new">O₂ saturation &lt;95%</div>
                <div class="input-control-new">
                    <div class="segmented-control" data-name="o2_sat">
                        <button data-value="0" class="active">No <strong>0</strong></button>
                        <button data-value="3">Yes <strong>+3</strong></button>
                    </div>
                </div>
            </div>
            <div class="input-row-new">
                <div class="input-label-new">Calf pain and/or unilateral lower limb edema</div>
                <div class="input-control-new">
                    <div class="segmented-control" data-name="calf_pain">
                        <button data-value="0" class="active">No <strong>0</strong></button>
                        <button data-value="3">Yes <strong>+3</strong></button>
                    </div>
                </div>
            </div>
            <div class="input-row-new">
                <div class="input-label-new">PE is the most likely diagnosis</div>
                <div class="input-control-new">
                    <div class="segmented-control" data-name="pe_likely">
                        <button data-value="0" class="active">No <strong>0</strong></button>
                        <button data-value="5">Yes <strong>+5</strong></button>
                    </div>
                </div>
            </div>
        </div>
        <div class="result-box four-peps-result">
            <div class="result-item">
                <span class="score" id="fourpeps-score">7</span>
                <small>4PEPS Score</small>
            </div>
            <div class="result-item">
                <span class="probability" id="fourpeps-probability">20-65%</span>
                <small id="fourpeps-risk-level">Moderate CPP</small>
            </div>
            <div class="result-item recommendation">
                <p id="fourpeps-recommendation">PE can be ruled out if D-dimer level &lt;0.5 µg/mL OR &lt;(age x 0.01) µg/mL</p>
            </div>
        </div>

        <div class="calculator-image-container" style="margin-top: 20px;">
            <img src="js/calculators/4peps/4PEPS.png" alt="4PEPS Score Reference" style="max-width: 100%; width: 100%; border-radius: 8px;" />
        </div>

        <div class="citation">
            <h4>Source:</h4>
            <p>Roy, P. M., et al. (2021). Derivation and Validation of a 4-Level Clinical Pretest Probability Score for Suspected Pulmonary Embolism to Safely Decrease Imaging Testing. <em>JAMA Cardiology</em>, 6(6), 669–677. <a href="https://doi.org/10.1001/jamacardio.2021.0064" target="_blank">doi:10.1001/jamacardio.2021.0064</a>.</p>
        </div>
    `,
    initialize: async client => {
        const calculate = () => {
            let score = 0;

            const ageInput = document.getElementById('fourpeps-age');
            const age = parseInt(ageInput.value);
            if (!isNaN(age) && age > 74) {
                score += 2;
            }

            document.querySelectorAll('.segmented-control').forEach(group => {
                const selected = group.querySelector('.active');
                if (selected) {
                    score += parseInt(selected.dataset.value);
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
                    'PE can be ruled out if D-dimer level &lt;0.5 µg/mL OR &lt;(age x 0.01) µg/mL';
            } else {
                probability = '66-95%';
                riskLevel = 'High CPP';
                recommendation = 'Imaging (e.g., CTPA) is recommended.';
            }

            document.getElementById('fourpeps-score').textContent = score;
            document.getElementById('fourpeps-probability').textContent = probability;
            document.getElementById('fourpeps-risk-level').textContent = riskLevel;
            document.getElementById('fourpeps-recommendation').textContent = recommendation;
        };

        document.querySelectorAll('.segmented-control').forEach(group => {
            group.addEventListener('click', event => {
                const button = event.target.closest('button');
                if (!button) {
                    return;
                }

                group.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                calculate();
            });
        });

        document.getElementById('fourpeps-age').addEventListener('input', calculate);

        // FHIR auto-population
        try {
            const patient = await getPatient(client);
            if (patient) {
                if (patient.birthDate) {
                    const age = calculateAge(patient.birthDate);
                    document.getElementById('fourpeps-age').value = age;
                }
                if (patient.gender) {
                    const sexGroup = document.querySelector('[data-name="sex"]');
                    const btn =
                        patient.gender === 'male'
                            ? sexGroup.querySelector('[data-value="2"]')
                            : sexGroup.querySelector('[data-value="0"]');
                    sexGroup.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
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
                    const group = document.querySelector('[data-name="resp_disease"]');
                    group.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                    group.querySelector('[data-value="-1"]').classList.add('active');
                }
                if (conditions.some(c => vteCodes.includes(c.code.coding[0].code))) {
                    const group = document.querySelector('[data-name="vte"]');
                    group.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                    group.querySelector('[data-value="2"]').classList.add('active');
                }
            }

            if (hrObs && hrObs.value < 80) {
                const group = document.querySelector('[data-name="hr"]');
                group.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                group.querySelector('[data-value="-1"]').classList.add('active');
            }

            if (o2Obs && o2Obs.value < 95) {
                const group = document.querySelector('[data-name="o2_sat"]');
                group.querySelectorAll('button').forEach(b => b.classList.remove('active'));
                group.querySelector('[data-value="3"]').classList.add('active');
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
