/**
 * Modified Early Warning Score (MEWS) Calculator
 * 
 * 使用 Radio Score Calculator 工廠函數遷移
 * Determines the degree of illness of a patient. Identifies patients at risk for clinical deterioration.
 */

import { createRadioScoreCalculator, RadioScoreCalculatorConfig } from '../shared/radio-score-calculator.js';
import { getMostRecentObservation } from '../../utils.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import { createStalenessTracker } from '../../data-staleness.js';
import { uiBuilder } from '../../ui-builder.js';

const config: RadioScoreCalculatorConfig = {
    id: 'mews',
    title: 'Modified Early Warning Score (MEWS)',
    description: 'Determines the degree of illness of a patient. Identifies patients at risk for clinical deterioration.',
    infoAlert: 'Different hospitals may use different modifications of MEWS. Verify your institution protocols.',
    sections: [
        {
            id: 'mews-sbp',
            title: 'Systolic BP (mmHg)',
            icon: '🩸',
            options: [
                { value: '0', label: '101-199 mmHg', checked: true },
                { value: '1', label: '81-100 mmHg (+1)' },
                { value: '2', label: '71-80 or ≥200 mmHg (+2)' },
                { value: '3', label: '≤70 mmHg (+3)' }
            ]
        },
        {
            id: 'mews-hr',
            title: 'Heart Rate (bpm)',
            icon: '💓',
            options: [
                { value: '0', label: '51-100 bpm', checked: true },
                { value: '1', label: '41-50 or 101-110 bpm (+1)' },
                { value: '2', label: '<40 or 111-129 bpm (+2)' },
                { value: '3', label: '≥130 bpm (+3)' }
            ]
        },
        {
            id: 'mews-rr',
            title: 'Respiratory Rate (breaths/min)',
            icon: '🫁',
            options: [
                { value: '0', label: '9-14 bpm', checked: true },
                { value: '1', label: '15-20 bpm (+1)' },
                { value: '2', label: '<9 or 21-29 bpm (+2)' },
                { value: '3', label: '≥30 bpm (+3)' }
            ]
        },
        {
            id: 'mews-temp',
            title: 'Temperature',
            icon: '🌡️',
            options: [
                { value: '0', label: '35.0-38.4°C (95-101.1°F)', checked: true },
                { value: '2', label: '<35°C (<95°F) or ≥38.5°C (≥101.3°F) (+2)' }
            ]
        },
        {
            id: 'mews-avpu',
            title: 'AVPU Scale (Level of Consciousness)',
            icon: '🧠',
            options: [
                { value: '0', label: 'Alert', checked: true },
                { value: '1', label: 'Voice - Responds to voice (+1)' },
                { value: '2', label: 'Pain - Responds to pain (+2)' },
                { value: '3', label: 'Unresponsive (+3)' }
            ]
        }
    ],
    riskLevels: [
        {
            minScore: 0,
            maxScore: 1,
            label: 'Low Risk',
            severity: 'success',
            description: 'Continue routine monitoring.'
        },
        {
            minScore: 2,
            maxScore: 3,
            label: 'Moderate Risk',
            severity: 'warning',
            description: 'Increase frequency of observations. Notify nurse in charge.'
        },
        {
            minScore: 4,
            maxScore: 4,
            label: 'Moderate-High Risk',
            severity: 'warning',
            description: 'Urgent call to doctor. Consider ICU assessment.'
        },
        {
            minScore: 5,
            maxScore: 999,
            label: 'High Risk',
            severity: 'danger',
            description: 'Emergency call to doctor. Immediate ICU assessment required.'
        }
    ]
};

// 創建基礎計算器
const baseCalculator = createRadioScoreCalculator(config);

