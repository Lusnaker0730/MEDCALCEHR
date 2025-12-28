import {
    createMixedInputCalculator,
    MixedInputCalculatorConfig
} from '../shared/mixed-input-calculator.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';

const config: MixedInputCalculatorConfig = {
    id: 'fib-4',
    title: 'Fibrosis-4 (FIB-4) Index',
    description: 'Estimates liver fibrosis in patients with chronic liver disease.',
    sections: [
        {
            title: 'Patient Parameters',
            icon: '👤',
            inputs: [
                {
                    type: 'number',
                    id: 'fib4-age',
                    label: 'Age',
                    unit: 'years',
                    placeholder: 'e.g. 45'
                },
                {
                    type: 'number',
                    id: 'fib4-ast',
                    label: 'AST (Aspartate Aminotransferase)',
                    unit: 'U/L',
                    placeholder: 'e.g. 30',
                    loincCode: LOINC_CODES.AST
                },
                {
                    type: 'number',
                    id: 'fib4-alt',
                    label: 'ALT (Alanine Aminotransferase)',
                    unit: 'U/L',
                    placeholder: 'e.g. 30',
                    loincCode: LOINC_CODES.ALT
                },
                {
                    type: 'number',
                    id: 'fib4-plt',
                    label: 'Platelet Count',
                    placeholder: 'e.g. 250',
                    unitToggle: {
                        type: 'platelet',
                        units: ['×10⁹/L', 'K/µL', 'thou/mm³'],
                        default: '×10⁹/L'
                    },
                    loincCode: LOINC_CODES.PLATELETS
                }
            ]
        }
    ],
    formulas: [
        {
            label: 'FIB-4 Index',
            formula: '<span class="formula-fraction"><span class="numerator">Age × AST</span><span class="denominator">Platelets × √ALT</span></span>'
        }
    ],
    dataRequirements: {
        autoPopulateAge: { inputId: 'fib4-age' }
    },
    calculate: values => {
        const age = values['fib4-age'] as number | null;
        const ast = values['fib4-ast'] as number | null;
        const alt = values['fib4-alt'] as number | null;
        const plt = values['fib4-plt'] as number | null;

        if (age === null || ast === null || alt === null || plt === null) {
            return null;
        }

        if (plt === 0 || alt < 0) return null; // Prevent division by zero or sqrt of negative

        return (age * ast) / (plt * Math.sqrt(alt));
    },
    customResultRenderer: (score, values) => {
        let interpretation = '';
        let recommendation = '';
        let alertType: 'success' | 'danger' | 'warning' = 'info' as any;

        if (score < 1.3) {
            interpretation = 'Low Risk (Low probability of advanced fibrosis F3-F4)';
            recommendation = 'Continue routine monitoring.';
            alertType = 'success';
        } else if (score > 2.67) {
            interpretation = 'High Risk (High probability of advanced fibrosis F3-F4)';
            recommendation = 'Referral to hepatology recommended. Consider FibroScan or biopsy.';
            alertType = 'danger';
        } else {
            interpretation = 'Indeterminate Risk';
            recommendation = 'Further evaluation needed (e.g. FibroScan, elastography).';
            alertType = 'warning';
        }

        return `
            ${uiBuilder.createResultItem({
                label: 'FIB-4 Score',
                value: score.toFixed(2),
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
};

export const fib4 = createMixedInputCalculator(config);
