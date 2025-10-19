// js/calculators/homa-ir.js
import { getMostRecentObservation } from '../../utils.js';

export const homaIr = {
    id: 'homa-ir',
    title: 'HOMA-IR (Homeostatic Model Assessment for Insulin Resistance)',
    description: 'Approximates insulin resistance.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p>${this.description}</p>
            <div class="input-group">
                <label for="homa-glucose">Fasting Glucose (mg/dL):</label>
                <input type="number" id="homa-glucose" placeholder="loading...">
            </div>
            <div class="input-group">
                <label for="homa-insulin">Fasting Insulin (µU/mL):</label>
                <input type="number" id="homa-insulin" placeholder="loading...">
            </div>
            <button id="calculate-homa-ir">Calculate HOMA-IR</button>
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
    initialize: function(client) {
        // LOINC: Fasting Glucose: 2339-0, Insulin: 20448-7
        getMostRecentObservation(client, '2339-0').then(obs => {
            if(obs) document.getElementById('homa-glucose').value = obs.valueQuantity.value.toFixed(0);
            else document.getElementById('homa-glucose').placeholder = 'e.g., 95';
        });
        getMostRecentObservation(client, '20448-7').then(obs => {
            if(obs) document.getElementById('homa-insulin').value = obs.valueQuantity.value.toFixed(1);
            else document.getElementById('homa-insulin').placeholder = 'e.g., 10';
        });

        document.getElementById('calculate-homa-ir').addEventListener('click', () => {
            const glucose = parseFloat(document.getElementById('homa-glucose').value);
            const insulin = parseFloat(document.getElementById('homa-insulin').value);
            const resultEl = document.getElementById('homa-ir-result');

            if (glucose > 0 && insulin > 0) {
                const homaIrScore = (glucose * insulin) / 405;
                let interpretation = '';
                if (homaIrScore > 2.9) {
                    interpretation = 'High likelihood of insulin resistance.';
                } else if (homaIrScore > 1.9) {
                    interpretation = 'Early insulin resistance is likely.';
                } else {
                    interpretation = 'Optimal insulin sensitivity.';
                }
                
                resultEl.innerHTML = `
                    <p>HOMA-IR Score: ${homaIrScore.toFixed(2)}</p>
                    <p><strong>Interpretation:</strong> ${interpretation}</p>
                `;
                resultEl.style.display = 'block';
            } else {
                resultEl.innerText = 'Please enter valid glucose and insulin values.';
                resultEl.style.display = 'block';
            }
        });
    }
};
