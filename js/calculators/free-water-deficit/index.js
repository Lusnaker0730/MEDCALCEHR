import {
    getMostRecentObservation,
} from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';

export const freeWaterDeficit = {
    id: 'free-water-deficit',
    title: 'Free Water Deficit in Hypernatremia',
    description: 'Calculates free water deficit by estimated total body water in a patient with hypernatremia or dehydration.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            ${uiBuilder.createSection({
                title: 'Patient Data',
                icon: '👤',
                content: `
                    ${uiBuilder.createInput({
                        id: 'fwd-weight',
                        label: 'Weight',
                        type: 'number',
                        placeholder: 'e.g., 70',
                        unitToggle: {
                            type: 'weight',
                            units: ['kg', 'lbs'],
                            defaultUnit: 'kg'
                        }
                    })}
                    ${uiBuilder.createInput({
                        id: 'fwd-sodium',
                        label: 'Serum Sodium',
                        type: 'number',
                        placeholder: 'e.g., 160',
                        unitToggle: {
                            type: 'sodium', // Assuming custom type or generic, sodium is just mEq/L usually
                            units: ['mEq/L', 'mmol/L'],
                            defaultUnit: 'mEq/L'
                        }
                    })}
                    ${uiBuilder.createRadioGroup({
                        name: 'fwd-gender',
                        label: 'Gender / Type',
                        options: [
                            { value: 'male', label: 'Adult Male', checked: true },
                            { value: 'female', label: 'Adult Female' },
                            { value: 'elderly', label: 'Elderly Male' },
                            { value: 'elderly_female', label: 'Elderly Female' },
                            { value: 'child', label: 'Child' }
                        ],
                        helpText: 'Determines Total Body Water (TBW) factor.'
                    })}
                `
            })}
            
            ${uiBuilder.createResultBox({ id: 'fwd-result', title: 'Free Water Deficit' })}
            
            ${uiBuilder.createFormulaSection({
                items: [
                    { label: 'Free Water Deficit (L)', formula: 'TBW × [(Current Na / 140) - 1]' },
                    { label: 'TBW (Total Body Water)', formula: 'Weight (kg) × Factor' }
                ]
            })}

            ${uiBuilder.createAlert({
                type: 'info',
                message: `
                    <h4>TBW Factors:</h4>
                    <ul style="margin-top: 5px; padding-left: 20px;">
                        <li>Adult Male: 0.6</li>
                        <li>Adult Female: 0.5</li>
                        <li>Elderly Male: 0.5</li>
                        <li>Elderly Female: 0.45</li>
                        <li>Child: 0.6</li>
                    </ul>
                `
            })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const weightInput = container.querySelector('#fwd-weight');
        const sodiumInput = container.querySelector('#fwd-sodium');
        const resultBox = container.querySelector('#fwd-result');

        const calculateAndUpdate = () => {
            const weightKg = UnitConverter.getStandardValue(weightInput, 'kg');
            const sodium = parseFloat(sodiumInput.value);
            const genderType = container.querySelector('input[name="fwd-gender"]:checked')?.value || 'male';

            if (isNaN(weightKg) || isNaN(sodium) || weightKg <= 0 || sodium <= 0) {
                resultBox.classList.remove('show');
                return;
            }

            // Determine TBW factor
            let tbwFactor = 0.6;
            switch (genderType) {
                case 'male': tbwFactor = 0.6; break;
                case 'female': tbwFactor = 0.5; break;
                case 'elderly': tbwFactor = 0.5; break;
                case 'elderly_female': tbwFactor = 0.45; break;
                case 'child': tbwFactor = 0.6; break;
            }

            const totalBodyWater = weightKg * tbwFactor;
            const deficit = totalBodyWater * ((sodium / 140) - 1);

            let status = '';
            let alertType = 'success';
            let alertMsg = '';

            if (sodium <= 140) {
                status = 'Not Indicated';
                alertType = 'warning';
                alertMsg = 'Calculation intended for hypernatremia (Na > 140).';
            } else {
                status = 'Hypernatremia';
                alertType = 'danger'; // High risk
                alertMsg = 'Correction should be slow (e.g., over 48-72 hours) to avoid cerebral edema. Max rate ~0.5 mEq/L/hr.';
            }

            const resultContent = resultBox.querySelector('.ui-result-content');
            resultContent.innerHTML = `
                ${uiBuilder.createResultItem({
                    label: 'Free Water Deficit',
                    value: deficit > 0 ? deficit.toFixed(1) : '0.0',
                    unit: 'Liters',
                    interpretation: status,
                    alertClass: `ui-alert-${alertType}`
                })}
                ${uiBuilder.createResultItem({
                    label: 'Estimated TBW',
                    value: totalBodyWater.toFixed(1),
                    unit: 'Liters'
                })}
                ${uiBuilder.createAlert({
                    type: alertType,
                    message: alertMsg
                })}
            `;
            resultBox.classList.add('show');
        };

        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculateAndUpdate);
            input.addEventListener('change', calculateAndUpdate);
        });

        // Auto-populate from FHIR
        if (client) {
            getMostRecentObservation(client, LOINC_CODES.WEIGHT).then(obs => {
                if (obs && obs.valueQuantity) {
                     // Assuming standard kg
                    weightInput.value = obs.valueQuantity.value.toFixed(1);
                    weightInput.dispatchEvent(new Event('input'));
                }
            });
            getMostRecentObservation(client, LOINC_CODES.SODIUM).then(obs => {
                if (obs && obs.valueQuantity) {
                    sodiumInput.value = obs.valueQuantity.value.toFixed(0);
                    sodiumInput.dispatchEvent(new Event('input'));
                }
            });
        }

        // Initial patient data
        if (patient && patient.gender) {
             const genderVal = patient.gender.toLowerCase();
             // Simple mapping
             const genderRadio = container.querySelector(`input[name="fwd-gender"][value="${genderVal}"]`);
             if (genderRadio) {
                 genderRadio.checked = true;
                 genderRadio.dispatchEvent(new Event('change'));
             }
        }

        calculateAndUpdate();
    }
};
