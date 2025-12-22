/**
 * 混合輸入評分計算器工廠函數
 * 
 * 適用於同時包含數字輸入和 Radio/Select 的計算器，如：
 * - 4PEPS (年齡 + 多個 radio)
 * - GRACE ACS (多個數字輸入 + radio)
 * - GWTG-HF (數字輸入 + radio)
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

/** 數字輸入配置 */
export interface NumberInputConfig {
    type: 'number';
    id: string;
    label: string;
    unit?: string;
    placeholder?: string;
    step?: number;
    min?: number;
    max?: number;
    helpText?: string;
    /** LOINC 代碼（用於 FHIR 自動填充） */
    loincCode?: string;
    /** 單位切換配置 */
    unitToggle?: {
        type: string;
        units: string[];
        default: string;
    };
}

/** Radio 選項 */
export interface RadioOptionConfig {
    value: string;
    label: string;
    checked?: boolean;
}

/** Radio 組配置 */
export interface RadioGroupConfig {
    type: 'radio';
    name: string;
    label: string;
    helpText?: string;
    options: RadioOptionConfig[];
}

/** Select 選項 */
export interface SelectOptionConfig {
    value: string;
    label: string;
}

/** Select 配置 */
export interface SelectConfig {
    type: 'select';
    id: string;
    label: string;
    helpText?: string;
    options: SelectOptionConfig[];
}

/** 輸入項類型 */
export type InputItemConfig = NumberInputConfig | RadioGroupConfig | SelectConfig;

/** 區塊配置 */
export interface SectionConfig {
    title: string;
    icon?: string;
    subtitle?: string;
    inputs: InputItemConfig[];
}

/** 風險等級 */
export interface RiskLevel {
    minScore: number;
    maxScore: number;
    label: string;
    severity: 'success' | 'warning' | 'danger' | 'info';
    description?: string;
    recommendation?: string;
}

/** 計算結果 */
export interface CalculationResult {
    score: number;
    values: Record<string, number | string | null>;
}

/** FHIR 數據需求配置 */
export interface FHIRDataRequirements {
    /** 觀察值需求（使用 loincCode 從輸入配置自動生成，或手動指定） */
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

/** 混合輸入計算器配置 */
export interface MixedInputCalculatorConfig {
    id: string;
    title: string;
    description: string;
    /** 說明提示 */
    infoAlert?: string;
    /** 區塊列表 */
    sections: SectionConfig[];
    /** 風險等級（用於默認結果渲染） */
    riskLevels?: RiskLevel[];
    /** 參考文獻 */
    references?: string[];
    /** 結果標題 */
    resultTitle?: string;
    
    /**
     * FHIR 數據需求（聲明式配置）
     * 使用此配置可自動從 FHIR 服務獲取數據並填充輸入
     */
    dataRequirements?: FHIRDataRequirements;
    
    /**
     * 計算函數
     * @param values 所有輸入值（數字輸入為 number | null，radio/select 為 string）
     * @returns 計算結果分數，返回 null 表示輸入不完整
     */
    calculate: (values: Record<string, number | string | null>) => number | null;
    
    /**
     * 自定義結果渲染函數
     * @param score 計算得出的分數
     * @param values 所有輸入值
     */
    customResultRenderer?: (score: number, values: Record<string, number | string | null>) => string;
    
