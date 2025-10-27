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
            <h3>${this.title}</h3>
            <div class="input-group">
                <label for="ckd-epi-creatinine">Serum Creatinine:</label>
                ${createUnitSelector('ckd-epi-creatinine', 'creatinine', ['mg/dL', 'µmol/L'], 'mg/dL')}
            </div>
            <div class="input-group">
                <label for="ckd-epi-age">Age:</label>
                <input type="number" id="ckd-epi-age" placeholder="loading...">
            </div>
            <div class="input-group">
                <label for="ckd-epi-gender">Gender:</label>
                <select id="ckd-epi-gender">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                </select>
            </div>
            <div id="ckd-epi-result" class="result" style="display:block;">
                <div class="result-item">
                    <span class="value">-- <span class="unit">mL/min/1.73m²</span></span>
                    <span class="label">eGFR (CKD-EPI 2021)</span>
                </div>
            </div>
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
        const genderSelect = container.querySelector('#ckd-epi-gender');
        const resultEl = container.querySelector('#ckd-epi-result');

        // Function to calculate and update results
        const calculateAndUpdate = () => {
            try {
                // Get creatinine in mg/dL (standard unit)
                const creatinineMgDl = getValueInStandardUnit(container, 'ckd-epi-creatinine', 'mg/dL');
                const age = parseFloat(ageInput.value);
                const gender = genderSelect.value;

                // Validate input
                const inputs = {
                    creatinine: creatinineMgDl,
                    age: age,
                };
                const schema = {
                    creatinine: ValidationRules.creatinine,
                    age: ValidationRules.age,
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

                    // Determine CKD stage
                    let stage = '';
                    let stageColor = '';
                    if (gfr >= 90) {
                        stage = 'Stage 1 (Normal or high)';
                        stageColor = '#4caf50';
                    } else if (gfr >= 60) {
                        stage = 'Stage 2 (Mild)';
                        stageColor = '#8bc34a';
                    } else if (gfr >= 45) {
                        stage = 'Stage 3a (Mild to moderate)';
                        stageColor = '#ffc107';
                    } else if (gfr >= 30) {
                        stage = 'Stage 3b (Moderate to severe)';
                        stageColor = '#ff9800';
                    } else if (gfr >= 15) {
                        stage = 'Stage 4 (Severe)';
                        stageColor = '#ff5722';
                    } else {
                        stage = 'Stage 5 (Kidney failure)';
                        stageColor = '#f44336';
                    }

                    // Update result display
                    const valueEl = resultEl.querySelector('.result-item .value');
                    valueEl.innerHTML = `
                        <div style="font-size: 2em; font-weight: bold;">${gfr.toFixed(0)}</div>
                        <div style="font-size: 0.9em; margin-top: 5px;">mL/min/1.73m²</div>
                        <div style="margin-top: 10px; padding: 8px; background: ${stageColor}; color: white; border-radius: 5px; font-size: 0.9em;">
                            ${stage}
                        </div>
                    `;

                    resultEl.className = 'result calculated';
                    resultEl.style.display = 'block';

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
                    action: 'calculateAndUpdate',
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
            genderSelect.value = patient.gender;
        }

        // Auto-populate from FHIR data
        getMostRecentObservation(client, '2160-0')
            .then((obs) => {
                if (obs && obs.valueQuantity) {
                    const creatinineInput = container.querySelector('#ckd-epi-creatinine');
                    if (creatinineInput) {
                        creatinineInput.value = obs.valueQuantity.value.toFixed(2);
                    }
                }
                // Calculate initial results if data was populated
                calculateAndUpdate();
            })
            .catch((error) => {
                const fhirError = new FHIRDataError(
                    '无法从 EHR 系统加载肌酐数据',
                    'CKD_EPI_FHIR_LOAD_ERROR',
                    { error: error.message }
                );
                logError(fhirError, {
                    calculator: 'ckd-epi',
                    action: 'loadFHIRData',
                });

                // Display a non-intrusive warning
                const warningContainer = document.createElement('div');
                warningContainer.className = 'warning-message';
                warningContainer.style.cssText =
                    'background: #fff3cd; border-left: 4px solid #ffc107; color: #856404; padding: 12px; margin-bottom: 15px; border-radius: 4px; font-size: 0.9em;';
                warningContainer.innerHTML = '<strong>提示:</strong> 无法自动加载患者数据，请手动输入肌酐值。';
                container.insertBefore(warningContainer, container.firstChild.nextSibling);

                // Still allow manual calculation
                calculateAndUpdate();
            });

        // Add event listeners for automatic calculation
        ageInput.addEventListener('input', calculateAndUpdate);
        genderSelect.addEventListener('change', calculateAndUpdate);

        // Initial calculation
        calculateAndUpdate();
    }
};
