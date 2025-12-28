import {
    createMixedInputCalculator,
    MixedInputCalculatorConfig
} from '../shared/mixed-input-calculator.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';

const config: MixedInputCalculatorConfig = {
    id: 'free-water-deficit',
    title: 'Free Water Deficit in Hypernatremia',
    description:
        'Calculates free water deficit by estimated total body water in a patient with hypernatremia or dehydration.',
    infoAlert:
        '<h4>TBW Factors:</h4><ul class="info-list"><li>Adult Male: 0.6</li><li>Adult Female: 0.5</li><li>Elderly Male: 0.5</li><li>Elderly Female: 0.45</li><li>Child: 0.6</li></ul>',
    sections: [
        {
            title: 'Patient Data',
            icon: '👤',
            inputs: [
                {
                    type: 'number',
                    id: 'fwd-weight',
                    label: 'Weight',
                    placeholder: 'e.g., 70',
                    unitToggle: {
                        type: 'weight',
                        units: ['kg', 'lbs'],
                        default: 'kg'
                    },
                    loincCode: LOINC_CODES.WEIGHT
                },
                {
                    type: 'number',
                    id: 'fwd-sodium',
                    label: 'Serum Sodium',
                    placeholder: 'e.g., 160',
                    unitToggle: {
                        type: 'sodium',
                        units: ['mEq/L', 'mmol/L'],
                        default: 'mEq/L'
                    },
                    loincCode: LOINC_CODES.SODIUM
                },
                {
                    type: 'radio',
                    name: 'fwd-gender',
                    label: 'Gender / Type',
                    options: [
                        { value: 'male', label: 'Adult Male', checked: true },
                        { value: 'female', label: 'Adult Female' },
                        { value: 'elderly', label: 'Elderly Male' },
                        { value: 'elderly_female', label: 'Elderly Female' },
                        { value: 'child', label: 'Child' }
                    ],
                    helpText: 'Determines Total Body Water (TBW) factor.'
                }
            ]
        }
    ],
    formulas: [
        {
            label: 'Free Water Deficit (L)',
            formula:
                'TBW × (<span class="formula-fraction"><span class="numerator">Current Na</span><span class="denominator">140</span></span> − 1)'
        },
        {
            label: 'TBW (Total Body Water)',
            formula: 'Weight (kg) × Factor'
        }
    ],
    dataRequirements: {
        autoPopulateGender: {
            radioName: 'fwd-gender',
            maleValue: 'male',
            femaleValue: 'female'
        }
    },
    calculate: values => {
        const weight = values['fwd-weight'] as number | null;
        const sodium = values['fwd-sodium'] as number | null;
        const genderType = values['fwd-gender'] as string;

        if (weight === null || sodium === null || !genderType) {
            return null;
        }

        let tbwFactor = 0.6;
        switch (genderType) {
            case 'male':
                tbwFactor = 0.6;
                break;
            case 'female':
                tbwFactor = 0.5;
                break;
            case 'elderly':
                tbwFactor = 0.5;
                break;
            case 'elderly_female':
                tbwFactor = 0.45;
                break;
            case 'child':
                tbwFactor = 0.6;
                break;
        }

        const tbw = weight * tbwFactor;
        const deficit = tbw * (sodium / 140 - 1);

        // Store TBW in values for result renderer
        // Note: mixed input calculator doesn't support passing extra data easily out of calculate
        // But customResultRenderer receives the same input values, so we can re-calculate TBW there.

        return deficit;
    },
    customResultRenderer: (deficit, values) => {
        const weight = values['fwd-weight'] as number;
        const sodium = values['fwd-sodium'] as number;
        const genderType = values['fwd-gender'] as string;

        let tbwFactor = 0.6;
        switch (genderType) {
            case 'male':
                tbwFactor = 0.6;
                break;
            case 'female':
                tbwFactor = 0.5;
                break;
            case 'elderly':
                tbwFactor = 0.5;
                break;
            case 'elderly_female':
                tbwFactor = 0.45;
                break;
            case 'child':
                tbwFactor = 0.6;
                break;
        }
        const totalBodyWater = weight * tbwFactor;

        let status = '';
        let alertType: 'success' | 'warning' | 'danger' = 'success';
        let alertMsg = '';

        if (sodium <= 140) {
            status = 'Not Indicated';
            alertType = 'warning';
            alertMsg = 'Calculation intended for hypernatremia (Na > 140).';
        } else {
            status = 'Hypernatremia';
            alertType = 'danger';
            alertMsg =
                'Correction should be slow (e.g., over 48-72 hours) to avoid cerebral edema. Max rate ~0.5 mEq/L/hr.';
        }

        return `
            ${uiBuilder.createResultItem({
                label: 'Free Water Deficit',
                value: deficit > 0 ? deficit.toFixed(1) : '0.0',
                unit: 'Liters',
                interpretation: status,
                alertClass: `ui-alert-${alertType}`
            })}
            ${uiBuilder.createResultItem({
                label: 'Estimated TBW',
                value: totalBodyWater.toFixed(1),
                unit: 'Liters'
            })}
            ${uiBuilder.createAlert({
                type: alertType,
                message: alertMsg
            })}
        `;
    }
};

export const freeWaterDeficit = createMixedInputCalculator(config);
