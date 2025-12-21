/**
 * Yes/No Radio 評分計算器工廠函數
 * 
 * 適用於使用 Yes/No 選項進行評分的計算器，如：
 * - Wells DVT
 * - Wells PE
 * - Centor Score
 * 
 * 這些計算器的每個問題都是「是/否」選擇，
 * 選「是」時加特定分數，選「否」時加 0 分
 */

import { uiBuilder } from '../../ui-builder.js';

// ==========================================
// 類型定義
// ==========================================

/** Yes/No 問題 */
export interface YesNoQuestion {
    /** 問題 ID */
    id: string;
    /** 問題標籤 */
    label: string;
    /** 選「是」時的分數 */
    points: number;
    /** 額外說明 */
    description?: string;
}

/** 風險等級 */
export interface YesNoRiskLevel {
    minScore: number;
    maxScore: number;
    label: string;
    severity: 'success' | 'warning' | 'danger' | 'info';
    description?: string;
    recommendation?: string;
}

/** Yes/No 計算器配置 */
export interface YesNoCalculatorConfig {
    id: string;
    title: string;
    description: string;
    /** 問題列表 */
    questions: YesNoQuestion[];
    /** 問題列表（替代 questions，用於不同命名風格，優先使用 questions） */
    criteria?: YesNoQuestion[];
    /** 風險等級 */
    riskLevels: YesNoRiskLevel[];
    /** 區塊標題 */
    sectionTitle?: string;
    /** 區塊圖示 */
    sectionIcon?: string;
    /** 提示訊息 */
    infoAlert?: string;
    /** 參考文獻 */
    references?: string[];
    /** 自定義結果渲染 */
    customResultRenderer?: (score: number) => string;
    /** 自定義初始化函數 */
    customInitialize?: (client: unknown, patient: unknown, container: HTMLElement, calculate: () => void) => void;
    /** 分數範圍說明 (例如 "-2 to +9 points") */
    scoreRange?: string;
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
 * 創建 Yes/No 評分計算器
 */
export function createYesNoCalculator(config: YesNoCalculatorConfig): CalculatorModule {
    // 支援 questions 或 criteria
    const questions = config.questions || config.criteria || [];

    return {
        id: config.id,
        title: config.title,
        description: config.description,

        generateHTML(): string {
            // 生成問題的 Radio Group
            const questionsHTML = questions.map(q => {
                const pointsText = q.points >= 0 ? `+${q.points}` : `${q.points}`;
                return uiBuilder.createRadioGroup({
                    name: q.id,
                    label: q.label,
                    helpText: q.description,
                    options: [
                        { value: '0', label: 'No', checked: true },
                        { value: q.points.toString(), label: `Yes (${pointsText})` }
                    ]
                });
            }).join('');

            // 包裝在區塊中
            const sectionHTML = uiBuilder.createSection({
                title: config.sectionTitle || 'Clinical Criteria',
                icon: config.sectionIcon,
                content: questionsHTML
            });

            // 提示訊息
            const infoAlertHTML = config.infoAlert
                ? uiBuilder.createAlert({ type: 'info', message: config.infoAlert })
                : '';

            // 參考文獻
            const referencesHTML = config.references?.length
                ? `<div class="info-section mt-20">
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
                ${sectionHTML}
                
                <div id="${config.id}-error-container"></div>
                ${uiBuilder.createResultBox({ 
                    id: `${config.id}-result`, 
                    title: `${config.title} Results` 
                })}
                
                ${referencesHTML}
            `;
        },

        initialize(client: unknown, patient: unknown, container: HTMLElement): void {
            uiBuilder.initializeComponents(container);

            const calculate = (): void => {
                let score = 0;
                
                // 收集所有選中的 radio 值
                questions.forEach(q => {
                    const radio = container.querySelector(
                        `input[name="${q.id}"]:checked`
                    ) as HTMLInputElement | null;
                    if (radio) {
                        score += parseFloat(radio.value) || 0;
                    }
                });

                // 找到對應的風險等級
                const riskLevel = config.riskLevels.find(
                    r => score >= r.minScore && score <= r.maxScore
                ) || config.riskLevels[config.riskLevels.length - 1];

                // 更新結果顯示
                const resultBox = document.getElementById(`${config.id}-result`);
                if (resultBox) {
                    const resultContent = resultBox.querySelector('.ui-result-content');
                    if (resultContent) {
                        if (config.customResultRenderer) {
                            resultContent.innerHTML = config.customResultRenderer(score);
                        } else {
                            resultContent.innerHTML = `
                                ${uiBuilder.createResultItem({
                                    label: 'Total Score',
                                    value: score.toString(),
                                    unit: config.scoreRange ? `${config.scoreRange}` : 'points',
                                    interpretation: riskLevel.label,
                                    alertClass: `ui-alert-${riskLevel.severity}`
                                })}
                                ${riskLevel.recommendation || riskLevel.description
                                    ? uiBuilder.createAlert({
                                        type: riskLevel.severity,
                                        message: `<strong>Recommendation:</strong> ${riskLevel.recommendation || riskLevel.description}`
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

            // 自定義初始化（如 FHIR 自動填充）
            if (config.customInitialize) {
                config.customInitialize(client, patient, container, calculate);
            }

            // 初始計算
            calculate();
        }
    };
}

