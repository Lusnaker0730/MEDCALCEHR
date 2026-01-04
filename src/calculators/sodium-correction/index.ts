import { createFormulaCalculator } from '../shared/formula-calculator.js';
import { LOINC_CODES } from '../../fhir-codes.js';

export const sodiumCorrection = createFormulaCalculator({
    id: 'sodium-correction',
    title: 'Sodium Correction for Hyperglycemia',
    description: 'Calculates the actual sodium level in patients with hyperglycemia.',
    inputs: [
        {
            id: 'measured-sodium',
            label: 'Measured Sodium',
            type: 'number',
            standardUnit: 'mEq/L',
            unitConfig: { type: 'sodium', units: ['mEq/L', 'mmol/L'], default: 'mEq/L' },
            validationType: 'sodium',
            loincCode: LOINC_CODES.SODIUM,
            placeholder: 'e.g., 135',
            min: 100,
            max: 200,
            step: 1
        },
        {
            id: 'glucose',
            label: 'Serum Glucose',
            type: 'number',
            standardUnit: 'mg/dL',
            unitConfig: { type: 'glucose', units: ['mg/dL', 'mmol/L'], default: 'mg/dL' },
            validationType: 'glucose',
            loincCode: LOINC_CODES.GLUCOSE,
            placeholder: 'e.g., 400',
            min: 0,
            max: 2000,
            step: 1
        },
        {
            id: 'correction-factor',
            label: 'Correction Factor',
            type: 'radio',
            options: [
                { value: '1.6', label: '1.6 (Standard, Hillier)', checked: true },
                { value: '2.4', label: '2.4 (Katz, suggested for Glucose > 400 mg/dL)' }
            ],
            helpText:
                'Standard factor is 1.6 mEq/L for every 100 mg/dL glucose above 100. Some suggest 2.4 when glucose > 400 mg/dL.'
        }
    ],
    formulas: [
        {
            label: 'Corrected Na',
            formula: 'Measured Na + [Correction Factor × (Glucose - 100) / 100]'
        }
    ],
    calculate: values => {
        const measuredSodium = values['measured-sodium'] as number;
        const glucoseMgDl = values['glucose'] as number;
        const correctionFactor = parseFloat((values['correction-factor'] as string) || '1.6');

        if (!measuredSodium || !glucoseMgDl) return null;

        const correctedSodium = measuredSodium + correctionFactor * ((glucoseMgDl - 100) / 100);

        // Interpretation
        let interpretation = '';
        let alertClass: 'success' | 'warning' | 'danger' | 'info' = 'success';

        if (correctedSodium < 136) {
            interpretation = 'Low (Hyponatremia)';
            alertClass = 'warning';
        } else if (correctedSodium > 145) {
            interpretation = 'High (Hypernatremia)';
            alertClass = 'danger';
        } else {
            interpretation = 'Normal';
            alertClass = 'success';
        }

        return [
            {
                label: 'Corrected Sodium',
                value: correctedSodium.toFixed(1),
                unit: 'mEq/L',
                interpretation: interpretation,
                alertClass: alertClass
            },
            {
                label: 'Correction Amount',
                value: `+${(correctedSodium - measuredSodium).toFixed(1)}`,
                unit: 'mEq/L'
            },
            // Hack to pass through extra data for custom renderer
            { label: '_glucose', value: glucoseMgDl },
            { label: '_factor', value: correctionFactor }
        ];
    },
    customResultRenderer: results => {
        const mainRes = results[0];
        const amountRes = results[1];
        const glucose = results[2].value as number;
        const factor = results[3].value as number;

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

        let alertHTML = '';
        if (factor === 1.6 && glucose > 400) {
            alertHTML = `
                <div class="ui-alert ui-alert-warning mt-10">
                    <span class="ui-alert-icon">⚠️</span>
                    <div class="ui-alert-content">
                        Glucose > 400 mg/dL. Consider using correction factor of 2.4.
                    </div>
                </div>
            `;
        }

        return `
            ${renderItem(mainRes)}
             <div class="ui-result-item">
                <div class="ui-result-label">Amount Added</div>
                <div class="ui-result-value-container">
                    <span class="ui-result-value">${amountRes.value}</span>
                    <span class="ui-result-unit">${amountRes.unit}</span>
                 </div>
            </div>
            ${alertHTML}
        `;
    }
});
