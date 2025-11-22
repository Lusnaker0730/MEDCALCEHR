import { getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';

export const tpaDosing = {
    id: 'tpa-dosing',
    title: 'tPA (Alteplase) Dosing for Ischemic Stroke',
    description: 'Calculates tPA (alteplase) dosing for acute ischemic stroke based on patient weight.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            ${uiBuilder.createSection({
                title: 'Patient Details',
                content: `
                    ${uiBuilder.createInput({
                        id: 'tpa-weight',
                        label: 'Weight',
                        type: 'number',
                        unit: 'kg',
                        placeholder: 'Enter weight'
                    })}
                `
            })}
            ${uiBuilder.createResultBox({ id: 'tpa-result', title: 'Dosing Guidelines' })}
            ${uiBuilder.createFormulaSection({
                items: [
                    {
                        label: 'Total Dose',
                        formula: '0.9 mg/kg (Max 90 mg)'
                    },
                    {
                        label: 'Bolus Dose',
                        formula: '10% of total dose over 1 minute'
                    },
                    {
                        label: 'Infusion Dose',
                        formula: '90% of total dose over 60 minutes'
                    }
                ]
            })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const weightEl = container.querySelector('#tpa-weight');
        const resultBox = container.querySelector('#tpa-result');

        const calculate = () => {
            let weight = parseFloat(weightEl.value);

            if (isNaN(weight) || weight <= 0) {
                resultBox.classList.remove('show');
                return;
            }

            // If weight > 100 kg, use 100 kg for calculation as max dose is 90mg.
            const effectiveWeight = weight > 100 ? 100 : weight;
            const totalDose = effectiveWeight * 0.9;
            const bolusDose = totalDose * 0.1;
            const infusionDose = totalDose * 0.9;

            resultBox.querySelector('.ui-result-content').innerHTML = `
                ${uiBuilder.createResultItem({
                    label: 'Total Dose',
                    value: totalDose.toFixed(2),
                    unit: 'mg',
                    interpretation: weight > 100 ? '(Capped at 90 mg max)' : ''
                })}
                ${uiBuilder.createResultItem({
                    label: 'Bolus Dose (10%)',
                    value: bolusDose.toFixed(2),
                    unit: 'mg',
                    interpretation: 'Give over 1 minute'
                })}
                ${uiBuilder.createResultItem({
                    label: 'Infusion Dose (90%)',
                    value: infusionDose.toFixed(2),
                    unit: 'mg',
                    interpretation: 'Infuse over 60 minutes'
                })}
            `;
            resultBox.classList.add('show');
        };

        weightEl.addEventListener('input', calculate);

        getMostRecentObservation(client, LOINC_CODES.WEIGHT).then(obs => {
            if (obs && obs.valueQuantity) {
                weightEl.value = obs.valueQuantity.value.toFixed(1);
                calculate();
            }
        });

        calculate();
    }
};
