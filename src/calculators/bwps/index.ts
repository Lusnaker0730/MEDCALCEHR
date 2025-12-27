/**
 * Burch-Wartofsky Point Scale (BWPS) for Thyrotoxicosis
 *
 * 使用 Mixed Input Calculator 工廠函數
 * 預測生化甲狀腺毒症是否為甲狀腺風暴
 */

import { createMixedInputCalculator } from '../shared/mixed-input-calculator.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { fhirDataService } from '../../fhir-data-service.js';

export const bwps = createMixedInputCalculator({
    id: 'bwps',
    title: 'Burch-Wartofsky Point Scale (BWPS) for Thyrotoxicosis',
    description: 'Predicts likelihood that biochemical thyrotoxicosis is thyroid storm.',

    infoAlert: '<strong>INSTRUCTIONS:</strong> Use in patients >18 years old with biochemical thyrotoxicosis.',

    sections: [
        {
            title: 'Clinical Parameters',
            inputs: [
                {
                    type: 'select',
                    id: 'bwps-temp',
                    label: 'Temperature',
                    options: [
                        { value: '0', label: '<99°F (<37.2°C)' },
                        { value: '5', label: '99-99.9°F (37.2-37.7°C)' },
                        { value: '10', label: '100-100.9°F (37.8-38.2°C)' },
                        { value: '15', label: '101-101.9°F (38.3-38.8°C)' },
                        { value: '20', label: '102-102.9°F (38.9-39.2°C)' },
                        { value: '25', label: '103-103.9°F (39.3-39.9°C)' },
                        { value: '30', label: '≥104.0°F (≥40.0°C)' }
                    ]
                },
                {
                    type: 'select',
                    id: 'bwps-cns',
                    label: 'Central nervous system effects',
                    options: [
                        { value: '0', label: 'Absent' },
                        { value: '10', label: 'Mild (agitation)' },
                        { value: '20', label: 'Moderate (delirium, psychosis, extreme lethargy)' },
                        { value: '30', label: 'Severe (seizures, coma)' }
                    ]
                },
                {
                    type: 'select',
                    id: 'bwps-gi',
                    label: 'Gastrointestinal-hepatic dysfunction',
                    options: [
                        { value: '0', label: 'Absent' },
                        { value: '10', label: 'Moderate (diarrhea, nausea/vomiting, abdominal pain)' },
                        { value: '20', label: 'Severe (unexplained jaundice)' }
                    ]
                },
                {
                    type: 'select',
                    id: 'bwps-hr',
                    label: 'Heart Rate (beats/minute)',
                    options: [
                        { value: '0', label: '<90' },
                        { value: '5', label: '90-109' },
                        { value: '10', label: '110-119' },
                        { value: '15', label: '120-129' },
                        { value: '20', label: '130-139' },
                        { value: '25', label: '≥140' }
                    ]
                },
                {
                    type: 'select',
                    id: 'bwps-chf',
                    label: 'Congestive Heart Failure',
                    options: [
                        { value: '0', label: 'Absent' },
                        { value: '5', label: 'Mild (pedal edema)' },
                        { value: '10', label: 'Moderate (bibasilar rales)' },
                        { value: '15', label: 'Severe (pulmonary edema)' }
                    ]
                },
                {
                    type: 'select',
                    id: 'bwps-afib',
                    label: 'Atrial fibrillation present',
                    options: [
                        { value: '0', label: 'No' },
                        { value: '10', label: 'Yes' }
                    ]
                },
                {
                    type: 'select',
                    id: 'bwps-precip',
                    label: 'Precipitating event',
                    options: [
                        { value: '0', label: 'No' },
                        { value: '10', label: 'Yes' }
                    ]
                }
            ]
        }
    ],

    riskLevels: [
        { minScore: 0, maxScore: 24, label: 'Unlikely', severity: 'success', description: 'Unlikely to represent thyroid storm' },
        { minScore: 25, maxScore: 44, label: 'Impending Storm', severity: 'warning', description: 'Suggests impending storm' },
        { minScore: 45, maxScore: 999, label: 'Thyroid Storm', severity: 'danger', description: 'Highly suggestive of thyroid storm' }
    ],

    formulaSection: {
        show: true,
        title: 'Scoring',
        calculationNote: 'Sum of all selected point values:',
        interpretationTitle: 'Interpretation',
        tableHeaders: ['Score', 'Diagnosis'],
        interpretations: [
            { score: '<25', interpretation: 'Unlikely to represent thyroid storm', severity: 'success' },
            { score: '25-44', interpretation: 'Suggests impending storm', severity: 'warning' },
            { score: '≥45', interpretation: 'Highly suggestive of thyroid storm', severity: 'danger' }
        ]
    },

    references: [
        'Burch, H. B., & Wartofsky, L. (1993). Life-threatening thyrotoxicosis. Thyroid storm. <em>Endocrinology and metabolism clinics of North America</em>, 22(2), 263-277.'
    ],

    calculate: (values) => {
        let score = 0;
        const fields = ['bwps-temp', 'bwps-cns', 'bwps-gi', 'bwps-hr', 'bwps-chf', 'bwps-afib', 'bwps-precip'];
        
        for (const field of fields) {
            const val = values[field];
            if (val !== null && val !== undefined && val !== '') {
                score += parseInt(val as string, 10);
            }
        }

        return score;
    },

    customResultRenderer: (score: number) => {
        let interpretation = '';
        let alertType: 'success' | 'warning' | 'danger' = 'success';

        if (score >= 45) {
            interpretation = 'Highly suggestive of thyroid storm';
            alertType = 'danger';
        } else if (score >= 25) {
            interpretation = 'Suggests impending storm';
            alertType = 'warning';
        } else {
            interpretation = 'Unlikely to represent thyroid storm';
            alertType = 'success';
        }

        return `
            ${uiBuilder.createResultItem({
                label: 'Total Score',
                value: score.toString(),
                unit: 'points',
                interpretation: interpretation,
                alertClass: `ui-alert-${alertType}`
            })}
        `;
    },

    customInitialize: async (client, patient, container, calculate, setValue) => {
        if (!client) return;

        fhirDataService.initialize(client, patient, container);

        try {
            // Temperature (convert to Fahrenheit)
            const tempResult = await fhirDataService.getObservation(LOINC_CODES.TEMPERATURE, {
                trackStaleness: true,
                stalenessLabel: 'Temperature',
                targetUnit: 'degF',
                unitType: 'temperature'
            });

            if (tempResult.value !== null) {
                const tempF = tempResult.value;
                let tempValue = '0';
                if (tempF >= 104) tempValue = '30';
                else if (tempF >= 103) tempValue = '25';
                else if (tempF >= 102) tempValue = '20';
                else if (tempF >= 101) tempValue = '15';
                else if (tempF >= 100) tempValue = '10';
                else if (tempF >= 99) tempValue = '5';

                setValue('bwps-temp', tempValue);
            }

            // Heart Rate
            const hrResult = await fhirDataService.getObservation(LOINC_CODES.HEART_RATE, {
                trackStaleness: true,
                stalenessLabel: 'Heart Rate'
            });

            if (hrResult.value !== null) {
                const hr = hrResult.value;
                let hrValue = '0';
                if (hr >= 140) hrValue = '25';
                else if (hr >= 130) hrValue = '20';
                else if (hr >= 120) hrValue = '15';
                else if (hr >= 110) hrValue = '10';
                else if (hr >= 90) hrValue = '5';

                setValue('bwps-hr', hrValue);
            }

            calculate();
        } catch (e) {
            console.warn('FHIR data fetch failed:', e);
        }
    }
});
