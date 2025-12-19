import { LOINC_CODES } from '../../fhir-codes.js';
import {
    getMostRecentObservation,
    calculateAge
} from '../../utils.js';
import { createStalenessTracker } from '../../data-staleness.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { ValidationRules, validateCalculatorInput } from '../../validator.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';

export const fib4 = {
    id: 'fib-4',
    title: 'Fibrosis-4 (FIB-4) Index',
    description: 'Estimates liver fibrosis in patients with chronic liver disease.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>

            ${uiBuilder.createSection({
            title: 'Patient Parameters',
            content: `
                    ${uiBuilder.createInput({
                id: 'fib4-age',
                label: 'Age',
                unit: 'years',
                type: 'number'
            })}
                    ${uiBuilder.createInput({
                id: 'fib4-ast',
                label: 'AST (Aspartate Aminotransferase)',
                unit: 'U/L',
                type: 'number'
            })}
                    ${uiBuilder.createInput({
                id: 'fib4-alt',
                label: 'ALT (Alanine Aminotransferase)',
                unit: 'U/L',
                type: 'number'
            })}
                    ${uiBuilder.createInput({
                id: 'fib4-plt',
                label: 'Platelet Count',
                type: 'number',
                unit: '×10⁹/L',
                unitToggle: {
                    type: 'platelet',
                    units: ['×10⁹/L', 'K/µL', 'thou/mm³']
                }
            })}
                `
        })}

            <div id="fib4-error-container"></div>
            <div id="fib4-result" class="result-container" style="display:none;"></div>

            ${uiBuilder.createFormulaSection({
            items: [
                { label: 'FIB-4', content: '(Age × AST) / (Platelets × √ALT)' }
            ]
        })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        // Initialize staleness tracker
        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);

        const ageInput = container.querySelector('#fib4-age');
        const astInput = container.querySelector('#fib4-ast');
        const altInput = container.querySelector('#fib4-alt');
        const pltInput = container.querySelector('#fib4-plt');

        if (patient && patient.birthDate) {
            ageInput.value = calculateAge(patient.birthDate);
        }

        const calculate = () => {
            // Clear previous errors
            const errorContainer = container.querySelector('#fib4-error-container');
            if (errorContainer) errorContainer.innerHTML = '';

            const resultBox = container.querySelector('#fib4-result');

            try {
                // Get standard values
                const age = parseFloat(ageInput.value);
                const ast = parseFloat(astInput.value);
                const alt = parseFloat(altInput.value);
                const plt = UnitConverter.getStandardValue(pltInput);

                // Define validation schema
                const inputs = { age, ast, alt, plt };
                const schema = {
                    age: ValidationRules.age,
                    ast: ValidationRules.liverEnzyme,
                    alt: ValidationRules.liverEnzyme,
                    plt: ValidationRules.platelets
                };

                const validation = validateCalculatorInput(inputs, schema);

                if (!validation.isValid) {
                    const hasInput = ageInput.value || astInput.value || altInput.value || pltInput.value;

                    if (hasInput) {
                        const meaningfulErrors = validation.errors.filter(msg => {
                            return true;
                        });

                        const valuesPresent = !isNaN(age) && !isNaN(ast) && !isNaN(alt) && !isNaN(plt);

                        if (valuesPresent || validation.errors.some(e => !e.includes('required'))) {
                            if (meaningfulErrors.length > 0) {
                                if (errorContainer) displayError(errorContainer, new ValidationError(meaningfulErrors[0], 'VALIDATION_ERROR'));
                            }
                        }
                    }

                    resultBox.style.display = 'none';
                    return;
                }

                if (age > 0 && ast > 0 && alt > 0 && plt > 0) {
                    const fib4_score = (age * ast) / (plt * Math.sqrt(alt));

                    if (!isFinite(fib4_score) || isNaN(fib4_score)) {
                        throw new ValidationError('Calculation resulted in an invalid number.', 'CALCULATION_ERROR');
                    }

                    let interpretation = '';
                    let recommendation = '';
                    let alertType = 'info';

                    if (fib4_score < 1.3) {
                        interpretation = 'Low Risk (Low probability of advanced fibrosis F3-F4)';
                        recommendation = 'Continue routine monitoring.';
                        alertType = 'success';
                    } else if (fib4_score > 2.67) {
                        interpretation = 'High Risk (High probability of advanced fibrosis F3-F4)';
                        recommendation = 'Referral to hepatology recommended. Consider FibroScan or biopsy.';
                        alertType = 'danger';
                    } else {
                        interpretation = 'Indeterminate Risk';
                        recommendation = 'Further evaluation needed (e.g. FibroScan, elastography).';
                        alertType = 'warning';
                    }

                    resultBox.innerHTML = `
                         <div class="result-header">
                            <h4>FIB-4 Index Results</h4>
                        </div>
                        <div class="result-content-wrapper">
                            ${uiBuilder.createResultItem({
                        label: 'FIB-4 Score',
                        value: fib4_score.toFixed(2),
                        unit: 'points',
                        interpretation: interpretation,
                        alertClass: `ui-alert-${alertType}`
                    })}
                            ${uiBuilder.createAlert({
                        type: alertType,
                        message: `<strong>Recommendation:</strong> ${recommendation}`
                    })}
                        </div>
                    `;
                    resultBox.style.display = 'block';
                    resultBox.classList.add('show');
                } else {
                    resultBox.style.display = 'none';
                }
            } catch (error) {
                logError(error, { calculator: 'fib-4', action: 'calculate' });
                if (errorContainer) displayError(errorContainer, error);
                resultBox.style.display = 'none';
            }
        };

        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculate);
        });

        // Auto-populate from FHIR
        if (client) {
            getMostRecentObservation(client, LOINC_CODES.AST).then(obs => {
                if (obs && obs.valueQuantity) {
                    astInput.value = obs.valueQuantity.value.toFixed(0);
                    astInput.dispatchEvent(new Event('input'));
                    stalenessTracker.trackObservation('#fib4-ast', obs, LOINC_CODES.AST, 'AST');
                }
            }).catch(e => console.warn(e));

            getMostRecentObservation(client, LOINC_CODES.ALT).then(obs => {
                if (obs && obs.valueQuantity) {
                    altInput.value = obs.valueQuantity.value.toFixed(0);
                    altInput.dispatchEvent(new Event('input'));
                    stalenessTracker.trackObservation('#fib4-alt', obs, LOINC_CODES.ALT, 'ALT');
                }
            }).catch(e => console.warn(e));

            getMostRecentObservation(client, LOINC_CODES.PLATELETS).then(obs => {
                if (obs && obs.valueQuantity) {
                    pltInput.value = obs.valueQuantity.value.toFixed(0);
                    // Trigger input which handles unit conversion if needed (assuming standard)
                    pltInput.dispatchEvent(new Event('input'));
                    stalenessTracker.trackObservation('#fib4-plt', obs, LOINC_CODES.PLATELETS, 'Platelets');
                }
            }).catch(e => console.warn(e));
        }

        // Initial run
        calculate();
    }
};
