/**
 * 條件式評分計算器工廠函數
 *
 * 適用於根據初始選擇顯示不同評分項目的計算器，如：
 * - HIT Expert Probability (HEP) Score
 * - 根據病患類型顯示不同評估項目
 *
 * 特點：
 * - 根據條件動態顯示/隱藏評分項目
 * - 自動計算總分
 * - 支援 FHIR 自動填入
 */

import { uiBuilder } from '../../ui-builder.js';
import { fhirDataService } from '../../fhir-data-service.js';

// ==========================================
// 類型定義
// ==========================================

/** 評分選項 */
export interface ScoreOption {
    label: string;
    value: number;
    checked?: boolean;
}

/** 評分項目 */
export interface ScoreCriterion {
    /** 項目識別碼 */
    id: string;
    /** 項目標籤 */
    label: string;
    /** 選項列表（如果提供） */
    options?: ScoreOption[];
    /** Yes/No 類型的分數（如果不提供 options） */
    yesScore?: number;
    noScore?: number;
    /** 條件函數（決定是否顯示此項目） */
    condition?: (context: Record<string, string>) => boolean;
}

/** 評分類別 */
export interface ScoreCategory {
    title: string;
    criteria: ScoreCriterion[];
}

/** 結果解讀 */
export interface ScoreInterpretation {
    minScore: number;
    maxScore: number;
    label: string;
    description: string;
    severity: 'success' | 'warning' | 'danger' | 'info';
}

/** 條件式評分計算器配置 */
export interface ConditionalScoreCalculatorConfig {
    id: string;
    title: string;
    description: string;

    /** 控制條件的主選項 */
    conditionSelector: {
        name: string;
        label: string;
        options: Array<{ value: string; label: string; checked?: boolean }>;
    };

    /** 評分類別 */
    categories: ScoreCategory[];

    /** 結果解讀 */
    interpretations: ScoreInterpretation[];

    /** 說明提示 */
    infoAlert?: string;

    /** 參考文獻（HTML） */
    reference?: string;

    /** 評分表（HTML） */
    scoringTable?: string;

    /** FHIR 自動填入配置 */
    fhirAutoPopulate?: Array<{
        criterionId: string;
        loincCode: string;
        valueMapper: (value: number) => number; // Maps FHIR value to score option value
    }>;
}

/** 計算器模組介面 */
export interface CalculatorModule {
    id: string;
    title: string;
    description: string;
    generateHTML: () => string;
    initialize: (client: unknown, patient: unknown, container: HTMLElement) => Promise<void> | void;
}

// ==========================================
// 工廠函數
// ==========================================

/**
 * 創建條件式評分計算器
 */
