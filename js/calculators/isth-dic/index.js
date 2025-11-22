import {
    getMostRecentObservation,
    getValueInStandardUnit
} from '../../utils.js';
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
                            unitToggle: true
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
                            unitToggle: true
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
                            unitToggle: true
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

        // Initialize unit converters
        UnitConverter.createUnitToggle(container.querySelector('#isth-platelet-input'), 'platelet', ['×10⁹/L', 'K/µL']);
        UnitConverter.createUnitToggle(container.querySelector('#isth-ddimer-input'), 'ddimer', ['mg/L', 'µg/mL', 'ng/mL']);
        UnitConverter.createUnitToggle(container.querySelector('#isth-fibrinogen-input'), 'fibrinogen', ['g/L', 'mg/dL']);

        const calculate = () => {
            const groups = ['isth-platelet', 'isth-fibrin_marker', 'isth-pt', 'isth-fibrinogen'];
            let score = 0;
            
            groups.forEach(group => {
                const checked = container.querySelector(`input[name="${group}"]:checked`);
                if (checked) score += parseInt(checked.value);
            });

            const resultBox = container.querySelector('#isth-dic-result');
            const resultContent = resultBox.querySelector('.ui-result-content');

            let interpretation = '';
            let alertType = 'info';

            if (score >= 5) {
                interpretation = 'Compatible with overt DIC. Repeat score daily.';
                alertType = 'danger';
            } else {
                interpretation = 'Not suggestive of overt DIC. May be non-overt DIC. Repeat within 1-2 days.';
                alertType = 'success';
            }

            resultContent.innerHTML = `
                ${uiBuilder.createResultItem({
                    label: 'Total Score',
                    value: score,
                    unit: 'points',
                    interpretation: score >= 5 ? 'Overt DIC' : 'Not Overt DIC',
                    alertClass: `ui-alert-${alertType}`
                })}
                ${uiBuilder.createAlert({
                    type: alertType,
                    message: interpretation
                })}
            `;
            resultBox.classList.add('show');
        };

        // Helper to set radio based on input value
        const setRadioFromValue = (groupName, value, ranges) => {
            if (value === null || isNaN(value)) return;
            const range = ranges.find(r => r.condition(value));
            if (range) {
                const radio = container.querySelector(`input[name="${groupName}"][value="${range.value}"]`);
                if (radio) {
                    radio.checked = true;
                    calculate(); // Recalculate when radio changes
                }
            }
        };

        // Event listeners for inputs to auto-select radios
        container.querySelector('#isth-platelet-input').addEventListener('input', function() {
            const value = UnitConverter.getStandardValue(this); // Standard is 10^9/L
            setRadioFromValue('isth-platelet', value, [
                { condition: v => v >= 100, value: '0' },
                { condition: v => v >= 50 && v < 100, value: '1' },
                { condition: v => v < 50, value: '2' }
            ]);
        });

        container.querySelector('#isth-ddimer-input').addEventListener('input', function() {
            const value = UnitConverter.getStandardValue(this); // Standard is mg/L
            setRadioFromValue('isth-fibrin_marker', value, [
                { condition: v => v < 0.5, value: '0' },
                { condition: v => v >= 0.5 && v <= 5, value: '2' },
                { condition: v => v > 5, value: '3' }
            ]);
        });

        container.querySelector('#isth-pt-input').addEventListener('input', function() {
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

        container.querySelector('#isth-fibrinogen-input').addEventListener('input', function() {
            const value = UnitConverter.getStandardValue(this); // Standard is g/L
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
            getMostRecentObservation(client, '26515-7').then(obs => { // Platelets
                if (obs && obs.valueQuantity) {
                    const input = container.querySelector('#isth-platelet-input');
                    input.value = obs.valueQuantity.value.toFixed(0);
                    input.dispatchEvent(new Event('input'));
                }
            });
            getMostRecentObservation(client, '48065-7').then(obs => { // D-dimer
                if (obs && obs.valueQuantity) {
                    const input = container.querySelector('#isth-ddimer-input');
                    input.value = obs.valueQuantity.value.toFixed(2);
                    input.dispatchEvent(new Event('input'));
                }
            });
            getMostRecentObservation(client, LOINC_CODES.PT).then(obs => { // PT
                if (obs && obs.valueQuantity) {
                    const input = container.querySelector('#isth-pt-input');
                    input.value = obs.valueQuantity.value.toFixed(1);
                    input.dispatchEvent(new Event('input'));
                }
            });
            getMostRecentObservation(client, '3255-7').then(obs => { // Fibrinogen
                if (obs && obs.valueQuantity) {
                    const input = container.querySelector('#isth-fibrinogen-input');
                    input.value = obs.valueQuantity.value.toFixed(2);
                    input.dispatchEvent(new Event('input'));
                }
            });
        }

        calculate();
    }
};
