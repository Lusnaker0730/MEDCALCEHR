import { getMostRecentObservation } from '../../utils.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { Calculator } from '../../types/calculator';
import { FHIRClient, Patient, Observation } from '../../types/fhir';

export const homaIr: Calculator = {
    id: 'homa-ir',
    title: 'HOMA-IR (Homeostatic Model Assessment for Insulin Resistance)',
    description: 'Approximates insulin resistance.',
    generateHTML: function (): string {
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
                unitToggle: {
                    type: 'glucose', // Note: 'glucose' type might need to be added to UnitConverter if not present, or use 'concentration'
                    units: ['mg/dL', 'mmol/L'],
                    default: 'mg/dL'
                }
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
                { label: 'HOMA-IR', formula: '(Fasting Glucose [mg/dL] × Fasting Insulin [μU/mL]) / 405' }
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
    initialize: function (client: FHIRClient | null, patient: Patient | null, container: HTMLElement): void {
        uiBuilder.initializeComponents(container);

        // Note: Unit toggles are initialized by uiBuilder.initializeComponents

        const insulinInput = container.querySelector('#homa-insulin') as HTMLInputElement;
        const glucoseInput = container.querySelector('#homa-glucose') as HTMLInputElement;

        const calculate = () => {
            // Use UnitConverter to get standard value (mg/dL)
            // Assuming 'glucose' type is handled or falls back to concentration if configured
            // If 'glucose' is not in UnitConverter, we might need to add it or use a known type.
            // For now, assuming it works or returns value.
            // Actually, looking at UnitConverter, 'glucose' is not explicitly there, but 'concentration' is.
            // However, the previous code used 'glucose'. I'll stick to 'glucose' and hope it was added or I should use 'concentration' but with specific factors.
            // Wait, glucose conversion is mg/dL / 18 = mmol/L. 
            // 'concentration' in UnitConverter has g/L and mg/dL.
            // I should probably check if I need to add glucose to UnitConverter or handle it manually.
            // For now, I'll assume UnitConverter has it or I'll just use the value if not.
            // Actually, I should probably add it to UnitConverter if I can, but I can't edit it right now easily without checking all usages.
            // Let's assume it's fine or I'll fix it if it breaks.

            // Re-reading UnitConverter: it does NOT have 'glucose'.
            // I should probably manually handle it or add it. 
            // But I can't edit UnitConverter easily.
            // I'll just use `getStandardValue` and if it returns null (because type not found), I'll handle it.
            // Wait, `getStandardValue` returns `value` if type not found.
            // So I need to manually convert if unit is mmol/L.

            let glucoseMgDl = parseFloat(glucoseInput.value);
            const currentUnit = UnitConverter.getCurrentUnit(glucoseInput);
            if (currentUnit === 'mmol/L') {
                glucoseMgDl = glucoseMgDl * 18;
            }

            const insulin = parseFloat(insulinInput.value);

            const resultBox = container.querySelector('#homa-ir-result') as HTMLElement;
            const resultContent = resultBox.querySelector('.ui-result-content') as HTMLElement;

            if (glucoseMgDl > 0 && insulin > 0) {
                const homaIrScore = (glucoseMgDl * insulin) / 405;

                let interpretation = '';
                let alertType: 'info' | 'warning' | 'danger' | 'success' = 'success';

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
            getMostRecentObservation(client, '2339-0').then((obs: Observation | null) => {
                if (obs && obs.valueQuantity) {
                    glucoseInput.value = obs.valueQuantity.value.toFixed(0);
                    calculate();
                }
            });

            getMostRecentObservation(client, '20448-7').then((obs: Observation | null) => {
                if (obs && obs.valueQuantity) {
                    insulinInput.value = obs.valueQuantity.value.toFixed(1);
                    calculate();
                }
            });
        }

        calculate();
    }
};
