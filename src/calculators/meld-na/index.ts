import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import {
    createMixedInputCalculator,
    MixedInputCalculatorConfig
} from '../shared/mixed-input-calculator.js';

const config: MixedInputCalculatorConfig = {
    id: 'meld-na',
    title: 'MELD-Na (UNOS/OPTN)',
    description: 'Quantifies end-stage liver disease for transplant planning with sodium.',
    infoAlert: 'MELD-Na has superior predictive accuracy compared to MELD alone for 90-day mortality. Enter laboratory values below for automatic calculation.',
    sections: [
        {
            title: 'Laboratory Values',
            icon: '🧪',
            inputs: [
                {
                    id: 'bili',
                    label: 'Bilirubin (Total)',
                    type: 'number',
                    loincCode: LOINC_CODES.BILIRUBIN_TOTAL,
                    unit: 'mg/dL',
                    unitToggle: { type: 'bilirubin', units: ['mg/dL', 'µmol/L'], default: 'mg/dL' },
                    step: 0.1
                },
                {
                    id: 'inr',
                    label: 'INR',
                    type: 'number',
                    loincCode: LOINC_CODES.INR_COAG,
                    placeholder: 'e.g., 1.5',
                    step: 0.01
                },
                {
                    id: 'creat',
                    label: 'Creatinine',
                    type: 'number',
                    loincCode: LOINC_CODES.CREATININE,
                    unit: 'mg/dL',
                    unitToggle: { type: 'creatinine', units: ['mg/dL', 'µmol/L'], default: 'mg/dL' },
                    step: 0.1
                },
                {
                    id: 'sodium',
                    label: 'Sodium',
                    type: 'number',
                    loincCode: LOINC_CODES.SODIUM,
                    unit: 'mEq/L',
                    unitToggle: { type: 'sodium', units: ['mEq/L', 'mmol/L'], default: 'mEq/L' },
                    step: 1,
                    placeholder: '100 - 155'
                },
                {
                    name: 'dialysis',
                    label: 'Patient on dialysis twice in the last week',
                    type: 'radio',
                    options: [
                        { value: 'no', label: 'No', checked: true },
                        { value: 'yes', label: 'Yes' }
                    ]
                }
            ]
        }
    ],
    formulaSection: {
        type: 'list',
        show: true,
        scoringCriteria: [
            {
                criteria: 'MELD Score',
                points: '0.957 × ln(Creat) + 0.378 × ln(Bili) + 1.120 × ln(INR) + 0.643'
            },
            {
                criteria: 'MELD-Na Score (if MELD > 11)',
                points: 'MELD + 1.32 × (137 - Na) - [0.033 × MELD × (137 - Na)]'
            },
            {
                criteria: 'Constraints',
                points: 'Min lab values: 1.0; Max Creat: 4.0; Na capped: 125-137; Score range: 6-40'
            }
        ]
    },
    calculate: (values) => {
        const bili = values['bili'] as number;
        const inr = values['inr'] as number;
        const creat = values['creat'] as number;
        const sodium = values['sodium'] as number;
        const onDialysis = values['dialysis'] === 'yes';

        if (bili === null || inr === null || creat === null || sodium === null) {
            return null;
        }

        // Apply UNOS/OPTN rules
        const adjustedBili = Math.max(bili, 1.0);
        const adjustedInr = Math.max(inr, 1.0);
        let adjustedCreat = Math.max(creat, 1.0);

        if (onDialysis || adjustedCreat > 4.0) {
            adjustedCreat = 4.0;
        }

        // Calculate original MELD
        let meldScore =
            0.957 * Math.log(adjustedCreat) +
            0.378 * Math.log(adjustedBili) +
            1.12 * Math.log(adjustedInr) +
            0.643;

        meldScore = Math.round(meldScore * 10) / 10;

        // Calculate MELD-Na
        let meldNaScore = meldScore;
        const adjustedSodium = Math.max(125, Math.min(137, sodium));

        if (meldScore > 11) {
            meldNaScore =
                meldScore +
                1.32 * (137 - adjustedSodium) -
                0.033 * meldScore * (137 - adjustedSodium);
        }

        // Final score capping
        meldNaScore = Math.max(6, Math.min(40, meldNaScore));
        meldNaScore = Math.round(meldNaScore);

        return meldNaScore;
    },
    customResultRenderer: (score, values) => {
        const bili = values['bili'] as number;
        const inr = values['inr'] as number;
        const creat = values['creat'] as number;
        const onDialysis = values['dialysis'] === 'yes';

        // Re-calculate intermediate values for breakdown display
        // Note: we don't recalculate internal adjusted variables here easily without duplication, 
        // but we can show the inputs used.
        // Actually for the breakdown logic "adjusted values" are useful.
        // Let's duplicate the adjustment logic slightly for display purposes or just show raw inputs.
        // The original code showed "Adjusted" values. Let's try to replicate that if possible.

        const adjustedBili = Math.max(bili || 0, 1.0);
        const adjustedInr = Math.max(inr || 0, 1.0);
        let adjustedCreat = Math.max(creat || 0, 1.0);
        if (onDialysis || adjustedCreat > 4.0) {
            adjustedCreat = 4.0;
        }

        let meldScore =
            0.957 * Math.log(adjustedCreat) +
            0.378 * Math.log(adjustedBili) +
            1.12 * Math.log(adjustedInr) +
            0.643;
        meldScore = Math.round(meldScore * 10) / 10;

        let riskCategory = '';
        let mortalityRate = '';
        let alertClass = '';

        if (score < 10) {
            riskCategory = 'Low Risk';
            mortalityRate = '1.9%';
            alertClass = 'ui-alert-success';
        } else if (score <= 19) {
            riskCategory = 'Low-Moderate Risk';
            mortalityRate = '6.0%';
            alertClass = 'ui-alert-info';
        } else if (score <= 29) {
            riskCategory = 'Moderate Risk';
            mortalityRate = '19.6%';
            alertClass = 'ui-alert-warning';
        } else if (score <= 39) {
            riskCategory = 'High Risk';
            mortalityRate = '52.6%';
            alertClass = 'ui-alert-danger';
        } else {
            riskCategory = 'Very High Risk';
            mortalityRate = '71.3%';
            alertClass = 'ui-alert-danger';
        }

        return `
            ${uiBuilder.createResultItem({
            label: 'MELD-Na Score',
            value: score.toString(),
            unit: 'points',
            interpretation: `${riskCategory} (90-Day Mortality: ${mortalityRate})`,
            alertClass: alertClass
        })}
            
            <div class="mt-15 text-sm text-muted p-10">
                <strong>Calculation Breakdown:</strong><br>
                • Original MELD: ${meldScore.toFixed(1)}<br>
                • Adjusted Bilirubin: ${adjustedBili.toFixed(1)} mg/dL<br>
                • Adjusted INR: ${adjustedInr.toFixed(2)}<br>
                • Adjusted Creatinine: ${adjustedCreat.toFixed(1)} mg/dL ${onDialysis ? '(capped for dialysis)' : ''}
            </div>
            ${uiBuilder.createAlert({
            type: 'warning',
            message: '<strong>Clinical Note:</strong> Used for liver transplant priority allocation. Scores should be updated regularly as clinical status changes.'
        })}
        `;
    }
};

export const meldNa = createMixedInputCalculator(config);
