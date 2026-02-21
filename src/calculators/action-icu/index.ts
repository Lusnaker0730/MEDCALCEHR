import { createScoringCalculator, ScoringCalculatorConfig } from '../shared/scoring-calculator.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { fhirDataService } from '../../fhir-data-service.js';
import { logger } from '../../logger.js';

const riskMap = [
    3.4, 3.4, 4.9, 5.5, 6.9, 9.3, 12, 14.6, 17.4, 20.8, 23.3, 27.7, 31, 31.5, 39.3
];

export const actionIcuConfig: ScoringCalculatorConfig = {
    id: 'action-icu',
    title: 'ACTION ICU Score for Intensive Care in NSTEMI',
    description:
        'Risk of complications requiring ICU care among initially uncomplicated patients with NSTEMI.',
    infoAlert:
        '<strong>📋 NSTEMI Risk Assessment</strong><br>For initially hemodynamically stable adults with NSTEMI',
    sections: [
        {
            id: 'action-age',
            title: 'Age, years',
            options: [
                { value: '0', label: '<70 (0)', checked: true },
                { value: '1', label: '≥70 (+1)' }
            ]
        },
        {
            id: 'action-creatinine',
            title: 'Serum creatinine, mg/dL',
            options: [
                { value: '0', label: '<1.1 (0)', checked: true },
                { value: '1', label: '≥1.1 (+1)' }
            ]
        },
        {
            id: 'action-hr',
            title: 'Heart rate, bpm',
            options: [
                { value: '0', label: '<85 (0)', checked: true },
                { value: '1', label: '85-99 (+1)' },
                { value: '3', label: '≥100 (+3)' }
            ]
        },
        {
            id: 'action-sbp',
            title: 'Systolic blood pressure, mmHg',
            options: [
                { value: '0', label: '≥145 (0)', checked: true },
                { value: '1', label: '125-145 (+1)' },
                { value: '3', label: '<125 (+3)' }
            ]
        },
        {
            id: 'action-troponin',
            title: 'Ratio of initial troponin to upper limit of normal',
            options: [
                { value: '0', label: '<12 (0)', checked: true },
                { value: '2', label: '≥12 (+2)' }
            ]
        },
        {
            id: 'action-hf',
            title: 'Signs or symptoms of heart failure',
            options: [
                { value: '0', label: 'No (0)', checked: true },
                { value: '5', label: 'Yes (+5)' }
            ]
        },
        {
            id: 'action-st',
            title: 'ST segment depression on EKG',
            options: [
                { value: '0', label: 'No (0)', checked: true },
                { value: '1', label: 'Yes (+1)' }
            ]
        },
        {
            id: 'action-revasc',
            title: 'Prior revascularization',
            options: [
                { value: '0', label: 'Yes (0)' },
                { value: '1', label: 'No (+1)', checked: true }
            ]
        },
        {
            id: 'action-cld',
            title: 'Chronic lung disease',
            options: [
                { value: '0', label: 'No (0)', checked: true },
                { value: '2', label: 'Yes (+2)' }
            ]
        }
    ],
    riskLevels: [
        { minScore: 0, maxScore: 5, label: 'Low Risk', severity: 'success' },
        { minScore: 6, maxScore: 9, label: 'Moderate Risk', severity: 'warning' },
        { minScore: 10, maxScore: 17, label: 'High Risk', severity: 'danger' }
    ],
    references: [
        '📚 Reference: Fanaroff, A. C., et al. (2018). Risk Score to Predict Need for Intensive Care in Initially Hemodynamically Stable Adults With Non–ST‐Segment–Elevation Myocardial Infarction. Journal of the American Heart Association, 7(11).'
    ],
    interpretationInfo: `
        <div class="ui-section formula-section">
            <div class="ui-section-title">📐 Scoring Formula</div>
            ${uiBuilder.createTable({
        headers: ['Variable', '0 points', '1 point', '2 points', '3 points', '5 points'],
        rows: [
            ['Age, years', '<70', '≥70', '—', '—', '—'],
            ['Serum creatinine, mg/dL', '<1.1', '≥1.1', '—', '—', '—'],
            ['Heart rate, bpm', '<85', '85-99', '—', '≥100', '—'],
            ['Systolic BP, mmHg', '≥145', '125-145', '—', '<125', '—'],
            ['Troponin ratio (×ULN)', '<12', '—', '≥12', '—', '—'],
            ['Heart failure signs/symptoms', 'No', '—', '—', '—', 'Yes'],
            ['ST depression on EKG', 'No', 'Yes', '—', '—', '—'],
            ['Prior revascularization', 'Yes', 'No', '—', '—', '—'],
            ['Chronic lung disease', 'No', '—', 'Yes', '—', '—']
        ],
        className: 'text-center-cells' // Assuming we need to center cells, or rely on default styling. uiBuilder tables usually left align first col, others auto.
        // The original had specific text-center classes. uiBuilder might not support per-cell classes easily in standard mode without 'className' applied to table or 'createTable' enhancements.
        // But let's stick to standard uiBuilder table.
    })}
            
            <div class="ui-section-title mt-20">📊 Risk of Complications Requiring ICU Care</div>
            ${uiBuilder.createTable({
        headers: ['Score', 'Risk %', 'Score', 'Risk %', 'Score', 'Risk %'],
        rows: [
            ['≤1', '3.4%', '6', '12%', '11', '27.7%'],
            ['2', '4.9%', '7', '14.6%', '12', '31%'],
            ['3', '5.5%', '8', '17.4%', '13', '31.5%'],
            ['4', '6.9%', '9', '20.8%', '14', '39.3%'],
            ['5', '9.3%', '10', '23.3%', '>14', '>39.3%']
        ]
    })}
            
            <p class="footnote-item mt-15">
                *Cardiac arrest, shock, high-grade atrioventricular block, respiratory failure, stroke, or death during index admission.
            </p>
        </div>
    `,
    customResultRenderer: (score: number) => {
        const riskPercent = score < riskMap.length ? riskMap[score] : riskMap[riskMap.length - 1];

        let riskLevel = 'Low Risk';
        let alertType: 'success' | 'warning' | 'danger' = 'success';
        if (riskPercent >= 20) {
            riskLevel = 'High Risk';
            alertType = 'danger';
        } else if (riskPercent >= 10) {
            riskLevel = 'Moderate Risk';
            alertType = 'warning';
        }

        return `
            ${uiBuilder.createResultItem({
            label: 'Total Score',
            value: score.toString(),
            unit: 'points',
            interpretation: riskLevel,
            alertClass: `ui-alert-${alertType}`
        })}
            ${uiBuilder.createResultItem({
            label: 'ICU Risk',
            value: riskPercent.toFixed(1),
            unit: '%',
            alertClass: `ui-alert-${alertType}`
        })}
            ${uiBuilder.createAlert({
            type: alertType,
            message:
                '<strong>Interpretation:</strong> Risk of complications requiring ICU care (cardiac arrest, shock, high-grade AV block, respiratory failure, stroke, death).'
        })}
        `;
    },
    customInitialize: (
        client: unknown,
        patient: unknown,
        container: HTMLElement,
        calculate: () => void
    ) => {
        // Initialize FHIRDataService
        fhirDataService.initialize(client, patient, container);

        const setRadioWithValue = (
            name: string,
            value: number,
            conditions: ((v: number) => boolean)[]
        ) => {
            if (value === null) {
                return;
            }

            for (const [radioIndex, condition] of conditions.entries()) {
                if (condition(value)) {
                    const radios = container.querySelectorAll(`input[name="${name}"]`);
                    if (radios[radioIndex]) {
                        const radio = radios[radioIndex] as HTMLInputElement;
                        radio.checked = true;
                        radio.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                    break;
                }
            }
        };

        // Age from FHIRDataService
        const age = fhirDataService.getPatientAge();
        if (age !== null) {
            setRadioWithValue('action-age', age, [v => v < 70, v => v >= 70]);
        }

        if (client) {
            Promise.all([
                fhirDataService.getObservation(LOINC_CODES.CREATININE, {
                    trackStaleness: true,
                    stalenessLabel: 'Creatinine',
                    targetUnit: 'mg/dL',
                    unitType: 'creatinine'
                }),
                fhirDataService.getObservation(LOINC_CODES.HEART_RATE, {
                    trackStaleness: true,
                    stalenessLabel: 'Heart Rate'
                }),
                fhirDataService.getBloodPressure({
                    trackStaleness: true
                })
            ])
                .then(([creatResult, hrResult, bpResult]) => {
                    if (creatResult.value !== null) {
                        setRadioWithValue('action-creatinine', creatResult.value, [
                            v => v < 1.1,
                            v => v >= 1.1
                        ]);
                    }

                    if (hrResult.value !== null) {
                        setRadioWithValue('action-hr', hrResult.value, [
                            v => v < 85,
                            v => v >= 85 && v < 100,
                            v => v >= 100
                        ]);
                    }

                    if (bpResult.systolic !== null) {
                        setRadioWithValue('action-sbp', bpResult.systolic, [
                            v => v >= 145,
                            v => v >= 125 && v < 145,
                            v => v < 125
                        ]);
                    }

                    calculate();
                })
                .catch((e: unknown) => logger.error('Error fetching observations for ACTION ICU', { error: String(e) }));
        }

        calculate();
    }
};

export const actionIcu = createScoringCalculator(actionIcuConfig);
