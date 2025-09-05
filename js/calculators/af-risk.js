// js/calculators/af-risk.js
import { calculateAge, getMostRecentObservation } from '../utils.js';

export const afRisk = {
    id: 'af-risk',
    title: 'AF Stroke/Bleed Risk (CHA₂DS₂-VASc & HAS-BLED)',
    generateHTML: function() {
        return `
            <div id="cha2ds2vasc-section" class="calculator-section">
                <h4>CHA₂DS₂-VASc Score (Stroke Risk)</h4>
                <div class="checklist">
                    <div class="check-item"><input type="checkbox" id="chf" data-points="1"><label for="chf">Congestive Heart Failure</label></div>
                    <div class="check-item"><input type="checkbox" id="htn" data-points="1"><label for="htn">Hypertension</label></div>
                    <div class="check-item"><input type="checkbox" id="age75" data-points="2"><label for="age75">Age ≥ 75 years</label></div>
                    <div class="check-item"><input type="checkbox" id="dm" data-points="1"><label for="dm">Diabetes Mellitus</label></div>
                    <div class="check-item"><input type="checkbox" id="stroke" data-points="2"><label for="stroke">Stroke / TIA / Thromboembolism</label></div>
                    <div class="check-item"><input type="checkbox" id="vasc" data-points="1"><label for="vasc">Vascular Disease</label></div>
                    <div class="check-item"><input type="checkbox" id="age65" data-points="1"><label for="age65">Age 65-74 years</label></div>
                    <div class="check-item"><input type="checkbox" id="female" data-points="1"><label for="female">Female Gender</label></div>
                </div>
            </div>
            <hr class="section-divider">
            <div id="hasbled-section" class="calculator-section">
                <h4>HAS-BLED Score (Bleeding Risk)</h4>
                <div class="checklist">
                    <div class="check-item"><input type="checkbox" id="hasbled-htn" data-points="1"><label for="hasbled-htn">Hypertension (uncontrolled, SBP > 160)</label></div>
                    <div class="check-item"><input type="checkbox" id="hasbled-renal" data-points="1"><label for="hasbled-renal">Abnormal renal function</label></div>
                    <div class="check-item"><input type="checkbox" id="hasbled-liver" data-points="1"><label for="hasbled-liver">Abnormal liver function</label></div>
                    <div class="check-item"><input type="checkbox" id="hasbled-stroke" data-points="1"><label for="hasbled-stroke">Stroke</label></div>
                    <div class="check-item"><input type="checkbox" id="hasbled-bleed" data-points="1"><label for="hasbled-bleed">Bleeding history or predisposition</label></div>
                    <div class="check-item"><input type="checkbox" id="hasbled-inr" data-points="1"><label for="hasbled-inr">Labile INRs</label></div>
                    <div class="check-item"><input type="checkbox" id="hasbled-elderly" data-points="1"><label for="hasbled-elderly">Elderly (age > 65 years)</label></div>
                    <div class="check-item"><input type="checkbox" id="hasbled-drugs" data-points="1"><label for="hasbled-drugs">Concomitant drugs (e.g., NSAIDs, antiplatelets)</label></div>
                    <div class="check-item"><input type="checkbox" id="hasbled-alcohol" data-points="1"><label for="hasbled-alcohol">Alcohol abuse</label></div>
                </div>
            </div>
            <button id="calculate-af-risk">Calculate Scores & Get Recommendation</button>
            <div id="af-risk-result" class="result" style="display:none;"></div>
        `;
    },
    initialize: function(client, patient) {
        const age = calculateAge(patient.birthDate);

        // --- Pre-fill CHA₂DS₂-VASc ---
        const age75Check = document.getElementById('age75');
        const age65Check = document.getElementById('age65');
        if (age >= 75) age75Check.checked = true;
        else if (age >= 65) age65Check.checked = true;
        if (patient.gender === 'female') document.getElementById('female').checked = true;

        // --- Pre-fill HAS-BLED ---
        if (age > 65) document.getElementById('hasbled-elderly').checked = true;
        getMostRecentObservation(client, '85354-9').then(bpPanel => {
            if (bpPanel && bpPanel.component) {
                const sbpComp = bpPanel.component.find(c => c.code.coding[0].code === '8480-6');
                if (sbpComp && sbpComp.valueQuantity.value > 160) {
                    document.getElementById('hasbled-htn').checked = true;
                }
            }
        });
        
        // --- Calculation and Recommendation Logic ---
        document.getElementById('calculate-af-risk').addEventListener('click', () => {
            // Calculate CHA₂DS₂-VASc Score
            let cha2ds2vasc_score = 0;
            document.querySelectorAll('#cha2ds2vasc-section .check-item input').forEach(box => {
                if (box.checked) cha2ds2vasc_score += parseFloat(box.dataset.points);
            });
            if (age75Check.checked && age65Check.checked) cha2ds2vasc_score -= 1;

            // Calculate HAS-BLED Score
            let hasbled_score = 0;
            document.querySelectorAll('#hasbled-section .check-item input').forEach(box => {
                if (box.checked) hasbled_score += parseFloat(box.dataset.points);
            });

            // --- Generate Treatment Recommendation ---
            let recommendation = '';
            const isMale = patient.gender === 'male';
            const strokeRiskScoreForOAC = isMale ? cha2ds2vasc_score : (cha2ds2vasc_score - 1); // Female point is for risk, not tx threshold

            if (strokeRiskScoreForOAC >= 2) {
                recommendation = '<strong>Recommendation:</strong> Oral anticoagulation is recommended.';
            } else if (strokeRiskScoreForOAC === 1) {
                recommendation = '<strong>Recommendation:</strong> Oral anticoagulation should be considered.';
            } else {
                recommendation = '<strong>Recommendation:</strong> Antithrombotic therapy may be omitted.';
            }

            if (hasbled_score >= 3) {
                recommendation += '<br><strong>Note:</strong> HAS-BLED score is high (≥3), indicating a significant bleeding risk. Use anticoagulants with caution, address modifiable bleeding risk factors, and schedule regular follow-up.';
            }

            const resultEl = document.getElementById('af-risk-result');
            resultEl.innerHTML = `
                <p><strong>CHA₂DS₂-VASc Score:</strong> ${cha2ds2vasc_score} (Stroke Risk)</p>
                <p><strong>HAS-BLED Score:</strong> ${hasbled_score} (Bleeding Risk)</p>
                <hr class="section-divider">
                <p>${recommendation}</p>
            `;
            resultEl.style.display = 'block';
        });
    }
};
