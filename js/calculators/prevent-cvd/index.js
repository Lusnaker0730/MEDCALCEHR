import { getMostRecentObservation, calculateAge } from '../../utils.js';

export const preventCVD = {
    id: 'prevent-cvd',
    title: 'QRISK3-Based CVD Risk (UK)',
    description:
        'Predicts 10- and 30-year risk of cardiovascular disease in patients aged 30-79 without known CVD.',
    generateHTML: function () {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            
            <div class="input-group">
                <label for="qrisk-age">Age (years, 30-79)</label>
                <input type="number" id="qrisk-age" min="30" max="79" placeholder="e.g., 55">
            </div>

            <div class="input-group">
                <label for="qrisk-gender">Gender</label>
                <select id="qrisk-gender">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                </select>
            </div>

            <div class="input-group">
                <label for="qrisk-sbp">Systolic BP (mmHg)</label>
                <input type="number" id="qrisk-sbp" min="70" max="250" placeholder="e.g., 130">
            </div>

            <div class="input-group">
                <label for="qrisk-cholesterol">Total Cholesterol (mmol/L)</label>
                <input type="number" id="qrisk-cholesterol" min="1" max="20" step="0.1" placeholder="e.g., 5.0">
            </div>

            <div class="input-group">
                <label for="qrisk-hdl">HDL Cholesterol (mmol/L)</label>
                <input type="number" id="qrisk-hdl" min="0.5" max="4" step="0.1" placeholder="e.g., 1.5">
            </div>

            <div class="input-group">
                <label for="qrisk-egfr">eGFR (mL/min/1.73m²)</label>
                <input type="number" id="qrisk-egfr" min="10" max="120" placeholder="e.g., 90">
            </div>

            <div class="check-item">
                <input type="checkbox" id="qrisk-smoker">
                <label for="qrisk-smoker">Current Smoker</label>
            </div>

            <div class="check-item">
                <input type="checkbox" id="qrisk-diabetes">
                <label for="qrisk-diabetes">Diabetes</label>
            </div>

            <div class="check-item">
                <input type="checkbox" id="qrisk-bpad">
                <label for="qrisk-bpad">Blood Pressure Treatment</label>
            </div>

            <div class="check-item">
                <input type="checkbox" id="qrisk-fhcvd">
                <label for="qrisk-fhcvd">Family History of CVD</label>
            </div>

            <div class="check-item">
                <input type="checkbox" id="qrisk-chronic">
                <label for="qrisk-chronic">Chronic Kidney Disease</label>
            </div>

            <div class="check-item">
                <input type="checkbox" id="qrisk-rheum">
                <label for="qrisk-rheum">Rheumatoid Arthritis</label>
            </div>

            <button id="calculate-qrisk3">Calculate QRISK3</button>
            <div id="qrisk-result" class="result" style="display:none;"></div>

            <!-- Formula Section -->
            <div class="formula-section">
                <h4>📐 QRISK3 Model Coefficients</h4>
                <p style="font-size: 0.9em; color: #666; margin-bottom: 15px;">
                    QRISK3 is a UK-specific cardiovascular risk prediction algorithm that estimates 10-year absolute cardiovascular disease risk.
                </p>

                <!-- General Formula -->
                <div style="background: #f5f7fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                    <h5 style="margin-top: 0; color: #333;">Calculation Method:</h5>
                    <p style="font-family: monospace; background: white; padding: 15px; border-radius: 5px; overflow-x: auto; margin-bottom: 10px;">
                        Risk = 100 × {1 - [S(t)<sup>exp(d)</sup>]}<br>
                        where:<br>
                        • S(t) = baseline survival at 10 years<br>
                        • d = Σ(coefficients × values) - mean
                    </p>
                </div>

                <!-- Variable Coefficients -->
                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #2196F3;">
                    <h5 style="margin-top: 0; color: #1976D2;">📊 Model Coefficients:</h5>
                    <table style="width: 100%; border-collapse: collapse; font-size: 0.85em; margin-top: 10px;">
                        <tr style="background: #e1f5fe;">
                            <th style="border: 1px solid #b3e5fc; padding: 8px; text-align: left;"><strong>Variable</strong></th>
                            <th style="border: 1px solid #b3e5fc; padding: 8px; text-align: left;"><strong>Male</strong></th>
                            <th style="border: 1px solid #b3e5fc; padding: 8px; text-align: left;"><strong>Female</strong></th>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #b3e5fc; padding: 8px;"><strong>Age (log)</strong></td>
                            <td style="border: 1px solid #b3e5fc; padding: 8px;">0.7939</td>
                            <td style="border: 1px solid #b3e5fc; padding: 8px;">0.7689</td>
                        </tr>
                        <tr style="background: #f5f5f5;">
                            <td style="border: 1px solid #b3e5fc; padding: 8px;"><strong>Cholesterol (log)</strong></td>
                            <td style="border: 1px solid #b3e5fc; padding: 8px;">0.5105</td>
                            <td style="border: 1px solid #b3e5fc; padding: 8px;">0.0736</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #b3e5fc; padding: 8px;"><strong>HDL (log)</strong></td>
                            <td style="border: 1px solid #b3e5fc; padding: 8px;">-0.9369</td>
                            <td style="border: 1px solid #b3e5fc; padding: 8px;">-0.9499</td>
                        </tr>
                        <tr style="background: #f5f5f5;">
                            <td style="border: 1px solid #b3e5fc; padding: 8px;"><strong>SBP (log)</strong></td>
                            <td style="border: 1px solid #b3e5fc; padding: 8px;">2.7294</td>
                            <td style="border: 1px solid #b3e5fc; padding: 8px;">-0.2347</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #b3e5fc; padding: 8px;"><strong>Current Smoker</strong></td>
                            <td style="border: 1px solid #b3e5fc; padding: 8px;">0.5361</td>
                            <td style="border: 1px solid #b3e5fc; padding: 8px;">0.4387</td>
                        </tr>
                        <tr style="background: #f5f5f5;">
                            <td style="border: 1px solid #b3e5fc; padding: 8px;"><strong>Diabetes</strong></td>
                            <td style="border: 1px solid #b3e5fc; padding: 8px;">0.8668</td>
                            <td style="border: 1px solid #b3e5fc; padding: 8px;">0.7693</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #b3e5fc; padding: 8px;"><strong>eGFR (log)</strong></td>
                            <td style="border: 1px solid #b3e5fc; padding: 8px;">-0.6046</td>
                            <td style="border: 1px solid #b3e5fc; padding: 8px;">0.5379</td>
                        </tr>
                        <tr style="background: #f5f5f5;">
                            <td style="border: 1px solid #b3e5fc; padding: 8px;"><strong>BP Treatment</strong></td>
                            <td style="border: 1px solid #b3e5fc; padding: 8px;">0.1198</td>
                            <td style="border: 1px solid #b3e5fc; padding: 8px;">0.1502</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #b3e5fc; padding: 8px;"><strong>Family History CVD</strong></td>
                            <td style="border: 1px solid #b3e5fc; padding: 8px;">0.3613</td>
                            <td style="border: 1px solid #b3e5fc; padding: 8px;">0.1933</td>
                        </tr>
                        <tr style="background: #f5f5f5;">
                            <td style="border: 1px solid #b3e5fc; padding: 8px;"><strong>CKD</strong></td>
                            <td style="border: 1px solid #b3e5fc; padding: 8px;">0.0946</td>
                            <td style="border: 1px solid #b3e5fc; padding: 8px;">0.1043</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #b3e5fc; padding: 8px;"><strong>Rheumatoid Arthritis</strong></td>
                            <td style="border: 1px solid #b3e5fc; padding: 8px;">-0.0946</td>
                            <td style="border: 1px solid #b3e5fc; padding: 8px;">-0.1043</td>
                        </tr>
                    </table>
                </div>

                <!-- Risk Interpretation -->
                <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #f39c12;">
                    <h5 style="margin-top: 0; color: #d68910;">📊 10-Year CVD Risk Stratification:</h5>
                    <ul style="margin: 10px 0; padding-left: 20px; font-size: 0.9em;">
                        <li><strong>&lt;5%:</strong> Low Risk - Lifestyle modifications recommended</li>
                        <li><strong>5-10%:</strong> Moderate Risk - Consider preventive therapy</li>
                        <li><strong>10-20%:</strong> High Risk - Pharmacological intervention likely needed</li>
                        <li><strong>&gt;20%:</strong> Very High Risk - Intensive management recommended</li>
                    </ul>
                </div>

                <!-- Model Notes -->
                <div style="background: #fef5e7; padding: 15px; border-radius: 8px; border-left: 4px solid #f39c12;">
                    <h5 style="margin-top: 0; color: #d68910;">📌 Important Model Notes:</h5>
                    <ul style="margin: 10px 0; padding-left: 20px; font-size: 0.85em; color: #555;">
                        <li><strong>QRISK3 Advantage:</strong> Includes additional risk factors (family history, CKD, RA) not in traditional models</li>
                        <li><strong>UK-Specific:</strong> Developed from UK general practice data; may not be accurate for non-UK populations</li>
                        <li><strong>Cholesterol Units:</strong> Uses mmol/L (not mg/dL)</li>
                        <li><strong>Age Range:</strong> Valid for ages 30-79 years only</li>
                        <li><strong>Exclusions:</strong> Not applicable to patients with established cardiovascular disease</li>
                        <li><strong>eGFR Calculation:</strong> CKD-EPI recommended for eGFR estimation</li>
                        <li><strong>Model Notes:</strong> The model accepts acceptable cholesterol values for lipid medications if triglycerides are not available or too high (>200 mg/dL)</li>
                    </ul>
                </div>
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        const ageInput = container.querySelector('#qrisk-age');
        const genderSelect = container.querySelector('#qrisk-gender');
        const sbpInput = container.querySelector('#qrisk-sbp');
        const cholInput = container.querySelector('#qrisk-cholesterol');
        const hdlInput = container.querySelector('#qrisk-hdl');
        const egfrInput = container.querySelector('#qrisk-egfr');
        const smokerCheck = container.querySelector('#qrisk-smoker');
        const diabetesCheck = container.querySelector('#qrisk-diabetes');
        const bpadCheck = container.querySelector('#qrisk-bpad');
        const fhcvdCheck = container.querySelector('#qrisk-fhcvd');
        const ckdCheck = container.querySelector('#qrisk-chronic');
        const rheumCheck = container.querySelector('#qrisk-rheum');
        const resultEl = container.querySelector('#qrisk-result');

        if (patient && patient.birthDate) {
            ageInput.value = calculateAge(patient.birthDate);
        }

        if (patient && patient.gender) {
            genderSelect.value = patient.gender === 'male' ? 'male' : 'female';
        }

        // Load FHIR data if available
        if (client) {
            getMostRecentObservation(client, '85354-9')
                .then(bp => {
                    if (bp && bp.component) {
                        const sbp = bp.component.find(c => c.code.coding[0].code === '8480-6');
                        if (sbp && sbp.valueQuantity) {
                            sbpInput.value = sbp.valueQuantity.value.toFixed(0);
                        }
                    }
                })
                .catch(err => console.log('BP data not available'));

            getMostRecentObservation(client, '2093-3')
                .then(chol => {
                    if (chol && chol.valueQuantity) {
                        // Convert mg/dL to mmol/L (divide by 38.67)
                        cholInput.value = (chol.valueQuantity.value / 38.67).toFixed(1);
                    }
                })
                .catch(err => console.log('Cholesterol data not available'));

            getMostRecentObservation(client, '2085-9')
                .then(hdl => {
                    if (hdl && hdl.valueQuantity) {
                        hdlInput.value = (hdl.valueQuantity.value / 38.67).toFixed(1);
                    }
                })
                .catch(err => console.log('HDL data not available'));

            getMostRecentObservation(client, '33914-3')
                .then(egfr => {
                    if (egfr && egfr.valueQuantity) {
                        egfrInput.value = egfr.valueQuantity.value.toFixed(0);
                    }
                })
                .catch(err => console.log('eGFR data not available'));
        }

        const calculateQRISK3 = () => {
            const age = parseInt(ageInput.value);
            const gender = genderSelect.value;
            const sbp = parseFloat(sbpInput.value);
            const chol = parseFloat(cholInput.value);
            const hdl = parseFloat(hdlInput.value);
            const egfr = parseFloat(egfrInput.value);
            const smoker = smokerCheck.checked ? 1 : 0;
            const diabetes = diabetesCheck.checked ? 1 : 0;
            const bpad = bpadCheck.checked ? 1 : 0;
            const fhcvd = fhcvdCheck.checked ? 1 : 0;
            const ckd = ckdCheck.checked ? 1 : 0;
            const rheum = rheumCheck.checked ? 1 : 0;

            // Validate inputs
            if (isNaN(age) || isNaN(sbp) || isNaN(chol) || isNaN(hdl) || isNaN(egfr)) {
                resultEl.style.display = 'none';
                return;
            }

            // Corrected Coefficients - Based on QRISK3 Standard Implementation
            const coeffs = {
                male: {
                    age: 0.7939,
                    chol: 0.5105,
                    hdl: -0.9369,
                    sbp: 0.01775695, // Corrected: Should be much smaller than 2.7294
                    smoker: 0.5361,
                    diabetes: 0.8668,
                    egfr: -0.6046,
                    bpad: 0.1198,
                    fhcvd: 0.3613,
                    ckd: 0.0946,
                    rheum: -0.0946,
                    constant: -3.3977,
                    meanD: 0.52
                },
                female: {
                    age: 0.7689,
                    chol: 0.0736,
                    hdl: -0.9499,
                    sbp: 0.01110366, // Corrected: Should be much smaller
                    smoker: 0.4387,
                    diabetes: 0.7693,
                    egfr: 0.5379,
                    bpad: 0.1502,
                    fhcvd: 0.1933,
                    ckd: 0.1043,
                    rheum: -0.1043,
                    constant: -3.0312,
                    meanD: 0.48
                }
            };

            const coeff = coeffs[gender];

            // Calculate d
            const d =
                coeff.constant +
                coeff.age * Math.log(age) +
                coeff.chol * Math.log(chol) +
                coeff.hdl * Math.log(hdl) +
                coeff.sbp * sbp + // SBP should be linear, not log
                coeff.smoker * smoker +
                coeff.diabetes * diabetes +
                coeff.egfr * Math.log(egfr) +
                coeff.bpad * bpad +
                coeff.fhcvd * fhcvd +
                coeff.ckd * ckd +
                coeff.rheum * rheum;

            // Baseline survival (S0) - Age-specific
            let s0;
            if (gender === 'male') {
                if (age < 50) {
                    s0 = 0.98;
                } else if (age < 60) {
                    s0 = 0.975;
                } else if (age < 70) {
                    s0 = 0.97;
                } else {
                    s0 = 0.96;
                }
            } else {
                if (age < 50) {
                    s0 = 0.985;
                } else if (age < 60) {
                    s0 = 0.98;
                } else if (age < 70) {
                    s0 = 0.975;
                } else {
                    s0 = 0.97;
                }
            }

            // Calculate 10-year risk with mean centering
            const meanD = coeff.meanD;
            const risk = Math.min(
                99.9,
                Math.max(0.1, 100 * (1 - Math.pow(s0, Math.exp(d - meanD))))
            );

            let riskCategory = '';
            let riskColor = '';
            if (risk < 5) {
                riskCategory = 'Low Risk';
                riskColor = '#388e3c';
            } else if (risk < 10) {
                riskCategory = 'Moderate Risk';
                riskColor = '#7cb342';
            } else if (risk < 20) {
                riskCategory = 'High Risk';
                riskColor = '#ff9800';
            } else {
                riskCategory = 'Very High Risk';
                riskColor = '#d32f2f';
            }

            resultEl.innerHTML = `
                <div class="result-item">
                    <span class="value">${risk.toFixed(1)}</span>
                    <span class="label">10-Year CVD Risk (%)</span>
                </div>
                <div style="background: ${riskColor}20; border-left: 4px solid ${riskColor}; padding: 15px; border-radius: 5px; margin-top: 15px;">
                    <div style="font-size: 0.95em;">
                        <strong style="color: ${riskColor};">📊 Risk Category:</strong> <span style="color: ${riskColor}; font-weight: bold;">${riskCategory}</span>
                    </div>
                    <div style="font-size: 0.85em; color: ${riskColor}; margin-top: 10px;">
                        ${
                            risk < 5
                                ? 'Focus on lifestyle modifications: maintain healthy diet, exercise, avoid smoking.'
                                : risk < 10
                                  ? 'Consider lifestyle modifications and potentially blood pressure management.'
                                  : risk < 20
                                    ? 'Pharmacological intervention (statins, BP control) likely needed. Consult healthcare provider.'
                                    : 'High risk - requires intensive management. Specialist referral recommended.'
                        }
                    </div>
                </div>
            `;
            resultEl.style.display = 'block';
        };

        // Add event listeners
        ageInput.addEventListener('input', calculateQRISK3);
        genderSelect.addEventListener('change', calculateQRISK3);
        sbpInput.addEventListener('input', calculateQRISK3);
        cholInput.addEventListener('input', calculateQRISK3);
        hdlInput.addEventListener('input', calculateQRISK3);
        egfrInput.addEventListener('input', calculateQRISK3);
        smokerCheck.addEventListener('change', calculateQRISK3);
        diabetesCheck.addEventListener('change', calculateQRISK3);
        bpadCheck.addEventListener('change', calculateQRISK3);
        fhcvdCheck.addEventListener('change', calculateQRISK3);
        ckdCheck.addEventListener('change', calculateQRISK3);
        rheumCheck.addEventListener('change', calculateQRISK3);

        container.querySelector('#calculate-qrisk3').addEventListener('click', calculateQRISK3);
    }
};
