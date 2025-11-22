import { getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';

export const fena = {
    id: 'fena',
    title: 'Fractional Excretion of Sodium (FENa)',
    description: 'Determines if renal failure is due to prerenal or intrinsic pathology.',
    generateHTML: function () {
        const inputs = uiBuilder.createSection({
            title: 'Laboratory Values',
            content: [
                uiBuilder.createInput({
                    id: 'fena-urine-na',
                    label: 'Urine Sodium',
                    type: 'number',
                    placeholder: 'e.g. 20',
                    unit: 'mEq/L'
                }),
                uiBuilder.createInput({
                    id: 'fena-serum-na',
                    label: 'Serum Sodium',
                    type: 'number',
                    placeholder: 'e.g. 140',
                    unit: 'mEq/L'
                }),
                uiBuilder.createInput({
                    id: 'fena-urine-creat',
                    label: 'Urine Creatinine',
                    type: 'number',
                    unitToggle: { type: 'creatinine', units: ['mg/dL', 'µmol/L'] }
                }),
                uiBuilder.createInput({
                    id: 'fena-serum-creat',
                    label: 'Serum Creatinine',
                    type: 'number',
                    unitToggle: { type: 'creatinine', units: ['mg/dL', 'µmol/L'] }
                })
            ].join('')
        });

        const formulaSection = uiBuilder.createFormulaSection({
            items: [
                { label: 'FENa Equation', formula: 'FENa (%) = [(Urine Na × Serum Cr) / (Serum Na × Urine Cr)] × 100' },
                { label: 'Units', formula: 'Na (mEq/L), Cr (mg/dL or µmol/L)' }
            ]
        });

        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            ${uiBuilder.createAlert({
                type: 'info',
                message: 'Use in the context of acute kidney injury (AKI) / acute renal failure to differentiate prerenal azotemia from acute tubular necrosis (ATN).'
            })}
            
            ${inputs}
            
            ${uiBuilder.createResultBox({ id: 'fena-result', title: 'FENa Result' })}
            
            ${formulaSection}
            
            ${uiBuilder.createAlert({
                type: 'warning',
                message: '<strong>Limitations:</strong> FENa is unreliable in patients on diuretics. Consider Fractional Excretion of Urea (FEUrea) instead.'
            })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const resultBox = container.querySelector('#fena-result');
        const resultContent = resultBox.querySelector('.ui-result-content');

        const calculateAndUpdate = () => {
            const uNaInput = container.querySelector('#fena-urine-na');
            const sNaInput = container.querySelector('#fena-serum-na');
            const uCrInput = container.querySelector('#fena-urine-creat');
            const sCrInput = container.querySelector('#fena-serum-creat');

            const uNa = parseFloat(uNaInput.value);
            const sNa = parseFloat(sNaInput.value);
            const uCrMgDl = UnitConverter.getStandardValue(uCrInput, 'mg/dL');
            const sCrMgDl = UnitConverter.getStandardValue(sCrInput, 'mg/dL');

            if (uNa > 0 && sNa > 0 && uCrMgDl > 0 && sCrMgDl > 0) {
                const fenaValue = (uNa / sNa / (uCrMgDl / sCrMgDl)) * 100;

                let interpretation = '';
                let alertClass = '';
                
                if (fenaValue < 1) {
                    interpretation = 'Prerenal AKI (< 1%)';
                    alertClass = 'ui-alert-success';
                } else if (fenaValue > 2) {
                    interpretation = 'Intrinsic/ATN (> 2%)';
                    alertClass = 'ui-alert-danger';
                } else {
                    interpretation = 'Indeterminate (1-2%)';
                    alertClass = 'ui-alert-warning';
                }

                resultContent.innerHTML = `
                    ${uiBuilder.createResultItem({ 
                        label: 'Fractional Excretion of Sodium', 
                        value: fenaValue.toFixed(2), 
                        unit: '%',
                        interpretation: interpretation,
                        alertClass: alertClass
                    })}
                `;
                
                resultBox.classList.add('show');
            } else {
                resultBox.classList.remove('show');
            }
        };

        // Add event listeners
        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculateAndUpdate);
        });

        // Auto-populate from FHIR
        if (client) {
            Promise.all([
                getMostRecentObservation(client, '2955-3'), // Urine Na
                getMostRecentObservation(client, LOINC_CODES.SODIUM), // Serum Na
                getMostRecentObservation(client, LOINC_CODES.URINE_CREATININE),
                getMostRecentObservation(client, LOINC_CODES.CREATININE)
            ]).then(([uNa, sNa, uCr, sCr]) => {
                if (uNa?.valueQuantity) {
                    container.querySelector('#fena-urine-na').value = uNa.valueQuantity.value.toFixed(0);
                }
                if (sNa?.valueQuantity) {
                    container.querySelector('#fena-serum-na').value = sNa.valueQuantity.value.toFixed(0);
                }
                if (uCr?.valueQuantity) {
                    container.querySelector('#fena-urine-creat').value = uCr.valueQuantity.value.toFixed(0);
                }
                if (sCr?.valueQuantity) {
                    container.querySelector('#fena-serum-creat').value = sCr.valueQuantity.value.toFixed(1);
                }
                
                // Trigger calculation if values populated
                container.querySelector('#fena-urine-na').dispatchEvent(new Event('input'));
            });
        }
    }
};