import { getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';

export const ethanolConcentration = {
    id: 'ethanol-concentration',
    title: 'Estimated Ethanol (and Toxic Alcohol) Serum Concentration Based on Ingestion',
    description: 'Predicts ethanol concentration based on ingestion of alcohol.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            ${uiBuilder.createSection({
                title: 'Ingestion Details',
                content: `
                    ${uiBuilder.createInput({
                        id: 'eth-amount',
                        label: 'Amount Ingested',
                        type: 'number',
                        unit: 'ounces',
                        defaultValue: '1.5',
                        step: '0.1'
                    })}
                    ${uiBuilder.createInput({
                        id: 'eth-abv',
                        label: 'Alcohol by Volume',
                        type: 'number',
                        unit: '%',
                        defaultValue: '40',
                        step: '1'
                    })}
                `
            })}
            ${uiBuilder.createSection({
                title: 'Patient Information',
                content: `
                    ${uiBuilder.createInput({
                        id: 'eth-weight',
                        label: 'Patient Weight',
                        type: 'number',
                        unit: 'kg',
                        placeholder: '70',
                        step: '0.1'
                    })}
                    ${uiBuilder.createRadioGroup({
                        name: 'eth-gender',
                        label: 'Gender',
                        options: [
                            { label: 'Male (Vd = 0.68 L/kg)', value: 'male', checked: true },
                            { label: 'Female (Vd = 0.55 L/kg)', value: 'female' }
                        ]
                    })}
                `
            })}
            ${uiBuilder.createResultBox({ id: 'ethanol-result', title: 'Estimated Peak Concentration' })}
            ${uiBuilder.createAlert({
                type: 'info',
                message: `
                    <h4>Clinical Reference</h4>
                    <ul>
                        <li><strong>Legal limit (US driving):</strong> 80 mg/dL (0.08%)</li>
                        <li><strong>Severe intoxication:</strong> Usually >300 mg/dL</li>
                        <li><strong>Potentially fatal:</strong> >400-500 mg/dL</li>
                        <li><strong>Metabolism rate:</strong> ~15-20 mg/dL/hour</li>
                        <li><strong>Peak time:</strong> 30-90 min after ingestion (empty stomach)</li>
                    </ul>
                `
            })}
            ${uiBuilder.createFormulaSection({
                items: [
                    { label: 'Volume (mL)', formula: 'Amount (oz) × 29.57' },
                    { label: 'Grams of Alcohol', formula: 'Volume (mL) × (ABV% / 100) × 0.789' },
                    { label: 'Concentration (mg/dL)', formula: '(Grams × 1000) / (Weight (kg) × Vd × 10)' }
                ],
                notes: 'Vd (Volume of Distribution): Male 0.68 L/kg, Female 0.55 L/kg. Ethanol density: 0.789 g/mL.'
            })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const amountEl = container.querySelector('#eth-amount');
        const abvEl = container.querySelector('#eth-abv');
        const weightEl = container.querySelector('#eth-weight');
        const resultBox = container.querySelector('#ethanol-result');

        const calculate = () => {
            const amountOz = parseFloat(amountEl.value);
            const abv = parseFloat(abvEl.value);
            const weightKg = parseFloat(weightEl.value);
            const genderEl = container.querySelector('input[name="eth-gender"]:checked');

            if (isNaN(amountOz) || isNaN(abv) || isNaN(weightKg) || !genderEl) {
                resultBox.classList.remove('show');
                return;
            }

            const gender = genderEl.value;
            const volumeDistribution = gender === 'male' ? 0.68 : 0.55; // L/kg
            const gramsAlcohol = amountOz * 29.57 * (abv / 100) * 0.789; // oz -> mL -> g
            const concentrationMgDl = (gramsAlcohol * 1000) / (weightKg * volumeDistribution * 10); // mg/dL

            let severityText = 'Below Legal Limit';
            let alertClass = 'ui-alert-success';
            
            if (concentrationMgDl >= 400) {
                severityText = 'Potentially Fatal Level';
                alertClass = 'ui-alert-danger';
            } else if (concentrationMgDl >= 300) {
                severityText = 'Severe Intoxication';
                alertClass = 'ui-alert-danger';
            } else if (concentrationMgDl >= 80) {
                severityText = 'Above Legal Limit (0.08%)';
                alertClass = 'ui-alert-warning';
            }

            resultBox.querySelector('.ui-result-content').innerHTML = `
                ${uiBuilder.createResultItem({
                    label: 'Estimated Concentration',
                    value: concentrationMgDl.toFixed(0),
                    unit: 'mg/dL',
                    alertClass: alertClass,
                    interpretation: severityText
                })}
            `;
            resultBox.classList.add('show');
        };

        [amountEl, abvEl, weightEl].forEach(input => input.addEventListener('input', calculate));
        container.querySelectorAll('input[name="eth-gender"]').forEach(radio => radio.addEventListener('change', calculate));

        // Set default gender based on patient
        if (patient && patient.gender) {
            uiBuilder.setRadioValue('eth-gender', patient.gender.toLowerCase());
        }

        // FHIR auto-populate weight
        getMostRecentObservation(client, LOINC_CODES.WEIGHT).then(obs => {
            if (obs && obs.valueQuantity) {
                weightEl.value = obs.valueQuantity.value.toFixed(1);
                calculate();
            }
        });

        calculate();
    }
};
