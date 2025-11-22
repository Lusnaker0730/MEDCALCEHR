import {
    getMostRecentObservation,
} from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';

export const serumAnionGap = {
    id: 'serum-anion-gap',
    title: 'Serum Anion Gap',
    description: 'Evaluates states of metabolic acidosis.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            ${uiBuilder.createSection({
                title: 'Electrolytes',
                icon: '🧪',
                content: `
                    ${uiBuilder.createInput({
                        id: 'sag-na',
                        label: 'Sodium (Na⁺)',
                        type: 'number',
                        placeholder: 'e.g., 140',
                        unit: 'mEq/L'
                    })}
                    ${uiBuilder.createInput({
                        id: 'sag-cl',
                        label: 'Chloride (Cl⁻)',
                        type: 'number',
                        placeholder: 'e.g., 100',
                        unit: 'mEq/L'
                    })}
                    ${uiBuilder.createInput({
                        id: 'sag-hco3',
                        label: 'Bicarbonate (HCO₃⁻)',
                        type: 'number',
                        placeholder: 'e.g., 24',
                        unit: 'mEq/L'
                    })}
                `
            })}
            
            ${uiBuilder.createResultBox({ id: 'sag-result', title: 'Anion Gap Result' })}
            
            ${uiBuilder.createFormulaSection({
                items: [
                    { label: 'Anion Gap', formula: 'Na⁺ - (Cl⁻ + HCO₃⁻)' }
                ]
            })}

            ${uiBuilder.createAlert({
                type: 'info',
                message: `
                    <h4>Interpretation:</h4>
                    <ul style="margin-top: 5px; padding-left: 20px;">
                        <li><strong>Normal Range:</strong> 6-12 mEq/L</li>
                        <li><strong>High (>12):</strong> High Anion Gap Metabolic Acidosis (MUDPILES)</li>
                        <li><strong>Low (<6):</strong> Uncommon, possible lab error or hypoalbuminemia</li>
                    </ul>
                    <p class="mt-10"><strong>Note:</strong> For every 1 g/dL decrease in albumin below 4 g/dL, add 2.5 mEq/L to the anion gap (corrected gap).</p>
                `
            })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const naInput = container.querySelector('#sag-na');
        const clInput = container.querySelector('#sag-cl');
        const hco3Input = container.querySelector('#sag-hco3');
        const resultBox = container.querySelector('#sag-result');

        const calculate = () => {
            const na = parseFloat(naInput.value);
            const cl = parseFloat(clInput.value);
            const hco3 = parseFloat(hco3Input.value);

            if (isNaN(na) || isNaN(cl) || isNaN(hco3)) {
                resultBox.classList.remove('show');
                return;
            }

            const anionGap = na - (cl + hco3);

            let interpretation = '';
            let alertClass = 'ui-alert-success';
            let alertType = 'success';
            let alertMsg = '';

            if (anionGap > 12) {
                interpretation = 'High Anion Gap';
                alertClass = 'ui-alert-danger';
                alertType = 'danger';
                alertMsg = 'Suggests metabolic acidosis (e.g., DKA, lactic acidosis, renal failure, toxic ingestions - MUDPILES).';
            } else if (anionGap < 6) {
                interpretation = 'Low Anion Gap';
                alertClass = 'ui-alert-warning';
                alertType = 'warning';
                alertMsg = 'Less common, may be due to lab error, hypoalbuminemia, or paraproteinemia.';
            } else {
                interpretation = 'Normal Anion Gap';
                alertClass = 'ui-alert-success';
                alertType = 'success';
                alertMsg = 'Metabolic acidosis, if present, is likely non-anion gap (e.g., diarrhea, renal tubular acidosis).';
            }

            const resultContent = resultBox.querySelector('.ui-result-content');
            resultContent.innerHTML = `
                ${uiBuilder.createResultItem({
                    label: 'Serum Anion Gap',
                    value: anionGap.toFixed(1),
                    unit: 'mEq/L',
                    interpretation: interpretation,
                    alertClass: alertClass
                })}
                ${uiBuilder.createAlert({
                    type: alertType,
                    message: alertMsg
                })}
            `;
            resultBox.classList.add('show');
        };

        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculate);
            input.addEventListener('change', calculate);
        });

        // Auto-populate from FHIR
        if (client) {
            getMostRecentObservation(client, LOINC_CODES.SODIUM).then(obs => {
                if (obs && obs.valueQuantity) {
                    naInput.value = obs.valueQuantity.value.toFixed(0);
                    calculate();
                }
            });
            getMostRecentObservation(client, LOINC_CODES.CHLORIDE).then(obs => {
                if (obs && obs.valueQuantity) {
                    clInput.value = obs.valueQuantity.value.toFixed(0);
                    calculate();
                }
            });
            getMostRecentObservation(client, LOINC_CODES.BICARBONATE).then(obs => {
                if (obs && obs.valueQuantity) {
                    hco3Input.value = obs.valueQuantity.value.toFixed(0);
                    calculate();
                }
            });
        }
        
        calculate();
    }
};
