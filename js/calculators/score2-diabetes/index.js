import { getMostRecentObservation, calculateAge } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';

// Coefficients and baseline survival data from the official SCORE2-Diabetes calculator
const score2DiabetesData = {
    low: {
        male: {
            age: 0.0652,
            sbp: 0.0139,
            tchol: 0.2079,
            hdl: -0.4485,
            hba1c: 0.0211,
            egfr: -0.0076,
            smoking: 0.3838,
            s010: 0.9765,
            mean_x: 4.9664
        },
        female: {
            age: 0.0768,
            sbp: 0.0152,
            tchol: 0.147,
            hdl: -0.5659,
            hba1c: 0.0232,
            egfr: -0.0084,
            smoking: 0.5422,
            s010: 0.9859,
            mean_x: 5.215
        }
    },
    moderate: {
        male: {
            age: 0.0652,
            sbp: 0.0139,
            tchol: 0.2079,
            hdl: -0.4485,
            hba1c: 0.0211,
            egfr: -0.0076,
            smoking: 0.3838,
            s010: 0.9626,
            mean_x: 4.9664
        },
        female: {
            age: 0.0768,
            sbp: 0.0152,
            tchol: 0.147,
            hdl: -0.5659,
            hba1c: 0.0232,
            egfr: -0.0084,
            smoking: 0.5422,
            s010: 0.9782,
            mean_x: 5.215
        }
    },
    high: {
        male: {
            age: 0.0652,
            sbp: 0.0139,
            tchol: 0.2079,
            hdl: -0.4485,
            hba1c: 0.0211,
            egfr: -0.0076,
            smoking: 0.3838,
            s010: 0.9388,
            mean_x: 4.9664
        },
        female: {
            age: 0.0768,
            sbp: 0.0152,
            tchol: 0.147,
            hdl: -0.5659,
            hba1c: 0.0232,
            egfr: -0.0084,
            smoking: 0.5422,
            s010: 0.9661,
            mean_x: 5.215
        }
    },
    very_high: {
        male: {
            age: 0.0652,
            sbp: 0.0139,
            tchol: 0.2079,
            hdl: -0.4485,
            hba1c: 0.0211,
            egfr: -0.0076,
            smoking: 0.3838,
            s010: 0.9038,
            mean_x: 4.9664
        },
        female: {
            age: 0.0768,
            sbp: 0.0152,
            tchol: 0.147,
            hdl: -0.5659,
            hba1c: 0.0232,
            egfr: -0.0084,
            smoking: 0.5422,
            s010: 0.9472,
            mean_x: 5.215
        }
    }
};

