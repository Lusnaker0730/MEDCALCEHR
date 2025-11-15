// js/calculators/bmi-bsa.js
import {
    getMostRecentObservation,
    createUnitSelector,
    initializeUnitConversion,
    getValueInStandardUnit
} from '../../utils.js';
import { FHIRDataError, ValidationError, logError, displayError } from '../../errorHandler.js';
import { ValidationRules, validateCalculatorInput } from '../../validator.js';

export const bmiBsa = {
    id: 'bmi-bsa',
    title: 'BMI & Body Surface Area (BSA)',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">Calculates Body Mass Index (BMI) and Body Surface Area (BSA) for clinical assessment and medication dosing.</p>
            </div>
            
            <div class="section">
                <div class="section-title">
                    <span>Patient Measurements</span>
                </div>
                <div class="input-group">
                    <label for="bmi-bsa-weight">Weight:</label>
                    ${createUnitSelector('bmi-bsa-weight', 'weight', ['kg', 'lbs'], 'kg')}
                </div>
                <div class="input-group">
                    <label for="bmi-bsa-height">Height:</label>
                    ${createUnitSelector('bmi-bsa-height', 'height', ['cm', 'in'], 'cm')}
                </div>
            </div>
            
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
                    throw new ValidationError(
                        validation.errors.join('; '),
                        'BMI_BSA_VALIDATION_ERROR',
                        { inputs, errors: validation.errors }
                    );
                }

                if (weightKg > 0 && heightCm > 0) {
                    const heightInMeters = heightCm / 100;
                    const bmi = weightKg / (heightInMeters * heightInMeters);
                    const bsa = 0.007184 * Math.pow(weightKg, 0.425) * Math.pow(heightCm, 0.725); // Du Bois

                    // Validate calculation results
                    if (isNaN(bmi) || isNaN(bsa) || !isFinite(bmi) || !isFinite(bsa)) {
                        throw new ValidationError(
                            '计算结果无效，请检查输入值',
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

        // Initialize unit conversions
        initializeUnitConversion(container, 'bmi-bsa-weight', calculateAndUpdate);
        initializeUnitConversion(container, 'bmi-bsa-height', calculateAndUpdate);

        // Auto-populate from FHIR data
        const weightPromise = getMostRecentObservation(client, '29463-7');
        const heightPromise = getMostRecentObservation(client, '8302-2');

        Promise.all([weightPromise, heightPromise])
            .then(([weightObs, heightObs]) => {
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
            })
            .catch(error => {
                const fhirError = new FHIRDataError(
                    '无法从 EHR 系统加载体重或身高数据',
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
                    '<strong>提示:</strong> 无法自动加载患者数据，请手动输入体重和身高。';
                container.insertBefore(warningContainer, container.firstChild.nextSibling);

                // Still allow manual calculation
                calculateAndUpdate();
            });
    }
};
