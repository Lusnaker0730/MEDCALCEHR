import {
    createMixedInputCalculator,
    MixedInputCalculatorConfig
} from '../shared/mixed-input-calculator.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';

const config: MixedInputCalculatorConfig = {
    id: 'serum-osmolality',
    title: 'Serum Osmolality/Osmolarity',
    description:
        'Calculates expected serum osmolarity, for comparison to measured osmolality to detect unmeasured compounds in the serum.',
    infoAlert:
        '<h4>Normal Range:</h4><p>275-295 mOsm/kg</p><p class="mt-10"><strong>Osmolar Gap:</strong> Measured Osmolality - Calculated Osmolality</p><p>Gap > 10 mOsm/kg suggests unmeasured osmoles (e.g., toxic alcohols, ketones).</p>',
    sections: [
        {
            title: 'Lab Values',
            icon: '🧪',
            inputs: [
                {
                    type: 'number',
                    id: 'osmo-na',
                    label: 'Sodium (Na)',
                    placeholder: 'e.g., 140',
                    unitToggle: {
                        type: 'sodium',
                        units: ['mEq/L', 'mmol/L'],
                        default: 'mEq/L'
                    },
                    loincCode: LOINC_CODES.SODIUM
                },
                {
                    type: 'number',
                    id: 'osmo-glucose',
                    label: 'Glucose',
                    placeholder: 'e.g., 100',
                    unitToggle: {
                        type: 'glucose',
                        units: ['mg/dL', 'mmol/L'],
                        default: 'mg/dL'
                    },
                    loincCode: LOINC_CODES.GLUCOSE
                },
                {
                    type: 'number',
                    id: 'osmo-bun',
                    label: 'BUN',
                    placeholder: 'e.g., 15',
                    unitToggle: {
                        type: 'bun',
                        units: ['mg/dL', 'mmol/L'],
                        default: 'mg/dL'
                    },
                    loincCode: LOINC_CODES.BUN
                },
                {
                    type: 'number',
                    id: 'osmo-ethanol',
                    label: 'Ethanol (Optional)',
                    placeholder: 'e.g., 0',
                    unit: 'mg/dL',
                    helpText: 'If known, improves accuracy in suspected ingestion.'
                }
            ]
        }
    ],
    formulaSection: {
        show: true,
        type: 'list',
        title: 'FORMULA',
        calculationNote: 'Measurements in mg/dL:',
        scoringCriteria: [
            { criteria: 'Osmolality', points: '2 × Na + (Glucose / 18) + (BUN / 2.8) + (Ethanol / 4.6)' }
        ]
    },
    calculate: values => {
        const na = values['osmo-na'] as number | null;
        const glucose = values['osmo-glucose'] as number | null;
        const bun = values['osmo-bun'] as number | null;
        const ethanol = (values['osmo-ethanol'] as number | null) || 0;

        if (na === null || glucose === null || bun === null) {
            return null;
        }

        return 2 * na + glucose / 18 + bun / 2.8 + ethanol / 4.6;
    },
    customResultRenderer: (score, values) => {
        const na = values['osmo-na'] as number;
        const glucose = values['osmo-glucose'] as number;
        const bun = values['osmo-bun'] as number;
        const ethanol = (values['osmo-ethanol'] as number | null) || 0;

        let interpretation = '';
        let alertClass = 'ui-alert-success';
        let alertType: 'success' | 'warning' | 'info' = 'success';
        let alertMsg = 'Within normal range.';

        if (score < 275) {
            interpretation = 'Low Osmolality';
            alertClass = 'ui-alert-info';
            alertType = 'info';
            alertMsg = 'Below normal range (275-295 mOsm/kg).';
        } else if (score > 295) {
            interpretation = 'High Osmolality';
            alertClass = 'ui-alert-warning';
            alertType = 'warning';
            alertMsg = 'Above normal range (275-295 mOsm/kg).';
        }

        return `
            ${uiBuilder.createResultItem({
            label: 'Calculated Osmolality',
            value: score.toFixed(1),
            unit: 'mOsm/kg',
            interpretation: interpretation,
            alertClass: alertClass
        })}
            ${uiBuilder.createAlert({
            type: alertType,
            message: alertMsg
        })}
            ${uiBuilder.createSection({
            title: 'Calculation Breakdown',
            content: `
                    <div class="text-sm text-muted">
                        <div>2 × Na: ${(2 * na).toFixed(1)}</div>
                        <div>Glucose / 18: ${(glucose / 18).toFixed(1)}</div>
                        <div>BUN / 2.8: ${(bun / 2.8).toFixed(1)}</div>
                        ${ethanol > 0 ? `<div>Ethanol / 4.6: ${(ethanol / 4.6).toFixed(1)}</div>` : ''}
                    </div>
                `
        })}
        `;
    }
};

export const serumOsmolality = createMixedInputCalculator(config);
