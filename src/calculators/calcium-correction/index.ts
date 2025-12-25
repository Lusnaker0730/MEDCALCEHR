import { createFormulaCalculator } from '../shared/formula-calculator.js';
import { LOINC_CODES } from '../../fhir-codes.js';

export const calciumCorrection = createFormulaCalculator({
    id: 'calcium-correction',
    title: 'Calcium Correction for Albumin',
    description: 'Calculates corrected calcium for patients with hypoalbuminemia.',
    inputs: [
        {
            id: 'ca-total',
            label: 'Total Calcium',
            type: 'number',
            standardUnit: 'mg/dL',
            unitConfig: { type: 'calcium', units: ['mg/dL', 'mmol/L'], default: 'mg/dL' },
            loincCode: LOINC_CODES.CALCIUM,
            min: 1,
            max: 20,
            step: 0.1
        },
        {
            id: 'ca-albumin',
            label: 'Albumin',
            type: 'number',
            standardUnit: 'g/dL',
            unitConfig: { type: 'albumin', units: ['g/dL', 'g/L'], default: 'g/dL' },
            loincCode: LOINC_CODES.ALBUMIN,
            min: 0.1,
            max: 10,
            step: 0.1
        }
    ],
    formulas: [
        {
            label: 'Corrected Calcium (mg/dL)',
            formula: 'Total Calcium + 0.8 × (4.0 - Albumin)'
        },
        { label: 'Note', formula: 'Normal albumin reference: 4.0 g/dL' }
    ],
    calculate: values => {
        const totalCalciumMgDl = values['ca-total'] as number;
        const albuminGdl = values['ca-albumin'] as number;

        if (!totalCalciumMgDl || !albuminGdl) return null;

        const correctedCalcium = totalCalciumMgDl + 0.8 * (4.0 - albuminGdl);
        const correctedCalciumMmol = correctedCalcium * 0.2495;

        let alertClass: 'success' | 'warning' | 'danger' | 'info' = 'success';
        let interpretation = 'Normal Range';

        if (correctedCalcium < 8.5) {
            alertClass = 'warning'; // Hypocalcemia
            interpretation = 'Hypocalcemia (< 8.5 mg/dL)';
        } else if (correctedCalcium > 10.5) {
            alertClass = 'danger'; // Hypercalcemia
            interpretation = 'Hypercalcemia (> 10.5 mg/dL)';
        }

        return [
            {
                label: 'Corrected Calcium',
                value: correctedCalcium.toFixed(2),
                unit: 'mg/dL',
                interpretation: interpretation,
                alertClass: alertClass
            },
            {
                label: 'Corrected Calcium (mmol/L)',
                value: correctedCalciumMmol.toFixed(2),
                unit: 'mmol/L'
            }
        ];
    },
    customResultRenderer: results => {
        const [target, mmol] = results;

        // Helper to generate result item HTML
        const renderItem = (res: any) => `
            <div class="ui-result-item ${res.alertClass ? 'ui-result-' + res.alertClass : ''}">
                <div class="ui-result-label">${res.label}</div>
                <div class="ui-result-value-container">
                    <span class="ui-result-value">${res.value}</span>
                    <span class="ui-result-unit">${res.unit}</span>
                </div>
                ${res.interpretation ? `<div class="ui-result-interpretation">${res.interpretation}</div>` : ''}
            </div>
        `;

        return `
            ${renderItem(target)}
            <div class="text-center mt-5 text-muted">
                (${mmol.value} mmol/L)
            </div>
            
             <div class="ui-alert ui-alert-warning mt-10">
                <span class="ui-alert-icon">⚠️</span>
                <div class="ui-alert-content">
                    <p><strong>Clinical Note:</strong> This correction is an estimation. For critically ill patients or precise assessment, measurement of ionized calcium is preferred.</p>
                </div>
            </div>
        `;
    }
});
