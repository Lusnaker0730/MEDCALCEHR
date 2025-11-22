import { getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';

export const ibw = {
    id: 'ibw',
    title: 'Ideal & Adjusted Body Weight',
    description: 'Calculates ideal body weight (IBW) and adjusted body weight (ABW) using the Devine formula.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            ${uiBuilder.createSection({
                title: 'Patient Information',
                content: `
                    ${uiBuilder.createRadioGroup({
                        name: 'ibw-gender',
                        label: 'Gender',
                        options: [
                            { label: 'Male', value: 'male', checked: true },
                            { label: 'Female', value: 'female' }
                        ]
                    })}
                    ${uiBuilder.createInput({
                        id: 'ibw-height',
                        label: 'Height',
                        type: 'number',
                        unit: 'cm',
                        placeholder: 'Enter height'
                    })}
                    ${uiBuilder.createInput({
                        id: 'ibw-actual',
                        label: 'Actual Weight',
                        type: 'number',
                        unit: 'kg',
                        placeholder: 'Enter weight'
                    })}
                `
            })}
            ${uiBuilder.createResultBox({ id: 'ibw-result', title: 'Body Weight Results' })}
            ${uiBuilder.createFormulaSection({
                items: [
                    { label: 'IBW (Male)', formula: '50 + 2.3 × (height in inches - 60)' },
                    { label: 'IBW (Female)', formula: '45.5 + 2.3 × (height in inches - 60)' },
                    { label: 'ABW', formula: 'IBW + 0.4 × (Actual Weight - IBW)' }
                ],
                notes: 'ABW is calculated only when actual weight exceeds IBW.'
            })}
            ${uiBuilder.createAlert({
                type: 'info',
                message: `
                    <h4>Clinical Applications</h4>
                    <ul>
                        <li><strong>Ideal Body Weight (IBW):</strong> Drug dosing for medications with narrow therapeutic index, nutritional assessment, ventilator settings.</li>
                        <li><strong>Adjusted Body Weight (ABW):</strong> Drug dosing in obese patients (actual weight > IBW), aminoglycoside dosing.</li>
                    </ul>
                `
            })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const heightInput = container.querySelector('#ibw-height');
        const actualWeightInput = container.querySelector('#ibw-actual');
        const resultBox = container.querySelector('#ibw-result');

        const calculate = () => {
            const heightCm = parseFloat(heightInput.value);
            const actualWeight = parseFloat(actualWeightInput.value);
            const genderRadio = container.querySelector('input[name="ibw-gender"]:checked');
            const isMale = genderRadio ? genderRadio.value === 'male' : true;

            if (isNaN(heightCm) || heightCm <= 0) {
                resultBox.classList.remove('show');
                return;
            }

            const heightIn = heightCm / 2.54;
            let ibw = 0;
            if (heightIn > 60) {
                if (isMale) {
                    ibw = 50 + 2.3 * (heightIn - 60);
                } else {
                    ibw = 45.5 + 2.3 * (heightIn - 60);
                }
            } else {
                ibw = isMale ? 50 : 45.5;
            }

            let resultItems = [];
            resultItems.push(uiBuilder.createResultItem({
                label: 'Ideal Body Weight (IBW)',
                value: ibw.toFixed(1),
                unit: 'kg'
            }));

            if (!isNaN(actualWeight) && actualWeight > 0) {
                if (actualWeight > ibw) {
                    const adjBw = ibw + 0.4 * (actualWeight - ibw);
                    const percentOver = (((actualWeight - ibw) / ibw) * 100).toFixed(0);
                    
                    resultItems.push(uiBuilder.createResultItem({
                        label: 'Adjusted Body Weight (ABW)',
                        value: adjBw.toFixed(1),
                        unit: 'kg'
                    }));

                    resultItems.push(uiBuilder.createAlert({
                        type: 'info',
                        message: `Actual weight is ${percentOver}% above IBW. Use ABW for drug dosing in obese patients.`
                    }));
                } else if (actualWeight < ibw) {
                    const percentUnder = (((ibw - actualWeight) / ibw) * 100).toFixed(0);
                    resultItems.push(uiBuilder.createAlert({
                        type: 'warning',
                        message: `Actual weight is ${percentUnder}% below IBW. Use actual body weight for drug dosing.`
                    }));
                } else {
                    resultItems.push(uiBuilder.createAlert({
                        type: 'info',
                        message: 'Actual weight is at ideal body weight. Use IBW for drug dosing.'
                    }));
                }
            }

            resultBox.querySelector('.ui-result-content').innerHTML = resultItems.join('');
            resultBox.classList.add('show');
        };

        [heightInput, actualWeightInput].forEach(input => input.addEventListener('input', calculate));
        container.querySelectorAll('input[name="ibw-gender"]').forEach(radio => radio.addEventListener('change', calculate));

        // Set gender from patient data
        if (patient && patient.gender) {
            uiBuilder.setRadioValue('ibw-gender', patient.gender.toLowerCase());
        }

        // Auto-populate from FHIR
        getMostRecentObservation(client, LOINC_CODES.HEIGHT).then(obs => {
            if (obs && obs.valueQuantity) {
                heightInput.value = obs.valueQuantity.value.toFixed(1);
                calculate();
            }
        });
        getMostRecentObservation(client, LOINC_CODES.WEIGHT).then(obs => {
            if (obs && obs.valueQuantity) {
                actualWeightInput.value = obs.valueQuantity.value.toFixed(1);
                calculate();
            }
        });

        calculate();
    }
};
