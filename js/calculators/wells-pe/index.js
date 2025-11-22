import { getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { uiBuilder } from '../../ui-builder.js';

export const wellsPE = {
    id: 'wells-pe',
    title: "Wells' Criteria for Pulmonary Embolism",
    description:
        'Estimates pre-test probability of pulmonary embolism (PE) to guide diagnostic workup.',
    generateHTML: function () {
        const criteria = [
            { id: 'wells-dvt', label: 'Clinical signs and symptoms of DVT', points: 3 },
            { id: 'wells-alt', label: 'PE is #1 diagnosis OR equally likely', points: 3 },
            { id: 'wells-hr', label: 'Heart rate > 100 bpm', points: 1.5 },
            { id: 'wells-immo', label: 'Immobilization (at least 3 days) or surgery in previous 4 weeks', points: 1.5 },
            { id: 'wells-prev', label: 'Previous, objectively diagnosed PE or DVT', points: 1.5 },
            { id: 'wells-hemo', label: 'Hemoptysis', points: 1 },
            { id: 'wells-mal', label: 'Malignancy (with treatment within 6 months, or palliative)', points: 1 }
        ];

        const inputs = uiBuilder.createSection({
            title: 'Clinical Criteria',
            content: criteria.map(item => 
                uiBuilder.createRadioGroup({
                    name: item.id,
                    label: item.label,
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: item.points.toString(), label: `Yes (+${item.points})` }
                    ]
                })
            ).join('')
        });

        return `
            <div class="calculator-header">
                <h3>${this.title}</h3>
                <p class="description">${this.description}</p>
            </div>
            
            <div class="alert info">
                <span class="alert-icon">ℹ️</span>
                <div class="alert-content">
                    <div class="alert-title">Instructions</div>
                    <p>Check all criteria that apply to the patient. Score interpretation helps guide D-dimer testing and CT angiography decisions.</p>
                </div>
            </div>
            
            ${inputs}
            
            ${uiBuilder.createResultBox({ id: 'wells-result', title: "Wells' PE Score Results" })}
            
            <div class="info-section mt-20">
                <h4>📚 Reference</h4>
                <p>Wells PS, Anderson DR, Rodger M, et al. Derivation of a simple clinical model to categorize patients probability of pulmonary embolism: increasing the models utility with the SimpliRED D-dimer. <em>Thromb Haemost</em>. 2000;83(3):416-420.</p>
            </div>
        `;
    },
    initialize: function (client, patient, container) {
        uiBuilder.initializeComponents(container);

        const setRadioValue = (name, value) => {
            const radio = container.querySelector(`input[name="${name}"][value="${value}"]`);
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change'));
            }
        };

        const calculate = () => {
            let score = 0;
            const radios = container.querySelectorAll('input[type="radio"]:checked');
            radios.forEach(radio => {
                score += parseFloat(radio.value);
            });

            let risk = '';
            let riskClass = '';
            let interpretation = '';
            let twoTierModel = '';
            let alertClass = '';

            if (score <= 1) {
                risk = 'Low Risk';
                riskClass = 'low';
                alertClass = 'ui-alert-success';
                interpretation = 'PE is unlikely. Consider D-dimer testing. If negative, PE can be safely excluded.';
                twoTierModel = 'PE Unlikely (Score < 2)';
            } else if (score <= 6) {
                risk = score <= 4 ? 'Low-Moderate Risk' : 'Moderate-High Risk';
                riskClass = score <= 4 ? 'moderate' : 'high';
                alertClass = score <= 4 ? 'ui-alert-warning' : 'ui-alert-danger';
                
                if (score <= 4) {
                    interpretation = 'PE is less likely but not excluded. Consider D-dimer testing before proceeding to imaging.';
                    twoTierModel = 'PE Unlikely (Score ≤ 4)';
                } else {
                    interpretation = 'PE is likely. Proceed directly to CT pulmonary angiography (CTPA) for definitive diagnosis.';
                    twoTierModel = 'PE Likely (Score > 4)';
                }
            } else {
                risk = 'High Risk';
                riskClass = 'high';
                alertClass = 'ui-alert-danger';
                interpretation = 'PE is highly likely. Proceed directly to CT pulmonary angiography (CTPA). Consider empiric anticoagulation if no contraindications while awaiting imaging.';
                twoTierModel = 'PE Likely (Score > 4)';
            }

            const resultBox = container.querySelector('#wells-result');
            const resultContent = resultBox.querySelector('.ui-result-content');

            resultContent.innerHTML = `
                ${uiBuilder.createResultItem({ 
                    label: 'Total Score', 
                    value: score, 
                    unit: 'points',
                    interpretation: risk,
                    alertClass: alertClass
                })}
                
                <div class="result-item" style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                    <span class="result-item-label" style="font-weight: 600; color: #555;">Two-Tier Model:</span>
                    <span class="result-item-value" style="font-weight: bold; margin-left: 5px;">${twoTierModel}</span>
                </div>
                
                <div class="ui-alert ${alertClass} mt-20">
                    <span class="ui-alert-icon">${riskClass === 'high' ? '⚠️' : 'ℹ️'}</span>
                    <div class="ui-alert-content">
                        <p>${interpretation}</p>
                    </div>
                </div>
            `;
            
            resultBox.classList.add('show');
        };

        // Auto-populate heart rate if available
        if (client) {
            getMostRecentObservation(client, LOINC_CODES.HEART_RATE).then(hrObs => {
                if (hrObs && hrObs.valueQuantity && hrObs.valueQuantity.value > 100) {
                    setRadioValue('wells-hr', '1.5');
                }
            });
        }

        // Add event listeners
        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', calculate);
        });

        // Initial calculation
        calculate();
    }
};