import { getPatientConditions, getObservation } from '../../utils.js';
import { uiBuilder } from '../../ui-builder.js';
import { ValidationError, displayError, logError } from '../../errorHandler.js';
import { createStalenessTracker } from '../../data-staleness.js';

interface CalculatorModule {
    id: string;
    title: string;
    description: string;
    generateHTML: () => string;
    initialize: (client: any, patient: any, container: HTMLElement) => void;
}

export const bacterialMeningitisScore: CalculatorModule = {
    id: 'bacterial-meningitis-score',
    title: 'Bacterial Meningitis Score for Children',
    description: 'Rules out bacterial meningitis in children aged 29 days to 19 years.',

    generateHTML: () => `
        <div class="calculator-header">
            <h3>Bacterial Meningitis Score for Children</h3>
            <p class="description">Rules out bacterial meningitis in children aged 29 days to 19 years.</p>
        </div>

        ${uiBuilder.createAlert({
        type: 'info',
        message: `
                <strong>INSTRUCTIONS:</strong> Use in patients aged <strong>29 days to 19 years</strong> with CSF WBC ≥10 cells/μL.<br><br>
                <strong>Do not use if:</strong> Patient is critically ill, recently received antibiotics, has a VP shunt or recent neurosurgery, is immunosuppressed, or has other bacterial infection requiring antibiotics (including Lyme disease).
            `
    })}
        
        ${uiBuilder.createSection({
        title: 'Clinical Criteria',
        content: `
                ${uiBuilder.createRadioGroup({
            name: 'gram_stain',
            label: 'CSF Gram stain positive',
            helpText: 'Cerebrospinal fluid microscopy',
            options: [
                { value: '0', label: 'No (0)', checked: true },
                { value: '2', label: 'Yes (+2)' }
            ]
        })}
                
                ${uiBuilder.createRadioGroup({
            name: 'csf_anc',
            label: 'CSF ANC ≥1,000 cells/μL',
            helpText: 'Absolute neutrophil count in CSF',
            options: [
                { value: '0', label: 'No (0)', checked: true },
                { value: '1', label: 'Yes (+1)' }
            ]
        })}
                
                ${uiBuilder.createRadioGroup({
            name: 'csf_protein',
            label: 'CSF protein ≥80 mg/dL (800 mg/L)',
            helpText: 'Protein concentration in CSF',
            options: [
                { value: '0', label: 'No (0)', checked: true },
                { value: '1', label: 'Yes (+1)' }
            ]
        })}
                
                ${uiBuilder.createRadioGroup({
            name: 'blood_anc',
            label: 'Peripheral blood ANC ≥10,000 cells/μL',
            helpText: 'Absolute neutrophil count in blood',
            options: [
                { value: '0', label: 'No (0)', checked: true },
                { value: '1', label: 'Yes (+1)' }
            ]
        })}
                
                ${uiBuilder.createRadioGroup({
            name: 'seizure',
            label: 'Seizure at (or prior to) initial presentation',
            helpText: 'Any seizure activity documented',
            options: [
                { value: '0', label: 'No (0)', checked: true },
                { value: '1', label: 'Yes (+1)' }
            ]
        })}
            `
    })}
        
        <div id="bms-error-container"></div>
        ${uiBuilder.createResultBox({ id: 'bms-result-box', title: 'Bacterial Meningitis Score' })}
    `,

    initialize: (client: any, patient: any, container: HTMLElement) => {
        uiBuilder.initializeComponents(container);

        // Initialize staleness tracker for this calculator
        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);

        const calculate = () => {
            try {
                // Clear validation errors
                const errorContainer = container.querySelector('#bms-error-container');
                if (errorContainer) errorContainer.innerHTML = '';

                const score = Array.from(
                    container.querySelectorAll('input[type="radio"]:checked')
                ).reduce((acc, input) => {
                    return acc + parseInt((input as HTMLInputElement).value);
                }, 0);

                const resultBox = container.querySelector('#bms-result-box');

                if (resultBox) {
                    const resultContent = resultBox.querySelector('.ui-result-content');
                    if (resultContent) {
                        let interpretation = '';
                        let alertType: 'success' | 'warning' | 'danger' | 'info' = 'success';

                        if (score === 0) {
                            interpretation = 'Very low risk for bacterial meningitis.';
                            alertType = 'success';
                        } else {
                            interpretation = 'NOT very low risk for bacterial meningitis.';
                            alertType = 'danger';
                        }

                        resultContent.innerHTML = `
                            ${uiBuilder.createResultItem({
                            label: 'Total Score',
                            value: score.toString(),
                            unit: 'points',
                            interpretation: score === 0 ? 'Very Low Risk' : 'Not Low Risk',
                            alertClass: `ui-alert-${alertType}`
                        })}
                            ${uiBuilder.createAlert({
                            type: alertType,
                            message: `<strong>Interpretation:</strong> ${interpretation}`
                        })}
                        `;
                    }
                    resultBox.classList.add('show');
                }
            } catch (error) {
                const errorContainer = container.querySelector('#bms-error-container');
                if (errorContainer) {
                    displayError(errorContainer as HTMLElement, error as Error);
                } else {
                    console.error(error);
                }
                logError(error as Error, { calculator: 'bacterial-meningitis-score', action: 'calculate' });
            }
        };

        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', calculate);
        });

        // --- FHIR Integration ---
        const setRadio = (name: string, value: string, obs?: any, code?: string, label?: string) => {
            const radio = container.querySelector(`input[name="${name}"][value="${value}"]`) as HTMLInputElement;
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change', { bubbles: true }));

                if (obs && code && label) {
                    stalenessTracker.trackObservation(`input[name="${name}"]:checked`, obs, code, label);
                }
            }
        };

        if (client) {
            // CSF Gram Stain (LOINC: 664-3) - checking for positive result
            getObservation(client, '664-3').then(obs => {
                if (obs && obs.valueCodeableConcept && obs.valueCodeableConcept.coding) {
                    // Assuming positive if a code indicating presence is found (example SNOMED code)
                    const isPositive = obs.valueCodeableConcept.coding.some(
                        (c: any) => c.code === '260348003'
                    );
                    if (isPositive) {
                        setRadio('gram_stain', '2', obs, '664-3', 'CSF Gram Stain');
                    }
                }
            }).catch(e => console.warn(e));

            // CSF ANC (LOINC: 26485-3)
            getObservation(client, '26485-3').then(obs => {
                if (obs && obs.valueQuantity && obs.valueQuantity.value >= 1000) {
                    setRadio('csf_anc', '1', obs, '26485-3', 'CSF ANC');
                }
            }).catch(e => console.warn(e));

            // CSF Protein (LOINC: 3137-7)
            getObservation(client, '3137-7').then(obs => {
                // Ensure unit conversion if needed, but simplistic check for now
                if (obs && obs.valueQuantity && obs.valueQuantity.value >= 80) {
                    setRadio('csf_protein', '1', obs, '3137-7', 'CSF Protein');
                }
            }).catch(e => console.warn(e));

            // Peripheral Blood ANC (LOINC: 751-8)
            getObservation(client, '751-8').then(obs => {
                if (obs && obs.valueQuantity && obs.valueQuantity.value >= 10000) {
                    setRadio('blood_anc', '1', obs, '751-8', 'Peripheral Blood ANC');
                }
            }).catch(e => console.warn(e));

            // Seizure (SNOMED: 91175000)
            getPatientConditions(client, ['91175000'])
                .then(conditions => {
                    if (conditions.length > 0) {
                        // We track the first condition found? Staleness tracker expects Observation usually,
                        // but we can pass condition if it has metadata?
                        // getPatientConditions returns list of objects.
                        // Let's assume the first one is the "observation" for tracking purposes, though it's a Condition resource.
                        // trackObservation might fail if it strictly expects Observation structure (valueQuantity etc).
                        // But looking at trackObservation, it mostly looks for meta.lastUpdated or effectiveDateTime.

                        // If condition resource has recordedDate or onsetDateTime, we might need a condition-specific tracker or adapt.
                        // But for now, let's just set the checked state.
                        setRadio('seizure', '1');
                    }
                })
                .catch(e => console.warn(e));
        }

        calculate();
    }
};
