import { getMostRecentObservation } from '../../utils.js';
import { createStalenessTracker } from '../../data-staleness.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { ValidationRules, validateCalculatorInput } from '../../validator.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';
export const maintenanceFluids = {
    id: 'maintenance-fluids',
    title: 'Maintenance Fluids Calculations',
    description: 'Calculates maintenance fluid requirements by weight.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            ${uiBuilder.createAlert({
            type: 'info',
            message: 'Calculates maintenance fluid requirements by weight (Holliday-Segar method).'
        })}
            
            ${uiBuilder.createSection({
            title: 'Patient Weight',
            icon: '⚖️',
            content: uiBuilder.createInput({
                id: 'weight-fluids',
                label: 'Weight',
                type: 'number',
                placeholder: 'e.g., 70',
                unitToggle: { type: 'weight', units: ['kg', 'lbs'], default: 'kg' }
            })
        })}
            
            <div id="fluids-error-container"></div>
            
            ${uiBuilder.createResultBox({ id: 'fluids-result', title: 'Maintenance Fluid Requirements' })}
            
            ${uiBuilder.createFormulaSection({
            items: [
                { label: 'First 10 kg', formula: '4 mL/kg/hr' },
                { label: 'Next 10 kg (11-20 kg)', formula: '2 mL/kg/hr' },
                { label: 'Each kg above 20 kg', formula: '1 mL/kg/hr' },
                { label: 'Daily Total', content: 'Hourly Rate × 24' }
            ]
        })}
            
            ${uiBuilder.createAlert({
            type: 'warning',
            message: `
                    <h5>⚠️ Important Notes:</h5>
                    <ul>
                        <li>This calculates <strong>maintenance fluids only</strong>, not replacement for deficits or ongoing losses</li>
                        <li>The Holliday-Segar method is widely used in pediatric and adult medicine</li>
                        <li>Adjust based on clinical conditions, renal function, and fluid losses</li>
                        <li>Consider insensible losses (respiratory, skin) and urine output</li>
                        <li>For critically ill patients, may need additional adjustment (e.g., 50-75% of calculated)</li>
                    </ul>
                `
        })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);
        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);
        const weightInput = container.querySelector('#weight-fluids');
        const resultBox = container.querySelector('#fluids-result');
        const calculateAndUpdate = () => {
            const errorContainer = container.querySelector('#fluids-error-container');
            if (errorContainer)
                errorContainer.innerHTML = '';
            const weightKg = UnitConverter.getStandardValue(weightInput, 'kg');
            try {
                const inputs = { weight: weightKg };
                const schema = { weight: ValidationRules.weight };
                // @ts-ignore
                const validation = validateCalculatorInput(inputs, schema);
                if (!validation.isValid) {
                    if (weightInput.value) {
                        const meaningfulErrors = validation.errors.filter((e) => !e.includes('required') || weightInput.value);
                        if (meaningfulErrors.length > 0 && weightKg !== null && !isNaN(weightKg)) {
                            if (errorContainer)
                                displayError(errorContainer, new ValidationError(meaningfulErrors[0], 'VALIDATION_ERROR'));
                        }
                    }
                    if (resultBox)
                        resultBox.classList.remove('show');
                    return;
                }
                if (!weightKg || weightKg <= 0) {
                    if (resultBox)
                        resultBox.classList.remove('show');
                    return;
                }
                let hourlyRate = 0;
                if (weightKg <= 10) {
                    hourlyRate = weightKg * 4;
                }
                else if (weightKg <= 20) {
                    hourlyRate = 10 * 4 + (weightKg - 10) * 2;
                }
                else {
                    hourlyRate = 10 * 4 + 10 * 2 + (weightKg - 20) * 1;
                }
                const dailyRate = hourlyRate * 24;
                if (resultBox) {
                    const resultContent = resultBox.querySelector('.ui-result-content');
                    if (resultContent) {
                        resultContent.innerHTML = `
                            ${uiBuilder.createResultItem({
                            label: 'IV Fluid Rate (Hourly)',
                            value: hourlyRate.toFixed(1),
                            unit: 'mL/hr'
                        })}
                            ${uiBuilder.createResultItem({
                            label: 'Total Daily Fluids',
                            value: dailyRate.toFixed(1),
                            unit: 'mL/day'
                        })}
                        `;
                    }
                    resultBox.classList.add('show');
                }
            }
            catch (error) {
                const errorContainer = container.querySelector('#fluids-error-container');
                if (errorContainer) {
                    displayError(errorContainer, error);
                }
                else {
                    console.error(error);
                }
                logError(error, { calculator: 'maintenance-fluids', action: 'calculate' });
                if (resultBox)
                    resultBox.classList.remove('show');
            }
        };
        weightInput.addEventListener('input', calculateAndUpdate);
        container.querySelectorAll('select').forEach(s => s.addEventListener('change', calculateAndUpdate));
        if (client) {
            getMostRecentObservation(client, LOINC_CODES.WEIGHT)
                .then(weightObs => {
                if (weightObs && weightObs.valueQuantity) {
                    const val = weightObs.valueQuantity.value;
                    const unit = weightObs.valueQuantity.unit || 'kg';
                    const wInKg = UnitConverter.convert(val, unit, 'kg', 'weight');
                    if (wInKg !== null) {
                        weightInput.value = wInKg.toFixed(1);
                        weightInput.dispatchEvent(new Event('input'));
                        stalenessTracker.trackObservation('#weight-fluids', weightObs, LOINC_CODES.WEIGHT, 'Weight');
                    }
                }
            })
                .catch(err => console.log('Weight data not available'));
        }
    }
};
