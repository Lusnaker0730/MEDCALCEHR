import {
    createMixedInputCalculator,
    MixedInputCalculatorConfig
} from '../shared/mixed-input-calculator.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';

const config: MixedInputCalculatorConfig = {
    id: 'nafld-fibrosis-score',
    title: 'NAFLD (Non-Alcoholic Fatty Liver Disease) Fibrosis Score',
    description: 'Estimates amount of scarring in the liver based on laboratory tests.',
    infoAlert: `
        <strong>Instructions:</strong> For use in patients with NAFLD to screen for advanced fibrosis.
    `,
    sections: [
        {
            title: 'Patient Demographics',
            icon: '👤',
            inputs: [
                {
                    type: 'number',
                    id: 'age',
                    label: 'Age',
                    unit: 'years'
                    // Age is typically auto-populated by the system if we use a standard ID or mechanism,
                    // but factory currently populates via loincCode or dataRequirements.
                    // We can rely on user input or custom init if needed.
                },
                {
                    type: 'number',
                    id: 'bmi',
                    label: 'BMI',
                    unit: 'kg/m²',
                    step: 0.1,
                    loincCode: LOINC_CODES.BMI
                },
                {
                    type: 'radio',
                    name: 'diabetes',
                    label: 'Impaired Fasting Glucose / Diabetes',
                    options: [
                        { value: '0', label: 'No' },
                        { value: '1', label: 'Yes (+1.13 points)' }
                    ]
                }
            ]
        },
        {
            title: 'Laboratory Values',
            icon: '🧪',
            inputs: [
                {
                    type: 'number',
                    id: 'ast',
                    label: 'AST',
                    unit: 'U/L',
                    loincCode: LOINC_CODES.AST
                },
                {
                    type: 'number',
                    id: 'alt',
                    label: 'ALT',
                    unit: 'U/L',
                    loincCode: LOINC_CODES.ALT
                },
                {
                    type: 'number',
                    id: 'platelet',
                    label: 'Platelet Count',
                    unitToggle: {
                        type: 'platelet',
                        units: ['×10⁹/L', 'K/µL'],
                        default: '×10⁹/L'
                    },
                    loincCode: LOINC_CODES.PLATELETS
                },
                {
                    type: 'number',
                    id: 'albumin',
                    label: 'Albumin',
                    step: 0.1,
                    unitToggle: {
                        type: 'albumin',
                        units: ['g/dL', 'g/L'],
                        default: 'g/dL'
                    },
                    loincCode: LOINC_CODES.ALBUMIN
                }
            ]
        }
    ],
    formulas: [
        {
            label: 'NAFLD Score',
            formula: '−1.675 + (0.037 × age [years]) + (0.094 × BMI [kg/m²]) + (1.13 × IFG/diabetes [yes = 1, no = 0]) + (0.99 × AST/ALT ratio) − (0.013 × platelet count [×10⁹/L]) − (0.66 × albumin [g/dL])'
        }
    ],
    formulaSection: {
        show: true,
        title: 'FACTS & FIGURES',
        tableHeaders: ['NAFLD Score', 'Correlated Fibrosis Severity'],
        interpretations: [
            { score: '< −1.455', interpretation: 'F0-F2', severity: 'success' },
            { score: '−1.455 – 0.675', interpretation: 'Indeterminant score', severity: 'warning' },
            { score: '> 0.675', interpretation: 'F3-F4', severity: 'danger' }
        ],
        footnotes: [
            '<strong>Fibrosis Severity Scale:</strong>',
            'F0 = no fibrosis',
            'F1 = mild fibrosis',
            'F2 = moderate fibrosis',
            'F3 = severe fibrosis',
            'F4 = cirrhosis'
        ]
    },
    calculate: values => {
        const age = values['age'] as number | null;
        const bmi = values['bmi'] as number | null;
        const diabetes = parseInt((values['diabetes'] as string) || '0');
        const ast = values['ast'] as number | null;
        const alt = values['alt'] as number | null;
        const platelet = values['platelet'] as number | null;
        const albumin = values['albumin'] as number | null;

        if (
            age === null ||
            bmi === null ||
            ast === null ||
            alt === null ||
            platelet === null ||
            albumin === null
        ) {
            return null;
        }

        if (alt === 0) return null; // Avoid division by zero

        const astAltRatio = ast / alt;
        return (
            -1.675 +
            0.037 * age +
            0.094 * bmi +
            1.13 * diabetes +
            0.99 * astAltRatio -
            0.013 * platelet -
            0.66 * albumin
        );
    },
    customResultRenderer: (score, values) => {
        let stage = '';
        let interpretation = '';
        let alertType = 'info';

        if (score < -1.455) {
            stage = 'F0-F2';
            interpretation = 'Low probability of advanced fibrosis';
            alertType = 'success';
        } else if (score <= 0.675) {
            stage = 'Indeterminate';
            interpretation = 'Further testing needed (e.g., elastography)';
            alertType = 'warning';
        } else {
            stage = 'F3-F4';
            interpretation = 'High probability of advanced fibrosis';
            alertType = 'danger';
        }

        return `
            ${uiBuilder.createResultItem({
                label: 'NAFLD Fibrosis Score',
                value: score.toFixed(3),
                unit: 'points',
                interpretation: stage,
                alertClass: `ui-alert-${alertType}`
            })}
            ${uiBuilder.createAlert({
                type: alertType as 'success' | 'warning' | 'danger' | 'info',
                message: `<strong>Interpretation:</strong> ${interpretation}`
            })}
        `;
    },
    dataRequirements: {
        autoPopulateAge: { inputId: 'age' }
    }
};

export const nafldFibrosisScore = createMixedInputCalculator(config);
