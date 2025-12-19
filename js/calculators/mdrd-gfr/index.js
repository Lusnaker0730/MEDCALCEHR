import {
    getMostRecentObservation,
    calculateAge
} from '../../utils.js';
import { createStalenessTracker } from '../../data-staleness.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { ValidationRules, validateCalculatorInput } from '../../validator.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';

export const mdrdGfr = {
    id: 'mdrd-gfr',
    title: 'MDRD GFR Equation',
    generateHTML: function () {
        const patientSection = uiBuilder.createSection({
            title: 'Patient Information',
            content: [
                uiBuilder.createRadioGroup({
                    name: 'mdrd-gender',
                    label: 'Gender',
                    options: [
                        { value: 'male', label: 'Male', checked: true },
                        { value: 'female', label: 'Female' }
                    ]
                }),
                uiBuilder.createRadioGroup({
                    name: 'mdrd-race',
                    label: 'Race',
                    options: [
                        { value: 'non-aa', label: 'Non-African American', checked: true },
                        { value: 'aa', label: 'African American' }
                    ]
                }),
                uiBuilder.createInput({
                    id: 'mdrd-age',
                    label: 'Age',
                    type: 'number',
                    placeholder: 'e.g., 65',
                    unit: 'years'
                })
            ].join('')
        });

        const labSection = uiBuilder.createSection({
            title: 'Lab Values',
            content: [
                uiBuilder.createInput({
                    id: 'mdrd-creatinine',
                    label: 'Serum Creatinine',
                    type: 'number',
                    unitToggle: { type: 'creatinine', units: ['mg/dL', 'µmol/L'], defaultUnit: 'mg/dL' }
                })
            ].join('')
        });

        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">Estimates GFR using the MDRD equation. Note: CKD-EPI is now preferred for most patients.</p>
            </div>
            
            <div class="alert warning">
                <span class="alert-icon">⚠️</span>
                <div class="alert-content">
                    <p><strong>Note:</strong> MDRD is less accurate at higher GFR values (>60). Consider using CKD-EPI for general use.</p>
                </div>
            </div>
            
            ${patientSection}
            ${labSection}
            
            <div id="mdrd-error-container"></div>
            
            <div class="result-container" id="mdrd-result" style="display:none;"></div>
            
            <div class="formula-section">
                <h4>MDRD Formula</h4>
                <div class="formula-item">
                    <strong>Base Formula:</strong>
                    <div class="formula">eGFR = 175 × (Scr)<sup>-1.154</sup> × (Age)<sup>-0.203</sup></div>
                </div>
                <div class="formula-item">
                    <strong>Gender Adjustment:</strong>
                    <div class="formula">If female: multiply by 0.742</div>
                </div>
                <div class="formula-item">
                    <strong>Race Adjustment:</strong>
                    <div class="formula">If African American: multiply by 1.212</div>
                </div>
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        // Initialize staleness tracker
        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);

        const ageInput = container.querySelector('#mdrd-age');
        const resultEl = container.querySelector('#mdrd-result');

        // Function to calculate and update results
        const calculateAndUpdate = () => {
            // Clear previous errors
            const errorContainer = container.querySelector('#mdrd-error-container');
            if (errorContainer) errorContainer.innerHTML = '';

            // Get creatinine in mg/dL (standard unit)
            const creatinineInput = container.querySelector('#mdrd-creatinine');
            const creatinineMgDl = UnitConverter.getStandardValue(creatinineInput, 'mg/dL');

            const age = parseFloat(ageInput.value);
            const genderRadio = container.querySelector('input[name="mdrd-gender"]:checked');
            const raceRadio = container.querySelector('input[name="mdrd-race"]:checked');
            const isFemale = genderRadio ? genderRadio.value === 'female' : false;
            const isAA = raceRadio ? raceRadio.value === 'aa' : false;

            try {
                // Validate inputs
                const inputs = { age, creatinine: creatinineMgDl };
                const schema = {
                    age: ValidationRules.age,
                    creatinine: ValidationRules.creatinine
                };

                const validation = validateCalculatorInput(inputs, schema);

                if (!validation.isValid) {
                    if (ageInput.value || creatinineInput.value) {
                        const valuesPresent = !isNaN(age) && !isNaN(creatinineMgDl);
                        if (valuesPresent || validation.errors.some(e => !e.includes('required'))) {
                            if (errorContainer) displayError(errorContainer, new ValidationError(validation.errors[0], 'VALIDATION_ERROR'));
                        }
                    }
                    resultEl.style.display = 'none';
                    return;
                }

                if (creatinineMgDl > 0 && age > 0) {
                    let gfr = 175 * Math.pow(creatinineMgDl, -1.154) * Math.pow(age, -0.203);
                    if (isFemale) {
                        gfr *= 0.742;
                    }
                    if (isAA) {
                        gfr *= 1.212;
                    }

                    // Determine CKD stage and severity
                    let stage = '';
                    let severityClass = 'low';
                    let alertType = 'info';
                    let alertMsg = '';

                    if (gfr >= 90) {
                        stage = 'Stage 1 (Normal or high)';
                        severityClass = 'ui-alert-success';
                        alertMsg = 'Normal kidney function.';
                    } else if (gfr >= 60) {
                        stage = 'Stage 2 (Mild)';
                        severityClass = 'ui-alert-success';
                        alertMsg = 'Mildly decreased kidney function.';
                    } else if (gfr >= 45) {
                        stage = 'Stage 3a (Mild to moderate)';
                        severityClass = 'ui-alert-warning';
                        alertMsg = 'Mild to moderate reduction in kidney function.';
                    } else if (gfr >= 30) {
                        stage = 'Stage 3b (Moderate to severe)';
                        severityClass = 'ui-alert-warning';
                        alertMsg =
                            'Moderate to severe reduction in kidney function. Consider nephrology referral.';
                        alertType = 'warning';
                    } else if (gfr >= 15) {
                        stage = 'Stage 4 (Severe)';
                        severityClass = 'ui-alert-danger';
                        alertMsg = 'Severe reduction in kidney function. Nephrology referral required.';
                        alertType = 'danger';
                    } else {
                        stage = 'Stage 5 (Kidney failure)';
                        severityClass = 'ui-alert-danger';
                        alertMsg = 'Kidney failure. Consider dialysis or transplantation.';
                        alertType = 'danger';
                    }

                    // Update result display
                    resultEl.innerHTML = `
                         <div class="result-header">
                            <h4>eGFR Results (MDRD)</h4>
                        </div>
                        
                        <div class="result-score">
                            <span class="result-score-value">${gfr.toFixed(0)}</span>
                            <span class="result-score-unit">mL/min/1.73m²</span>
                        </div>
                        
                        ${uiBuilder.createAlert({
                        type: alertType,
                        message: `<strong>${stage}</strong><br>${alertMsg}`
                    })}
                    `;

                    resultEl.style.display = 'block';
                    resultEl.classList.add('show');
                } else {
                    resultEl.style.display = 'none';
                }
            } catch (error) {
                logError(error, { calculator: 'mdrd-gfr', action: 'calculate' });
                if (errorContainer) displayError(errorContainer, error);
                resultEl.style.display = 'none';
            }
        };

        // Auto-populate patient data
        if (patient && patient.birthDate) {
            ageInput.value = calculateAge(patient.birthDate);
        }
        if (patient && patient.gender) {
            const genderValue = patient.gender.toLowerCase() === 'female' ? 'female' : 'male';
            const genderRadio = container.querySelector(
                `input[name="mdrd-gender"][value="${genderValue}"]`
            );
            if (genderRadio) {
                genderRadio.checked = true;
                genderRadio.dispatchEvent(new Event('change'));
            }
        }

        // Auto-populate from FHIR data
        if (client) {
            getMostRecentObservation(client, LOINC_CODES.CREATININE).then(obs => {
                if (obs && obs.valueQuantity) {
                    const creatinineInput = container.querySelector('#mdrd-creatinine');
                    if (creatinineInput) {
                        const val = obs.valueQuantity.value;
                        const unit = obs.valueQuantity.unit || 'mg/dL';
                        const converted = UnitConverter.convert(val, unit, 'mg/dL', 'creatinine');
                        if (converted !== null) {
                            creatinineInput.value = converted.toFixed(2);
                            creatinineInput.dispatchEvent(new Event('input'));
                            stalenessTracker.trackObservation('#mdrd-creatinine', obs, LOINC_CODES.CREATININE, 'Serum Creatinine');
                        }
                    }
                }
                // Calculate initial results if data was populated
                calculateAndUpdate();
            }).catch(e => console.warn(e));
        }

        // Add event listeners for automatic calculation
        // Listen to change for radios/selects
        container.addEventListener('change', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
                calculateAndUpdate();
            }
        });

        // Listen to input for text fields
        container.addEventListener('input', (e) => {
            if (e.target.tagName === 'INPUT') {
                calculateAndUpdate();
            }
        });

        // Initial calculation
        calculateAndUpdate();
    }
};