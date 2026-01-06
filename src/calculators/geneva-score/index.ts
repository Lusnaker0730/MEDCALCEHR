import {
    createMixedInputCalculator,
    MixedInputCalculatorConfig
} from '../shared/mixed-input-calculator.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { fhirDataService } from '../../fhir-data-service.js';

const config: MixedInputCalculatorConfig = {
    id: 'geneva-score',
    title: 'Revised Geneva Score (Simplified)',
    description: 'Estimates the pre-test probability of pulmonary embolism (PE).',
    infoAlert:
        '<strong>Note:</strong> This is the Simplified (Modified) Revised Geneva Score. Each criterion is worth 1 point (except heart rate scoring).',
    sections: [
        {
            title: 'Clinical Assessment',
            icon: '📋',
            inputs: [
                {
                    type: 'radio',
                    name: 'geneva-age',
                    label: 'Age > 65 years (+1)',
                    options: [
                        { value: '0', label: 'No' },
                        { value: '1', label: 'Yes' }
                    ]
                },
                {
                    type: 'radio',
                    name: 'geneva-prev-dvt',
                    label: 'Previous DVT or PE (+1)',
                    options: [
                        { value: '0', label: 'No' },
                        { value: '1', label: 'Yes' }
                    ]
                },
                {
                    type: 'radio',
                    name: 'geneva-surgery',
                    label: 'Surgery or fracture within 1 month (+1)',
                    options: [
                        { value: '0', label: 'No' },
                        { value: '1', label: 'Yes' }
                    ]
                },
                {
                    type: 'radio',
                    name: 'geneva-malignancy',
                    label: 'Active malignancy (+1)',
                    options: [
                        { value: '0', label: 'No' },
                        { value: '1', label: 'Yes' }
                    ]
                }
            ]
        },
        {
            title: 'Clinical Signs',
            icon: '⚕️',
            inputs: [
                {
                    type: 'radio',
                    name: 'geneva-limb-pain',
                    label: 'Unilateral lower limb pain (+1)',
                    options: [
                        { value: '0', label: 'No' },
                        { value: '1', label: 'Yes' }
                    ]
                },
                {
                    type: 'radio',
                    name: 'geneva-hemoptysis',
                    label: 'Hemoptysis (+1)',
                    options: [
                        { value: '0', label: 'No' },
                        { value: '1', label: 'Yes' }
                    ]
                },
                {
                    type: 'radio',
                    name: 'geneva-palpation',
                    label: 'Pain on deep vein palpation AND unilateral edema (+1)',
                    options: [
                        { value: '0', label: 'No' },
                        { value: '1', label: 'Yes' }
                    ]
                }
            ]
        },
        {
            title: 'Vital Signs',
            icon: '🩺',
            inputs: [
                {
                    type: 'number',
                    id: 'geneva-hr',
                    label: 'Heart Rate',
                    unit: 'bpm',
                    placeholder: 'Enter heart rate',
                    helpText: '75-94 bpm (+1), ≥ 95 bpm (+2)',
                    loincCode: LOINC_CODES.HEART_RATE
                }
            ]
        }
    ],
    riskLevels: [
        {
            minScore: 0,
            maxScore: 1,
            label: 'Low Risk',
            severity: 'success',
            description:
                'PE is unlikely. Consider D-dimer testing. If negative, PE can be excluded.'
        },
        {
            minScore: 2,
            maxScore: 4,
            label: 'Intermediate Risk',
            severity: 'warning',
            description: 'Consider imaging (CT pulmonary angiography) or age-adjusted D-dimer.'
        },
        {
            minScore: 5,
            maxScore: 100,
            label: 'High Risk',
            severity: 'danger',
            description: 'PE is likely. Proceed directly to CT pulmonary angiography.'
        }
    ],
    formulaSection: {
        show: true,
        title: 'FORMULA',
        calculationNote: 'Addition of the selected points:',
        scoringCriteria: [
            { criteria: 'Age > 65 years', points: '+1' },
            { criteria: 'Previous DVT or PE', points: '+1' },
            { criteria: 'Surgery or fracture within 1 month', points: '+1' },
            { criteria: 'Active malignancy', points: '+1' },
            { criteria: 'Unilateral lower limb pain', points: '+1' },
            { criteria: 'Hemoptysis', points: '+1' },
            { criteria: 'Pain on deep vein palpation AND unilateral edema', points: '+1' },
            { criteria: 'Heart Rate 75-94 bpm', points: '+1' },
            { criteria: 'Heart Rate ≥ 95 bpm', points: '+2' }
        ],
        interpretations: [
            {
                score: '0-1',
                category: 'Low Risk',
                interpretation: 'PE unlikely (8%)',
                severity: 'success'
            },
            {
                score: '2-4',
                category: 'Intermediate Risk',
                interpretation: 'PE possible (28%)',
                severity: 'warning'
            },
            {
                score: '≥5',
                category: 'High Risk',
                interpretation: 'PE likely (74%)',
                severity: 'danger'
            }
        ]
    },
    calculate: values => {
        let score = 0;

        // Radios
        const radioKeys = [
            'geneva-age',
            'geneva-prev-dvt',
            'geneva-surgery',
            'geneva-malignancy',
            'geneva-limb-pain',
            'geneva-hemoptysis',
            'geneva-palpation'
        ];

        radioKeys.forEach(key => {
            if (values[key] === '1') {
                score += 1;
            }
        });

        // Heart Rate
        const hr = values['geneva-hr'] as number | null;
        if (hr !== null) {
            if (hr >= 75 && hr <= 94) {
                score += 1;
            } else if (hr >= 95) {
                score += 2;
            }
        }

        return score;
    },
    customResultRenderer: (score, values) => {
        let riskLevel: string, alertClass: string, prevalence: string, recommendation: string;

        if (score <= 1) {
            riskLevel = 'Low Risk';
            alertClass = 'ui-alert-success';
            prevalence = '8%';
            recommendation =
                'PE is unlikely. Consider D-dimer testing. If negative, PE can be excluded.';
        } else if (score <= 4) {
            riskLevel = 'Intermediate Risk';
            alertClass = 'ui-alert-warning';
            prevalence = '28%';
            recommendation = 'Consider imaging (CT pulmonary angiography) or age-adjusted D-dimer.';
        } else {
            riskLevel = 'High Risk';
            alertClass = 'ui-alert-danger';
            prevalence = '74%';
            recommendation = 'PE is likely. Proceed directly to CT pulmonary angiography.';
        }

        return `
            ${uiBuilder.createResultItem({
            label: 'Total Score',
            value: score.toString(),
            unit: 'points',
            interpretation: riskLevel,
            alertClass: alertClass
        })}
            ${uiBuilder.createResultItem({
            label: 'PE Prevalence',
            value: prevalence,
            unit: '',
            alertClass: alertClass
        })}
            
            ${uiBuilder.createAlert({
            type: alertClass.replace('ui-alert-', '') as 'success' | 'warning' | 'danger',
            message: `<strong>Recommendation:</strong> ${recommendation}`
        })}
        `;
    },
    customInitialize: async (client, patient, container, calculate, setValue) => {
        // Auto-populate Age Logic
        const age = fhirDataService.getPatientAge();
        if (age !== null) {
            if (age > 65) {
                setValue('geneva-age', '1');
            } else {
                setValue('geneva-age', '0');
            }
        }

        // Heart Rate is handled by auto-generated LOINC requirements in MixedInputCalculator
        // But we need to handle specific conditions (DVT/PE history, malignancy)

        if (fhirDataService.isReady()) {
            // Check for previous DVT/PE
            fhirDataService
                .hasCondition(['128053003', '59282003'])
                .then(hasDVTPE => {
                    if (hasDVTPE) {
                        setValue('geneva-prev-dvt', '1');
                    }
                })
                .catch(e => console.warn('Error checking DVT/PE history:', e));

            // Check for malignancy
            fhirDataService
                .hasCondition(['363346000', '86049000'])
                .then(hasMalignancy => {
                    if (hasMalignancy) {
                        setValue('geneva-malignancy', '1');
                    }
                })
                .catch(e => console.warn('Error checking malignancy:', e));
        }
    }
};

export const genevaScore = createMixedInputCalculator(config);
