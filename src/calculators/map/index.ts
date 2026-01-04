import { createFormulaCalculator } from '../shared/formula-calculator.js';
import { LOINC_CODES } from '../../fhir-codes.js';

export const map = createFormulaCalculator({
    id: 'map',
    title: 'Mean Arterial Pressure (MAP)',
    description:
        'Calculates the average arterial pressure during one cardiac cycle, important for organ perfusion assessment.',
    inputs: [
        {
            id: 'map-sbp',
            label: 'Systolic BP',
            type: 'number',
            standardUnit: 'mmHg',
            unitConfig: { type: 'pressure', units: ['mmHg', 'kPa'], default: 'mmHg' },
            validationType: 'systolicBP',
            min: 1,
            max: 300,
            loincCode: LOINC_CODES.SYSTOLIC_BP
        },
        {
            id: 'map-dbp',
            label: 'Diastolic BP',
            type: 'number',
            standardUnit: 'mmHg',
            unitConfig: { type: 'pressure', units: ['mmHg', 'kPa'], default: 'mmHg' },
            validationType: 'diastolicBP',
            min: 1,
            max: 200,
            loincCode: LOINC_CODES.DIASTOLIC_BP
        }
    ],
    formulas: [
        { label: 'Formula', formula: 'MAP = DBP + (1/3 × (SBP - DBP))' },
        { label: 'Equivalent', formula: 'MAP = (SBP + 2 × DBP) / 3' }
    ],
    calculate: values => {
        const sbp = values['map-sbp'] as number;
        const dbp = values['map-dbp'] as number;

        if (!sbp || !dbp) return null;
        if (sbp <= dbp) return null; // Logic check: SBP must be > DBP

        const mapCalc = dbp + (sbp - dbp) / 3;

        let interpretation = '';
        let alertClass: 'danger' | 'warning' | 'success' | 'info' = 'info';

        if (mapCalc < 60) {
            interpretation = 'Critically Low (Shock Risk)';
            alertClass = 'danger';
        } else if (mapCalc < 70) {
            interpretation = 'Below Normal';
            alertClass = 'warning';
        } else if (mapCalc <= 100) {
            interpretation = 'Normal';
            alertClass = 'success';
        } else {
            interpretation = 'Elevated (Hypertension)';
            alertClass = 'danger';
        }

        return [
            {
                label: 'Mean Arterial Pressure',
                value: mapCalc.toFixed(1),
                unit: 'mmHg',
                interpretation: interpretation,
                alertClass: alertClass
            }
        ];
    },
    customResultRenderer: results => {
        const res = results[0];
        const val = parseFloat(res.value as string);

        let note = '';
        if (val < 60)
            note = 'MAP <60 mmHg indicates severe hypotension and risk of organ hypoperfusion.';
        else if (val < 70) note = 'Borderline low MAP. Monitor closely.';
        else if (val <= 100) note = 'Normal MAP (70-100 mmHg) indicates adequate organ perfusion.';
        else note = 'Sustained MAP >100 mmHg requires management.';

        return `
            <div class="ui-result-item ${res.alertClass ? 'ui-result-' + res.alertClass : ''}">
                <div class="ui-result-label">${res.label}</div>
                <div class="ui-result-value-container">
                    <span class="ui-result-value">${res.value}</span>
                    <span class="ui-result-unit">${res.unit}</span>
                </div>
                <div class="ui-result-interpretation">${res.interpretation}</div>
            </div>
            
            <div class="ui-alert ui-alert-${res.alertClass === 'success' ? 'info' : res.alertClass} mt-10">
                <span class="ui-alert-icon">${val < 60 || val > 100 ? '⚠️' : 'ℹ️'}</span>
                <div class="ui-alert-content">${note}</div>
            </div>
        `;
    }
});
