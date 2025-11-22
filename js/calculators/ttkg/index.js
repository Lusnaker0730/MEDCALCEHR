import { getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';

export const ttkg = {
    id: 'ttkg',
    title: 'Transtubular Potassium Gradient (TTKG)',
    description: 'May help in assessment of hyperkalemia or hypokalemia.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            ${uiBuilder.createSection({
                title: 'Lab Values',
                content: `
                    ${uiBuilder.createInput({
                        id: 'ttkg-urine-k',
                        label: 'Urine Potassium',
                        type: 'number',
                        unit: 'mEq/L'
                    })}
                    ${uiBuilder.createInput({
                        id: 'ttkg-serum-k',
                        label: 'Serum Potassium',
                        type: 'number',
                        unit: 'mEq/L',
                        placeholder: 'Norm: 3.5 - 5.2'
                    })}
                    ${uiBuilder.createInput({
                        id: 'ttkg-urine-osmo',
                        label: 'Urine Osmolality',
                        type: 'number',
                        unit: 'mOsm/kg',
                        placeholder: 'Norm: 500 - 800'
                    })}
                    ${uiBuilder.createInput({
                        id: 'ttkg-serum-osmo',
                        label: 'Serum Osmolality',
                        type: 'number',
                        unit: 'mOsm/kg',
                        placeholder: 'Norm: 275 - 295'
                    })}
                `
            })}
            ${uiBuilder.createResultBox({ id: 'ttkg-result', title: 'Result' })}
            ${uiBuilder.createFormulaSection({
                items: [
                    {
                        label: 'TTKG Formula',
                        formula: 'TTKG = (Urine K × Serum Osmolality) / (Serum K × Urine Osmolality)'
                    }
                ],
                notes: 'Valid only when Urine Osmolality > Serum Osmolality.'
            })}
            ${uiBuilder.createAlert({
                type: 'info',
                message: `
                    <h4>Clinical Interpretation</h4>
                    <ul>
                        <li><strong>Hypokalemia (K < 3.5):</strong>
                            <ul>
                                <li>TTKG < 3: Non-renal loss (GI, etc.)</li>
                                <li>TTKG > 3: Renal loss</li>
                            </ul>
                        </li>
                        <li><strong>Hyperkalemia (K > 5.2):</strong>
                            <ul>
                                <li>TTKG > 10: Normal renal response</li>
                                <li>TTKG < 7: Hypoaldosteronism or resistance</li>
                            </ul>
                        </li>
                    </ul>
                `
            })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const urineKEl = container.querySelector('#ttkg-urine-k');
        const serumKEl = container.querySelector('#ttkg-serum-k');
        const urineOsmoEl = container.querySelector('#ttkg-urine-osmo');
        const serumOsmoEl = container.querySelector('#ttkg-serum-osmo');
        const resultBox = container.querySelector('#ttkg-result');

        const calculate = () => {
            const urineK = parseFloat(urineKEl.value);
            const serumK = parseFloat(serumKEl.value);
            const urineOsmo = parseFloat(urineOsmoEl.value);
            const serumOsmo = parseFloat(serumOsmoEl.value);

            if (isNaN(urineK) || isNaN(serumK) || isNaN(urineOsmo) || isNaN(serumOsmo)) {
                resultBox.classList.remove('show');
                return;
            }

            if (serumK === 0 || urineOsmo === 0) {
                resultBox.querySelector('.ui-result-content').innerHTML = uiBuilder.createAlert({
                    type: 'danger',
                    message: 'Serum potassium and Urine osmolality cannot be zero.'
                });
                resultBox.classList.add('show');
                return;
            }

            const ttkgValue = (urineK * serumOsmo) / (serumK * urineOsmo);

            let interpretation = '';
            let alertType = 'info';

            if (serumK < 3.5) {
                // Hypokalemia
                if (ttkgValue < 3) {
                    interpretation = 'Suggests non-renal potassium loss (e.g., GI loss, transcellular shift).';
                } else {
                    interpretation = 'Suggests renal potassium wasting.';
                    alertType = 'warning';
                }
            } else if (serumK > 5.2) {
                // Hyperkalemia
                if (ttkgValue > 10) {
                    interpretation = 'Suggests hyperkalemia is driven by high potassium intake (dietary or iatrogenic).';
                } else if (ttkgValue < 7) {
                    interpretation = 'Suggests an issue with aldosterone (e.g., hypoaldosteronism or aldosterone resistance).';
                    alertType = 'warning';
                }
            } else {
                 interpretation = 'Normal potassium levels. TTKG should be interpreted in context of potassium disorders.';
            }

             if (urineOsmo <= serumOsmo) {
                interpretation = `<strong>Warning:</strong> TTKG is not valid when Urine Osmolality (${urineOsmo}) ≤ Serum Osmolality (${serumOsmo}).`;
                alertType = 'warning';
            }

            resultBox.querySelector('.ui-result-content').innerHTML = `
                ${uiBuilder.createResultItem({
                    label: 'TTKG',
                    value: ttkgValue.toFixed(2),
                    interpretation: interpretation,
                    alertClass: `ui-alert-${alertType}`
                })}
            `;
            resultBox.classList.add('show');
        };

        [urineKEl, serumKEl, urineOsmoEl, serumOsmoEl].forEach(input => {
            input.addEventListener('input', calculate);
        });

        // FHIR auto-population
        getMostRecentObservation(client, LOINC_CODES.URINE_POTASSIUM).then(obs => {
            if (obs?.valueQuantity) urineKEl.value = obs.valueQuantity.value.toFixed(1);
            calculate();
        });
        getMostRecentObservation(client, LOINC_CODES.POTASSIUM).then(obs => {
            if (obs?.valueQuantity) serumKEl.value = obs.valueQuantity.value.toFixed(1);
            calculate();
        });
        getMostRecentObservation(client, '2697-2').then(obs => { // Urine Osmolality
            if (obs?.valueQuantity) urineOsmoEl.value = obs.valueQuantity.value.toFixed(1);
            calculate();
        });
        getMostRecentObservation(client, '2695-6').then(obs => { // Serum Osmolality
            if (obs?.valueQuantity) serumOsmoEl.value = obs.valueQuantity.value.toFixed(1);
            calculate();
        });

        calculate();
    }
};