export function createConditionalScoreCalculator(
    config: ConditionalScoreCalculatorConfig
): CalculatorModule {
    return {
        id: config.id,
        title: config.title,
        description: config.description,

        generateHTML(): string {
            const infoHTML = config.infoAlert
                ? uiBuilder.createAlert({ type: 'info', message: config.infoAlert })
                : '';

            return `
                <div class="calculator-header">
                    <h3>${config.title}</h3>
                    <p class="description">${config.description}</p>
                </div>

                ${infoHTML}

                ${uiBuilder.createSection({
                    title: config.conditionSelector.label,
                    content: uiBuilder.createRadioGroup({
                        name: config.conditionSelector.name,
                        options: config.conditionSelector.options.map(opt => ({
                            value: opt.value,
                            label: opt.label,
                            checked: opt.checked
                        }))
                    })
                })}

                <div id="${config.id}-criteria">
                    <!-- Dynamic criteria will be rendered here -->
                </div>

                ${uiBuilder.createResultBox({ id: `${config.id}-result`, title: 'Score Results' })}

                ${config.scoringTable || ''}
                ${config.reference || ''}
            `;
        },

        async initialize(client, patient, container): Promise<void> {
            uiBuilder.initializeComponents(container);

            // Initialize FHIRDataService
            fhirDataService.initialize(client, patient, container);

            const criteriaContainer = container.querySelector(
                `#${config.id}-criteria`
            ) as HTMLElement;
            const conditionInputs = container.querySelectorAll(
                `input[name="${config.conditionSelector.name}"]`
            );

            const getConditionContext = (): Record<string, string> => {
                const context: Record<string, string> = {};
                const selected = container.querySelector(
                    `input[name="${config.conditionSelector.name}"]:checked`
                ) as HTMLInputElement;
                if (selected) {
                    context[config.conditionSelector.name] = selected.value;
                }
                return context;
            };

            const calculateScore = () => {
                let score = 0;
                criteriaContainer.querySelectorAll('.ui-radio-group').forEach(group => {
                    const selected = group.querySelector(
                        'input[type="radio"]:checked'
                    ) as HTMLInputElement;
                    if (selected) {
                        score += parseInt(selected.value) || 0;
                    }
                });

                // Find interpretation
                let interpretation: ScoreInterpretation | undefined;
                for (const interp of config.interpretations) {
                    if (score >= interp.minScore && score <= interp.maxScore) {
                        interpretation = interp;
                        break;
                    }
                }

                const resultBox = container.querySelector(`#${config.id}-result`);
                if (resultBox) {
                    const resultContent = resultBox.querySelector('.ui-result-content');
                    if (resultContent && interpretation) {
                        resultContent.innerHTML = `
                            ${uiBuilder.createResultItem({
                                label: 'Score',
                                value: score.toString(),
                                unit: 'points',
                                interpretation: interpretation.label,
                                alertClass: `ui-alert-${interpretation.severity}`
                            })}
                            ${uiBuilder.createAlert({
                                type: interpretation.severity,
                                message: interpretation.description
                            })}
                        `;
                    }
                    resultBox.classList.add('show');
                }
            };

            const renderCriteria = (context: Record<string, string>) => {
                criteriaContainer.innerHTML = '';

                config.categories.forEach(category => {
                    const visibleCriteria = category.criteria.filter(criterion => {
                        if (criterion.condition) {
                            return criterion.condition(context);
                        }
                        return true;
                    });

                    if (visibleCriteria.length === 0) return;

                    let categoryHTML = `<div class="ui-section"><div class="ui-section-title">${category.title}</div>`;

                    visibleCriteria.forEach(criterion => {
                        let options: ScoreOption[];

                        if (criterion.options) {
                            options = criterion.options;
                        } else {
                            // Yes/No type
                            options = [
                                {
                                    label: `No (${criterion.noScore})`,
                                    value: criterion.noScore || 0,
                                    checked: true
                                },
                                {
                                    label: `Yes (${(criterion.yesScore || 0) > 0 ? '+' : ''}${criterion.yesScore})`,
                                    value: criterion.yesScore || 0
                                }
                            ];
                        }

                        categoryHTML += uiBuilder.createSection({
                            title: criterion.label,
                            content: uiBuilder.createRadioGroup({
                                name: criterion.id,
                                options: options.map(opt => ({
                                    value: opt.value.toString(),
                                    label: opt.label,
                                    checked: opt.checked
                                }))
                            })
                        });
                    });

                    categoryHTML += '</div>';
                    criteriaContainer.innerHTML += categoryHTML;
                });

                // Re-attach listeners
                criteriaContainer.querySelectorAll('input[type="radio"]').forEach(radio => {
                    radio.addEventListener('change', calculateScore);
                });

                calculateScore();
            };

            // Condition selector change handler
            conditionInputs.forEach(radio => {
                radio.addEventListener('change', () => {
                    renderCriteria(getConditionContext());
                });
            });

            // Initial render
            renderCriteria(getConditionContext());

            // FHIR auto-populate
            if (config.fhirAutoPopulate && client) {
                for (const autoPopConfig of config.fhirAutoPopulate) {
                    try {
                        const result = await fhirDataService.getObservation(
                            autoPopConfig.loincCode,
                            {
                                trackStaleness: true,
                                stalenessLabel: autoPopConfig.criterionId
                            }
                        );
                        if (result.value !== null) {
                            const mappedValue = autoPopConfig.valueMapper(result.value);
                            const radioToCheck = criteriaContainer.querySelector(
                                `input[name="${autoPopConfig.criterionId}"][value="${mappedValue}"]`
                            ) as HTMLInputElement;
                            if (radioToCheck) {
                                radioToCheck.checked = true;
                            }
                        }
                    } catch (error) {
                        console.warn(`Error auto-populating ${autoPopConfig.criterionId}:`, error);
                    }
                }
                calculateScore();
            }
        }
    };
}
