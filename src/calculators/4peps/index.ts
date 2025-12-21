/**
 * 4-Level Pulmonary Embolism Clinical Probability Score (4PEPS)
 * 
 * 使用 createMixedInputCalculator 工廠函數遷移
 */

import { getPatientConditions, calculateAge, getMostRecentObservation } from '../../utils.js';
import { createStalenessTracker } from '../../data-staleness.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { createMixedInputCalculator, MixedInputCalculatorConfig } from '../shared/mixed-input-calculator.js';

const config: MixedInputCalculatorConfig = {
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
        const age = values['fourpeps-age'] as number | null;
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
                score += parseInt(val as string);
            }
        });
        
        return score;
    },
    
    customResultRenderer: (score, values) => {
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
        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);
        
        const setRadio = (name: string, value: string) => {
            const radio = container.querySelector(`input[name="${name}"][value="${value}"]`) as HTMLInputElement | null;
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change', { bubbles: true }));
            }
        };
        
        try {
            if (patient) {
                if ((patient as any).birthDate) {
                    const age = calculateAge((patient as any).birthDate);
                    setValue('fourpeps-age', age.toString());
                }
                if ((patient as any).gender) {
                    const genderVal = (patient as any).gender === 'male' ? '2' : '0';
                    setRadio('4peps-sex', genderVal);
                }
            }
            
            if (client) {
                const chronicRespCodes = ['13645005', 'J44.9']; // COPD
                const vteCodes = ['I82.90', '451574005']; // VTE history
                
                const [conditions, hrObs, o2Obs] = await Promise.all([
                    getPatientConditions(client as any, [...chronicRespCodes, ...vteCodes]),
                    getMostRecentObservation(client as any, LOINC_CODES.HEART_RATE),
                    getMostRecentObservation(client as any, LOINC_CODES.OXYGEN_SATURATION)
                ]);
                
                if (conditions) {
                    if (conditions.some((c: any) => c.code?.coding?.some((cod: any) => chronicRespCodes.includes(cod.code)))) {
                        setRadio('4peps-resp_disease', '-1');
                    }
                    if (conditions.some((c: any) => c.code?.coding?.some((cod: any) => vteCodes.includes(cod.code)))) {
                        setRadio('4peps-vte', '2');
                    }
                }
                
                if (hrObs && hrObs.valueQuantity && hrObs.valueQuantity.value !== undefined) {
                    if (hrObs.valueQuantity.value < 80) {
                        setRadio('4peps-hr', '-1');
                    }
                    stalenessTracker.trackObservation('input[name="4peps-hr"]', hrObs, LOINC_CODES.HEART_RATE, 'Heart Rate');
                }
                
                if (o2Obs && o2Obs.valueQuantity && o2Obs.valueQuantity.value !== undefined) {
                    if (o2Obs.valueQuantity.value < 95) {
                        setRadio('4peps-o2_sat', '3');
                    }
                    stalenessTracker.trackObservation('input[name="4peps-o2_sat"]', o2Obs, LOINC_CODES.OXYGEN_SATURATION, 'O2 Saturation');
                }
            }
        } catch (error) {
            console.error('Error auto-populating 4PEPS:', error);
        } finally {
            calculate();
        }
    }
};

export const fourPeps = createMixedInputCalculator(config);
