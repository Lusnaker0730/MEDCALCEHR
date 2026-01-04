import { createFormulaCalculator } from '../shared/formula-calculator.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { fhirDataService } from '../../fhir-data-service.js';

export const ckdEpi = createFormulaCalculator({
    id: 'ckd-epi',
    title: 'CKD-EPI GFR (2021 Refit)',
    description:
        'Estimates GFR using the CKD-EPI 2021 race-free equation, the recommended method for assessing kidney function.',
    infoAlert: `
        <h4>Note:</h4>
        <p>Scr = serum creatinine (mg/dL)</p>
    `,
    inputs: [
        {
            type: 'radio',
            id: 'ckd-epi-gender',
            label: 'Gender',
            options: [
                { value: 'male', label: 'Male', checked: true },
                { value: 'female', label: 'Female' }
            ]
        },
        {
            type: 'number',
            id: 'ckd-epi-age',
            label: 'Age',
            standardUnit: 'years',
            placeholder: 'Enter age',
            validationType: 'age'
        },
        {
            type: 'number',
            id: 'ckd-epi-creatinine',
            label: 'Serum Creatinine',
            standardUnit: 'mg/dL',
            unitConfig: { type: 'creatinine', units: ['mg/dL', 'µmol/L'], default: 'mg/dL' },
            validationType: 'creatinine',
            loincCode: LOINC_CODES.CREATININE
        }
    ],
    formulas: [
        {
            label: 'Female',
            formula:
                '142 × min(Scr/0.7, 1)<sup>-0.241</sup> × max(Scr/0.7, 1)<sup>-1.200</sup> × 0.9938<sup>Age</sup> × 1.012'
        },
        {
            label: 'Male',
            formula:
                '142 × min(Scr/0.9, 1)<sup>-0.302</sup> × max(Scr/0.9, 1)<sup>-1.200</sup> × 0.9938<sup>Age</sup>'
        }
    ],
    calculate: values => {
        const age = values['ckd-epi-age'] as number;
        const creatinine = values['ckd-epi-creatinine'] as number;
        const gender = values['ckd-epi-gender'] as string;

        if (!age || !creatinine) return null;

        const kappa = gender === 'female' ? 0.7 : 0.9;
        const alpha = gender === 'female' ? -0.241 : -0.302;
        const genderFactor = gender === 'female' ? 1.012 : 1;

        const gfr =
            142 *
            Math.pow(Math.min(creatinine / kappa, 1), alpha) *
            Math.pow(Math.max(creatinine / kappa, 1), -1.2) *
            Math.pow(0.9938, age) *
            genderFactor;

        let stage = '';
        let alertType: 'info' | 'warning' | 'danger' | 'success' = 'info';
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
            alertMsg =
                'Moderate to severe reduction in kidney function. Consider nephrology referral.';
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
                label: 'eGFR',
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
    customResultRenderer: results => {
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
        const ageInput = container.querySelector('#ckd-epi-age') as HTMLInputElement;
        const genderMale = container.querySelector(
            'input[name="ckd-epi-gender"][value="male"]'
        ) as HTMLInputElement;
        const genderFemale = container.querySelector(
            'input[name="ckd-epi-gender"][value="female"]'
        ) as HTMLInputElement;

        const populate = async () => {
            try {
                const age = await fhirDataService.getPatientAge();
                if (age !== null && ageInput) {
                    ageInput.value = age.toString();
                    ageInput.dispatchEvent(new Event('input'));
                }

                const gender = await fhirDataService.getPatientGender(); // Using await as getPatientAge might be async
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
