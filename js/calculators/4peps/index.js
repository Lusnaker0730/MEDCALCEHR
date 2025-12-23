/**
 * 4-Level Pulmonary Embolism Clinical Probability Score (4PEPS)
 *
 * 使用 createMixedInputCalculator 工廠函數遷移
 */
import { LOINC_CODES, SNOMED_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { createMixedInputCalculator } from '../shared/mixed-input-calculator.js';
import { fhirDataService } from '../../fhir-data-service.js';
const config = {
    id: '4peps',
    title: '4-Level Pulmonary Embolism Clinical Probability Score (4PEPS)',
    description: 'Rules out PE based on clinical criteria.',
    infoAlert: '<strong>Instructions:</strong> Use clinician judgment to assess which vital sign should be used for the 4PEPS score.',
    sections: [
        {
            title: 'Age',
            icon: '👴',
            inputs: [
                {
                    type: 'number',
                    id: 'fourpeps-age',
                    label: 'Age',
                    unit: 'years',
                    placeholder: 'e.g., 70',
                    helpText: '+2 points if >74 years'
                }
            ]
        },
        {
            title: 'Sex',
            inputs: [
                {
                    type: 'radio',
                    name: '4peps-sex',
                    label: '',
                    options: [
                        { value: '0', label: 'Female', checked: true },
                        { value: '2', label: 'Male (+2)' }
                    ]
                }
            ]
        },
        {
            title: 'Chronic Respiratory Disease',
            inputs: [
                {
                    type: 'radio',
                    name: '4peps-resp_disease',
                    label: '',
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: '-1', label: 'Yes (-1)' }
                    ]
                }
            ]
        },
        {
            title: 'Heart Rate < 80 bpm',
            inputs: [
                {
                    type: 'radio',
                    name: '4peps-hr',
                    label: '',
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: '-1', label: 'Yes (-1)' }
                    ]
                }
            ]
        },
        {
            title: 'Chest pain AND acute dyspnea',
            inputs: [
                {
                    type: 'radio',
                    name: '4peps-chest_pain',
                    label: '',
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: '1', label: 'Yes (+1)' }
                    ]
                }
            ]
        },
        {
            title: 'Current Estrogen Use',
            inputs: [
                {
                    type: 'radio',
                    name: '4peps-estrogen',
                    label: '',
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: '2', label: 'Yes (+2)' }
                    ]
                }
            ]
        },
        {
            title: 'Prior History of VTE',
            inputs: [
                {
                    type: 'radio',
                    name: '4peps-vte',
                    label: '',
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: '2', label: 'Yes (+2)' }
                    ]
                }
            ]
        },
        {
            title: 'Syncope',
            inputs: [
                {
                    type: 'radio',
                    name: '4peps-syncope',
                    label: '',
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: '2', label: 'Yes (+2)' }
                    ]
                }
            ]
        },
        {
            title: 'Immobility (last 4 weeks)',
            inputs: [
                {
                    type: 'radio',
                    name: '4peps-immobility',
                    label: '',
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: '2', label: 'Yes (+2)' }
                    ]
                }
            ]
        },
        {
            title: 'O₂ Saturation < 95%',
            inputs: [
                {
                    type: 'radio',
                    name: '4peps-o2_sat',
                    label: '',
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: '3', label: 'Yes (+3)' }
                    ]
                }
            ]
        },
        {
            title: 'Calf pain / Unilateral Edema',
            inputs: [
                {
                    type: 'radio',
                    name: '4peps-calf_pain',
                    label: '',
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: '3', label: 'Yes (+3)' }
                    ]
                }
            ]
        },
        {
            title: 'PE is the most likely diagnosis',
            inputs: [
                {
                    type: 'radio',
                    name: '4peps-pe_likely',
                    label: '',
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: '5', label: 'Yes (+5)' }
                    ]
                }
            ]
        }
    ],
    references: [
        'Roy, P. M., et al. (2021). Derivation and Validation of a 4-Level Clinical Pretest Probability Score for Suspected Pulmonary Embolism to Safely Decrease Imaging Testing. <em>JAMA Cardiology</em>.'
    ],
    resultTitle: '4PEPS Score Results',
    calculate: (values) => {
        let score = 0;
        // Age scoring
        const age = values['fourpeps-age'];
        if (age !== null && age > 74) {
            score += 2;
        }
        // Radio group scoring
        const radioGroups = [
            '4peps-sex', '4peps-resp_disease', '4peps-hr', '4peps-chest_pain',
            '4peps-estrogen', '4peps-vte', '4peps-syncope', '4peps-immobility',
            '4peps-o2_sat', '4peps-calf_pain', '4peps-pe_likely'
        ];
        radioGroups.forEach(name => {
            const val = values[name];
            if (val !== null && val !== undefined) {
                score += parseInt(val);
            }
        });
        return score;
    },
    customResultRenderer: (score, values) => {
        let probability = '';
        let riskLevel = '';
        let recommendation = '';
        let alertType = 'info';
        if (score <= 3) {
            probability = '2-7%';
            riskLevel = 'Low CPP';
            alertType = 'success';
            recommendation = 'PE can be ruled out if 4PEPS score is 0-3 and D-dimer is negative (using age-adjusted threshold).';
        }
        else if (score <= 9) {
            probability = '20-65%';
            riskLevel = 'Moderate CPP';
            alertType = 'warning';
            recommendation = 'PE can be ruled out if D-dimer level <0.5 µg/mL OR <(age x 0.01) µg/mL';
        }
        else {
            probability = '66-95%';
            riskLevel = 'High CPP';
            alertType = 'danger';
            recommendation = 'Imaging (e.g., CTPA) is recommended.';
        }
        return `
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
    },
    customInitialize: async (client, patient, container, calculate, setValue) => {
        // Initialize FHIRDataService
        fhirDataService.initialize(client, patient, container);
        const setRadio = (name, value) => {
            const radio = container.querySelector(`input[name="${name}"][value="${value}"]`);
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change', { bubbles: true }));
            }
        };
        try {
            // Age and gender from FHIRDataService
            const age = fhirDataService.getPatientAge();
            if (age !== null) {
                setValue('fourpeps-age', age.toString());
            }
            const gender = fhirDataService.getPatientGender();
            if (gender) {
                setRadio('4peps-sex', gender === 'male' ? '2' : '0');
            }
            if (client) {
                const chronicRespCodes = [SNOMED_CODES.COPD, '13645005', 'J44.9'];
                const vteCodes = ['I82.90', '451574005'];
                // Fetch conditions and observations using FHIRDataService
                const [hasCOPD, hasVTE, hrResult, o2Result] = await Promise.all([
                    fhirDataService.hasCondition(chronicRespCodes).catch(() => false),
                    fhirDataService.hasCondition(vteCodes).catch(() => false),
                    fhirDataService.getObservation(LOINC_CODES.HEART_RATE, { trackStaleness: true, stalenessLabel: 'Heart Rate' }).catch(() => ({ value: null })),
                    fhirDataService.getObservation(LOINC_CODES.OXYGEN_SATURATION, { trackStaleness: true, stalenessLabel: 'O2 Saturation' }).catch(() => ({ value: null }))
                ]);
                if (hasCOPD) {
                    setRadio('4peps-resp_disease', '-1');
                }
                if (hasVTE) {
                    setRadio('4peps-vte', '2');
                }
                if (hrResult.value !== null && hrResult.value < 80) {
                    setRadio('4peps-hr', '-1');
                }
                if (o2Result.value !== null && o2Result.value < 95) {
                    setRadio('4peps-o2_sat', '3');
                }
            }
        }
        catch (error) {
            console.error('Error auto-populating 4PEPS:', error);
        }
        finally {
            calculate();
        }
    }
};
export const fourPeps = createMixedInputCalculator(config);
