// js/calculators/ckd-epi.js
import {
    getMostRecentObservation,
    calculateAge,
    createUnitSelector,
    initializeUnitConversion,
    getValueInStandardUnit
} from '../../utils.js';
import { FHIRDataError, ValidationError, logError, displayError } from '../../errorHandler.js';
import { ValidationRules, validateCalculatorInput } from '../../validator.js';

export const ckdEpi = {
    id: 'ckd-epi',
    title: 'CKD-EPI GFR (2021 Refit)',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">Estimates GFR using the CKD-EPI 2021 race-free equation, the recommended method for assessing kidney function.</p>
            </div>
            
            <div class="section">
                <div class="section-title">
                    <span>Patient Information</span>
                </div>
                
                <div class="section-subtitle">Gender</div>
                <div class="radio-group">
                    <label class="radio-option">
                        <input type="radio" name="ckd-epi-gender" value="male" checked>
                        <span>Male</span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="ckd-epi-gender" value="female">
                        <span>Female</span>
                    </label>
                </div>
                
                <div class="input-row mt-15">
                    <label for="ckd-epi-age">Age</label>
                    <div class="input-with-unit">
                        <input type="number" id="ckd-epi-age" placeholder="loading...">
                        <span>years</span>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">
                    <span>Lab Values</span>
                </div>
                <div class="input-group">
                    <label for="ckd-epi-creatinine">Serum Creatinine:</label>
                    ${createUnitSelector('ckd-epi-creatinine', 'creatinine', ['mg/dL', 'µmol/L'], 'mg/dL')}
                </div>
            </div>
            
            <div class="result-container" id="ckd-epi-result" style="display:none;"></div>
            <div class="formula-section">
                <h4>CKD-EPI 2021 Formula</h4>
                <div class="formula-item">
                    <strong>For Females:</strong>
                    <div class="formula">eGFR = 142 × min(Scr/0.7, 1)<sup>-0.241</sup> × max(Scr/0.7, 1)<sup>-1.200</sup> × 0.9938<sup>Age</sup> × 1.012</div>
                </div>
                <div class="formula-item">
                    <strong>For Males:</strong>
                    <div class="formula">eGFR = 142 × min(Scr/0.9, 1)<sup>-0.302</sup> × max(Scr/0.9, 1)<sup>-1.200</sup> × 0.9938<sup>Age</sup></div>
                </div>
                <div class="formula-item">
                    <strong>Where:</strong>
                    <div class="formula">
                        Scr = serum creatinine (mg/dL)<br>
                        κ = 0.7 (females) or 0.9 (males)<br>
                        α = -0.241 (females) or -0.302 (males)<br>
                        min = minimum of Scr/κ or 1<br>
                        max = maximum of Scr/κ or 1
                    </div>
                </div>
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        const ageInput = container.querySelector('#ckd-epi-age');
        const resultEl = container.querySelector('#ckd-epi-result');

        // Function to calculate and update results
        const calculateAndUpdate = () => {
            try {
                // Get creatinine in mg/dL (standard unit)
                const creatinineMgDl = getValueInStandardUnit(
                    container,
                    'ckd-epi-creatinine',
                    'mg/dL'
                );
                const age = parseFloat(ageInput.value);
                const genderRadio = container.querySelector('input[name="ckd-epi-gender"]:checked');
                const gender = genderRadio ? genderRadio.value : 'male';

                // Skip calculation if inputs are not yet provided
                if (!creatinineMgDl || !age || isNaN(creatinineMgDl) || isNaN(age)) {
                    resultEl.style.display = 'none';
                    return;
                }

                // Validate input
                const inputs = {
                    creatinine: creatinineMgDl,
                    age: age
                };
                const schema = {
                    creatinine: ValidationRules.creatinine,
                    age: ValidationRules.age
                };
                const validation = validateCalculatorInput(inputs, schema);

                if (!validation.isValid) {
                    throw new ValidationError(
                        validation.errors.join('; '),
                        'CKD_EPI_VALIDATION_ERROR',
                        { inputs, errors: validation.errors }
                    );
                }

                if (creatinineMgDl > 0 && age > 0 && (gender === 'male' || gender === 'female')) {
                    const kappa = gender === 'female' ? 0.7 : 0.9;
                    const alpha = gender === 'female' ? -0.241 : -0.302;
                    const gender_coefficient = gender === 'female' ? 1.012 : 1;

                    const gfr =
                        142 *
                        Math.pow(Math.min(creatinineMgDl / kappa, 1.0), alpha) *
                        Math.pow(Math.max(creatinineMgDl / kappa, 1.0), -1.2) *
                        Math.pow(0.9938, age) *
                        gender_coefficient;

                    // Validate calculation result
                    if (isNaN(gfr) || !isFinite(gfr) || gfr < 0) {
                        throw new ValidationError(
                            'eGFR 计算结果无效，请检查输入值',
                            'CKD_EPI_CALCULATION_ERROR',
                            { creatinineMgDl, age, gender, gfr }
                        );
                    }

                    // Determine CKD stage and severity
                    let stage = '';
                    let severityClass = 'low';
                    let alertType = 'info';
                    let alertMsg = '';

                    if (gfr >= 90) {
                        stage = 'Stage 1 (Normal or high)';
                        severityClass = 'low';
                        alertMsg = 'Normal kidney function.';
                    } else if (gfr >= 60) {
                        stage = 'Stage 2 (Mild)';
                        severityClass = 'low';
                        alertMsg = 'Mildly decreased kidney function.';
                    } else if (gfr >= 45) {
                        stage = 'Stage 3a (Mild to moderate)';
                        severityClass = 'moderate';
                        alertMsg = 'Mild to moderate reduction in kidney function.';
                    } else if (gfr >= 30) {
                        stage = 'Stage 3b (Moderate to severe)';
                        severityClass = 'moderate';
                        alertMsg =
                            'Moderate to severe reduction in kidney function. Consider nephrology referral.';
                        alertType = 'warning';
                    } else if (gfr >= 15) {
                        stage = 'Stage 4 (Severe)';
                        severityClass = 'high';
                        alertMsg =
                            'Severe reduction in kidney function. Nephrology referral required.';
                        alertType = 'warning';
                    } else {
                        stage = 'Stage 5 (Kidney failure)';
                        severityClass = 'high';
                        alertMsg = 'Kidney failure. Consider dialysis or transplantation.';
                        alertType = 'warning';
                    }

                    // Update result display
                    resultEl.innerHTML = `
                        <div class="result-header">
                            <h4>eGFR Results (CKD-EPI 2021)</h4>
                        </div>
                        
                        <div class="result-score">
                            <span class="result-score-value">${gfr.toFixed(0)}</span>
                            <span class="result-score-unit">mL/min/1.73m²</span>
                        </div>
                        
                        <div class="severity-indicator ${severityClass} mt-20">
                            <span class="severity-indicator-text">${stage}</span>
                        </div>
                        
                        <div class="alert ${alertType} mt-20">
                            <span class="alert-icon">${alertType === 'warning' ? '⚠️' : 'ℹ️'}</span>
                            <div class="alert-content">
                                <p>${alertMsg}</p>
                            </div>
                        </div>
                    `;

                    resultEl.style.display = 'block';
                    resultEl.classList.add('show');

                    // Clear any previous errors
                    const errorContainer = container.querySelector('#ckd-epi-error');
                    if (errorContainer) {
                        errorContainer.remove();
                    }
                } else {
                    // Reset to default values if inputs are invalid
                    const valueEl = resultEl.querySelector('.result-item .value');
                    valueEl.innerHTML = '-- <span class="unit">mL/min/1.73m²</span>';

                    resultEl.className = 'result';
                }
            } catch (error) {
                logError(error, {
                    calculator: 'ckd-epi',
                    action: 'calculateAndUpdate'
                });

                // Display error message
                let errorContainer = container.querySelector('#ckd-epi-error');
                if (!errorContainer) {
                    errorContainer = document.createElement('div');
                    errorContainer.id = 'ckd-epi-error';
                    resultEl.parentNode.insertBefore(errorContainer, resultEl.nextSibling);
                }
                displayError(errorContainer, error);

                // Reset result display
                resultEl.style.display = 'none';
            }
        };

        // Initialize unit conversion for creatinine
        initializeUnitConversion(container, 'ckd-epi-creatinine', calculateAndUpdate);

        // Auto-populate patient data
        if (patient && patient.birthDate) {
            ageInput.value = calculateAge(patient.birthDate);
        }
        if (patient && patient.gender) {
            const genderValue = patient.gender.toLowerCase() === 'female' ? 'female' : 'male';
            const genderRadio = container.querySelector(
                `input[name="ckd-epi-gender"][value="${genderValue}"]`
            );
            if (genderRadio) {
                genderRadio.checked = true;
                genderRadio.parentElement.classList.add('selected');
            }
        }

        // Add visual feedback for radio options
        const radioOptions = container.querySelectorAll('.radio-option');
        radioOptions.forEach(option => {
            option.addEventListener('click', function () {
                const radio = this.querySelector('input[type="radio"]');
                const group = radio.name;

                container.querySelectorAll(`input[name="${group}"]`).forEach(r => {
                    r.parentElement.classList.remove('selected');
                });

                this.classList.add('selected');
                radio.checked = true;
                calculateAndUpdate();
            });
        });

        // Initialize selected state
        radioOptions.forEach(option => {
            const radio = option.querySelector('input[type="radio"]');
            if (radio.checked) {
                option.classList.add('selected');
            }
        });

        // Auto-populate from FHIR data
        getMostRecentObservation(client, LOINC_CODES.CREATININE)
            .then(obs => {
                if (obs && obs.valueQuantity) {
                    const creatinineInput = container.querySelector('#ckd-epi-creatinine');
                    if (creatinineInput) {
                        creatinineInput.value = obs.valueQuantity.value.toFixed(2);
                    }
                }
                // Calculate initial results if data was populated
                calculateAndUpdate();
            })
            .catch(error => {
                const fhirError = new FHIRDataError(
                    '无法从 EHR 系统加载肌酐数据',
                    'CKD_EPI_FHIR_LOAD_ERROR',
                    { error: error.message }
                );
                logError(fhirError, {
                    calculator: 'ckd-epi',
                    action: 'loadFHIRData'
                });

                // Display a non-intrusive warning
                const warningContainer = document.createElement('div');
                warningContainer.className = 'warning-message';
                warningContainer.style.cssText =
                    'background: #fff3cd; border-left: 4px solid #ffc107; color: #856404; padding: 12px; margin-bottom: 15px; border-radius: 4px; font-size: 0.9em;';
                warningContainer.innerHTML =
                    '<strong>提示:</strong> 无法自动加载患者数据，请手动输入肌酐值。';
                container.insertBefore(warningContainer, container.firstChild.nextSibling);

                // Still allow manual calculation
                calculateAndUpdate();
            });

        // Add event listeners for automatic calculation
        ageInput.addEventListener('input', calculateAndUpdate);

        // Initial calculation
        calculateAndUpdate();
    }
};
