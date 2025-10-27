import { getMostRecentObservation } from '../../utils.js';

export const rcri = {
    id: 'rcri',
    title: 'Revised Cardiac Risk Index for Pre-Operative Risk',
    generateHTML: function () {
        return `
            <h3>${this.title}</h3>
            <p>Estimates risk of cardiac complications after noncardiac surgery.</p>
            <div class="checklist">
                <div class="check-item">
                    <input type="checkbox" id="rcri-surgery" data-points="1">
                    <label for="rcri-surgery">High-risk surgery (intraperitoneal, intrathoracic, suprainguinal vascular)</label>
                </div>
                <div class="check-item">
                    <input type="checkbox" id="rcri-ihd" data-points="1">
                    <label for="rcri-ihd">History of Ischemic Heart Disease (MI or positive stress test)</label>
                </div>
                <div class="check-item">
                    <input type="checkbox" id="rcri-hf" data-points="1">
                    <label for="rcri-hf">History of Congestive Heart Failure</label>
                </div>
                <div class="check-item">
                    <input type="checkbox" id="rcri-cvd" data-points="1">
                    <label for="rcri-cvd">History of Cerebrovascular Disease (stroke or TIA)</label>
                </div>
                <div class="check-item">
                    <input type="checkbox" id="rcri-insulin" data-points="1">
                    <label for="rcri-insulin">Preoperative treatment with insulin</label>
                </div>
                <div class="check-item">
                    <input type="checkbox" id="rcri-creatinine" data-points="1">
                    <label for="rcri-creatinine">Preoperative serum creatinine > 2.0 mg/dL</label>
                </div>
            </div>
            <button id="calculate-rcri">Calculate Score</button>
            <div id="rcri-result" class="result" style="display:none;"></div>
            <div class="references">
                <h4>Reference</h4>
                <p>Lee, T. H., Marcantonio, E. R., Mangione, C. M., Thomas, E. J., Polanczyk, C. A., Cook, E. F., ... & Goldman, L. (1999). Derivation and prospective validation of a simple index for prediction of cardiac risk of major noncardiac surgery. <em>Circulation</em>, 100(10), 1043-1049.</p>
                <p><strong>PMID:</strong> 10477528</p>
                <p><strong>DOI:</strong> 10.1161/01.cir.100.10.1043</p>
                <p><strong>Abstract:</strong> This prospective cohort study of 4,315 patients aged ≥50 years undergoing elective major noncardiac procedures developed and validated the Revised Cardiac Risk Index. Six independent predictors were identified: high-risk surgery, history of ischemic heart disease, history of congestive heart failure, history of cerebrovascular disease, preoperative insulin treatment, and preoperative serum creatinine >2.0 mg/dL. Major cardiac complication rates with 0, 1, 2, or ≥3 factors were 0.5%, 1.3%, 4%, and 9% respectively in the derivation cohort, and 0.4%, 0.9%, 7%, and 11% respectively in the validation cohort.</p>
                <img src="js/calculators/rcri/Lees-Revised-Cardiac-Risk-Index-RCRI_W640.jpg" alt="RCRI Risk Stratification Table" style="max-width: 100%; height: auto; margin-top: 15px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" />
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        // Auto-populate creatinine
        getMostRecentObservation(client, '2160-0').then(obs => {
            if (obs && obs.valueQuantity) {
                let crValue = obs.valueQuantity.value;
                // Convert if needed (µmol/L to mg/dL: divide by 88.4)
                if (obs.valueQuantity.unit === 'µmol/L' || obs.valueQuantity.unit === 'umol/L') {
                    crValue = crValue / 88.4;
                }
                const crCheckbox = container.querySelector('#rcri-creatinine');
                if (crValue > 2.0 && crCheckbox) {
                    crCheckbox.checked = true;
                }
            }
        });

        container.querySelector('#calculate-rcri').addEventListener('click', () => {
            const checkboxes = container.querySelectorAll('.check-item input[type="checkbox"]');
            let score = 0;
            checkboxes.forEach(box => {
                if (box.checked) {
                    score += parseInt(box.dataset.points);
                }
            });

            let risk = '';
            let complicationsRate = '';
            if (score === 0) {
                risk = 'Class I (Low Risk)';
                complicationsRate = '0.4%';
            } else if (score === 1) {
                risk = 'Class II (Low Risk)';
                complicationsRate = '0.9%';
            } else if (score === 2) {
                risk = 'Class III (Moderate Risk)';
                complicationsRate = '6.6%';
            } else if (score >= 3) {
                risk = 'Class IV (High Risk)';
                complicationsRate = '11%';
            }

            const resultEl = container.querySelector('#rcri-result');
            resultEl.innerHTML = `
                <p>RCRI Score: ${score}</p>
                <p>Risk Class: ${risk}</p>
                <p>Rate of Major Cardiac Complications: ${complicationsRate}</p>
            `;
            resultEl.style.display = 'block';
        });
    }
};
