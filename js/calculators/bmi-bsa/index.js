// js/calculators/bmi-bsa.js
import { getMostRecentObservation, createUnitSelector, initializeUnitConversion, getValueInStandardUnit } from '../../utils.js';

export const bmiBsa = {
    id: 'bmi-bsa',
    title: 'BMI & Body Surface Area (BSA)',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <div class="input-group">
                <label for="bmi-bsa-weight">Weight:</label>
                ${createUnitSelector('bmi-bsa-weight', 'weight', ['kg', 'lbs'], 'kg')}
            </div>
            <div class="input-group">
                <label for="bmi-bsa-height">Height:</label>
                ${createUnitSelector('bmi-bsa-height', 'height', ['cm', 'in'], 'cm')}
            </div>
            <div id="bmi-bsa-result" class="result" style="display:block;">
                <div class="result-item">
                    <span class="value">-- <span class="unit">kg/m²</span></span>
                    <span class="label">BMI</span>
                </div>
                <div class="result-item">
                    <span class="value">-- <span class="unit">m²</span></span>
                    <span class="label">Body Surface Area (BSA)</span>
                </div>
            </div>
            <div class="formula-section">
                <h4>Formulas</h4>
                <div class="formula-item">
                    <strong>BMI (Body Mass Index):</strong>
                    <div class="formula">BMI = Weight (kg) / Height² (m²)</div>
                </div>
                <div class="formula-item">
                    <strong>BSA (Body Surface Area - Du Bois Formula):</strong>
                    <div class="formula">BSA = 0.007184 × Weight<sup>0.425</sup> (kg) × Height<sup>0.725</sup> (cm)</div>
                </div>
            </div>
        `;
    },
    initialize: function(client, patient, container) {
        const resultEl = container.querySelector('#bmi-bsa-result');

        // Function to calculate and update results
        const calculateAndUpdate = () => {
            // Get values in standard units (kg and cm)
            const weightKg = getValueInStandardUnit(container, 'bmi-bsa-weight', 'kg');
            const heightCm = getValueInStandardUnit(container, 'bmi-bsa-height', 'cm');

            if (weightKg > 0 && heightCm > 0) {
                const heightInMeters = heightCm / 100;
                const bmi = weightKg / (heightInMeters * heightInMeters);
                const bsa = 0.007184 * Math.pow(weightKg, 0.425) * Math.pow(heightCm, 0.725); // Du Bois
                
                // Determine BMI category
                let bmiCategory = '';
                let bmiColor = '';
                if (bmi < 18.5) {
                    bmiCategory = 'Underweight';
                    bmiColor = '#03a9f4';
                } else if (bmi < 25) {
                    bmiCategory = 'Normal weight';
                    bmiColor = '#4caf50';
                } else if (bmi < 30) {
                    bmiCategory = 'Overweight';
                    bmiColor = '#ff9800';
                } else if (bmi < 35) {
                    bmiCategory = 'Obese (Class I)';
                    bmiColor = '#ff5722';
                } else if (bmi < 40) {
                    bmiCategory = 'Obese (Class II)';
                    bmiColor = '#f44336';
                } else {
                    bmiCategory = 'Obese (Class III)';
                    bmiColor = '#d32f2f';
                }
                
                // Update BMI result
                const bmiValueEl = resultEl.querySelector('.result-item:first-child .value');
                bmiValueEl.innerHTML = `
                    <div style="font-size: 1.8em; font-weight: bold;">${bmi.toFixed(1)}</div>
                    <div style="font-size: 0.9em; margin-top: 3px;">kg/m²</div>
                    <div style="margin-top: 8px; padding: 6px 12px; background: ${bmiColor}; color: white; border-radius: 15px; font-size: 0.85em;">
                        ${bmiCategory}
                    </div>
                `;
                
                // Update BSA result
                const bsaValueEl = resultEl.querySelector('.result-item:last-child .value');
                bsaValueEl.innerHTML = `
                    <div style="font-size: 1.8em; font-weight: bold;">${bsa.toFixed(2)}</div>
                    <div style="font-size: 0.9em; margin-top: 3px;">m²</div>
                    <div style="margin-top: 8px; font-size: 0.85em; color: #666;">
                        (Du Bois formula)
                    </div>
                `;
                
                resultEl.className = 'result calculated';
            } else {
                // Reset to default values if inputs are invalid
                const bmiValueEl = resultEl.querySelector('.result-item:first-child .value');
                bmiValueEl.innerHTML = `-- <span class="unit">kg/m²</span>`;
                
                const bsaValueEl = resultEl.querySelector('.result-item:last-child .value');
                bsaValueEl.innerHTML = `-- <span class="unit">m²</span>`;
                
                resultEl.className = 'result';
            }
        };

        // Initialize unit conversions
        initializeUnitConversion(container, 'bmi-bsa-weight', calculateAndUpdate);
        initializeUnitConversion(container, 'bmi-bsa-height', calculateAndUpdate);

        // Auto-populate from FHIR data
        const weightPromise = getMostRecentObservation(client, '29463-7');
        const heightPromise = getMostRecentObservation(client, '8302-2');

        Promise.all([weightPromise, heightPromise]).then(([weightObs, heightObs]) => {
            const weightInput = container.querySelector('#bmi-bsa-weight');
            const heightInput = container.querySelector('#bmi-bsa-height');
            
            if (weightObs && weightObs.valueQuantity && weightInput) {
                weightInput.value = weightObs.valueQuantity.value.toFixed(1);
            }

            if (heightObs && heightObs.valueQuantity && heightInput) {
                heightInput.value = heightObs.valueQuantity.value.toFixed(1);
            }
            
            // Calculate initial results if data was populated
            calculateAndUpdate();
        });
    }
};

