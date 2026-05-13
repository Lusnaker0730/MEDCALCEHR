/**
 * AHA PREVENT Risk Calculator
 *
 * Predicting Risk of cardiovascular disease EVENTs (Khan SS et al., Circulation 2024)
 * — sex-specific, race-free 10- and 30-year risk for total CVD, ASCVD, and heart failure
 * in adults aged 30-79.
 *
 * Adds HbA1c and/or UACR predictors when entered (auto-selects Base → +HbA1c → +UACR →
 * Full). SDI is not collected (would require a US ZIP code) and is treated as missing
 * in the Full model, matching the published behavior for unavailable SDI.
 */

import {
    createUnifiedFormulaCalculator,
    type CrossFieldValidationError
} from '../shared/unified-formula-calculator.js';
import { LOINC_CODES, SNOMED_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import {
    preventCalculationFromValues,
    calculateEgfr,
    type PreventPatient
} from './calculation.js';

let lastPatient: PreventPatient | null = null;

const preventCalculate = (values: Record<string, any>) => {
    lastPatient = null;
    const { results, patient } = preventCalculationFromValues(values);
    lastPatient = patient;
    return results;
};

export const prevent = createUnifiedFormulaCalculator({
    id: 'prevent',
    title: 'AHA PREVENT Risk Calculator',
    description:
        '10- and 30-year risk of total CVD, ASCVD, and heart failure (Khan SS et al., Circulation 2024). Sex-specific, race-free, validated for ages 30-79.',

    infoAlert: `
        <strong>AHA PREVENT Equations (2024)</strong>
        ${uiBuilder.createList({
            items: [
                'Replaces the 2013 Pooled Cohort Equations for primary prevention',
                'Estimates 10- and 30-year risk for total CVD (ASCVD + heart failure)',
                'Validated for ages 30-79; 30-year horizon is most informative for ages 30-59',
                'Optional HbA1c and UACR refine the estimate for cardiovascular-kidney-metabolic patients'
            ],
            type: 'ul'
        })}
    `,

    autoPopulateAge: 'prevent-age',
    autoPopulateGender: 'prevent-sex',

    sections: [
        {
            title: 'Patient Demographics',
            icon: '👤',
            fields: [
                {
                    id: 'prevent-age',
                    label: 'Age',
                    type: 'number',
                    unit: 'years',
                    min: 30,
                    max: 79,
                    validationType: 'age',
                    required: false
                },
                {
                    type: 'radio',
                    name: 'prevent-sex',
                    label: 'Sex at birth',
                    options: [
                        { value: 'female', label: 'Female', checked: true },
                        { value: 'male', label: 'Male' }
                    ]
                }
            ]
        },
        {
            title: 'Blood Pressure',
            icon: '💓',
            fields: [
                {
                    id: 'prevent-sbp',
                    label: 'Systolic Blood Pressure',
                    type: 'number',
                    unit: 'mmHg',
                    loincCode: LOINC_CODES.SYSTOLIC_BP,
                    validationType: 'systolicBP',
                    min: 90,
                    max: 180,
                    required: false
                },
                {
                    type: 'radio',
                    name: 'prevent-htn-tx',
                    label: 'Currently on antihypertensive medication?',
                    options: [
                        { value: 'no', label: 'No', checked: true },
                        { value: 'yes', label: 'Yes' }
                    ]
                }
            ]
        },
        {
            title: 'Lipid Panel',
            icon: '🧪',
            fields: [
                {
                    id: 'prevent-tc',
                    label: 'Total Cholesterol',
                    type: 'number',
                    loincCode: LOINC_CODES.CHOLESTEROL_TOTAL,
                    unitConfig: {
                        type: 'totalCholesterol',
                        units: ['mg/dL', 'mmol/L'],
                        default: 'mg/dL'
                    },
                    validationType: 'totalCholesterol',
                    min: 130,
                    max: 320,
                    required: false
                },
                {
                    id: 'prevent-hdl',
                    label: 'HDL Cholesterol',
                    type: 'number',
                    loincCode: LOINC_CODES.HDL,
                    unitConfig: { type: 'hdl', units: ['mg/dL', 'mmol/L'], default: 'mg/dL' },
                    validationType: 'hdl',
                    min: 20,
                    max: 100,
                    required: false
                },
                {
                    type: 'radio',
                    name: 'prevent-statin',
                    label: 'Currently on statin therapy?',
                    options: [
                        { value: 'no', label: 'No', checked: true },
                        { value: 'yes', label: 'Yes' }
                    ]
                }
            ]
        },
        {
            title: 'Body & Renal Function',
            icon: '🫘',
            fields: [
                {
                    id: 'prevent-bmi',
                    label: 'BMI',
                    type: 'number',
                    unit: 'kg/m²',
                    step: 0.1,
                    loincCode: LOINC_CODES.BMI,
                    min: 18.5,
                    max: 39.9,
                    required: false,
                    helpText: 'Body mass index'
                },
                {
                    id: 'prevent-egfr',
                    label: 'eGFR',
                    type: 'number',
                    unit: 'mL/min/1.73m²',
                    loincCode: LOINC_CODES.EGFR,
                    validationType: 'egfr',
                    min: 15,
                    max: 140,
                    required: false,
                    helpText:
                        'If unknown, enter serum creatinine below — eGFR will be derived via CKD-EPI 2021 (race-free).'
                },
                {
                    id: 'prevent-creatinine',
                    label: 'Serum Creatinine (only if eGFR unknown)',
                    type: 'number',
                    step: 0.01,
                    loincCode: LOINC_CODES.CREATININE,
                    unitConfig: {
                        type: 'creatinine',
                        units: ['mg/dL', 'µmol/L'],
                        default: 'mg/dL'
                    },
                    validationType: 'creatinine',
                    required: false
                }
            ]
        },
        {
            title: 'Risk Factors',
            icon: '⚠️',
            fields: [
                {
                    type: 'radio',
                    name: 'prevent-dm',
                    label: 'Diabetes mellitus?',
                    snomedCode: `${SNOMED_CODES.DIABETES_TYPE_2},${SNOMED_CODES.DIABETES_TYPE_1}`,
                    options: [
                        { value: 'no', label: 'No', checked: true },
                        { value: 'yes', label: 'Yes' }
                    ]
                },
                {
                    type: 'radio',
                    name: 'prevent-smoking',
                    label: 'Current cigarette smoker?',
                    options: [
                        { value: 'no', label: 'No', checked: true },
                        { value: 'yes', label: 'Yes (≥1 cigarette in last 30 days)' }
                    ],
                    helpText: 'PREVENT defines current smoking as any cigarette use within the last 30 days.'
                }
            ]
        },
        {
            title: 'Optional Add-ons (CKM Health)',
            subtitle:
                'Leave blank if unavailable. Adding HbA1c and/or urine albumin/creatinine ratio (UACR) refines the prediction for patients with cardiovascular-kidney-metabolic syndrome.',
            icon: '➕',
            fields: [
                {
                    id: 'prevent-hba1c',
                    label: 'HbA1c (optional)',
                    type: 'number',
                    unit: '%',
                    step: 0.1,
                    loincCode: LOINC_CODES.HBA1C,
                    min: 4.5,
                    max: 15,
                    required: false
                },
                {
                    id: 'prevent-uacr',
                    label: 'Urine Albumin/Creatinine Ratio (optional)',
                    type: 'number',
                    unit: 'mg/g',
                    step: 0.1,
                    min: 0.1,
                    max: 25000,
                    required: false,
                    helpText: 'Spot UACR. Stage A1 <30, A2 30-300, A3 >300 mg/g.'
                }
            ]
        }
    ],

    resultTitle: 'PREVENT Risk Estimates',

    calculate: preventCalculate,

    crossFieldValidation: (values: Record<string, any>): CrossFieldValidationError[] => {
        const errors: CrossFieldValidationError[] = [];

        const tc = values['prevent-tc'];
        const hdl = values['prevent-hdl'];
        if (tc !== undefined && hdl !== undefined && hdl >= tc) {
            errors.push({
                fieldId: 'prevent-hdl',
                message: 'HDL must be lower than total cholesterol.'
            });
        }

        // If eGFR is blank, creatinine must be present (we derive eGFR from it).
        const egfr = values['prevent-egfr'];
        const cr = values['prevent-creatinine'];
        const age = values['prevent-age'];
        if ((egfr === undefined || egfr === null) && cr !== undefined && age !== undefined) {
            const sex = (values['prevent-sex'] || 'female') as 'male' | 'female';
            const derived = calculateEgfr(cr, age, sex);
            if (!Number.isFinite(derived) || derived < 15 || derived > 140) {
                errors.push({
                    fieldId: 'prevent-creatinine',
                    message: `Derived eGFR (${Number.isFinite(derived) ? derived.toFixed(0) : 'NaN'}) is outside the validated range (15-140).`
                });
            }
        }

        return errors;
    },

    formulaSection: {
        show: true,
        title: 'PREVENT Equations',
        calculationNote:
            'logit = Σ(βᵢ · xᵢ) + intercept;  Risk = exp(logit) / (1 + exp(logit)).  Sex-specific equations with race-free CKD-EPI (2021) eGFR. Predictor centering: age 55, non-HDL 3.5 mmol/L, HDL 1.3 mmol/L, SBP 130, BMI 25, eGFR 90, HbA1c 5.3%.',
        scoringCriteria: [
            { criteria: 'Predictor', points: 'Notes', isHeader: true },
            { criteria: 'Age (years)', points: 'Per 10 years; squared term in 30-year' },
            { criteria: 'Non-HDL cholesterol (mmol/L)', points: 'Per 1 mmol/L (TC − HDL)' },
            { criteria: 'HDL cholesterol (mmol/L)', points: 'Per 0.3 mmol/L' },
            { criteria: 'Systolic BP (mmHg)', points: 'Piece-wise <110 vs ≥110' },
            { criteria: 'BMI (kg/m²)', points: 'Piece-wise <30 vs ≥30' },
            { criteria: 'eGFR (mL/min/1.73m²)', points: 'Piece-wise <60 vs ≥60' },
            { criteria: 'Diabetes', points: 'Yes / No' },
            { criteria: 'Current smoking', points: 'Last 30 days' },
            { criteria: 'On antihypertensive', points: 'Treatment interacts with SBP' },
            { criteria: 'On statin', points: 'Treatment interacts with non-HDL' },
            { criteria: 'HbA1c (%) — optional', points: 'Separate β for DM vs no DM' },
            { criteria: 'ln(UACR) — optional', points: 'Spot urine ACR (mg/g)' }
        ]
    },

    reference: `
        ${uiBuilder.createSection({
            title: 'ASCVD 10-Year Risk Categories (2018 AHA/ACC Cholesterol Guideline)',
            icon: '📊',
            content: uiBuilder.createTable({
                headers: ['10-Year ASCVD Risk', 'Category', 'Statin Recommendation'],
                rows: [
                    ['<5%', 'Low', 'Lifestyle modifications'],
                    ['5–7.4%', 'Borderline', 'Discuss risk-enhancers; consider CAC scoring'],
                    ['7.5–19.9%', 'Intermediate', 'Moderate-intensity statin after shared decision-making'],
                    ['≥20%', 'High', 'High-intensity statin']
                ]
            })
        })}

        ${uiBuilder.createReference({
            title: 'References',
            icon: '📚',
            citations: [
                'Khan SS, Matsushita K, Sang Y, et al. Development and Validation of the American Heart Association\'s PREVENT Equations. <em>Circulation</em>. 2024;149(6):430-449. doi:10.1161/CIRCULATIONAHA.123.067626',
                'Ndumele CE, Rangaswami J, Chow SL, et al. Cardiovascular-Kidney-Metabolic Health: A Presidential Advisory From the American Heart Association. <em>Circulation</em>. 2023;148:1606-1635.',
                'Inker LA, Eneanya ND, Coresh J, et al. New Creatinine- and Cystatin C-Based Equations to Estimate GFR without Race. <em>N Engl J Med</em>. 2021;385:1737-1749.',
                'AHA PREVENT Online Calculator. https://professional.heart.org/en/guidelines-and-statements/prevent-calculator'
            ]
        })}
    `,

    customInitialize: (_client, _patient, container, _calculateFn) => {
        // If only creatinine is filled, mirror an estimated eGFR into the read-only display
        // so the user sees what we'll use in the calculation. The actual derivation happens
        // server-side in `preventCalculationFromValues`.
        const creatinineInput = container.querySelector('#prevent-creatinine') as HTMLInputElement | null;
        const egfrInput = container.querySelector('#prevent-egfr') as HTMLInputElement | null;
        const ageInput = container.querySelector('#prevent-age') as HTMLInputElement | null;

        const recompute = () => {
            if (!creatinineInput || !egfrInput || !ageInput) return;
            // Only derive when user has not explicitly entered an eGFR
            if (egfrInput.dataset.derivedFromCr !== '1' && egfrInput.value !== '') return;
            const cr = parseFloat(creatinineInput.value);
            const age = parseFloat(ageInput.value);
            const sex = (container.querySelector('input[name="prevent-sex"]:checked') as HTMLInputElement | null)?.value as
                | 'male'
                | 'female'
                | undefined;
            if (!Number.isFinite(cr) || !Number.isFinite(age) || !sex) return;
            const v = calculateEgfr(cr, age, sex);
            if (Number.isFinite(v)) {
                egfrInput.value = String(v);
                egfrInput.dataset.derivedFromCr = '1';
                egfrInput.dispatchEvent(new Event('input', { bubbles: true }));
            }
        };

        creatinineInput?.addEventListener('input', recompute);
        ageInput?.addEventListener('input', recompute);
        container
            .querySelectorAll('input[name="prevent-sex"]')
            .forEach(el => el.addEventListener('change', recompute));

        // If user starts typing an eGFR directly, stop deriving from creatinine.
        egfrInput?.addEventListener('input', () => {
            if (egfrInput.dataset.derivedFromCr === '1' && document.activeElement === egfrInput) {
                delete egfrInput.dataset.derivedFromCr;
            }
        });
    }
});

export default prevent;

// Re-export for tests
export { lastPatient };
