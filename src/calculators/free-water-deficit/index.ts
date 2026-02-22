import { uiBuilder } from '../../ui-builder.js';
import { createUnifiedFormulaCalculator } from '../shared/unified-formula-calculator.js';
import { calculateFreeWaterDeficit } from './calculation.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import type { FormulaCalculatorConfig } from '../../types/calculator-formula.js';

export const freeWaterDeficitConfig: FormulaCalculatorConfig = {
    id: 'free-water-deficit',
    title: 'Free Water Deficit in Hypernatremia',
    description:
        'Calculates free water deficit by estimated total body water in a patient with hypernatremia or dehydration.',
    infoAlert:
        '<h4>TBW Factors:</h4>' +
        uiBuilder.createList({
            items: [
                'Adult Male: 0.6',
                'Adult Female: 0.5',
                'Elderly Male: 0.5',
                'Elderly Female: 0.45',
                'Child: 0.6'
            ],
            className: 'info-list'
        }),
    sections: [
        {
            title: 'Patient Data',
            icon: '👤',
            fields: [
                {
                    type: 'number',
                    id: 'fwd-weight',
                    label: 'Weight',
                    placeholder: 'e.g., 70',
                    unitConfig: {
                        type: 'weight',
                        units: ['kg', 'lbs'],
                        default: 'kg'
                    },
                    validationType: 'weight',
                    loincCode: LOINC_CODES.WEIGHT,
                    standardUnit: 'kg',
                    required: true
                },
                {
                    type: 'number',
                    id: 'fwd-sodium',
                    label: 'Serum Sodium',
                    placeholder: 'e.g., 160',
                    unitConfig: {
                        type: 'sodium',
                        units: ['mEq/L', 'mmol/L'],
                        default: 'mEq/L'
                    },
                    validationType: 'sodium',
                    loincCode: LOINC_CODES.SODIUM,
                    standardUnit: 'mEq/L',
                    required: true
                },
                {
                    type: 'radio',
                    id: 'fwd-sex',
                    label: 'Sex',
                    options: [
                        { value: 'female', label: 'Female', checked: true },
                        { value: 'male', label: 'Male' }
                    ]
                },
                {
                    type: 'radio',
                    id: 'fwd-age-range',
                    label: 'Age range',
                    options: [
                        { value: 'child', label: 'Child' },
                        { value: 'adult', label: 'Adult', checked: true },
                        { value: 'elderly', label: 'Elderly' }
                    ]
                },
                {
                    type: 'number',
                    id: 'fwd-desired-sodium',
                    label: 'Sodium desired',
                    placeholder: 'e.g., 140',
                    unitConfig: {
                        type: 'sodium',
                        units: ['mEq/L', 'mmol/L'],
                        default: 'mEq/L'
                    },
                    validationType: 'sodium',
                    standardUnit: 'mEq/L',
                    required: true
                }
            ]
        }
    ],
    formulas: [
        {
            label: 'Free Water Deficit (L)',
            formula:
                '% total body water × Weight × (<span class="formula-fraction"><span class="numerator">Current Na</span><span class="denominator">Ideal Na</span></span> − 1)'
        },
        {
            label: 'TBW (Total Body Water)',
            formula: 'Weight (kg) × Factor'
        }
    ],
    autoPopulateGender: 'fwd-sex',
    calculate: calculateFreeWaterDeficit,
    customResultRenderer: results => {
        const deficitResult = results[0];
        const tbwResult = results[1];
        const noteResult = results[2];

        if (!deficitResult) return '';

        let html = uiBuilder.createResultItem({
            label: deficitResult.label,
            value: deficitResult.value.toString(),
            unit: deficitResult.unit,
            interpretation: deficitResult.interpretation,
            alertClass: deficitResult.alertClass ? `ui-alert-${deficitResult.alertClass}` : ''
        });

        if (tbwResult) {
            html += uiBuilder.createResultItem({
                label: tbwResult.label,
                value: tbwResult.value.toString(),
                unit: tbwResult.unit
            });
        }

        if (noteResult && noteResult.value) {
            html += uiBuilder.createAlert({
                type: noteResult.alertClass as any,
                message: noteResult.value.toString()
            });
        }

        return html;
    }
};

export const freeWaterDeficit = createUnifiedFormulaCalculator(freeWaterDeficitConfig);
