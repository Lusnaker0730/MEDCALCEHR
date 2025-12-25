import { createFormulaCalculator } from '../shared/formula-calculator.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { fhirDataService } from '../../fhir-data-service.js';

export const mdrdGfr = createFormulaCalculator({
    id: 'mdrd-gfr',
    title: 'MDRD GFR Equation',
    description: 'Estimates GFR using the MDRD equation. Note: CKD-EPI is now preferred for most patients.',
    infoAlert: '<strong>Note:</strong> MDRD is less accurate at higher GFR values (>60). Consider using CKD-EPI for general use.',
    inputs: [
        {
            type: 'radio',
            id: 'mdrd-gender',
            label: 'Gender',
            options: [
                { value: 'male', label: 'Male', checked: true },
                { value: 'female', label: 'Female' }
            ]
        },
        {
            type: 'radio',
            id: 'mdrd-race',
            label: 'Race',
            options: [
                { value: 'non-aa', label: 'Non-African American', checked: true },
                { value: 'aa', label: 'African American' }
            ]
        },
        {
            type: 'number',
            id: 'mdrd-age',
            label: 'Age',
            standardUnit: 'years',
            placeholder: 'e.g., 65'
        },
        {
            type: 'number',
            id: 'mdrd-creatinine',
            label: 'Serum Creatinine',
            standardUnit: 'mg/dL',
            unitConfig: { type: 'creatinine', units: ['mg/dL', 'µmol/L'], default: 'mg/dL' },
            loincCode: LOINC_CODES.CREATININE,
            min: 0.1,
            max: 20
        }
    ],
    formulas: [
        { label: 'Base Formula', formula: 'eGFR = 175 × (Scr)^-1.154 × (Age)^-0.203' },
        { label: 'Gender Adjustment', formula: 'If female: multiply by 0.742' },
        { label: 'Race Adjustment', formula: 'If African American: multiply by 1.212' }
    ],
    calculate: (values) => {
        const age = values['mdrd-age'] as number;
        const creatinine = values['mdrd-creatinine'] as number;
        const gender = values['mdrd-gender'] as string;
        const race = values['mdrd-race'] as string;

        if (!age || !creatinine) return null;

        const isFemale = gender === 'female';
        const isAA = race === 'aa';

        let gfr = 175 * Math.pow(creatinine, -1.154) * Math.pow(age, -0.203);
        if (isFemale) gfr *= 0.742;
        if (isAA) gfr *= 1.212;

        let stage = '';
        let alertType: 'success' | 'warning' | 'danger' | 'info' = 'info';
        let alertMsg = '';

        if (gfr >= 90) {
            stage = 'Stage 1 (Normal or high)';
            alertType = 'success';
            alertMsg = 'Normal kidney function.';
        } else if (gfr >= 60) {
            stage = 'Stage 2 (Mild)';
            alertType = 'success';
            alertMsg = 'Mildly decreased kidney function.';
        } else if (gfr >= 45) {
            stage = 'Stage 3a (Mild to moderate)';
            alertType = 'warning';
            alertMsg = 'Mild to moderate reduction in kidney function.';
        } else if (gfr >= 30) {
            stage = 'Stage 3b (Moderate to severe)';
            alertType = 'warning';
            alertMsg = 'Moderate to severe reduction in kidney function. Consider nephrology referral.';
        } else if (gfr >= 15) {
            stage = 'Stage 4 (Severe)';
            alertType = 'danger';
            alertMsg = 'Severe reduction in kidney function. Nephrology referral required.';
        } else {
            stage = 'Stage 5 (Kidney failure)';
            alertType = 'danger';
            alertMsg = 'Kidney failure. Consider dialysis or transplantation.';
        }

        return [
            {
                label: 'Estimated GFR',
                value: gfr.toFixed(0),
                unit: 'mL/min/1.73m²',
                interpretation: stage,
                alertClass: alertType
            },
            {
                label: '__ALERT__',
                value: '',
                interpretation: alertMsg,
                alertClass: alertType
            }
        ];
    },
    customResultRenderer: (results) => {
        const gfrResult = results.find(r => r.label !== '__ALERT__');
        const alertResult = results.find(r => r.label === '__ALERT__');

        if (!gfrResult) return '';

        let html = uiBuilder.createResultItem({
            label: gfrResult.label,
            value: gfrResult.value.toString(),
            unit: gfrResult.unit,
            interpretation: gfrResult.interpretation,
            alertClass: gfrResult.alertClass ? `ui-alert-${gfrResult.alertClass}` : ''
        });

        if (alertResult) {
            html += uiBuilder.createAlert({
                type: alertResult.alertClass as any,
                message: alertResult.interpretation || ''
            });
        }
        return html;
    },
    customInitialize: (client, patient, container) => {
        // Auto-populate Age
        // Note: getPatientAge might differ in implementation (sync/async) in different contexts
        // but assuming fhirDataService is initialized, we can try to get it.
        // If getPatientAge is async, we handle promise.

        const ageInput = container.querySelector('#mdrd-age') as HTMLInputElement;
        const genderMale = container.querySelector('input[name="mdrd-gender"][value="male"]') as HTMLInputElement;
        const genderFemale = container.querySelector('input[name="mdrd-gender"][value="female"]') as HTMLInputElement;

        const populate = async () => {
            try {
                // Try sync first if patient object is available
                const age = fhirDataService.getPatientAge();
                if (age !== null && ageInput) {
                    ageInput.value = age.toString();
                    ageInput.dispatchEvent(new Event('input'));
                }

                // Gender
                const gender = fhirDataService.getPatientGender();
                if (gender) {
                    if (gender.toLowerCase() === 'female' && genderFemale) {
                        genderFemale.checked = true;
                        genderFemale.dispatchEvent(new Event('change'));
                    } else if (genderMale) {
                        genderMale.checked = true;
                        genderMale.dispatchEvent(new Event('change'));
                    }
                }
            } catch (e) {
                console.warn(e);
            }
        };
        populate();
    }
});
