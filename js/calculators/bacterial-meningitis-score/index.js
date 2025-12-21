import { createRadioScoreCalculator } from '../shared/radio-score-calculator.js';
import { getPatientConditions, getObservation } from '../../utils.js';
import { uiBuilder } from '../../ui-builder.js';
export const bacterialMeningitisScore = createRadioScoreCalculator({
    id: 'bacterial-meningitis-score',
    title: 'Bacterial Meningitis Score for Children',
    description: 'Rules out bacterial meningitis in children aged 29 days to 19 years.',
    infoAlert: `
        <strong>INSTRUCTIONS:</strong> Use in patients aged <strong>29 days to 19 years</strong> with CSF WBC ≥10 cells/μL.<br><br>
        <strong>Do not use if:</strong> Patient is critically ill, recently received antibiotics, has a VP shunt or recent neurosurgery, is immunosuppressed, or has other bacterial infection requiring antibiotics (including Lyme disease).
    `,
    sections: [
        {
            id: 'gram_stain',
            title: 'CSF Gram stain positive',
            subtitle: 'Cerebrospinal fluid microscopy',
            options: [
                { value: '0', label: 'No (0)', checked: true },
                { value: '2', label: 'Yes (+2)' }
            ]
        },
        {
            id: 'csf_anc',
            title: 'CSF ANC ≥1,000 cells/μL',
            subtitle: 'Absolute neutrophil count in CSF',
            options: [
                { value: '0', label: 'No (0)', checked: true },
                { value: '1', label: 'Yes (+1)' }
            ]
        },
        {
            id: 'csf_protein',
            title: 'CSF protein ≥80 mg/dL (800 mg/L)',
            subtitle: 'Protein concentration in CSF',
            options: [
                { value: '0', label: 'No (0)', checked: true },
                { value: '1', label: 'Yes (+1)' }
            ]
        },
        {
            id: 'blood_anc',
            title: 'Peripheral blood ANC ≥10,000 cells/μL',
            subtitle: 'Absolute neutrophil count in blood',
            options: [
                { value: '0', label: 'No (0)', checked: true },
                { value: '1', label: 'Yes (+1)' }
            ]
        },
        {
            id: 'seizure',
            title: 'Seizure at (or prior to) initial presentation',
            subtitle: 'Any seizure activity documented',
            options: [
                { value: '0', label: 'No (0)', checked: true },
                { value: '1', label: 'Yes (+1)' }
            ]
        }
    ],
    riskLevels: [
        { minScore: 0, maxScore: 0, label: 'Very Low Risk', severity: 'success' },
        { minScore: 1, maxScore: 6, label: 'Not Low Risk', severity: 'danger' }
    ],
    customResultRenderer: (score) => {
        const isLowRisk = score === 0;
        const interpretation = isLowRisk ? 'Very low risk for bacterial meningitis.' : 'NOT very low risk for bacterial meningitis.';
        const alertType = isLowRisk ? 'success' : 'danger';
        return `
            ${uiBuilder.createResultItem({
            label: 'Total Score',
            value: score.toString(),
            unit: 'points',
            interpretation: isLowRisk ? 'Very Low Risk' : 'Not Low Risk',
            alertClass: `ui-alert-${alertType}`
        })}
            ${uiBuilder.createAlert({
            type: alertType,
            message: `<strong>Interpretation:</strong> ${interpretation}`
        })}
        `;
    },
    customInitialize: (client, _patient, container, calculate) => {
        const fhirClient = client;
        const setRadio = (name, value) => {
            const radio = container.querySelector(`input[name="${name}"][value="${value}"]`);
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change', { bubbles: true }));
            }
        };
        if (fhirClient) {
            // CSF Gram Stain (LOINC: 664-3)
            getObservation(fhirClient, '664-3').then(obs => {
                if (obs && obs.valueCodeableConcept && obs.valueCodeableConcept.coding) {
                    const isPositive = obs.valueCodeableConcept.coding.some((c) => c.code === '260348003');
                    if (isPositive) {
                        setRadio('gram_stain', '2');
                    }
                }
            }).catch(e => console.warn(e));
            // CSF ANC (LOINC: 26485-3)
            getObservation(fhirClient, '26485-3').then(obs => {
                if (obs && obs.valueQuantity && obs.valueQuantity.value >= 1000) {
                    setRadio('csf_anc', '1');
                }
            }).catch(e => console.warn(e));
            // CSF Protein (LOINC: 3137-7)
            getObservation(fhirClient, '3137-7').then(obs => {
                if (obs && obs.valueQuantity && obs.valueQuantity.value >= 80) {
                    setRadio('csf_protein', '1');
                }
            }).catch(e => console.warn(e));
            // Peripheral Blood ANC (LOINC: 751-8)
            getObservation(fhirClient, '751-8').then(obs => {
                if (obs && obs.valueQuantity && obs.valueQuantity.value >= 10000) {
                    setRadio('blood_anc', '1');
                }
            }).catch(e => console.warn(e));
            // Seizure (SNOMED: 91175000)
            getPatientConditions(fhirClient, ['91175000'])
                .then(conditions => {
                if (conditions.length > 0) {
                    setRadio('seizure', '1');
                }
            })
                .catch(e => console.warn(e));
        }
        calculate();
    }
});
