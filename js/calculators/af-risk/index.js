// js/calculators/af-risk.js
import { calculateAge, getMostRecentObservation } from '../../utils.js';

export const afRisk = {
    id: 'af-risk',
    title: 'AF Stroke/Bleed Risk (CHA₂DS₂-VASc & HAS-BLED)',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">Combined assessment of stroke and bleeding risk in atrial fibrillation patients.</p>
            </div>
            
            <div class="section">
                <div class="section-title"><span>💓 CHA₂DS₂-VASc Score (Stroke Risk)</span></div>
                <div class="checkbox-group">
                    <label class="checkbox-option"><input type="checkbox" id="chf" data-points="1"><span>Congestive Heart Failure <strong>+1</strong></span></label>
                    <label class="checkbox-option"><input type="checkbox" id="htn" data-points="1"><span>Hypertension <strong>+1</strong></span></label>
                    <label class="checkbox-option"><input type="checkbox" id="age75" data-points="2"><span>Age ≥ 75 years <strong>+2</strong></span></label>
                    <label class="checkbox-option"><input type="checkbox" id="dm" data-points="1"><span>Diabetes Mellitus <strong>+1</strong></span></label>
                    <label class="checkbox-option"><input type="checkbox" id="stroke" data-points="2"><span>Stroke / TIA / Thromboembolism <strong>+2</strong></span></label>
                    <label class="checkbox-option"><input type="checkbox" id="vasc" data-points="1"><span>Vascular Disease <strong>+1</strong></span></label>
                    <label class="checkbox-option"><input type="checkbox" id="age65" data-points="1"><span>Age 65-74 years <strong>+1</strong></span></label>
                    <label class="checkbox-option"><input type="checkbox" id="female" data-points="1"><span>Female Gender <strong>+1</strong></span></label>
                </div>
            </div>
            
            <div class="section mt-20">
                <div class="section-title"><span>🩸 HAS-BLED Score (Bleeding Risk)</span></div>
                <div class="checkbox-group">
                    <label class="checkbox-option"><input type="checkbox" id="hasbled-htn" data-points="1"><span>Hypertension (uncontrolled, SBP > 160) <strong>+1</strong></span></label>
                    <label class="checkbox-option"><input type="checkbox" id="hasbled-renal" data-points="1"><span>Abnormal renal function <strong>+1</strong></span></label>
                    <label class="checkbox-option"><input type="checkbox" id="hasbled-liver" data-points="1"><span>Abnormal liver function <strong>+1</strong></span></label>
                    <label class="checkbox-option"><input type="checkbox" id="hasbled-stroke" data-points="1"><span>Stroke <strong>+1</strong></span></label>
                    <label class="checkbox-option"><input type="checkbox" id="hasbled-bleed" data-points="1"><span>Bleeding history or predisposition <strong>+1</strong></span></label>
                    <label class="checkbox-option"><input type="checkbox" id="hasbled-inr" data-points="1"><span>Labile INRs <strong>+1</strong></span></label>
                    <label class="checkbox-option"><input type="checkbox" id="hasbled-elderly" data-points="1"><span>Elderly (age > 65 years) <strong>+1</strong></span></label>
                    <label class="checkbox-option"><input type="checkbox" id="hasbled-drugs" data-points="1"><span>Concomitant drugs (e.g., NSAIDs, antiplatelets) <strong>+1</strong></span></label>
                    <label class="checkbox-option"><input type="checkbox" id="hasbled-alcohol" data-points="1"><span>Alcohol abuse <strong>+1</strong></span></label>
                </div>
            </div>
            
            <div id="af-risk-result" class="result-container"></div>
        `;
    },
    initialize: function (client, patient, container) {
        const age = calculateAge(patient.birthDate);
        const age75Check = container.querySelector('#age75');
        const age65Check = container.querySelector('#age65');

        const calculate = () => {
            // Calculate CHA₂DS₂-VASc Score
            let cha2ds2vasc_score = 0;
            container.querySelectorAll('.checkbox-option input[type="checkbox"]').forEach(box => {
                if (box.checked && !box.id.startsWith('hasbled-')) {
                    cha2ds2vasc_score += parseFloat(box.dataset.points);
                }
            });
            if (age75Check.checked && age65Check.checked) {
                cha2ds2vasc_score -= 1;
            }

            // Calculate HAS-BLED Score
            let hasbled_score = 0;
            container.querySelectorAll('.checkbox-option input[type="checkbox"]').forEach(box => {
                if (box.checked && box.id.startsWith('hasbled-')) {
                    hasbled_score += parseFloat(box.dataset.points);
                }
            });

            // Generate Treatment Recommendation
            const isMale = patient.gender === 'male';
            const strokeRiskScoreForOAC = isMale ? cha2ds2vasc_score : cha2ds2vasc_score - 1;

            let recommendation = '';
            let alertClass = 'info';
            if (strokeRiskScoreForOAC >= 2) {
                recommendation = 'Oral anticoagulation is recommended.';
                alertClass = 'warning';
            } else if (strokeRiskScoreForOAC === 1) {
                recommendation = 'Oral anticoagulation should be considered.';
                alertClass = 'warning';
            } else {
                recommendation = 'Antithrombotic therapy may be omitted.';
                alertClass = 'success';
            }

            let bleedNote = '';
            if (hasbled_score >= 3) {
                bleedNote = `<div class="alert danger mt-10">
                    <span class="alert-icon">⚠</span>
                    <div class="alert-content">
                        <p><strong>High Bleeding Risk:</strong> HAS-BLED score is ≥3. Use anticoagulants with caution, address modifiable bleeding risk factors, and schedule regular follow-up.</p>
                    </div>
                </div>`;
            }

            const resultEl = container.querySelector('#af-risk-result');
            resultEl.innerHTML = `
                <div class="result-header"><h4>Assessment Results</h4></div>
                <div class="result-item">
                    <span class="label">CHA₂DS₂-VASc Score (Stroke Risk):</span>
                    <span class="value">${cha2ds2vasc_score} / 9 points</span>
                </div>
                <div class="result-item">
                    <span class="label">HAS-BLED Score (Bleeding Risk):</span>
                    <span class="value">${hasbled_score} / 9 points</span>
                </div>
                <div class="alert ${alertClass} mt-10">
                    <span class="alert-icon">${alertClass === 'success' ? '✓' : '⚠'}</span>
                    <div class="alert-content">
                        <p><strong>Recommendation:</strong> ${recommendation}</p>
                    </div>
                </div>
                ${bleedNote}
            `;
            resultEl.style.display = 'block';
        };

        // Pre-fill CHA₂DS₂-VASc
        if (age >= 75) {
            age75Check.checked = true;
        } else if (age >= 65) {
            age65Check.checked = true;
        }
        if (patient.gender === 'female') {
            container.querySelector('#female').checked = true;
        }

        // Pre-fill HAS-BLED
        if (age > 65) {
            container.querySelector('#hasbled-elderly').checked = true;
        }
        getMostRecentObservation(client, '85354-9').then(bpPanel => {
            if (bpPanel && bpPanel.component) {
                const sbpComp = bpPanel.component.find(c => c.code.coding[0].code === '8480-6');
                if (sbpComp && sbpComp.valueQuantity.value > 160) {
                    container.querySelector('#hasbled-htn').checked = true;
                    calculate();
                }
            }
        });

        // Visual feedback and auto-calculation
        container.querySelectorAll('.checkbox-option').forEach(option => {
            const checkbox = option.querySelector('input[type="checkbox"]');
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    option.classList.add('selected');
                } else {
                    option.classList.remove('selected');
                }
                calculate();
            });
            if (checkbox.checked) {
                option.classList.add('selected');
            }
        });

        calculate();
    }
};
