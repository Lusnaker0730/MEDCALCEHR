import {
    getMostRecentObservation,
} from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';

export const serumOsmolality = {
    id: 'serum-osmolality',
    title: 'Serum Osmolality/Osmolarity',
    description:
        'Calculates expected serum osmolarity, for comparison to measured osmolality to detect unmeasured compounds in the serum.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            ${uiBuilder.createSection({
                title: 'Lab Values',
                icon: '🧪',
                content: `
                    ${uiBuilder.createInput({
                        id: 'osmo-na',
                        label: 'Sodium (Na)',
                        type: 'number',
                        placeholder: 'e.g., 140',
                        unit: 'mEq/L'
                    })}
                    ${uiBuilder.createInput({
                        id: 'osmo-glucose',
                        label: 'Glucose',
                        type: 'number',
                        placeholder: 'e.g., 100',
                        unitToggle: {
                            type: 'glucose',
                            units: ['mg/dL', 'mmol/L'],
                            defaultUnit: 'mg/dL'
                        }
                    })}
                    ${uiBuilder.createInput({
                        id: 'osmo-bun',
                        label: 'BUN',
                        type: 'number',
                        placeholder: 'e.g., 15',
                        unitToggle: {
                            type: 'bun',
                            units: ['mg/dL', 'mmol/L'],
                            defaultUnit: 'mg/dL'
                        }
                    })}
                    ${uiBuilder.createInput({
                        id: 'osmo-ethanol',
                        label: 'Ethanol (Optional)',
                        type: 'number',
                        placeholder: 'e.g., 0',
                        unit: 'mg/dL',
                        helpText: 'If known, improves accuracy in suspected ingestion.'
                    })}
                `
            })}
            
            ${uiBuilder.createResultBox({ id: 'osmolality-result', title: 'Calculated Serum Osmolality' })}
            
            ${uiBuilder.createFormulaSection({
                items: [
                    { label: 'Osmolality', formula: '2 × Na + (Glucose / 18) + (BUN / 2.8) + (Ethanol / 4.6)' }
                ]
            })}

            ${uiBuilder.createAlert({
                type: 'info',
                message: `
                    <h4>Normal Range:</h4>
                    <p>275-295 mOsm/kg</p>
                    <p class="mt-10"><strong>Osmolar Gap:</strong> Measured Osmolality - Calculated Osmolality</p>
                    <p>Gap > 10 mOsm/kg suggests unmeasured osmoles (e.g., toxic alcohols, ketones).</p>
                `
            })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const naInput = container.querySelector('#osmo-na');
        const glucoseInput = container.querySelector('#osmo-glucose');
        const bunInput = container.querySelector('#osmo-bun');
        const ethanolInput = container.querySelector('#osmo-ethanol');
        const resultBox = container.querySelector('#osmolality-result');

        const calculateAndUpdate = () => {
            const na = parseFloat(naInput.value);
            const glucoseMgDl = UnitConverter.getStandardValue(glucoseInput, 'mg/dL');
            const bunMgDl = UnitConverter.getStandardValue(bunInput, 'mg/dL');
            const ethanol = parseFloat(ethanolInput.value) || 0;

            if (isNaN(na) || isNaN(glucoseMgDl) || isNaN(bunMgDl)) {
                resultBox.classList.remove('show');
                return;
            }

            const calculatedOsmolality = 2 * na + glucoseMgDl / 18 + bunMgDl / 2.8 + ethanol / 4.6;

            // Determine interpretation
            let interpretation = '';
            let alertClass = 'ui-alert-success';
            let alertType = 'success';
            let alertMsg = 'Within normal range.';

            if (calculatedOsmolality < 275) {
                interpretation = 'Low Osmolality';
                alertClass = 'ui-alert-info';
                alertType = 'info';
                alertMsg = 'Below normal range (275-295 mOsm/kg).';
            } else if (calculatedOsmolality > 295) {
                interpretation = 'High Osmolality';
                alertClass = 'ui-alert-warning';
                alertType = 'warning';
                alertMsg = 'Above normal range (275-295 mOsm/kg).';
            }

            const resultContent = resultBox.querySelector('.ui-result-content');
            resultContent.innerHTML = `
                ${uiBuilder.createResultItem({
                    label: 'Calculated Osmolality',
                    value: calculatedOsmolality.toFixed(1),
                    unit: 'mOsm/kg',
                    interpretation: interpretation,
                    alertClass: alertClass
                })}
                ${uiBuilder.createAlert({
                    type: alertType,
                    message: alertMsg
                })}
                ${uiBuilder.createSection({
                    title: 'Calculation Breakdown',
                    content: `
                        <div style="font-size: 0.9em; color: #555;">
                            <div>2 × Na: ${(2 * na).toFixed(1)}</div>
                            <div>Glucose / 18: ${(glucoseMgDl / 18).toFixed(1)}</div>
                            <div>BUN / 2.8: ${(bunMgDl / 2.8).toFixed(1)}</div>
                            ${ethanol > 0 ? `<div>Ethanol / 4.6: ${(ethanol / 4.6).toFixed(1)}</div>` : ''}
                        </div>
                    `
                })}
            `;
            resultBox.classList.add('show');
        };

        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculateAndUpdate);
            input.addEventListener('change', calculateAndUpdate);
        });

        // Auto-populate
        if (client) {
            getMostRecentObservation(client, LOINC_CODES.SODIUM).then(obs => {
                if (obs && obs.valueQuantity) {
                    naInput.value = obs.valueQuantity.value.toFixed(0);
                    naInput.dispatchEvent(new Event('input'));
                }
            });
            getMostRecentObservation(client, LOINC_CODES.GLUCOSE).then(obs => {
                if (obs && obs.valueQuantity) {
                    glucoseInput.value = obs.valueQuantity.value.toFixed(0);
                    glucoseInput.dispatchEvent(new Event('input'));
                }
            });
            getMostRecentObservation(client, LOINC_CODES.BUN).then(obs => {
                if (obs && obs.valueQuantity) {
                    bunInput.value = obs.valueQuantity.value.toFixed(0);
                    bunInput.dispatchEvent(new Event('input'));
                }
            });
        }
        
        calculateAndUpdate();
    }
};