// 導出帶有 FHIR 自動填入和特殊警告的計算器
export const mewsScore = {
    ...baseCalculator,
    
    initialize(client: unknown, patient: unknown, container: HTMLElement): void {
        uiBuilder.initializeComponents(container);
        
        // 初始化 staleness tracker
        const stalenessTracker = createStalenessTracker();
        stalenessTracker.setContainer(container);
        
        const setRadioValue = (name: string, value: string, obs?: any, loinc?: string, label?: string): void => {
            const radio = container.querySelector(`input[name="${name}"][value="${value}"]`) as HTMLInputElement;
            if (radio) {
                radio.checked = true;
                radio.dispatchEvent(new Event('change'));
                if (obs && loinc && label) {
                    stalenessTracker.trackObservation(`input[name="${name}"]`, obs, loinc, label);
                }
            }
        };
        
        // 計算函數
        const calculate = (): void => {
            let score = 0;
            let hasCriticalParam = false;
            
            config.sections.forEach(section => {
                const radio = container.querySelector(
                    `input[name="${section.id}"]:checked`
                ) as HTMLInputElement | null;
                if (radio) {
                    const val = parseInt(radio.value) || 0;
                    score += val;
                    if (val === 3) hasCriticalParam = true;
                }
            });
            
            // 找到對應的風險等級
            const riskLevel = config.riskLevels.find(
                r => score >= r.minScore && score <= r.maxScore
            ) || config.riskLevels[config.riskLevels.length - 1];
            
            // 特殊警告
            let criticalWarning = '';
            if (hasCriticalParam) {
                criticalWarning = `
                    <div class="ui-alert ui-alert-danger mt-10">
                        <span class="ui-alert-icon">⚠️</span>
                        <div class="ui-alert-content">
                            <strong>Critical Parameter Alert:</strong> One or more parameters scored +3 points. Consider higher level of care regardless of total score.
                        </div>
                    </div>
                `;
            }
            
            // 更新結果
            const resultBox = document.getElementById('mews-result');
            if (resultBox) {
                const resultContent = resultBox.querySelector('.ui-result-content');
                if (resultContent) {
                    resultContent.innerHTML = `
                        ${uiBuilder.createResultItem({
                            label: 'Total MEWS Score',
                            value: score.toString(),
                            unit: '/ 14 points',
                            interpretation: riskLevel.label,
                            alertClass: `ui-alert-${riskLevel.severity}`
                        })}
                        
                        <div class="ui-alert ui-alert-${riskLevel.severity} mt-10">
                            <span class="ui-alert-icon">📋</span>
                            <div class="ui-alert-content">
                                <strong>Recommendation:</strong> ${riskLevel.description}
                            </div>
                        </div>
                        
                        ${criticalWarning}
                    `;
                }
                resultBox.classList.add('show');
            }
        };
        
        // 綁定事件
        container.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', calculate);
        });
        
        // FHIR 自動填入
        if (client) {
            // 血壓
            getMostRecentObservation(client as any, LOINC_CODES.SYSTOLIC_BP).then(obs => {
                if (obs?.valueQuantity) {
                    const sbp = obs.valueQuantity.value;
                    if (sbp <= 70) setRadioValue('mews-sbp', '3', obs, LOINC_CODES.SYSTOLIC_BP, 'Systolic BP');
                    else if (sbp <= 80) setRadioValue('mews-sbp', '2', obs, LOINC_CODES.SYSTOLIC_BP, 'Systolic BP');
                    else if (sbp <= 100) setRadioValue('mews-sbp', '1', obs, LOINC_CODES.SYSTOLIC_BP, 'Systolic BP');
                    else if (sbp <= 199) setRadioValue('mews-sbp', '0', obs, LOINC_CODES.SYSTOLIC_BP, 'Systolic BP');
                    else setRadioValue('mews-sbp', '2', obs, LOINC_CODES.SYSTOLIC_BP, 'Systolic BP');
                }
            }).catch(e => console.warn(e));

            // 心率
            getMostRecentObservation(client as any, LOINC_CODES.HEART_RATE).then(obs => {
                if (obs?.valueQuantity) {
                    const hr = obs.valueQuantity.value;
                    if (hr < 40) setRadioValue('mews-hr', '2', obs, LOINC_CODES.HEART_RATE, 'Heart Rate');
                    else if (hr <= 50) setRadioValue('mews-hr', '1', obs, LOINC_CODES.HEART_RATE, 'Heart Rate');
                    else if (hr <= 100) setRadioValue('mews-hr', '0', obs, LOINC_CODES.HEART_RATE, 'Heart Rate');
                    else if (hr <= 110) setRadioValue('mews-hr', '1', obs, LOINC_CODES.HEART_RATE, 'Heart Rate');
                    else if (hr <= 129) setRadioValue('mews-hr', '2', obs, LOINC_CODES.HEART_RATE, 'Heart Rate');
                    else setRadioValue('mews-hr', '3', obs, LOINC_CODES.HEART_RATE, 'Heart Rate');
                }
            }).catch(e => console.warn(e));

            // 呼吸率
            getMostRecentObservation(client as any, LOINC_CODES.RESPIRATORY_RATE).then(obs => {
                if (obs?.valueQuantity) {
                    const rr = obs.valueQuantity.value;
                    if (rr < 9) setRadioValue('mews-rr', '2', obs, LOINC_CODES.RESPIRATORY_RATE, 'Resp Rate');
                    else if (rr <= 14) setRadioValue('mews-rr', '0', obs, LOINC_CODES.RESPIRATORY_RATE, 'Resp Rate');
                    else if (rr <= 20) setRadioValue('mews-rr', '1', obs, LOINC_CODES.RESPIRATORY_RATE, 'Resp Rate');
                    else if (rr <= 29) setRadioValue('mews-rr', '2', obs, LOINC_CODES.RESPIRATORY_RATE, 'Resp Rate');
                    else setRadioValue('mews-rr', '3', obs, LOINC_CODES.RESPIRATORY_RATE, 'Resp Rate');
                }
            }).catch(e => console.warn(e));

            // 體溫
            getMostRecentObservation(client as any, LOINC_CODES.TEMPERATURE).then(obs => {
                if (obs?.valueQuantity) {
                    let temp = obs.valueQuantity.value;
                    const unit = obs.valueQuantity.unit;
                    if (unit === '[degF]' || unit === 'degF' || unit === 'F') {
                        temp = ((temp - 32) * 5) / 9;
                    }

                    if (temp < 35 || temp >= 38.5) {
                        setRadioValue('mews-temp', '2', obs, LOINC_CODES.TEMPERATURE, 'Temperature');
                    } else {
                        setRadioValue('mews-temp', '0', obs, LOINC_CODES.TEMPERATURE, 'Temperature');
                    }
                }
            }).catch(e => console.warn(e));
        }
        
        // 初始計算
        calculate();
    }
};
