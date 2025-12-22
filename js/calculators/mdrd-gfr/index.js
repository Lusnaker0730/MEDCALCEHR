import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { ValidationRules, validateCalculatorInput } from '../../validator.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';
import { fhirDataService } from '../../fhir-data-service.js';
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
                    unitToggle: { type: 'creatinine', units: ['mg/dL', 'µmol/L'], default: 'mg/dL' }
                })
            ].join('')
        });
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">Estimates GFR using the MDRD equation. Note: CKD-EPI is now preferred for most patients.</p>
            </div>
            
            ${uiBuilder.createAlert({
            type: 'warning',
            message: '<p><strong>Note:</strong> MDRD is less accurate at higher GFR values (>60). Consider using CKD-EPI for general use.</p>'
        })}
            
            ${patientSection}
            ${labSection}
            
            <div id="mdrd-error-container"></div>
            
            <div id="mdrd-result" class="ui-result-box">
                <div class="ui-result-header">eGFR Results (MDRD)</div>
                <div class="ui-result-content"></div>
            </div>
            
            ${uiBuilder.createFormulaSection({
            items: [
                { label: 'Base Formula', formula: 'eGFR = 175 × (Scr)^-1.154 × (Age)^-0.203' },
                { label: 'Gender Adjustment', content: 'If female: multiply by 0.742' },
                { label: 'Race Adjustment', content: 'If African American: multiply by 1.212' }
            ]
        })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);
        // Initialize FHIRDataService
        fhirDataService.initialize(client, patient, container);
        const ageInput = container.querySelector('#mdrd-age');
        const resultEl = container.querySelector('#mdrd-result');
        const calculateAndUpdate = () => {
            const errorContainer = container.querySelector('#mdrd-error-container');
            if (errorContainer)
                errorContainer.innerHTML = '';
            const creatinineInput = container.querySelector('#mdrd-creatinine');
            const creatinineMgDl = UnitConverter.getStandardValue(creatinineInput, 'mg/dL');
            const age = parseFloat(ageInput.value);
            const genderRadio = container.querySelector('input[name="mdrd-gender"]:checked');
            const raceRadio = container.querySelector('input[name="mdrd-race"]:checked');
            const isFemale = genderRadio ? genderRadio.value === 'female' : false;
            const isAA = raceRadio ? raceRadio.value === 'aa' : false;
            try {
                const inputs = { age, creatinine: creatinineMgDl };
                const schema = {
                    age: ValidationRules.age,
                    creatinine: ValidationRules.creatinine
                };
                // @ts-ignore
                const validation = validateCalculatorInput(inputs, schema);
                if (!validation.isValid) {
                    if (ageInput.value || creatinineInput.value) {
                        const valuesPresent = !isNaN(age) && creatinineMgDl !== null && !isNaN(creatinineMgDl);
                        if (valuesPresent || validation.errors.some((e) => !e.includes('required'))) {
                            if (errorContainer)
                                displayError(errorContainer, new ValidationError(validation.errors[0], 'VALIDATION_ERROR'));
                        }
                    }
                    if (resultEl)
                        resultEl.classList.remove('show');
                    return;
                }
                if (creatinineMgDl && creatinineMgDl > 0 && age > 0) {
                    let gfr = 175 * Math.pow(creatinineMgDl, -1.154) * Math.pow(age, -0.203);
                    if (isFemale) {
                        gfr *= 0.742;
                    }
                    if (isAA) {
                        gfr *= 1.212;
                    }
                    let stage = '';
                    let alertType = 'info';
                    let alertMsg = '';
                    if (gfr >= 90) {
                        stage = 'Stage 1 (Normal or high)';
                        alertType = 'success';
                        alertMsg = 'Normal kidney function.';
                    }
                    else if (gfr >= 60) {
                        stage = 'Stage 2 (Mild)';
                        alertType = 'success';
                        alertMsg = 'Mildly decreased kidney function.';
                    }
                    else if (gfr >= 45) {
                        stage = 'Stage 3a (Mild to moderate)';
                        alertType = 'warning';
                        alertMsg = 'Mild to moderate reduction in kidney function.';
                    }
                    else if (gfr >= 30) {
                        stage = 'Stage 3b (Moderate to severe)';
                        alertType = 'warning';
                        alertMsg = 'Moderate to severe reduction in kidney function. Consider nephrology referral.';
                    }
                    else if (gfr >= 15) {
                        stage = 'Stage 4 (Severe)';
                        alertType = 'danger';
                        alertMsg = 'Severe reduction in kidney function. Nephrology referral required.';
                    }
                    else {
                        stage = 'Stage 5 (Kidney failure)';
                        alertType = 'danger';
                        alertMsg = 'Kidney failure. Consider dialysis or transplantation.';
                    }
                    if (resultEl) {
                        const resultContent = resultEl.querySelector('.ui-result-content');
                        if (resultContent) {
                            resultContent.innerHTML = `
                                ${uiBuilder.createResultItem({
                                label: 'Estimated GFR',
                                value: gfr.toFixed(0),
                                unit: 'mL/min/1.73m²',
                                interpretation: stage,
                                alertClass: 'ui-alert-' + alertType
                            })}
                                ${uiBuilder.createAlert({
                                type: alertType,
                                message: alertMsg
                            })}
                            `;
                        }
                        resultEl.classList.add('show');
                    }
                }
                else {
                    if (resultEl)
                        resultEl.classList.remove('show');
                }
            }
            catch (error) {
                logError(error, { calculator: 'mdrd-gfr', action: 'calculate' });
                if (errorContainer)
                    displayError(errorContainer, error);
                if (resultEl)
                    resultEl.classList.remove('show');
            }
        };
        container.addEventListener('change', (e) => {
            const target = e.target;
            if (target.tagName === 'INPUT' || target.tagName === 'SELECT') {
                calculateAndUpdate();
            }
        });
        container.addEventListener('input', (e) => {
            const target = e.target;
            if (target.tagName === 'INPUT') {
                calculateAndUpdate();
            }
        });
        // Auto-populate using FHIRDataService
        const autoPopulate = async () => {
            if (fhirDataService.isReady()) {
                try {
                    // Get age
                    const age = await fhirDataService.getPatientAge();
                    if (age !== null && ageInput) {
                        ageInput.value = age.toString();
                        ageInput.dispatchEvent(new Event('input'));
                    }
                    // Get gender
                    const gender = await fhirDataService.getPatientGender();
                    if (gender) {
                        const genderValue = gender.toLowerCase() === 'female' ? 'female' : 'male';
                        const genderRadio = container.querySelector(`input[name="mdrd-gender"][value="${genderValue}"]`);
                        if (genderRadio) {
                            genderRadio.checked = true;
                            genderRadio.dispatchEvent(new Event('change'));
                        }
                    }
                    // Get creatinine
                    const crResult = await fhirDataService.getObservation(LOINC_CODES.CREATININE, {
                        trackStaleness: true,
                        stalenessLabel: 'Serum Creatinine',
                        targetUnit: 'mg/dL',
                        unitType: 'creatinine'
                    });
                    const creatinineInput = container.querySelector('#mdrd-creatinine');
                    if (crResult.value !== null && creatinineInput) {
                        creatinineInput.value = crResult.value.toFixed(2);
                        creatinineInput.dispatchEvent(new Event('input'));
                    }
                }
                catch (e) {
                    console.warn('Error auto-populating MDRD GFR:', e);
                }
            }
            calculateAndUpdate();
        };
        autoPopulate();
    }
};
