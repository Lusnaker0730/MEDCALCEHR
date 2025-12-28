/**
 * APACHE II Calculator
 *
 * 使用 Complex Formula Calculator 工廠函數
 * 計算 ICU 死亡風險
 */

import { createComplexFormulaCalculator } from '../shared/complex-formula-calculator.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';

// ==========================================
// APACHE II 評分函數
// ==========================================

const getPoints = {
    temp: (v: number) => {
        if (v >= 41 || v <= 29.9) return 4;
        if (v >= 39 || v <= 31.9) return 3;
        if (v <= 33.9) return 2;
        if (v >= 38.5 || v <= 35.9) return 1;
        return 0;
    },
    map: (v: number) => {
        if (v >= 160 || v <= 49) return 4;
        if (v >= 130) return 3;
        if (v >= 110 || v <= 69) return 2;
        return 0;
    },
    ph: (v: number) => {
        if (v >= 7.7 || v < 7.15) return 4;
        if (v >= 7.6 || v < 7.25) return 3;
        if (v < 7.33) return 2;
        if (v >= 7.5) return 1;
        return 0;
    },
    hr: (v: number) => {
        if (v >= 180 || v <= 39) return 4;
        if (v >= 140 || v <= 54) return 3;
        if (v >= 110 || v <= 69) return 2;
        return 0;
    },
    rr: (v: number) => {
        if (v >= 50 || v <= 5) return 4;
        if (v >= 35) return 3;
        if (v <= 9) return 2;
        if (v >= 25 || v <= 11) return 1;
        return 0;
    },
    sodium: (v: number) => {
        if (v >= 180 || v <= 110) return 4;
        if (v >= 160 || v <= 119) return 3;
        if (v >= 155 || v <= 129) return 2;
        if (v >= 150) return 1;
        return 0;
    },
    potassium: (v: number) => {
        if (v >= 7 || v < 2.5) return 4;
        if (v >= 6) return 3;
        if (v <= 2.9) return 2;
        if (v >= 5.5 || v <= 3.4) return 1;
        return 0;
    },
    creatinine: (v: number, arf: boolean) => {
        let score = 0;
        if (v >= 3.5) score = 4;
        else if (v >= 2.0) score = 3;
        else if (v >= 1.5 || v < 0.6) score = 2;
        return arf ? score * 2 : score;
    },
    hct: (v: number) => {
        if (v >= 60 || v < 20) return 4;
        if (v >= 50 || v < 30) return 2;
        return 0;
    },
    wbc: (v: number) => {
        if (v >= 40 || v < 1) return 4;
        if (v >= 20 || v < 3) return 2;
        if (v >= 15) return 1;
        return 0;
    },
    gcs: (v: number) => 15 - v,
    oxygenation: (fio2: number, pao2: number | null, paco2: number | null) => {
        if (fio2 >= 0.5 && paco2 !== null && pao2 !== null) {
            const A_a_gradient = fio2 * 713 - paco2 / 0.8 - pao2;
            if (A_a_gradient >= 500) return 4;
            if (A_a_gradient >= 350) return 3;
            if (A_a_gradient >= 200) return 2;
            return 0;
        } else if (pao2 !== null) {
            if (pao2 < 55) return 4;
            if (pao2 <= 60) return 3;
            if (pao2 <= 70) return 1;
            return 0;
        }
        return 0;
    },
    age: (v: number) => {
        if (v >= 75) return 6;
        if (v >= 65) return 5;
        if (v >= 55) return 3;
        if (v >= 45) return 2;
        return 0;
    }
};

