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
                unitToggle: { type: 'weight', units: ['kg', 'lbs'], defaultUnit: 'kg' }
            })
        })}
            
            <div id="fluids-error-container"></div>
            
            <div id="fluids-result" class="ui-result-box">
                <div class="ui-result-header">Maintenance Fluid Requirements</div>
                <div class="ui-result-content"></div>
            </div>
            
            <div class="formula-section">
                <h4>📐 Holliday-Segar Formula</h4>
                <p style="font-size: 0.9em; color: #666; margin-bottom: 15px;">Maintenance fluid requirements are calculated using the following tiered approach based on patient weight:</p>
                
                <div style="background: #f5f7fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                    <h5 style="margin-top: 0; color: #333;">Calculation Method:</h5>
                    <div style="background: white; padding: 15px; border-radius: 5px; margin-bottom: 10px;">
                        <p style="font-family: monospace; margin: 5px 0;"><strong>For first 10 kg:</strong> 4 mL/kg/hr</p>
                        <p style="font-family: monospace; margin: 5px 0;"><strong>For next 10 kg (11-20 kg):</strong> 2 mL/kg/hr</p>
                        <p style="font-family: monospace; margin: 5px 0;"><strong>For each kg above 20 kg:</strong> 1 mL/kg/hr</p>
                    </div>
                    <p style="font-size: 0.85em; color: #555; margin-top: 10px;">
                        <strong>Daily Total:</strong> Hourly Rate × 24
                    </p>
                </div>

                <!-- Examples -->
                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #2196F3;">
                    <h5 style="margin-top: 0; color: #1976D2;">📝 Examples:</h5>
                    <div style="font-size: 0.85em; color: #333;">
                        <p style="margin: 8px 0;"><strong>10 kg infant:</strong> 10 × 4 = 40 mL/hr = 960 mL/day</p>
                        <p style="margin: 8px 0;"><strong>20 kg child:</strong> (10 × 4) + (10 × 2) = 60 mL/hr = 1,440 mL/day</p>
                        <p style="margin: 8px 0;"><strong>70 kg adult:</strong> (10 × 4) + (10 × 2) + (50 × 1) = 90 mL/hr = 2,160 mL/day</p>
                    </div>
                </div>

                <!-- Notes -->
                <div style="background: #fef5e7; padding: 15px; border-radius: 8px; border-left: 4px solid #f39c12;">
                    <h5 style="margin-top: 0; color: #d68910;">⚠️ Important Notes:</h5>
                    <ul style="margin: 10px 0; padding-left: 20px; font-size: 0.85em; color: #555;">
                        <li>This calculates <strong>maintenance fluids only</strong>, not replacement for deficits or ongoing losses</li>
                        <li>The Holliday-Segar method is widely used in pediatric and adult medicine</li>
                        <li>Adjust based on clinical conditions, renal function, and fluid losses</li>
                        <li>Consider insensible losses (respiratory, skin) and urine output</li>
                        <li>For critically ill patients, may need additional adjustment (e.g., 50-75% of calculated)</li>
                    </ul>
                </div>
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);

        const weightInput = container.querySelector('#weight-fluids');
        const resultBox = container.querySelector('#fluids-result');
        const resultContent = resultBox.querySelector('.ui-result-content');

        const calculateAndUpdate = () => {
            // Clear previous errors
            const errorContainer = container.querySelector('#fluids-error-container');
            if (errorContainer) errorContainer.innerHTML = '';

            const weightKg = UnitConverter.getStandardValue(weightInput, 'kg');

            try {
                // Validation inputs
                const inputs = { weight: weightKg };
                const schema = { weight: ValidationRules.weight };
                const validation = validateCalculatorInput(inputs, schema);

                if (!validation.isValid) {
                    // Filter required errors if empty
                    if (weightInput.value) {
                        const meaningfulErrors = validation.errors.filter(e => !e.includes('required') || weightInput.value);
                        if (meaningfulErrors.length > 0 && !isNaN(weightKg)) {
                            if (errorContainer) displayError(errorContainer, new ValidationError(meaningfulErrors[0], 'VALIDATION_ERROR'));
                        }
                    }

                    resultBox.classList.remove('show');
                    return;
                }

                if (weightKg <= 0) {
                    resultBox.classList.remove('show');
                    return;
                }

                let hourlyRate = 0;
                if (weightKg <= 10) {
                    hourlyRate = weightKg * 4;
                } else if (weightKg <= 20) {
                    hourlyRate = 10 * 4 + (weightKg - 10) * 2;
                } else {
                    hourlyRate = 10 * 4 + 10 * 2 + (weightKg - 20) * 1;
                }
                const dailyRate = hourlyRate * 24;

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
                resultBox.classList.add('show');
            } catch (error) {
                const errorContainer = container.querySelector('#fluids-error-container');
                if (errorContainer) {
                    displayError(errorContainer, error);
                } else {
                    console.error(error);
                }
                logError(error, { calculator: 'maintenance-fluids', action: 'calculate' });
                resultBox.classList.remove('show');
            }
        };

        // Add event listener for automatic calculation on input change
        weightInput.addEventListener('input', calculateAndUpdate);
        container.querySelectorAll('select').forEach(s => s.addEventListener('change', calculateAndUpdate));

        // Auto-populate from FHIR
        if (client) {
            getMostRecentObservation(client, LOINC_CODES.WEIGHT)
                .then(weightObs => {
                    if (weightObs && weightObs.valueQuantity) {
                        // Attempt a robust conversion or simple set
                        const val = weightObs.valueQuantity.value;
                        const unit = weightObs.valueQuantity.unit || 'kg';
                        const wInKg = UnitConverter.convert(val, unit, 'kg', 'weight');

                        if (wInKg !== null) {
                            // If the UI is in kg (default), this is perfect.
                            // If UI is lbs, we ideally update the input value to lbs.
                            // Currently we just set value. If unitToggle is smart it might handle it or we assume user uses default.
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