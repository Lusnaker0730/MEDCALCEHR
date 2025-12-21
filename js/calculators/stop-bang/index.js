/**
 * STOP-BANG Score for Obstructive Sleep Apnea
 *
 * 使用 Score Calculator 工廠函數遷移
 * Screens for obstructive sleep apnea using validated clinical criteria.
 */
import { createScoreCalculator } from '../shared/score-calculator.js';
import { getPatient, getPatientConditions, getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { createStalenessTracker } from '../../data-staleness.js';
import { uiBuilder } from '../../ui-builder.js';
const config = {
    id: 'stop-bang',
    title: 'STOP-BANG Score for Obstructive Sleep Apnea',
    description: 'Screens for obstructive sleep apnea using validated clinical criteria.',
    infoAlert: 'Check all conditions that apply to the patient.',
    sections: [
        {
            title: 'STOP-BANG Criteria',
            icon: '😴',
            options: [
                { id: 'sb-snoring', label: 'Snoring - Do you snore loudly?', value: 1, description: 'Louder than talking or loud enough to be heard through closed doors' },
                { id: 'sb-tired', label: 'Tired - Do you often feel tired, fatigued, or sleepy during daytime?', value: 1 },
                { id: 'sb-observed', label: 'Observed - Has anyone observed you stop breathing during your sleep?', value: 1 },
                { id: 'sb-pressure', label: 'Pressure - Do you have or are you being treated for high blood pressure?', value: 1 },
                { id: 'sb-bmi', label: 'BMI more than 35 kg/m²', value: 1 },
                { id: 'sb-age', label: 'Age over 50 years old', value: 1 },
                { id: 'sb-neck', label: 'Neck circumference greater than 40 cm', value: 1 },
                { id: 'sb-gender', label: 'Male gender', value: 1 }
            ]
        }
    ],
    riskLevels: [
        {
            minScore: 0,
            maxScore: 2,
            risk: 'Low probability of moderate to severe OSA',
            category: 'Low Risk',
            severity: 'success'
        },
        {
            minScore: 3,
            maxScore: 4,
            risk: 'Intermediate probability of moderate to severe OSA',
            category: 'Intermediate Risk',
            severity: 'warning',
            recommendation: 'Consider polysomnography or home sleep apnea testing.'
        },
        {
            minScore: 5,
            maxScore: 8,
            risk: 'High probability of moderate to severe OSA',
            category: 'High Risk',
            severity: 'danger',
            recommendation: 'Strongly consider polysomnography. May benefit from CPAP therapy.'
        }
    ],
    formulaItems: [
        {
            title: 'Risk Categories',
            content: `
                <ul class="info-list">
                    <li><strong>Low Risk (0-2):</strong> Low probability of moderate to severe OSA</li>
                    <li><strong>Intermediate Risk (3-4):</strong> Intermediate probability of moderate to severe OSA</li>
                    <li><strong>High Risk (5-8):</strong> High probability of moderate to severe OSA</li>
                </ul>
            `
        }
    ],
    references: [
        'Chung F, et al. STOP questionnaire: a tool to screen patients for obstructive sleep apnea. <em>Anesthesiology</em>. 2008;108(5):812-821.',
        'Chung F, et al. High STOP-Bang score indicates a high probability of obstructive sleep apnoea. <em>Br J Anaesth</em>. 2012;108(5):768-775.'
    ]
};
// 創建基礎計算器
const baseCalculator = createScoreCalculator(config);
// 導出帶有 FHIR 自動填入的計算器
export const stopBang = {
    ...baseCalculator,
    initialize(client, patient, container) {
        // 先調用基礎初始化
        uiBuilder.initializeComponents(container);
        // 初始化 staleness tracker
        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);
        const setCheckbox = (id, checked, obs, loinc, label) => {
            const checkbox = container.querySelector(`#${id}`);
            if (checkbox && !checkbox.checked && checked) {
                checkbox.checked = true;
                checkbox.dispatchEvent(new Event('change'));
                if (obs && loinc && label) {
                    stalenessTracker.trackObservation(`#${id}`, obs, loinc, label);
                }
            }
        };
        // 計算函數
        const calculate = () => {
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            let score = 0;
            checkboxes.forEach((box) => {
                const checkbox = box;
                if (checkbox.checked) {
                    score++;
                }
            });
            let riskLevel = '';
            let riskDescription = '';
            let alertType = 'info';
            if (score <= 2) {
                riskLevel = 'Low Risk';
                riskDescription = 'Low probability of moderate to severe OSA';
                alertType = 'success';
            }
            else if (score <= 4) {
                riskLevel = 'Intermediate Risk';
                riskDescription = 'Intermediate probability of moderate to severe OSA';
                alertType = 'warning';
            }
            else {
                riskLevel = 'High Risk';
                riskDescription = 'High probability of moderate to severe OSA';
                alertType = 'danger';
            }
            const resultBox = document.getElementById('stop-bang-result');
            if (resultBox) {
                const resultContent = resultBox.querySelector('.ui-result-content');
                if (resultContent) {
                    resultContent.innerHTML = `
                        ${uiBuilder.createResultItem({
                        label: 'STOP-BANG Score',
                        value: score.toString(),
                        unit: '/ 8',
                        interpretation: riskLevel,
                        alertClass: `ui-alert-${alertType}`
                    })}
                        ${uiBuilder.createAlert({
                        type: alertType,
                        message: `<strong>${riskLevel}</strong>: ${riskDescription}`
                    })}
                    `;
                }
                resultBox.classList.add('show');
            }
        };
        // 綁定事件
        container.querySelectorAll('input[type="checkbox"]').forEach(box => {
            box.addEventListener('change', calculate);
        });
        // FHIR 自動填入
        if (client) {
            getPatient(client).then(pt => {
                if (pt) {
                    // 年齡檢查
                    const birthDate = new Date(pt.birthDate);
                    const today = new Date();
                    let age = today.getFullYear() - birthDate.getFullYear();
                    const m = today.getMonth() - birthDate.getMonth();
                    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                        age--;
                    }
                    if (age > 50) {
                        setCheckbox('sb-age', true);
                    }
                    // 性別檢查
                    if (pt.gender && pt.gender.toLowerCase() === 'male') {
                        setCheckbox('sb-gender', true);
                    }
                }
            }).catch(e => console.warn(e));
            // BMI 檢查
            getMostRecentObservation(client, LOINC_CODES.BMI).then(obs => {
                if (obs && obs.valueQuantity && obs.valueQuantity.value > 35) {
                    setCheckbox('sb-bmi', true, obs, LOINC_CODES.BMI, 'BMI');
                }
            }).catch(e => console.warn(e));
            // 高血壓檢查
            getPatientConditions(client, ['38341003']).then(conditions => {
                if (conditions.length > 0) {
                    setCheckbox('sb-pressure', true);
                }
            }).catch(e => console.warn(e));
        }
        // 初始計算
        calculate();
    }
};
