import { getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { ValidationRules, validateCalculatorInput } from '../../validator.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';

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
                placeholder: 'e.g., 1.5',
                unitToggle: { type: 'volume', units: ['fl oz', 'mL'], defaultUnit: 'fl oz' }
            })}
                    ${uiBuilder.createInput({
                id: 'eth-abv',
                label: 'Alcohol by Volume',
                type: 'number',
                unit: '%',
                placeholder: '40',
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
                placeholder: '70',
                unitToggle: { type: 'weight', units: ['kg', 'lbs'] }
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
            <div id="ethanol-result" class="ui-result-box">
                <div class="ui-result-header">Estimated Peak Concentration</div>
                <div class="ui-result-content"></div>
            </div>
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
                { label: 'Volume (mL)', formula: 'Amount (oz) × 29.57 OR Amount (mL)' },
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
            // Clear previous errors
            const existingError = container.querySelector('#eth-error');
            if (existingError) existingError.remove();

            // UnitConverter standardizes volume to 'mL' if we ask for it? 
            // Wait, UnitConverter 'volume' base units: fl oz -> mL is defined.
            // Let's check UnitConverter.js. Usually getStandardValue normalizes to a base?
            // Actually getStandardValue converts TO the target unit.
            // So we want mL.
            const volumeMl = UnitConverter.getStandardValue(amountEl, 'mL');
            const abv = parseFloat(abvEl.value);
            const weightKg = UnitConverter.getStandardValue(weightEl, 'kg');
            const genderEl = container.querySelector('input[name="eth-gender"]:checked');

            try {
                // Validation
                const inputs = { volume: volumeMl, abv: abv, weight: weightKg };
                const schema = {
                    volume: ValidationRules.volume,
                    abv: ValidationRules.abv,
                    weight: ValidationRules.weight
                };
                const validation = validateCalculatorInput(inputs, schema);

                if (!validation.isValid) {
                    const hasInput = (amountEl.value || abvEl.value || weightEl.value);
                    if (hasInput) {
                        const valsPresent = !isNaN(volumeMl) && !isNaN(abv) && !isNaN(weightKg);
                        if (valsPresent || validation.errors.some(e => !e.includes('required'))) {
                            let errorContainer = document.createElement('div');
                            errorContainer.id = 'eth-error';
                            resultBox.parentNode.insertBefore(errorContainer, resultBox);
                            displayError(errorContainer, new ValidationError(validation.errors[0], 'VALIDATION_ERROR'));
                        }
                    }
                    resultBox.classList.remove('show');
                    return;
                }

                if (!genderEl) return;

                const gender = genderEl.value;
                const volumeDistribution = gender === 'male' ? 0.68 : 0.55; // L/kg
                const gramsAlcohol = volumeMl * (abv / 100) * 0.789; // mL * % * density
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
            } catch (error) {
                logError(error, { calculator: 'ethanol-concentration', action: 'calculate' });
                if (error.name !== 'ValidationError') {
                    let errorContainer = container.querySelector('#eth-error');
                    if (!errorContainer) {
                        errorContainer = document.createElement('div');
                        errorContainer.id = 'eth-error';
                        resultBox.parentNode.insertBefore(errorContainer, resultBox);
                    }
                    displayError(errorContainer, error);
                }
                resultBox.classList.remove('show');
            }
        };

        [amountEl, abvEl, weightEl].forEach(input => {
            input.addEventListener('input', calculate);
            input.addEventListener('change', calculate); // radio/checkbox/unitToggle
        });
        container.querySelectorAll('input[name="eth-gender"]').forEach(radio => radio.addEventListener('change', calculate));

        // Set default gender based on patient
        if (patient && patient.gender) {
            uiBuilder.setRadioValue('eth-gender', patient.gender.toLowerCase(), container);
        }

        // FHIR auto-populate weight
        getMostRecentObservation(client, LOINC_CODES.WEIGHT).then(obs => {
            if (obs && obs.valueQuantity) {
                weightEl.value = obs.valueQuantity.value.toFixed(1);
                weightEl.dispatchEvent(new Event('input'));
            }
        });
    }
};
