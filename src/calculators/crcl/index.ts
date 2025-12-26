import {
    createMixedInputCalculator,
    MixedInputCalculatorConfig
} from '../shared/mixed-input-calculator.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { fhirDataService } from '../../fhir-data-service.js';

const config: MixedInputCalculatorConfig = {
    id: 'crcl',
    title: 'Creatinine Clearance (Cockcroft-Gault Equation)',
    description: 'Calculates CrCl according to the Cockcroft-Gault equation.',
    infoAlert: `
        <h4>Note:</h4>
        <ul class="info-list">
            <li>This formula estimates creatinine clearance, not GFR.</li>
            <li>May overestimate clearance in elderly patients.</li>
        </ul>
    `,
    sections: [
        {
            title: 'Patient Information',
            icon: '👤',
            inputs: [
                {
                    type: 'radio',
                    name: 'gender',
                    label: 'Gender',
                    options: [
                        { value: 'male', label: 'Male', checked: true },
                        { value: 'female', label: 'Female' }
                    ]
                },
                {
                    type: 'number',
                    id: 'age',
                    label: 'Age',
                    unit: 'years',
                    placeholder: 'e.g., 65'
                },
                {
                    type: 'number',
                    id: 'weight',
                    label: 'Weight',
                    placeholder: 'e.g., 70',
                    unitToggle: {
                        type: 'weight',
                        units: ['kg', 'lbs'],
                        default: 'kg'
                    },
                    loincCode: LOINC_CODES.WEIGHT
                }
            ]
        },
        {
            title: 'Lab Values',
            icon: '🧪',
            inputs: [
                {
                    type: 'number',
                    id: 'creatinine',
                    label: 'Serum Creatinine',
                    placeholder: 'e.g., 1.0',
                    unitToggle: {
                        type: 'creatinine',
                        units: ['mg/dL', 'µmol/L'],
                        default: 'mg/dL'
                    },
                    loincCode: LOINC_CODES.CREATININE
                }
            ]
        }
    ],
    formulaSection: {
        show: true,
        type: 'list',
        title: 'FORMULA',
        scoringCriteria: [
            {
                criteria: 'Male',
                points: '[(140 - Age) × Weight] / (72 × Serum Creatinine)'
            },
            {
                criteria: 'Female',
                points: '[(140 - Age) × Weight × 0.85] / (72 × Serum Creatinine)'
            }
        ]
    },
    calculate: values => {
        const gender = (values['gender'] as string) || 'male';
        const age = values['age'] as number | null;
        const weight = values['weight'] as number | null;
        const creatinine = values['creatinine'] as number | null;

        if (age === null || weight === null || creatinine === null) {
            return null;
        }

        if (creatinine === 0) return 0; // Avoid division by zero

        let crcl = ((140 - age) * weight) / (72 * creatinine);
        if (gender === 'female') {
            crcl *= 0.85;
        }

        return crcl;
    },
    customResultRenderer: (score, values) => {
        let category = '';
        let severityClass = 'ui-alert-success';
        let alertType: 'info' | 'warning' | 'danger' = 'info';
        let alertMsg = '';

        if (score >= 90) {
            category = 'Normal kidney function';
            severityClass = 'ui-alert-success';
            alertMsg = 'Normal creatinine clearance.';
        } else if (score >= 60) {
            category = 'Mild reduction';
            severityClass = 'ui-alert-success';
            alertMsg = 'Mildly reduced creatinine clearance.';
        } else if (score >= 30) {
            category = 'Moderate reduction';
            severityClass = 'ui-alert-warning';
            alertMsg =
                'Moderate reduction in kidney function. Consider nephrology referral and dose adjustment for renally cleared medications.';
            alertType = 'warning';
        } else if (score >= 15) {
            category = 'Severe reduction';
            severityClass = 'ui-alert-danger';
            alertMsg =
                'Severe reduction in kidney function. Nephrology referral required. Careful medication dosing adjustments necessary.';
            alertType = 'danger';
        } else {
            category = 'Kidney failure';
            severityClass = 'ui-alert-danger';
            alertMsg =
                'Kidney failure. Consider dialysis or transplantation. Avoid renally cleared medications.';
            alertType = 'danger';
        }

        return `
            ${uiBuilder.createResultItem({
                label: 'Creatinine Clearance',
                value: score.toFixed(1),
                unit: 'mL/min',
                interpretation: category,
                alertClass: severityClass
            })}
            ${uiBuilder.createAlert({
                type: alertType,
                message: alertMsg
            })}
        `;
    },
    dataRequirements: {
        autoPopulateAge: { inputId: 'age' },
        autoPopulateGender: {
            radioName: 'gender',
            maleValue: 'male',
            femaleValue: 'female'
        }
    }
};

export const crcl = createMixedInputCalculator(config);
