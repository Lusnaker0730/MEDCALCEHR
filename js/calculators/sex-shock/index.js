import { getMostRecentObservation, calculateAge } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { createStalenessTracker } from '../../data-staleness.js';
import { displayError, logError } from '../../errorHandler.js';
export const sexShock = {
    id: 'sex-shock',
    title: 'SEX-SHOCK Risk Score for Cardiogenic Shock',
    description: 'Calculates the risk of in-hospital cardiogenic shock in patients with acute coronary syndrome (ACS).',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            ${uiBuilder.createAlert({
            type: 'warning',
            message: '<strong>Validation Notice:</strong> Use caution in patients who have not undergone PCI.'
        })}

            ${uiBuilder.createSection({
            title: 'Patient Characteristics',
            icon: '👤',
            content: `
                    ${uiBuilder.createRadioGroup({
                name: 'sex-shock-age',
                label: 'Age > 70 years',
                options: [
                    { value: '0', label: 'No', checked: true },
                    { value: '1', label: 'Yes' }
                ]
            })}
                    ${uiBuilder.createRadioGroup({
                name: 'sex-shock-sex',
                label: 'Sex',
                options: [
                    { value: '0', label: 'Male', checked: true },
                    { value: '1', label: 'Female' }
                ]
            })}
                `
        })}

            ${uiBuilder.createSection({
            title: 'Clinical Presentation',
            icon: '🏥',
            content: `
                    ${uiBuilder.createRadioGroup({
                name: 'sex-shock-arrest',
                label: 'Cardiac Arrest at Presentation',
                options: [
                    { value: '0', label: 'No', checked: true },
                    { value: '1', label: 'Yes' }
                ]
            })}
                    ${uiBuilder.createRadioGroup({
                name: 'sex-shock-killip',
                label: 'Killip Class III (Acute Pulmonary Edema)',
                options: [
                    { value: '0', label: 'No', checked: true },
                    { value: '1', label: 'Yes' }
                ]
            })}
                    ${uiBuilder.createRadioGroup({
                name: 'sex-shock-hr',
                label: 'Heart Rate > 90 bpm',
                options: [
                    { value: '0', label: 'No', checked: true },
                    { value: '1', label: 'Yes' }
                ]
            })}
                    ${uiBuilder.createRadioGroup({
                name: 'sex-shock-bp',
                label: 'Low BP (SBP < 125) & Pulse Pressure < 45 mmHg',
                options: [
                    { value: '0', label: 'No', checked: true },
                    { value: '1', label: 'Yes' }
                ]
            })}
                `
        })}

            ${uiBuilder.createSection({
            title: 'Angiographic & ECG Findings',
            icon: '💓',
            content: `
                    ${uiBuilder.createRadioGroup({
                name: 'sex-shock-pci',
                label: 'PCI Not Performed',
                options: [
                    { value: '0', label: 'PCI Done', checked: true },
                    { value: '1', label: 'No PCI' }
                ]
            })}
                    ${uiBuilder.createRadioGroup({
                name: 'sex-shock-timi',
                label: 'Post-PCI TIMI Flow < 3',
                options: [
                    { value: '0', label: 'No (TIMI 3)', checked: true },
                    { value: '1', label: 'Yes (< 3)' }
                ]
            })}
                    ${uiBuilder.createRadioGroup({
                name: 'sex-shock-left-main',
                label: 'Left Main Culprit Lesion',
                options: [
                    { value: '0', label: 'No', checked: true },
                    { value: '1', label: 'Yes' }
                ]
            })}
                    ${uiBuilder.createRadioGroup({
                name: 'sex-shock-st',
                label: 'ST-Elevation on ECG',
                options: [
                    { value: '0', label: 'No', checked: true },
                    { value: '1', label: 'Yes' }
                ]
            })}
                    ${uiBuilder.createRadioGroup({
                name: 'sex-shock-lvef',
                label: 'Left Ventricular EF',
                options: [
                    { value: '55', label: '> 50%' },
                    { value: '42.5', label: '35-50%' },
                    { value: '30', label: '< 35%', checked: true }
                ]
            })}
                `
        })}

            ${uiBuilder.createSection({
            title: 'Laboratory Values',
            icon: '🧪',
            content: `
                    ${uiBuilder.createRadioGroup({
                name: 'sex-shock-glycemia',
                label: 'Glucose > 10 mmol/L (> 180 mg/dL)',
                options: [
                    { value: '0', label: 'No', checked: true },
                    { value: '1', label: 'Yes' }
                ]
            })}
                    ${uiBuilder.createInput({ id: 'sex-shock-creatinine', label: 'Creatinine', unit: 'mg/dL', type: 'number', step: 0.1 })}
                    ${uiBuilder.createInput({ id: 'sex-shock-crp', label: 'C-Reactive Protein', unit: 'mg/L', type: 'number', step: 0.1 })}
                `
        })}
        
            <div id="sex-shock-error-container"></div>
            ${uiBuilder.createResultBox({ id: 'sex-shock-result', title: 'In-Hospital Cardiogenic Shock Risk' })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);
        // Initialize staleness tracker
        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);
        const calculate = () => {
            try {
                // Clear validation errors
                const errorContainer = container.querySelector('#sex-shock-error-container');
                if (errorContainer)
                    errorContainer.innerHTML = '';
                const getVal = (name) => parseInt(container.querySelector(`input[name="sex-shock-${name}"]:checked`).value);
                const age70 = getVal('age');
                const sex = getVal('sex'); // 0=Male, 1=Female
                const arrest = getVal('arrest');
                const killip = getVal('killip');
                const hr = getVal('hr');
                const bp = getVal('bp');
                const pci = getVal('pci'); // 1=No PCI (Not used in formula directly in original code logic? Wait.)
                // Checking original code: pci variable collected but not used in coeffs calculation directly?
                // Actually the original code collects 'pci' but doesn't seem to use it in the 'coeffs' logic shown in 'sex-shock/index.js'.
                // Formula: Y = Intercept + ...
                // The provided original code for `sex-shock` in the read_file output (Step 3051) defines pci const but doesn't use it. 
                // However, I will implement it faithfully to the JS logic found. The "validation notice" mentions PCI.
                const timi = getVal('timi');
                const leftMain = getVal('left-main');
                const st = getVal('st');
                const lvef = parseFloat(container.querySelector('input[name="sex-shock-lvef"]:checked').value);
                const glycemia = getVal('glycemia');
                const creatinineInput = container.querySelector('#sex-shock-creatinine');
                const creatinine = parseFloat(creatinineInput.value) || 0;
                const crpInput = container.querySelector('#sex-shock-crp');
                const crp = parseFloat(crpInput.value) || 0; // Assuming 0 if missing for score calculation to proceed, or should we require it? Original used || 0.
                const isFemale = sex === 1;
                const coeffs = isFemale ? {
                    intercept: -7.0804, crp: 0.0915, creatinine: 0.6092, st: 0.0328,
                    lvef35to50: -1.0953, lvefLess50: -1.9474, age: 0.1825,
                    arrest: 1.2567, killip: 1.0503, hr: 0.2408, bp: 0.8192,
                    glycemia: 0.4019, leftMain: 0.6397, timi: 0.7198
                } : {
                    intercept: -7.9666, crp: 0.0696, creatinine: 0.6040, st: 0.7680,
                    lvef35to50: -1.2722, lvefLess50: -2.0153, age: 0.2635,
                    arrest: 1.1459, killip: 0.6849, hr: 0.5386, bp: 0.7062,
                    glycemia: 0.8375, leftMain: 0.9036, timi: 0.4966
                };
                // Age coefficient logic: original code uses 'age' variable which is 0 or 1 (>70).
                // Wait, original code: `Y += coeffs.age * age;` where age is 0 or 1.
                // The coefficient seems to be for the binary condition "Age > 70".
                let Y = coeffs.intercept;
                if (crp > 0)
                    Y += coeffs.crp * Math.log2(crp + 1);
                if (creatinine > 0)
                    Y += coeffs.creatinine * Math.log2(creatinine * 88.4); // Convert mg/dL to umol/L? 88.4 factor is correct.
                Y += coeffs.st * st;
                // LVEF Logic in original code:
                // if (lvef === 55) Y += coeffs.lvefLess50; <-- Mistake in original code variable name?
                // Original code: if (lvef === 55) Y += coeffs.lvefLess50; // >50% (Protective)?
                // Let's re-read carefully:
                // coeffs: lvef35to50, lvefLess50.
                // Original: if (lvef === 55) Y += coeffs.lvefLess50;
                //           else if (lvef === 42.5) Y += coeffs.lvef35to50;
                // Wait. 55 represents > 50%. Usually preserved EF is lower risk (lower score or negative coeff).
                // In coeffs, lvefLess50 is -2.0 (approx) and lvef35to50 is -1.2.
                // intercept is ~ -7 or -8.
                // If lvef < 35 (value 30), no correction is added?
                // The logit model usually has a baseline.
                // If lvefLess50 is negative, it reduces risk?
                // Wait. lvefLess50 IS -2.0. Adding a negative number reduces Y. Lower Y = Lower Risk.
                // So lvef=55 (>50%) should reduce risk MOST.
                // In original code: `if (lvef === 55) Y += coeffs.lvefLess50;`
                // This implies lvef > 50 uses the coeff named `lvefLess50`. This variable name looks transposed or I am misinterpreting.
                // Let's assume the original code *intended* to use the `lvef > 50` coeff, but named it `lvefLess50`?
                // Or maybe `lvefLess50` means "EF < 50 is NOT present" -> but that doesn't make sense.
                // Let's trust the logic structure:
                // Value 55 (>50%) -> add -2.0 (Reduces risk significantly).
                // Value 42.5 (35-50%) -> add -1.2 (Reduces risk moderately).
                // Value 30 (<35%) -> add 0 (Baseline, highest risk).
                // This structure makes sense: Higher EF = Lower Risk.
                // The variable name `lvefLess50` might just be a typo for `lvefMoreThan50` in the original source/implementation.
                // I will keep the *logic* (mapping 55 to the large negative coeff) even if the name in original was weird. I'll use the values directly from the object.
                // Code matches original: `if (lvef === 55) Y += coeffs.lvefLess50;`
                if (lvef === 55)
                    Y += coeffs.lvefLess50;
                else if (lvef === 42.5)
                    Y += coeffs.lvef35to50;
                Y += coeffs.age * age70; // age variable from getVal('age') matches logic
                Y += coeffs.arrest * arrest;
                Y += coeffs.killip * killip;
                Y += coeffs.hr * hr;
                Y += coeffs.bp * bp;
                Y += coeffs.glycemia * glycemia;
                Y += coeffs.leftMain * leftMain;
                Y += coeffs.timi * timi;
                const risk = (1 / (1 + Math.exp(-Y))) * 100;
                let riskLevel = '';
                let alertType = 'info';
                if (risk < 5) {
                    riskLevel = 'Low Risk';
                    alertType = 'success';
                }
                else if (risk < 15) {
                    riskLevel = 'Moderate Risk';
                    alertType = 'warning';
                }
                else if (risk < 30) {
                    riskLevel = 'High Risk';
                    alertType = 'danger';
                }
                else {
                    riskLevel = 'Very High Risk';
                    alertType = 'danger';
                }
                const resultBox = container.querySelector('#sex-shock-result');
                if (resultBox) {
                    const resultContent = resultBox.querySelector('.ui-result-content');
                    if (resultContent) {
                        resultContent.innerHTML = `
                            ${uiBuilder.createResultItem({
                            label: 'In-Hospital Cardiogenic Shock Risk',
                            value: risk.toFixed(1),
                            unit: '%',
                            interpretation: riskLevel,
                            alertClass: `ui-alert-${alertType}`
                        })}
                        `;
                    }
                    resultBox.classList.add('show');
                }
            }
            catch (error) {
                const errorContainer = container.querySelector('#sex-shock-error-container');
                if (errorContainer) {
                    displayError(errorContainer, error);
                }
                else {
                    console.error(error);
                }
                logError(error, { calculator: 'sex-shock', action: 'calculate' });
            }
        };
        container.addEventListener('change', (e) => {
            if (e.target instanceof HTMLInputElement) {
                calculate();
            }
        });
        container.addEventListener('input', (e) => {
            if (e.target instanceof HTMLInputElement) {
                calculate();
            }
        });
        // Helper to set radio
        const setRadioValue = (name, value) => {
            const radio = container.querySelector(`input[name="${name}"][value="${value}"]`);
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change'));
            }
        };
        // Auto-populate
        if (patient) {
            if (patient.birthDate) {
                const age = calculateAge(patient.birthDate);
                if (age > 70)
                    setRadioValue('sex-shock-age', '1');
            }
            if (patient.gender === 'female')
                setRadioValue('sex-shock-sex', '1');
        }
        // Populate from FHIR
        if (client) {
            // HR (8867-4)
            getMostRecentObservation(client, '8867-4').then(obs => {
                if (obs?.valueQuantity?.value > 90) {
                    setRadioValue('sex-shock-hr', '1');
                    stalenessTracker.trackObservation('input[name="sex-shock-hr"]', obs, '8867-4', 'Heart Rate');
                }
            }).catch(e => console.warn(e));
            // Creatinine
            getMostRecentObservation(client, LOINC_CODES.CREATININE).then(obs => {
                if (obs?.valueQuantity) {
                    const el = container.querySelector('#sex-shock-creatinine');
                    if (el) {
                        el.value = obs.valueQuantity.value.toFixed(1);
                        stalenessTracker.trackObservation('#sex-shock-creatinine', obs, LOINC_CODES.CREATININE, 'Creatinine');
                        calculate();
                    }
                }
            }).catch(e => console.warn(e));
            // CRP
            getMostRecentObservation(client, LOINC_CODES.CRP).then(obs => {
                if (obs?.valueQuantity) {
                    const el = container.querySelector('#sex-shock-crp');
                    if (el) {
                        el.value = obs.valueQuantity.value.toFixed(1);
                        stalenessTracker.trackObservation('#sex-shock-crp', obs, LOINC_CODES.CRP, 'CRP');
                        calculate();
                    }
                }
            }).catch(e => console.warn(e));
        }
        calculate();
    }
};
