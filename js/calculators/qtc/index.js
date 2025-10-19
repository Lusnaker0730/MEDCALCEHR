// js/calculators/qtc.js
import { getMostRecentObservation } from '../../utils.js';

export const qtc = {
    id: 'qtc',
    title: 'Corrected QT Interval (QTc)',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <div class="input-group">
                <label for="qtc-qt">QT Interval (ms):</label>
                <input type="number" id="qtc-qt" placeholder="e.g., 400">
            </div>
            <div class="input-group">
                <label for="qtc-hr">Heart Rate (bpm):</label>
                <input type="number" id="qtc-hr" placeholder="loading...">
            </div>
            <div class="input-group">
                <label for="qtc-formula">Formula:</label>
                <select id="qtc-formula">
                    <option value="bazett">Bazett</option>
                    <option value="fridericia">Fridericia</option>
                    <option value="hodges">Hodges</option>
                    <option value="framingham">Framingham</option>
                </select>
            </div>
            <button id="calculate-qtc">Calculate</button>
            <div id="qtc-result" class="result" style="display:none;"></div>
            
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
    initialize: function(client) {
        getMostRecentObservation(client, '8867-4').then(obs => {
            if (obs) document.getElementById('qtc-hr').value = obs.valueQuantity.value.toFixed(0);
        });

        document.getElementById('calculate-qtc').addEventListener('click', () => {
            const qt = parseFloat(document.getElementById('qtc-qt').value);
            const hr = parseFloat(document.getElementById('qtc-hr').value);
            const formula = document.getElementById('qtc-formula').value;
            const resultEl = document.getElementById('qtc-result');

            if (qt > 0 && hr > 0) {
                const rr = 60 / hr;
                let qtcValue;
                switch(formula) {
                    case 'bazett':
                        qtcValue = qt / Math.sqrt(rr);
                        break;
                    case 'fridericia':
                        qtcValue = qt / Math.cbrt(rr);
                        break;
                    case 'hodges':
                        qtcValue = qt + 1.75 * (hr - 60);
                        break;
                    case 'framingham':
                        qtcValue = qt + 154 * (1 - rr);
                        break;
                }
                resultEl.innerHTML = `<p>QTc (${formula}): ${qtcValue.toFixed(0)} ms</p>`;
                resultEl.style.display = 'block';
            } else {
                resultEl.innerText = 'Please enter valid QT and Heart Rate values.';
                resultEl.style.display = 'block';
            }
        });
    }
};

