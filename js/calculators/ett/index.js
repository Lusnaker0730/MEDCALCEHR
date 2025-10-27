import { getMostRecentObservation } from '../../utils.js';

export const ett = {
    id: 'ett',
    title: 'Endotracheal Tube (ETT) Depth and Tidal Volume Calculator',
    description:
        'Calculates estimated ETT depth and tidal volume based on patient height and gender.',
    generateHTML: function () {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <div class="input-group">
                <label>Height (cm)</label>
                <input type="number" id="ett-height">
            </div>
             <div class="input-group">
                <label>Gender</label>
                <select id="ett-gender">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                </select>
            </div>
            <button id="calculate-ett">Calculate</button>
            <div id="ett-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function (client, patient, container) {
        const heightEl = container.querySelector('#ett-height');
        const genderEl = container.querySelector('#ett-gender');
        genderEl.value = patient.gender;

        getMostRecentObservation(client, '8302-2').then(obs => {
            // Height
            if (obs && obs.valueQuantity) {
                heightEl.value = obs.valueQuantity.value.toFixed(1);
            }
        });

        container.querySelector('#calculate-ett').addEventListener('click', () => {
            const heightCm = parseFloat(heightEl.value);
            const gender = genderEl.value;

            if (isNaN(heightCm)) {
                alert('Please enter patient height.');
                return;
            }

            // ETT Depth Calculation (Height/10 + 4)
            const ettDepth = heightCm / 10 + 4;

            // Ideal Body Weight (IBW) Calculation
            const heightIn = heightCm / 2.54;
            const heightInOver5Ft = heightIn > 60 ? heightIn - 60 : 0;
            let ibw = 0;
            if (gender === 'male') {
                ibw = 50 + 2.3 * heightInOver5Ft;
            } else {
                ibw = 45.5 + 2.3 * heightInOver5Ft;
            }

            // Tidal Volume Calculation (6-8 mL/kg of IBW)
            const tidalVolumeLow = ibw * 6;
            const tidalVolumeHigh = ibw * 8;

            container.querySelector('#ett-result').innerHTML = `
                <p>Estimated ETT Depth at lips: ${ettDepth.toFixed(1)} cm</p>
                <p>Ideal Body Weight: ${ibw.toFixed(1)} kg</p>
                <p>Tidal Volume Range (6-8 mL/kg): ${tidalVolumeLow.toFixed(0)} - ${tidalVolumeHigh.toFixed(0)} mL</p>
            `;
            container.querySelector('#ett-result').style.display = 'block';
        });
    }
};
