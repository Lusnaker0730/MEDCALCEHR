/**
 * Radio Group 評分計算器工廠函數
 * 
 * 適用於使用 Radio Group 進行評分的計算器，如：
 * - GCS (格拉斯哥昏迷量表)
 * - PHQ-9 (憂鬱量表)
 * - GAD-7 (焦慮量表)
 */

import { uiBuilder } from '../../ui-builder.js';

// ==========================================
// 類型定義
// ==========================================

/** Radio 選項 */
export interface RadioOption {
    value: string;
    label: string;
    checked?: boolean;
}

/** Radio Group 區塊 */
export interface RadioSection {
    id: string;
    title: string;
    icon?: string;
    subtitle?: string;
    options: RadioOption[];
}

/** 風險等級 */
export interface RiskLevel {
    minScore: number;
    maxScore: number;
    label: string;
    severity: 'success' | 'warning' | 'danger' | 'info';
    description?: string;
}

/** Radio 評分計算器配置 */
export interface RadioScoreCalculatorConfig {
    id: string;
    title: string;
    description: string;
    sections: RadioSection[];
    riskLevels: RiskLevel[];
    infoAlert?: string;
    interpretationInfo?: string;
    references?: string[];
    /** 自定義結果渲染函數 */
    customResultRenderer?: (score: number, sectionScores: Record<string, number>) => string;
}

/** 計算器模組介面 */
export interface CalculatorModule {
    id: string;
    title: string;
    description: string;
    generateHTML: () => string;
    initialize: (client: unknown, patient: unknown, container: HTMLElement) => void;
}

// ==========================================
// 工廠函數
// ==========================================

/**
 * 創建 Radio Group 評分計算器
 */
export function createRadioScoreCalculator(config: RadioScoreCalculatorConfig): CalculatorModule {
    return {
        id: config.id,
        title: config.title,
        description: config.description,

        generateHTML(): string {
            // 生成所有 Radio Group 區塊
            const sectionsHTML = config.sections.map(section =>
                uiBuilder.createSection({
                    title: section.title,
                    icon: section.icon,
                    subtitle: section.subtitle,
                    content: uiBuilder.createRadioGroup({
                        name: section.id,
                        options: section.options
                    })
                })
            ).join('');

            // 生成提示框
            const infoAlertHTML = config.infoAlert
                ? uiBuilder.createAlert({ type: 'info', message: config.infoAlert })
                : '';

            // 生成解釋信息
            const interpretationHTML = config.interpretationInfo
                ? uiBuilder.createAlert({ type: 'info', message: config.interpretationInfo })
                : '';

            // 生成參考文獻
            const referencesHTML = config.references?.length
                ? `<div class="info-section" style="margin-top: 20px; font-size: 0.85em; color: #666;">
                    <h4>📚 Reference</h4>
                    ${config.references.map(ref => `<p>${ref}</p>`).join('')}
                   </div>`
                : '';

            return `
                <div class="calculator-header">
                    <h3>${config.title}</h3>
                    <p class="description">${config.description}</p>
                </div>
                
                ${infoAlertHTML}
                ${sectionsHTML}
                
                ${uiBuilder.createResultBox({ 
                    id: `${config.id}-result`, 
                    title: `${config.title} Results` 
                })}
                
                ${interpretationHTML}
                ${referencesHTML}
            `;
        },

        initialize(client: unknown, patient: unknown, container: HTMLElement): void {
            uiBuilder.initializeComponents(container);

            const calculate = (): void => {
                let totalScore = 0;
                const sectionScores: Record<string, number> = {};

                // 收集每個 section 的分數
                config.sections.forEach(section => {
                    const radio = container.querySelector(
                        `input[name="${section.id}"]:checked`
                    ) as HTMLInputElement | null;
                    
                    if (radio) {
                        const value = parseInt(radio.value) || 0;
                        sectionScores[section.id] = value;
                        totalScore += value;
                    }
                });

                // 找到對應的風險等級
                const riskLevel = config.riskLevels.find(
                    r => totalScore >= r.minScore && totalScore <= r.maxScore
                ) || config.riskLevels[config.riskLevels.length - 1];

                // 更新結果顯示
                const resultBox = document.getElementById(`${config.id}-result`);
                if (resultBox) {
                    const resultContent = resultBox.querySelector('.ui-result-content');
                    if (resultContent) {
                        // 使用自定義渲染器或默認渲染
                        if (config.customResultRenderer) {
                            resultContent.innerHTML = config.customResultRenderer(totalScore, sectionScores);
                        } else {
                            resultContent.innerHTML = `
                                ${uiBuilder.createResultItem({
                                    label: 'Total Score',
                                    value: totalScore.toString(),
                                    unit: 'points',
                                    interpretation: riskLevel.label,
                                    alertClass: `ui-alert-${riskLevel.severity}`
                                })}
                                ${riskLevel.description 
                                    ? uiBuilder.createAlert({
                                        type: riskLevel.severity,
                                        message: riskLevel.description
                                    })
                                    : ''
                                }
                            `;
                        }
                    }
                    resultBox.classList.add('show');
                }
            };

            // 綁定事件
            container.querySelectorAll('input[type="radio"]').forEach(radio => {
                radio.addEventListener('change', calculate);
            });

            // 初始計算
            calculate();
        }
    };
}

