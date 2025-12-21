import { getPatientConditions, calculateAge, getMostRecentObservation } from '../../utils.js';
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

interface Criteria {
    id: string;
    title: string;
    options: { value: string; label: string; checked?: boolean }[];
}

export const fourPeps: CalculatorModule = {
    id: '4peps',
    title: '4-Level Pulmonary Embolism Clinical Probability Score (4PEPS)',
    description: 'Rules out PE based on clinical criteria.',
    generateHTML: function () {
        const criteria: Criteria[] = [
            { id: 'sex', title: 'Sex', options: [{ value: '0', label: 'Female', checked: true }, { value: '2', label: 'Male (+2)' }] },
            { id: 'resp_disease', title: 'Chronic Respiratory Disease', options: [{ value: '0', label: 'No', checked: true }, { value: '-1', label: 'Yes (-1)' }] },
            { id: 'hr', title: 'Heart Rate < 80 bpm', options: [{ value: '0', label: 'No', checked: true }, { value: '-1', label: 'Yes (-1)' }] },
            { id: 'chest_pain', title: 'Chest pain AND acute dyspnea', options: [{ value: '0', label: 'No', checked: true }, { value: '1', label: 'Yes (+1)' }] },
            { id: 'estrogen', title: 'Current Estrogen Use', options: [{ value: '0', label: 'No', checked: true }, { value: '2', label: 'Yes (+2)' }] },
            { id: 'vte', title: 'Prior History of VTE', options: [{ value: '0', label: 'No', checked: true }, { value: '2', label: 'Yes (+2)' }] },
            { id: 'syncope', title: 'Syncope', options: [{ value: '0', label: 'No', checked: true }, { value: '2', label: 'Yes (+2)' }] },
            { id: 'immobility', title: 'Immobility (last 4 weeks)', options: [{ value: '0', label: 'No', checked: true }, { value: '2', label: 'Yes (+2)' }] },
            { id: 'o2_sat', title: 'O₂ Saturation < 95%', options: [{ value: '0', label: 'No', checked: true }, { value: '3', label: 'Yes (+3)' }] },
            { id: 'calf_pain', title: 'Calf pain / Unilateral Edema', options: [{ value: '0', label: 'No', checked: true }, { value: '3', label: 'Yes (+3)' }] },
            { id: 'pe_likely', title: 'PE is the most likely diagnosis', options: [{ value: '0', label: 'No', checked: true }, { value: '5', label: 'Yes (+5)' }] }
        ];

        const criteriaHtml = criteria.map(c =>
            uiBuilder.createSection({
                title: c.title,
                content: uiBuilder.createRadioGroup({
                    name: `4peps-${c.id}`,
                    options: c.options
                })
            })
        ).join('');

        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            ${uiBuilder.createAlert({
            type: 'info',
            message: '<strong>Instructions:</strong> Use clinician judgment to assess which vital sign should be used for the 4PEPS score.'
        })}

            ${uiBuilder.createSection({
            title: 'Age',
            icon: '👴',
            content: uiBuilder.createInput({
                id: 'fourpeps-age',
                label: 'Age',
                type: 'number',
                unit: 'years',
                placeholder: 'e.g., 70',
                helpText: '+2 points if >74 years'
            })
        })}

            ${criteriaHtml}

            ${uiBuilder.createResultBox({ id: 'fourpeps-result', title: '4PEPS Score Results' })}

            <div class="chart-container" style="margin-top: 20px; text-align: center;">
                <img src="js/calculators/4peps/4PEPS.png" alt="4PEPS Score Reference" class="reference-image" style="max-width: 100%; border-radius: 8px;" />
            </div>

            <div class="info-section" style="margin-top: 20px; font-size: 0.85em; color: #666;">
                <h4>📚 Reference</h4>
                <p>Roy, P. M., et al. (2021). Derivation and Validation of a 4-Level Clinical Pretest Probability Score for Suspected Pulmonary Embolism to Safely Decrease Imaging Testing. <em>JAMA Cardiology</em>.</p>
            </div>
        `;
    },
    initialize: function (client: any, patient: any, container: HTMLElement) {
        uiBuilder.initializeComponents(container);

        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);

        const calculate = () => {
            let score = 0;

            const ageInput = container.querySelector('#fourpeps-age') as HTMLInputElement;
            const age = parseInt(ageInput.value);
            if (!isNaN(age) && age > 74) {
                score += 2;
            }

            const radioGroups = [
                'sex', 'resp_disease', 'hr', 'chest_pain', 'estrogen',
                'vte', 'syncope', 'immobility', 'o2_sat', 'calf_pain', 'pe_likely'
            ];

            radioGroups.forEach(id => {
                const checked = container.querySelector(`input[name="4peps-${id}"]:checked`) as HTMLInputElement | null;
                if (checked) {
                    score += parseInt(checked.value);
                }
            });

            let probability = '';
            let riskLevel = '';
            let recommendation = '';
            let alertType: 'success' | 'warning' | 'danger' | 'info' = 'info';

            if (score <= 3) {
                probability = '2-7%';
                riskLevel = 'Low CPP';
                alertType = 'success';
                recommendation = 'PE can be ruled out if 4PEPS score is 0-3 and D-dimer is negative (using age-adjusted threshold).';
            } else if (score <= 9) {
                probability = '20-65%';
                riskLevel = 'Moderate CPP';
                alertType = 'warning';
                recommendation = 'PE can be ruled out if D-dimer level <0.5 µg/mL OR <(age x 0.01) µg/mL';
            } else {
                probability = '66-95%';
                riskLevel = 'High CPP';
                alertType = 'danger';
                recommendation = 'Imaging (e.g., CTPA) is recommended.';
            }

            const resultBox = container.querySelector('#fourpeps-result');
            if (resultBox) {
                const resultContent = resultBox.querySelector('.ui-result-content');
                if (resultContent) {
                    resultContent.innerHTML = `
                    ${uiBuilder.createResultItem({
                        label: '4PEPS Score',
                        value: score.toString(),
                        unit: 'points',
                        interpretation: riskLevel,
                        alertClass: `ui-alert-${alertType}`
                    })}
                    ${uiBuilder.createResultItem({
                        label: 'Clinical Pretest Probability',
                        value: probability,
                        alertClass: `ui-alert-${alertType}`
                    })}
                    ${uiBuilder.createAlert({
                        type: alertType,
                        message: `<strong>Recommendation:</strong> ${recommendation}`
                    })}
                `;
                }
                resultBox.classList.add('show');
            }
        };

        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculate);
            input.addEventListener('change', calculate);
        });

        // FHIR auto-population
        const populate = async () => {
            try {
                if (patient) {
                    if (patient.birthDate) {
                        const age = calculateAge(patient.birthDate);
                        const ageInput = container.querySelector('#fourpeps-age') as HTMLInputElement;
                        if (ageInput) ageInput.value = age.toString();
                    }
                    if (patient.gender) {
                        const genderVal = patient.gender === 'male' ? '2' : '0';
                        const radio = container.querySelector(`input[name="4peps-sex"][value="${genderVal}"]`) as HTMLInputElement | null;
                        if (radio) {
                            radio.checked = true;
                            radio.dispatchEvent(new Event('change'));
                        }
                    }
                }

                if (client) {
                    const chronicRespCodes = ['13645005', 'J44.9']; // COPD
                    const vteCodes = ['I82.90', '451574005']; // VTE history

                    const [conditions, hrObs, o2Obs] = await Promise.all([
                        getPatientConditions(client, [...chronicRespCodes, ...vteCodes]),
                        getMostRecentObservation(client, LOINC_CODES.HEART_RATE),
                        getMostRecentObservation(client, LOINC_CODES.OXYGEN_SATURATION)
                    ]);

                    if (conditions) {
                        if (conditions.some((c: any) => c.code?.coding?.some((cod: any) => chronicRespCodes.includes(cod.code)))) {
                            const radio = container.querySelector('input[name="4peps-resp_disease"][value="-1"]') as HTMLInputElement | null;
                            if (radio) {
                                radio.checked = true;
                                radio.dispatchEvent(new Event('change'));
                            }
                        }
                        if (conditions.some((c: any) => c.code?.coding?.some((cod: any) => vteCodes.includes(cod.code)))) {
                            const radio = container.querySelector('input[name="4peps-vte"][value="2"]') as HTMLInputElement | null;
                            if (radio) {
                                radio.checked = true;
                                radio.dispatchEvent(new Event('change'));
                            }
                        }
                    }

                    if (hrObs && hrObs.valueQuantity && hrObs.valueQuantity.value !== undefined) {
                        if (hrObs.valueQuantity.value < 80) {
                            const radio = container.querySelector('input[name="4peps-hr"][value="-1"]') as HTMLInputElement | null;
                            if (radio) {
                                radio.checked = true;
                                radio.dispatchEvent(new Event('change'));
                            }
                        }
                        stalenessTracker.trackObservation('input[name="4peps-hr"]', hrObs, LOINC_CODES.HEART_RATE, 'Heart Rate');
                    }

                    if (o2Obs && o2Obs.valueQuantity && o2Obs.valueQuantity.value !== undefined) {
                        if (o2Obs.valueQuantity.value < 95) {
                            const radio = container.querySelector('input[name="4peps-o2_sat"][value="3"]') as HTMLInputElement | null;
                            if (radio) {
                                radio.checked = true;
                                radio.dispatchEvent(new Event('change'));
                            }
                        }
                        stalenessTracker.trackObservation('input[name="4peps-o2_sat"]', o2Obs, LOINC_CODES.OXYGEN_SATURATION, 'O2 Saturation');
                    }
                }
            } catch (error) {
                console.error('Error auto-populating 4PEPS:', error);
            } finally {
                calculate();
            }
        };

        populate();
    }
};
