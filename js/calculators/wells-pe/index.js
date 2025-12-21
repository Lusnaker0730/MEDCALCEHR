/**
 * Wells' Criteria for Pulmonary Embolism Calculator
 *
 * 使用 Yes/No Calculator 工廠函數遷移
 * Estimates pre-test probability of pulmonary embolism (PE) to guide diagnostic workup.
 */
import { createYesNoCalculator } from '../shared/yes-no-calculator.js';
import { getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { createStalenessTracker } from '../../data-staleness.js';
import { uiBuilder } from '../../ui-builder.js';
const config = {
    id: 'wells-pe',
    title: "Wells' Criteria for Pulmonary Embolism",
    description: 'Estimates pre-test probability of pulmonary embolism (PE) to guide diagnostic workup.',
    infoAlert: 'Check all criteria that apply to the patient. Score interpretation helps guide D-dimer testing and CT angiography decisions.',
    sectionTitle: 'Clinical Criteria',
    sectionIcon: '🫁',
    questions: [
        { id: 'wells-dvt', label: 'Clinical signs and symptoms of DVT', points: 3 },
        { id: 'wells-alt', label: 'PE is #1 diagnosis OR equally likely', points: 3 },
        { id: 'wells-hr', label: 'Heart rate > 100 bpm', points: 1.5 },
        { id: 'wells-immo', label: 'Immobilization (at least 3 days) or surgery in previous 4 weeks', points: 1.5 },
        { id: 'wells-prev', label: 'Previous, objectively diagnosed PE or DVT', points: 1.5 },
        { id: 'wells-hemo', label: 'Hemoptysis', points: 1 },
        { id: 'wells-mal', label: 'Malignancy (with treatment within 6 months, or palliative)', points: 1 }
    ],
    riskLevels: [
        {
            minScore: 0,
            maxScore: 1,
            label: 'Low Risk',
            severity: 'success',
            recommendation: 'PE is unlikely. Consider D-dimer testing. If negative, PE can be safely excluded.'
        },
        {
            minScore: 1.5,
            maxScore: 4,
            label: 'Low-Moderate Risk',
            severity: 'warning',
            recommendation: 'PE is less likely but not excluded. Consider D-dimer testing before proceeding to imaging.'
        },
        {
            minScore: 4.5,
            maxScore: 6,
            label: 'Moderate-High Risk',
            severity: 'danger',
            recommendation: 'PE is likely. Proceed directly to CT pulmonary angiography (CTPA) for definitive diagnosis.'
        },
        {
            minScore: 6.5,
            maxScore: 999,
            label: 'High Risk',
            severity: 'danger',
            recommendation: 'PE is highly likely. Proceed directly to CT pulmonary angiography (CTPA). Consider empiric anticoagulation if no contraindications while awaiting imaging.'
        }
    ],
    references: [
        'Wells PS, Anderson DR, Rodger M, et al. Derivation of a simple clinical model to categorize patients probability of pulmonary embolism: increasing the models utility with the SimpliRED D-dimer. <em>Thromb Haemost</em>. 2000;83(3):416-420.'
    ],
    customResultRenderer: (score) => {
        let risk = '';
        let twoTierModel = '';
        let alertClass = 'success';
        let interpretation = '';
        if (score <= 1) {
            risk = 'Low Risk';
            alertClass = 'success';
            interpretation = 'PE is unlikely. Consider D-dimer testing. If negative, PE can be safely excluded.';
            twoTierModel = 'PE Unlikely (Score < 2)';
        }
        else if (score <= 4) {
            risk = 'Low-Moderate Risk';
            alertClass = 'warning';
            interpretation = 'PE is less likely but not excluded. Consider D-dimer testing before proceeding to imaging.';
            twoTierModel = 'PE Unlikely (Score ≤ 4)';
        }
        else if (score <= 6) {
            risk = 'Moderate-High Risk';
            alertClass = 'danger';
            interpretation = 'PE is likely. Proceed directly to CT pulmonary angiography (CTPA) for definitive diagnosis.';
            twoTierModel = 'PE Likely (Score > 4)';
        }
        else {
            risk = 'High Risk';
            alertClass = 'danger';
            interpretation = 'PE is highly likely. Proceed directly to CT pulmonary angiography (CTPA). Consider empiric anticoagulation if no contraindications while awaiting imaging.';
            twoTierModel = 'PE Likely (Score > 4)';
        }
        return `
            ${uiBuilder.createResultItem({
            label: 'Total Score',
            value: score.toString(),
            unit: 'points',
            interpretation: risk,
            alertClass: `ui-alert-${alertClass}`
        })}
            
            <div class="result-item mt-15 p-10">
                <span class="result-item-label font-semibold text-muted">Two-Tier Model:</span>
                <span class="result-item-value font-bold">${twoTierModel}</span>
            </div>
            
            <div class="ui-alert ui-alert-${alertClass} mt-20">
                <span class="ui-alert-icon">${alertClass === 'danger' ? '⚠️' : 'ℹ️'}</span>
                <div class="ui-alert-content">
                    <p>${interpretation}</p>
                </div>
            </div>
        `;
    }
};
// 創建基礎計算器
const baseCalculator = createYesNoCalculator(config);
// 導出帶有 FHIR 自動填入的計算器
export const wellsPE = {
    ...baseCalculator,
    initialize(client, patient, container) {
        uiBuilder.initializeComponents(container);
        // 初始化 staleness tracker
        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);
        const setRadioValue = (name, value, obs, loinc, label) => {
            const radio = container.querySelector(`input[name="${name}"][value="${value}"]`);
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change'));
                if (obs && loinc && label) {
                    stalenessTracker.trackObservation(`input[name="${name}"]`, obs, loinc, label);
                }
            }
        };
        // 計算函數
        const calculate = () => {
            let score = 0;
            config.questions.forEach(q => {
                const radio = container.querySelector(`input[name="${q.id}"]:checked`);
                if (radio) {
                    score += parseFloat(radio.value) || 0;
                }
            });
            // 使用自定義渲染器
            const resultBox = document.getElementById('wells-pe-result');
            if (resultBox) {
                const resultContent = resultBox.querySelector('.ui-result-content');
                if (resultContent && config.customResultRenderer) {
                    resultContent.innerHTML = config.customResultRenderer(score);
                }
                resultBox.classList.add('show');
            }
        };
        // 綁定事件
        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', calculate);
        });
        // FHIR 自動填入心率
        if (client) {
            getMostRecentObservation(client, LOINC_CODES.HEART_RATE).then(hrObs => {
                if (hrObs && hrObs.valueQuantity && hrObs.valueQuantity.value > 100) {
                    setRadioValue('wells-hr', '1.5', hrObs, LOINC_CODES.HEART_RATE, 'Heart Rate');
                }
            }).catch(e => console.warn(e));
        }
        // 初始計算
        calculate();
    }
};
