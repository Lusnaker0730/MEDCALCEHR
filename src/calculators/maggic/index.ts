/**
 * MAGGIC Risk Calculator for Heart Failure
 *
 * Migrated to createUnifiedFormulaCalculator
 */

import { createUnifiedFormulaCalculator } from '../shared/unified-formula-calculator.js';
import { LOINC_CODES, SNOMED_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { fhirDataService } from '../../fhir-data-service.js';
import { calculateMaggic } from './calculation.js';
import type { FormulaCalculatorConfig } from '../../types/calculator-formula.js';
import { logger } from '../../logger.js';

const config: FormulaCalculatorConfig = {
    id: 'maggic',
    title: 'MAGGIC Risk Calculator for Heart Failure',
    description: 'Estimates 1- and 3- year mortality in heart failure.',

    infoAlert:
        '<strong>Instructions:</strong> Use in adult patients (≥18 years). Use with caution in patients with reduced ejection fraction (not yet externally validated in this population).',

    sections: [
        {
            title: 'Patient Characteristics',
            icon: '👤',
            fields: [
                {
                    type: 'number',
                    id: 'maggic-age',
                    label: 'Age',
                    unit: 'years',
                    validationType: 'age'
                },
                {
                    type: 'radio',
                    id: 'maggic-gender',
                    label: 'Gender',
                    options: [
                        { value: '0', label: 'Female', checked: true },
                        { value: '1', label: 'Male (+1)' }
                    ]
                },
                {
                    type: 'number',
                    id: 'maggic-bmi',
                    label: 'BMI',
                    unit: 'kg/m²',
                    step: 0.1,
                    placeholder: 'Norm: 20-25',
                    min: 10,
                    max: 80
                },
                {
                    type: 'radio',
                    id: 'maggic-smoker',
                    label: 'Current Smoker',
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: '1', label: 'Yes (+1)' }
                    ]
                }
            ]
        },
        {
            title: 'Clinical Parameters',
            icon: '🩺',
            fields: [
                {
                    type: 'number',
                    id: 'maggic-ef',
                    label: 'Ejection Fraction',
                    unit: '%',
                    min: 5,
                    max: 100
                },
                {
                    type: 'number',
                    id: 'maggic-sbp',
                    label: 'Systolic BP',
                    unit: 'mmHg',
                    placeholder: 'Norm: 100-120',
                    validationType: 'systolicBP'
                },
                {
                    type: 'number',
                    id: 'maggic-creatinine',
                    label: 'Creatinine',
                    step: 0.1,
                    unitToggle: {
                        type: 'creatinine',
                        units: ['mg/dL', 'µmol/L'],
                        default: 'mg/dL'
                    },
                    helpText: 'Uses mg/dL for calculation (conversion applied if needed)'
                },
                {
                    type: 'radio',
                    id: 'maggic-nyha',
                    label: 'NYHA Class',
                    options: [
                        { value: '0', label: 'Class I (No limitation)' },
                        { value: '2', label: 'Class II (Slight limitation) (+2)' },
                        { value: '6', label: 'Class III (Marked limitation) (+6)' },
                        {
                            value: '8',
                            label: 'Class IV (Unable to carry on any physical activity) (+8)'
                        }
                    ]
                }
            ]
        },
        {
            title: 'Comorbidities & History',
            icon: '🏥',
            fields: [
                {
                    type: 'radio',
                    id: 'maggic-diabetes',
                    label: 'Diabetes',
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: '3', label: 'Yes (+3)' }
                    ]
                },
                {
                    type: 'radio',
                    id: 'maggic-copd',
                    label: 'COPD',
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: '2', label: 'Yes (+2)' }
                    ]
                },
                {
                    type: 'radio',
                    id: 'maggic-hfdx',
                    label: 'Heart failure first diagnosed ≥18 months ago',
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: '2', label: 'Yes (+2)' }
                    ]
                }
            ]
        },
        {
            title: 'Medications',
            icon: '💊',
            fields: [
                {
                    type: 'radio',
                    id: 'maggic-bb',
                    label: 'Beta Blocker',
                    options: [
                        { value: '3', label: 'No (+3)', checked: true },
                        { value: '0', label: 'Yes' }
                    ]
                },
                {
                    type: 'radio',
                    id: 'maggic-acei',
                    label: 'ACEi/ARB',
                    options: [
                        { value: '1', label: 'No (+1)', checked: true },
                        { value: '0', label: 'Yes' }
                    ]
                }
            ]
        }
    ],

    resultTitle: 'MAGGIC Risk Score',

    autoPopulateAge: 'maggic-age',
    autoPopulateGender: 'maggic-gender',

    calculate: calculateMaggic,

    footerHTML: `
        <div class="space-y-4">
            <h3 class="font-bold text-lg">FACTS & FIGURES</h3>
            ${uiBuilder.createTable({
        headers: ['Risk Factor', '', 'Points'],
        rows: [
            ['<strong>Male</strong>', '', '+1'],
            ['<strong>Smoker</strong>', '', '+1'],
            ['<strong>Diabetes</strong>', '', '+3'],
            ['<strong>COPD</strong>', '', '+2'],
            ['<strong>Heart failure first diagnosed ≥18 months ago</strong>', '', '+2'],
            ['<strong>Not on beta blocker</strong>', '', '+3'],
            ['<strong>Not on ACEi/ARB</strong>', '', '+1'],
            ['<strong>Ejection fraction (%)</strong>', '≤20', '+7'],
            ['', '20-25', '+6'],
            ['', '25-30', '+5'],
            ['', '30-35', '+3'],
            ['', '35-40', '+2'],
            ['', '≥40', '0'],
            ['<strong>NYHA class</strong>', '1', '0'],
            ['', '2', '+2'],
            ['', '3', '+6'],
            ['', '4', '+8'],
            ['<strong>Creatinine*</strong>', '≤90', '0'],
            ['', '90-110', '+1'],
            ['', '110-130', '+2'],
            ['', '130-150', '+3'],
            ['', '150-170', '+4'],
            ['', '170-210', '+5'],
            ['', '210-250', '+6'],
            ['', '>250', '+8'],
            ['<strong>SBP</strong>', '<110', '+5'],
            ['', '110-120', '+4'],
            ['', '120-130', '+3'],
            ['', '130-140', '+2'],
            ['', '140-150', '+1'],
            ['', '≥150', '0'],
            ['<strong>BMI</strong>', '<15', '+6'],
            ['', '15-19', '+5'],
            ['', '20-24', '+3'],
            ['', '25-29', '+2'],
            ['', '≥30', '0'],
            ['<strong>Extra for systolic BP (mmHg) if EF <30</strong>', '<110', '+5'],
            ['', '110-119', '+4'],
            ['', '120-129', '+3'],
            ['', '130-139', '+2'],
            ['', '140-149', '+1'],
            ['', '≥150', '0'],
            ['<strong>Extra for systolic BP (mmHg) if EF 30-39</strong>', '<110', '+3'],
            ['', '110-119', '+2'],
            ['', '120-129', '+1'],
            ['', '130-139', '+1'],
            ['', '140-149', '0'],
            ['', '≥150', '0'],
            ['<strong>Extra for systolic BP (mmHg) if EF ≥40</strong>', '<110', '+2'],
            ['', '110-119', '+1'],
            ['', '120-129', '+1'],
            ['', '130-139', '0'],
            ['', '140-149', '0'],
            ['', '≥150', '0'],
            ['<strong>Extra for age (years) if EF <30</strong>', '<55', '+0'],
            ['', '55-59', '+1'],
            ['', '60-64', '+2'],
            ['', '65-69', '+4'],
            ['', '70-74', '+6'],
            ['', '75-79', '+8'],
            ['', '≥80', '+10'],
            ['<strong>Extra for age (years) if EF 30-39</strong>', '<55', '+0'],
            ['', '55-59', '+2'],
            ['', '60-64', '+4'],
            ['', '65-69', '+6'],
            ['', '70-74', '+8'],
            ['', '75-79', '+10'],
            ['', '≥80', '+13'],
            ['<strong>Extra for age (years) if EF ≥40</strong>', '<55', '+0'],
            ['', '55-59', '+3'],
            ['', '60-64', '+5'],
            ['', '65-69', '+7'],
            ['', '70-74', '+9'],
            ['', '75-79', '+12'],
            ['', '≥80', '+15']
        ],
        stickyFirstColumn: true
    })}
            <p class="table-note text-sm text-muted mt-10">
                *Creatinine in µmol/L (to convert from mg/dL to µmol/L, multiply by 88.4)
            </p>
        </div>
    `,

    customInitialize: async (client, patient, container, calculate) => {
        // Initialize FHIR service (already done by factory, but harmless to repeat)
        if (!fhirDataService.isReady()) return;

        const setRadio = (name: string, value: string) => {
            const radio = container.querySelector(
                `input[name="${name}"][value="${value}"]`
            ) as HTMLInputElement;
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change', { bubbles: true }));
            }
        };

        // Age and Gender are handled by autoPopulateAge/autoPopulateGender in config!

        try {
            // LVEF (Ejection Fraction)
            const efResult = await fhirDataService.getObservation(LOINC_CODES.LVEF, {
                trackStaleness: true,
                stalenessLabel: 'LVEF'
            });
            if (efResult.value !== null) {
                const input = container.querySelector('#maggic-ef') as HTMLInputElement;
                if (input) {
                    input.value = efResult.value.toFixed(0);
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }

            // BMI
            const bmiResult = await fhirDataService.getObservation(LOINC_CODES.BMI, {
                trackStaleness: true
            });
            if (bmiResult.value !== null) {
                const input = container.querySelector('#maggic-bmi') as HTMLInputElement;
                if (input) {
                    input.value = bmiResult.value.toFixed(1);
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }

            // Systolic BP
            const bpResult = await fhirDataService.getBloodPressure({ trackStaleness: true });
            if (bpResult.systolic !== null) {
                const input = container.querySelector('#maggic-sbp') as HTMLInputElement;
                if (input) {
                    input.value = bpResult.systolic.toFixed(0);
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }

            // Creatinine
            const creatResult = await fhirDataService.getObservation(LOINC_CODES.CREATININE, {
                trackStaleness: true,
                targetUnit: 'mg/dL',
                unitType: 'creatinine'
            });
            if (creatResult.value !== null) {
                const input = container.querySelector('#maggic-creatinine') as HTMLInputElement;
                if (input) {
                    input.value = creatResult.value.toFixed(2);
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }

            // Conditions: Diabetes & COPD

            // Diabetes
            const hasDiabetes = await fhirDataService.hasCondition([
                SNOMED_CODES.DIABETES_MELLITUS,
                SNOMED_CODES.DIABETES_TYPE_1,
                SNOMED_CODES.DIABETES_TYPE_2
            ]);
            if (hasDiabetes) setRadio('maggic-diabetes', '3'); // Yes (+3)

            // COPD
            const hasCopd = await fhirDataService.hasCondition([
                SNOMED_CODES.COPD,
                SNOMED_CODES.ASTHMA // Sometimes considered relevant, keeping strict to COPD codes primarily but user had asthma code before
            ]);
            if (hasCopd) setRadio('maggic-copd', '2'); // Yes (+2)

            // Smoker
            const isSmoker = await fhirDataService.hasCondition([
                SNOMED_CODES.SMOKING_STATUS,
                SNOMED_CODES.SMOKING
            ]);
            // Or better check observation for smoking status if available, but condition is a good proxy for "Current Smoker" often
            if (isSmoker) setRadio('maggic-smoker', '1');

            // Medications
            // (Beta Blockers and ACEi/ARB medication logic removed to align with TW Core terminology)
        } catch (e) {
            logger.warn('Error fetching FHIR data for MAGGIC', { error: String(e) });
        }

        calculate();
    }
};

export const maggic = createUnifiedFormulaCalculator(config);
