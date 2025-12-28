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
    formulas: [
        {
            label: 'Key formulas include:',
            formula: `
                <ol class="info-list" style="list-style-type: decimal; padding-left: 20px;">
                    <li><strong>Anion Gap</strong> = Na − (Cl + HCO3−)<br>
                        <span class="formula-code">Anion gap, mEq/L = sodium, mEq/L − (chloride, mEq/L + bicarbonate, mEq/L)</span>
                    </li>
                    <li><strong>Delta Gap</strong> = the patient's Anion Gap − the "normal" anion gap (considered to be 10 to 12)</li>
                    <li><strong>Albumin corrected anion gap</strong>, mEq/L = anion gap + [ 2.5 × (4 − albumin, g/dL) ]</li>
                    <li><strong>Albumin corrected delta gap</strong>, mEq/L = albumin corrected anion gap − "normal" anion gap (considered to be 10 to 12)</li>
                    <li><strong>Delta ratio</strong> = delta anion gap / (24 − bicarbonate, mEq/L)</li>
                    <li><strong>Albumin corrected delta ratio</strong> = albumin corrected delta gap / (24 − bicarbonate, mEq/L)</li>
                </ol>
            `
        }
    ],
    formulaSection: {
        show: true,
        title: 'FACTS & FIGURES',
        calculationNote: 'Interpretation:',
        footnotes: [
            'The delta ratio is the ratio of the amount of additional anion in a body to the amount of additional H⁺. The anion\'s volume of distribution and its excretion affect this ratio. Organic acids with a greater distribution may produce lower anion gaps compared to inorganic acids, which may be confined to the extracellular compartment.'
        ],
        tableHeaders: ['Delta ratio', 'Suggests...'],
        interpretations: [
            { score: '<0.4', interpretation: 'Pure normal anion gap acidosis', severity: 'info' },
            { score: '0.4-0.8', interpretation: 'Mixed high and normal anion gap acidosis', severity: 'warning' },
            { score: '0.8-2.0', interpretation: 'Pure anion gap acidosis', severity: 'danger' },
            { score: '>2', interpretation: 'High anion gap acidosis with pre-existing metabolic alkalosis', severity: 'danger' }
        ]
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
