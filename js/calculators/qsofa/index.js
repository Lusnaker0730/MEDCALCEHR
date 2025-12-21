/**
 * qSOFA Score for Sepsis
 *
 * 使用 Checkbox 工廠函數重構
 * 保留 FHIR 自動填充功能
 */
import { createScoreCalculator } from '../shared/score-calculator.js';
import { getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { createStalenessTracker } from '../../data-staleness.js';
// 基礎計算器配置
const baseCalculator = createScoreCalculator({
    id: 'qsofa',
    title: 'qSOFA Score for Sepsis',
    description: 'Identifies patients with suspected infection at risk for poor outcomes (sepsis). Score ≥ 2 is positive.',
    infoAlert: 'Check all criteria that apply. A score ≥ 2 suggests higher risk of mortality or prolonged ICU stay.',
    sections: [
        {
            title: 'qSOFA Criteria',
            icon: '📋',
            options: [
                { id: 'qsofa-rr', label: 'Respiratory Rate ≥ 22/min (+1)', value: 1 },
                { id: 'qsofa-ams', label: 'Altered Mental Status (GCS < 15) (+1)', value: 1 },
                { id: 'qsofa-sbp', label: 'Systolic Blood Pressure ≤ 100 mmHg (+1)', value: 1 }
            ]
        }
    ],
    riskLevels: [
        {
            minScore: 0, maxScore: 0,
            risk: 'Negative Screen',
            category: 'Lower Risk',
            severity: 'success',
            recommendation: 'Lower risk, but continue to monitor if infection is suspected.'
        },
        {
            minScore: 1, maxScore: 1,
            risk: 'Intermediate',
            category: 'Monitor Closely',
            severity: 'warning',
            recommendation: 'Monitor closely. Consider early intervention if clinical suspicion is high.'
        },
        {
            minScore: 2, maxScore: 3,
            risk: 'Positive Screen',
            category: 'High Risk',
            severity: 'danger',
            recommendation: 'Increased risk of poor outcomes. Consider further sepsis evaluation (SOFA score, lactate, blood cultures).'
        }
    ],
    formulaItems: [
        {
            title: 'Interpretation',
            content: `
                <ul class="info-list">
                    <li><strong>Score ≥ 2:</strong> Positive screen; higher risk of poor outcomes.</li>
                    <li><strong>Score < 2:</strong> Negative screen; lower risk but continue monitoring.</li>
                </ul>
            `
        },
        {
            title: 'Next Steps for Positive qSOFA',
            content: `
                <ul class="info-list">
                    <li>Calculate full SOFA score</li>
                    <li>Measure serum lactate</li>
                    <li>Obtain blood cultures</li>
                    <li>Consider early antibiotic therapy</li>
                    <li>Assess for organ dysfunction</li>
                </ul>
            `
        }
    ]
});
// 擴展計算器以支持 FHIR 自動填充
export const qsofaScore = {
    ...baseCalculator,
    initialize(client, patient, container) {
        // 調用基礎初始化
        baseCalculator.initialize(client, patient, container);
        // 如果有 FHIR 客戶端，進行自動填充
        if (client) {
            const stalenessTracker = createStalenessTracker();
            stalenessTracker.setContainer(container);
            // 自動填充呼吸速率
            getMostRecentObservation(client, LOINC_CODES.RESPIRATORY_RATE).then(obs => {
                if (obs?.valueQuantity?.value >= 22) {
                    const box = container.querySelector('#qsofa-rr');
                    if (box) {
                        box.checked = true;
                        box.dispatchEvent(new Event('change'));
                        stalenessTracker.trackObservation('#qsofa-rr', obs, LOINC_CODES.RESPIRATORY_RATE, 'Respiratory Rate');
                    }
                }
            }).catch(e => console.warn(e));
            // 自動填充收縮壓
            getMostRecentObservation(client, LOINC_CODES.SYSTOLIC_BP).then(obs => {
                if (obs?.valueQuantity?.value <= 100) {
                    const box = container.querySelector('#qsofa-sbp');
                    if (box) {
                        box.checked = true;
                        box.dispatchEvent(new Event('change'));
                        stalenessTracker.trackObservation('#qsofa-sbp', obs, LOINC_CODES.SYSTOLIC_BP, 'Systolic BP');
                    }
                }
            }).catch(e => console.warn(e));
        }
    }
};
