import {
    getMostRecentObservation
} from '../../utils.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';

export const homaIr = {
    id: 'homa-ir',
    title: 'HOMA-IR (Homeostatic Model Assessment for Insulin Resistance)',
    description: 'Approximates insulin resistance.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>

            ${uiBuilder.createSection({
                title: 'Parameters',
                content: `
                    ${uiBuilder.createInput({
                        id: 'homa-glucose',
                        label: 'Fasting Glucose',
                        unit: 'mg/dL',
                        type: 'number',
                        unitToggle: true
                    })}
                    ${uiBuilder.createInput({
                        id: 'homa-insulin',
                        label: 'Fasting Insulin',
                        unit: 'µU/mL',
                        type: 'number',
                        placeholder: 'e.g. 10'
                    })}
                `
            })}
            
            ${uiBuilder.createResultBox({ id: 'homa-ir-result', title: 'HOMA-IR Score' })}
            
            ${uiBuilder.createFormulaSection({
                items: [
                    { label: 'HOMA-IR', content: '(Fasting Glucose [mg/dL] × Fasting Insulin [μU/mL]) / 405' }
                ]
            })}
            
            ${uiBuilder.createAlert({
                type: 'info',
                message: `
                    <strong>Interpretation:</strong>
                    <ul>
                        <li><strong>< 1.9:</strong> Optimal insulin sensitivity</li>
                        <li><strong>1.9 - 2.9:</strong> Early insulin resistance is likely</li>
                        <li><strong>> 2.9:</strong> High likelihood of insulin resistance</li>
                    </ul>
                `
            })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);
        
        UnitConverter.createUnitToggle(container.querySelector('#homa-glucose'), 'glucose', ['mg/dL', 'mmol/L']);

        const insulinInput = container.querySelector('#homa-insulin');
        const glucoseInput = container.querySelector('#homa-glucose');

        const calculate = () => {
            // Use UnitConverter to get standard value (mg/dL)
            const glucoseMgDl = UnitConverter.getStandardValue(glucoseInput);
            const insulin = parseFloat(insulinInput.value);

            const resultBox = container.querySelector('#homa-ir-result');
            const resultContent = resultBox.querySelector('.ui-result-content');

            if (glucoseMgDl > 0 && insulin > 0) {
                const homaIrScore = (glucoseMgDl * insulin) / 405;
                
                let interpretation = '';
                let alertType = 'success';

                if (homaIrScore > 2.9) {
                    interpretation = 'High likelihood of insulin resistance';
                    alertType = 'danger';
                } else if (homaIrScore > 1.9) {
                    interpretation = 'Early insulin resistance likely';
                    alertType = 'warning';
                } else {
                    interpretation = 'Optimal insulin sensitivity';
                    alertType = 'success';
                }

                resultContent.innerHTML = `
                    ${uiBuilder.createResultItem({
                        label: 'HOMA-IR',
                        value: homaIrScore.toFixed(2),
                        unit: '',
                        interpretation: interpretation,
                        alertClass: `ui-alert-${alertType}`
                    })}
                `;
                resultBox.classList.add('show');
            } else {
                resultBox.classList.remove('show');
            }
        };

        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculate);
        });

        if (client) {
            getMostRecentObservation(client, '2339-0').then(obs => {
                if (obs && obs.valueQuantity) {
                    // Assume unit conversion is handled if value is populated with known unit
                    // For simplicity, we populate raw value and let UnitConverter handle unit display if it matches
                    // Ideally we pass unit to UnitConverter to set toggle correctly
                    glucoseInput.value = obs.valueQuantity.value.toFixed(0);
                    calculate();
                }
            });

            getMostRecentObservation(client, '20448-7').then(obs => {
                if (obs && obs.valueQuantity) {
                    insulinInput.value = obs.valueQuantity.value.toFixed(1);
                    calculate();
                }
            });
        }
        
        calculate();
    }
};
