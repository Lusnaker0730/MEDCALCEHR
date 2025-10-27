import { getMostRecentObservation, getPatient } from '../../utils.js';

export const fourCMortalityCovid = {
    id: '4c-mortality-covid',
    title: '4C Mortality Score for COVID-19',
    description: 'Predicts in-hospital mortality in patients admitted with COVID-19.',

    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>

            <div class="form-container">
                <div class="instructions-box dark-blue">
                    <strong>INSTRUCTIONS</strong>
                    <p>Use with admitted patients diagnosed with COVID-19.</p>
                </div>

                ${this.createRow(
        'age',
        'Age, years',
        [
            { value: 0, text: '<50', points: '0' },
            { value: 2, text: '50-59', points: '+2' },
            { value: 4, text: '60-69', points: '+4' },
            { value: 6, text: '70-79', points: '+6' },
            { value: 7, text: '≥80', points: '+7' }
        ],
        'vertical-radio-group'
    )}

                ${this.createRow(
        'sex',
        'Sex at birth',
        [
            { value: 0, text: 'Female', points: '0' },
            { value: 1, text: 'Male', points: '+1' }
        ],
        'segmented-control'
    )}

                ${this.createRow(
        'comorbidities',
        'Number of comorbidities*',
        [
            { value: 0, text: '0', points: '0' },
            { value: 1, text: '1', points: '+1' },
            { value: 2, text: '≥2', points: '+2' }
        ],
        'segmented-control'
    )}

                ${this.createRow(
        'resp_rate',
        'Respiratory rate, breaths/min',
        [
            { value: 0, text: '<20', points: '0' },
            { value: 1, text: '20-29', points: '+1' },
            { value: 2, text: '≥30', points: '+2' }
        ],
        'segmented-control'
    )}

                ${this.createRow(
        'oxygen_sat',
        'Peripheral oxygen saturation on room air',
        [
            { value: 0, text: '≥92%', points: '0' },
            { value: 2, text: '<92%', points: '+2' }
        ],
        'segmented-control'
    )}
                
                ${this.createRow(
        'gcs',
        'Glasgow Coma Scale',
        [
            { value: 0, text: '15', points: '0' },
            { value: 2, text: '<15', points: '+2' }
        ],
        'segmented-control'
    )}
                
                ${this.createRow(
        'urea',
        'Urea or BUN (use one measurement available)',
        [
            {
                value: 0,
                text: 'Urea <7 mmol/L (<42 mg/dL) OR BUN <19.6 mg/dL',
                points: '0'
            },
            {
                value: 1,
                text: 'Urea ≥7 to <14 mmol/L (≥42mg/dL to <84 mg/dL) OR BUN ≥19.6 to <39.2 mg/dL',
                points: '1'
            },
            {
                value: 3,
                text: 'Urea ≥14 mmol/L (>84 mg/dL) OR BUN >39.2 mg/dL',
                points: '3'
            }
        ],
        'vertical-radio-group'
    )}
                
                ${this.createRow(
        'crp',
        'C-reactive protein, mg/L',
        [
            { value: 0, text: '<50 mg/L (<5 mg/dL)', points: '0' },
            { value: 1, text: '50-99 mg/L (5-9.9 mg/dL)', points: '1' },
            { value: 2, text: '≥100 mg/L (≥10 mg/dL)', points: '2' }
        ],
        'vertical-radio-group'
    )}
                <div class="input-label-new">
                    <p><small>*Comorbidities include chronic cardiac disease, chronic respiratory disease (excluding asthma), chronic renal disease (estimated glomerular filtration rate ≤30), mild to severe liver disease, dementia, chronic neurological conditions, connective tissue disease, diabetes mellitus (diet, tablet, or insulin controlled), HIV or AIDS, and malignancy.</small></p>
                </div>
            </div>
            <div class="result-box four-c-result">
                <div class="result-item">
                    <span class="score" id="four-c-score">0</span>
                    <small>4C Mortality Score</small>
                </div>
                <div class="result-item">
                    <span class="risk" id="four-c-risk">Low</span>
                    <small>Risk group</small>
                </div>
                <div class="result-item">
                    <span class="mortality" id="four-c-mortality">1.2-1.7%</span>
                    <small>in-hospital mortality</small>
                </div>
            </div>

            <div class="calculator-image-container" style="margin-top: 20px;">
                <img id="ref-image-thumb" src="js/calculators/4c-mortality-covid/p652-t2.gif" alt="4C Score Reference Table" style="max-width: 1000px; width: 100%; border-radius: 8px; cursor: pointer;" />
            </div>
            
            <!-- Modal for the image -->
            <div id="image-modal" class="modal">
                <span class="close-btn">&times;</span>
                <img class="modal-content" id="modal-image">
            </div>

            <div class="citation">
                <h4>Source:</h4>
                <p>Knight, S. R., et al. (2020). Risk stratification of patients admitted to hospital with covid-19 using the ISARIC WHO Clinical Characterisation Protocol: development and validation of the 4C Mortality Score. <em>BMJ</em>, 370, m3339. <a href="https://doi.org/10.1136/bmj.m3339" target="_blank">doi:10.1136/bmj.m3339</a>.</p>
            </div>

        `;
    },

    createRow: function (id, label, options, type) {
        let optionsHTML = '';
        if (type === 'vertical-radio-group') {
            optionsHTML = options
                .map(
                    (opt, index) =>
                        `<button data-value="${opt.value}" class="ciwa-ar-option ${index === 0 ? 'active' : ''}"><span>${opt.text}</span><span class="ciwa-ar-score">${opt.points}</span></button>`
                )
                .join('');
        } else {
            // segmented-control
            optionsHTML = options
                .map(
                    (opt, index) =>
                        `<button data-value="${opt.value}" class="${index === 0 ? 'active' : ''}">${opt.text} <strong>${opt.points}</strong></button>`
                )
                .join('');
        }

        return `
            <div class="input-row-new">
                <div class="input-label-new">
                    ${label}
                </div>
                <div class="input-control-new">
                    <div class="${type}" data-name="${id}">
                        ${optionsHTML}
                    </div>
                </div>
            </div>
        `;
    },

    initialize: async function (client) {
        // Helper function to select the correct button based on a value
        const selectButtonByValue = (groupName, value) => {
            const group = document.querySelector(`[data-name="${groupName}"]`);
            if (!group) {
                return;
            }

            const buttons = group.querySelectorAll('button');
            let selectedButton = null;

            // Specific logic for each group
            if (groupName === 'age') {
                if (value < 50) {
                    selectedButton = buttons[0];
                } else if (value <= 59) {
                    selectedButton = buttons[1];
                } else if (value <= 69) {
                    selectedButton = buttons[2];
                } else if (value <= 79) {
                    selectedButton = buttons[3];
                } else {
                    selectedButton = buttons[4];
                }
            } else if (groupName === 'sex') {
                if (value === 'female') {
                    selectedButton = buttons[0];
                } else if (value === 'male') {
                    selectedButton = buttons[1];
                }
            } else if (groupName === 'comorbidities') {
                if (value === 0) {
                    selectedButton = buttons[0];
                } else if (value === 1) {
                    selectedButton = buttons[1];
                } else {
                    selectedButton = buttons[2];
                }
            } else if (groupName === 'resp_rate') {
                if (value < 20) {
                    selectedButton = buttons[0];
                } else if (value <= 29) {
                    selectedButton = buttons[1];
                } else {
                    selectedButton = buttons[2];
                }
            } else if (groupName === 'oxygen_sat') {
                if (value >= 92) {
                    selectedButton = buttons[0];
                } else {
                    selectedButton = buttons[1];
                }
            } else if (groupName === 'gcs') {
                if (value === 15) {
                    selectedButton = buttons[0];
                } else {
                    selectedButton = buttons[1];
                }
            } else if (groupName === 'urea') {
                // Assuming value is in mmol/L
                if (value < 7) {
                    selectedButton = buttons[0];
                } else if (value < 14) {
                    selectedButton = buttons[1];
                } else {
                    selectedButton = buttons[2];
                }
            } else if (groupName === 'crp') {
                // Assuming value is in mg/L
                if (value < 50) {
                    selectedButton = buttons[0];
                } else if (value < 100) {
                    selectedButton = buttons[1];
                } else {
                    selectedButton = buttons[2];
                }
            }

            if (selectedButton) {
                buttons.forEach(btn => btn.classList.remove('active'));
                selectedButton.classList.add('active');
            }
        };

        const calculate = () => {
            let score = 0;
            document.querySelectorAll('[data-name]').forEach(group => {
                const selected = group.querySelector('.active');
                if (selected) {
                    score += parseInt(selected.dataset.value);
                }
            });

            const riskTiers = [
                { scoreRange: [0, 3], risk: 'Low', mortality: '1.2-1.7%' },
                { scoreRange: [4, 8], risk: 'Intermediate', mortality: '9.1-9.9%' },
                { scoreRange: [9, 14], risk: 'High', mortality: '31.4-34.9%' },
                { scoreRange: [15, 21], risk: 'Very High', mortality: '61.5-66.2%' }
            ];

            let result = riskTiers[riskTiers.length - 1]; // Default to highest risk
            for (const tier of riskTiers) {
                if (score >= tier.scoreRange[0] && score <= tier.scoreRange[1]) {
                    result = tier;
                    break;
                }
            }

            document.getElementById('four-c-score').textContent = score;
            document.getElementById('four-c-risk').textContent = result.risk;
            document.getElementById('four-c-mortality').textContent = result.mortality;
        };

        document.querySelectorAll('.vertical-radio-group, .segmented-control').forEach(group => {
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

        // Image Modal Logic
        const modal = document.getElementById('image-modal');
        const imgThumb = document.getElementById('ref-image-thumb');
        const modalImg = document.getElementById('modal-image');
        const closeBtn = document.querySelector('.close-btn');

        imgThumb.onclick = function () {
            modal.style.display = 'block';
            modalImg.src = this.src;
        };

        closeBtn.onclick = function () {
            modal.style.display = 'none';
        };

        window.onclick = function (event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };

        // Auto-populate data from FHIR
        try {
            const patient = await getPatient(client);
            if (patient) {
                if (patient.age) {
                    selectButtonByValue('age', patient.age);
                }
                if (patient.gender) {
                    selectButtonByValue('sex', patient.gender);
                }
            }

            const comorbidityCodes = [
                '44054006', // Diabetes
                '414545008', // Ischemic heart disease
                '84114007', // Heart failure
                '13645005', // COPD
                '709044004', // CKD stage 4
                '431855005', // CKD stage 5
                '111394008', // Chronic liver disease
                '52448006', // Dementia
                '363406005' // Malignancy
            ];
            // This needs to be implemented in utils.js if not present
            // const conditions = await getPatientConditions(client, comorbidityCodes);
            // if(conditions && conditions.length) {
            //     selectButtonByValue('comorbidities', Math.min(conditions.length, 2));
            // }

            const observations = await Promise.all([
                getMostRecentObservation(client, '9279-1'), // Resp rate
                getMostRecentObservation(client, '59408-5'), // O2 sat on room air
                getMostRecentObservation(client, '9269-2'), // GCS
                getMostRecentObservation(client, '3094-0'), // Urea (mmol/L)
                getMostRecentObservation(client, '1988-5') // CRP (mg/L)
            ]);

            if (observations[0]) {
                selectButtonByValue('resp_rate', observations[0].value);
            }
            if (observations[1]) {
                selectButtonByValue('oxygen_sat', observations[1].value);
            }
            if (observations[2]) {
                selectButtonByValue('gcs', observations[2].value);
            }
            if (observations[3]) {
                selectButtonByValue('urea', observations[3].value);
            }
            if (observations[4]) {
                selectButtonByValue('crp', observations[4].value);
            }
        } catch (error) {
            console.error('Error fetching data for 4C score:', error);
        } finally {
            calculate(); // Calculate score after attempting to fetch data
        }
    }
};
