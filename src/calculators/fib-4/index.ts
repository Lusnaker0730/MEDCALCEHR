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

export const fib4: CalculatorModule = {
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
            ${uiBuilder.createResultBox({ id: 'fib4-result', title: 'FIB-4 Index Results' })}

            ${uiBuilder.createFormulaSection({
            items: [
                { label: 'FIB-4', content: '(Age × AST) / (Platelets × √ALT)' }
            ]
        })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        // Initialize FHIRDataService
        fhirDataService.initialize(client, patient, container);

        const ageInput = container.querySelector('#fib4-age') as HTMLInputElement;
        const astInput = container.querySelector('#fib4-ast') as HTMLInputElement;
        const altInput = container.querySelector('#fib4-alt') as HTMLInputElement;
        const pltInput = container.querySelector('#fib4-plt') as HTMLInputElement;

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
                const plt = UnitConverter.getStandardValue(pltInput, '×10⁹/L');

                // Define validation schema
                const inputs = { age, ast, alt, plt };
                const schema = {
                    age: ValidationRules.age,
                    ast: ValidationRules.liverEnzyme,
                    alt: ValidationRules.liverEnzyme,
                    plt: ValidationRules.platelets
                };

                // @ts-ignore
                const validation = validateCalculatorInput(inputs, schema);

                if (!validation.isValid) {
                    const hasInput = ageInput.value || astInput.value || altInput.value || pltInput.value;

                    if (hasInput) {
                        const meaningfulErrors = validation.errors.filter((msg: string) => true);
                        const valuesPresent = !isNaN(age) && !isNaN(ast) && !isNaN(alt) && plt !== null && !isNaN(plt);

                        if (valuesPresent || validation.errors.some((e: string) => !e.includes('required'))) {
                            if (meaningfulErrors.length > 0) {
                                if (errorContainer) displayError(errorContainer as HTMLElement, new ValidationError(meaningfulErrors[0], 'VALIDATION_ERROR'));
                            }
                        }
                    }

                    if (resultBox) resultBox.classList.remove('show');
                    return;
                }

                if (plt === null) return;

                if (age > 0 && ast > 0 && alt > 0 && plt > 0) {
                    const fib4_score = (age * ast) / (plt * Math.sqrt(alt));

                    if (!isFinite(fib4_score) || isNaN(fib4_score)) {
                        throw new ValidationError('Calculation resulted in an invalid number.', 'CALCULATION_ERROR');
                    }

                    let interpretation = '';
                    let recommendation = '';
                    let alertType: 'success' | 'danger' | 'warning' = 'info' as any;

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

                    if (resultBox) {
                        const resultContent = resultBox.querySelector('.ui-result-content');
                        if (resultContent) {
                            resultContent.innerHTML = `
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
                            `;
                        }
                        resultBox.classList.add('show');
                    }
                } else {
                    if (resultBox) resultBox.classList.remove('show');
                }
            } catch (error) {
                logError(error as Error, { calculator: 'fib-4', action: 'calculate' });
                if (errorContainer) displayError(errorContainer as HTMLElement, error as Error);
                if (resultBox) resultBox.classList.remove('show');
            }
        };

        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculate);
        });

        // Auto-populate from FHIR using FHIRDataService
        const autoPopulate = async () => {
            if (fhirDataService.isReady()) {
                try {
                    // Get age
                    const age = await fhirDataService.getPatientAge();
                    if (age !== null && ageInput) {
                        ageInput.value = age.toString();
                        ageInput.dispatchEvent(new Event('input'));
                    }

                    // Get lab values in parallel
                    const [astResult, altResult, pltResult] = await Promise.all([
                        fhirDataService.getObservation(LOINC_CODES.AST, {
                            trackStaleness: true,
                            stalenessLabel: 'AST'
                        }),
                        fhirDataService.getObservation(LOINC_CODES.ALT, {
                            trackStaleness: true,
                            stalenessLabel: 'ALT'
                        }),
                        fhirDataService.getObservation(LOINC_CODES.PLATELETS, {
                            trackStaleness: true,
                            stalenessLabel: 'Platelets'
                        })
                    ]);

                    if (astResult.value !== null && astInput) {
                        astInput.value = astResult.value.toFixed(0);
                        astInput.dispatchEvent(new Event('input'));
                    }
                    if (altResult.value !== null && altInput) {
                        altInput.value = altResult.value.toFixed(0);
                        altInput.dispatchEvent(new Event('input'));
                    }
                    if (pltResult.value !== null && pltInput) {
                        pltInput.value = pltResult.value.toFixed(0);
                        pltInput.dispatchEvent(new Event('input'));
                    }
                } catch (e) {
                    console.warn('Error auto-populating FIB-4:', e);
                }
            }
            calculate();
        };

        autoPopulate();
    }
};
