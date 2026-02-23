import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { createUnifiedFormulaCalculator } from '../shared/unified-formula-calculator.js';
import { calculateSodiumCorrection } from './calculation.js';
import type { FormulaCalculatorConfig } from '../../types/calculator-formula.js';

export const sodiumCorrectionConfig: FormulaCalculatorConfig = {
    id: 'sodium-correction',
    title: 'Sodium Correction for Hyperglycemia',
    description: 'Calculates the corrected sodium level in patients with hyperglycemia.',
    infoAlert:
        '<strong>Note:</strong> Serum glucose must be in mg/dL for these formulae to work. ' +
        'Both Katz (1973) and Hillier (1999) corrections are calculated simultaneously.',
    sections: [
        {
            title: 'Laboratory Values',
            icon: '🧪',
            fields: [
                {
                    type: 'number',
                    id: 'measured-sodium',
                    label: 'Sodium',
                    placeholder: '135',
                    unitToggle: {
                        type: 'sodium',
                        units: ['mEq/L', 'mmol/L'],
                        default: 'mEq/L'
                    },
                    standardUnit: 'mEq/L',
                    validationType: 'sodium',
                    loincCode: LOINC_CODES.SODIUM,
                    required: true
                },
                {
                    type: 'number',
                    id: 'glucose',
                    label: 'Glucose',
                    placeholder: '400',
                    unitToggle: {
                        type: 'glucose',
                        units: ['mg/dL', 'mmol/L'],
                        default: 'mg/dL'
                    },
                    standardUnit: 'mg/dL',
                    validationType: 'glucose',
                    loincCode: LOINC_CODES.GLUCOSE,
                    required: true
                }
            ]
        }
    ],
    formulas: [
        {
            label: 'Formulas',
            formula:
                'Corrected Sodium (Katz, 1973) = Measured sodium + 0.016 × (Serum glucose − 100)<br>' +
                'Corrected Sodium (Hillier, 1999) = Measured sodium + 0.024 × (Serum glucose − 100)<br>' +
                '<em>Note: Serum glucose must be in mg/dL for these formulae to work.</em>'
        }
    ],
    calculate: calculateSodiumCorrection,
    customResultRenderer: results => {
        const katzRes = results[0];
        const hillierRes = results[1];
        if (!katzRes || !hillierRes) return '';

        return `
            ${uiBuilder.createResultItem({
            label: katzRes.label,
            value: katzRes.value.toString(),
            unit: katzRes.unit,
            interpretation: katzRes.interpretation,
            alertClass: `ui-alert-${katzRes.alertClass}`
        })}
            ${uiBuilder.createResultItem({
            label: hillierRes.label,
            value: hillierRes.value.toString(),
            unit: hillierRes.unit,
            interpretation: hillierRes.interpretation,
            alertClass: `ui-alert-${hillierRes.alertClass}`
        })}
        `;
    }
};

export const sodiumCorrection = createUnifiedFormulaCalculator(sodiumCorrectionConfig);
