import { LOINC_CODES } from '../../fhir-codes.js';
import {
    getMostRecentObservation,
    calculateAge,
    getValueInStandardUnit
} from '../../utils.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';

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
                        unitToggle: true
                    })}
                `
            })}

            ${uiBuilder.createResultBox({ id: 'fib4-result', title: 'FIB-4 Index' })}

            ${uiBuilder.createFormulaSection({
                items: [
                    { label: 'FIB-4', content: '(Age × AST) / (Platelets × √ALT)' }
                ]
            })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);
        
        // Configure unit conversion for platelets
        UnitConverter.createUnitToggle(
            container.querySelector('#fib4-plt'), 
            'platelet', 
            ['×10⁹/L', 'K/µL', 'thou/mm³']
        );

        const ageInput = container.querySelector('#fib4-age');
        const astInput = container.querySelector('#fib4-ast');
        const altInput = container.querySelector('#fib4-alt');
        const pltInput = container.querySelector('#fib4-plt');

        if (patient && patient.birthDate) {
            ageInput.value = calculateAge(patient.birthDate);
        }

        const calculate = () => {
            const age = parseFloat(ageInput.value);
            const ast = parseFloat(astInput.value);
            const alt = parseFloat(altInput.value);
            // Use UnitConverter to get standard value (×10^9/L)
            // Note: 10^9/L = K/uL, so standard conversion factor is usually 1 if units match
            // Standard unit for calculation is 10^9/L (which is same number as K/uL e.g. 150)
            const plt = UnitConverter.getStandardValue(pltInput);

            const resultBox = container.querySelector('#fib4-result');
            const resultContent = resultBox.querySelector('.ui-result-content');

            if (age > 0 && ast > 0 && alt > 0 && plt > 0) {
                const fib4_score = (age * ast) / (plt * Math.sqrt(alt));

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
                resultBox.classList.add('show');
            } else {
                resultBox.classList.remove('show');
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
                    calculate();
                }
            });

            getMostRecentObservation(client, LOINC_CODES.ALT).then(obs => {
                if (obs && obs.valueQuantity) {
                    altInput.value = obs.valueQuantity.value.toFixed(0);
                    calculate();
                }
            });

            getMostRecentObservation(client, LOINC_CODES.PLATELETS).then(obs => {
                if (obs && obs.valueQuantity) {
                    pltInput.value = obs.valueQuantity.value.toFixed(0);
                    // Assuming unit might need conversion or is standard
                    // For simplicity, assuming standard or matched unit for now
                    // Real implementation might need UnitConverter.convert
                    calculate();
                }
            });
        }
        
        calculate();
    }
};
