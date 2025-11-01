// js/calculators/calcium-correction.js
import {
    getMostRecentObservation,
    createUnitSelector,
    initializeUnitConversion,
    getValueInStandardUnit
} from '../../utils.js';

export const calciumCorrection = {
    id: 'calcium-correction',
    title: 'Calcium Correction for Albumin',
    generateHTML: function () {
        return `
            <h3>${this.title}</h3>
            <div class="input-group">
                <label for="ca-total">Total Calcium:</label>
                ${createUnitSelector('ca-total', 'calcium', ['mg/dL', 'mmol/L'], 'mg/dL')}
            </div>
            <div class="input-group">
                <label for="ca-albumin">Albumin:</label>
                ${createUnitSelector('ca-albumin', 'albumin', ['g/dL', 'g/L'], 'g/dL')}
            </div>
            <div id="ca-result" class="result" style="display:none;"></div>
            
            <div class="formula-section">
                <h4>📐 Formula</h4>
                <div class="formula-box">
                    <div class="formula-title">Corrected Calcium (mg/dL) =</div>
                    <div class="formula-equation">
                        <span class="formula-main">Total Calcium + 0.8 × (4.0 - Albumin)</span>
                    </div>
                </div>
                
                <div class="formula-explanation">
                    <h5>📋 Explanation</h5>
                    <ul>
                        <li><strong>Normal albumin reference:</strong> 4.0 g/dL</li>
                        <li><strong>Correction factor:</strong> 0.8 mg/dL per 1 g/dL decrease in albumin</li>
                        <li><strong>Purpose:</strong> Adjusts total calcium for low albumin levels</li>
                        <li><strong>Clinical significance:</strong> Helps identify true hypocalcemia vs. low total calcium due to hypoalbuminemia</li>
                    </ul>
                </div>
                
                <div class="normal-values">
                    <h5>📊 Normal Values</h5>
                    <div class="values-grid">
                        <div class="value-item">
                            <strong>Total Calcium:</strong> 8.5-10.5 mg/dL
                        </div>
                        <div class="value-item">
                            <strong>Albumin:</strong> 3.5-5.0 g/dL
                        </div>
                        <div class="value-item">
                            <strong>Corrected Calcium:</strong> 8.5-10.5 mg/dL
                        </div>
                    </div>
                </div>
                
                <div class="clinical-note">
                    <h5>⚠️ Clinical Note</h5>
                    <p>This correction is most accurate when albumin is between 2.0-4.0 g/dL. For critically ill patients or those with severe hypoalbuminemia, consider measuring ionized calcium directly.</p>
                </div>
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        // Initialize unit conversion with auto-calculation
        const calculateAndUpdate = () => {
            const totalCalciumMgDl = getValueInStandardUnit(container, 'ca-total', 'mg/dL');
            const albuminGdl = getValueInStandardUnit(container, 'ca-albumin', 'g/dL');
            const resultEl = container.querySelector('#ca-result');

            if (totalCalciumMgDl > 0 && albuminGdl > 0) {
                const correctedCalcium = totalCalciumMgDl + 0.8 * (4.0 - albuminGdl);
                const correctedCalciumMmol = correctedCalcium * 0.2495;

                resultEl.innerHTML = `
                    <div style="padding: 15px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px;">
                        <div style="font-size: 1.1em; margin-bottom: 8px;">Corrected Calcium:</div>
                        <div style="font-size: 1.8em; font-weight: bold;">${correctedCalcium.toFixed(2)} mg/dL</div>
                        <div style="font-size: 0.95em; opacity: 0.9; margin-top: 5px;">(${correctedCalciumMmol.toFixed(2)} mmol/L)</div>
                    </div>
                    <div style="margin-top: 10px; padding: 10px; background: ${correctedCalcium < 8.5 ? '#fee' : correctedCalcium > 10.5 ? '#fef3cd' : '#e8f5e9'}; border-radius: 6px;">
                        <strong>${correctedCalcium < 8.5 ? '⚠️ Low' : correctedCalcium > 10.5 ? '⚠️ High' : '✓ Normal'}</strong>
                        <div style="font-size: 0.9em; margin-top: 5px;">Normal range: 8.5-10.5 mg/dL (2.12-2.62 mmol/L)</div>
                    </div>
                `;
                resultEl.style.display = 'block';
            } else {
                resultEl.style.display = 'none';
            }
        };

        // Initialize unit conversions with callback
        initializeUnitConversion(container, 'ca-total', calculateAndUpdate);
        initializeUnitConversion(container, 'ca-albumin', calculateAndUpdate);

        // Auto-populate from FHIR data
        getMostRecentObservation(client, '17861-6').then(obs => {
            if (obs && obs.valueQuantity) {
                const input = container.querySelector('#ca-total');
                if (input) {
                    input.value = obs.valueQuantity.value.toFixed(1);
                }
                calculateAndUpdate();
            }
        });

        getMostRecentObservation(client, '1751-7').then(obs => {
            if (obs && obs.valueQuantity) {
                const input = container.querySelector('#ca-albumin');
                if (input) {
                    input.value = obs.valueQuantity.value.toFixed(1);
                }
                calculateAndUpdate();
            }
        });

        // Initial calculation
        calculateAndUpdate();
    }
};
