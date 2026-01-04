import { createFormulaCalculator } from '../shared/formula-calculator.js';
import { LOINC_CODES } from '../../fhir-codes.js';

export const tpaDosing = createFormulaCalculator({
    id: 'tpa-dosing',
    title: 'tPA (Alteplase) Dosing for Ischemic Stroke',
    description: 'Calculates tPA (alteplase) dosing for acute ischemic stroke based on patient weight.',
    inputs: [
        {
            id: 'tpa-weight',
            label: 'Weight',
            type: 'number',
            standardUnit: 'kg',
            min: 2,
            max: 200,
            step: 0.1,
            unitConfig: {
                type: 'weight',
                units: ['kg', 'lbs'],
                default: 'kg'
            },
            validationType: 'weight',
            loincCode: LOINC_CODES.WEIGHT
        }
    ],
    formulas: [
        {
            label: 'Total Dose',
            formula: '0.9 mg/kg (Max 90 mg)'
        },
        {
            label: 'Bolus Dose',
            formula: '10% of total dose over 1 minute'
        },
        {
            label: 'Infusion Dose',
            formula: '90% of total dose over 60 minutes'
        }
    ],
    calculate: (values) => {
        const weight = values['tpa-weight'] as number;

        if (!weight || weight <= 0) return null;

        // If weight > 100 kg, use 100 kg for calculation as max dose is 90mg.
        const effectiveWeight = weight > 100 ? 100 : weight;
        const totalDose = effectiveWeight * 0.9;
        const bolusDose = totalDose * 0.1;
        const infusionDose = totalDose * 0.9;

        const isCapped = weight > 100;

        return [
            {
                label: 'Total Dose',
                value: totalDose.toFixed(2),
                unit: 'mg',
                interpretation: isCapped ? '(Capped at 90 mg max)' : ''
            },
            {
                label: 'Bolus Dose (10%)',
                value: bolusDose.toFixed(2),
                unit: 'mg',
                interpretation: 'Give over 1 minute'
            },
            {
                label: 'Infusion Dose (90%)',
                value: infusionDose.toFixed(2),
                unit: 'mg',
                interpretation: 'Infuse over 60 minutes'
            }
        ];
    }
});
