export const rcri = {
    id: 'rcri',
    title: 'Revised Cardiac Risk Index for Pre-Operative Risk',
    generateHTML: function() {
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
        `;
    },
    initialize: function(client, patient, container) {
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
