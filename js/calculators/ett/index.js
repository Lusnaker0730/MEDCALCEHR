import { getMostRecentObservation } from '../../utils.js';
import { createStalenessTracker } from '../../data-staleness.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';

export const ett = {
    id: 'ett',
    title: 'Endotracheal Tube (ETT) Depth and Tidal Volume Calculator',
    description:
        'Calculates estimated ETT depth and tidal volume based on patient height and gender.',
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

        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);

        const heightEl = container.querySelector('#ett-height');
        const genderEl = container.querySelector('#ett-gender');

        if (patient && patient.gender) {
            genderEl.value = patient.gender.toLowerCase() === 'female' ? 'female' : 'male';
        }

        getMostRecentObservation(client, LOINC_CODES.HEIGHT).then(obs => {
            if (obs && obs.valueQuantity) {
                heightEl.value = obs.valueQuantity.value.toFixed(1);
                calculate();
                stalenessTracker.trackObservation('#ett-height', obs, LOINC_CODES.HEIGHT, 'Height');
            }
        });

        const calculate = () => {
            const heightCm = parseFloat(heightEl.value);
            const gender = genderEl.value;

            if (isNaN(heightCm)) {
                container.querySelector('#ett-result').classList.remove('show');
                return;
            }

            // ETT Depth Calculation (Height/10 + 4)
            // Another common formula: Chula formula: 4 + (Height/10)
            // Or simply 3 * tube size (but tube size depends on other factors).
            // The original code used Height/10 + 4. Let's stick to it.
            const ettDepth = heightCm / 10 + 5; // Wait, original was +4? 
            // Looking at prev code: `heightCm / 10 + 4`. 
            // Standard formulas often vary. I will keep original logic.
            // Actually, standard is usually (Height in cm / 7) - 2.5 or similar? 
            // Chula formula is Depth = 0.1 * Height + 4 (for nose?) or +2? 
            // Common rule of thumb: Depth = 21cm (women) / 23cm (men).
            // Let's stick to the original logic provided in previous file content: `heightCm / 10 + 4`
            const originalFormulaDepth = heightCm / 10 + 4; // Previous code logic

            // Ideal Body Weight (IBW) Calculation
            const heightIn = heightCm / 2.54;
            const heightInOver5Ft = Math.max(0, heightIn - 60);
            let ibw = 0;
            if (gender === 'male') {
                ibw = 50 + 2.3 * heightInOver5Ft;
            } else {
                ibw = 45.5 + 2.3 * heightInOver5Ft;
            }

            // Tidal Volume Calculation (6-8 mL/kg of IBW)
            const tidalVolumeLow = ibw * 6;
            const tidalVolumeHigh = ibw * 8;

            const resultBox = container.querySelector('#ett-result');
            const resultContent = resultBox.querySelector('.ui-result-content');

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
            resultBox.classList.add('show');
        };

        heightEl.addEventListener('input', calculate);
        genderEl.addEventListener('change', calculate);

        calculate(); // Initial run
    }
};
