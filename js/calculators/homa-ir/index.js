// js/calculators/homa-ir.js
import { getMostRecentObservation, createUnitSelector, initializeUnitConversion, getValueInStandardUnit } from '../../utils.js';

export const homaIr = {
    id: 'homa-ir',
    title: 'HOMA-IR (Homeostatic Model Assessment for Insulin Resistance)',
    description: 'Approximates insulin resistance.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p>${this.description}</p>
            <div class="input-group">
                <label for="homa-glucose">Fasting Glucose:</label>
                ${createUnitSelector('homa-glucose', 'glucose', ['mg/dL', 'mmol/L'], 'mg/dL')}
            </div>
            <div class="input-group">
                <label for="homa-insulin">Fasting Insulin (µU/mL):</label>
                <input type="number" id="homa-insulin" placeholder="loading...">
            </div>
            <div id="homa-ir-result" class="result" style="display:none;"></div>
            
            <div class="formula-section">
                <h4 class="formula-title">
                    <span class="formula-icon">📐</span>
                    FORMULA
                </h4>
                
                <div class="formula-box">
                    <div class="formula-content">
                        <div class="formula-equation">
                            HOMA-IR = <span class="formula-fraction">
                                <span class="formula-numerator">Fasting Glucose (mg/dL) × Fasting Insulin (μU/mL)</span>
                                <span class="formula-denominator">405</span>
                            </span>
                        </div>
                        
                        <div class="formula-notes">
                            <h5>Interpretation:</h5>
                            <ul>
                                <li><strong>&lt;1.9:</strong> Optimal insulin sensitivity</li>
                                <li><strong>1.9–2.9:</strong> Early insulin resistance is likely</li>
                                <li><strong>&gt;2.9:</strong> High likelihood of insulin resistance</li>
                            </ul>
                        </div>
                    </div>
                </div>
                
                <h4 class="formula-title" style="margin-top: 30px;">
                    <span class="formula-icon">📚</span>
                    REFERENCE
                </h4>
                
                <div class="reference-box">
                    <div class="reference-content">
                        <p class="reference-citation">
                            Matthews DR, Hosker JP, Rudenski AS, Naylor BA, Treacher DF, Turner RC. 
                            <strong>Homeostasis model assessment: insulin resistance and beta-cell function from fasting plasma glucose and insulin concentrations in man.</strong>
                            <em>Diabetologia.</em> 1985 Jul;28(7):412-9.
                        </p>
                        <div class="reference-links">
                            <a href="https://doi.org/10.1007/BF00280883" target="_blank" rel="noopener noreferrer" class="reference-link">
                                <span class="link-icon">🔗</span>
                                DOI: 10.1007/BF00280883
                            </a>
                            <a href="https://pubmed.ncbi.nlm.nih.gov/3899825/" target="_blank" rel="noopener noreferrer" class="reference-link">
                                <span class="link-icon">📖</span>
                                PubMed: 3899825
                            </a>
                        </div>
                        <div class="reference-abstract">
                            <h5>Abstract Summary:</h5>
                            <p>The steady-state basal plasma glucose and insulin concentrations are determined by their interaction in a feedback loop. The homeostasis model assessment (HOMA) allows quantitative assessment of insulin resistance and beta-cell function from fasting glucose and insulin values. The estimate of insulin resistance obtained by HOMA correlated with estimates from euglycaemic clamp (Rs = 0.88, p &lt; 0.0001) and other gold standard measures.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },
    initialize: function(client, patient, container) {
        const insulinInput = container.querySelector('#homa-insulin');
        const resultEl = container.querySelector('#homa-ir-result');

        const calculateAndUpdate = () => {
            const glucoseMgDl = getValueInStandardUnit(container, 'homa-glucose', 'mg/dL');
            const insulin = parseFloat(insulinInput.value);

            if (glucoseMgDl > 0 && insulin > 0) {
                const homaIrScore = (glucoseMgDl * insulin) / 405;
                const glucoseMmol = glucoseMgDl * 0.0555;
                
                let interpretation = '';
                let statusColor = '';
                let status = '';
                
                if (homaIrScore > 2.9) {
                    interpretation = 'High likelihood of insulin resistance.';
                    status = 'Insulin Resistant';
                    statusColor = '#f44336';
                } else if (homaIrScore > 1.9) {
                    interpretation = 'Early insulin resistance is likely.';
                    status = 'Early Resistance';
                    statusColor = '#ff9800';
                } else {
                    interpretation = 'Optimal insulin sensitivity.';
                    status = 'Optimal Sensitivity';
                    statusColor = '#4caf50';
                }
                
                resultEl.innerHTML = `
                    <div style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; margin-bottom: 15px;">
                        <div style="font-size: 1.1em; margin-bottom: 8px;">HOMA-IR Score:</div>
                        <div style="font-size: 2.2em; font-weight: bold;">${homaIrScore.toFixed(2)}</div>
                        <div style="margin-top: 10px; padding: 8px; background: ${statusColor}; border-radius: 5px; font-size: 0.95em;">
                            ${status}
                        </div>
                    </div>
                    
                    <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                        <h4 style="margin: 0 0 10px 0; font-size: 1em;">Calculation Details:</h4>
                        <div style="font-size: 0.9em; line-height: 1.6;">
                            <div><strong>Fasting Glucose:</strong> ${glucoseMgDl.toFixed(0)} mg/dL (${glucoseMmol.toFixed(1)} mmol/L)</div>
                            <div><strong>Fasting Insulin:</strong> ${insulin.toFixed(1)} µU/mL</div>
                            <div><strong>Formula:</strong> (Glucose × Insulin) / 405</div>
                        </div>
                    </div>
                    
                    <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 10px;">
                        <h4 style="margin: 0 0 10px 0; font-size: 1em;">Interpretation:</h4>
                        <div style="font-size: 0.9em;">
                            <div style="padding: 5px 0;"><strong>&lt; 1.9:</strong> Optimal insulin sensitivity</div>
                            <div style="padding: 5px 0;"><strong>1.9 - 2.9:</strong> Early insulin resistance</div>
                            <div style="padding: 5px 0;"><strong>&gt; 2.9:</strong> High likelihood of insulin resistance</div>
                        </div>
                    </div>
                    
                    <div style="background: ${homaIrScore > 1.9 ? '#fff3cd' : '#e8f5e9'}; padding: 12px; border-radius: 6px; font-size: 0.9em;">
                        <strong>${homaIrScore > 1.9 ? '⚠️' : '✓'} ${interpretation}</strong>
                    </div>
                `;
                resultEl.style.display = 'block';
            } else {
                resultEl.style.display = 'none';
            }
        };

        // Initialize unit conversion
        initializeUnitConversion(container, 'homa-glucose', calculateAndUpdate);

        // Auto-populate from FHIR
        getMostRecentObservation(client, '2339-0').then(obs => { // Fasting Glucose
            if (obs && obs.valueQuantity) {
                const glucoseInput = container.querySelector('#homa-glucose');
                if (glucoseInput) {
                    glucoseInput.value = obs.valueQuantity.value.toFixed(0);
                }
            }
            calculateAndUpdate();
        });
        
        getMostRecentObservation(client, '20448-7').then(obs => { // Insulin
            if (obs && obs.valueQuantity) {
                insulinInput.value = obs.valueQuantity.value.toFixed(1);
            } else {
                insulinInput.placeholder = 'e.g., 10';
            }
            calculateAndUpdate();
        });

        // Event listener
        insulinInput.addEventListener('input', calculateAndUpdate);
        
        // Initial calculation
        calculateAndUpdate();
    }
};
