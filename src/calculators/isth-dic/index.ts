/**
 * ISTH Criteria for Disseminated Intravascular Coagulation (DIC)
 *
 * 使用 Mixed Input Calculator 工廠函數
 * 診斷明顯的瀰散性血管內凝血
 */

import { createMixedInputCalculator } from '../shared/mixed-input-calculator.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { fhirDataService } from '../../fhir-data-service.js';

export const isthDic = createMixedInputCalculator({
    id: 'isth-dic',
    title: 'ISTH Criteria for Disseminated Intravascular Coagulation (DIC)',
    description: 'Diagnoses overt disseminated intravascular coagulation (DIC).',

    infoAlert:
        '<strong>Use only in patients with clinical suspicion for DIC</strong> (e.g. excessive bleeding, malignancy, sepsis, trauma).',

    sections: [
        {
            title: 'Laboratory Criteria',
            inputs: [
                {
                    type: 'number',
                    id: 'isth-platelet-input',
                    label: 'Platelet count',
                    unit: '×10⁹/L',
                    placeholder: 'Enter value',
                    unitToggle: {
                        type: 'platelet',
                        units: ['×10⁹/L', 'K/µL'],
                        default: '×10⁹/L'
                    }
                },
                {
                    type: 'radio',
                    name: 'isth-platelet',
                    label: 'Platelet Score',
                    options: [
                        { value: '0', label: '≥100 (0)', checked: true },
                        { value: '1', label: '50 to <100 (+1)' },
                        { value: '2', label: '<50 (+2)' }
                    ]
                },
                {
                    type: 'number',
                    id: 'isth-ddimer-input',
                    label: 'D-dimer level',
                    unit: 'mg/L',
                    placeholder: 'Enter value',
                    unitToggle: {
                        type: 'ddimer',
                        units: ['mg/L', 'µg/mL', 'ng/mL'],
                        default: 'mg/L'
                    }
                },
                {
                    type: 'radio',
                    name: 'isth-fibrin_marker',
                    label: 'D-dimer Score (Fibrin-related marker)',
                    options: [
                        { value: '0', label: 'No increase (<0.5 mg/L) (0)', checked: true },
                        { value: '2', label: 'Moderate increase (0.5-5 mg/L) (+2)' },
                        { value: '3', label: 'Severe increase (>5 mg/L) (+3)' }
                    ]
                },
                {
                    type: 'number',
                    id: 'isth-pt-input',
                    label: 'Prothrombin Time (PT)',
                    unit: 'seconds',
                    placeholder: 'Normal ~12s'
                },
                {
                    type: 'radio',
                    name: 'isth-pt',
                    label: 'PT Prolongation Score',
                    options: [
                        { value: '0', label: 'Prolongation <3s (0)', checked: true },
                        { value: '1', label: 'Prolongation 3 to <6s (+1)' },
                        { value: '2', label: 'Prolongation ≥6s (+2)' }
                    ]
                },
                {
                    type: 'number',
                    id: 'isth-fibrinogen-input',
                    label: 'Fibrinogen level',
                    unit: 'g/L',
                    placeholder: 'Enter value',
                    unitToggle: {
                        type: 'fibrinogen',
                        units: ['g/L', 'mg/dL'],
                        default: 'g/L'
                    }
                },
                {
                    type: 'radio',
                    name: 'isth-fibrinogen',
                    label: 'Fibrinogen Score',
                    options: [
                        { value: '0', label: '≥1.0 g/L (0)', checked: true },
                        { value: '1', label: '<1.0 g/L (+1)' }
                    ]
                }
            ]
        }
    ],

    riskLevels: [
        {
            minScore: 0,
            maxScore: 4,
            label: 'Not Overt DIC',
            severity: 'success',
            description: 'Not suggestive of overt DIC. May be non-overt DIC.'
        },
        {
            minScore: 5,
            maxScore: 999,
            label: 'Overt DIC',
            severity: 'danger',
            description: 'Compatible with overt DIC. Repeat score daily.'
        }
    ],

    formulaSection: {
        show: true,
        title: 'ISTH DIC Scoring',
        calculationNote: 'Sum of laboratory criteria points:',
        scoringCriteria: [
            { criteria: 'Platelet Count', isHeader: true },
            { criteria: '≥100 × 10⁹/L', points: '0' },
            { criteria: '50 to <100 × 10⁹/L', points: '+1' },
            { criteria: '<50 × 10⁹/L', points: '+2' },
            { criteria: 'D-dimer (Fibrin-related marker)', isHeader: true },
            { criteria: 'No increase (<0.5 mg/L)', points: '0' },
            { criteria: 'Moderate increase (0.5-5 mg/L)', points: '+2' },
            { criteria: 'Severe increase (>5 mg/L)', points: '+3' },
            { criteria: 'PT Prolongation', isHeader: true },
            { criteria: '<3 seconds', points: '0' },
            { criteria: '3 to <6 seconds', points: '+1' },
            { criteria: '≥6 seconds', points: '+2' },
            { criteria: 'Fibrinogen Level', isHeader: true },
            { criteria: '≥1.0 g/L', points: '0' },
            { criteria: '<1.0 g/L', points: '+1' }
        ],
        interpretationTitle: 'Interpretation',
        tableHeaders: ['Score', 'Diagnosis'],
        interpretations: [
            {
                score: '<5',
                interpretation:
                    'Not suggestive of overt DIC. May be non-overt. Repeat within 1-2 days.',
                severity: 'success'
            },
            {
                score: '≥5',
                interpretation: 'Compatible with overt DIC. Repeat score daily.',
                severity: 'danger'
            }
        ]
    },

    calculate: values => {
        const groups = ['isth-platelet', 'isth-fibrin_marker', 'isth-pt', 'isth-fibrinogen'];
        let score = 0;

        for (const group of groups) {
            const val = values[group];
            if (val !== null && val !== undefined && val !== '') {
                score += parseInt(val as string, 10);
            }
        }

        return score;
    },

    customResultRenderer: (score: number) => {
        let interpretation = '';
        let alertType: 'success' | 'danger' = 'success';

        if (score >= 5) {
            interpretation = 'Compatible with overt DIC. Repeat score daily.';
            alertType = 'danger';
        } else {
            interpretation =
                'Not suggestive of overt DIC. May be non-overt DIC. Repeat within 1-2 days.';
            alertType = 'success';
        }

        return `
            ${uiBuilder.createResultItem({
                label: 'Total Score',
                value: score.toString(),
                unit: 'points',
                interpretation: score >= 5 ? 'Overt DIC' : 'Not Overt DIC',
                alertClass: `ui-alert-${alertType}`
            })}
            ${uiBuilder.createAlert({
                type: alertType,
                message: interpretation
            })}
        `;
    },

    customInitialize: async (client, patient, container, calculate, setValue) => {
        // Helper to set radio based on input value
        const setRadioFromValue = (
            groupName: string,
            value: number | null,
            ranges: Array<{ condition: (v: number) => boolean; value: string }>
        ) => {
            if (value === null || isNaN(value)) return;
            const range = ranges.find(r => r.condition(value));
            if (range) {
                const radio = container.querySelector(
                    `input[name="${groupName}"][value="${range.value}"]`
                ) as HTMLInputElement;
                if (radio) {
                    radio.checked = true;
                    calculate();
                }
            }
        };

        // Wire up numeric inputs to auto-select radio buttons
        const plateletInput = container.querySelector('#isth-platelet-input') as HTMLInputElement;
        const ddimerInput = container.querySelector('#isth-ddimer-input') as HTMLInputElement;
        const ptInput = container.querySelector('#isth-pt-input') as HTMLInputElement;
        const fibrinogenInput = container.querySelector(
            '#isth-fibrinogen-input'
        ) as HTMLInputElement;

        if (plateletInput) {
            plateletInput.addEventListener('input', function () {
                const value = UnitConverter.getStandardValue(this, '×10⁹/L');
                setRadioFromValue('isth-platelet', value, [
                    { condition: v => v >= 100, value: '0' },
                    { condition: v => v >= 50 && v < 100, value: '1' },
                    { condition: v => v < 50, value: '2' }
                ]);
            });
        }

        if (ddimerInput) {
            ddimerInput.addEventListener('input', function () {
                const value = UnitConverter.getStandardValue(this, 'mg/L');
                setRadioFromValue('isth-fibrin_marker', value, [
                    { condition: v => v < 0.5, value: '0' },
                    { condition: v => v >= 0.5 && v <= 5, value: '2' },
                    { condition: v => v > 5, value: '3' }
                ]);
            });
        }

        if (ptInput) {
            ptInput.addEventListener('input', function () {
                const value = parseFloat(this.value);
                if (!isNaN(value)) {
                    const prolongation = value - 12; // Assuming normal PT is 12s
                    setRadioFromValue('isth-pt', prolongation, [
                        { condition: v => v < 3, value: '0' },
                        { condition: v => v >= 3 && v < 6, value: '1' },
                        { condition: v => v >= 6, value: '2' }
                    ]);
                }
            });
        }

        if (fibrinogenInput) {
            fibrinogenInput.addEventListener('input', function () {
                const value = UnitConverter.getStandardValue(this, 'g/L');
                setRadioFromValue('isth-fibrinogen', value, [
                    { condition: v => v >= 1, value: '0' },
                    { condition: v => v < 1, value: '1' }
                ]);
            });
        }

        if (!client) return;

        fhirDataService.initialize(client, patient, container);

        try {
            // Platelets (LOINC 26515-7)
            const plateletResult = await fhirDataService.getObservation('26515-7', {
                trackStaleness: true,
                stalenessLabel: 'Platelets'
            });
            if (plateletResult.value !== null && plateletInput) {
                plateletInput.value = plateletResult.value.toFixed(0);
                plateletInput.dispatchEvent(new Event('input'));
            }

            // D-dimer
            const ddimerResult = await fhirDataService.getObservation(LOINC_CODES.D_DIMER, {
                trackStaleness: true,
                stalenessLabel: 'D-dimer'
            });
            if (ddimerResult.value !== null && ddimerInput) {
                ddimerInput.value = ddimerResult.value.toFixed(2);
                ddimerInput.dispatchEvent(new Event('input'));
            }

            // PT
            const ptResult = await fhirDataService.getObservation(LOINC_CODES.PT, {
                trackStaleness: true,
                stalenessLabel: 'PT'
            });
            if (ptResult.value !== null && ptInput) {
                ptInput.value = ptResult.value.toFixed(1);
                ptInput.dispatchEvent(new Event('input'));
            }

            // Fibrinogen
            const fibResult = await fhirDataService.getObservation(LOINC_CODES.FIBRINOGEN, {
                trackStaleness: true,
                stalenessLabel: 'Fibrinogen'
            });
            if (fibResult.value !== null && fibrinogenInput) {
                fibrinogenInput.value = fibResult.value.toFixed(2);
                fibrinogenInput.dispatchEvent(new Event('input'));
            }

            calculate();
        } catch (e) {
            console.warn('FHIR data fetch failed:', e);
        }
    }
});
