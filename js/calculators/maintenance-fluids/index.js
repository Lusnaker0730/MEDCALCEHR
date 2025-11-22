import { getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';

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
                    unitToggle: { type: 'weight', units: ['kg', 'lbs'] }
                })
            })}
            
            ${uiBuilder.createResultBox({ id: 'fluids-result', title: 'Maintenance Fluid Requirements' })}
            
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

        const weightInput = container.querySelector('#weight-fluids');
        
        // Helper to get weight in kg properly handling unit toggle
        const getWeightInKg = () => {
            if (!weightInput.value) return 0;
            const val = parseFloat(weightInput.value);
            const unitToggle = weightInput.parentElement.querySelector('.unit-toggle');
            const unit = unitToggle ? unitToggle.textContent.trim() : 'kg';
            
            if (unit === 'lbs') {
                return val * 0.453592;
            }
            return val;
        };

        const calculateAndUpdate = () => {
            const weight = getWeightInKg();

            if (!weight || weight <= 0) {
                container.querySelector('#fluids-result').classList.remove('show');
                return;
            }

            let hourlyRate = 0;
            if (weight <= 10) {
                hourlyRate = weight * 4;
            } else if (weight <= 20) {
                hourlyRate = 10 * 4 + (weight - 10) * 2;
            } else {
                hourlyRate = 10 * 4 + 10 * 2 + (weight - 20) * 1;
            }
            const dailyRate = hourlyRate * 24;

            const resultBox = container.querySelector('#fluids-result');
            const resultContent = resultBox.querySelector('.ui-result-content');

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
        };

        // Add event listener for automatic calculation on input change
        weightInput.addEventListener('input', calculateAndUpdate);
        
        // Also listen to unit toggle changes if UnitConverter adds them
        const unitBtn = weightInput.parentElement.querySelector('.unit-toggle');
        if(unitBtn) {
            // UnitConverter usually handles the click and updates text, we need to recalc
            // Since we don't have a direct event for unit change in UnitConverter easily accessible here without strict coupling, 
            // we can observe mutation or just rely on user input. 
            // But UnitConverter.createUnitToggle adds a click listener. 
            // We can add another click listener to the button.
            unitBtn.addEventListener('click', () => {
                // Give time for unit to toggle
                setTimeout(calculateAndUpdate, 0);
            });
        }

        // Auto-populate from FHIR
        if (patient && patient.weight) {
            // Assuming patient.weight is in kg if it comes from our simplified patient object, 
            // but usually we look at observations for units.
            // For simplicity in this mock context:
            weightInput.value = patient.weight.toFixed(1);
            calculateAndUpdate();
        }

        if (client) {
            getMostRecentObservation(client, LOINC_CODES.WEIGHT)
                .then(weightObs => {
                    if (weightObs && weightObs.valueQuantity) {
                        let val = weightObs.valueQuantity.value;
                        const unit = weightObs.valueQuantity.unit;
                        
                        // If unit is lbs, we might want to set the toggle to lbs or convert to kg
                        // Here we just set value and assume kg default, or could be smarter.
                        // For now, let's just set value.
                        if (unit === 'lbs' || unit === '[lb_av]') {
                             // If we could switch the toggle programmatically...
                             // For now, let's just convert to kg for the input if default is kg
                             val = val * 0.453592;
                        }
                        
                        weightInput.value = val.toFixed(1);
                        calculateAndUpdate();
                    }
                })
                .catch(err => console.log('Weight data not available'));
        }
    }
};