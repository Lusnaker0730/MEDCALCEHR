/**
 * PERC Rule for Pulmonary Embolism Calculator
 *
 * 使用 Score Calculator 工廠函數遷移
 * Rules out PE if no criteria are present and pre-test probability is ≤15%.
 */
import { createScoreCalculator } from '../shared/score-calculator.js';
import { calculateAge, getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { createStalenessTracker } from '../../data-staleness.js';
import { uiBuilder } from '../../ui-builder.js';
const config = {
    id: 'perc',
    title: 'PERC Rule for Pulmonary Embolism',
    description: 'Rules out PE if no criteria are present and pre-test probability is ≤15%.',
    infoAlert: '<strong>Important:</strong> PERC is only valid when pre-test probability for PE is ≤15%.',
    sections: [
        {
            title: 'PERC Criteria',
            icon: '📋',
            options: [
                { id: 'age50', label: 'Age ≥ 50 years', value: 1 },
                { id: 'hr100', label: 'Heart rate ≥ 100 bpm', value: 1 },
                { id: 'o2sat', label: 'Room air SaO₂ < 95%', value: 1 },
                { id: 'hemoptysis', label: 'Hemoptysis (coughing up blood)', value: 1 },
                { id: 'exogenous-estrogen', label: 'Exogenous estrogen use', value: 1 },
                { id: 'prior-dvt-pe', label: 'History of DVT or PE', value: 1 },
                { id: 'unilateral-swelling', label: 'Unilateral leg swelling', value: 1 },
                { id: 'trauma-surgery', label: 'Recent trauma or surgery requiring hospitalization', value: 1 }
            ]
        }
    ],
    riskLevels: [
        {
            minScore: 0,
            maxScore: 0,
            risk: 'PE may be ruled out',
            category: 'PERC Negative',
            severity: 'success',
            recommendation: 'No further testing is indicated if pre-test probability is low (≤15%).'
        },
        {
            minScore: 1,
            maxScore: 999,
            risk: 'PE is NOT ruled out',
            category: 'PERC Positive',
            severity: 'danger',
            recommendation: 'Further testing (e.g., D-dimer, imaging) should be considered.'
        }
    ]
};
// 創建基礎計算器
const baseCalculator = createScoreCalculator(config);
// 導出帶有 FHIR 自動填入的計算器
export const perc = {
    ...baseCalculator,
    initialize(client, patient, container) {
        uiBuilder.initializeComponents(container);
        // 初始化 staleness tracker
        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);
        const setCheckbox = (id, checked, obs, loinc, label) => {
            const checkbox = container.querySelector(`#${id}`);
            if (checkbox && checked) {
                checkbox.checked = true;
                if (obs && loinc && label) {
                    stalenessTracker.trackObservation(`#${id}`, obs, loinc, label);
                }
            }
        };
        // 計算函數
        const calculate = () => {
            const criteriaMet = [];
            container.querySelectorAll('input[type="checkbox"]:checked').forEach(box => {
                criteriaMet.push(box.id);
            });
            let resultTitle = '';
            let interpretation = '';
            let alertClass = 'success';
            if (criteriaMet.length === 0) {
                resultTitle = 'PERC Negative';
                interpretation = 'PE may be ruled out. No further testing is indicated if pre-test probability is low (≤15%).';
                alertClass = 'success';
            }
            else {
                resultTitle = 'PERC Positive';
                interpretation = 'The rule is positive. PE is NOT ruled out. Further testing (e.g., D-dimer, imaging) should be considered.';
                alertClass = 'danger';
            }
            const resultBox = document.getElementById('perc-result');
            if (resultBox) {
                const resultContent = resultBox.querySelector('.ui-result-content');
                if (resultContent) {
                    resultContent.innerHTML = `
                        ${uiBuilder.createResultItem({
                        label: 'Status',
                        value: resultTitle,
                        alertClass: `ui-alert-${alertClass}`
                    })}
                        ${criteriaMet.length > 0 ? uiBuilder.createResultItem({
                        label: 'Criteria Met',
                        value: `${criteriaMet.length} / 8`
                    }) : ''}
                        
                        <div class="ui-alert ui-alert-${alertClass} mt-10">
                            <span class="ui-alert-icon">${alertClass === 'success' ? '✓' : '⚠️'}</span>
                            <div class="ui-alert-content">
                                <strong>Result:</strong> ${interpretation}
                            </div>
                        </div>
                    `;
                }
                resultBox.classList.add('show');
            }
        };
        // 綁定事件
        container.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', calculate);
        });
        // FHIR 自動填入
        if (patient && patient.birthDate) {
            const age = calculateAge(patient.birthDate);
            if (age >= 50) {
                setCheckbox('age50', true);
            }
        }
        if (client) {
            getMostRecentObservation(client, LOINC_CODES.HEART_RATE).then(obs => {
                if (obs && obs.valueQuantity && obs.valueQuantity.value >= 100) {
                    setCheckbox('hr100', true, obs, LOINC_CODES.HEART_RATE, 'Heart Rate');
                }
            }).catch(e => console.warn(e))
                .finally(() => calculate());
            getMostRecentObservation(client, LOINC_CODES.OXYGEN_SATURATION).then(obs => {
                if (obs && obs.valueQuantity && obs.valueQuantity.value < 95) {
                    setCheckbox('o2sat', true, obs, LOINC_CODES.OXYGEN_SATURATION, 'O2 Saturation');
                }
            }).catch(e => console.warn(e))
                .finally(() => calculate());
        }
        else {
            calculate();
        }
    }
};