    /**
     * 自定義初始化函數（用於 FHIR 自動填充等）
     * @param client FHIR 客戶端
     * @param patient 患者資料
     * @param container 容器元素
     * @param calculate 觸發重新計算的函數
     * @param setValue 設置輸入值的輔助函數
     */
    customInitialize?: (
        client: unknown,
        patient: unknown,
        container: HTMLElement,
        calculate: () => void,
        setValue: (id: string, value: string) => void
    ) => void | Promise<void>;
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
// 輔助函數
// ==========================================

/**
 * 生成輸入項 HTML
 */
function generateInputHTML(input: InputItemConfig): string {
    switch (input.type) {
        case 'number':
            return uiBuilder.createInput({
                id: input.id,
                label: input.label,
                type: 'number',
                unit: input.unit,
                placeholder: input.placeholder,
                step: input.step,
                min: input.min,
                max: input.max,
                helpText: input.helpText,
                unitToggle: input.unitToggle
            });
        
        case 'radio':
            return uiBuilder.createRadioGroup({
                name: input.name,
                label: input.label,
                helpText: input.helpText,
                options: input.options
            });
        
        case 'select':
            return uiBuilder.createSelect({
                id: input.id,
                label: input.label,
                helpText: input.helpText,
                options: input.options
            });
        
        default:
            return '';
    }
}

/**
 * 獲取輸入項的 ID 或 name
 */
function getInputKey(input: InputItemConfig): string {
    if (input.type === 'radio') {
        return input.name;
    }
    return input.id;
}

/**
 * 從配置中自動生成 FHIR 數據需求
 */
function generateDataRequirementsFromConfig(config: MixedInputCalculatorConfig): FieldDataRequirement[] {
    const requirements: FieldDataRequirement[] = [];
    
    config.sections.forEach(section => {
        section.inputs.forEach(input => {
            if (input.type === 'number' && input.loincCode) {
                requirements.push({
                    code: input.loincCode,
                    inputId: `#${input.id}`,
                    label: input.label,
                    targetUnit: input.unitToggle?.default || input.unit,
                    decimals: input.step && input.step < 1 ? 
                        Math.abs(Math.floor(Math.log10(input.step))) : 0
                });
            }
        });
    });
    
    return requirements;
}

// ==========================================
// 工廠函數
// ==========================================

/**
 * 創建混合輸入評分計算器
 */
export function createMixedInputCalculator(config: MixedInputCalculatorConfig): CalculatorModule {
    return {
        id: config.id,
        title: config.title,
        description: config.description,

        generateHTML(): string {
            // 生成區塊 HTML
            const sectionsHTML = config.sections.map(section => {
                const inputsHTML = section.inputs.map(input => generateInputHTML(input)).join('');
                
                return uiBuilder.createSection({
                    title: section.title,
                    icon: section.icon,
                    content: inputsHTML
                });
            }).join('');

            // 生成參考文獻
            const referencesHTML = config.references && config.references.length > 0
                ? `<div class="info-section mt-20 text-sm text-muted">
                    <h4>📚 Reference</h4>
                    ${config.references.map(ref => `<p>${ref}</p>`).join('')}
                   </div>`
                : '';

            return `
                <div class="calculator-header">
                    <h3>${config.title}</h3>
                    <p class="description">${config.description}</p>
                </div>
                
                ${config.infoAlert ? uiBuilder.createAlert({
                    type: 'info',
                    message: config.infoAlert
                }) : ''}
                
                ${sectionsHTML}
                
                <div id="${config.id}-error-container"></div>
                ${uiBuilder.createResultBox({ 
                    id: `${config.id}-result`, 
                    title: config.resultTitle || `${config.title} Results` 
                })}
                
                ${referencesHTML}
            `;
        },

        initialize(client: unknown, patient: unknown, container: HTMLElement): void {
            uiBuilder.initializeComponents(container);

            const resultBox = document.getElementById(`${config.id}-result`);
            const errorContainer = document.getElementById(`${config.id}-error-container`);

            // 初始化 FHIR 數據服務（內部使用）
            fhirDataService.initialize(
                client as FHIRClient | null, 
                patient as Patient | null, 
                container
            );

            // 收集所有輸入項的 key
            const allInputKeys: { key: string; type: 'number' | 'radio' | 'select' }[] = [];
            config.sections.forEach(section => {
                section.inputs.forEach(input => {
                    allInputKeys.push({
                        key: getInputKey(input),
                        type: input.type
                    });
                });
            });

            /**
             * 獲取所有輸入值
             */
            const getAllValues = (): Record<string, number | string | null> => {
                const values: Record<string, number | string | null> = {};

                allInputKeys.forEach(({ key, type }) => {
                    if (type === 'number') {
                        const input = container.querySelector(`#${key}`) as HTMLInputElement | null;
                        if (input && input.value !== '') {
                            values[key] = parseFloat(input.value);
                        } else {
                            values[key] = null;
                        }
                    } else if (type === 'radio') {
                        const checked = container.querySelector(`input[name="${key}"]:checked`) as HTMLInputElement | null;
                        values[key] = checked ? checked.value : null;
                    } else if (type === 'select') {
                        const select = container.querySelector(`#${key}`) as HTMLSelectElement | null;
                        values[key] = select ? select.value : null;
                    }
                });

                return values;
            };

            /**
             * 設置輸入值
             */
            const setValue = (id: string, value: string): void => {
                // 嘗試找數字輸入或 select
                const input = container.querySelector(`#${id}`) as HTMLInputElement | HTMLSelectElement | null;
                if (input) {
                    input.value = value;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    return;
                }

                // 嘗試找 radio
                const radio = container.querySelector(`input[name="${id}"][value="${value}"]`) as HTMLInputElement | null;
                if (radio) {
                    radio.checked = true;
                    radio.dispatchEvent(new Event('change', { bubbles: true }));
                }
            };

            /**
             * 計算並更新結果
             */
            const calculate = (): void => {
                // 清除錯誤
                if (errorContainer) errorContainer.innerHTML = '';

                const values = getAllValues();
                const score = config.calculate(values);

                if (score === null) {
                    if (resultBox) resultBox.classList.remove('show');
                    return;
                }

                // 渲染結果
                if (resultBox) {
                    const resultContent = resultBox.querySelector('.ui-result-content');
                    if (resultContent) {
                        if (config.customResultRenderer) {
                            resultContent.innerHTML = config.customResultRenderer(score, values);
                        } else {
                            // 默認結果渲染
                            let interpretation = '';
                            let alertClass = 'ui-alert-info';

                            if (config.riskLevels) {
                                const level = config.riskLevels.find(
                                    l => score >= l.minScore && score <= l.maxScore
                                );
                                if (level) {
                                    interpretation = level.label;
                                    alertClass = `ui-alert-${level.severity}`;
                                }
                            }

                            resultContent.innerHTML = uiBuilder.createResultItem({
                                label: 'Total Score',
                                value: score.toString(),
                                unit: 'points',
                                interpretation: interpretation,
                                alertClass: alertClass
                            });
                        }
                    }
                    resultBox.classList.add('show');
                }
            };

            // 綁定事件監聽器
            container.querySelectorAll('input, select').forEach(input => {
                input.addEventListener('input', calculate);
                input.addEventListener('change', calculate);
            });

            /**
             * 執行 FHIR 數據自動填充
             */
            const performAutoPopulation = async (): Promise<void> => {
                // 如果有 dataRequirements 配置，先執行自動填充
                if (config.dataRequirements && fhirDataService.isReady()) {
                    try {
                        const dataReqs = config.dataRequirements;
                        
                        // 自動填充患者年齡
                        if (dataReqs.autoPopulateAge) {
                            const age = fhirDataService.getPatientAge();
                            if (age !== null) {
                                setValue(dataReqs.autoPopulateAge.inputId, age.toString());
                            }
                        }
                        
                        // 自動填充患者性別
                        if (dataReqs.autoPopulateGender) {
                            const gender = fhirDataService.getPatientGender();
                            if (gender) {
                                const value = gender === 'male' 
                                    ? dataReqs.autoPopulateGender.maleValue 
                                    : dataReqs.autoPopulateGender.femaleValue;
                                setValue(dataReqs.autoPopulateGender.radioName, value);
                            }
                        }
                        
                        // 從配置生成數據需求（如果沒有手動指定）
                        let observations = dataReqs.observations || [];
                        if (observations.length === 0) {
                            observations = generateDataRequirementsFromConfig(config);
                        }
                        
                        // 使用 FHIRDataService 自動填充觀察值
                        if (observations.length > 0) {
                            await fhirDataService.autoPopulateFields(observations);
                        }
                        
                    } catch (error) {
                        console.error('Error during FHIR auto-population:', error);
                    }
                }
                
                // 調用自定義初始化（傳遞原始的 client 和 patient）
                if (config.customInitialize) {
                    await config.customInitialize(client, patient, container, calculate, setValue);
                }
                
                calculate();
            };

            // 執行自動填充
            performAutoPopulation();
        }
    };
}
