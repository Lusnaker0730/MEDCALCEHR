// js/calculators/bmi-bsa.js
import {
    getMostRecentObservation,
    getValueInStandardUnit
} from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { FHIRDataError, ValidationError, logError, displayError } from '../../errorHandler.js';
import { ValidationRules, validateCalculatorInput } from '../../validator.js';
import { uiBuilder } from '../../ui-builder.js';

export const bmiBsa = {
    id: 'bmi-bsa',
    title: 'BMI & Body Surface Area (BSA)',
    generateHTML: function () {
        const inputSection = uiBuilder.createSection({
            title: 'Patient Measurements',
            content: [
                uiBuilder.createInput({
                    id: 'bmi-bsa-weight',
                    label: 'Weight',
                    type: 'number',
                    placeholder: 'e.g. 70',
                    unitToggle: { type: 'weight', units: ['kg', 'lbs'] }
                }),
                uiBuilder.createInput({
                    id: 'bmi-bsa-height',
                    label: 'Height',
                    type: 'number',
                    placeholder: 'e.g. 170',
                    unitToggle: { type: 'height', units: ['cm', 'in'] }
                })
            ].join('')
        });

        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">Calculates Body Mass Index (BMI) and Body Surface Area (BSA) for clinical assessment and medication dosing.</p>
            </div>
            
            ${inputSection}
            
            <div class="result-container" id="bmi-bsa-result" style="display:none;"></div>
            
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
    initialize: function (client, patient, container) {
        // Initialize UI Builder components (unit toggles, etc.)
        uiBuilder.initializeComponents(container);

        const resultEl = container.querySelector('#bmi-bsa-result');

        // Function to calculate and update results
        const calculateAndUpdate = () => {
            try {
                // Get values in standard units (kg and cm)
                const weightKg = getValueInStandardUnit(container, 'bmi-bsa-weight', 'kg');
                const heightCm = getValueInStandardUnit(container, 'bmi-bsa-height', 'cm');

                // Validate input
                const inputs = {
                    weight: weightKg,
                    height: heightCm
                };
                const schema = {
                    weight: ValidationRules.weight,
                    height: ValidationRules.height
                };
                const validation = validateCalculatorInput(inputs, schema);

                if (!validation.isValid) {
                    // If fields are empty, just hide results, don't throw error yet unless user interacted
                    // For now, we follow the pattern of only calculating if valid
                    if (weightKg && heightCm) {
                        // Maybe show partial validation error? 
                        // For simplicity, we just don't calculate if invalid
                    }
                    resultEl.style.display = 'none';
                    return;
                }

                if (weightKg > 0 && heightCm > 0) {
                    const heightInMeters = heightCm / 100;
                    const bmi = weightKg / (heightInMeters * heightInMeters);
                    const bsa = 0.007184 * Math.pow(weightKg, 0.425) * Math.pow(heightCm, 0.725); // Du Bois

                    // Validate calculation results
                    if (isNaN(bmi) || isNaN(bsa) || !isFinite(bmi) || !isFinite(bsa)) {
                        throw new ValidationError(
                            'Invalid calculation result, please check input values',
                            'BMI_BSA_CALCULATION_ERROR',
                            { weightKg, heightCm, bmi, bsa }
                        );
                    }

                    // Determine BMI category and severity
                    let bmiCategory = '';
                    let severityClass = 'low';
                    if (bmi < 18.5) {
                        bmiCategory = 'Underweight';
                        severityClass = 'moderate';
                    } else if (bmi < 25) {
                        bmiCategory = 'Normal weight';
                        severityClass = 'low';
                    } else if (bmi < 30) {
                        bmiCategory = 'Overweight';
                        severityClass = 'moderate';
                    } else if (bmi < 35) {
                        bmiCategory = 'Obese (Class I)';
                        severityClass = 'high';
                    } else if (bmi < 40) {
                        bmiCategory = 'Obese (Class II)';
                        severityClass = 'high';
                    } else {
                        bmiCategory = 'Obese (Class III)';
                        severityClass = 'high';
                    }

                    resultEl.innerHTML = `
                        <div class="result-header">
                            <h4>BMI & BSA Results</h4>
                        </div>
                        
                        <div class="result-item">
                            <span class="result-item-label">Body Mass Index (BMI)</span>
                            <span class="result-item-value"><strong>${bmi.toFixed(1)}</strong> kg/m²</span>
                        </div>
                        
                        <div class="severity-indicator ${severityClass} mt-15">
                            <span class="severity-indicator-text">${bmiCategory}</span>
                        </div>
                        
                        <div class="result-item mt-20">
                            <span class="result-item-label">Body Surface Area (BSA)</span>
                            <span class="result-item-value"><strong>${bsa.toFixed(2)}</strong> m²</span>
                        </div>
                        
                        <div class="alert info mt-20">
                            <span class="alert-icon">ℹ️</span>
                            <div class="alert-content">
                                <p>BSA calculated using Du Bois formula. Used for medication dosing and cardiac index calculation.</p>
                            </div>
                        </div>
                    `;

                    resultEl.style.display = 'block';
                    resultEl.classList.add('show');

                    // Clear any previous errors
                    const errorContainer = container.querySelector('#bmi-bsa-error');
                    if (errorContainer) {
                        errorContainer.remove();
                    }
                } else {
                    // Hide result if inputs are invalid
                    resultEl.style.display = 'none';
                }
            } catch (error) {
                logError(error, {
                    calculator: 'bmi-bsa',
                    action: 'calculateAndUpdate'
                });

                // Display error message
                let errorContainer = container.querySelector('#bmi-bsa-error');
                if (!errorContainer) {
                    errorContainer = document.createElement('div');
                    errorContainer.id = 'bmi-bsa-error';
                    resultEl.parentNode.insertBefore(errorContainer, resultEl.nextSibling);
                }
                displayError(errorContainer, error);

                // Reset result display
                resultEl.style.display = 'none';
            }
        };

        // Add event listeners for real-time calculation
        const inputs = container.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', calculateAndUpdate);
        });

        // Auto-populate from FHIR data
        if (client) {
            const weightPromise = getMostRecentObservation(client, LOINC_CODES.WEIGHT);
            const heightPromise = getMostRecentObservation(client, LOINC_CODES.HEIGHT);

            Promise.all([weightPromise, heightPromise])
                .then(([weightObs, heightObs]) => {
                    const weightInput = container.querySelector('#bmi-bsa-weight');
                    const heightInput = container.querySelector('#bmi-bsa-height');

                    if (weightObs && weightObs.valueQuantity && weightInput) {
                        weightInput.value = weightObs.valueQuantity.value.toFixed(1);
                        // Trigger input event to update UI state if needed
                        weightInput.dispatchEvent(new Event('input'));
                    }

                    if (heightObs && heightObs.valueQuantity && heightInput) {
                        heightInput.value = heightObs.valueQuantity.value.toFixed(1);
                        heightInput.dispatchEvent(new Event('input'));
                    }
                })
                .catch(error => {
                    const fhirError = new FHIRDataError(
                        'Unable to load weight or height data from EHR system',
                        'BMI_BSA_FHIR_LOAD_ERROR',
                        { error: error.message }
                    );
                    logError(fhirError, {
                        calculator: 'bmi-bsa',
                        action: 'loadFHIRData'
                    });

                    // Display a non-intrusive warning but still allow manual input
                    const warningContainer = document.createElement('div');
                    warningContainer.className = 'warning-message';
                    warningContainer.style.cssText =
                        'background: #fff3cd; border-left: 4px solid #ffc107; color: #856404; padding: 12px; margin-bottom: 15px; border-radius: 4px; font-size: 0.9em;';
                    warningContainer.innerHTML =
                        '<strong>Note:</strong> Unable to automatically load patient data. Please manually enter weight and height.';
                    container.insertBefore(warningContainer, container.firstChild.nextSibling);
                });
        }
    }
};
