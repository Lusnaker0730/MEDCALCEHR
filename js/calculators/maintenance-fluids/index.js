// js/calculators/maintenance-fluids.js
import { getMostRecentObservation } from '../../utils.js';

export const maintenanceFluids = {
    id: 'maintenance-fluids',
    title: 'Maintenance Fluids Calculations',
    description: 'Calculates maintenance fluid requirements by weight.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p>Calculates maintenance fluid requirements by weight (Holliday-Segar method).</p>
            <div class="input-group">
                <label for="weight-fluids">Weight (kg):</label>
                <input type="number" id="weight-fluids" placeholder="e.g., 70">
            </div>
            
            <div id="fluids-result" class="result" style="display:none;">
                <div class="result-item">
                    <span class="value">-- <span class="unit">mL/hr</span></span>
                    <span class="label">IV Fluid Rate (Hourly)</span>
                </div>
                <div class="result-item">
                    <span class="value">-- <span class="unit">mL/day</span></span>
                    <span class="label">Total Daily Fluids</span>
                </div>
            </div>

            <!-- Formula Section -->
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
                    <h5 style="margin-top: 0; color: #1976D2;">💡 Examples:</h5>
                    <div style="font-size: 0.85em; color: #333;">
                        <p style="margin: 8px 0;"><strong>10 kg infant:</strong> 10 × 4 = 40 mL/hr = 960 mL/day</p>
                        <p style="margin: 8px 0;"><strong>20 kg child:</strong> (10 × 4) + (10 × 2) = 60 mL/hr = 1,440 mL/day</p>
                        <p style="margin: 8px 0;"><strong>70 kg adult:</strong> (10 × 4) + (10 × 2) + (50 × 1) = 90 mL/hr = 2,160 mL/day</p>
                    </div>
                </div>

                <!-- Formula Breakdown -->
                <div style="background: #f1f8e9; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #c5e1a5;">
                    <h5 style="margin-top: 0; color: #33691e;">📋 Formula Breakdown:</h5>
                    <ul style="margin: 10px 0; padding-left: 20px; font-size: 0.9em;">
                        <li><strong>Hourly Rate:</strong>
                            <ul style="margin: 5px 0; padding-left: 20px;">
                                <li>If weight ≤ 10 kg: Hourly = Weight × 4</li>
                                <li>If 10 < weight ≤ 20 kg: Hourly = (10 × 4) + (Weight - 10) × 2</li>
                                <li>If weight > 20 kg: Hourly = (10 × 4) + (10 × 2) + (Weight - 20) × 1</li>
                            </ul>
                        </li>
                        <li><strong>Daily Maintenance:</strong> Hourly Rate × 24 hours</li>
                    </ul>
                </div>

                <!-- Notes -->
                <div style="background: #fef5e7; padding: 15px; border-radius: 8px; border-left: 4px solid #f39c12;">
                    <h5 style="margin-top: 0; color: #d68910;">📌 Important Notes:</h5>
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
    initialize: function(client, patient, container) {
        const weightInput = container.querySelector('#weight-fluids');
        const resultEl = container.querySelector('#fluids-result');

        if (patient && patient.weight) {
            weightInput.value = patient.weight.toFixed(1);
        }

        if (client) {
            getMostRecentObservation(client, '29463-7').then(weightObs => {
                if (weightObs && weightObs.valueQuantity) {
                    weightInput.value = weightObs.valueQuantity.value.toFixed(1);
                    calculateAndUpdate();
                }
            }).catch(err => console.log('Weight data not available'));
        }

        const calculateAndUpdate = () => {
            const weight = parseFloat(weightInput.value);

            if (!weight || weight <= 0) {
                resultEl.style.display = 'none';
                return;
            }

            let hourlyRate = 0;
            if (weight <= 10) {
                hourlyRate = weight * 4;
            } else if (weight <= 20) {
                hourlyRate = (10 * 4) + ((weight - 10) * 2);
            } else {
                hourlyRate = (10 * 4) + (10 * 2) + ((weight - 20) * 1);
            }
            const dailyRate = hourlyRate * 24;

            resultEl.innerHTML = `
                <div class="result-item">
                    <span class="value">${hourlyRate.toFixed(1)} <span class="unit">mL/hr</span></span>
                    <span class="label">IV Fluid Rate (Hourly)</span>
                </div>
                <div class="result-item">
                    <span class="value">${dailyRate.toFixed(1)} <span class="unit">mL/day</span></span>
                    <span class="label">Total Daily Fluids</span>
                </div>
            `;
            resultEl.style.display = 'block';
        };

        // Add event listener for automatic calculation on input change
        weightInput.addEventListener('input', calculateAndUpdate);
        
        // Initial calculation if weight is already set
        calculateAndUpdate();
    }
};
