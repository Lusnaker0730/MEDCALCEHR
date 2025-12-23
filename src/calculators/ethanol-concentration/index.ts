import { calculateEthanolConcentration } from './calculation.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { ValidationRules, validateCalculatorInput } from '../../validator.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';
import { fhirDataService } from '../../fhir-data-service.js';

interface CalculatorModule {
    id: string;
    title: string;
    description: string;
    generateHTML: () => string;
    initialize: (client: any, patient: any, container: HTMLElement) => void;
}

export const ethanolConcentration: CalculatorModule = {
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
                unitToggle: { type: 'volume', units: ['fl oz', 'mL'], default: 'fl oz' }
            })}
                    ${uiBuilder.createInput({
                id: 'eth-abv',
                label: 'Alcohol by Volume',
                type: 'number',
                unit: '%',
                placeholder: '40',
                step: 1
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
                unitToggle: { type: 'weight', units: ['kg', 'lbs'], default: 'kg' }
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
            <div id="ethanol-error-container"></div>
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
            ]
        })}
            <p class="text-sm text-muted mt-10">
                <strong>Notes:</strong> Vd (Volume of Distribution): Male 0.68 L/kg, Female 0.55 L/kg. Ethanol density: 0.789 g/mL.
            </p>
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);
        
        // Initialize FHIRDataService
        fhirDataService.initialize(client, patient, container);

        const amountEl = container.querySelector('#eth-amount') as HTMLInputElement;
        const abvEl = container.querySelector('#eth-abv') as HTMLInputElement;
        const weightEl = container.querySelector('#eth-weight') as HTMLInputElement;
        const resultBox = container.querySelector('#ethanol-result');

        const calculate = () => {
            // Clear previous errors
            const errorContainer = container.querySelector('#ethanol-error-container');
            if (errorContainer) errorContainer.innerHTML = '';

            const volumeMl = UnitConverter.getStandardValue(amountEl, 'mL');
            const abv = parseFloat(abvEl.value);
            const weightKg = UnitConverter.getStandardValue(weightEl, 'kg');
            const genderEl = container.querySelector('input[name="eth-gender"]:checked') as HTMLInputElement;

            try {
                // Validation
                const inputs = { volume: volumeMl, abv: abv, weight: weightKg };
                const schema = {
                    volume: ValidationRules.volume,
                    abv: ValidationRules.abv,
                    weight: ValidationRules.weight
                };
                // @ts-ignore
                const validation = validateCalculatorInput(inputs, schema);

                if (!validation.isValid) {
                    const hasInput = (amountEl.value || abvEl.value || weightEl.value);
                    if (hasInput) {
                        const valsPresent = volumeMl !== null && !isNaN(volumeMl) && !isNaN(abv) && weightKg !== null && !isNaN(weightKg);
                        if (valsPresent || validation.errors.some((e: string) => !e.includes('required'))) {
                            if (errorContainer) displayError(errorContainer as HTMLElement, new ValidationError(validation.errors[0], 'VALIDATION_ERROR'));
                        }
                    }
                    if (resultBox) resultBox.classList.remove('show');
                    return;
                }

                if (volumeMl === null || weightKg === null || !genderEl) return;

                const gender = genderEl.value;
                const result = calculateEthanolConcentration({
                    volumeMl,
                    abv,
                    weightKg,
                    gender
                });

                const { concentrationMgDl, severityText, alertClass } = result;

                if (resultBox) {
                    const resultContent = resultBox.querySelector('.ui-result-content');
                    if (resultContent) {
                        resultContent.innerHTML = `
                            ${uiBuilder.createResultItem({
                            label: 'Estimated Concentration',
                            value: concentrationMgDl.toFixed(0),
                            unit: 'mg/dL',
                            alertClass: alertClass,
                            interpretation: severityText
                        })}
                        `;
                    }
                    resultBox.classList.add('show');
                }
            } catch (error) {
                logError(error as Error, { calculator: 'ethanol-concentration', action: 'calculate' });
                if (errorContainer) displayError(errorContainer as HTMLElement, error as Error);
                if (resultBox) resultBox.classList.remove('show');
            }
        };

        [amountEl, abvEl, weightEl].forEach(input => {
            input.addEventListener('input', calculate);
            input.addEventListener('change', calculate); // radio/checkbox/unitToggle
        });
        container.querySelectorAll('input[name="eth-gender"]').forEach(radio => radio.addEventListener('change', calculate));

        // Set default gender based on patient using FHIRDataService
        const gender = fhirDataService.getPatientGender();
        if (gender) {
            const genderValue = gender === 'female' ? 'female' : 'male';
            const genderRadio = container.querySelector(`input[name="eth-gender"][value="${genderValue}"]`) as HTMLInputElement;
            if (genderRadio) {
                genderRadio.checked = true;
                genderRadio.dispatchEvent(new Event('change'));
            }
        }

        // FHIR auto-populate weight
        if (client) {
            fhirDataService.getObservation(LOINC_CODES.WEIGHT, { trackStaleness: true, stalenessLabel: 'Weight', targetUnit: 'kg', unitType: 'weight' }).then(result => {
                if (result.value !== null) {
                    weightEl.value = result.value.toFixed(1);
                    weightEl.dispatchEvent(new Event('input'));
                }
            }).catch(e => console.warn(e));
        }
    }
};
