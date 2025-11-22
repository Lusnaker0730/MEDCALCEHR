import { getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';

export const intraopFluid = {
    id: 'intraop-fluid',
    title: 'Intraoperative Fluid Dosing in Adult Patients',
    description: 'Doses IV fluids intraoperatively.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>

            ${uiBuilder.createAlert({
                type: 'warning',
                message: '<strong>IMPORTANT:</strong> This dosing tool is intended to assist with calculation, not to provide comprehensive or definitive drug information. Always double-check dosing.'
            })}
            
            ${uiBuilder.createAlert({
                type: 'info',
                message: '<strong>INSTRUCTIONS:</strong> Use in patients undergoing surgery who weigh >10 kg and do not have conditions that could otherwise result in fluid overload such as heart failure, COPD, or kidney failure on dialysis.'
            })}

            ${uiBuilder.createSection({
                title: 'Patient Parameters',
                content: `
                    ${uiBuilder.createInput({
                        id: 'ifd-weight',
                        label: 'Weight',
                        unit: 'kg',
                        type: 'number'
                    })}
                    ${uiBuilder.createInput({
                        id: 'ifd-npo',
                        label: 'Time spent NPO',
                        unit: 'hours',
                        type: 'number'
                    })}
                `
            })}

            ${uiBuilder.createSection({
                title: 'Surgical Factors',
                content: uiBuilder.createRadioGroup({
                    name: 'ifd-trauma',
                    label: 'Estimated severity of trauma to tissue',
                    options: [
                        { value: '4', label: 'Minimal (e.g. hernia repair, laparoscopy) (4 mL/kg/hr)' },
                        { value: '6', label: 'Moderate (e.g. open cholecystectomy) (6 mL/kg/hr)' },
                        { value: '8', label: 'Severe (e.g. bowel resection) (8 mL/kg/hr)' }
                    ]
                })
            })}

            ${uiBuilder.createResultBox({ id: 'ifd-result', title: 'Fluid Requirements' })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const weightInput = container.querySelector('#ifd-weight');
        const npoInput = container.querySelector('#ifd-npo');

        const calculate = () => {
            const weight = parseFloat(weightInput.value);
            const npoHours = parseFloat(npoInput.value);
            const traumaRadio = container.querySelector('input[name="ifd-trauma"]:checked');

            const resultBox = container.querySelector('#ifd-result');
            const resultContent = resultBox.querySelector('.ui-result-content');

            if (isNaN(weight) || isNaN(npoHours) || !traumaRadio) {
                resultBox.classList.remove('show');
                return;
            }

            // 4-2-1 Rule for Maintenance
            const maintenanceRate =
                weight > 20 ? weight + 40 : weight > 10 ? 40 + (weight - 10) * 2 : weight * 4;
            
            const npoDeficit = maintenanceRate * npoHours;
            const traumaLossRate = parseFloat(traumaRadio.value) * weight;

            // Hour-by-hour
            // 1st hour: 50% deficit + maint + trauma
            // 2nd hour: 25% deficit + maint + trauma
            // 3rd hour: 25% deficit + maint + trauma
            // 4th+ hour: maint + trauma
            
            const firstHourFluids = npoDeficit / 2 + maintenanceRate + traumaLossRate;
            const secondHourFluids = npoDeficit / 4 + maintenanceRate + traumaLossRate;
            const thirdHourFluids = npoDeficit / 4 + maintenanceRate + traumaLossRate;
            const fourthHourFluids = maintenanceRate + traumaLossRate;

            resultContent.innerHTML = `
                ${uiBuilder.createResultItem({
                    label: 'Hourly Maintenance Fluid',
                    value: maintenanceRate.toFixed(0),
                    unit: 'mL/hr'
                })}
                ${uiBuilder.createResultItem({
                    label: 'NPO Fluid Deficit',
                    value: npoDeficit.toFixed(0),
                    unit: 'mL'
                })}
                ${uiBuilder.createResultItem({
                    label: '1st Hour Fluids',
                    value: firstHourFluids.toFixed(0),
                    unit: 'mL/hr',
                    interpretation: '50% Deficit + Maint + Trauma'
                })}
                ${uiBuilder.createResultItem({
                    label: '2nd Hour Fluids',
                    value: secondHourFluids.toFixed(0),
                    unit: 'mL/hr',
                    interpretation: '25% Deficit + Maint + Trauma'
                })}
                ${uiBuilder.createResultItem({
                    label: '3rd Hour Fluids',
                    value: thirdHourFluids.toFixed(0),
                    unit: 'mL/hr',
                    interpretation: '25% Deficit + Maint + Trauma'
                })}
                ${uiBuilder.createResultItem({
                    label: '4th Hour & Beyond',
                    value: fourthHourFluids.toFixed(0),
                    unit: 'mL/hr',
                    interpretation: 'Maintenance + Trauma'
                })}
            `;
            resultBox.classList.add('show');
        };

        if (client) {
            getMostRecentObservation(client, LOINC_CODES.WEIGHT).then(obs => {
                if (obs && obs.valueQuantity) {
                    weightInput.value = obs.valueQuantity.value.toFixed(1);
                    calculate();
                }
            });
        }

        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', calculate);
            input.addEventListener('change', calculate);
        });
    }
};
