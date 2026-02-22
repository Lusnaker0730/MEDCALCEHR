import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { createUnifiedFormulaCalculator } from '../shared/unified-formula-calculator.js';
import { fib4Calculation } from './calculation.js';

export const fib4 = createUnifiedFormulaCalculator({
    id: 'fib-4',
    title: 'Fibrosis-4 (FIB-4) Index',
    description: 'Estimates liver fibrosis in patients with chronic liver disease.',
    sections: [
        {
            title: 'Patient Parameters',
            icon: '👤',
            fields: [
                {
                    type: 'number',
                    id: 'fib4-age',
                    label: 'Age',
                    unit: 'years',
                    placeholder: 'e.g. 45',
                    validationType: 'age',
                    required: true
                },
                {
                    type: 'number',
                    id: 'fib4-ast',
                    label: 'AST (Aspartate Aminotransferase)',
                    unit: 'U/L',
                    placeholder: 'e.g. 30',
                    validationType: 'liverEnzyme',
                    loincCode: LOINC_CODES.AST,
                    required: true
                },
                {
                    type: 'number',
                    id: 'fib4-alt',
                    label: 'ALT (Alanine Aminotransferase)',
                    unit: 'U/L',
                    placeholder: 'e.g. 30',
                    validationType: 'liverEnzyme',
                    loincCode: LOINC_CODES.ALT,
                    required: true
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
                    validationType: 'platelets',
                    loincCode: LOINC_CODES.PLATELETS,
                    standardUnit: '×10⁹/L',
                    required: true
                }
            ]
        }
    ],
    formulas: [
        {
            label: 'FIB-4 Index',
            formula:
                '<span class="formula-fraction"><span class="numerator">Age × AST</span><span class="denominator">Platelets × √ALT</span></span>'
        }
    ],
    autoPopulateAge: 'fib4-age',
    calculate: fib4Calculation,
    customResultRenderer: results => {
        const res = results[0] as any;
        if (!res) return '';

        const score = res.value;
        const interp = res.ageInterpretation || '';
        const alertClass = res.ageAlertClass || 'info';
        const ishakStage = res.ishakStage || '';

        const footnote = '*Use with caution in patients <35 or >65 years old, as the score has been shown to be less reliable in these patients.';

        return `
            ${uiBuilder.createResultItem({
            label: 'FIB-4 Score',
            value: score,
            unit: 'points'
        })}
            ${uiBuilder.createResultItem({
            label: 'Age-Specific Interpretation',
            value: interp,
            alertClass: `ui-alert-${alertClass}`
        })}
            ${uiBuilder.createResultItem({
            label: 'Approximate Fibrosis Stage*',
            value: `Stage ${ishakStage}`,
            interpretation: 'Based on Ishak fibrosis staging'
        })}
            <div class="result-footnote mt-3 text-muted" style="font-size: 0.85em;">
                ${footnote}
            </div>
        `;
    }
});
