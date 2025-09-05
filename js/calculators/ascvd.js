// js/calculators/ascvd.js
import { getMostRecentObservation, calculateAge } from '../utils.js';

export const ascvd = {
    id: 'ascvd',
    title: 'ASCVD (Atherosclerotic Cardiovascular Disease) Risk Algorithm',
    description: 'Determines 10-year risk of hard ASCVD, i.e. myocardial infarction, stroke, or death due to coronary heart disease or stroke, and provides statin recommendations.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p>${this.description}</p>
            <div class="check-item" style="margin-bottom: 15px;">
                <input type="checkbox" id="known-ascvd"><label for="known-ascvd"><strong>Known Clinical ASCVD?</strong> (e.g., history of MI, stroke, PAD)</label>
            </div>
            <hr>
            <div id="ascvd-risk-inputs">
                <div class="input-group"><label for="ascvd-age">Age:</label><input type="number" id="ascvd-age" placeholder="loading..."></div>
                <div class="input-group"><label for="ascvd-gender">Gender:</label><select id="ascvd-gender"><option value="male">Male</option><option value="female">Female</option></select></div>
                <div class="input-group"><label for="ascvd-race">Race:</label><select id="ascvd-race"><option value="white">White</option><option value="aa">African American</option><option value="other">Other</option></select></div>
                <div class="input-group"><label for="ascvd-tc">Total Cholesterol (mg/dL):</label><input type="number" id="ascvd-tc" placeholder="loading..."></div>
                <div class="input-group"><label for="ascvd-hdl">HDL Cholesterol (mg/dL):</label><input type="number" id="ascvd-hdl" placeholder="loading..."></div>
                <div class="input-group"><label for="ascvd-sbp">Systolic BP (mmHg):</label><input type="number" id="ascvd-sbp" placeholder="loading..."></div>
                <div class="input-group"><label for="ascvd-htn">On HTN Treatment?</label><select id="ascvd-htn"><option value="no">No</option><option value="yes">Yes</option></select></div>
                <div class="input-group"><label for="ascvd-dm">Diabetes?</label><select id="ascvd-dm"><option value="no">No</option><option value="yes">Yes</option></select></div>
                <div class="input-group"><label for="ascvd-smoker">Smoker?</label><select id="ascvd-smoker"><option value="no">No</option><option value="yes">Yes</option></select></div>
            </div>
            <button id="calculate-ascvd">Calculate 10-Year Risk</button>
            <div id="ascvd-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function(client, patient) {
        const ageInput = document.getElementById('ascvd-age');
        const genderSelect = document.getElementById('ascvd-gender');
        const sbpInput = document.getElementById('ascvd-sbp');
        const tcInput = document.getElementById('ascvd-tc');
        const hdlInput = document.getElementById('ascvd-hdl');

        ageInput.value = calculateAge(patient.birthDate);
        genderSelect.value = patient.gender;

        getMostRecentObservation(client, '85354-9').then(bpPanel => {
            if (bpPanel && bpPanel.component) {
                const sbpComp = bpPanel.component.find(c => c.code.coding[0].code === '8480-6');
                if (sbpComp) sbpInput.value = sbpComp.valueQuantity.value.toFixed(0);
            }
        });
        getMostRecentObservation(client, '2093-3').then(obs => { if(obs) tcInput.value = obs.valueQuantity.value.toFixed(0); });
        getMostRecentObservation(client, '2085-9').then(obs => { if(obs) hdlInput.value = obs.valueQuantity.value.toFixed(0); });

        const knownAscvdCheckbox = document.getElementById('known-ascvd');
        const riskInputsDiv = document.getElementById('ascvd-risk-inputs');

        knownAscvdCheckbox.addEventListener('change', () => {
            riskInputsDiv.style.display = knownAscvdCheckbox.checked ? 'none' : 'block';
        });

        document.getElementById('calculate-ascvd').addEventListener('click', () => {
            const resultEl = document.getElementById('ascvd-result');

            if (knownAscvdCheckbox.checked) {
                resultEl.innerHTML = `
                    <p><strong>Risk Category:</strong> High Risk (Known Clinical ASCVD)</p>
                    <hr class="section-divider">
                    <p><strong>Guideline-Based Suggestion:</strong> High-intensity statin therapy is indicated for secondary prevention.</p>
                `;
                resultEl.style.display = 'block';
                return;
            }

            const race = document.getElementById('ascvd-race').value;
            if (race === 'other') {
                resultEl.innerText = 'The Pooled Cohort Equations are validated for non-Hispanic white and African American individuals. Risk for other groups may be over- or underestimated.';
                resultEl.style.display = 'block';
                return;
            }
            const age = parseFloat(ageInput.value);
            const tc = parseFloat(tcInput.value);
            const hdl = parseFloat(hdlInput.value);
            const sbp = parseFloat(sbpInput.value);
            const isMale = document.getElementById('ascvd-gender').value === 'male';
            const onHtnTx = document.getElementById('ascvd-htn').value === 'yes';
            const isDiabetic = document.getElementById('ascvd-dm').value === 'yes';
            const isSmoker = document.getElementById('ascvd-smoker').value === 'yes';

            if (!(age >= 40 && age <= 79 && tc > 0 && hdl > 0 && sbp > 0)) {
                resultEl.innerText = 'Please enter valid inputs. Age must be 40-79.';
                resultEl.style.display = 'block';
                return;
            }
            let coeffs, mean, s10;
            if (isMale) {
                if (race === 'aa') {
                    coeffs = { age: 2.469, tc: 0.302, hdl: -0.307, sbp: onHtnTx ? 1.916 : 1.809, smoker: 0.549, dm: 0.645, age2: 0, age_tc: 0, age_hdl: 0, age_sbp: 0, age_smoker: 0 };
                    mean = 19.54; s10 = 0.8954;
                } else {
                    coeffs = { age: 12.344, tc: 11.853, hdl: -7.990, sbp: onHtnTx ? 1.797 : 1.764, smoker: 7.837, dm: 0.658, age2: 0, age_tc: -2.664, age_hdl: 1.769, age_sbp: 0, age_smoker: -1.795 };
                    mean = 61.18; s10 = 0.9144;
                }
            } else {
                if (race === 'aa') {
                    coeffs = { age: 17.114, tc: 0.940, hdl: -18.920, sbp: onHtnTx ? 29.291 : 27.820, smoker: 0.691, dm: 0.874, age2: 0, age_tc: 0, age_hdl: 4.475, age_sbp: -6.432, age_smoker: 0 };
                    mean = 86.61; s10 = 0.9533;
                } else {
                    coeffs = { age: -29.799, tc: 13.540, hdl: -3.141, sbp: onHtnTx ? 20.014 : 1.957, smoker: 7.574, dm: 0.661, age2: 4.609, age_tc: -2.933, age_hdl: 0, age_sbp: 0, age_smoker: -1.665 };
                    mean = -29.18; s10 = 0.9665;
                }
            }
            const lnAge = Math.log(age);
            const lnTc = Math.log(tc);
            const lnHDL = Math.log(hdl);
            const lnSBP = Math.log(sbp);
            let sum = (coeffs.age * lnAge) + (coeffs.age2 * lnAge * lnAge) + (coeffs.tc * lnTc) + (coeffs.age_tc * lnAge * lnTc) + (coeffs.hdl * lnHDL) + (coeffs.age_hdl * lnAge * lnHDL) + (coeffs.sbp * lnSBP) + (coeffs.age_sbp * lnAge * lnSBP) + (isSmoker ? (coeffs.smoker + coeffs.age_smoker * lnAge) : 0) + (isDiabetic ? coeffs.dm : 0);

            const risk = 1 - Math.pow(s10, Math.exp(sum - mean));
            const riskPercent = (risk * 100);

            // --- Risk Stratification and Recommendation ---
            let riskCategory = '';
            let recommendation = '';

            if (riskPercent < 5) {
                riskCategory = 'Low Risk';
                recommendation = 'Emphasize lifestyle modifications to lower risk factors.';
            } else if (riskPercent < 7.5) {
                riskCategory = 'Borderline Risk';
                recommendation = 'A clinician-patient risk discussion should guide decisions. If risk-enhancing factors are present, consider initiating a moderate-intensity statin.';
            } else if (riskPercent < 20) {
                riskCategory = 'Intermediate Risk';
                recommendation = 'Initiate moderate-intensity statin therapy. A clinician-patient risk discussion is favored to address risk-enhancing factors and patient preferences.';
            } else {
                riskCategory = 'High Risk';
                recommendation = 'Initiate high-intensity statin therapy.';
            }

            const riskEnhancersInfo = `
                <p style="font-size: 0.9em; color: #555; margin-top: 10px;">
                    <strong>Consider Risk-Enhancing Factors:</strong> Family history of premature ASCVD, persistently elevated LDL-C (≥160 mg/dL), CKD, metabolic syndrome, inflammatory diseases, high-risk race/ethnicity, persistently elevated triglycerides (≥175 mg/dL), hs-CRP ≥2.0 mg/L, Lp(a) ≥50 mg/dL, apoB ≥130 mg/dL, or ABI <0.9.
                </p>
            `;

            resultEl.innerHTML = `
                <p><strong>10-Year ASCVD Risk:</strong> ${riskPercent.toFixed(1)}%</p>
                <p><strong>Risk Category:</strong> ${riskCategory}</p>
                <hr class="section-divider">
                <p><strong>Guideline-Based Suggestion:</strong> ${recommendation}</p>
                ${(riskCategory === 'Borderline Risk' || riskCategory === 'Intermediate Risk') ? riskEnhancersInfo : ''}
            `;
            resultEl.style.display = 'block';
        });
    }
};
