import {
    createMixedInputCalculator,
    MixedInputCalculatorConfig
} from '../shared/mixed-input-calculator.js';
import { uiBuilder } from '../../ui-builder.js';

const config: MixedInputCalculatorConfig = {
    id: 'homa-ir',
    title: 'HOMA-IR (Homeostatic Model Assessment for Insulin Resistance)',
    description: 'Approximates insulin resistance.',
    infoAlert: `
        <strong>Interpretation:</strong>
        <ul>
            <li><strong>< 1.9:</strong> Optimal insulin sensitivity</li>
            <li><strong>1.9 - 2.9:</strong> Early insulin resistance is likely</li>
            <li><strong>> 2.9:</strong> High likelihood of insulin resistance</li>
        </ul>
    `,
    sections: [
        {
            title: 'Parameters',
            icon: '🧪',
            inputs: [
                {
                    type: 'number',
                    id: 'homa-glucose',
                    label: 'Fasting Glucose',
                    placeholder: 'e.g. 100',
                    unitToggle: {
                        type: 'glucose',
                        units: ['mg/dL', 'mmol/L'],
                        default: 'mg/dL'
                    },
                    loincCode: '2339-0'
                },
                {
                    type: 'number',
                    id: 'homa-insulin',
                    label: 'Fasting Insulin',
                    placeholder: 'e.g. 10',
                    unitToggle: {
                        type: 'insulin',
                        units: ['µU/mL', 'pmol/L'],
                        default: 'µU/mL'
                    },
                    loincCode: '20448-7'
                }
            ]
        }
    ],
    formulas: [
        {
            label: 'HOMA-IR',
            formula:
                '<span class="formula-fraction"><span class="numerator">Fasting Glucose (mg/dL) × Fasting Insulin (µU/mL)</span><span class="denominator">405</span></span>'
        }
    ],
    calculate: values => {
        const glucose = values['homa-glucose'] as number | null;
        const insulin = values['homa-insulin'] as number | null;

        if (glucose === null || insulin === null) {
            return null;
        }

        return (glucose * insulin) / 405;
    },
    customResultRenderer: (score, values) => {
        let interpretation = '';
        let alertClass = 'ui-alert-success';

        if (score > 2.9) {
            interpretation = 'High likelihood of insulin resistance';
            alertClass = 'ui-alert-danger';
        } else if (score > 1.9) {
            interpretation = 'Early insulin resistance likely';
            alertClass = 'ui-alert-warning';
        } else {
            interpretation = 'Optimal insulin sensitivity';
            alertClass = 'ui-alert-success';
        }

        return `
            ${uiBuilder.createResultItem({
                label: 'HOMA-IR',
                value: score.toFixed(2),
                unit: '',
                interpretation: interpretation,
                alertClass: alertClass
            })}
        `;
    }
};

export const homaIr = createMixedInputCalculator(config);
