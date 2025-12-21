import { getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { createStalenessTracker } from '../../data-staleness.js';
import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { displayError, logError } from '../../errorHandler.js';
export const rcri = {
    id: 'rcri',
    title: 'Revised Cardiac Risk Index for Pre-Operative Risk',
    description: 'Estimates risk of cardiac complications after noncardiac surgery.',
    generateHTML: function () {
        const riskFactors = [
            { id: 'rcri-surgery', label: 'High-risk surgery (intraperitoneal, intrathoracic, suprainguinal vascular)' },
            { id: 'rcri-ihd', label: 'History of Ischemic Heart Disease (MI or positive stress test)' },
            { id: 'rcri-hf', label: 'History of Congestive Heart Failure' },
            { id: 'rcri-cvd', label: 'History of Cerebrovascular Disease (stroke or TIA)' },
            { id: 'rcri-insulin', label: 'Preoperative treatment with insulin' },
            { id: 'rcri-creatinine', label: 'Preoperative serum creatinine > 2.0 mg/dL' }
        ];
        const inputs = uiBuilder.createSection({
            title: 'RCRI Factors',
            content: riskFactors.map(factor => uiBuilder.createRadioGroup({
                name: factor.id,
                label: factor.label,
                options: [
                    { value: '0', label: 'No', checked: true },
                    { value: '1', label: 'Yes (+1)' }
                ]
            })).join('')
        });
        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            ${inputs}
            
            <div id="rcri-error-container"></div>
            ${uiBuilder.createResultBox({ id: 'rcri-result', title: 'RCRI Result' })}
            
            <div class="info-section mt-20">
                <h4>Reference</h4>
                <p>Lee, T. H., Marcantonio, E. R., Mangione, C. M., Thomas, E. J., Polanczyk, C. A., Cook, E. F., ... & Goldman, L. (1999). Derivation and prospective validation of a simple index for prediction of cardiac risk of major noncardiac surgery. <em>Circulation</em>, 100(10), 1043-1049.</p>
                <img src="js/calculators/rcri/Lees-Revised-Cardiac-Risk-Index-RCRI_W640.jpg" alt="RCRI Risk Stratification Table" style="max-width: 100%; height: auto; margin-top: 15px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" />
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);
        // Initialize staleness tracker
        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);
        const setRadioValue = (name, value) => {
            const radio = container.querySelector(`input[name="${name}"][value="${value}"]`);
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change'));
            }
        };
        const calculate = () => {
            try {
                // Clear validation errors
                const errorContainer = container.querySelector('#rcri-error-container');
                if (errorContainer)
                    errorContainer.innerHTML = '';
                let score = 0;
                const radios = container.querySelectorAll('input[type="radio"]:checked');
                radios.forEach(radio => {
                    score += parseInt(radio.value);
                });
                let risk = '';
                let complicationsRate = '';
                let alertClass = '';
                if (score === 0) {
                    risk = 'Class I (Low Risk)';
                    complicationsRate = '0.4%';
                    alertClass = 'ui-alert-success';
                }
                else if (score === 1) {
                    risk = 'Class II (Low Risk)';
                    complicationsRate = '0.9%';
                    alertClass = 'ui-alert-success';
                }
                else if (score === 2) {
                    risk = 'Class III (Moderate Risk)';
                    complicationsRate = '6.6%';
                    alertClass = 'ui-alert-warning';
                }
                else {
                    risk = 'Class IV (High Risk)';
                    complicationsRate = '11%';
                    alertClass = 'ui-alert-danger';
                }
                const resultBox = container.querySelector('#rcri-result');
                if (resultBox) {
                    const resultContent = resultBox.querySelector('.ui-result-content');
                    if (resultContent) {
                        resultContent.innerHTML = `
                        ${uiBuilder.createResultItem({
                            label: 'Total Score',
                            value: score,
                            unit: '/ 6 points',
                            interpretation: risk,
                            alertClass: alertClass
                        })}
                        
                        <div class="ui-alert ${alertClass} mt-10">
                            <span class="ui-alert-icon">📊</span>
                            <div class="ui-alert-content">
                                Major Cardiac Complications Rate: <strong>${complicationsRate}</strong>
                            </div>
                        </div>
                    `;
                    }
                    resultBox.classList.add('show');
                }
            }
            catch (error) {
                const errorContainer = container.querySelector('#rcri-error-container');
                if (errorContainer) {
                    displayError(errorContainer, error);
                }
                else {
                    console.error(error);
                }
                logError(error, { calculator: 'rcri', action: 'calculate' });
            }
        };
        // Event listeners
        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', calculate);
        });
        // Auto-populate creatinine
        if (client) {
            getMostRecentObservation(client, LOINC_CODES.CREATININE).then(obs => {
                if (obs?.valueQuantity) {
                    let crValue = obs.valueQuantity.value;
                    const unit = obs.valueQuantity.unit || 'mg/dL';
                    // It's possible crValue is nullish but TS might complain if 'convert' expects number.
                    // UnitConverter.convert usually returns number | null.
                    if (crValue !== undefined && crValue !== null) {
                        const convertedValue = UnitConverter.convert(crValue, unit, 'mg/dL', 'creatinine');
                        if (convertedValue !== null && convertedValue > 2.0) {
                            setRadioValue('rcri-creatinine', '1');
                        }
                    }
                    // Track staleness
                    stalenessTracker.trackObservation('input[name="rcri-creatinine"]', obs, LOINC_CODES.CREATININE, 'Serum Creatinine');
                }
            }).catch(e => console.warn(e));
        }
        calculate();
    }
};
