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
                    loincCode: LOINC_CODES.TEMPERATURE,
                    validationType: 'temperature',
                    unitToggle: { type: 'temperature', units: ['C', 'F'], default: 'C' }
                },
                {
                    id: 'apache-ii-sbp',
                    label: 'SBP (Optional)',
                    placeholder: 'Systolic',
                    unit: 'mmHg',
                    required: false,
                    validationType: 'systolicBP',
                    loincCode: LOINC_CODES.SYSTOLIC_BP
                },
                {
                    id: 'apache-ii-dbp',
                    label: 'DBP (Optional)',
                    placeholder: 'Diastolic',
                    unit: 'mmHg',
                    required: false,
                    validationType: 'diastolicBP',
                    loincCode: LOINC_CODES.DIASTOLIC_BP
                },
                {
                    id: 'apache-ii-map',
                    label: 'Mean Arterial Pressure',
                    unit: 'mmHg',
                    placeholder: '70 - 100',
                    validationType: 'map',
                    helpText: 'Auto-calculated if SBP and DBP are provided'
                },
                {
                    id: 'apache-ii-hr',
                    label: 'Heart Rate',
                    unit: 'bpm',
                    placeholder: '60 - 100',
                    validationType: 'heartRate',
                    loincCode: LOINC_CODES.HEART_RATE
                },
                {
                    id: 'apache-ii-rr',
                    label: 'Respiratory Rate',
                    unit: 'breaths/min',
                    placeholder: '12 - 20',
                    validationType: 'respiratoryRate',
                    loincCode: LOINC_CODES.RESPIRATORY_RATE
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
                    validationType: 'pH',
                    loincCode: LOINC_CODES.PH
                },
                {
                    id: 'apache-ii-sodium',
                    label: 'Sodium',
                    placeholder: '136 - 145',
                    loincCode: LOINC_CODES.SODIUM,
                    unitToggle: { type: 'sodium', units: ['mmol/L', 'mEq/L'], default: 'mmol/L' }
                },
                {
                    id: 'apache-ii-potassium',
                    label: 'Potassium',
                    step: 0.1,
                    placeholder: '3.5 - 5.2',
                    loincCode: LOINC_CODES.POTASSIUM,
                    unitToggle: { type: 'potassium', units: ['mmol/L', 'mEq/L'], default: 'mmol/L' }
                },
                {
                    id: 'apache-ii-creatinine',
                    label: 'Creatinine',
                    step: 0.1,
                    placeholder: '0.7 - 1.3',
                    loincCode: LOINC_CODES.CREATININE,
                    unitToggle: { type: 'creatinine', units: ['mg/dL', 'µmol/L'], default: 'mg/dL' }
                },
                {
                    id: 'apache-ii-hct',
                    label: 'Hematocrit',
                    unit: '%',
                    step: 0.1,
                    placeholder: '36 - 51',
                    validationType: 'hematocrit',
                    loincCode: LOINC_CODES.HEMATOCRIT
                },
                {
                    id: 'apache-ii-wbc',
                    label: 'WBC Count',
                    unit: 'x 10⁹/L',
                    step: 0.1,
                    placeholder: '3.7 - 10.7',
                    validationType: 'wbc',
                    loincCode: LOINC_CODES.WBC
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
                    validationType: 'gcs',
                    loincCode: LOINC_CODES.GCS
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
                    validationType: 'fiO2',
                    loincCode: LOINC_CODES.FIO2
                },
                {
                    id: 'apache-ii-pao2',
                    label: 'PaO₂',
                    unit: 'mmHg',
                    validationType: 'paO2',
                    loincCode: LOINC_CODES.PO2
                },
                {
                    id: 'apache-ii-paco2',
                    label: 'PaCO₂',
                    unit: 'mmHg',
                    validationType: 'paCO2',
                    loincCode: LOINC_CODES.PCO2
                }
            ]
        }
    ],

    resultTitle: 'APACHE II Score',

    // 使用導入的計算函數
    complexCalculate: apacheIiCalculation,

    customInitialize: (client, patient, container) => {
        // 1. MAP Calculation Logic
        const sbpInput = container.querySelector('#apache-ii-sbp') as HTMLInputElement;
        const dbpInput = container.querySelector('#apache-ii-dbp') as HTMLInputElement;
        const mapInput = container.querySelector('#apache-ii-map') as HTMLInputElement;

        const updateMap = () => {
            if (sbpInput && dbpInput && mapInput) {
                const sbp = parseFloat(sbpInput.value);
                const dbp = parseFloat(dbpInput.value);

                if (!isNaN(sbp) && !isNaN(dbp)) {
                    const map = (sbp + 2 * dbp) / 3;
                    mapInput.value = map.toFixed(0);
                    // Dispatch input event to trigger calculation
                    mapInput.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }
        };

        if (sbpInput) sbpInput.addEventListener('input', updateMap);
        if (dbpInput) dbpInput.addEventListener('input', updateMap);

        // 2. PaCO2 Visibility Logic
        const paco2Input = container.querySelector('#apache-ii-paco2') as HTMLInputElement;
        // Find the group (container for label + input wrapper) to hide everything
        const paco2Group = paco2Input?.closest('.ui-input-group') as HTMLElement;

        const updatePaco2Visibility = () => {
            const method = container.querySelector('input[name="oxy_method"]:checked') as HTMLInputElement;
            if (method && paco2Group) {
                if (method.value === 'pao2_only') {
                    paco2Group.style.display = 'none';
                    // Reset value when hidden to avoid affecting calculation if logic didn't handle null
                    paco2Input.value = '';
                } else {
                    paco2Group.style.display = '';
                }
            }
        };

        // Attach to radio buttons
        const methodRadios = container.querySelectorAll('input[name="oxy_method"]');
        methodRadios.forEach(radio => {
            radio.addEventListener('change', updatePaco2Visibility);
        });

        // Initial check
        updatePaco2Visibility();
    },



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
