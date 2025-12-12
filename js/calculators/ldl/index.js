import { getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { ValidationRules, validateCalculatorInput } from '../../validator.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';

export const ldl = {
    id: 'ldl',
    title: 'LDL Calculated',
    description: 'Calculates LDL based on total and HDL cholesterol and triglycerides.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            ${uiBuilder.createAlert({
            type: 'info',
            message: '<strong>Instructions:</strong> Enter Total Cholesterol, HDL-C, and Triglycerides. LDL-C will be calculated using Friedewald Equation.'
        })}
            ${uiBuilder.createSection({
            title: 'Lipid Panel Inputs',
            icon: '🧪',
            content: `
                    ${uiBuilder.createInput({
                id: 'ldl-tc',
                label: 'Total Cholesterol',
                type: 'number',
                placeholder: 'Enter Total Cholesterol',
                unitToggle: {
                    type: 'cholesterol',
                    units: ['mg/dL', 'mmol/L'],
                    defaultUnit: 'mg/dL'
                }
            })}
                    ${uiBuilder.createInput({
                id: 'ldl-hdl',
                label: 'HDL Cholesterol',
                type: 'number',
                placeholder: 'Enter HDL Cholesterol',
                unitToggle: {
                    type: 'cholesterol',
                    units: ['mg/dL', 'mmol/L'],
                    defaultUnit: 'mg/dL'
                }
            })}
                    ${uiBuilder.createInput({
                id: 'ldl-trig',
                label: 'Triglycerides',
                type: 'number',
                placeholder: 'Enter Triglycerides',
                unitToggle: {
                    type: 'triglycerides',
                    units: ['mg/dL', 'mmol/L'],
                    defaultUnit: 'mg/dL'
                }
            })}
                `
        })}
            
            <div id="ldl-result" class="ui-result-box">
                <div class="ui-result-header">LDL Cholesterol Result</div>
                <div class="ui-result-content"></div>
            </div>

            ${uiBuilder.createFormulaSection({
            items: [
                {
                    title: 'Friedewald Equation',
                    formulas: ['LDL = Total Cholesterol - HDL - (Triglycerides / 5)'],
                    notes: '(All values in mg/dL)'
                }
            ]
        })}
            ${uiBuilder.createAlert({
            type: 'warning',
            message: `
                    <strong>Limitation:</strong> This formula is not accurate when triglycerides ≥400 mg/dL (≥4.52 mmol/L). 
                    Consider direct LDL measurement in such cases.
                `
        })}
            ${uiBuilder.createAlert({
            type: 'info',
            message: `
                    <h4>📊 LDL Cholesterol Goals (Adults)</h4>
                    <div class="ui-data-table">
                        <table>
                            <thead>
                                <tr><th>Category</th><th>mg/dL</th><th>mmol/L</th></tr>
                            </thead>
                            <tbody>
                                <tr><td><span class="ui-alert-success">Optimal</span></td><td>< 100</td><td>< 2.59</td></tr>
                                <tr><td><span class="ui-alert-success">Near Optimal</span></td><td>100-129</td><td>2.59-3.34</td></tr>
                                <tr><td><span class="ui-alert-warning">Borderline High</span></td><td>130-159</td><td>3.37-4.12</td></tr>
                                <tr><td><span class="ui-alert-danger">High</span></td><td>160-189</td><td>4.15-4.90</td></tr>
                                <tr><td><span class="ui-alert-danger">Very High</span></td><td>≥ 190</td><td>≥ 4.92</td></tr>
                            </tbody>
                        </table>
                    </div>
                `
        })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const tcInput = container.querySelector('#ldl-tc');
        const hdlInput = container.querySelector('#ldl-hdl');
        const trigInput = container.querySelector('#ldl-trig');
        const resultBox = container.querySelector('#ldl-result');
        const resultContent = resultBox.querySelector('.ui-result-content');

        const calculate = () => {
            // Clear previous errors
            const existingError = container.querySelector('#ldl-error');
            if (existingError) existingError.remove();

            const tcVal = UnitConverter.getStandardValue(tcInput, 'mg/dL');
            const hdlVal = UnitConverter.getStandardValue(hdlInput, 'mg/dL');
            const trigVal = UnitConverter.getStandardValue(trigInput, 'mg/dL');

            try {
                // Validation inputs
                const inputs = {
                    totalCholesterol: tcVal,
                    hdl: hdlVal,
                    triglycerides: trigVal
                };
                const schema = {
                    totalCholesterol: ValidationRules.totalCholesterol,
                    hdl: ValidationRules.hdl,
                    triglycerides: ValidationRules.triglycerides
                };

                const validation = validateCalculatorInput(inputs, schema);

                if (!validation.isValid) {
                    const hasInput = (tcInput.value || hdlInput.value || trigInput.value);

                    if (hasInput) {
                        const valuesPresent = !isNaN(tcVal) && !isNaN(hdlVal) && !isNaN(trigVal);
                        if (valuesPresent || validation.errors.some(e => !e.includes('required'))) {
                            let errorContainer = document.createElement('div');
                            errorContainer.id = 'ldl-error';
                            resultBox.parentNode.insertBefore(errorContainer, resultBox);
                            displayError(errorContainer, new ValidationError(validation.errors[0], 'VALIDATION_ERROR'));
                        }
                    }

                    resultBox.classList.remove('show');
                    return;
                }

                if (trigVal >= 400) {
                    resultContent.innerHTML = uiBuilder.createAlert({
                        type: 'danger',
                        message: '<strong>Cannot Calculate:</strong> Triglycerides ≥400 mg/dL. Friedewald equation is invalid. Please order Direct LDL.'
                    });
                    resultBox.classList.add('show');
                    return;
                }

                const ldlVal = tcVal - hdlVal - (trigVal / 5);

                if (!isFinite(ldlVal) || isNaN(ldlVal)) throw new Error("Calculation Error");

                const ldlMmol = UnitConverter.convert(ldlVal, 'mg/dL', 'mmol/L', 'cholesterol');

                let riskCategory = '';
                let alertType = 'info';

                if (ldlVal < 100) {
                    riskCategory = 'Optimal';
                    alertType = 'success';
                } else if (ldlVal < 130) {
                    riskCategory = 'Near Optimal/Above Optimal';
                    alertType = 'success';
                } else if (ldlVal < 160) {
                    riskCategory = 'Borderline High';
                    alertType = 'warning';
                } else if (ldlVal < 190) {
                    riskCategory = 'High';
                    alertType = 'danger';
                } else {
                    riskCategory = 'Very High';
                    alertType = 'danger';
                }

                resultContent.innerHTML = `
                    ${uiBuilder.createResultItem({
                    label: 'Calculated LDL',
                    value: ldlVal.toFixed(1),
                    unit: 'mg/dL',
                    interpretation: riskCategory,
                    alertClass: `ui-alert-${alertType}`
                })}
                    ${uiBuilder.createResultItem({
                    label: 'Calculated LDL (mmol/L)',
                    value: ldlMmol ? ldlMmol.toFixed(2) : '-',
                    unit: 'mmol/L'
                })}
                `;
                resultBox.classList.add('show');
            } catch (error) {
                logError(error, { calculator: 'ldl', action: 'calculate' });
                if (error.name !== 'ValidationError') {
                    let errorContainer = container.querySelector('#ldl-error');
                    if (!errorContainer) {
                        errorContainer = document.createElement('div');
                        errorContainer.id = 'ldl-error';
                        resultBox.parentNode.insertBefore(errorContainer, resultBox);
                    }
                    displayError(errorContainer, error);
                }
                resultBox.classList.remove('show');
            }
        };

        // Event listeners
        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculate);
            input.addEventListener('change', calculate);
        });

        // FHIR Integration
        if (client) {
            getMostRecentObservation(client, LOINC_CODES.CHOLESTEROL_TOTAL).then(obs => {
                if (obs?.valueQuantity) {
                    tcInput.value = obs.valueQuantity.value.toFixed(0);
                    tcInput.dispatchEvent(new Event('input'));
                }
            });
            getMostRecentObservation(client, LOINC_CODES.HDL).then(obs => {
                if (obs?.valueQuantity) {
                    hdlInput.value = obs.valueQuantity.value.toFixed(0);
                    hdlInput.dispatchEvent(new Event('input'));
                }
            });
            getMostRecentObservation(client, LOINC_CODES.TRIGLYCERIDES).then(obs => {
                if (obs?.valueQuantity) {
                    trigInput.value = obs.valueQuantity.value.toFixed(0);
                    trigInput.dispatchEvent(new Event('input'));
                }
            });
        }
    }
};
