import { getMostRecentObservation } from '../../utils.js';
import { createStalenessTracker } from '../../data-staleness.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
export const isthDic = {
    id: 'isth-dic',
    title: 'ISTH Criteria for Disseminated Intravascular Coagulation (DIC)',
    description: 'Diagnoses overt disseminated intravascular coagulation (DIC).',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>

            ${uiBuilder.createAlert({
            type: 'warning',
            message: '<strong>Use only in patients with clinical suspicion for DIC</strong> (e.g. excessive bleeding, malignancy, sepsis, trauma).'
        })}

            ${uiBuilder.createSection({
            title: 'Laboratory Criteria',
            content: `
                    <div class="input-group-wrapper">
                        ${uiBuilder.createInput({
                id: 'isth-platelet-input',
                label: 'Platelet count',
                type: 'number',
                unit: '×10⁹/L',
                unitToggle: {
                    type: 'platelet',
                    units: ['×10⁹/L', 'K/µL'],
                    default: '×10⁹/L'
                }
            })}
                        ${uiBuilder.createRadioGroup({
                name: 'isth-platelet',
                options: [
                    { value: '0', label: '≥100 (0)', checked: true },
                    { value: '1', label: '50 to <100 (+1)' },
                    { value: '2', label: '<50 (+2)' }
                ]
            })}
                    </div>

                    <div class="input-group-wrapper" style="margin-top: 20px;">
                        ${uiBuilder.createInput({
                id: 'isth-ddimer-input',
                label: 'D-dimer level',
                type: 'number',
                unit: 'mg/L',
                unitToggle: {
                    type: 'ddimer',
                    units: ['mg/L', 'µg/mL', 'ng/mL'],
                    default: 'mg/L'
                }
            })}
                        ${uiBuilder.createRadioGroup({
                name: 'isth-fibrin_marker',
                options: [
                    { value: '0', label: 'No increase (<0.5 mg/L) (0)', checked: true },
                    { value: '2', label: 'Moderate increase (0.5-5 mg/L) (+2)' },
                    { value: '3', label: 'Severe increase (>5 mg/L) (+3)' }
                ]
            })}
                    </div>

                    <div class="input-group-wrapper" style="margin-top: 20px;">
                        ${uiBuilder.createInput({
                id: 'isth-pt-input',
                label: 'Prothrombin Time (PT)',
                type: 'number',
                unit: 'seconds',
                placeholder: 'Normal ~12s'
            })}
                        ${uiBuilder.createRadioGroup({
                name: 'isth-pt',
                options: [
                    { value: '0', label: 'Prolongation <3s (0)', checked: true },
                    { value: '1', label: 'Prolongation 3 to <6s (+1)' },
                    { value: '2', label: 'Prolongation ≥6s (+2)' }
                ]
            })}
                    </div>

                    <div class="input-group-wrapper" style="margin-top: 20px;">
                        ${uiBuilder.createInput({
                id: 'isth-fibrinogen-input',
                label: 'Fibrinogen level',
                type: 'number',
                unit: 'g/L',
                unitToggle: {
                    type: 'fibrinogen',
                    units: ['g/L', 'mg/dL'],
                    default: 'g/L'
                }
            })}
                        ${uiBuilder.createRadioGroup({
                name: 'isth-fibrinogen',
                options: [
                    { value: '0', label: '≥1.0 g/L (0)', checked: true },
                    { value: '1', label: '<1.0 g/L (+1)' }
                ]
            })}
                    </div>
                `
        })}

            ${uiBuilder.createResultBox({ id: 'isth-dic-result', title: 'ISTH DIC Score' })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);
        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);
        const calculate = () => {
            const groups = ['isth-platelet', 'isth-fibrin_marker', 'isth-pt', 'isth-fibrinogen'];
            let score = 0;
            groups.forEach(group => {
                const checked = container.querySelector(`input[name="${group}"]:checked`);
                if (checked)
                    score += parseInt(checked.value);
            });
            const resultBox = container.querySelector('#isth-dic-result');
            if (resultBox) {
                const resultContent = resultBox.querySelector('.ui-result-content');
                let interpretation = '';
                let alertType = 'info';
                if (score >= 5) {
                    interpretation = 'Compatible with overt DIC. Repeat score daily.';
                    alertType = 'danger';
                }
                else {
                    interpretation = 'Not suggestive of overt DIC. May be non-overt DIC. Repeat within 1-2 days.';
                    alertType = 'success';
                }
                if (resultContent) {
                    resultContent.innerHTML = `
                        ${uiBuilder.createResultItem({
                        label: 'Total Score',
                        value: score.toString(),
                        unit: 'points',
                        interpretation: score >= 5 ? 'Overt DIC' : 'Not Overt DIC',
                        alertClass: `ui-alert-${alertType}`
                    })}
                        ${uiBuilder.createAlert({
                        type: alertType,
                        message: interpretation
                    })}
                    `;
                }
                resultBox.classList.add('show');
            }
        };
        // Helper to set radio based on input value
        const setRadioFromValue = (groupName, value, ranges) => {
            if (value === null || isNaN(value))
                return;
            const range = ranges.find(r => r.condition(value));
            if (range) {
                const radio = container.querySelector(`input[name="${groupName}"][value="${range.value}"]`);
                if (radio) {
                    radio.checked = true;
                    // calculate(); // Removing direct call here to avoid double calls if event bubbles, but radio change listener catches it? 
                    // Actually, if we change checked programmatically, 'change' event DOES NOT fire automatically. We must dispatch it or call calculate.
                    // But we don't want to dispatch change to avoid loops if listeners are set up weirdly. 
                    // Safest is to call calculate directly or modify logic.
                    calculate();
                }
            }
        };
        const plateletInput = container.querySelector('#isth-platelet-input');
        const ddimerInput = container.querySelector('#isth-ddimer-input');
        const ptInput = container.querySelector('#isth-pt-input');
        const fibrinogenInput = container.querySelector('#isth-fibrinogen-input');
        // Event listeners for inputs to auto-select radios
        if (plateletInput)
            plateletInput.addEventListener('input', function () {
                const value = UnitConverter.getStandardValue(this, '×10⁹/L'); // Standard is 10^9/L (same as K/uL number-wise)
                setRadioFromValue('isth-platelet', value, [
                    { condition: v => v >= 100, value: '0' },
                    { condition: v => v >= 50 && v < 100, value: '1' },
                    { condition: v => v < 50, value: '2' }
                ]);
            });
        if (ddimerInput)
            ddimerInput.addEventListener('input', function () {
                const value = UnitConverter.getStandardValue(this, 'mg/L'); // Standard is mg/L
                setRadioFromValue('isth-fibrin_marker', value, [
                    { condition: v => v < 0.5, value: '0' },
                    { condition: v => v >= 0.5 && v <= 5, value: '2' },
                    { condition: v => v > 5, value: '3' }
                ]);
            });
        if (ptInput)
            ptInput.addEventListener('input', function () {
                const value = parseFloat(this.value);
                if (!isNaN(value)) {
                    const prolongation = value - 12; // Assuming normal PT is 12s
                    setRadioFromValue('isth-pt', prolongation, [
                        { condition: v => v < 3, value: '0' },
                        { condition: v => v >= 3 && v < 6, value: '1' },
                        { condition: v => v >= 6, value: '2' }
                    ]);
                }
            });
        if (fibrinogenInput)
            fibrinogenInput.addEventListener('input', function () {
                const value = UnitConverter.getStandardValue(this, 'g/L'); // Standard is g/L
                setRadioFromValue('isth-fibrinogen', value, [
                    { condition: v => v >= 1, value: '0' },
                    { condition: v => v < 1, value: '1' }
                ]);
            });
        // Also listen for radio changes manually
        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', calculate);
        });
        // FHIR Integration
        if (client) {
            getMostRecentObservation(client, '26515-7').then(obs => {
                if (obs && obs.valueQuantity) {
                    if (plateletInput) {
                        plateletInput.value = obs.valueQuantity.value.toFixed(0);
                        plateletInput.dispatchEvent(new Event('input'));
                        stalenessTracker.trackObservation('#isth-platelet-input', obs, '26515-7', 'Platelets');
                    }
                }
            }).catch(e => console.warn(e));
            getMostRecentObservation(client, '48065-7').then(obs => {
                // Note: D-Dimer LOINC might vary, 48065-7 is Fibrin D-dimer DDU
                if (obs && obs.valueQuantity) {
                    if (ddimerInput) {
                        ddimerInput.value = obs.valueQuantity.value.toFixed(2);
                        ddimerInput.dispatchEvent(new Event('input'));
                        stalenessTracker.trackObservation('#isth-ddimer-input', obs, '48065-7', 'D-dimer');
                    }
                }
            }).catch(e => console.warn(e));
            getMostRecentObservation(client, LOINC_CODES.PT).then(obs => {
                if (obs && obs.valueQuantity) {
                    if (ptInput) {
                        ptInput.value = obs.valueQuantity.value.toFixed(1);
                        ptInput.dispatchEvent(new Event('input'));
                        stalenessTracker.trackObservation('#isth-pt-input', obs, LOINC_CODES.PT, 'PT');
                    }
                }
            }).catch(e => console.warn(e));
            getMostRecentObservation(client, '3255-7').then(obs => {
                if (obs && obs.valueQuantity) {
                    if (fibrinogenInput) {
                        fibrinogenInput.value = obs.valueQuantity.value.toFixed(2);
                        fibrinogenInput.dispatchEvent(new Event('input'));
                        stalenessTracker.trackObservation('#isth-fibrinogen-input', obs, '3255-7', 'Fibrinogen');
                    }
                }
            }).catch(e => console.warn(e));
        }
        calculate();
    }
};
