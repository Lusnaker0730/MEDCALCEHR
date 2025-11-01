// js/calculators/map.js
import { getMostRecentObservation } from '../../utils.js';

export const map = {
    id: 'map',
    title: 'Mean Arterial Pressure (MAP)',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">Calculates the average arterial pressure during one cardiac cycle, important for organ perfusion assessment.</p>
            </div>
            
            <div class="section">
                <div class="section-title">
                    <span>Blood Pressure Measurements</span>
                </div>
                <div class="input-row">
                    <label for="map-sbp">Systolic BP</label>
                    <div class="input-with-unit">
                        <input type="number" id="map-sbp" placeholder="e.g., 120">
                        <span>mmHg</span>
                    </div>
                </div>
                <div class="input-row">
                    <label for="map-dbp">Diastolic BP</label>
                    <div class="input-with-unit">
                        <input type="number" id="map-dbp" placeholder="e.g., 80">
                        <span>mmHg</span>
                    </div>
                </div>
            </div>
            
            <div class="result-container" id="map-result" style="display:none;"></div>

            <!-- Formula Section -->
            <div class="formula-section">
                <h4>📐 Mean Arterial Pressure (MAP) Formula</h4>
                <p style="font-size: 0.9em; color: #666; margin-bottom: 15px;">The Mean Arterial Pressure represents the average pressure in the arterial system during one complete cardiac cycle.</p>
                
                <div style="background: #f5f7fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                    <h5 style="margin-top: 0; color: #333;">Primary Formula:</h5>
                    <p style="font-family: monospace; background: white; padding: 15px; border-radius: 5px; overflow-x: auto; text-align: center; font-size: 1.1em;">
                        MAP = DBP + (SBP - DBP) / 3
                    </p>
                    <p style="font-size: 0.85em; color: #555; margin-top: 10px;">
                        <strong>Or equivalently:</strong>
                    </p>
                    <p style="font-family: monospace; background: white; padding: 15px; border-radius: 5px; overflow-x: auto; text-align: center; font-size: 1.1em;">
                        MAP = (SBP + 2×DBP) / 3
                    </p>
                </div>

                <!-- Explanation -->
                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #2196F3;">
                    <h5 style="margin-top: 0; color: #1976D2;">💡 Formula Breakdown:</h5>
                    <div style="font-size: 0.9em; color: #333;">
                        <p style="margin: 8px 0;"><strong>SBP:</strong> Systolic Blood Pressure (mmHg) - peak pressure</p>
                        <p style="margin: 8px 0;"><strong>DBP:</strong> Diastolic Blood Pressure (mmHg) - minimum pressure</p>
                        <p style="margin: 8px 0;"><strong>Weight Factor:</strong> The diastolic pressure is weighted 2/3, and pulse pressure 1/3</p>
                        <p style="margin: 8px 0;"><strong>Rationale:</strong> The heart spends more time in diastole than systole (~2:1 ratio), so diastolic pressure contributes more to average pressure</p>
                    </div>
                </div>

                <!-- Examples -->
                <div style="background: #f1f8e9; padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid #c5e1a5;">
                    <h5 style="margin-top: 0; color: #33691e;">📋 Examples:</h5>
                    <ul style="margin: 10px 0; padding-left: 20px; font-size: 0.9em;">
                        <li><strong>Normal (120/80):</strong> (120 + 2×80) / 3 = 280 / 3 = <strong>93.3 mmHg</strong></li>
                        <li><strong>Elevated (160/90):</strong> (160 + 2×90) / 3 = 340 / 3 = <strong>113.3 mmHg</strong></li>
                        <li><strong>Low (100/60):</strong> (100 + 2×60) / 3 = 220 / 3 = <strong>73.3 mmHg</strong></li>
                    </ul>
                </div>

                <!-- Clinical Significance -->
                <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #f39c12;">
                    <h5 style="margin-top: 0; color: #d68910;">📌 Clinical Significance:</h5>
                    <ul style="margin: 10px 0; padding-left: 20px; font-size: 0.85em; color: #555;">
                        <li><strong>Normal Range:</strong> 70-100 mmHg</li>
                        <li><strong>&lt;60 mmHg:</strong> Risk of insufficient tissue perfusion (hypotension)</li>
                        <li><strong>&gt;100 mmHg:</strong> Sustained hypertension requiring management</li>
                        <li><strong>Clinical Use:</strong> Used to assess organ perfusion pressure and hemodynamic status</li>
                        <li><strong>Perfusion Pressure:</strong> Important for renal perfusion (critical threshold ~65 mmHg)</li>
                        <li><strong>Shock Detection:</strong> MAP &lt;65 mmHg often indicates tissue hypoperfusion and shock</li>
                    </ul>
                </div>

                <!-- Important Notes -->
                <div style="background: #fef5e7; padding: 15px; border-radius: 8px; border-left: 4px solid #f39c12;">
                    <h5 style="margin-top: 0; color: #d68910;">⚠️ Important Notes:</h5>
                    <ul style="margin: 10px 0; padding-left: 20px; font-size: 0.85em; color: #555;">
                        <li>MAP requires valid SBP ≥ DBP relationship</li>
                        <li>More accurate calculation methods exist for specific populations (elderly, athletes)</li>
                        <li>This is the most commonly used formula in clinical practice</li>
                        <li>Should be interpreted with other vital signs and clinical context</li>
                    </ul>
                </div>
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        const sbpInput = container.querySelector('#map-sbp');
        const dbpInput = container.querySelector('#map-dbp');
        const resultEl = container.querySelector('#map-result');

        // LOINC 85354-9 for Blood Pressure Panel
        if (client) {
            getMostRecentObservation(client, '85354-9')
                .then(bpPanel => {
                    if (bpPanel && bpPanel.component) {
                        const sbpComp = bpPanel.component.find(
                            c => c.code.coding[0].code === '8480-6'
                        ); // Systolic
                        const dbpComp = bpPanel.component.find(
                            c => c.code.coding[0].code === '8462-4'
                        ); // Diastolic

                        if (sbpComp && sbpComp.valueQuantity) {
                            sbpInput.value = sbpComp.valueQuantity.value.toFixed(0);
                        }

                        if (dbpComp && dbpComp.valueQuantity) {
                            dbpInput.value = dbpComp.valueQuantity.value.toFixed(0);
                        }

                        calculateAndUpdate();
                    }
                })
                .catch(err => console.log('BP data not available'));
        }

        const calculateAndUpdate = () => {
            const sbp = parseFloat(sbpInput.value);
            const dbp = parseFloat(dbpInput.value);

            if (!sbp || !dbp || sbp <= 0 || dbp <= 0) {
                resultEl.style.display = 'none';
                return;
            }

            if (sbp < dbp) {
                resultEl.innerHTML =
                    '<p style="color: red;"><strong>⚠️ Error:</strong> Systolic BP must be ≥ Diastolic BP</p>';
                resultEl.style.display = 'block';
                return;
            }

            const mapCalc = dbp + (sbp - dbp) / 3;

            // Determine clinical status
            let status = '';
            if (mapCalc < 60) {
                status =
                    '<span style="color: #d32f2f; font-weight: bold;">⚠️ Low (Hypotension)</span>';
            } else if (mapCalc < 70) {
                status = '<span style="color: #f57c00; font-weight: bold;">⚠️ Below Normal</span>';
            } else if (mapCalc <= 100) {
                status = '<span style="color: #388e3c; font-weight: bold;">✓ Normal</span>';
            } else {
                status =
                    '<span style="color: #d32f2f; font-weight: bold;">⚠️ Elevated (Hypertension)</span>';
            }

            // Determine severity class
            let severityClass = 'low';
            let severityText = 'Normal';
            if (mapCalc < 60) {
                severityClass = 'high';
                severityText = 'Critically Low (Shock Risk)';
            } else if (mapCalc < 70) {
                severityClass = 'moderate';
                severityText = 'Below Normal';
            } else if (mapCalc <= 100) {
                severityClass = 'low';
                severityText = 'Normal';
            } else {
                severityClass = 'high';
                severityText = 'Elevated (Hypertension)';
            }
            
            resultEl.innerHTML = `
                <div class="result-header">
                    <h4>MAP Results</h4>
                </div>
                
                <div class="result-score">
                    <span class="result-score-value">${mapCalc.toFixed(1)}</span>
                    <span class="result-score-unit">mmHg</span>
                </div>
                
                <div class="severity-indicator ${severityClass} mt-20">
                    <span class="severity-indicator-text">${severityText}</span>
                </div>
                
                <div class="alert ${severityClass === 'high' ? 'warning' : 'info'} mt-20">
                    <span class="alert-icon">${severityClass === 'high' ? '⚠️' : 'ℹ️'}</span>
                    <div class="alert-content">
                        <p>${mapCalc < 60 ? 'MAP <60 mmHg indicates severe hypotension and risk of organ hypoperfusion.' : mapCalc > 100 ? 'Sustained MAP >100 mmHg requires management.' : 'Normal MAP (70-100 mmHg) indicates adequate organ perfusion.'}</p>
                    </div>
                </div>
            `;
            resultEl.style.display = 'block';
            resultEl.classList.add('show');
        };

        // Add event listeners for automatic calculation on input change
        sbpInput.addEventListener('input', calculateAndUpdate);
        dbpInput.addEventListener('input', calculateAndUpdate);

        // Initial calculation if both values are already set
        calculateAndUpdate();
    }
};
