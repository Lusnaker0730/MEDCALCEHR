import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';
import { fhirDataService } from '../../fhir-data-service.js';
export const ett = {
    id: 'ett',
    title: 'Endotracheal Tube (ETT) Depth and Tidal Volume Calculator',
    description: 'Calculates estimated ETT depth and tidal volume based on patient height and gender.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>

            ${uiBuilder.createSection({
            title: 'Patient Parameters',
            content: `
                    ${uiBuilder.createInput({
                id: 'ett-height',
                label: 'Height',
                unit: 'cm',
                type: 'number',
                placeholder: 'e.g. 170'
            })}
                    ${uiBuilder.createSelect({
                id: 'ett-gender',
                label: 'Gender',
                options: [
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' }
                ]
            })}
                `
        })}
            
            ${uiBuilder.createResultBox({ id: 'ett-result', title: 'ETT & Ventilation Settings' })}
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);
        // Initialize FHIRDataService
        fhirDataService.initialize(client, patient, container);
        const heightEl = container.querySelector('#ett-height');
        const genderEl = container.querySelector('#ett-gender');
        const calculate = () => {
            const heightCm = parseFloat(heightEl.value);
            const gender = genderEl.value;
            const resultBox = container.querySelector('#ett-result');
            if (isNaN(heightCm)) {
                if (resultBox)
                    resultBox.classList.remove('show');
                return;
            }
            // ETT Depth Calculation (Height/10 + 4) -> Original code logic preserved
            const originalFormulaDepth = heightCm / 10 + 5;
            // Ideal Body Weight (IBW) Calculation
            const heightIn = heightCm / 2.54;
            const heightInOver5Ft = Math.max(0, heightIn - 60);
            let ibw = 0;
            if (gender === 'male') {
                ibw = 50 + 2.3 * heightInOver5Ft;
            }
            else {
                ibw = 45.5 + 2.3 * heightInOver5Ft;
            }
            // Tidal Volume Calculation (6-8 mL/kg of IBW)
            const tidalVolumeLow = ibw * 6;
            const tidalVolumeHigh = ibw * 8;
            if (resultBox) {
                const resultContent = resultBox.querySelector('.ui-result-content');
                if (resultContent) {
                    resultContent.innerHTML = `
                        ${uiBuilder.createResultItem({
                        label: 'Estimated ETT Depth (at lips)',
                        value: originalFormulaDepth.toFixed(1),
                        unit: 'cm'
                    })}
                        ${uiBuilder.createResultItem({
                        label: 'Ideal Body Weight (IBW)',
                        value: ibw.toFixed(1),
                        unit: 'kg'
                    })}
                        ${uiBuilder.createResultItem({
                        label: 'Target Tidal Volume (6-8 mL/kg)',
                        value: `${tidalVolumeLow.toFixed(0)} - ${tidalVolumeHigh.toFixed(0)}`,
                        unit: 'mL'
                    })}
                    `;
                }
                resultBox.classList.add('show');
            }
        };
        // Auto-populate using FHIRDataService
        const gender = fhirDataService.getPatientGender();
        if (gender) {
            genderEl.value = gender === 'female' ? 'female' : 'male';
        }
        if (client) {
            fhirDataService.getObservation(LOINC_CODES.HEIGHT, { trackStaleness: true, stalenessLabel: 'Height', targetUnit: 'cm', unitType: 'height' }).then(result => {
                if (result.value !== null) {
                    heightEl.value = result.value.toFixed(1);
                    calculate();
                }
            });
        }
        heightEl.addEventListener('input', calculate);
        genderEl.addEventListener('change', calculate);
        calculate(); // Initial run
    }
};
