import { createFormulaCalculator } from '../shared/formula-calculator.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { ValidationRules } from '../../validator.js';

export const bmiBsa = createFormulaCalculator({
    id: 'bmi-bsa',
    title: 'BMI & Body Surface Area (BSA)',
    description:
        'Calculates Body Mass Index (BMI) and Body Surface Area (BSA) for clinical assessment and medication dosing.',
    inputs: [
        {
            id: 'bmi-bsa-weight',
            label: 'Weight',
            type: 'number',
            standardUnit: 'kg',
            unitConfig: { type: 'weight', units: ['kg', 'lbs'], default: 'kg' },
            loincCode: LOINC_CODES.WEIGHT,
            min: 0.1,
            max: 500,
            step: 0.1
        },
        {
            id: 'bmi-bsa-height',
            label: 'Height',
            type: 'number',
            standardUnit: 'cm',
            unitConfig: { type: 'height', units: ['cm', 'in'], default: 'cm' },
            loincCode: LOINC_CODES.HEIGHT,
            min: 10,
            max: 300,
            step: 0.1
        }
    ],
    formulas: [
        { label: 'BMI (Body Mass Index)', formula: 'Weight (kg) / Height² (m²)' },
        {
            label: 'BSA (Du Bois Formula)',
            formula: '0.007184 × Weight<sup>0.425</sup> (kg) × Height<sup>0.725</sup> (cm)'
        }
    ],
    calculate: values => {
        const weightKg = values['bmi-bsa-weight'] as number;
        const heightCm = values['bmi-bsa-height'] as number;

        if (!weightKg || !heightCm) return null;

        const heightInMeters = heightCm / 100;
        const bmi = weightKg / (heightInMeters * heightInMeters);
        const bsa = 0.007184 * Math.pow(weightKg, 0.425) * Math.pow(heightCm, 0.725); // Du Bois

        // BMI Interpretation
        let interpretation = '';
        let alertClass: 'danger' | 'warning' | 'success' | 'info' = 'info';

        if (bmi < 18.5) {
            interpretation = 'Underweight';
            alertClass = 'warning';
        } else if (bmi < 25) {
            interpretation = 'Normal weight';
            alertClass = 'success';
        } else if (bmi < 30) {
            interpretation = 'Overweight';
            alertClass = 'warning';
        } else if (bmi < 35) {
            interpretation = 'Obese (Class I)';
            alertClass = 'danger';
        } else if (bmi < 40) {
            interpretation = 'Obese (Class II)';
            alertClass = 'danger';
        } else {
            interpretation = 'Obese (Class III)';
            alertClass = 'danger';
        }

        return [
            {
                label: 'Body Mass Index (BMI)',
                value: bmi.toFixed(1),
                unit: 'kg/m²',
                interpretation: interpretation,
                alertClass: alertClass
            },
            {
                label: 'Body Surface Area (BSA)',
                value: bsa.toFixed(2),
                unit: 'm²'
            }
        ];
    },
    customResultRenderer: results => {
        // We want to add the info alert about BSA formula
        // But we can reuse the default item generation if we want, or just custom build it.
        // Let's manually rebuild to include the BSA note which was in the original.
        const [bmiResult, bsaResult] = results;

        // Helper to generate result item HTML
        const renderItem = (res: any) => `
            <div class="ui-result-item ${res.alertClass ? 'ui-result-' + res.alertClass : ''}">
                <div class="ui-result-label">${res.label}</div>
                <div class="ui-result-value-container">
                    <span class="ui-result-value">${res.value}</span>
                    ${res.unit ? `<span class="ui-result-unit">${res.unit}</span>` : ''}
                </div>
                ${res.interpretation ? `<div class="ui-result-interpretation">${res.interpretation}</div>` : ''}
            </div>
        `;

        return `
            ${renderItem(bmiResult)}
            ${renderItem(bsaResult)}
            
            <div class="ui-alert ui-alert-info mt-10">
                <span class="ui-alert-icon">ℹ️</span>
                <div class="ui-alert-content">
                    BSA calculated using Du Bois formula. Used for medication dosing and cardiac index calculation.
                </div>
            </div>
        `;
    }
});