export const apacheIi = createComplexFormulaCalculator({
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
                { id: 'apache-ii-age', label: 'Age', unit: 'years' },
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
                    placeholder: '70 - 100'
                },
                { id: 'apache-ii-hr', label: 'Heart Rate', unit: 'bpm', placeholder: '60 - 100' },
                {
                    id: 'apache-ii-rr',
                    label: 'Respiratory Rate',
                    unit: 'breaths/min',
                    placeholder: '12 - 20'
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
                    placeholder: '7.38 - 7.44'
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
                    placeholder: '36 - 51'
                },
                {
                    id: 'apache-ii-wbc',
                    label: 'WBC Count',
                    unit: 'x 10⁹/L',
                    step: 0.1,
                    placeholder: '3.7 - 10.7'
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
                    min: 3,
                    max: 15
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
                    min: 0,
                    max: 1
                },
                { id: 'apache-ii-pao2', label: 'PaO₂', unit: 'mmHg' },
                { id: 'apache-ii-paco2', label: 'PaCO₂', unit: 'mmHg' }
            ]
        }
    ],

    resultTitle: 'APACHE II Score',

    calculate: (getValue, getStdValue, getRadioValue) => {
        const temp = getStdValue('apache-ii-temp', 'C');
        const map = getValue('apache-ii-map');
        const hr = getValue('apache-ii-hr');
        const rr = getValue('apache-ii-rr');
        const ph = getValue('apache-ii-ph');
        const sodium = getStdValue('apache-ii-sodium', 'mmol/L');
        const potassium = getStdValue('apache-ii-potassium', 'mmol/L');
        const creatinine = getStdValue('apache-ii-creatinine', 'mg/dL');
        const hct = getValue('apache-ii-hct');
        const wbc = getValue('apache-ii-wbc');
        const gcs = getValue('apache-ii-gcs');
        const age = getValue('apache-ii-age');
        const fio2 = getValue('apache-ii-fio2');
        const pao2 = getValue('apache-ii-pao2');
        const paco2 = getValue('apache-ii-paco2');

        const arf = getRadioValue('arf') === '1';
        const chronicVal = parseInt(getRadioValue('chronic') || '0');
        const oxyMethod = getRadioValue('oxy_method');

        // Check if all required fields are present
        const requiredFields = [
            temp,
            map,
            hr,
            rr,
            ph,
            sodium,
            potassium,
            creatinine,
            hct,
            wbc,
            gcs,
            age
        ];
        if (requiredFields.some(v => v === null)) return null;

        // Calculate APS
        let aps = 0;
        aps += getPoints.temp(temp!);
        aps += getPoints.map(map!);
        aps += getPoints.ph(ph!);
        aps += getPoints.hr(hr!);
        aps += getPoints.rr(rr!);
        aps += getPoints.sodium(sodium!);
        aps += getPoints.potassium(potassium!);
        aps += getPoints.creatinine(creatinine!, arf);
        aps += getPoints.hct(hct!);
        aps += getPoints.wbc(wbc!);
        aps += getPoints.gcs(gcs!);

        if (oxyMethod === 'fio2_pao2' && fio2 !== null && pao2 !== null && paco2 !== null) {
            aps += getPoints.oxygenation(fio2, pao2, paco2);
        } else if (pao2 !== null) {
            aps += getPoints.oxygenation(0.21, pao2, null);
        }

        const agePoints = getPoints.age(age!);
        const chronicPoints = chronicVal;

        const score = aps + agePoints + chronicPoints;
        const mortality =
            (Math.exp(-3.517 + 0.146 * score) / (1 + Math.exp(-3.517 + 0.146 * score))) * 100;

        let severity: 'success' | 'warning' | 'danger' = 'success';
        let riskLevel = 'Low Risk';

        if (mortality < 10) {
            severity = 'success';
            riskLevel = 'Low Risk';
        } else if (mortality < 25) {
            severity = 'warning';
            riskLevel = 'Moderate Risk';
        } else if (mortality < 50) {
            severity = 'danger';
            riskLevel = 'High Risk';
        } else {
            severity = 'danger';
            riskLevel = 'Very High Risk';
        }

        return {
            score,
            interpretation: riskLevel,
            severity,
            additionalResults: [
                { label: 'Predicted ICU Mortality', value: mortality.toFixed(1), unit: '%' }
            ],
            breakdown: `<strong>Breakdown:</strong> APS ${aps} + Age ${agePoints} + Chronic Health ${chronicPoints}`
        };
    },

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
