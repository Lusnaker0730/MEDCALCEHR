/**
 * MAGGIC Risk Calculator for Heart Failure
 * 
 * 使用 createMixedInputCalculator 工廠函數遷移
 */

import { getMostRecentObservation, calculateAge, getPatientConditions } from '../../utils.js';
import { createStalenessTracker } from '../../data-staleness.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { createMixedInputCalculator, MixedInputCalculatorConfig } from '../shared/mixed-input-calculator.js';

// 分數計算函數
const getPoints = {
    age: (v: number) => v * 0.08,
    ef: (v: number) => v * -0.05,
    sbp: (v: number) => v * -0.02,
    bmi: (v: number) => {
        if (v < 20) return 2;
        if (v >= 20 && v < 25) return 1;
        if (v >= 25 && v < 30) return 0;
        if (v >= 30) return -1;
        return 0;
    },
    creatinine: (v: number) => {
        if (v <= 0.9) return 0;
        if (v > 0.9 && v <= 1.3) return 1;
        if (v > 1.3 && v <= 2.2) return 3;
        if (v > 2.2) return 5;
        return 0;
    }
};

const getMortality = (score: number) => {
    const linearPredictor = 0.047 * (score - 21.6);
    const prob1yr = 1 - Math.pow(0.92, Math.exp(linearPredictor));
    const prob3yr = 1 - Math.pow(0.79, Math.exp(linearPredictor));
    return { prob1yr: (prob1yr * 100).toFixed(1), prob3yr: (prob3yr * 100).toFixed(1) };
};

