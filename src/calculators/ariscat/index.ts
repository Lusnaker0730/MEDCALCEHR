import { createRadioScoreCalculator } from '../shared/radio-score-calculator.js';
import { calculateAge, getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';

export const ariscat = createRadioScoreCalculator({
    id: 'ariscat',
    title: 'ARISCAT Score for Postoperative Pulmonary Complications',
    description: 'Predicts risk of pulmonary complications after surgery, including respiratory failure.',
    sections: [
        {
            id: 'ariscat-age',
            title: 'Age, years',
            options: [
                { value: '0', label: '≤50 (0)', checked: true },
                { value: '3', label: '51-80 (+3)' },
                { value: '16', label: '>80 (+16)' }
            ]
        },
        {
            id: 'ariscat-spo2',
            title: 'Preoperative SpO₂',
            options: [
                { value: '0', label: '≥96% (0)', checked: true },
                { value: '8', label: '91-95% (+8)' },
                { value: '24', label: '≤90% (+24)' }
            ]
        },
        {
            id: 'ariscat-resp',
            title: 'Respiratory infection in the last month',
            subtitle: 'Either upper or lower (i.e., URI, bronchitis, pneumonia), with fever and antibiotic treatment',
            options: [
                { value: '0', label: 'No (0)', checked: true },
                { value: '17', label: 'Yes (+17)' }
            ]
        },
        {
            id: 'ariscat-anemia',
            title: 'Preoperative anemia (Hgb ≤10 g/dL)',
            options: [
                { value: '0', label: 'No (0)', checked: true },
                { value: '11', label: 'Yes (+11)' }
            ]
        },
        {
            id: 'ariscat-site',
            title: 'Surgical incision',
            options: [
                { value: '0', label: 'Peripheral (0)', checked: true },
                { value: '15', label: 'Upper abdominal (+15)' },
                { value: '24', label: 'Intrathoracic (+24)' }
            ]
        },
        {
            id: 'ariscat-duration',
            title: 'Duration of surgery',
            options: [
                { value: '0', label: '<2 hrs (0)', checked: true },
                { value: '16', label: '2-3 hrs (+16)' },
                { value: '23', label: '>3 hrs (+23)' }
            ]
        },
        {
            id: 'ariscat-emergency',
            title: 'Emergency procedure?',
            options: [
                { value: '0', label: 'No (0)', checked: true },
                { value: '8', label: 'Yes (+8)' }
            ]
        }
    ],
    riskLevels: [
        { minScore: 0, maxScore: 25, label: 'Low risk', severity: 'success', description: 'Risk: 1.6%' },
        { minScore: 26, maxScore: 44, label: 'Intermediate risk', severity: 'warning', description: 'Risk: 13.3%' },
        { minScore: 45, maxScore: 123, label: 'High risk', severity: 'danger', description: 'Risk: 42.1%' }
    ],
    customResultRenderer: (score: number) => {
        let riskCategory = '';
        let riskInfo = '';
        let alertType: 'success' | 'warning' | 'danger' = 'success';

        if (score < 26) {
            riskCategory = 'Low risk';
            riskInfo = '1.6%';
            alertType = 'success';
        } else if (score <= 44) {
            riskCategory = 'Intermediate risk';
            riskInfo = '13.3%';
            alertType = 'warning';
        } else {
            riskCategory = 'High risk';
            riskInfo = '42.1%';
            alertType = 'danger';
        }

        return `
            ${uiBuilder.createResultItem({
                label: 'ARISCAT Score',
                value: score.toString(),
                unit: 'points',
                interpretation: riskCategory,
                alertClass: `ui-alert-${alertType}`
            })}
            ${uiBuilder.createResultItem({
                label: 'Pulmonary Complication Risk',
                value: riskInfo,
                alertClass: `ui-alert-${alertType}`
            })}
            ${uiBuilder.createAlert({
                type: alertType,
                message: 'Risk of in-hospital post-op pulmonary complications (respiratory failure, infection, pleural effusion, atelectasis, pneumothorax, bronchospasm, aspiration pneumonitis).'
            })}
        `;
    },
    customInitialize: (client: unknown, patient: unknown, container: HTMLElement, calculate: () => void) => {
        const fhirClient = client as any;
        const patientData = patient as any;
        
        const setRadioValue = (name: string, value: string) => {
            const radio = container.querySelector(`input[name="${name}"][value="${value}"]`) as HTMLInputElement;
            if (radio) {
                radio.checked = true;
            }
        };

        if (patientData && patientData.birthDate) {
            const patientAge = calculateAge(patientData.birthDate);
            let ageValue = '0';
            if (patientAge > 80) ageValue = '16';
            else if (patientAge > 50) ageValue = '3';

            setRadioValue('ariscat-age', ageValue);
        }

        if (fhirClient) {
            getMostRecentObservation(fhirClient, LOINC_CODES.O2_SAT).then(obs => {
                if (obs && obs.valueQuantity && obs.valueQuantity.value !== undefined) {
                    const spo2 = obs.valueQuantity.value;
                    let value = '0';
                    if (spo2 <= 90) value = '24';
                    else if (spo2 <= 95) value = '8';
                    setRadioValue('ariscat-spo2', value);
                }
            }).catch(console.error);

            getMostRecentObservation(fhirClient, LOINC_CODES.HEMOGLOBIN).then(obs => {
                if (obs && obs.valueQuantity && obs.valueQuantity.value !== undefined) {
                    const hgb = obs.valueQuantity.value;
                    if (hgb <= 10) {
                        setRadioValue('ariscat-anemia', '11');
                    } else {
                        setRadioValue('ariscat-anemia', '0');
                    }
                }
            }).catch(console.error);
        }

        calculate();
    }
});
