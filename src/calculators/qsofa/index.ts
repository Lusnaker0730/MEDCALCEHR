import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { createUnifiedFormulaCalculator } from '../shared/unified-formula-calculator.js';
import { qsofaCalculation } from './calculation.js';

export const qsofaScore = createUnifiedFormulaCalculator({
    id: 'qsofa',
    title: 'qSOFA Score for Sepsis',
    description: 'Identifies patients with suspected infection at risk for poor outcomes (sepsis).',
    infoAlert: `
        <h4>qSOFA Criteria (Score 1 each):</h4>
        <ul class="info-list">
            <li><strong>Respiratory Rate:</strong> ≥ 22 /min</li>
            <li><strong>Systolic Blood Pressure:</strong> ≤ 100 mmHg</li>
            <li><strong>Altered Mental Status:</strong> GCS < 15</li>
        </ul>
    `,
    sections: [
        {
            title: 'Clinical Signs',
            icon: '🩺',
            fields: [
                {
                    type: 'number',
                    id: 'rr',
                    label: 'Respiratory Rate',
                    placeholder: '16',
                    unitToggle: {
                        type: 'none',
                        units: [],
                        default: '/min'
                    },
                    validationType: 'respiratoryRate',
                    loincCode: LOINC_CODES.RESPIRATORY_RATE,
                    required: true
                },
                {
                    type: 'number',
                    id: 'sbp',
                    label: 'Systolic BP',
                    placeholder: '120',
                    unitToggle: {
                        type: 'pressure',
                        units: ['mmHg'],
                        default: 'mmHg'
                    },
                    validationType: 'systolicBP',
                    standardUnit: 'mmHg',
                    required: true
                }
            ]
        },
        {
            title: 'Neurological Status',
            icon: '🧠',
            fields: [
                {
                    type: 'number',
                    id: 'gcs',
                    label: 'Glasgow Coma Scale (GCS)',
                    placeholder: '15',
                    validationType: 'gcs',
                    unitToggle: {
                        type: 'none',
                        units: [],
                        default: 'points'
                    },
                    loincCode: LOINC_CODES.GCS
                },
                {
                    type: 'radio',
                    id: 'ams',
                    label: 'Altered Mental Status?',
                    options: [
                        { value: 'no', label: 'No', checked: true },
                        { value: 'yes', label: 'Yes' }
                    ],
                    helpText: 'Select "Yes" if GCS < 15 or not formally assessed but clinically altered.'
                }
            ]
        }
    ],
    formulas: [
        {
            label: 'Scoring',
            formula: 'Sum of: RR ≥ 22 (+1), SBP ≤ 100 (+1), GCS < 15 (+1)'
        }
    ],
    calculate: qsofaCalculation,
    customResultRenderer: (results) => {
        const res = results[0];
        if (!res) return '';

        const payload = res.alertPayload as { metCriteria: string[], recommendation: string };
        const metCriteria = payload.metCriteria;
        const recommendation = payload.recommendation;
        const alertClass = res.alertClass || 'info';

        return `
            ${uiBuilder.createResultItem({
            label: res.label,
            value: res.value.toString(),
            unit: res.unit,
            interpretation: res.interpretation,
            alertClass: `ui-alert-${alertClass}`
        })}
            
            ${metCriteria.length > 0 ? `
            <div class="text-sm mt-5 mb-10 text-muted">
                <strong>Criteria Met:</strong>
                <ul class="list-disc pl-20">
                    ${metCriteria.map(c => `<li>${c}</li>`).join('')}
                </ul>
            </div>
            ` : ''}

            ${uiBuilder.createAlert({
            type: alertClass as 'success' | 'warning' | 'danger' | 'info',
            message: `<strong>🏥 Recommendation:</strong> ${recommendation}`
        })}
        `;
    }
});
