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

            <!-- 使用統一樣式的提示訊息 -->
            <div class="alert info">
                <span class="alert-icon">ℹ️</span>
                <div class="alert-content">
                    <div class="alert-title">INSTRUCTIONS</div>
                    <p>Use with admitted patients diagnosed with COVID-19.</p>
                </div>
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
            
            <!-- 共病症說明 -->
            <div class="alert warning mt-20">
                <span class="alert-icon">📋</span>
                <div class="alert-content">
                    <div class="alert-title">Comorbidities Definition</div>
                    <p><small>*Comorbidities include chronic cardiac disease, chronic respiratory disease (excluding asthma), chronic renal disease (estimated glomerular filtration rate ≤30), mild to severe liver disease, dementia, chronic neurological conditions, connective tissue disease, diabetes mellitus (diet, tablet, or insulin controlled), HIV or AIDS, and malignancy.</small></p>
                </div>
            </div>
            
            <!-- 使用統一樣式的結果顯示 -->
            <div class="result-container show mt-30">
                <div class="result-header">
                    <h4>4C Mortality Score Results</h4>
                </div>
                
                <div class="result-score">
                    <span class="result-score-value" id="four-c-score">0</span>
                    <span class="result-score-unit">points</span>
                </div>
                
                <div class="result-item">
                    <span class="result-item-label">Risk Group</span>
                    <span class="result-item-value" id="four-c-risk">Low</span>
                </div>
                
                <div class="result-item">
                    <span class="result-item-label">In-Hospital Mortality</span>
                    <span class="result-item-value" id="four-c-mortality">1.2-1.7%</span>
                </div>
            </div>

            <!-- 參考圖表 -->
            <div class="chart-container mt-30">
                <h4 class="text-center mb-15">Reference Table</h4>
                <img id="ref-image-thumb" 
                     src="js/calculators/4c-mortality-covid/p652-t2.gif" 
                     alt="4C Score Reference Table" 
                     class="reference-image" />
            </div>
            
            <!-- Modal for the image -->
            <div id="image-modal" class="modal">
                <span class="close-btn">&times;</span>
                <img class="modal-content" id="modal-image">
            </div>

            <!-- 文獻引用 -->
            <div class="info-section mt-30">
                <h4>📚 Source</h4>
                <p>Knight, S. R., et al. (2020). Risk stratification of patients admitted to hospital with covid-19 using the ISARIC WHO Clinical Characterisation Protocol: development and validation of the 4C Mortality Score. <em>BMJ</em>, 370, m3339. <a href="https://doi.org/10.1136/bmj.m3339" target="_blank">doi:10.1136/bmj.m3339</a>.</p>
            </div>
        `;
    },

    createRow: function (id, label, options, type) {
        // 統一使用 radio-option 樣式（垂直列表）
        const optionsHTML = options
            .map(
                (opt, index) => `
            <label class="radio-option">
                <input type="radio" name="${id}" value="${opt.value}" ${index === 0 ? 'checked' : ''}>
                <span>${opt.text} <strong>${opt.points}</strong></span>
            </label>
        `
            )
            .join('');

        return `
            <div class="section">
                <div class="section-title">
                    <span>${label}</span>
                </div>
                <div class="radio-group">
                    ${optionsHTML}
                </div>
            </div>
        `;
    },

    initialize: async function (client) {
        const container = document.querySelector('#calculator-container') || document.body;

        // Add visual feedback for radio button selection (統一樣式)
        const radioOptions = container.querySelectorAll('.radio-option');
        radioOptions.forEach(option => {
            option.addEventListener('click', function () {
                const radio = this.querySelector('input[type="radio"]');
                const group = radio.name;

                // Remove selected class from all options in this group
                container.querySelectorAll(`input[name="${group}"]`).forEach(r => {
                    r.parentElement.classList.remove('selected');
                });

                // Add selected class to clicked option
                this.classList.add('selected');
                radio.checked = true;

                // Recalculate
                calculate();
            });
        });

        // Initialize selected state
        radioOptions.forEach(option => {
            const radio = option.querySelector('input[type="radio"]');
            if (radio.checked) {
                option.classList.add('selected');
            }
        });

        // Helper function to select the correct radio based on a value
        const selectRadioByValue = (groupName, value) => {
            const radios = container.querySelectorAll(`input[name="${groupName}"]`);
            let selectedRadio = null;

            // Specific logic for each group
            if (groupName === 'age') {
                if (value < 50) {
                    selectedRadio = radios[0];
                } else if (value <= 59) {
                    selectedRadio = radios[1];
                } else if (value <= 69) {
                    selectedRadio = radios[2];
                } else if (value <= 79) {
                    selectedRadio = radios[3];
                } else {
                    selectedRadio = radios[4];
                }
            } else if (groupName === 'sex') {
                if (value === 'female') {
                    selectedRadio = radios[0];
                } else if (value === 'male') {
                    selectedRadio = radios[1];
                }
            } else if (groupName === 'comorbidities') {
                if (value === 0) {
                    selectedRadio = radios[0];
                } else if (value === 1) {
                    selectedRadio = radios[1];
                } else {
                    selectedRadio = radios[2];
                }
            } else if (groupName === 'resp_rate') {
                if (value < 20) {
                    selectedRadio = radios[0];
                } else if (value <= 29) {
                    selectedRadio = radios[1];
                } else {
                    selectedRadio = radios[2];
                }
            } else if (groupName === 'oxygen_sat') {
                if (value >= 92) {
                    selectedRadio = radios[0];
                } else {
                    selectedRadio = radios[1];
                }
            } else if (groupName === 'gcs') {
                if (value === 15) {
                    selectedRadio = radios[0];
                } else {
                    selectedRadio = radios[1];
                }
            } else if (groupName === 'urea') {
                if (value < 7) {
                    selectedRadio = radios[0];
                } else if (value < 14) {
                    selectedRadio = radios[1];
                } else {
                    selectedRadio = radios[2];
                }
            } else if (groupName === 'crp') {
                if (value < 50) {
                    selectedRadio = radios[0];
                } else if (value < 100) {
                    selectedRadio = radios[1];
                } else {
                    selectedRadio = radios[2];
                }
            }

            if (selectedRadio) {
                selectedRadio.checked = true;
                selectedRadio.parentElement.classList.add('selected');
            }
        };

        const calculate = () => {
            let score = 0;

            // Get all radio groups
            const radioGroups = [
                'age',
                'sex',
                'comorbidities',
                'resp_rate',
                'oxygen_sat',
                'gcs',
                'urea',
                'crp'
            ];
            radioGroups.forEach(group => {
                const selected = container.querySelector(`input[name="${group}"]:checked`);
                if (selected) {
                    score += parseInt(selected.value);
                }
            });

            const riskTiers = [
                { scoreRange: [0, 3], risk: 'Low', mortality: '1.2-1.7%' },
                { scoreRange: [4, 8], risk: 'Intermediate', mortality: '9.1-9.9%' },
                { scoreRange: [9, 14], risk: 'High', mortality: '31.4-34.9%' },
                { scoreRange: [15, 21], risk: 'Very High', mortality: '61.5-66.2%' }
            ];

            let result = riskTiers[riskTiers.length - 1];
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
                    selectRadioByValue('age', patient.age);
                }
                if (patient.gender) {
                    selectRadioByValue('sex', patient.gender);
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
            //     selectRadioByValue('comorbidities', Math.min(conditions.length, 2));
            // }

            const observations = await Promise.all([
                getMostRecentObservation(client, '9279-1'), // Resp rate
                getMostRecentObservation(client, '59408-5'), // O2 sat on room air
                getMostRecentObservation(client, '9269-2'), // GCS
                getMostRecentObservation(client, '3094-0'), // Urea (mmol/L)
                getMostRecentObservation(client, '1988-5') // CRP (mg/L)
            ]);

            if (observations[0]?.valueQuantity) {
                selectRadioByValue('resp_rate', observations[0].valueQuantity.value);
            }
            if (observations[1]?.valueQuantity) {
                selectRadioByValue('oxygen_sat', observations[1].valueQuantity.value);
            }
            if (observations[2]?.valueQuantity) {
                selectRadioByValue('gcs', observations[2].valueQuantity.value);
            }
            if (observations[3]?.valueQuantity) {
                selectRadioByValue('urea', observations[3].valueQuantity.value);
            }
            if (observations[4]?.valueQuantity) {
                selectRadioByValue('crp', observations[4].valueQuantity.value);
            }
        } catch (error) {
            console.error('Error fetching data for 4C score:', error);
        } finally {
            calculate(); // Calculate score after attempting to fetch data
        }
    }
};
