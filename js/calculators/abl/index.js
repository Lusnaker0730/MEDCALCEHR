import { getMostRecentObservation } from '../../utils.js';

export const abl = {
    id: 'abl',
    title: 'Maximum Allowable Blood Loss (ABL) Without Transfusion',
    description:
        'Calculates the allowable blood loss for a patient before a transfusion may be indicated.',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>

            <div class="section">
                <div class="section-title">Patient Category</div>
                <select id="abl-age-category" class="form-select">
                    <option value="75">Adult man</option>
                    <option value="65">Adult woman</option>
                    <option value="80">Infant</option>
                    <option value="85">Neonate</option>
                    <option value="96">Premature neonate</option>
                </select>
                <small class="help-text">Blood volume (mL/kg) varies by age and sex</small>
            </div>

            <div class="section">
                <div class="section-title">Weight</div>
                <div class="input-with-unit">
                    <input type="number" id="abl-weight" placeholder="e.g., 70">
                    <span>kg</span>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Hemoglobin (initial)</div>
                <div class="input-with-unit">
                    <input type="number" id="abl-hgb-initial" placeholder="e.g., 14" step="0.1">
                    <span>g/dL</span>
                </div>
            </div>

            <div class="section">
                <div class="section-title">Hemoglobin (final/target)</div>
                <div class="input-with-unit">
                    <input type="number" id="abl-hgb-final" placeholder="e.g., 7" step="0.1">
                    <span>g/dL</span>
                </div>
            </div>

            <div id="abl-result" class="result-container"></div>

            <div class="info-section">
                <h4>📐 Formulas</h4>
                <div class="formula-box">
                    <p><strong>Estimated Blood Volume (EBV):</strong></p>
                    <p>EBV = Weight (kg) × Blood Volume (mL/kg)</p>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                        <li>Adult man: 75 mL/kg</li>
                        <li>Adult woman: 65 mL/kg</li>
                        <li>Infant: 80 mL/kg</li>
                        <li>Neonate: 85 mL/kg</li>
                        <li>Premature neonate: 96 mL/kg</li>
                    </ul>
                </div>
                <div class="formula-box">
                    <p><strong>Allowable Blood Loss (ABL):</strong></p>
                    <p>ABL = EBV × (Hgb<sub>initial</sub> - Hgb<sub>final</sub>) / Hgb<sub>average</sub></p>
                    <p style="margin-top: 5px;">where Hgb<sub>average</sub> = (Hgb<sub>initial</sub> + Hgb<sub>final</sub>) / 2</p>
                </div>
            </div>

            <div class="info-section">
                <h4>📚 Reference</h4>
                <p>Gross, J. B. (1983). Estimating Allowable Blood Loss: Corrected for Dilution. <em>Anesthesiology</em>, 58(3), 277-280.</p>
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        const weightEl = container.querySelector('#abl-weight');
        const hgbInitialEl = container.querySelector('#abl-hgb-initial');
        const hgbFinalEl = container.querySelector('#abl-hgb-final');
        const ageCategoryEl = container.querySelector('#abl-age-category');
        const resultEl = container.querySelector('#abl-result');

        const calculate = () => {
            const weight = parseFloat(weightEl.value);
            const hgbInitial = parseFloat(hgbInitialEl.value);
            const hgbFinal = parseFloat(hgbFinalEl.value);
            const avgBloodVolume = parseFloat(ageCategoryEl.value);

            if (isNaN(weight) || isNaN(hgbInitial) || isNaN(hgbFinal) || isNaN(avgBloodVolume)) {
                resultEl.classList.remove('show');
                return;
            }

            if (hgbInitial <= hgbFinal) {
                resultEl.innerHTML = `
                    <div class="alert error">
                        <strong>⚠️ Error</strong>
                        <p>Initial hemoglobin must be greater than final hemoglobin.</p>
                    </div>
                `;
                resultEl.classList.add('show');
                return;
            }

            const ebv = weight * avgBloodVolume; // Estimated Blood Volume in mL
            const hgbAvg = (hgbInitial + hgbFinal) / 2;
            const ablValue = (ebv * (hgbInitial - hgbFinal)) / hgbAvg;

            resultEl.innerHTML = `
                <div class="result-header">ABL Results</div>
                <div class="result-score">
                    <span style="font-size: 3.5rem; font-weight: bold; color: #667eea;">${ablValue.toFixed(1)}</span>
                    <span style="font-size: 1.2rem; color: #718096; margin-left: 10px;">mL</span>
                </div>
                <div class="result-label">Maximum Allowable Blood Loss</div>
                <div class="result-item" style="margin-top: 20px;">
                    <span class="label">Estimated Blood Volume (EBV)</span>
                    <span class="value">${ebv.toFixed(0)} mL</span>
                </div>
                <div class="result-item">
                    <span class="label">Average Hemoglobin</span>
                    <span class="value">${hgbAvg.toFixed(1)} g/dL</span>
                </div>
            `;
            resultEl.classList.add('show');
        };

        // Auto-populate from FHIR
        getMostRecentObservation(client, '29463-7').then(obs => {
            // Weight
            if (obs && obs.valueQuantity) {
                weightEl.value = obs.valueQuantity.value.toFixed(1);
            }
            calculate();
        });
        getMostRecentObservation(client, '718-7').then(obs => {
            // Hemoglobin
            if (obs && obs.valueQuantity) {
                hgbInitialEl.value = obs.valueQuantity.value.toFixed(1);
            }
            calculate();
        });

        // Pre-select category based on patient data
        if (patient) {
            const age = new Date().getFullYear() - new Date(patient.birthDate).getFullYear();
            if (age > 18) {
                // Adult
                ageCategoryEl.value = patient.gender === 'male' ? '75' : '65';
            }
            // Note: More complex logic would be needed to differentiate infant, neonate, etc.
            // This is a simple approximation.
        }

        // Add event listeners for auto-calculation
        weightEl.addEventListener('input', calculate);
        hgbInitialEl.addEventListener('input', calculate);
        hgbFinalEl.addEventListener('input', calculate);
        ageCategoryEl.addEventListener('change', calculate);

        // Initial calculation
        calculate();
    }
};