export const score2Diabetes = {
    id: 'score2-diabetes',
    title: 'Systematic Coronary Risk Evaluation 2-Diabetes (SCORE2-Diabetes)',
    description: 'Predicts 10-year CVD risk in patients with type 2 diabetes.',
    generateHTML: function () {
        return `
            <div class="score2-diabetes-container">
                <div class="calculator-header">
                    <div class="header-icon">🫀</div>
                    <div class="header-content">
                        <h2 class="calculator-title">${this.title}</h2>
                        <p class="calculator-description">${this.description}</p>
                    </div>
                </div>

                <div class="patient-demographics">
                    <h4>👤 Patient Demographics</h4>
                    <div class="demographics-grid">
                        <div class="demo-item">
                            <label>Age:</label>
                            <span id="patient-age">Loading...</span>
                        </div>
                        <div class="demo-item">
                            <label>Gender:</label>
                            <span id="patient-gender">Loading...</span>
                        </div>
                        <div class="demo-item">
                            <label>Diabetes Status:</label>
                            <span id="patient-diabetes">Type 2 Diabetes</span>
                        </div>
                    </div>
                </div>

                <div class="instructions-notice">
                    <div class="notice-icon">ℹ️</div>
                    <div class="notice-content">
                        <h5>Instructions</h5>
                        <p>This calculator predicts 10-year cardiovascular disease risk in European patients under 70 years of age with type 2 diabetes. Please verify all auto-populated values and select the appropriate risk region.</p>
                    </div>
                </div>

                <div class="input-sections">
                    <!-- Demographics Section -->
                    <div class="input-section">
                        <h4 class="section-title">
                            <span class="section-icon">👤</span>
                            Demographics
                        </h4>
                        <div class="input-grid">
                            <div class="input-card">
                                <label class="input-label">Gender</label>
                                <div class="score2-toggle-group">
                                    <label class="toggle-option">
                                        <input type="radio" name="sex" value="male">
                                        <span class="toggle-text">
                                            <i class="gender-icon">♂️</i>
                                            Male
                                        </span>
                                    </label>
                                    <label class="toggle-option">
                                        <input type="radio" name="sex" value="female">
                                        <span class="toggle-text">
                                            <i class="gender-icon">♀️</i>
                                            Female
                                        </span>
                                    </label>
                                </div>
                            </div>

                            <div class="input-card">
                                <label class="input-label" for="score2d-age">Age (years)</label>
                                <div class="input-wrapper">
                                    <input type="number" id="score2d-age" class="modern-input" min="40" max="69" placeholder="40-69">
                                    <span class="input-unit">years</span>
                                </div>
                                <div class="input-note">Valid range: 40-69 years</div>
                            </div>

                            <div class="input-card">
                                <label class="input-label">Smoking Status</label>
                                <div class="score2-toggle-group">
                                    <label class="toggle-option">
                                        <input type="radio" name="smoking" value="0">
                                        <span class="toggle-text">
                                            <i class="smoking-icon">🚭</i>
                                            Non-smoker
                                        </span>
                                    </label>
                                    <label class="toggle-option">
                                        <input type="radio" name="smoking" value="1">
                                        <span class="toggle-text">
                                            <i class="smoking-icon">🚬</i>
                                            Current
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Clinical Parameters Section -->
                    <div class="input-section">
                        <h4 class="section-title">
                            <span class="section-icon">🩺</span>
                            Clinical Parameters
                        </h4>
                        <div class="input-grid">
                            <div class="input-card">
                                <label class="input-label" for="score2d-sbp">Systolic Blood Pressure</label>
                                <div class="input-wrapper">
                                    <input type="number" id="score2d-sbp" class="modern-input" placeholder="Enter value">
                                    <span class="input-unit">mmHg</span>
                                </div>
                                <div class="input-note">Normal: 100-120 mmHg</div>
                            </div>

                            <div class="input-card">
                                <label class="input-label" for="score2d-egfr">Estimated GFR</label>
                                <div class="input-wrapper">
                                    <input type="number" id="score2d-egfr" class="modern-input" placeholder="Enter value">
                                    <span class="input-unit">mL/min/1.73m²</span>
                                </div>
                                <div class="input-note">Normal: >90 mL/min/1.73m²</div>
                            </div>
                        </div>
                    </div>

                    <!-- Laboratory Values Section -->
                    <div class="input-section">
                        <h4 class="section-title">
                            <span class="section-icon">🧪</span>
                            Laboratory Values
                        </h4>
                        <div class="input-grid">
                            <div class="input-card">
                                <label class="input-label" for="score2d-tchol">Total Cholesterol</label>
                                <div class="input-wrapper">
                                    <input type="number" id="score2d-tchol" class="modern-input" placeholder="Enter value">
                                    <span class="input-unit">mg/dL</span>
                                </div>
                                <div class="input-note">Desirable: <200 mg/dL</div>
                            </div>

                            <div class="input-card">
                                <label class="input-label" for="score2d-hdl">HDL Cholesterol</label>
                                <div class="input-wrapper">
                                    <input type="number" id="score2d-hdl" class="modern-input" placeholder="Enter value">
                                    <span class="input-unit">mg/dL</span>
                                </div>
                                <div class="input-note">Target: >40 (M), >50 (F) mg/dL</div>
                            </div>

                            <div class="input-card">
                                <label class="input-label" for="score2d-hba1c">HbA1c</label>
                                <div class="input-wrapper">
                                    <input type="number" id="score2d-hba1c" class="modern-input" step="0.1" placeholder="Enter value">
                                    <span class="input-unit">%</span>
                                </div>
                                <div class="input-note">Target: <7.0% for most patients</div>
                            </div>
                        </div>
                    </div>

                    <!-- Risk Region Section -->
                    <div class="input-section">
                        <h4 class="section-title">
                            <span class="section-icon">🌍</span>
                            Geographic Risk Region
                        </h4>
                        <div class="region-selector">
                            <div class="region-grid">
                                <label class="region-option low-risk">
                                    <input type="radio" name="region" value="low">
                                    <div class="region-content">
                                        <div class="region-icon">🟢</div>
                                        <div class="region-info">
                                            <div class="region-title">Low Risk</div>
                                            <div class="region-description">Belgium, France, Greece, Italy, Luxembourg, Spain, Switzerland, Portugal</div>
                                        </div>
                                    </div>
                                </label>

                                <label class="region-option moderate-risk">
                                    <input type="radio" name="region" value="moderate">
                                    <div class="region-content">
                                        <div class="region-icon">🟡</div>
                                        <div class="region-info">
                                            <div class="region-title">Moderate Risk</div>
                                            <div class="region-description">Austria, Denmark, Finland, Germany, Iceland, Ireland, Israel, Netherlands, Norway, Sweden, UK</div>
                                        </div>
                                    </div>
                                </label>

                                <label class="region-option high-risk">
                                    <input type="radio" name="region" value="high">
                                    <div class="region-content">
                                        <div class="region-icon">🟠</div>
                                        <div class="region-info">
                                            <div class="region-title">High Risk</div>
                                            <div class="region-description">Czech Republic, Estonia, Hungary, Poland, Slovenia, Slovakia</div>
                                        </div>
                                    </div>
                                </label>

                                <label class="region-option very-high-risk">
                                    <input type="radio" name="region" value="very_high">
                                    <div class="region-content">
                                        <div class="region-icon">🔴</div>
                                        <div class="region-info">
                                            <div class="region-title">Very High Risk</div>
                                            <div class="region-description">Bosnia and Herzegovina, Bulgaria, Croatia, Latvia, Lithuania, North Macedonia, Romania, Serbia, Turkey</div>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Results Section -->
                <div id="score2-diabetes-result" class="results-section">
                    <div class="results-header">
                        <h4>📊 10-Year CVD Risk Assessment</h4>
                    </div>
                    <div class="results-content">
                        <div class="result-main">
                            <div class="result-value-container">
                                <div class="result-percentage" id="risk-percentage">-</div>
                                <div class="result-label">10-year CVD risk</div>
                            </div>
                            <div class="result-interpretation" id="risk-interpretation">
                                Please complete all fields to calculate risk
                            </div>
                        </div>
                        
                        <div class="risk-stratification" id="risk-stratification" style="display: none;">
                            <h5>🎯 Risk Stratification & Management</h5>
                            <div class="risk-categories">
                                <div class="risk-category" data-risk="low">
                                    <div class="category-header">
                                        <span class="category-color low"></span>
                                        <span class="category-title">Low Risk (&lt;5%)</span>
                                    </div>
                                    <div class="category-management">Lifestyle modifications, reassess in 5 years</div>
                                </div>
                                <div class="risk-category" data-risk="moderate">
                                    <div class="category-header">
                                        <span class="category-color moderate"></span>
                                        <span class="category-title">Moderate Risk (5-10%)</span>
                                    </div>
                                    <div class="category-management">Consider statin therapy, lifestyle modifications</div>
                                </div>
                                <div class="risk-category" data-risk="high">
                                    <div class="category-header">
                                        <span class="category-color high"></span>
                                        <span class="category-title">High Risk (10-20%)</span>
                                    </div>
                                    <div class="category-management">Statin therapy recommended, intensive lifestyle modifications</div>
                                </div>
                                <div class="risk-category" data-risk="very-high">
                                    <div class="category-header">
                                        <span class="category-color very-high"></span>
                                        <span class="category-title">Very High Risk (&gt;20%)</span>
                                    </div>
                                    <div class="category-management">High-intensity statin, consider combination therapy</div>
                                </div>
                            </div>
                        </div>

                        <div class="clinical-notes">
                            <h5>⚠️ Important Clinical Notes</h5>
                            <ul>
                                <li><strong>Age Limitation:</strong> This calculator is validated for patients aged 40-69 years with type 2 diabetes</li>
                                <li><strong>Geographic Specificity:</strong> Risk coefficients are based on European populations</li>
                                <li><strong>Diabetes Duration:</strong> Consider diabetes duration and complications in clinical decision-making</li>
                                <li><strong>Additional Risk Factors:</strong> Family history, ethnicity, and other risk enhancers should be considered</li>
                                <li><strong>Regular Reassessment:</strong> Risk should be reassessed periodically, especially after treatment changes</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        const fields = {
            get sex() {
                return container.querySelector('input[name="sex"]:checked');
            },
            age: container.querySelector('#score2d-age'),
            get smoking() {
                return container.querySelector('input[name="smoking"]:checked');
            },
            sbp: container.querySelector('#score2d-sbp'),
            tchol: container.querySelector('#score2d-tchol'),
            hdl: container.querySelector('#score2d-hdl'),
            hba1c: container.querySelector('#score2d-hba1c'),
            egfr: container.querySelector('#score2d-egfr'),
            get region() {
                return container.querySelector('input[name="region"]:checked');
            }
        };

        // Auto-populate patient demographics display
        let patientAge = null;
        if (patient && patient.birthDate) {
            patientAge = calculateAge(patient.birthDate);
            container.querySelector('#patient-age').textContent = `${patientAge} years`;
        }
        
        let patientGender = null;
        if (patient && patient.gender) {
            patientGender = patient.gender;
            container.querySelector('#patient-gender').textContent =
                patient.gender === 'male' ? 'Male' : 'Female';
        }

        const calculate = () => {
            const riskPercentageEl = container.querySelector('#risk-percentage');
            const riskInterpretationEl = container.querySelector('#risk-interpretation');
            const riskStratificationEl = container.querySelector('#risk-stratification');

            // Check which fields are missing
            const missingFields = [];
            if (!fields.sex) {
                missingFields.push('Gender');
            }
            if (!fields.age.value) {
                missingFields.push('Age');
            }
            if (!fields.smoking) {
                missingFields.push('Smoking Status');
            }
            if (!fields.sbp.value) {
                missingFields.push('Systolic Blood Pressure');
            }
            if (!fields.egfr.value) {
                missingFields.push('eGFR');
            }
            if (!fields.tchol.value) {
                missingFields.push('Total Cholesterol');
            }
            if (!fields.hdl.value) {
                missingFields.push('HDL Cholesterol');
            }
            if (!fields.hba1c.value) {
                missingFields.push('HbA1c');
            }
            if (!fields.region) {
                missingFields.push('Geographic Risk Region');
            }

            // Debug logging
            console.log('SCORE2-Diabetes Calculation Debug:', {
                sex: fields.sex?.value,
                age: fields.age.value,
                smoking: fields.smoking?.value,
                sbp: fields.sbp.value,
                egfr: fields.egfr.value,
                tchol: fields.tchol.value,
                hdl: fields.hdl.value,
                hba1c: fields.hba1c.value,
                region: fields.region?.value,
                missingFields: missingFields
            });

            if (missingFields.length > 0) {
                riskPercentageEl.textContent = '-';
                riskInterpretationEl.innerHTML = `
                    <div class="missing-fields-warning">
                        <strong>⚠️ Missing Required Fields:</strong>
                        <ul style="margin: 10px 0 0 20px; text-align: left;">
                            ${missingFields.map(field => `<li>${field}</li>`).join('')}
                        </ul>
                    </div>
                `;
                riskStratificationEl.style.display = 'none';
                return;
            }

            const region = fields.region.value;
            const sex = fields.sex.value;
            const age = parseFloat(fields.age.value);

            // Age validation
            if (age < 40 || age > 69) {
                riskPercentageEl.textContent = 'N/A';
                riskInterpretationEl.innerHTML = `
                    <div class="age-warning">
                        ⚠️ Age limitation: This calculator is validated for ages 40-69 years.<br>
                        Current age: ${age} years
                    </div>
                `;
                riskStratificationEl.style.display = 'none';
                return;
            }

            const coeffs = score2DiabetesData[region][sex];

            // Convert units for calculation
            const tchol_mmol = parseFloat(fields.tchol.value) / 38.67;
            const hdl_mmol = parseFloat(fields.hdl.value) / 38.67;
            const hba1c_mmol = parseFloat(fields.hba1c.value) * 10.93 - 23.5;

            const ind_x =
                coeffs.age * age +
                coeffs.sbp * parseFloat(fields.sbp.value) +
                coeffs.tchol * tchol_mmol +
                coeffs.hdl * hdl_mmol +
                coeffs.hba1c * hba1c_mmol +
                coeffs.egfr * parseFloat(fields.egfr.value) +
                coeffs.smoking * parseFloat(fields.smoking.value);

            const risk = 100 * (1 - Math.pow(coeffs.s010, Math.exp(ind_x - coeffs.mean_x)));

            // Update result display
            riskPercentageEl.textContent = `${risk.toFixed(1)}%`;

            // Determine risk category and interpretation
            let riskCategory, riskClass, interpretation;
            if (risk < 5) {
                riskCategory = 'low';
                riskClass = 'low-risk';
                interpretation =
                    'Low cardiovascular risk - Focus on lifestyle modifications and reassess in 5 years';
            } else if (risk < 10) {
                riskCategory = 'moderate';
                riskClass = 'moderate-risk';
                interpretation =
                    'Moderate cardiovascular risk - Consider statin therapy and intensive lifestyle modifications';
            } else if (risk < 20) {
                riskCategory = 'high';
                riskClass = 'high-risk';
                interpretation =
                    'High cardiovascular risk - Statin therapy recommended with intensive lifestyle modifications';
            } else {
                riskCategory = 'very-high';
                riskClass = 'very-high-risk';
                interpretation =
                    'Very high cardiovascular risk - High-intensity statin therapy and consider combination therapy';
            }

            riskPercentageEl.className = `result-percentage ${riskClass}`;
            riskInterpretationEl.innerHTML = `
                <div class="risk-badge ${riskClass}">
                    ${riskCategory.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Risk
                </div>
                <div class="interpretation-text">${interpretation}</div>
            `;

            // Show and highlight risk stratification
            riskStratificationEl.style.display = 'block';
            container.querySelectorAll('.risk-category').forEach(cat => {
                cat.classList.remove('active');
            });
            const activeCategory = container.querySelector(`[data-risk="${riskCategory}"]`);
            if (activeCategory) {
                activeCategory.classList.add('active');
            }
        };

        // Auto-populate form fields
        if (patientAge !== null) {
            fields.age.value = patientAge;
        }

        if (patientGender) {
            const genderRadio = container.querySelector(`input[name="sex"][value="${patientGender}"]`);
            if (genderRadio) {
                genderRadio.checked = true;
                this.updateToggleState(genderRadio);
            }
        }

        // Auto-populate lab values
        getMostRecentObservation(client, LOINC_CODES.SYSTOLIC_BP)
            .then(obs => {
                if (obs && obs.valueQuantity) {
                    fields.sbp.value = obs.valueQuantity.value.toFixed(0);
                    fields.sbp.placeholder = '';
                } else {
                    fields.sbp.placeholder = 'Not available';
                }
                calculate();
            })
            .catch(error => {
                console.error('Error fetching SBP:', error);
                fields.sbp.placeholder = 'Not available';
            });

        getMostRecentObservation(client, LOINC_CODES.CHOLESTEROL_TOTAL)
            .then(obs => {
                if (obs && obs.valueQuantity) {
                    fields.tchol.value = obs.valueQuantity.value.toFixed(0);
                    fields.tchol.placeholder = '';
                } else {
                    fields.tchol.placeholder = 'Not available';
                }
                calculate();
            })
            .catch(error => {
                console.error('Error fetching Total Cholesterol:', error);
                fields.tchol.placeholder = 'Not available';
            });

        getMostRecentObservation(client, LOINC_CODES.HDL)
            .then(obs => {
                if (obs && obs.valueQuantity) {
                    fields.hdl.value = obs.valueQuantity.value.toFixed(0);
                    fields.hdl.placeholder = '';
                } else {
                    fields.hdl.placeholder = 'Not available';
                }
                calculate();
            })
            .catch(error => {
                console.error('Error fetching HDL:', error);
                fields.hdl.placeholder = 'Not available';
            });

        getMostRecentObservation(client, LOINC_CODES.HBA1C)
            .then(obs => {
                if (obs && obs.valueQuantity) {
                    fields.hba1c.value = obs.valueQuantity.value.toFixed(1);
                    fields.hba1c.placeholder = '';
                } else {
                    fields.hba1c.placeholder = 'Not available';
                }
                calculate();
            })
            .catch(error => {
                console.error('Error fetching HbA1c:', error);
                fields.hba1c.placeholder = 'Not available';
            });

        getMostRecentObservation(client, LOINC_CODES.EGFR)
            .then(obs => {
                if (obs && obs.valueQuantity) {
                    fields.egfr.value = obs.valueQuantity.value.toFixed(0);
                    fields.egfr.placeholder = '';
                } else {
                    fields.egfr.placeholder = 'Not available';
                }
                calculate();
            })
            .catch(error => {
                console.error('Error fetching eGFR:', error);
                fields.egfr.placeholder = 'Not available';
            });

        // Smoking status
        getMostRecentObservation(client, LOINC_CODES.SMOKING_STATUS)
            .then(obs => {
                if (obs && obs.valueCodeableConcept) {
                    const smokingCode = obs.valueCodeableConcept.coding[0].code;
                    const isSmoker = smokingCode === '449868002';
                    const smokingRadio = container.querySelector(
                        `input[name="smoking"][value="${isSmoker ? 1 : 0}"]`
                    );
                    if (smokingRadio) {
                        smokingRadio.checked = true;
                        this.updateToggleState(smokingRadio);
                    }
                }
                calculate();
            })
            .catch(error => {
                console.error('Error fetching smoking status:', error);
            });

        // Event listeners
        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', () => {
                if (input.type === 'radio') {
                    this.updateToggleState(input);
                }
                calculate();
            });

            if (input.type === 'number') {
                input.addEventListener('input', calculate);
            }
        });

        // Initial calculation
        setTimeout(calculate, 500);
    },

    updateToggleState: function (selectedInput) {
        const group = selectedInput.closest('.score2-toggle-group, .region-selector');
        if (group) {
            group.querySelectorAll('.toggle-option, .region-option').forEach(option => {
                option.classList.remove('active');
            });
            selectedInput.closest('.toggle-option, .region-option').classList.add('active');
        }
    }
};
