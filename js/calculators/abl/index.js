import { getMostRecentObservation } from '../../utils.js';

export const abl = {
    id: 'abl',
    title: 'Maximum Allowable Blood Loss (ABL) Without Transfusion',
    description: 'Calculates the allowable blood loss for a patient before a transfusion may be indicated.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <div class="input-group">
                <label>Age</label>
                <select id="abl-age-category">
                    <option value="75">Adult man</option>
                    <option value="65">Adult woman</option>
                    <option value="80">Infant</option>
                    <option value="85">Neonate</option>
                    <option value="96">Premature neonate</option>
                </select>
            </div>
            <div class="input-group">
                <label>Weight (kg)</label>
                <input type="number" id="abl-weight">
            </div>
            <div class="input-group">
                <label>Hemoglobin (initial) (g/dL)</label>
                <input type="number" id="abl-hgb-initial">
            </div>
            <div class="input-group">
                <label>Hemoglobin (final)</label>
                <input type="number" id="abl-hgb-final">
            </div>
            <button id="calculate-abl">Calculate ABL</button>
            <div id="abl-result" class="result" style="display:none;"></div>
            <div class="references">
                <h4>Reference</h4>
                <p>Gross, J. B. (1983). Estimating Allowable Blood Loss: Corrected for Dilution. <em>Anesthesiology</em>, 58(3), 277-280.</p>
            </div>
        `;
    },
    initialize: function(client, patient, container) {
        const weightEl = container.querySelector('#abl-weight');
        const hgbInitialEl = container.querySelector('#abl-hgb-initial');
        const hgbFinalEl = container.querySelector('#abl-hgb-final');
        const ageCategoryEl = container.querySelector('#abl-age-category');
        const resultEl = container.querySelector('#abl-result');

        // Auto-populate from FHIR
        getMostRecentObservation(client, '29463-7').then(obs => { // Weight
            if (obs && obs.valueQuantity) weightEl.value = obs.valueQuantity.value.toFixed(1);
        });
        getMostRecentObservation(client, '718-7').then(obs => { // Hemoglobin
            if (obs && obs.valueQuantity) hgbInitialEl.value = obs.valueQuantity.value.toFixed(1);
        });

        // Pre-select category based on patient data
        if (patient) {
            const age = new Date().getFullYear() - new Date(patient.birthDate).getFullYear();
            if (age > 18) { // Adult
                ageCategoryEl.value = patient.gender === 'male' ? '75' : '65';
            }
            // Note: More complex logic would be needed to differentiate infant, neonate, etc.
            // This is a simple approximation.
        }

        container.querySelector('#calculate-abl').addEventListener('click', () => {
            const weight = parseFloat(weightEl.value);
            const hgbInitial = parseFloat(hgbInitialEl.value);
            const hgbFinal = parseFloat(hgbFinalEl.value);
            const avgBloodVolume = parseFloat(ageCategoryEl.value);

            if (isNaN(weight) || isNaN(hgbInitial) || isNaN(hgbFinal) || isNaN(avgBloodVolume)) {
                resultEl.innerHTML = `<p class="error">Please enter all values.</p>`;
                resultEl.style.display = 'block';
                return;
            }
            
            if (hgbInitial <= hgbFinal) {
                resultEl.innerHTML = `<p class="error">Initial hemoglobin must be greater than final hemoglobin.</p>`;
                resultEl.style.display = 'block';
                return;
            }

            const ebv = weight * avgBloodVolume; // Estimated Blood Volume in mL
            const hgbAvg = (hgbInitial + hgbFinal) / 2;
            const ablValue = ebv * (hgbInitial - hgbFinal) / hgbAvg;

            resultEl.innerHTML = `
                <div class="result-item">
                    <span class="value">${ablValue.toFixed(1)} <span class="unit">mL</span></span>
                    <span class="label">Allowable Blood Loss</span>
                </div>
                 <div class="result-item">
                    <span class="value">${ebv.toFixed(0)} <span class="unit">mL</span></span>
                    <span class="label">Estimated Blood Volume (EBV)</span>
                </div>
            `;
            resultEl.style.display = 'grid';
        });
    }
};
