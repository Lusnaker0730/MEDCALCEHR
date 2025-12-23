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
 * 
 * 支援 FHIRDataService 整合，可使用聲明式 dataRequirements 配置
 */

import { uiBuilder } from '../../ui-builder.js';
import {
    fhirDataService,
    FieldDataRequirement,
    FHIRClient,
    Patient
} from '../../fhir-data-service.js';

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
    /** SNOMED 條件代碼（用於 FHIR 自動選「是」） */
    conditionCode?: string;
    /** LOINC 觀察值代碼和閾值（用於 FHIR 自動選「是」） */
    observationCriteria?: {
        code: string;
        condition: (value: number) => boolean;
    };
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

/** FHIR 數據需求配置 */
export interface YesNoFHIRDataRequirements {
    /** 觀察值需求 */
    observations?: FieldDataRequirement[];
    /** 條件代碼（SNOMED） */
    conditions?: string[];
    /** 藥物代碼（RxNorm） */
    medications?: string[];
    /** 是否自動填充患者年齡 */
    autoPopulateAge?: {
        questionId: string;
        condition: (age: number) => boolean;
    };
    /** 是否自動填充患者性別 */
    autoPopulateGender?: {
        questionId: string;
        genderValue: 'male' | 'female';
    };
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

    /**
     * FHIR 數據需求（聲明式配置）
     */
    dataRequirements?: YesNoFHIRDataRequirements;

    /** 自定義結果渲染（第二個參數可選） */
    customResultRenderer?: (score: number, criteriaMet?: string[]) => string;

    /** 
     * 自定義初始化函數
     * @param client FHIR 客戶端
     * @param patient 患者資料
     * @param container 容器元素
     * @param calculate 觸發重新計算的函數
     */
    customInitialize?: (
        client: FHIRClient | null,
        patient: Patient | null,
        container: HTMLElement,
        calculate: () => void
    ) => void | Promise<void>;

    /** 分數範圍說明 (例如 "-2 to +9 points") */
    scoreRange?: string;
}

/** 計算器模組介面 */
export interface CalculatorModule {
    id: string;
    title: string;
    description: string;
    generateHTML: () => string;
    initialize: (client: FHIRClient | null, patient: Patient | null, container: HTMLElement) => void;
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

        initialize(client: FHIRClient | null, patient: Patient | null, container: HTMLElement): void {
            uiBuilder.initializeComponents(container);

            // 初始化 FHIR 數據服務（內部使用）
            fhirDataService.initialize(client, patient, container);

            /**
             * 設置 Radio 值
             */
            const setRadioValue = (name: string, value: string): void => {
                const radio = container.querySelector(
                    `input[name="${name}"][value="${value}"]`
                ) as HTMLInputElement | null;
                if (radio) {
                    radio.checked = true;
                    radio.dispatchEvent(new Event('change', { bubbles: true }));
                }
            };

            const calculate = (): void => {
                let score = 0;
                const criteriaMet: string[] = [];

                // 收集所有選中的 radio 值
                questions.forEach(q => {
                    const radio = container.querySelector(
                        `input[name="${q.id}"]:checked`
                    ) as HTMLInputElement | null;
                    if (radio) {
                        const value = parseFloat(radio.value) || 0;
                        score += value;

                        // 如果選了「是」，記錄
                        if (value !== 0) {
                            criteriaMet.push(q.label);
                        }
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
                            resultContent.innerHTML = config.customResultRenderer(score, criteriaMet);
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

            /**
             * 執行 FHIR 數據自動填充
             */
            const performAutoPopulation = async (): Promise<void> => {
                // 如果有 dataRequirements 配置，先執行自動填充
                if (config.dataRequirements && fhirDataService.isReady()) {
                    try {
                        const dataReqs = config.dataRequirements;
                        const stalenessTracker = fhirDataService.getStalenessTracker();

                        // 自動填充患者年齡
                        if (dataReqs.autoPopulateAge) {
                            const age = fhirDataService.getPatientAge();
                            if (age !== null && dataReqs.autoPopulateAge.condition(age)) {
                                const q = questions.find(q => q.id === dataReqs.autoPopulateAge!.questionId);
                                if (q) {
                                    setRadioValue(q.id, q.points.toString());
                                }
                            }
                        }

                        // 自動填充患者性別
                        if (dataReqs.autoPopulateGender) {
                            const gender = fhirDataService.getPatientGender();
                            if (gender === dataReqs.autoPopulateGender.genderValue) {
                                const q = questions.find(q => q.id === dataReqs.autoPopulateGender!.questionId);
                                if (q) {
                                    setRadioValue(q.id, q.points.toString());
                                }
                            }
                        }

                        // 收集條件代碼並檢查
                        const conditionCodeMap = new Map<string, YesNoQuestion>();
                        questions.forEach(q => {
                            if (q.conditionCode) {
                                conditionCodeMap.set(q.conditionCode, q);
                            }
                        });

                        if (conditionCodeMap.size > 0) {
                            const conditionCodes = Array.from(conditionCodeMap.keys());
                            const conditions = await fhirDataService.getConditions(conditionCodes);

                            conditions.forEach((condition: any) => {
                                const codings = condition.code?.coding || [];
                                codings.forEach((coding: any) => {
                                    const question = conditionCodeMap.get(coding.code);
                                    if (question) {
                                        setRadioValue(question.id, question.points.toString());
                                    }
                                });
                            });
                        }

                        // 處理觀察值條件
                        for (const q of questions) {
                            if (q.observationCriteria) {
                                try {
                                    const result = await fhirDataService.getObservation(q.observationCriteria.code, {
                                        trackStaleness: true,
                                        stalenessLabel: q.label
                                    });

                                    if (result.value !== null && q.observationCriteria.condition(result.value)) {
                                        setRadioValue(q.id, q.points.toString());

                                        if (stalenessTracker && result.observation) {
                                            stalenessTracker.trackObservation(
                                                `input[name="${q.id}"]`,
                                                result.observation,
                                                q.observationCriteria.code,
                                                q.label
                                            );
                                        }
                                    }
                                } catch (e) {
                                    console.warn(`Error fetching observation for ${q.id}:`, e);
                                }
                            }
                        }

                        // 處理額外的觀察值需求
                        if (dataReqs.observations && dataReqs.observations.length > 0) {
                            await fhirDataService.autoPopulateFields(dataReqs.observations);
                        }

                    } catch (error) {
                        console.error('Error during FHIR auto-population:', error);
                    }
                }

                // 調用自定義初始化（傳遞原始的 client 和 patient）
                if (config.customInitialize) {
                    await config.customInitialize(client, patient, container, calculate);
                }

                calculate();
            };

            // 執行自動填充
            performAutoPopulation();
        }
    };
}
