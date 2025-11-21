import { getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';

export const intraopFluid = {
    id: 'intraop-fluid',
    title: 'Intraoperative Fluid Dosing in Adult Patients',
    description: 'Doses IV fluids intraoperatively.',
    generateHTML: function () {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            <div class="instructions-box important">
                <strong>IMPORTANT</strong>
                <p>This dosing tool is intended to assist with calculation, not to provide comprehensive or definitive drug information. Always double-check dosing of any drug and consult a pharmacist when necessary.</p>
            </div>
            <div class="instructions-box dark-blue">
                <strong>INSTRUCTIONS</strong>
                <p>Use in patients undergoing surgery who weigh ??0 kg and do not have conditions that could otherwise result in fluid overload such as heart failure, COPD, or kidney failure on dialysis. This calculator provides a base hourly fluid requirement, fluid deficit, and hour-by-hour fluid requirement based on surgical needs.</p>
            </div>
            <div class="form-container modern">
                <div class="input-row">
                    <label for="ifd-weight">Weight</label>
                    <div class="input-with-unit"><input type="number" id="ifd-weight"><span>kg</span></div>
                </div>
                <div class="input-row">
                    <label for="ifd-npo">Time spent NPO</label>
                    <div class="input-with-unit"><input type="number" id="ifd-npo"><span>hours</span></div>
                </div>
                <div class="input-row vertical ariscat-form">
                    <div class="input-label">Estimated severity of trauma to tissue
                        <span>Minimal: e.g. hernia repair, laparoscopy. Moderate: e.g. open cholecystectomy, open appendectomy. Severe: e.g. bowel resection.</span>
                    </div>
                    <div class="radio-group vertical-group">
                        <label><input type="radio" name="trauma" value="4"> Minimal</label>
                        <label><input type="radio" name="trauma" value="6"> Moderate</label>
                        <label><input type="radio" name="trauma" value="8"> Severe</label>
                    </div>
                </div>
            </div>
            <div id="ifd-result" class="result-grid" style="display:none;"></div>
            <div class="formula-section" style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #2196F3;">
                <h4 style="margin-top: 0; color: #1976D2;">Ë®àÁ??¨Â? (Formulas)</h4>
                
                <div style="margin-bottom: 20px;">
                    <strong style="color: #424242;">1. ÊØèÂ??ÇÁ∂≠?ÅÊ∂≤È´îÈ? (Hourly Maintenance Fluid)</strong>
                    <ul style="margin: 10px 0; line-height: 1.8;">
                        <li>È´îÈ? > 20 kg: <code>Á∂≠Ê???= È´îÈ? + 40 mL/hr</code></li>
                        <li>È´îÈ? 10-20 kg: <code>Á∂≠Ê???= 40 + (È´îÈ? - 10) ? 2 mL/hr</code></li>
                        <li>È´îÈ? ??10 kg: <code>Á∂≠Ê???= È´îÈ? ? 4 mL/hr</code></li>
                    </ul>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <strong style="color: #424242;">2. NPO Ê∂≤È?Áº∫Â§± (NPO Fluid Deficit)</strong>
                    <ul style="margin: 10px 0; line-height: 1.8;">
                        <li><code>NPO Áº∫Â§± = Á∂≠Ê???? NPO ?ÇÊï∏</code></li>
                    </ul>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <strong style="color: #424242;">3. ?µÂÇ∑Ê∂≤È?‰∏üÂ§±??(Trauma-Related Fluid Loss)</strong>
                    <ul style="margin: 10px 0; line-height: 1.8;">
                        <li>ËºïÂæÆ?µÂÇ∑: <code>4 mL/kg/hr</code></li>
                        <li>‰∏≠Â∫¶?µÂÇ∑: <code>6 mL/kg/hr</code></li>
                        <li>?¥È??µÂÇ∑: <code>8 mL/kg/hr</code></li>
                        <li><code>?µÂÇ∑‰∏üÂ§±??= ?µÂÇ∑??? È´îÈ?</code></li>
                    </ul>
                </div>
                
                <div style="margin-bottom: 0;">
                    <strong style="color: #424242;">4. ?êÊ?Ëº∏Ê∂≤??(Hour-by-Hour Fluid Requirements)</strong>
                    <ul style="margin: 10px 0; line-height: 1.8;">
                        <li><strong>Á¨?Â∞èÊ?:</strong> <code>(NPO Áº∫Â§± √∑ 2) + Á∂≠Ê???+ ?µÂÇ∑‰∏üÂ§±??/code></li>
                        <li><strong>Á¨?Â∞èÊ?:</strong> <code>(NPO Áº∫Â§± √∑ 4) + Á∂≠Ê???+ ?µÂÇ∑‰∏üÂ§±??/code></li>
                        <li><strong>Á¨?Â∞èÊ?:</strong> <code>(NPO Áº∫Â§± √∑ 4) + Á∂≠Ê???+ ?µÂÇ∑‰∏üÂ§±??/code></li>
                        <li><strong>Á¨?Â∞èÊ??ä‰ª•Âæ?</strong> <code>Á∂≠Ê???+ ?µÂÇ∑‰∏üÂ§±??/code></li>
                    </ul>
                    <p style="margin-top: 10px; font-size: 0.9em; color: #666; font-style: italic;">
                        Ë®? NPO Áº∫Â§±?®Â?3Â∞èÊ??ßË??ÖÂ??êÔ?Á¨?Â∞èÊ?Ë£úÂ?‰∏Ä?äÔ?Á¨???Â∞èÊ??ÑË??ÖÂ??Ü‰?‰∏ÄÔº?                    </p>
                </div>
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        const fields = {
            weight: container.querySelector('#ifd-weight'),
            npo: container.querySelector('#ifd-npo')
        };
        const resultEl = container.querySelector('#ifd-result');

        const calculate = () => {
            const weight = parseFloat(fields.weight.value);
            const npoHours = parseFloat(fields.npo.value);
            const traumaRadio = container.querySelector('input[name="trauma"]:checked');

            if (isNaN(weight) || isNaN(npoHours) || !traumaRadio) {
                resultEl.style.display = 'none';
                return;
            }

            const maintenanceRate =
                weight > 20 ? weight + 40 : weight > 10 ? 40 + (weight - 10) * 2 : weight * 4;
            const npoDeficit = maintenanceRate * npoHours;
            const traumaLossRate = parseFloat(traumaRadio.value) * weight;

            const firstHourFluids = npoDeficit / 2 + maintenanceRate + traumaLossRate;
            const secondHourFluids = npoDeficit / 4 + maintenanceRate + traumaLossRate;
            const thirdHourFluids = npoDeficit / 4 + maintenanceRate + traumaLossRate;
            const fourthHourFluids = maintenanceRate + traumaLossRate;

            resultEl.innerHTML = `
                <div class="result-item">
                    <span class="value">${maintenanceRate.toFixed(0)} <span class="unit">mL/hr</span></span>
                    <span class="label">Hourly maintenance fluid</span>
                </div>
                <div class="result-item">
                    <span class="value">${npoDeficit.toFixed(0)} <span class="unit">mL</span></span>
                    <span class="label">NPO fluid deficit</span>
                </div>
                <div class="result-item">
                    <span class="value">${firstHourFluids.toFixed(0)} <span class="unit">mL/hr</span></span>
                    <span class="label" style="text-align: left;">
                        1st hour fluids
                        <br><br>
                        2nd hour: ${secondHourFluids.toFixed(0)} mL/hr
                        <br>
                        3rd hour: ${thirdHourFluids.toFixed(0)} mL/hr
                        <br>
                        4th hr and beyond: ${fourthHourFluids.toFixed(0)} mL/hr
                    </span>
                </div>
            `;
            resultEl.style.display = 'grid';
        };

        getMostRecentObservation(client, LOINC_CODES.WEIGHT).then(obs => {
            if (obs && obs.valueQuantity) {
                fields.weight.value = obs.valueQuantity.value.toFixed(1);
            }
            calculate();
        });

        container.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', () => {
                if (input.type === 'radio') {
                    const group = input.closest('.radio-group');
                    group
                        .querySelectorAll('label')
                        .forEach(label => label.classList.remove('selected'));
                    input.parentElement.classList.add('selected');
                }
                calculate();
            });
        });

        calculate();
    }
};
