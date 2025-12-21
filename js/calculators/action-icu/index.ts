import { getMostRecentObservation, calculateAge } from '../../utils.js';
import { createStalenessTracker } from '../../data-staleness.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';

interface CalculatorModule {
    id: string;
    title: string;
    description: string;
    generateHTML: () => string;
    initialize: (client: any, patient: any, container: HTMLElement) => void;
}

export const actionIcu: CalculatorModule = {
    id: 'action-icu',
    title: 'ACTION ICU Score for Intensive Care in NSTEMI',
    description:
        'Risk of complications requiring ICU care among initially uncomplicated patients with NSTEMI.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>

            ${uiBuilder.createAlert({
            type: 'info',
            message: '<strong>📋 NSTEMI Risk Assessment</strong><br>For initially hemodynamically stable adults with NSTEMI'
        })}

            ${uiBuilder.createSection({
            title: 'Age, years',
            content: uiBuilder.createRadioGroup({
                name: 'action-age',
                options: [
                    { value: '0', label: '&lt;70 (0)', checked: true },
                    { value: '1', label: '≥70 (+1)' }
                ]
            })
        })}

            ${uiBuilder.createSection({
            title: 'Serum creatinine, mg/dL',
            content: uiBuilder.createRadioGroup({
                name: 'action-creatinine',
                options: [
                    { value: '0', label: '&lt;1.1 (0)', checked: true },
                    { value: '1', label: '≥1.1 (+1)' }
                ]
            })
        })}

            ${uiBuilder.createSection({
            title: 'Heart rate, bpm',
            content: uiBuilder.createRadioGroup({
                name: 'action-hr',
                options: [
                    { value: '0', label: '&lt;85 (0)', checked: true },
                    { value: '1', label: '85-100 (+1)' },
                    { value: '3', label: '≥100 (+3)' }
                ]
            })
        })}

            ${uiBuilder.createSection({
            title: 'Systolic blood pressure, mmHg',
            content: uiBuilder.createRadioGroup({
                name: 'action-sbp',
                options: [
                    { value: '0', label: '≥145 (0)', checked: true },
                    { value: '1', label: '125-145 (+1)' },
                    { value: '3', label: '&lt;125 (+3)' }
                ]
            })
        })}

            ${uiBuilder.createSection({
            title: 'Ratio of initial troponin to upper limit of normal',
            content: uiBuilder.createRadioGroup({
                name: 'action-troponin',
                options: [
                    { value: '0', label: '&lt;12 (0)', checked: true },
                    { value: '2', label: '≥12 (+2)' }
                ]
            })
        })}

            ${uiBuilder.createSection({
            title: 'Signs or symptoms of heart failure',
            content: uiBuilder.createRadioGroup({
                name: 'action-hf',
                options: [
                    { value: '0', label: 'No (0)', checked: true },
                    { value: '5', label: 'Yes (+5)' }
                ]
            })
        })}

            ${uiBuilder.createSection({
            title: 'ST segment depression on EKG',
            content: uiBuilder.createRadioGroup({
                name: 'action-st',
                options: [
                    { value: '0', label: 'No (0)', checked: true },
                    { value: '1', label: 'Yes (+1)' }
                ]
            })
        })}

            ${uiBuilder.createSection({
            title: 'Prior revascularization',
            content: uiBuilder.createRadioGroup({
                name: 'action-revasc',
                options: [
                    { value: '0', label: 'Yes (0)' },
                    { value: '1', label: 'No (+1)', checked: true }
                ]
            })
        })}

            ${uiBuilder.createResultBox({ id: 'action-icu-result', title: 'ACTION ICU Score' })}


            ${uiBuilder.createAlert({
            type: 'info',
            message: `
                    <h4>📚 Reference</h4>
                    <p>Fanaroff, A. C., et al. (2018). Risk Score to Predict Need for Intensive Care in Initially Hemodynamically Stable Adults With Non–ST‐Segment–Elevation Myocardial Infarction. <em>Journal of the American Heart Association</em>, 7(11).</p>
                `
        })}
        `;
    },
    initialize: function (client: any, patient: any, container: HTMLElement) {
        uiBuilder.initializeComponents(container);
        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);

        const riskMap = [
            3.4, 4.8, 6.7, 9.2, 12.5, 16.7, 21.7, 27.5, 33.9, 40.8, 48.0, 55.4, 62.7, 69.6, 76.0,
            81.7, 86.6, 90.6
        ]; // Index is score, value is risk %

        const calculate = () => {
            const groups = ['action-age', 'action-creatinine', 'action-hr', 'action-sbp', 'action-troponin', 'action-hf', 'action-st', 'action-revasc'];
            let score = 0;

            groups.forEach(groupName => {
                const checkedRadio = container.querySelector(`input[name="${groupName}"]:checked`) as HTMLInputElement;
                if (checkedRadio) {
                    score += parseInt(checkedRadio.value);
                }
            });

            const riskPercent = score < riskMap.length ? riskMap[score] : riskMap[riskMap.length - 1];

            let riskLevel = 'Low Risk';
            let alertType: 'success' | 'warning' | 'danger' | 'info' = 'success';
            if (riskPercent >= 20) {
                riskLevel = 'High Risk';
                alertType = 'danger';
            } else if (riskPercent >= 10) {
                riskLevel = 'Moderate Risk';
                alertType = 'warning';
            }

            const resultBox = container.querySelector('#action-icu-result');
            if (resultBox) {
                const resultContent = resultBox.querySelector('.ui-result-content');
                if (resultContent) {
                    resultContent.innerHTML = `
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
                        message: `
                        <strong>Interpretation:</strong> Risk of complications requiring ICU care (cardiac arrest, shock, high-grade AV block, respiratory failure, stroke, death).
                    `
                    })}
                `;
                }
                resultBox.classList.add('show');
            }
        };

        // Helper to set radio value based on condition
        const setRadioWithValue = (name: string, value: number, conditions: ((v: number) => boolean)[], obs?: any, code?: string, label?: string) => {
            if (value === null) return;

            for (const [radioIndex, condition] of conditions.entries()) {
                if (condition(value)) {
                    // We need to map the index to the value of the radio button since values are not sequential 0,1,2...
                    // But here I know the structure of my options.
                    // Actually, better to find the radio button by value if possible, but here values depend on index in conditions array.
                    // Let's just assume the order of radios matches the order of conditions.
                    const radios = container.querySelectorAll(`input[name="${name}"]`);
                    if (radios[radioIndex]) {
                        const radio = radios[radioIndex] as HTMLInputElement;
                        radio.checked = true;
                        radio.dispatchEvent(new Event('change', { bubbles: true }));

                        // Only track staleness if we successfully set the value
                        if (obs && code && label) {
                            stalenessTracker.trackObservation(`input[name="${name}"]:checked`, obs, code, label);
                        }
                    }
                    break;
                }
            }
        };

        const populate = async () => {
            if (patient && patient.birthDate) {
                const patientAge = calculateAge(patient.birthDate);
                setRadioWithValue('action-age', patientAge, [v => v < 70, v => v >= 70]);
            }

            if (client) {
                try {
                    const [creatObs, hrObs, sbpObs] = await Promise.all([
                        getMostRecentObservation(client, LOINC_CODES.CREATININE),
                        getMostRecentObservation(client, LOINC_CODES.HEART_RATE),
                        getMostRecentObservation(client, LOINC_CODES.SYSTOLIC_BP)
                    ]);

                    if (creatObs && creatObs.valueQuantity && creatObs.valueQuantity.value !== undefined) {
                        setRadioWithValue('action-creatinine', creatObs.valueQuantity.value, [
                            v => v < 1.1,
                            v => v >= 1.1
                        ], creatObs, LOINC_CODES.CREATININE, 'Creatinine');
                    }

                    if (hrObs && hrObs.valueQuantity && hrObs.valueQuantity.value !== undefined) {
                        setRadioWithValue('action-hr', hrObs.valueQuantity.value, [
                            v => v < 85,
                            v => v >= 85 && v <= 100,
                            v => v > 100
                        ], hrObs, LOINC_CODES.HEART_RATE, 'Heart Rate');
                    }

                    if (sbpObs && sbpObs.valueQuantity && sbpObs.valueQuantity.value !== undefined) {
                        setRadioWithValue('action-sbp', sbpObs.valueQuantity.value, [
                            v => v >= 145,
                            v => v >= 125 && v < 145,
                            v => v < 125
                        ], sbpObs, LOINC_CODES.SYSTOLIC_BP, 'Systolic BP');
                    }

                } catch (e) {
                    console.error("Error fetching observations for ACTION ICU", e);
                }
            }
        };

        container.addEventListener('change', (e) => {
            const target = e.target as HTMLInputElement;
            if (target.tagName === 'INPUT' && target.type === 'radio') {
                calculate();
            }
        });

        populate();
        calculate();
    }
};
