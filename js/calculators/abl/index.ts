import { getMostRecentObservation } from '../../utils';
import { LOINC_CODES } from '../../fhir-codes';
import { uiBuilder } from '../../ui-builder';
import { Calculator } from '../../types/calculator';
import { FHIRClient, Patient, Observation } from '../../types/fhir';

export const abl: Calculator = {
    id: 'abl',
    title: 'Maximum Allowable Blood Loss (ABL) Without Transfusion',
    description:
        'Calculates the allowable blood loss for a patient before a transfusion may be indicated.',
    generateHTML: function (): string {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>

            ${uiBuilder.createSection({
            title: 'Patient Category',
            content: `
                    ${uiBuilder.createSelect({
                id: 'abl-age-category',
                label: 'Category',
                options: [
                    { value: '75', label: 'Adult man (75 mL/kg)' },
                    { value: '65', label: 'Adult woman (65 mL/kg)' },
                    { value: '80', label: 'Infant (80 mL/kg)' },
                    { value: '85', label: 'Neonate (85 mL/kg)' },
                    { value: '96', label: 'Premature neonate (96 mL/kg)' }
                ],
                helpText: 'Blood volume (mL/kg) varies by age and sex'
            })}
                `
        })}

            ${uiBuilder.createSection({
            title: 'Parameters',
            content: `
                    ${uiBuilder.createInput({ id: 'abl-weight', label: 'Weight', unit: 'kg', type: 'number', placeholder: 'e.g., 70' })}
                    ${uiBuilder.createInput({ id: 'abl-hgb-initial', label: 'Initial Hemoglobin', unit: 'g/dL', type: 'number', step: '0.1', placeholder: 'e.g., 14' })}
                    ${uiBuilder.createInput({ id: 'abl-hgb-final', label: 'Target/Allowable Hemoglobin', unit: 'g/dL', type: 'number', step: '0.1', placeholder: 'e.g., 7' })}
                `
        })}

            ${uiBuilder.createResultBox({ id: 'abl-result', title: 'ABL Results' })}

            ${uiBuilder.createFormulaSection({
            items: [
                { label: 'Estimated Blood Volume (EBV)', content: 'Weight (kg) × Blood Volume (mL/kg)' },
                { label: 'Allowable Blood Loss (ABL)', content: 'EBV × (Hgb<sub>initial</sub> - Hgb<sub>final</sub>) / Hgb<sub>average</sub>' },
                { label: 'Average Hgb', content: '(Hgb<sub>initial</sub> + Hgb<sub>final</sub>) / 2' }
            ]
        })}
        `;
    },
    initialize: function (client: FHIRClient, patient: Patient, container: HTMLElement): void {
        uiBuilder.initializeComponents(container);

        const calculate = () => {
            const weight = parseFloat((container.querySelector('#abl-weight') as HTMLInputElement).value);
            const hgbInitial = parseFloat((container.querySelector('#abl-hgb-initial') as HTMLInputElement).value);
            const hgbFinal = parseFloat((container.querySelector('#abl-hgb-final') as HTMLInputElement).value);
            const avgBloodVolume = parseFloat((container.querySelector('#abl-age-category') as HTMLSelectElement).value);

            const resultBox = container.querySelector('#abl-result') as HTMLElement;
            const resultContent = resultBox.querySelector('.ui-result-content') as HTMLElement;

            if (isNaN(weight) || isNaN(hgbInitial) || isNaN(hgbFinal) || isNaN(avgBloodVolume)) {
                resultBox.classList.remove('show');
                return;
            }

            if (hgbInitial <= hgbFinal) {
                resultContent.innerHTML = uiBuilder.createAlert({
                    type: 'danger',
                    message: 'Initial hemoglobin must be greater than final hemoglobin.'
                });
                resultBox.classList.add('show');
                return;
            }

            const ebv = weight * avgBloodVolume; // Estimated Blood Volume in mL
            const hgbAvg = (hgbInitial + hgbFinal) / 2;
            const ablValue = (ebv * (hgbInitial - hgbFinal)) / hgbAvg;

            resultContent.innerHTML = `
                ${uiBuilder.createResultItem({
                label: 'Maximum Allowable Blood Loss',
                value: ablValue.toFixed(0),
                unit: 'mL',
                alertClass: 'ui-alert-info'
            })}
                ${uiBuilder.createResultItem({
                label: 'Estimated Blood Volume (EBV)',
                value: ebv.toFixed(0),
                unit: 'mL'
            })}
                ${uiBuilder.createResultItem({
                label: 'Average Hemoglobin',
                value: hgbAvg.toFixed(1),
                unit: 'g/dL'
            })}
            `;
            resultBox.classList.add('show');
        };

        // Auto-populate from FHIR
        if (client) {
            getMostRecentObservation(client, LOINC_CODES.WEIGHT).then((obs: Observation | null) => {
                if (obs && obs.valueQuantity) {
                    const weightInput = container.querySelector('#abl-weight') as HTMLInputElement;
                    weightInput.value = obs.valueQuantity.value.toFixed(1);
                    weightInput.dispatchEvent(new Event('input'));
                }
            });
            getMostRecentObservation(client, LOINC_CODES.HEMOGLOBIN).then((obs: Observation | null) => {
                if (obs && obs.valueQuantity) {
                    const hgbInput = container.querySelector('#abl-hgb-initial') as HTMLInputElement;
                    hgbInput.value = obs.valueQuantity.value.toFixed(1);
                    hgbInput.dispatchEvent(new Event('input'));
                }
            });
        }

        // Pre-select category based on patient data
        if (patient) {
            const age = new Date().getFullYear() - new Date(patient.birthDate).getFullYear();
            const categorySelect = container.querySelector('#abl-age-category') as HTMLSelectElement;
            if (age > 18) {
                categorySelect.value = patient.gender === 'male' ? '75' : '65';
            }
            categorySelect.dispatchEvent(new Event('change'));
        }

        // Add event listeners for auto-calculation
        container.querySelectorAll('input, select').forEach(el => {
            el.addEventListener('input', calculate);
            el.addEventListener('change', calculate);
        });
    }
};