const config: MixedInputCalculatorConfig = {
    id: 'maggic',
    title: 'MAGGIC Risk Calculator for Heart Failure',
    description: 'Estimates 1- and 3- year mortality in heart failure.',
    
    infoAlert: '<strong>Instructions:</strong> Use in adult patients (≥18 years). Use with caution in patients with reduced ejection fraction (not yet externally validated in this population).',
    
    sections: [
        {
            title: 'Patient Characteristics',
            icon: '👤',
            inputs: [
                {
                    type: 'number',
                    id: 'maggic-age',
                    label: 'Age',
                    unit: 'years'
                },
                {
                    type: 'radio',
                    name: 'maggic-gender',
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
                    placeholder: 'Norm: 20-25'
                },
                {
                    type: 'radio',
                    name: 'maggic-smoker',
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
            inputs: [
                {
                    type: 'number',
                    id: 'maggic-ef',
                    label: 'Ejection Fraction',
                    unit: '%'
                },
                {
                    type: 'number',
                    id: 'maggic-sbp',
                    label: 'Systolic BP',
                    unit: 'mmHg',
                    placeholder: 'Norm: 100-120'
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
                    name: 'maggic-nyha',
                    label: 'NYHA Class',
                    options: [
                        { value: '0', label: 'Class I (No limitation)' },
                        { value: '2', label: 'Class II (Slight limitation) (+2)' },
                        { value: '6', label: 'Class III (Marked limitation) (+6)' },
                        { value: '8', label: 'Class IV (Unable to carry on any physical activity) (+8)' }
                    ]
                }
            ]
        },
        {
            title: 'Comorbidities & History',
            icon: '🏥',
            inputs: [
                {
                    type: 'radio',
                    name: 'maggic-diabetes',
                    label: 'Diabetes',
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: '3', label: 'Yes (+3)' }
                    ]
                },
                {
                    type: 'radio',
                    name: 'maggic-copd',
                    label: 'COPD',
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: '2', label: 'Yes (+2)' }
                    ]
                },
                {
                    type: 'radio',
                    name: 'maggic-hfdx',
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
            inputs: [
                {
                    type: 'radio',
                    name: 'maggic-bb',
                    label: 'Beta Blocker',
                    options: [
                        { value: '3', label: 'No (+3)', checked: true },
                        { value: '0', label: 'Yes' }
                    ]
                },
                {
                    type: 'radio',
                    name: 'maggic-acei',
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
    
    calculate: (values) => {
        const age = values['maggic-age'] as number | null;
        const ef = values['maggic-ef'] as number | null;
        const sbp = values['maggic-sbp'] as number | null;
        const bmi = values['maggic-bmi'] as number | null;
        const creatinine = values['maggic-creatinine'] as number | null;
        const nyha = values['maggic-nyha'] as string | null;
        
        // 需要所有輸入
        if (age === null || ef === null || sbp === null || bmi === null || creatinine === null || nyha === null) {
            return null;
        }
        
        let score = 0;
        score += getPoints.age(age);
        score += getPoints.ef(ef);
        score += getPoints.sbp(sbp);
        score += getPoints.bmi(bmi);
        score += getPoints.creatinine(creatinine);
        
        // Radio values
        const radios = ['maggic-gender', 'maggic-smoker', 'maggic-nyha', 'maggic-diabetes', 'maggic-copd', 'maggic-hfdx', 'maggic-bb', 'maggic-acei'];
        radios.forEach(name => {
            const val = values[name];
            if (val !== null && val !== undefined) {
                score += parseInt(val as string);
            }
        });
        
        return score;
    },
    
    customResultRenderer: (score, values) => {
        const mortality = getMortality(score);
        
        return `
            ${uiBuilder.createResultItem({
                label: 'Total MAGGIC Score',
                value: score.toFixed(1),
                unit: 'points'
            })}
            ${uiBuilder.createResultItem({
                label: '1-Year Mortality Risk',
                value: `${mortality.prob1yr}%`,
                alertClass: 'ui-alert-warning'
            })}
            ${uiBuilder.createResultItem({
                label: '3-Year Mortality Risk',
                value: `${mortality.prob3yr}%`,
                alertClass: 'ui-alert-danger'
            })}
        `;
    },
    
    customInitialize: async (client, patient, container, calculate, setValue) => {
        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);
        
        const setRadio = (name: string, value: string) => {
            const radio = container.querySelector(`input[name="${name}"][value="${value}"]`) as HTMLInputElement | null;
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change', { bubbles: true }));
            }
        };
        
        // Age and gender from patient
        if (patient) {
            if ((patient as any).birthDate) {
                setValue('maggic-age', calculateAge((patient as any).birthDate).toString());
            }
            if ((patient as any).gender) {
                setRadio('maggic-gender', (patient as any).gender === 'male' ? '1' : '0');
            }
        }
        
        if (client) {
            // Fetch observations in parallel
            const [bmiObs, sbpObs, creatObs] = await Promise.all([
                getMostRecentObservation(client as any, LOINC_CODES.BMI).catch(() => null),
                getMostRecentObservation(client as any, LOINC_CODES.SYSTOLIC_BP).catch(() => null),
                getMostRecentObservation(client as any, LOINC_CODES.CREATININE).catch(() => null)
            ]);
            
            if (bmiObs?.valueQuantity) {
                setValue('maggic-bmi', bmiObs.valueQuantity.value.toFixed(1));
                stalenessTracker.trackObservation('#maggic-bmi', bmiObs, LOINC_CODES.BMI, 'BMI');
            }
            
            if (sbpObs?.valueQuantity) {
                setValue('maggic-sbp', sbpObs.valueQuantity.value.toFixed(0));
                stalenessTracker.trackObservation('#maggic-sbp', sbpObs, LOINC_CODES.SYSTOLIC_BP, 'Systolic BP');
            }
            
            if (creatObs?.valueQuantity) {
                setValue('maggic-creatinine', creatObs.valueQuantity.value.toFixed(2));
                stalenessTracker.trackObservation('#maggic-creatinine', creatObs, LOINC_CODES.CREATININE, 'Creatinine');
            }
            
            // Fetch conditions
            try {
                const conditions = await getPatientConditions(client as any, ['414990002', '195967001']);
                const hasDiabetes = conditions.some((c: any) => c.code?.coding?.some((co: any) => co.code === '414990002'));
                if (hasDiabetes) setRadio('maggic-diabetes', '3');
                
                const hasCopd = conditions.some((c: any) => c.code?.coding?.some((co: any) => co.code === '195967001'));
                if (hasCopd) setRadio('maggic-copd', '2');
            } catch (e) {
                console.warn('Error fetching conditions for MAGGIC', e);
            }
        }
        
        calculate();
    }
};

export const maggic = createMixedInputCalculator(config);
