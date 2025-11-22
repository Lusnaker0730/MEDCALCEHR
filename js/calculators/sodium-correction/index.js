import {
    getMostRecentObservation,
} from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';

export const sodiumCorrection = {
    id: 'sodium-correction',
    title: 'Sodium Correction for Hyperglycemia',
    description: 'Calculates the actual sodium level in patients with hyperglycemia.',
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
                        id: 'measured-sodium',
                        label: 'Measured Sodium (mEq/L)',
                        type: 'number',
                        placeholder: 'e.g., 135',
                        unit: 'mEq/L'
                    })}
                    ${uiBuilder.createInput({
                        id: 'glucose',
                        label: 'Serum Glucose',
                        type: 'number',
                        placeholder: 'e.g., 400',
                        unitToggle: {
                            type: 'glucose',
                            units: ['mg/dL', 'mmol/L'],
                            defaultUnit: 'mg/dL'
                        }
                    })}
                    ${uiBuilder.createRadioGroup({
                        name: 'correction-factor',
                        label: 'Correction Factor',
                        options: [
                            { value: '1.6', label: '1.6 (Standard, Hillier)', checked: true },
                            { value: '2.4', label: '2.4 (Katz, suggested for Glucose > 400 mg/dL)' }
                        ],
                        helpText: 'Standard factor is 1.6 mEq/L for every 100 mg/dL glucose above 100. Some suggest 2.4 when glucose > 400 mg/dL.'
                    })}
                `
            })}
            
            ${uiBuilder.createResultBox({ id: 'sodium-correction-result', title: 'Corrected Sodium' })}
            
            ${uiBuilder.createFormulaSection({
                items: [
                    { label: 'Corrected Na', formula: 'Measured Na + [Correction Factor × (Glucose - 100) / 100]' }
                ]
            })}

            ${uiBuilder.createAlert({
                type: 'info',
                message: `
                    <h4>Normal Values:</h4>
                    <ul style="margin-top: 5px; padding-left: 20px;">
                        <li>Normal Sodium: 136-145 mEq/L</li>
                        <li>Normal Glucose: 70-100 mg/dL</li>
                    </ul>
                `
            })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const sodiumInput = container.querySelector('#measured-sodium');
        const glucoseInput = container.querySelector('#glucose');
        const resultBox = container.querySelector('#sodium-correction-result');

        const calculateAndUpdate = () => {
            const measuredSodium = parseFloat(sodiumInput.value);
            const glucoseMgDl = UnitConverter.getStandardValue(glucoseInput, 'mg/dL');
            const correctionFactor = parseFloat(container.querySelector('input[name="correction-factor"]:checked').value);

            if (isNaN(measuredSodium) || isNaN(glucoseMgDl) || measuredSodium <= 0 || glucoseMgDl <= 0) {
                resultBox.classList.remove('show');
                return;
            }

            const correctedSodium = measuredSodium + correctionFactor * ((glucoseMgDl - 100) / 100);

            let status = '';
            let alertType = 'success';
            if (correctedSodium < 136) {
                status = 'Low (Hyponatremia)';
                alertType = 'info';
            } else if (correctedSodium > 145) {
                status = 'High (Hypernatremia)';
                alertType = 'danger';
            } else {
                status = 'Normal';
                alertType = 'success';
            }

            const resultContent = resultBox.querySelector('.ui-result-content');
            resultContent.innerHTML = `
                ${uiBuilder.createResultItem({
                    label: 'Corrected Sodium',
                    value: correctedSodium.toFixed(1),
                    unit: 'mEq/L',
                    interpretation: status,
                    alertClass: `ui-alert-${alertType}`
                })}
                ${uiBuilder.createResultItem({
                    label: 'Measured Sodium',
                    value: measuredSodium,
                    unit: 'mEq/L'
                })}
                ${uiBuilder.createResultItem({
                    label: 'Correction',
                    value: `+${(correctedSodium - measuredSodium).toFixed(1)}`,
                    unit: 'mEq/L'
                })}
            `;
            
            if (correctionFactor === 1.6 && glucoseMgDl > 400) {
                resultContent.innerHTML += uiBuilder.createAlert({
                    type: 'warning',
                    message: 'Glucose > 400 mg/dL. Consider using correction factor of 2.4.'
                });
            }
            
            resultBox.classList.add('show');
        };

        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculateAndUpdate);
            input.addEventListener('change', calculateAndUpdate);
        });

        if (client) {
            const sodiumPromise = getMostRecentObservation(client, LOINC_CODES.SODIUM);
            const glucosePromise = getMostRecentObservation(client, LOINC_CODES.GLUCOSE);

            Promise.all([sodiumPromise, glucosePromise]).then(([sodiumObs, glucoseObs]) => {
                if (sodiumObs && sodiumObs.valueQuantity) {
                    sodiumInput.value = sodiumObs.valueQuantity.value.toFixed(0);
                }
                if (glucoseObs && glucoseObs.valueQuantity) {
                    glucoseInput.value = glucoseObs.valueQuantity.value.toFixed(0);
                    // Trigger update
                    glucoseInput.dispatchEvent(new Event('input'));
                }
                calculateAndUpdate();
            });
        }

        calculateAndUpdate();
    }
};
