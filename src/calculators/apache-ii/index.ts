/**
 * APACHE II Calculator
 *
 * 使用 Unified Formula Calculator 工廠函數
 * 計算 ICU 死亡風險
 */

import { createUnifiedFormulaCalculator } from '../shared/unified-formula-calculator.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { apacheIiCalculation } from './calculation.js';

export const apacheIi = createUnifiedFormulaCalculator({
    id: 'apache-ii',
    title: 'APACHE II',
    description: 'Calculates APACHE II score for ICU mortality.',

    infoAlert:
        'Enter physiologic values from the first 24 hours of ICU admission. Use the worst value for each parameter.',

    autoPopulateAge: 'apache-ii-age',

    sections: [
        {
            title: 'Chronic Health Status',
            subtitle: 'History of severe organ insufficiency or immunocompromised',
            fields: [
                {
                    name: 'chronic',
                    label: '',
                    options: [
                        {
                            value: '5',
                            label: 'Yes - Non-operative or emergency postoperative (+5)',
                            checked: true
                        },
                        { value: '2', label: 'Yes - Elective postoperative (+2)' },
                        { value: '0', label: 'No (0)' }
                    ]
                }
            ]
        },
        {
            title: 'Demographics & Vital Signs',
            fields: [
                { id: 'apache-ii-age', label: 'Age', unit: 'years', validationType: 'age' },
                {
                    id: 'apache-ii-temp',
                    label: 'Temperature',
                    step: 0.1,
                    placeholder: '36.1 - 37.8',
                    unitToggle: { type: 'temperature', units: ['C', 'F'], default: 'C' }
                },
                {
                    id: 'apache-ii-map',
                    label: 'Mean Arterial Pressure',
                    unit: 'mmHg',
                    placeholder: '70 - 100',
                    validationType: 'map'
                },
                {
                    id: 'apache-ii-hr',
                    label: 'Heart Rate',
                    unit: 'bpm',
                    placeholder: '60 - 100',
                    validationType: 'heartRate'
                },
                {
                    id: 'apache-ii-rr',
                    label: 'Respiratory Rate',
                    unit: 'breaths/min',
                    placeholder: '12 - 20',
                    validationType: 'respiratoryRate'
                }
            ]
        },
        {
            title: 'Laboratory Values',
            fields: [
                {
                    id: 'apache-ii-ph',
                    label: 'Arterial pH',
                    step: 0.01,
                    placeholder: '7.38 - 7.44',
                    validationType: 'pH'
                },
                {
                    id: 'apache-ii-sodium',
                    label: 'Sodium',
                    placeholder: '136 - 145',
                    unitToggle: { type: 'sodium', units: ['mmol/L', 'mEq/L'], default: 'mmol/L' }
                },
                {
                    id: 'apache-ii-potassium',
                    label: 'Potassium',
                    step: 0.1,
                    placeholder: '3.5 - 5.2',
                    unitToggle: { type: 'potassium', units: ['mmol/L', 'mEq/L'], default: 'mmol/L' }
                },
                {
                    id: 'apache-ii-creatinine',
                    label: 'Creatinine',
                    step: 0.1,
                    placeholder: '0.7 - 1.3',
                    unitToggle: { type: 'creatinine', units: ['mg/dL', 'µmol/L'], default: 'mg/dL' }
                },
                {
                    id: 'apache-ii-hct',
                    label: 'Hematocrit',
                    unit: '%',
                    step: 0.1,
                    placeholder: '36 - 51',
                    validationType: 'hematocrit'
                },
                {
                    id: 'apache-ii-wbc',
                    label: 'WBC Count',
                    unit: 'x 10⁹/L',
                    step: 0.1,
                    placeholder: '3.7 - 10.7',
                    validationType: 'wbc'
                },
                {
                    name: 'arf',
                    label: 'Acute Renal Failure',
                    helpText: 'Double creatinine points if ARF is present',
                    options: [
                        { value: '1', label: 'Yes (Double Points)' },
                        { value: '0', label: 'No', checked: true }
                    ]
                }
            ]
        },
        {
            title: 'Neurological Assessment',
            fields: [
                {
                    id: 'apache-ii-gcs',
                    label: 'Glasgow Coma Scale',
                    unit: 'points',
                    placeholder: '3 - 15',
                    validationType: 'gcs'
                }
            ]
        },
        {
            title: 'Oxygenation',
            fields: [
                {
                    name: 'oxy_method',
                    label: 'Measurement Method',
                    options: [
                        {
                            value: 'fio2_pao2',
                            label: 'FiO₂ ≥ 0.5 (uses A-a gradient)',
                            checked: true
                        },
                        { value: 'pao2_only', label: 'FiO₂ < 0.5 (uses PaO₂ only)' }
                    ]
                },
                {
                    id: 'apache-ii-fio2',
                    label: 'FiO₂',
                    step: 0.01,
                    placeholder: 'e.g. 0.5',
                    validationType: 'fiO2'
                },
                { id: 'apache-ii-pao2', label: 'PaO₂', unit: 'mmHg', validationType: 'paO2' },
                { id: 'apache-ii-paco2', label: 'PaCO₂', unit: 'mmHg', validationType: 'paCO2' }
            ]
        }
    ],

    resultTitle: 'APACHE II Score',

    // 使用導入的計算函數
    complexCalculate: apacheIiCalculation,

    fhirAutoPopulate: [
        {
            fieldId: 'apache-ii-temp',
            loincCode: LOINC_CODES.TEMPERATURE,
            formatter: v => v.toFixed(1)
        },
        {
            fieldId: 'apache-ii-hr',
            loincCode: LOINC_CODES.HEART_RATE,
            formatter: v => v.toFixed(0)
        },
        {
            fieldId: 'apache-ii-rr',
            loincCode: LOINC_CODES.RESPIRATORY_RATE,
            formatter: v => v.toFixed(0)
        },
        { fieldId: 'apache-ii-ph', loincCode: LOINC_CODES.PH, formatter: v => v.toFixed(2) },
        {
            fieldId: 'apache-ii-sodium',
            loincCode: LOINC_CODES.SODIUM,
            targetUnit: 'mmol/L',
            formatter: v => v.toFixed(0)
        },
        {
            fieldId: 'apache-ii-potassium',
            loincCode: LOINC_CODES.POTASSIUM,
            targetUnit: 'mmol/L',
            formatter: v => v.toFixed(1)
        },
        {
            fieldId: 'apache-ii-creatinine',
            loincCode: LOINC_CODES.CREATININE,
            targetUnit: 'mg/dL',
            unitType: 'creatinine',
            formatter: v => v.toFixed(2)
        },
        {
            fieldId: 'apache-ii-hct',
            loincCode: LOINC_CODES.HEMATOCRIT,
            formatter: v => v.toFixed(1)
        },
        { fieldId: 'apache-ii-wbc', loincCode: LOINC_CODES.WBC, formatter: v => v.toFixed(1) },
        { fieldId: 'apache-ii-gcs', loincCode: LOINC_CODES.GCS, formatter: v => v.toFixed(0) }
    ],

    reference: `
        ${uiBuilder.createSection({
        title: 'Approximated In-Hospital Mortality Rates',
        icon: '📊',
        content: uiBuilder.createTable({
            headers: ['APACHE II Score', 'Nonoperative', 'Postoperative'],
            rows: [
                ['0-4', '4%', '1%'],
                ['5-9', '8%', '3%'],
                ['10-14', '15%', '7%'],
                ['15-19', '25%', '12%'],
                ['20-24', '40%', '30%'],
                ['25-29', '55%', '35%'],
                ['30-34', '73%', '73%'],
                ['>34', '85%', '88%']
            ]
        })
    })}

        ${uiBuilder.createSection({
        title: 'Reference',
        icon: '📚',
        content:
            '<p>Knaus, W. A., Draper, E. A., Wagner, D. P., & Zimmerman, J. E. (1985). APACHE II: a severity of disease classification system. <em>Critical care medicine</em>, 13(10), 818-829.</p>'
    })}
    `
});
