import { getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';

export const rcri = {
    id: 'rcri',
    title: 'Revised Cardiac Risk Index for Pre-Operative Risk',
    generateHTML: function () {
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">Estimates risk of cardiac complications after noncardiac surgery.</p>
            </div>
            
            <div class="section">
                <div class="section-title"><span>RCRI Factors</span></div>
                <div class="checkbox-group">
                    <label class="checkbox-option">
                        <input type="checkbox" id="rcri-surgery" data-points="1">
                        <span>High-risk surgery (intraperitoneal, intrathoracic, suprainguinal vascular) <strong>+1</strong></span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" id="rcri-ihd" data-points="1">
                        <span>History of Ischemic Heart Disease (MI or positive stress test) <strong>+1</strong></span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" id="rcri-hf" data-points="1">
                        <span>History of Congestive Heart Failure <strong>+1</strong></span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" id="rcri-cvd" data-points="1">
                        <span>History of Cerebrovascular Disease (stroke or TIA) <strong>+1</strong></span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" id="rcri-insulin" data-points="1">
                        <span>Preoperative treatment with insulin <strong>+1</strong></span>
                    </label>
                    <label class="checkbox-option">
                        <input type="checkbox" id="rcri-creatinine" data-points="1">
                        <span>Preoperative serum creatinine > 2.0 mg/dL <strong>+1</strong></span>
                    </label>
                </div>
            </div>
            
            <div id="rcri-result" class="result-container"></div>
            <div class="references">
                <h4>Reference</h4>
                <p>Lee, T. H., Marcantonio, E. R., Mangione, C. M., Thomas, E. J., Polanczyk, C. A., Cook, E. F., ... & Goldman, L. (1999). Derivation and prospective validation of a simple index for prediction of cardiac risk of major noncardiac surgery. <em>Circulation</em>, 100(10), 1043-1049.</p>
                <p><strong>PMID:</strong> 10477528</p>
                <p><strong>DOI:</strong> 10.1161/01.cir.100.10.1043</p>
                <p><strong>Abstract:</strong> This prospective cohort study of 4,315 patients aged ??0 years undergoing elective major noncardiac procedures developed and validated the Revised Cardiac Risk Index. Six independent predictors were identified: high-risk surgery, history of ischemic heart disease, history of congestive heart failure, history of cerebrovascular disease, preoperative insulin treatment, and preoperative serum creatinine >2.0 mg/dL. Major cardiac complication rates with 0, 1, 2, or ?? factors were 0.5%, 1.3%, 4%, and 9% respectively in the derivation cohort, and 0.4%, 0.9%, 7%, and 11% respectively in the validation cohort.</p>
                <img src="js/calculators/rcri/Lees-Revised-Cardiac-Risk-Index-RCRI_W640.jpg" alt="RCRI Risk Stratification Table" style="max-width: 100%; height: auto; margin-top: 15px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" />
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        // Auto-populate creatinine
        getMostRecentObservation(client, LOINC_CODES.CREATININE).then(obs => {
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

        const calculate = () => {
            const checkboxes = container.querySelectorAll(
                '.checkbox-option input[type="checkbox"]'
            );
            let score = 0;
            checkboxes.forEach(box => {
                if (box.checked) {
                    score += parseInt(box.dataset.points);
                }
            });

            let risk = '';
            let complicationsRate = '';
            let alertClass = '';
            if (score === 0) {
                risk = 'Class I (Low Risk)';
                complicationsRate = '0.4%';
                alertClass = 'success';
            } else if (score === 1) {
                risk = 'Class II (Low Risk)';
                complicationsRate = '0.9%';
                alertClass = 'success';
            } else if (score === 2) {
                risk = 'Class III (Moderate Risk)';
                complicationsRate = '6.6%';
                alertClass = 'warning';
            } else {
                risk = 'Class IV (High Risk)';
                complicationsRate = '11%';
                alertClass = 'danger';
            }

            const resultEl = container.querySelector('#rcri-result');
            resultEl.innerHTML = `
                <div class="result-header"><h4>RCRI Result</h4></div>
                <div class="result-score">
                    <span class="score-value">${score}</span>
                    <span class="score-label">/ 6 points</span>
                </div>
                <div class="result-item">
                    <span class="label">Risk Class:</span>
                    <span class="value">${risk}</span>
                </div>
                <div class="result-item">
                    <span class="label">Major Cardiac Complications:</span>
                    <span class="value">${complicationsRate}</span>
                </div>
                <div class="severity-indicator ${alertClass}">
                    <strong>${risk}</strong>
                </div>
            `;
            resultEl.style.display = 'block';
        };

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
