// js/calculators/qtc.js
import { getMostRecentObservation } from '../../utils.js';

export const qtc = {
    id: 'qtc',
    title: 'Corrected QT Interval (QTc)',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">Calculates corrected QT interval using various formulas to assess risk of arrhythmias.</p>
            </div>
            
            <div class="section">
                <div class="section-title">
                    <span>Measurements</span>
                </div>
                <div class="input-row">
                    <label for="qtc-qt">QT Interval</label>
                    <div class="input-with-unit">
                        <input type="number" id="qtc-qt" placeholder="e.g., 400">
                        <span>ms</span>
                    </div>
                </div>
                <div class="input-row">
                    <label for="qtc-hr">Heart Rate</label>
                    <div class="input-with-unit">
                        <input type="number" id="qtc-hr" placeholder="loading...">
                        <span>bpm</span>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">
                    <span>Correction Formula</span>
                </div>
                <div class="radio-group">
                    <label class="radio-option">
                        <input type="radio" name="qtc-formula" value="bazett" checked>
                        <span>Bazett (most common)</span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="qtc-formula" value="fridericia">
                        <span>Fridericia (better at extreme HR)</span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="qtc-formula" value="hodges">
                        <span>Hodges (linear correction)</span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="qtc-formula" value="framingham">
                        <span>Framingham</span>
                    </label>
                </div>
            </div>
            
            <div class="result-container" id="qtc-result" style="display:none;"></div>
            
            <div class="formula-reference" style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                <h4 style="margin-top: 0;">Formulas</h4>
                <p style="margin-bottom: 10px;"><strong>Note:</strong> RR interval = 60 / Heart Rate (in seconds)</p>
                
                <div style="margin-bottom: 15px;">
                    <strong>Bazett Formula:</strong>
                    <div style="margin-left: 20px; margin-top: 5px;">
                        QTc = QT / √RR
                    </div>
                    <div style="margin-left: 20px; font-size: 0.9em; color: #666;">
                        Most commonly used; overcorrects at high HR and undercorrects at low HR
                    </div>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <strong>Fridericia Formula:</strong>
                    <div style="margin-left: 20px; margin-top: 5px;">
                        QTc = QT / ∛RR
                    </div>
                    <div style="margin-left: 20px; font-size: 0.9em; color: #666;">
                        More accurate at extremes of heart rate
                    </div>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <strong>Hodges Formula:</strong>
                    <div style="margin-left: 20px; margin-top: 5px;">
                        QTc = QT + 1.75 × (HR - 60)
                    </div>
                    <div style="margin-left: 20px; font-size: 0.9em; color: #666;">
                        Linear correction based on heart rate
                    </div>
                </div>
                
                <div style="margin-bottom: 0;">
                    <strong>Framingham Formula:</strong>
                    <div style="margin-left: 20px; margin-top: 5px;">
                        QTc = QT + 154 × (1 - RR)
                    </div>
                    <div style="margin-left: 20px; font-size: 0.9em; color: #666;">
                        Derived from the Framingham Heart Study
                    </div>
                </div>
                
                <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #dee2e6;">
                    <strong>Normal Values:</strong>
                    <ul style="margin: 5px 0 0 20px;">
                        <li>Men: QTc &lt; 450 ms</li>
                        <li>Women: QTc &lt; 460 ms</li>
                        <li>Prolonged: &gt; 500 ms (increased risk of arrhythmias)</li>
                    </ul>
                </div>
            </div>
        `;
    },
    initialize: function (client) {
        const container = document.querySelector('#calculator-container') || document.body;

        // Calculate function
        const calculate = () => {
            const qt = parseFloat(container.querySelector('#qtc-qt').value);
            const hr = parseFloat(container.querySelector('#qtc-hr').value);
            const formulaRadio = container.querySelector('input[name="qtc-formula"]:checked');
            const formula = formulaRadio ? formulaRadio.value : 'bazett';
            const resultEl = container.querySelector('#qtc-result');

            if (qt > 0 && hr > 0) {
                const rr = 60 / hr;
                let qtcValue;
                let formulaName;

                switch (formula) {
                    case 'bazett':
                        qtcValue = qt / Math.sqrt(rr);
                        formulaName = 'Bazett';
                        break;
                    case 'fridericia':
                        qtcValue = qt / Math.cbrt(rr);
                        formulaName = 'Fridericia';
                        break;
                    case 'hodges':
                        qtcValue = qt + 1.75 * (hr - 60);
                        formulaName = 'Hodges';
                        break;
                    case 'framingham':
                        qtcValue = qt + 154 * (1 - rr);
                        formulaName = 'Framingham';
                        break;
                }

                // Determine risk level
                let riskClass = 'low';
                let riskText = 'Normal';
                if (qtcValue > 500) {
                    riskClass = 'high';
                    riskText = 'Prolonged - Increased arrhythmia risk';
                } else if (qtcValue > 460) {
                    riskClass = 'moderate';
                    riskText = 'Borderline prolonged';
                }

                resultEl.innerHTML = `
                    <div class="result-header">
                        <h4>QTc Results (${formulaName})</h4>
                    </div>
                    
                    <div class="result-score">
                        <span class="result-score-value">${qtcValue.toFixed(0)}</span>
                        <span class="result-score-unit">ms</span>
                    </div>
                    
                    <div class="severity-indicator ${riskClass} mt-20">
                        <span class="severity-indicator-text">${riskText}</span>
                    </div>
                    
                    <div class="alert ${riskClass === 'high' ? 'warning' : 'info'} mt-20">
                        <span class="alert-icon">${riskClass === 'high' ? '⚠️' : 'ℹ️'}</span>
                        <div class="alert-content">
                            <p>${riskClass === 'high' ? 'QTc >500ms significantly increases risk of Torsades de Pointes and sudden cardiac death.' : 'Normal: Men <450ms, Women <460ms'}</p>
                        </div>
                    </div>
                `;
                resultEl.style.display = 'block';
                resultEl.classList.add('show');
            }
        };

        // Auto-populate heart rate from FHIR
        getMostRecentObservation(client, '8867-4').then(obs => {
            if (obs && obs.valueQuantity) {
                container.querySelector('#qtc-hr').value = obs.valueQuantity.value.toFixed(0);
                calculate();
            }
        });

        // Add visual feedback for radio options
        const radioOptions = container.querySelectorAll('.radio-option');
        radioOptions.forEach(option => {
            option.addEventListener('click', function () {
                const radio = this.querySelector('input[type="radio"]');
                const group = radio.name;

                container.querySelectorAll(`input[name="${group}"]`).forEach(r => {
                    r.parentElement.classList.remove('selected');
                });

                this.classList.add('selected');
                radio.checked = true;
                calculate();
            });
        });

        // Initialize selected state
        radioOptions.forEach(option => {
            const radio = option.querySelector('input[type="radio"]');
            if (radio.checked) {
                option.classList.add('selected');
            }
        });

        // Auto-calculate on input changes
        container.querySelector('#qtc-qt').addEventListener('input', calculate);
        container.querySelector('#qtc-hr').addEventListener('input', calculate);

        // Initial calculation
        calculate();
    }
};
