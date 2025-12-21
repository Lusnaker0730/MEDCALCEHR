/**
 * 評分計算器工廠函數
 * 
 * 這個模組提供了一個簡化的方式來創建評分類計算器
 * 它可以大幅減少重複代碼，同時保持與現有系統的兼容性
 * 
 * @example
 * import { createScoreCalculator } from '../shared/score-calculator.js';
 * 
 * export const myCalculator = createScoreCalculator({
 *     id: 'my-score',
 *     title: 'My Score',
 *     description: 'Calculate something',
 *     sections: [...],
 *     riskLevels: [...]
 * });
 */

import { uiBuilder } from '../../ui-builder.js';

// ==========================================
// 類型定義
// ==========================================

/** 評分選項 */
export interface ScoreOption {
    /** 選項 ID */
    id: string;
    /** 顯示標籤 */
    label: string;
    /** 分數值 */
    value: number;
    /** 額外說明 */
    description?: string;
}

/** 評分區塊 */
export interface ScoreSection {
    /** 區塊標題 */
    title: string;
    /** 圖示 */
    icon?: string;
    /** 評分選項列表 */
    options: ScoreOption[];
}

/** 風險等級 */
export interface RiskLevel {
    /** 最低分數（含） */
    minScore: number;
    /** 最高分數（含） */
    maxScore: number;
    /** 風險描述 */
    risk: string;
    /** 風險類別 */
    category: string;
    /** 嚴重程度 */
    severity: 'success' | 'warning' | 'danger' | 'info';
    /** 建議行動 */
    recommendation?: string;
}

/** 公式項目 */
export interface FormulaItem {
    /** 標題 */
    title: string;
    /** 公式列表 */
    formulas?: string[];
    /** 自定義內容 */
    content?: string;
    /** 附註 */
    notes?: string;
}

/** 評分計算器配置 */
export interface ScoreCalculatorConfig {
    /** 計算器 ID */
    id: string;
    /** 計算器標題 */
    title: string;
    /** 計算器描述 */
    description: string;
    /** 評分區塊列表 */
    sections: ScoreSection[];
    /** 風險等級列表 */
    riskLevels: RiskLevel[];
    /** 參考文獻 */
    references?: string[];
    /** 提示訊息 */
    infoAlert?: string;
    /** 公式項目 */
    formulaItems?: FormulaItem[];
    /** 自定義結果渲染函數 */
    customResultRenderer?: (score: number, sectionScores: Record<string, number>) => string;
    /** 自定義初始化函數 */
    customInitialize?: (client: unknown, patient: unknown, container: HTMLElement, calculate: () => void) => void;
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
 * 創建評分計算器
 * 
 * @param config - 計算器配置
 * @returns 計算器模組
 */
export function createScoreCalculator(config: ScoreCalculatorConfig): CalculatorModule {
    return {
        id: config.id,
        title: config.title,
        description: config.description,

        generateHTML(): string {
            // 生成所有 checkbox 區塊
            const sectionsHTML = config.sections.map(section => {
                const checkboxesHTML = section.options.map(opt =>
                    uiBuilder.createCheckbox({
                        id: opt.id,
                        label: opt.label,
                        value: String(opt.value),
                        description: opt.description
                    })
                ).join('');

                return uiBuilder.createSection({
                    title: section.title,
                    icon: section.icon,
                    content: checkboxesHTML
                });
            }).join('');

            // 生成提示框（如果有）
            const infoAlertHTML = config.infoAlert
                ? uiBuilder.createAlert({ type: 'info', message: config.infoAlert })
                : '';

            // 生成公式區塊（如果有）
            const formulaHTML = config.formulaItems
                ? uiBuilder.createFormulaSection({ items: config.formulaItems })
                : '';

            // 生成參考文獻（如果有）
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
                
                ${formulaHTML}
                ${referencesHTML}
            `;
        },

        initialize(client: unknown, patient: unknown, container: HTMLElement): void {
            // 初始化 UI 組件
            uiBuilder.initializeComponents(container);

            // 計算函數
            const calculate = (): void => {
                // 收集所有勾選的 checkbox 值
                const checkboxes = container.querySelectorAll('input[type="checkbox"]');
                let score = 0;
                const sectionScores: Record<string, number> = {};
                
                checkboxes.forEach((box) => {
                    const checkbox = box as HTMLInputElement;
                    if (checkbox.checked) {
                        // 支援浮點數值（如 DASI）
                        const value = parseFloat(checkbox.value) || 0;
                        score += value;
                        
                        // 追蹤各區塊的分數
                        const sectionId = checkbox.id.split('-')[0];
                        sectionScores[sectionId] = (sectionScores[sectionId] || 0) + value;
                    }
                });

                // 更新結果顯示（使用 getElementById 避免 ID 以數字開頭的問題）
                const resultBox = document.getElementById(`${config.id}-result`);
                if (resultBox) {
                    const resultContent = resultBox.querySelector('.ui-result-content');
                    if (resultContent) {
                        // 使用自定義渲染器（如果提供）
                        if (config.customResultRenderer) {
                            resultContent.innerHTML = config.customResultRenderer(score, sectionScores);
                        } else {
                            // 使用默認渲染
                            const riskLevel = config.riskLevels.find(
                                r => score >= r.minScore && score <= r.maxScore
                            ) || config.riskLevels[config.riskLevels.length - 1];

                            resultContent.innerHTML = `
                                ${uiBuilder.createResultItem({
                                    label: 'Total Score',
                                    value: score.toString(),
                                    unit: 'points',
                                    interpretation: riskLevel.category,
                                    alertClass: `ui-alert-${riskLevel.severity}`
                                })}
                                ${uiBuilder.createResultItem({
                                    label: 'Risk',
                                    value: riskLevel.risk,
                                    alertClass: `ui-alert-${riskLevel.severity}`
                                })}
                                ${riskLevel.recommendation 
                                    ? uiBuilder.createAlert({
                                        type: riskLevel.severity,
                                        message: riskLevel.recommendation
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
            container.querySelectorAll('input[type="checkbox"]').forEach(box => {
                box.addEventListener('change', calculate);
            });

            // 自定義初始化（如果提供）
            if (config.customInitialize) {
                config.customInitialize(client, patient, container, calculate);
            }

            // 初始計算
            calculate();
        }
    };
}

