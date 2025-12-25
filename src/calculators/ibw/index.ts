import { createFormulaCalculator, FormulaResultItem } from '../shared/formula-calculator.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { fhirDataService } from '../../fhir-data-service.js';

export const ibw = createFormulaCalculator({
    id: 'ibw',
    title: 'Ideal & Adjusted Body Weight',
    description: 'Calculates ideal body weight (IBW) and adjusted body weight (ABW) using the Devine formula.',
    infoAlert: `
        <h4>Clinical Applications</h4>
        <ul>
            <li><strong>Ideal Body Weight (IBW):</strong> Drug dosing for medications with narrow therapeutic index, nutritional assessment, ventilator settings.</li>
            <li><strong>Adjusted Body Weight (ABW):</strong> Drug dosing in obese patients (actual weight > IBW), aminoglycoside dosing.</li>
        </ul>
    `,
    inputs: [
        {
            type: 'radio',
            id: 'ibw-gender',
            label: 'Gender',
            options: [
                { label: 'Male', value: 'male', checked: true },
                { label: 'Female', value: 'female' }
            ]
        },
        {
            type: 'number',
            id: 'ibw-height',
            label: 'Height',
            standardUnit: 'cm',
            unitConfig: { type: 'height', units: ['cm', 'in'], default: 'cm' },
            loincCode: LOINC_CODES.HEIGHT,
            min: 50,
            max: 300,
            placeholder: 'Enter height'
        },
        {
            type: 'number',
            id: 'ibw-actual',
            label: 'Actual Weight',
            standardUnit: 'kg',
            unitConfig: { type: 'weight', units: ['kg', 'lbs'], default: 'kg' },
            loincCode: LOINC_CODES.WEIGHT,
            min: 1,
            max: 500,
            placeholder: 'Enter weight'
        }
    ],
    formulas: [
        { label: 'IBW (Male)', formula: '50 + 2.3 × (height in inches - 60)' },
        { label: 'IBW (Female)', formula: '45.5 + 2.3 × (height in inches - 60)' },
        { label: 'ABW', formula: 'IBW + 0.4 × (Actual Weight - IBW)' },
        { label: 'Note', formula: 'ABW is calculated only when actual weight exceeds IBW.' }
    ],
    calculate: (values) => {
        const heightCm = values['ibw-height'] as number;
        const actualWeight = values['ibw-actual'] as number;
        const gender = values['ibw-gender'] as string;

        if (!heightCm) return null;

        const heightIn = heightCm / 2.54;
        const isMale = gender === 'male';

        let ibw = 0;
        if (heightIn > 60) {
            ibw = isMale
                ? 50 + 2.3 * (heightIn - 60)
                : 45.5 + 2.3 * (heightIn - 60);
        } else {
            ibw = isMale ? 50 : 45.5;
        }

        if (ibw <= 0) return null;

        const results: FormulaResultItem[] = [];

        results.push({
            label: 'Ideal Body Weight (IBW)',
            value: ibw.toFixed(1),
            unit: 'kg'
        });

        if (actualWeight && actualWeight > 0) {
            let alertType: 'info' | 'warning' | 'success' = 'info';
            let alertMsg = '';

            if (actualWeight > ibw) {
                const adjBw = ibw + 0.4 * (actualWeight - ibw);
                const percentOver = (((actualWeight - ibw) / ibw) * 100).toFixed(0);

                results.push({
                    label: 'Adjusted Body Weight (ABW)',
                    value: adjBw.toFixed(1),
                    unit: 'kg'
                });

                alertType = 'info';
                alertMsg = `Actual weight is ${percentOver}% above IBW. Use ABW for drug dosing in obese patients.`;
            } else if (actualWeight < ibw) {
                const percentUnder = (((ibw - actualWeight) / ibw) * 100).toFixed(0);
                alertType = 'warning';
                alertMsg = `Actual weight is ${percentUnder}% below IBW. Use actual body weight for drug dosing.`;
            } else {
                alertMsg = 'Actual weight is at ideal body weight. Use IBW for drug dosing.';
            }

            // Using a special label to indicate this is an alert, which customResultRenderer will parse
            results.push({
                label: '__ALERT__',
                value: '',
                interpretation: alertMsg,
                alertClass: alertType
            });
        }

        return results;
    },
    customResultRenderer: (results) => {
        const standardResults = results.filter(r => r.label !== '__ALERT__');
        const alertResult = results.find(r => r.label === '__ALERT__');

        let html = standardResults.map(r => uiBuilder.createResultItem({
            label: r.label,
            value: r.value.toString(),
            unit: r.unit,
            interpretation: r.interpretation,
            alertClass: r.alertClass ? `ui-alert-${r.alertClass}` : ''
        })).join('');

        if (alertResult) {
            html += uiBuilder.createAlert({
                type: alertResult.alertClass as any,
                message: alertResult.interpretation || ''
            });
        }

        return html;
    },
    customInitialize: (client, patient, container, calculate) => {
        const gender = fhirDataService.getPatientGender();
        if (gender) {
            const genderValue = gender.toLowerCase() === 'female' ? 'female' : 'male';
            const genderRadio = container.querySelector(
                `input[name="ibw-gender"][value="${genderValue}"]`
            ) as HTMLInputElement;
            if (genderRadio) {
                genderRadio.checked = true;
                genderRadio.dispatchEvent(new Event('change'));
            }
        }
    }
});
