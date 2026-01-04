import { createFormulaCalculator } from '../shared/formula-calculator.js';
import { LOINC_CODES } from '../../fhir-codes.js';

export const qtc = createFormulaCalculator({
    id: 'qtc',
    title: 'Corrected QT Interval (QTc)',
    description:
        'Calculates corrected QT interval using various formulas to assess risk of arrhythmias.',
    inputs: [
        {
            id: 'qtc-qt',
            label: 'QT Interval',
            type: 'number',
            standardUnit: 'ms', // Actually unitless for calculation mostly, but let's say ms
            min: 100,
            max: 1000,
            placeholder: 'e.g. 400',
            unitConfig: { type: 'time', units: ['ms'], default: 'ms' }
            // Note: FHIR usually doesn't have standalone QT, often part of ECG.
        },
        {
            id: 'qtc-hr',
            label: 'Heart Rate',
            type: 'number',
            standardUnit: 'bpm',
            placeholder: 'e.g. 72',
            min: 20,
            max: 300,
            validationType: 'heartRate',
            loincCode: LOINC_CODES.HEART_RATE,
            unitConfig: { type: 'rate', units: ['bpm'], default: 'bpm' }
        },
        {
            id: 'qtc-formula',
            label: 'Correction Formula',
            type: 'radio',
            options: [
                { value: 'bazett', label: 'Bazett (most common)', checked: true },
                { value: 'fridericia', label: 'Fridericia (better at extreme HR)' },
                { value: 'hodges', label: 'Hodges (linear correction)' },
                { value: 'framingham', label: 'Framingham' }
            ]
        }
    ],
    formulas: [
        { label: 'Bazett', formula: 'QTc = QT / √RR' },
        { label: 'Fridericia', formula: 'QTc = QT / ∛RR' },
        { label: 'Hodges', formula: 'QTc = QT + 1.75 × (HR - 60)' },
        { label: 'Framingham', formula: 'QTc = QT + 154 × (1 - RR)' }
    ],
    calculate: values => {
        const qt = values['qtc-qt'] as number;
        const hr = values['qtc-hr'] as number;
        const formula = (values['qtc-formula'] as string) || 'bazett';

        if (!qt || !hr) return null;

        const rr = 60 / hr;
        let qtcValue = 0;
        let formulaName = '';

        switch (formula) {
            case 'bazett':
                qtcValue = qt / Math.sqrt(rr);
                formulaName = 'Bazett';
                break;
            case 'fridericia':
                qtcValue = qt / Math.cbrt(rr);
                formulaName = 'Fridericia';
                break;
            case 'hodges':
                qtcValue = qt + 1.75 * (hr - 60);
                formulaName = 'Hodges';
                break;
            case 'framingham':
                qtcValue = qt + 154 * (1 - rr);
                formulaName = 'Framingham';
                break;
        }

        let interpretation = '';
        let alertClass: 'danger' | 'warning' | 'success' | 'info' = 'success';

        if (qtcValue > 500) {
            interpretation = 'Prolonged (>500ms)';
            alertClass = 'danger';
        } else if (qtcValue > 460) {
            // Generic cutoff, arguably different for M/F
            interpretation = 'Borderline Prolonged';
            alertClass = 'warning';
        } else {
            interpretation = 'Normal';
            alertClass = 'success';
        }

        return [
            {
                label: `Corrected QT (${formulaName})`,
                value: qtcValue.toFixed(0),
                unit: 'ms',
                interpretation: interpretation,
                alertClass: alertClass
            }
        ];
    },
    customResultRenderer: results => {
        const res = results[0];
        const val = parseInt(res.value as string);

        // Interpretation text
        let note = '';
        if (val > 500) note = 'QTc >500ms significantly increases risk of Torsades de Pointes.';
        else if (val > 450) note = 'Borderline/Prolonged. Normal: Men <450ms, Women <460ms.';
        else note = 'Normal range.';

        return `
             <div class="ui-result-item ${res.alertClass ? 'ui-result-' + res.alertClass : ''}">
                <div class="ui-result-label">${res.label}</div>
                <div class="ui-result-value-container">
                    <span class="ui-result-value">${res.value}</span>
                    <span class="ui-result-unit">${res.unit}</span>
                </div>
                <div class="ui-result-interpretation">${res.interpretation}</div>
            </div>
            
             <div class="ui-alert ui-alert-${res.alertClass} mt-10">
                <span class="ui-alert-icon">${val > 500 ? '⚠️' : val > 450 ? '⚠️' : '✓'}</span>
                <div class="ui-alert-content">${note}</div>
            </div>
        `;
    }
});
