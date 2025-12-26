import {
    createMixedInputCalculator,
    MixedInputCalculatorConfig
} from '../shared/mixed-input-calculator.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';

const config: MixedInputCalculatorConfig = {
    id: 'serum-anion-gap',
    title: 'Serum Anion Gap',
    description: 'Evaluates states of metabolic acidosis.',
    infoAlert: `
        <h4>Interpretation:</h4>
        <ul class="info-list">
            <li><strong>Normal Range:</strong> 6-12 mEq/L</li>
            <li><strong>High (>12):</strong> High Anion Gap Metabolic Acidosis (MUDPILES)</li>
            <li><strong>Low (<6):</strong> Uncommon, possible lab error or hypoalbuminemia</li>
        </ul>
        <p class="mt-10"><strong>Note:</strong> For every 1 g/dL decrease in albumin below 4 g/dL, add 2.5 mEq/L to the anion gap (corrected gap).</p>
    `,
    sections: [
        {
            title: 'Electrolytes',
            icon: '🧪',
            inputs: [
                {
                    type: 'number',
                    id: 'sag-na',
                    label: 'Sodium (Na⁺)',
                    placeholder: 'e.g., 140',
                    unitToggle: {
                        type: 'electrolyte',
                        units: ['mEq/L', 'mmol/L'],
                        default: 'mEq/L'
                    },
                    loincCode: LOINC_CODES.SODIUM
                },
                {
                    type: 'number',
                    id: 'sag-cl',
                    label: 'Chloride (Cl⁻)',
                    placeholder: 'e.g., 100',
                    unitToggle: {
                        type: 'electrolyte',
                        units: ['mEq/L', 'mmol/L'],
                        default: 'mEq/L'
                    },
                    loincCode: LOINC_CODES.CHLORIDE
                },
                {
                    type: 'number',
                    id: 'sag-hco3',
                    label: 'Bicarbonate (HCO₃⁻)',
                    placeholder: 'e.g., 24',
                    unitToggle: {
                        type: 'electrolyte',
                        units: ['mEq/L', 'mmol/L'],
                        default: 'mEq/L'
                    },
                    loincCode: LOINC_CODES.BICARBONATE
                }
            ]
        }
    ],
    formulaSection: {
        show: true,
        type: 'list',
        title: 'FORMULA',
        scoringCriteria: [{ criteria: 'Anion Gap', points: 'Na⁺ - (Cl⁻ + HCO₃⁻)' }]
    },
    calculate: values => {
        const na = values['sag-na'] as number | null;
        const cl = values['sag-cl'] as number | null;
        const hco3 = values['sag-hco3'] as number | null;

        if (na === null || cl === null || hco3 === null) {
            return null;
        }

        return na - (cl + hco3);
    },
    customResultRenderer: (score, values) => {
        let interpretation = '';
        let alertClass = 'ui-alert-success';
        let alertType: 'success' | 'warning' | 'danger' | 'info' = 'success';
        let alertMsg = '';

        if (score > 12) {
            interpretation = 'High Anion Gap';
            alertClass = 'ui-alert-danger';
            alertType = 'danger';
            alertMsg =
                'Suggests metabolic acidosis (e.g., DKA, lactic acidosis, renal failure, toxic ingestions - MUDPILES).';
        } else if (score < 6) {
            interpretation = 'Low Anion Gap';
            alertClass = 'ui-alert-warning';
            alertType = 'warning';
            alertMsg = 'Less common, may be due to lab error, hypoalbuminemia, or paraproteinemia.';
        } else {
            interpretation = 'Normal Anion Gap';
            alertClass = 'ui-alert-success';
            alertType = 'success';
            alertMsg =
                'Metabolic acidosis, if present, is likely non-anion gap (e.g., diarrhea, renal tubular acidosis).';
        }

        return `
            ${uiBuilder.createResultItem({
                label: 'Serum Anion Gap',
                value: score.toFixed(1),
                unit: 'mEq/L',
                interpretation: interpretation,
                alertClass: alertClass
            })}
            ${uiBuilder.createAlert({
                type: alertType,
                message: alertMsg
            })}
        `;
    }
};

export const serumAnionGap = createMixedInputCalculator(config);
