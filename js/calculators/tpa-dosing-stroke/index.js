import { getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';

export const tpaDosing = {
    id: 'tpa-dosing-stroke',
    title: 'tPA Dosing for Acute Stroke',
    description: 'Calculates tissue plasminogen activator (tPA) dosing for acute ischemic stroke.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            ${uiBuilder.createSection({
                title: 'Patient & Event Details',
                content: `
                    ${uiBuilder.createInput({
                        id: 'weight',
                        label: 'Weight',
                        type: 'number',
                        unit: 'kg',
                        placeholder: 'Enter weight',
                        min: 0
                    })}
                    ${uiBuilder.createInput({
                        id: 'symptom-onset',
                        label: 'Time from symptom onset',
                        type: 'number',
                        unit: 'hours',
                        placeholder: 'e.g., 2.5',
                        min: 0,
                        max: 4.5,
                        helpText: 'Must be ≤ 4.5 hours for IV tPA eligibility'
                    })}
                `
            })}
            ${uiBuilder.createResultBox({ id: 'tpa-stroke-result', title: 'Dosing & Eligibility' })}
            ${uiBuilder.createAlert({
                type: 'warning',
                message: `
                    <h4>Important Reminders</h4>
                    <ul>
                        <li>Verify all inclusion/exclusion criteria before administration</li>
                        <li>Obtain informed consent when possible</li>
                        <li>Ensure BP < 185/110 mmHg before treatment</li>
                        <li>Have reversal agents available (cryoprecipitate, aminocaproic acid)</li>
                    </ul>
                `
            })}
            ${uiBuilder.createFormulaSection({
                items: [
                    { label: 'Total Dose', formula: '0.9 mg/kg (Max 90 mg)' },
                    { label: 'Bolus', formula: '10% of Total Dose (over 1 min)' },
                    { label: 'Infusion', formula: '90% of Total Dose (over 60 min)' }
                ],
                notes: 'Maximum dose is 90 mg regardless of weight.'
            })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const weightInput = container.querySelector('#weight');
        const symptomOnsetInput = container.querySelector('#symptom-onset');
        const resultBox = container.querySelector('#tpa-stroke-result');

        const calculate = () => {
            const weight = parseFloat(weightInput.value);
            const symptomOnset = parseFloat(symptomOnsetInput.value);

            if (isNaN(weight) || weight <= 0) {
                resultBox.classList.remove('show');
                return;
            }

            const totalDose = Math.min(0.9 * weight, 90);
            const bolus = totalDose * 0.1;
            const infusion = totalDose * 0.9;
            const infusionRate = infusion; // mg/hour

            let eligibilityHtml = '';
            let alertType = 'info';

            if (!isNaN(symptomOnset)) {
                if (symptomOnset <= 4.5) {
                    eligibilityHtml = uiBuilder.createAlert({
                        type: 'success',
                        message: '<strong>Eligibility:</strong> Within time window for IV tPA (≤ 4.5 hours)'
                    });
                } else {
                    eligibilityHtml = uiBuilder.createAlert({
                        type: 'danger',
                        message: '<strong>Eligibility:</strong> Outside time window for IV tPA (> 4.5 hours)'
                    });
                    alertType = 'danger';
                }
            } else {
                 eligibilityHtml = uiBuilder.createAlert({
                    type: 'warning',
                    message: '<strong>Note:</strong> Please enter time from symptom onset to check eligibility.'
                });
            }

            resultBox.querySelector('.ui-result-content').innerHTML = `
                ${eligibilityHtml}
                ${uiBuilder.createResultItem({
                    label: 'Total Dose',
                    value: totalDose.toFixed(1),
                    unit: 'mg',
                    interpretation: '0.9 mg/kg, max 90 mg'
                })}
                <hr>
                ${uiBuilder.createResultItem({
                    label: 'Step 1: IV Bolus',
                    value: bolus.toFixed(1),
                    unit: 'mg',
                    interpretation: 'IV push over 1 minute'
                })}
                ${uiBuilder.createResultItem({
                    label: 'Step 2: Continuous Infusion',
                    value: infusion.toFixed(1),
                    unit: 'mg',
                    interpretation: `Rate: ${infusionRate.toFixed(1)} mg/hr over 60 minutes`
                })}
            `;
            resultBox.classList.add('show');
        };

        weightInput.addEventListener('input', calculate);
        symptomOnsetInput.addEventListener('input', calculate);

        getMostRecentObservation(client, LOINC_CODES.WEIGHT).then(weightObs => {
            if (weightObs?.valueQuantity) {
                weightInput.value = weightObs.valueQuantity.value.toFixed(1);
                calculate();
            }
        });

        calculate();
    }
};
