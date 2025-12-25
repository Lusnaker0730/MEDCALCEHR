import { createFormulaCalculator } from '../shared/formula-calculator.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { UnitConverter } from '../../unit-converter.js';
import { uiBuilder } from '../../ui-builder.js';

export const ldl = createFormulaCalculator({
    id: 'ldl',
    title: 'LDL Calculated',
    description: 'Calculates LDL based on total and HDL cholesterol and triglycerides.',
    inputs: [
        {
            id: 'ldl-tc',
            label: 'Total Cholesterol',
            type: 'number',
            standardUnit: 'mg/dL',
            unitConfig: { type: 'cholesterol', units: ['mg/dL', 'mmol/L'], default: 'mg/dL' },
            loincCode: LOINC_CODES.CHOLESTEROL_TOTAL,
            placeholder: 'Enter Total Cholesterol',
            min: 1,
            max: 1000,
            step: 1
        },
        {
            id: 'ldl-hdl',
            label: 'HDL Cholesterol',
            type: 'number',
            standardUnit: 'mg/dL',
            unitConfig: { type: 'cholesterol', units: ['mg/dL', 'mmol/L'], default: 'mg/dL' },
            loincCode: LOINC_CODES.HDL,
            placeholder: 'Enter HDL Cholesterol',
            min: 1,
            max: 200,
            step: 1
        },
        {
            id: 'ldl-trig',
            label: 'Triglycerides',
            type: 'number',
            standardUnit: 'mg/dL',
            unitConfig: { type: 'triglycerides', units: ['mg/dL', 'mmol/L'], default: 'mg/dL' },
            loincCode: LOINC_CODES.TRIGLYCERIDES,
            placeholder: 'Enter Triglycerides',
            min: 1,
            max: 2000,
            step: 1
        }
    ],
    formulas: [
        {
            label: 'Friedewald Equation',
            formula: 'LDL = Total Cholesterol - HDL - (Triglycerides / 5)'
        }
    ],
    calculate: (values) => {
        const tcVal = values['ldl-tc'] as number;
        const hdlVal = values['ldl-hdl'] as number;
        const trigVal = values['ldl-trig'] as number;

        if (!tcVal || !hdlVal || !trigVal) return null;

        // Pass Trig value to be handled by custom renderer for error display
        // Returning null from calculate means "no valid result to display" in standard render
        // But we want to display an error/limitation message if Trig >= 400.
        // A better approach is to throw an error or return a specific error result item?
        // Or we handle it in customResultRenderer check.

        // Let's return a special object that indicates high triglycerides if needed, 
        // or just return the values and let renderer decide.

        let ldlVal = 0;
        let isInvalid = false;

        if (trigVal >= 400) {
            isInvalid = true;
        } else {
            ldlVal = tcVal - hdlVal - trigVal / 5;
        }

        const ldlMmol = UnitConverter.convert(ldlVal, 'mg/dL', 'mmol/L', 'cholesterol');

        let riskCategory = '';
        let alertClass: 'success' | 'warning' | 'danger' | 'info' = 'success';

        if (ldlVal < 100) {
            riskCategory = 'Optimal';
            alertClass = 'success';
        } else if (ldlVal < 130) {
            riskCategory = 'Near Optimal/Above Optimal';
            alertClass = 'success';
        } else if (ldlVal < 160) {
            riskCategory = 'Borderline High';
            alertClass = 'warning';
        } else if (ldlVal < 190) {
            riskCategory = 'High';
            alertClass = 'danger';
        } else {
            riskCategory = 'Very High';
            alertClass = 'danger';
        }

        return [
            {
                label: 'Calculated LDL',
                value: isInvalid ? 'Invalid' : ldlVal.toFixed(1),
                unit: 'mg/dL',
                interpretation: riskCategory,
                alertClass: alertClass
            },
            {
                label: 'Calculated LDL (mmol/L)',
                value: isInvalid || !ldlMmol ? '-' : ldlMmol.toFixed(2),
                unit: 'mmol/L'
            },
            // Pass raw trig for renderer
            { label: '_trig', value: trigVal }
        ];
    },
    customResultRenderer: (results) => {
        const ldlRes = results[0];
        const ldlMmolRes = results[1];
        const trigVal = results[2].value as number;

        if (trigVal >= 400) {
            return uiBuilder.createAlert({
                type: 'danger',
                message: '<strong>Cannot Calculate:</strong> Triglycerides ≥400 mg/dL. Friedewald equation is invalid. Please order Direct LDL.'
            });
        }

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
            ${renderItem(ldlRes)}
             <div class="ui-result-item">
                <div class="ui-result-label">Calculated LDL (mmol/L)</div>
                <div class="ui-result-value-container">
                    <span class="ui-result-value">${ldlMmolRes.value}</span>
                    <span class="ui-result-unit">${ldlMmolRes.unit}</span>
                 </div>
            </div>
            
            <p class="text-sm text-muted mt-10">
                <strong>Note:</strong> All values in mg/dL
            </p>
            
            ${uiBuilder.createAlert({
            type: 'warning',
            message: `
                    <strong>Limitation:</strong> This formula is not accurate when triglycerides ≥400 mg/dL (≥4.52 mmol/L). 
                    Consider direct LDL measurement in such cases.
                `
        })}
            
            ${uiBuilder.createSection({
            title: 'LDL Cholesterol Goals (Adults)',
            content: uiBuilder.createTable({
                headers: ['Category', 'mg/dL', 'mmol/L'],
                rows: [
                    ['Optimal', '< 100', '< 2.59'],
                    ['Near Optimal', '100 - 129', '2.59 - 3.34'],
                    ['Borderline High', '130 - 159', '3.37 - 4.12'],
                    ['High', '160 - 189', '4.15 - 4.90'],
                    ['Very High', '≥ 190', '≥ 4.92']
                ],
                className: 'reference-table'
            })
        })}
        `;
    }
});
