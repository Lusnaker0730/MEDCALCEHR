// js/calculators/framingham.js
import { calculateAge, getMostRecentObservation } from '../../utils.js';

export const framingham = {
    id: 'framingham',
    title: 'Framingham Risk Score for Hard Coronary Heart Disease',
    description: 'Estimates 10-year risk of heart attack in patients 30-79 years with no history of CHD or diabetes.',
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p>${this.description}</p>
            <div class="input-group"><label for="fram-age">Age:</label><input type="number" id="fram-age" placeholder="loading..."></div>
            <div class="input-group"><label for="fram-gender">Gender:</label><select id="fram-gender"><option value="male">Male</option><option value="female">Female</option></select></div>
            <div class="input-group"><label for="fram-tc">Total Cholesterol (mg/dL):</label><input type="number" id="fram-tc" placeholder="loading..."></div>
            <div class="input-group"><label for="fram-hdl">HDL Cholesterol (mg/dL):</label><input type="number" id="fram-hdl" placeholder="loading..."></div>
            <div class="input-group"><label for="fram-sbp">Systolic BP (mmHg):</label><input type="number" id="fram-sbp" placeholder="loading..."></div>
            <div class="input-group"><label for="fram-htn">On HTN Treatment?</label><select id="fram-htn"><option value="no">No</option><option value="yes">Yes</option></select></div>
            <div class="input-group"><label for="fram-smoker">Smoker?</label><select id="fram-smoker"><option value="no">No</option><option value="yes">Yes</option></select></div>
            <button id="calculate-framingham">Calculate Framingham Score</button>
            <div id="framingham-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function(client, patient) {
        document.getElementById('fram-age').value = calculateAge(patient.birthDate);
        document.getElementById('fram-gender').value = patient.gender;

        getMostRecentObservation(client, '2093-3').then(obs => { if(obs) document.getElementById('fram-tc').value = obs.valueQuantity.value.toFixed(0); });
        getMostRecentObservation(client, '2085-9').then(obs => { if(obs) document.getElementById('fram-hdl').value = obs.valueQuantity.value.toFixed(0); });
        getMostRecentObservation(client, '85354-9').then(bpPanel => {
            if (bpPanel && bpPanel.component) {
                const sbpComp = bpPanel.component.find(c => c.code.coding[0].code === '8480-6');
                if (sbpComp) document.getElementById('fram-sbp').value = sbpComp.valueQuantity.value.toFixed(0);
            }
        });

        document.getElementById('calculate-framingham').addEventListener('click', () => {
            const age = parseInt(document.getElementById('fram-age').value);
            const isMale = document.getElementById('fram-gender').value === 'male';
            const tc = parseInt(document.getElementById('fram-tc').value);
            const hdl = parseInt(document.getElementById('fram-hdl').value);
            const sbp = parseInt(document.getElementById('fram-sbp').value);
            const onHtnTx = document.getElementById('fram-htn').value === 'yes';
            const isSmoker = document.getElementById('fram-smoker').value === 'yes';
            let points = 0;

            // Point calculation based on Framingham 2008 paper (D'Agostino et al.)
            if (isMale) {
                if (age >= 30 && age <= 34) points -= 1; if (age >= 40 && age <= 44) points += 1; if (age >= 45 && age <= 49) points += 2; if (age >= 50 && age <= 54) points += 3; if (age >= 55 && age <= 59) points += 4; if (age >= 60 && age <= 64) points += 5; if (age >= 65 && age <= 69) points += 6; if (age >= 70) points += 7;
                if (tc >= 160 && tc <= 199) points += 1; if (tc >= 200 && tc <= 239) points += 2; if (tc >= 240 && tc <= 279) points += 3; if (tc >= 280) points += 4;
                if (isSmoker) points += 2;
                if (hdl < 40) points += 2; if (hdl >= 60) points -= 1;
                if (sbp >= (onHtnTx ? 120 : 130) && sbp <= 139) points += (onHtnTx ? 2 : 1); if (sbp >= 140) points += (onHtnTx ? 3 : 2);
            } else { // Female
                if (age >= 35 && age <= 39) points -= 1; if (age >= 45 && age <= 49) points += 1; if (age >= 50 && age <= 59) points += 2; if (age >= 60 && age <= 69) points += 3; if (age >= 70) points += 4;
                if (tc >= 160 && tc <= 199) points += 1; if (tc >= 200 && tc <= 239) points += 3; if (tc >= 240 && tc <= 279) points += 4; if (tc >= 280) points += 5;
                if (isSmoker) points += 2;
                if (hdl < 35) points += 5; if (hdl >= 35 && hdl <= 44) points += 2; if (hdl >= 45 && hdl <= 49) points += 1; if (hdl >= 60) points -= 2;
                if (sbp >= (onHtnTx ? 120 : 130) && sbp <= 139) points += (onHtnTx ? 3 : 1); if (sbp >= 140 && sbp <= 159) points += (onHtnTx ? 4 : 2); if (sbp >= 160) points += (onHtnTx ? 5 : 4);
            }
            
            const riskMapMale = { 0: 2, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 8, 7: 10, 8: 12, 9: 15, 10: 18, 11: 22, 12: 27, 13: 32, 14: 38, 15: 45, 16: 53 };
            const riskMapFemale = { 0: 1, 1: 1, 2: 1, 3: 1, 4: 1, 5: 2, 6: 2, 7: 3, 8: 3, 9: 4, 10: 5, 11: 6, 12: 7, 13: 9, 14: 11, 15: 13, 16: 15, 17: 18, 18: 21, 19: 24, 20: 28 };
            const riskPercent = isMale ? (riskMapMale[points] || ">53") : (riskMapFemale[points] || ">28");

            const resultEl = document.getElementById('framingham-result');
            resultEl.innerHTML = `
                <p><strong>Framingham Point Score:</strong> ${points}</p>
                <p><strong>10-Year "Hard" CHD Risk:</strong> ${riskPercent}%</p>
            `;
            resultEl.style.display = 'block';
        });
    }
};
