/**
 * Radio Group 評分計算器工廠函數
 * 
 * 適用於使用 Radio Group 進行評分的計算器，如：
 * - GCS (格拉斯哥昏迷量表)
 * - PHQ-9 (憂鬱量表)
 * - GAD-7 (焦慮量表)
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
    /** LOINC 代碼（用於 FHIR 自動填充） */
    loincCode?: string;
    /** 數值範圍映射（用於將 FHIR 數值轉換為 radio 選項值） */
    valueMapping?: Array<{
        condition: (value: number) => boolean;
        radioValue: string;
    }>;
}

/** 風險等級 */
export interface RiskLevel {
    minScore: number;
    maxScore: number;
    label: string;
    severity: 'success' | 'warning' | 'danger' | 'info';
    description?: string;
}

/** FHIR 數據需求配置 */
export interface RadioFHIRDataRequirements {
    /** 觀察值需求 */
    observations?: FieldDataRequirement[];
    /** 條件代碼（SNOMED） */
    conditions?: string[];
    /** 藥物代碼（RxNorm） */
    medications?: string[];
    /** 是否自動填充患者年齡 */
    autoPopulateAge?: { inputId: string };
    /** 是否自動填充患者性別 */
    autoPopulateGender?: {
        radioName: string;
        maleValue: string;
        femaleValue: string;
    };
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

    /**
     * FHIR 數據需求（聲明式配置）
     */
    dataRequirements?: RadioFHIRDataRequirements;

    /** 自定義結果渲染函數 */
    customResultRenderer?: (score: number, sectionScores: Record<string, number>) => string;

    /** 
     * 自定義初始化函數（用於 FHIR 自動填充等）
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

            /**
             * 執行 FHIR 數據自動填充
             */
            const performAutoPopulation = async (): Promise<void> => {
                // 如果有 dataRequirements 配置，先執行自動填充
                if (config.dataRequirements && fhirDataService.isReady()) {
                    try {
                        const dataReqs = config.dataRequirements;
                        const stalenessTracker = fhirDataService.getStalenessTracker();

                        // 自動填充患者性別
                        if (dataReqs.autoPopulateGender) {
                            const gender = fhirDataService.getPatientGender();
                            if (gender) {
                                const value = gender === 'male'
                                    ? dataReqs.autoPopulateGender.maleValue
                                    : dataReqs.autoPopulateGender.femaleValue;
                                setRadioValue(dataReqs.autoPopulateGender.radioName, value);
                            }
                        }

                        // 使用 sections 中的 loincCode 和 valueMapping 自動填充
                        for (const section of config.sections) {
                            if (section.loincCode && section.valueMapping) {
                                try {
                                    const result = await fhirDataService.getObservation(section.loincCode, {
                                        trackStaleness: true,
                                        stalenessLabel: section.title
                                    });

                                    if (result.value !== null) {
                                        // 根據 valueMapping 找到對應的 radio 值
                                        const mapping = section.valueMapping.find(m => m.condition(result.value!));
                                        if (mapping) {
                                            setRadioValue(section.id, mapping.radioValue);
                                        }

                                        // 追蹤陳舊狀態
                                        if (stalenessTracker && result.observation) {
                                            stalenessTracker.trackObservation(
                                                `input[name="${section.id}"]`,
                                                result.observation,
                                                section.loincCode,
                                                section.title
                                            );
                                        }
                                    }
                                } catch (e) {
                                    console.warn(`Error fetching observation for ${section.id}:`, e);
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
