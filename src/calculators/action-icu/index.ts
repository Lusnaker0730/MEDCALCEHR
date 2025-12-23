import { createRadioScoreCalculator } from '../shared/radio-score-calculator.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { fhirDataService } from '../../fhir-data-service.js';

const riskMap = [
    3.4, 4.8, 6.7, 9.2, 12.5, 16.7, 21.7, 27.5, 33.9, 40.8, 48.0, 55.4, 62.7, 69.6, 76.0,
    81.7, 86.6, 90.6
];

export const actionIcu = createRadioScoreCalculator({
    id: 'action-icu',
    title: 'ACTION ICU Score for Intensive Care in NSTEMI',
    description: 'Risk of complications requiring ICU care among initially uncomplicated patients with NSTEMI.',
    infoAlert: '<strong>📋 NSTEMI Risk Assessment</strong><br>For initially hemodynamically stable adults with NSTEMI',
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
                { value: '1', label: '85-100 (+1)' },
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
            message: '<strong>Interpretation:</strong> Risk of complications requiring ICU care (cardiac arrest, shock, high-grade AV block, respiratory failure, stroke, death).'
        })}
        `;
    },
    customInitialize: (client, patient, container, calculate) => {
        // Initialize FHIRDataService
        fhirDataService.initialize(client, patient, container);

        const setRadioWithValue = (name: string, value: number, conditions: ((v: number) => boolean)[]) => {
            if (value === null) return;

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
                fhirDataService.getObservation(LOINC_CODES.CREATININE, { trackStaleness: true, stalenessLabel: 'Creatinine', targetUnit: 'mg/dL', unitType: 'creatinine' }),
                fhirDataService.getObservation(LOINC_CODES.HEART_RATE, { trackStaleness: true, stalenessLabel: 'Heart Rate' }),
                fhirDataService.getObservation(LOINC_CODES.SYSTOLIC_BP, { trackStaleness: true, stalenessLabel: 'Systolic BP' })
            ]).then(([creatResult, hrResult, sbpResult]) => {
                if (creatResult.value !== null) {
                    setRadioWithValue('action-creatinine', creatResult.value, [
                        v => v < 1.1,
                        v => v >= 1.1
                    ]);
                }

                if (hrResult.value !== null) {
                    setRadioWithValue('action-hr', hrResult.value, [
                        v => v < 85,
                        v => v >= 85 && v <= 100,
                        v => v > 100
                    ]);
                }

                if (sbpResult.value !== null) {
                    setRadioWithValue('action-sbp', sbpResult.value, [
                        v => v >= 145,
                        v => v >= 125 && v < 145,
                        v => v < 125
                    ]);
                }

                calculate();
            }).catch(e => console.error("Error fetching observations for ACTION ICU", e));
        }

        calculate();
    }
});
