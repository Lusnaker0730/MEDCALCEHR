// js/calculators/ibw.js
import { getMostRecentObservation } from '../../utils.js';

export const ibw = {
    id: 'ibw',
    title: 'Ideal & Adjusted Body Weight',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">Calculates ideal body weight (IBW) and adjusted body weight (ABW) using the Devine formula for medication dosing and clinical assessment.</p>
            </div>
            
            <div class="section">
                <div class="section-title">
                    <span>Patient Information</span>
                </div>
                
                <div class="section-subtitle">Gender</div>
                <div class="radio-group">
                    <label class="radio-option">
                        <input type="radio" name="ibw-gender" value="male" checked>
                        <span>Male</span>
                    </label>
                    <label class="radio-option">
                        <input type="radio" name="ibw-gender" value="female">
                        <span>Female</span>
                    </label>
                </div>
                
                <div class="input-row mt-15">
                    <label for="ibw-height">Height</label>
                    <div class="input-with-unit">
                        <input type="number" id="ibw-height" placeholder="loading...">
                        <span>cm</span>
                    </div>
                </div>
                <div class="input-row">
                    <label for="ibw-actual">Actual Weight</label>
                    <div class="input-with-unit">
                        <input type="number" id="ibw-actual" placeholder="loading...">
                        <span>kg</span>
                    </div>
                </div>
            </div>
            
            <div class="result-container" id="ibw-result" style="display:none;"></div>
            
            <div class="formula-section">
                <h4>📐 Formulas</h4>
                
                <div class="formula-box">
                    <h5>Ideal Body Weight (IBW) - Devine Formula</h5>
                    <div class="formula-content">
                        <div class="formula-item">
                            <strong>For Males:</strong>
                            <div class="formula-equation">IBW (kg) = 50 + 2.3 × (height in inches - 60)</div>
                        </div>
                        <div class="formula-item">
                            <strong>For Females:</strong>
                            <div class="formula-equation">IBW (kg) = 45.5 + 2.3 × (height in inches - 60)</div>
                        </div>
                    </div>
                </div>

                <div class="formula-box">
                    <h5>Adjusted Body Weight (ABW)</h5>
                    <div class="formula-content">
                        <div class="formula-item">
                            <div class="formula-equation">ABW (kg) = IBW + 0.4 × (Actual Weight - IBW)</div>
                            <div class="formula-note">
                                <strong>Note:</strong> ABW is calculated only when actual weight exceeds IBW
                            </div>
                        </div>
                    </div>
                </div>

                <div class="formula-explanation">
                    <h5>📋 Formula Components</h5>
                    <ul>
                        <li><strong>Height conversion:</strong> 1 inch = 2.54 cm</li>
                        <li><strong>Base weight:</strong> 50 kg (male) or 45.5 kg (female) for 60 inches (152.4 cm)</li>
                        <li><strong>Height adjustment:</strong> Add 2.3 kg for each inch above 60 inches</li>
                        <li><strong>ABW factor:</strong> 0.4 (40%) of the excess weight above IBW</li>
                    </ul>
                </div>

                <div class="clinical-applications">
                    <h5>🏥 Clinical Applications</h5>
                    <div class="applications-grid">
                        <div class="application-item">
                            <h6>Ideal Body Weight (IBW)</h6>
                            <ul>
                                <li>Drug dosing for medications with narrow therapeutic index</li>
                                <li>Nutritional assessment and planning</li>
                                <li>Ventilator settings (tidal volume calculation)</li>
                                <li>Estimating energy requirements</li>
                            </ul>
                        </div>
                        <div class="application-item">
                            <h6>Adjusted Body Weight (ABW)</h6>
                            <ul>
                                <li>Drug dosing in obese patients (actual weight > IBW)</li>
                                <li>Aminoglycoside dosing</li>
                                <li>Anesthetic agent dosing</li>
                                <li>More accurate than IBW alone for obese patients</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div class="clinical-note">
                    <h5>⚠️ Important Clinical Notes</h5>
                    <ul>
                        <li><strong>Limitations:</strong> IBW formulas are based on population averages and may not be appropriate for all individuals</li>
                        <li><strong>Height restriction:</strong> Devine formula is most accurate for heights > 152 cm (60 inches)</li>
                        <li><strong>Body composition:</strong> Does not account for muscle mass, body composition, or frame size</li>
                        <li><strong>Obesity:</strong> Use ABW for drug dosing in patients with actual weight > 120% of IBW</li>
                        <li><strong>Underweight:</strong> For patients below IBW, use actual body weight for dosing</li>
                        <li><strong>Alternative formulas:</strong> Consider Robinson, Miller, or Hamwi formulas for comparison</li>
                        <li><strong>Pediatric patients:</strong> These formulas are not validated for children; use age-appropriate methods</li>
                    </ul>
                </div>

                <div class="reference-info">
                    <h5>📚 References</h5>
                    <p><strong>Devine BJ.</strong> Gentamicin therapy. <em>Drug Intell Clin Pharm.</em> 1974;8:650-655.</p>
                    <p><strong>Clinical Application:</strong> The Devine formula remains the most widely used method for calculating IBW in clinical practice, particularly for drug dosing and ventilator management.</p>
                </div>
            </div>
        `;
    },
    initialize: function (client, patient) {
        const container = document.querySelector('#calculator-container') || document.body;
        const heightInput = container.querySelector('#ibw-height');
        const actualWeightInput = container.querySelector('#ibw-actual');
        const resultEl = container.querySelector('#ibw-result');
        
        // Calculate function
        const calculate = () => {
            const heightCm = parseFloat(heightInput.value);
            const genderRadio = container.querySelector('input[name="ibw-gender"]:checked');
            const isMale = genderRadio ? genderRadio.value === 'male' : true;
            const actualWeight = parseFloat(actualWeightInput.value);

            if (heightCm > 0) {
                const heightIn = heightCm / 2.54;
                let ibw = 0;
                if (heightIn > 60) {
                    if (isMale) {
                        ibw = 50 + 2.3 * (heightIn - 60);
                    } else {
                        ibw = 45.5 + 2.3 * (heightIn - 60);
                    }
                } else {
                    ibw = isMale ? 50 : 45.5;
                }

                let resultHTML = `
                    <div class="result-header">
                        <h4>Body Weight Results</h4>
                    </div>
                    
                    <div class="result-item">
                        <span class="result-item-label">Ideal Body Weight (IBW)</span>
                        <span class="result-item-value"><strong>${ibw.toFixed(1)}</strong> kg</span>
                    </div>
                `;

                if (actualWeight > 0 && actualWeight > ibw) {
                    const adjBw = ibw + 0.4 * (actualWeight - ibw);
                    const percentOver = ((actualWeight - ibw) / ibw * 100).toFixed(0);
                    resultHTML += `
                        <div class="result-item mt-15">
                            <span class="result-item-label">Adjusted Body Weight (ABW)</span>
                            <span class="result-item-value"><strong>${adjBw.toFixed(1)}</strong> kg</span>
                        </div>
                        
                        <div class="alert info mt-20">
                            <span class="alert-icon">ℹ️</span>
                            <div class="alert-content">
                                <p>Actual weight is ${percentOver}% above IBW. Use ABW for drug dosing in obese patients.</p>
                            </div>
                        </div>
                    `;
                } else if (actualWeight > 0 && actualWeight < ibw) {
                    const percentUnder = ((ibw - actualWeight) / ibw * 100).toFixed(0);
                    resultHTML += `
                        <div class="alert warning mt-20">
                            <span class="alert-icon">⚠️</span>
                            <div class="alert-content">
                                <p>Actual weight is ${percentUnder}% below IBW. Use actual body weight for drug dosing.</p>
                            </div>
                        </div>
                    `;
                } else if (actualWeight > 0) {
                    resultHTML += `
                        <div class="alert info mt-20">
                            <span class="alert-icon">ℹ️</span>
                            <div class="alert-content">
                                <p>Actual weight is at ideal body weight. Use IBW for drug dosing.</p>
                            </div>
                        </div>
                    `;
                }

                resultEl.innerHTML = resultHTML;
                resultEl.style.display = 'block';
                resultEl.classList.add('show');
            } else {
                resultEl.style.display = 'none';
            }
        };

        // Set gender from patient data
        if (patient && patient.gender) {
            const genderValue = patient.gender.toLowerCase() === 'female' ? 'female' : 'male';
            const genderRadio = container.querySelector(`input[name="ibw-gender"][value="${genderValue}"]`);
            if (genderRadio) {
                genderRadio.checked = true;
                genderRadio.parentElement.classList.add('selected');
            }
        }

        // Auto-populate from FHIR
        getMostRecentObservation(client, '8302-2').then(obs => {
            if (obs && obs.valueQuantity) {
                heightInput.value = obs.valueQuantity.value.toFixed(1);
                calculate();
            }
        });
        getMostRecentObservation(client, '29463-7').then(obs => {
            if (obs && obs.valueQuantity) {
                actualWeightInput.value = obs.valueQuantity.value.toFixed(1);
                calculate();
            }
        });

        // Add visual feedback for radio options
        const radioOptions = container.querySelectorAll('.radio-option');
        radioOptions.forEach(option => {
            option.addEventListener('click', function() {
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

        // Auto-calculate on input changes
        heightInput.addEventListener('input', calculate);
        actualWeightInput.addEventListener('input', calculate);
        
        // Initial calculation
        calculate();
    }
};
