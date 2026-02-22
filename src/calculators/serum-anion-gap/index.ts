import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { createUnifiedFormulaCalculator } from '../shared/unified-formula-calculator.js';
import { serumAnionGapCalculation } from './calculation.js';

export const serumAnionGap = createUnifiedFormulaCalculator({
    id: 'serum-anion-gap',
    title: 'Serum Anion Gap',
    description: 'Evaluates states of metabolic acidosis.',
    infoAlert:
        '<strong>Normal Anion Gap:</strong> 6–12 mEq/L. ' +
        '<strong>Albumin correction:</strong> For every 1 g/dL decrease in albumin below 4 g/dL, add 2.5 mEq/L to the anion gap.',
    sections: [
        {
            title: 'Electrolytes',
            icon: '🧪',
            fields: [
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
                    validationType: 'sodium',
                    loincCode: LOINC_CODES.SODIUM,
                    standardUnit: 'mEq/L',
                    required: true
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
                    validationType: 'chloride',
                    loincCode: LOINC_CODES.CHLORIDE,
                    standardUnit: 'mEq/L',
                    required: true
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
                    validationType: 'bicarbonate',
                    loincCode: LOINC_CODES.BICARBONATE,
                    standardUnit: 'mEq/L',
                    required: true
                },
                {
                    type: 'number',
                    id: 'sag-albumin',
                    label: 'Albumin (optional)',
                    helpText: 'Required for albumin-corrected anion gap and delta ratio',
                    placeholder: 'Norm: 3.5 - 5.0',
                    unitToggle: {
                        type: 'albumin',
                        units: ['g/dL', 'g/L'],
                        default: 'g/dL'
                    },
                    validationType: 'albumin',
                    loincCode: LOINC_CODES.ALBUMIN,
                    standardUnit: 'g/dL',
                    required: false
                }
            ]
        }
    ],
    formulas: [
        {
            label: 'Key Formulas',
            formula:
                '<ol class="info-list" style="list-style-type: decimal; padding-left: 20px;">' +
                '<li><strong>Anion Gap</strong> = Na − (Cl + HCO₃⁻)</li>' +
                '<li><strong>Delta Gap</strong> = Anion Gap − 12 (normal AG)</li>' +
                '<li><strong>Albumin-corrected AG</strong>, mEq/L = AG + [2.5 × (4 − albumin, g/dL)]</li>' +
                '<li><strong>Albumin-corrected Delta Gap</strong>, mEq/L = Albumin-corrected AG − 12</li>' +
                '<li><strong>Delta Ratio</strong> = Delta Gap / (24 − HCO₃⁻)</li>' +
                '<li><strong>Albumin-corrected Delta Ratio</strong> = Albumin-corrected Delta Gap / (24 − HCO₃⁻)</li>' +
                '</ol>'
        }
    ],
    calculate: serumAnionGapCalculation,
    customResultRenderer: results => {
        if (!results || results.length === 0) return '';

        const resultItems = results
            .map(res =>
                uiBuilder.createResultItem({
                    label: res.label,
                    value: res.value,
                    unit: res.unit,
                    interpretation: res.interpretation,
                    alertClass: res.alertClass ? `ui-alert-${res.alertClass}` : ''
                })
            )
            .join('');

        // Show detailed alert for Anion Gap interpretation
        const agRes = results[0];
        const payload = agRes?.alertPayload as { alertMsg?: string } | undefined;
        const alertMsg = payload?.alertMsg ?? '';
        const alertClass = agRes?.alertClass || 'info';

        const deltaRatioTable = uiBuilder.createAlert({
            type: 'info',
            message:
                '<h4>📊 Delta Ratio Interpretation</h4>' +
                uiBuilder.createTable({
                    headers: ['Delta Ratio', 'Suggests...'],
                    rows: [
                        ['<0.4', 'Pure normal anion gap acidosis'],
                        ['0.4–0.8', 'Mixed high and normal anion gap acidosis'],
                        ['0.8–2.0', 'Pure anion gap acidosis'],
                        ['>2', 'High anion gap acidosis with pre-existing metabolic alkalosis']
                    ]
                })
        });

        return `
            ${resultItems}
            ${alertMsg ? uiBuilder.createAlert({ type: alertClass as 'success' | 'warning' | 'danger' | 'info', message: alertMsg }) : ''}
            ${deltaRatioTable}
        `;
    }
});
