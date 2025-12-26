import {
    createMixedInputCalculator,
    MixedInputCalculatorConfig
} from '../shared/mixed-input-calculator.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';

const config: MixedInputCalculatorConfig = {
    id: 'ttkg',
    title: 'Transtubular Potassium Gradient (TTKG)',
    description: 'May help in assessment of hyperkalemia or hypokalemia.',
    infoAlert: `
        <h4>Clinical Interpretation</h4>
        <ul>
            <li><strong>Hypokalemia (K < 3.5):</strong>
                <ul>
                    <li>TTKG < 3: Non-renal loss (GI, etc.)</li>
                    <li>TTKG > 3: Renal loss</li>
                </ul>
            </li>
            <li><strong>Hyperkalemia (K > 5.2):</strong>
                <ul>
                    <li>TTKG > 10: Normal renal response</li>
                    <li>TTKG < 7: Hypoaldosteronism or resistance</li>
                </ul>
            </li>
        </ul>
    `,
    sections: [
        {
            title: 'Lab Values',
            icon: '🧪',
            inputs: [
                {
                    type: 'number',
                    id: 'ttkg-urine-k',
                    label: 'Urine Potassium',
                    placeholder: 'e.g. 40',
                    unitToggle: {
                        type: 'electrolyte',
                        units: ['mEq/L', 'mmol/L'],
                        default: 'mEq/L'
                    },
                    loincCode: LOINC_CODES.URINE_POTASSIUM
                },
                {
                    type: 'number',
                    id: 'ttkg-serum-k',
                    label: 'Serum Potassium',
                    placeholder: 'Norm: 3.5 - 5.2',
                    unitToggle: {
                        type: 'electrolyte',
                        units: ['mEq/L', 'mmol/L'],
                        default: 'mEq/L'
                    },
                    loincCode: LOINC_CODES.POTASSIUM
                },
                {
                    type: 'number',
                    id: 'ttkg-urine-osmo',
                    label: 'Urine Osmolality',
                    unit: 'mOsm/kg',
                    placeholder: 'Norm: 500 - 800',
                    loincCode: '2697-2'
                },
                {
                    type: 'number',
                    id: 'ttkg-serum-osmo',
                    label: 'Serum Osmolality',
                    unit: 'mOsm/kg',
                    placeholder: 'Norm: 275 - 295',
                    loincCode: '2695-6'
                }
            ]
        }
    ],
    formulaSection: {
        show: true,
        type: 'list',
        title: 'FORMULA',
        calculationNote: 'Valid only when Urine Osmolality > Serum Osmolality.',
        scoringCriteria: [
            {
                criteria: 'TTKG',
                points: '(Urine K × Serum Osmolality) / (Serum K × Urine Osmolality)'
            }
        ]
    },
    calculate: values => {
        const urineK = values['ttkg-urine-k'] as number | null;
        const serumK = values['ttkg-serum-k'] as number | null;
        const urineOsmo = values['ttkg-urine-osmo'] as number | null;
        const serumOsmo = values['ttkg-serum-osmo'] as number | null;

        if (urineK === null || serumK === null || urineOsmo === null || serumOsmo === null) {
            return null;
        }

        if (serumK === 0 || urineOsmo === 0) return 0; // Avoid division by zero

        return (urineK * serumOsmo) / (serumK * urineOsmo);
    },
    customResultRenderer: (score, values) => {
        const serumK = values['ttkg-serum-k'] as number;
        const urineOsmo = values['ttkg-urine-osmo'] as number;
        const serumOsmo = values['ttkg-serum-osmo'] as number;

        let interpretation = '';
        let alertType: 'success' | 'warning' | 'danger' | 'info' = 'info';

        if (serumK < 3.5) {
            // Hypokalemia
            if (score < 3) {
                interpretation =
                    'Suggests non-renal potassium loss (e.g., GI loss, transcellular shift).';
                alertType = 'success';
            } else {
                interpretation = 'Suggests renal potassium wasting.';
                alertType = 'warning';
            }
        } else if (serumK > 5.2) {
            // Hyperkalemia
            if (score > 10) {
                interpretation =
                    'Suggests hyperkalemia is driven by high potassium intake (dietary or iatrogenic).';
                alertType = 'success';
            } else if (score < 7) {
                interpretation =
                    'Suggests an issue with aldosterone (e.g., hypoaldosteronism or aldosterone resistance).';
                alertType = 'warning';
            }
        } else {
            interpretation =
                'Normal potassium levels. TTKG should be interpreted in context of potassium disorders.';
        }

        if (urineOsmo <= serumOsmo) {
            interpretation = `<strong>Warning:</strong> TTKG is not valid when Urine Osmolality (${urineOsmo}) ≤ Serum Osmolality (${serumOsmo}).`;
            alertType = 'warning';
        }

        return `
            ${uiBuilder.createResultItem({
                label: 'TTKG',
                value: score.toFixed(2),
                interpretation: interpretation,
                alertClass: `ui-alert-${alertType}`
            })}
        `;
    }
};

export const ttkg = createMixedInputCalculator(config);
