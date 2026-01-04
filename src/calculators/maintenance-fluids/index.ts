import { createFormulaCalculator } from '../shared/formula-calculator.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';

export const maintenanceFluids = createFormulaCalculator({
    id: 'maintenance-fluids',
    title: 'Maintenance Fluids Calculations',
    description: 'Calculates maintenance fluid requirements by weight.',
    infoAlert: 'Calculates maintenance fluid requirements by weight (Holliday-Segar method).',
    inputs: [
        {
            id: 'weight-fluids',
            label: 'Weight',
            type: 'number',
            standardUnit: 'kg',
            unitConfig: { type: 'weight', units: ['kg', 'lbs'], default: 'kg' },
            validationType: 'weight',
            loincCode: LOINC_CODES.WEIGHT,
            min: 0,
            max: 500,
            placeholder: 'e.g., 70'
        }
    ],
    formulas: [
        { label: 'First 10 kg', formula: '4 mL/kg/hr' },
        { label: 'Next 10 kg (11-20 kg)', formula: '2 mL/kg/hr' },
        { label: 'Each kg above 20 kg', formula: '1 mL/kg/hr' },
        { label: 'Daily Total', formula: 'Hourly Rate × 24' }
    ],
    footerHTML: uiBuilder.createAlert({
        type: 'warning',
        message: `
            <h5>⚠️ Important Notes:</h5>
            <ul>
                <li>This calculates <strong>maintenance fluids only</strong>, not replacement for deficits or ongoing losses</li>
                <li>The Holliday-Segar method is widely used in pediatric and adult medicine</li>
                <li>Adjust based on clinical conditions, renal function, and fluid losses</li>
                <li>Consider insensible losses (respiratory, skin) and urine output</li>
                <li>For critically ill patients, may need additional adjustment (e.g., 50-75% of calculated)</li>
            </ul>
        `
    }),
    calculate: values => {
        const weightKg = values['weight-fluids'] as number;

        if (weightKg === undefined || weightKg <= 0) return null;

        let hourlyRate = 0;
        if (weightKg <= 10) {
            hourlyRate = weightKg * 4;
        } else if (weightKg <= 20) {
            hourlyRate = 10 * 4 + (weightKg - 10) * 2;
        } else {
            hourlyRate = 10 * 4 + 10 * 2 + (weightKg - 20) * 1;
        }
        const dailyRate = hourlyRate * 24;

        return [
            {
                label: 'IV Fluid Rate (Hourly)',
                value: hourlyRate.toFixed(1),
                unit: 'mL/hr'
            },
            {
                label: 'Total Daily Fluids',
                value: dailyRate.toFixed(1),
                unit: 'mL/day'
            }
        ];
    }
});
