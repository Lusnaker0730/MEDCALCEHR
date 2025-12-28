/**
 * 統一公式計算器工廠函數
 *
 * 整合了原有的兩種公式計算器：
 * - Formula Calculator (簡單公式計算)
 * - Complex Formula Calculator (複雜公式計算)
 *
 * 支援：
 * - 數字輸入與單位轉換
 * - Radio/Select 輸入
 * - 區塊化輸入佈局
 * - FHIR 自動填入
 * - 自定義計算函數
 */

import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { fhirDataService, FieldDataRequirement } from '../../fhir-data-service.js';
import { ValidationError, displayError } from '../../errorHandler.js';

// ==========================================
// 類型定義
// ==========================================

/** 數字輸入配置 */
export interface NumberInputConfig {
    type?: 'number';
    id: string;
    label: string;
    /** 標準單位（計算時使用） */
    standardUnit?: string;
    /** 顯示單位（無切換時） */
    unit?: string;
    /** 單位切換配置 */
    unitConfig?: {
        type: string;
        units: string[];
        default: string;
    };
    /** 單位切換配置（別名，向後兼容） */
    unitToggle?: {
        type: string;
        units: string[];
        default: string;
    };
    placeholder?: string;
    min?: number;
    max?: number;
    step?: number;
    loincCode?: string;
    helpText?: string;
    required?: boolean;
}

/** Radio 輸入配置 */
export interface RadioInputConfig {
    type?: 'radio';
    /** ID (用作 name 屬性) */
    id?: string;
    name?: string;
    label: string;
    options: Array<{ value: string; label: string; checked?: boolean }>;
    helpText?: string;
}

/** Select 輸入配置 */
export interface SelectInputConfig {
    type?: 'select';
    id: string;
    label: string;
    options: Array<{ value: string; label: string }>;
    defaultValue?: string;
    helpText?: string;
}

/** 輸入配置類型 - 支援多種格式 */
export type InputConfig = NumberInputConfig | RadioInputConfig | SelectInputConfig | string;

/** 輸入區塊配置 */
export interface InputSectionConfig {
    title: string;
    subtitle?: string;
    icon?: string;
    /** 區塊內的輸入欄位 */
    fields: InputConfig[];
}

/** 簡單計算結果項目 */
export interface FormulaResultItem {
    label: string;
    value: number | string;
    unit?: string;
    interpretation?: string;
    alertClass?: 'success' | 'warning' | 'danger' | 'info';
}

/** 複雜計算結果 */
export interface ComplexCalculationResult {
    score?: number;
    value?: number;
    interpretation?: string;
    severity: 'success' | 'warning' | 'danger' | 'info';
    breakdown?: string;
    additionalResults?: Array<{
        label: string;
        value: string;
        unit?: string;
    }>;
}

/** 公式參考項目 */
export interface FormulaReferenceItem {
    label: string;
    formula: string;
    notes?: string;
}

/** FHIR 自動填入配置 */
export interface FHIRAutoPopulateConfig {
    fieldId: string;
    loincCode: string;
    targetUnit?: string;
    unitType?: string;
    formatter?: (value: number) => string;
}

/** 值取得器函數類型 */
export type GetValueFn = (id: string) => number | null;
export type GetStdValueFn = (id: string, unit: string) => number | null;
export type GetRadioValueFn = (name: string) => string | null;
export type GetCheckboxValueFn = (id: string) => boolean;

/** 簡單計算函數類型 */
export type SimpleCalculateFn = (
    values: Record<string, number | string>
) => FormulaResultItem[] | null;

/** 複雜計算函數類型 */
export type ComplexCalculateFn = (
    getValue: GetValueFn,
    getStdValue: GetStdValueFn,
    getRadioValue: GetRadioValueFn,
    getCheckboxValue: GetCheckboxValueFn
) => ComplexCalculationResult | null;

/** 統一公式計算器配置 */
export interface FormulaCalculatorConfig {
    id: string;
    title: string;
    description: string;

    /**
     * 計算模式
     * - 'simple': 使用扁平的 inputs 陣列和簡單的 values 物件
     * - 'complex': 使用區塊化的 sections 和輔助函數
     * @default 自動判斷 (有 sections 為 complex，有 inputs 為 simple)
     */
    mode?: 'simple' | 'complex';

    /** 扁平輸入列表 (simple 模式) */
    inputs?: InputConfig[];

    /** 區塊化輸入 (complex 模式) */
    sections?: InputSectionConfig[];

    /** 簡單計算函數 */
    calculate?: SimpleCalculateFn;

    /** 複雜計算函數 */
    complexCalculate?: ComplexCalculateFn;

    /** 公式參考 */
    formulas?: FormulaReferenceItem[];

    /** 自定義結果渲染器 (simple 模式) */
    customResultRenderer?: (results: FormulaResultItem[]) => string;

    /** 提示訊息 */
    infoAlert?: string;

    /** 結果標題 */
    resultTitle?: string;

    /** 參考文獻 (HTML) */
    reference?: string;

    /** 底部 HTML */
    footerHTML?: string;

    /** FHIR 自動填入配置 */
    fhirAutoPopulate?: FHIRAutoPopulateConfig[];

    /** 自動填入年齡欄位 ID */
    autoPopulateAge?: string;

    /** 自動填入性別欄位 ID */
    autoPopulateGender?: string;

    /** 自定義初始化函數 */
    customInitialize?: (
        client: any,
        patient: any,
        container: HTMLElement,
        calculate: () => void
    ) => void;
}

/** 計算器模組介面 */
export interface CalculatorModule {
    id: string;
    title: string;
    description: string;
    generateHTML: () => string;
    initialize: (client: any, patient: any, container: HTMLElement) => void;
}

// ==========================================
// 輔助函數
// ==========================================

function isRadioInput(input: InputConfig): input is RadioInputConfig {
    if (typeof input === 'string') return false;
    // 有 options 但沒有 id（或有 name）的是 radio
    if (input.type === 'radio') return true;
    if ('options' in input && 'name' in input) return true;
    if ('options' in input && !('id' in input)) return true;
    return false;
}

function isNumberInput(input: InputConfig): input is NumberInputConfig {
    if (typeof input === 'string') return false;
    if (input.type === 'number') return true;
    // 有 id 且沒有 options 的是 number
    if ('id' in input && !('options' in input)) return true;
    return false;
}

function isSelectInput(input: InputConfig): input is SelectInputConfig {
    if (typeof input === 'string') return false;
    if (input.type === 'select') return true;
    // 有 id 且有 options 且不是 radio 的是 select
    if ('id' in input && 'options' in input && !('name' in input)) return true;
    return false;
}

/**
 * 生成單個輸入欄位的 HTML
 */
function generateInputHTML(input: InputConfig): string {
    if (typeof input === 'string') {
        return input; // Raw HTML
    }

    if (isNumberInput(input)) {
        const unitToggle = input.unitConfig || input.unitToggle;
        return uiBuilder.createInput({
            id: input.id,
            label: input.label,
            type: 'number',
            placeholder: input.placeholder,
            min: input.min,
            max: input.max,
            step: input.step,
            helpText: input.helpText,
            unit: unitToggle ? undefined : (input.unit || input.standardUnit),
            unitToggle: unitToggle
                ? {
                      type: unitToggle.type,
                      units: unitToggle.units,
                      default: unitToggle.default
                  }
                : undefined,
            required: input.required !== false
        });
    }

    if (isRadioInput(input)) {
        return uiBuilder.createRadioGroup({
            name: input.id || input.name || '',
            label: input.label,
            options: input.options,
            helpText: input.helpText
        });
    }

    if (isSelectInput(input)) {
        return uiBuilder.createSelect({
            id: input.id,
            label: input.label,
            options: input.options,
            helpText: input.helpText
        });
    }

    return '';
}

// ==========================================
// 主要工廠函數
// ==========================================

/**
 * 創建統一公式計算器
 */
export function createUnifiedFormulaCalculator(config: FormulaCalculatorConfig): CalculatorModule {
    // 自動判斷模式
    const mode = config.mode || (config.sections ? 'complex' : 'simple');
    const isComplexMode = mode === 'complex';

    return {
        id: config.id,
        title: config.title,
        description: config.description,

        generateHTML(): string {
            let inputsHTML = '';

            if (isComplexMode && config.sections) {
                // Complex 模式：區塊化輸入
                inputsHTML = config.sections
                    .map(section => {
                        const fieldsHTML = section.fields.map(generateInputHTML).join('');
                        return uiBuilder.createSection({
                            title: section.title,
                            subtitle: section.subtitle,
                            icon: section.icon,
                            content: fieldsHTML
                        });
                    })
                    .join('');
            } else if (config.inputs) {
                // Simple 模式：扁平輸入
                const fieldsHTML = config.inputs.map(generateInputHTML).join('');
                inputsHTML = uiBuilder.createSection({
                    title: 'Measurements',
                    content: fieldsHTML
                });
            }

            // 公式參考區塊
            const formulaSection = config.formulas
                ? uiBuilder.createFormulaSection({ items: config.formulas })
                : '';

            // 提示訊息
            const infoAlertHTML = config.infoAlert
                ? uiBuilder.createAlert({ type: 'info', message: config.infoAlert })
                : '';

            return `
                <div class="calculator-header">
                    <h3>${config.title}</h3>
                    <p class="description">${config.description}</p>
                </div>

                ${infoAlertHTML}
                ${inputsHTML}

                <div id="${config.id}-error-container"></div>
                
                ${uiBuilder.createResultBox({
                    id: `${config.id}-result`,
                    title: config.resultTitle || 'Results'
                })}

                ${formulaSection}
                ${config.reference || ''}
                ${config.footerHTML || ''}
            `;
        },

        initialize(client: any, patient: any, container: HTMLElement): void {
            uiBuilder.initializeComponents(container);
            fhirDataService.initialize(client, patient, container);

            const resultBox = container.querySelector(`#${config.id}-result`) as HTMLElement;
            const resultContent = resultBox?.querySelector('.ui-result-content') as HTMLElement;
            const errorContainer = container.querySelector(
                `#${config.id}-error-container`
            ) as HTMLElement;

            // 值取得輔助函數
            const getValue: GetValueFn = (id: string) => {
                const el = container.querySelector(`#${id}`) as HTMLInputElement;
                const val = el?.value;
                if (val === '' || val === null || val === undefined) return null;
                const num = parseFloat(val);
                return isNaN(num) ? null : num;
            };

            const getStdValue: GetStdValueFn = (id: string, unit: string) => {
                const el = container.querySelector(`#${id}`) as HTMLInputElement;
                if (!el || el.value === '') return null;
                const val = UnitConverter.getStandardValue(el, unit);
                return val === null || isNaN(val) ? null : val;
            };

            const getRadioValue: GetRadioValueFn = (name: string) => {
                const radio = container.querySelector(
                    `input[name="${name}"]:checked`
                ) as HTMLInputElement;
                return radio?.value || null;
            };

            const getCheckboxValue: GetCheckboxValueFn = (id: string) => {
                const checkbox = container.querySelector(`#${id}`) as HTMLInputElement;
                return checkbox?.checked || false;
            };

            // 收集所有輸入配置
            const allInputs: InputConfig[] = [];
            if (config.sections) {
                config.sections.forEach(s => allInputs.push(...s.fields));
            }
            if (config.inputs) {
                allInputs.push(...config.inputs);
            }

            /**
             * Simple 模式計算
             */
            const performSimpleCalculation = (): void => {
                if (!config.calculate) return;

                if (errorContainer) errorContainer.innerHTML = '';

                const values: Record<string, number | string> = {};
                const errors: string[] = [];
                let allRequiredPresent = true;

                allInputs.forEach(inputConfig => {
                    if (typeof inputConfig === 'string') return;

                    if (isNumberInput(inputConfig)) {
                        const inputEl = container.querySelector(
                            `#${inputConfig.id}`
                        ) as HTMLInputElement;
                        if (!inputEl) return;

                        if (inputEl.value === '') {
                            if (inputConfig.required !== false) {
                                allRequiredPresent = false;
                            }
                            return;
                        }

                        let val = parseFloat(inputEl.value);
                        if (isNaN(val)) {
                            allRequiredPresent = false;
                            return;
                        }

                        // 單位轉換
                        if (inputConfig.standardUnit) {
                            try {
                                const standardVal = UnitConverter.getStandardValue(
                                    inputEl,
                                    inputConfig.standardUnit
                                );
                                if (standardVal !== null) {
                                    val = standardVal;
                                }
                            } catch (e) {
                                // 靜默失敗
                            }
                        }

                        // 範圍驗證
                        if (inputConfig.min !== undefined && val < inputConfig.min) {
                            errors.push(
                                `${inputConfig.label} must be at least ${inputConfig.min}`
                            );
                        }
                        if (inputConfig.max !== undefined && val > inputConfig.max) {
                            errors.push(
                                `${inputConfig.label} must be at most ${inputConfig.max}`
                            );
                        }

                        values[inputConfig.id] = val;
                    } else if (isRadioInput(inputConfig)) {
                        const name = inputConfig.id || inputConfig.name || '';
                        const checked = container.querySelector(
                            `input[name="${name}"]:checked`
                        ) as HTMLInputElement;
                        if (checked) {
                            values[name] = checked.value;
                        }
                    } else if (isSelectInput(inputConfig)) {
                        const select = container.querySelector(
                            `#${inputConfig.id}`
                        ) as HTMLSelectElement;
                        if (select) {
                            values[inputConfig.id] = select.value;
                        }
                    }
                });

                if (errors.length > 0) {
                    if (resultBox) resultBox.classList.remove('show');
                    if (errorContainer && allRequiredPresent) {
                        displayError(errorContainer, new ValidationError(errors[0]));
                    }
                    return;
                }

                if (!allRequiredPresent) {
                    if (resultBox) resultBox.classList.remove('show');
                    return;
                }

                try {
                    const results = config.calculate(values);

                    if (results && resultContent) {
                        if (config.customResultRenderer) {
                            resultContent.innerHTML = config.customResultRenderer(results);
                        } else {
                            resultContent.innerHTML = results
                                .map(r =>
                                    uiBuilder.createResultItem({
                                        label: r.label,
                                        value: r.value,
                                        unit: r.unit,
                                        interpretation: r.interpretation,
                                        alertClass: r.alertClass
                                            ? `ui-alert-${r.alertClass}`
                                            : ''
                                    })
                                )
                                .join('');
                        }
                        resultBox?.classList.add('show');
                    } else if (resultBox) {
                        resultBox.classList.remove('show');
                    }
                } catch (e) {
                    if (errorContainer) {
                        displayError(errorContainer, e as Error);
                    }
                }
            };

            /**
             * Complex 模式計算
             */
            const performComplexCalculation = (): void => {
                if (!config.complexCalculate) return;

                if (errorContainer) errorContainer.innerHTML = '';

                try {
                    const result = config.complexCalculate(
                        getValue,
                        getStdValue,
                        getRadioValue,
                        getCheckboxValue
                    );

                    if (!result) {
                        if (resultBox) resultBox.classList.remove('show');
                        return;
                    }

                    if (resultContent) {
                        let html = '';

                        if (result.score !== undefined) {
                            html += uiBuilder.createResultItem({
                                label: 'Score',
                                value: result.score.toString(),
                                unit: 'points',
                                interpretation: result.interpretation,
                                alertClass: `ui-alert-${result.severity}`
                            });
                        }

                        if (result.value !== undefined && result.score === undefined) {
                            html += uiBuilder.createResultItem({
                                label: 'Result',
                                value: result.value.toString(),
                                interpretation: result.interpretation,
                                alertClass: `ui-alert-${result.severity}`
                            });
                        }

                        if (result.additionalResults) {
                            result.additionalResults.forEach(item => {
                                html += uiBuilder.createResultItem({
                                    label: item.label,
                                    value: item.value,
                                    unit: item.unit
                                });
                            });
                        }

                        if (result.breakdown) {
                            html += `<div class="mt-15 text-sm text-muted">${result.breakdown}</div>`;
                        }

                        resultContent.innerHTML = html;
                    }

                    if (resultBox) {
                        resultBox.classList.add('show');
                        resultBox.classList.remove('ui-hidden');
                    }
                } catch (e) {
                    console.error(`Error calculating ${config.id}:`, e);
                    if (resultBox) resultBox.classList.remove('show');
                }
            };

            // 選擇計算函數
            const calculate = isComplexMode ? performComplexCalculation : performSimpleCalculation;

            // 事件監聽
            container.addEventListener('change', e => {
                const target = e.target as HTMLInputElement;
                if (
                    target.type === 'radio' ||
                    target.type === 'checkbox' ||
                    target.tagName === 'SELECT'
                ) {
                    calculate();
                }
            });

            container.addEventListener('input', e => {
                const target = e.target as HTMLInputElement;
                if (target.type === 'number' || target.type === 'text') {
                    calculate();
                }
            });

            // 自動填入年齡
            if (config.autoPopulateAge) {
                const age = fhirDataService.getPatientAge();
                if (age !== null) {
                    const ageInput = container.querySelector(
                        `#${config.autoPopulateAge}`
                    ) as HTMLInputElement;
                    if (ageInput) ageInput.value = age.toString();
                }
            }

            // 自動填入性別
            if (config.autoPopulateGender) {
                const gender = fhirDataService.getPatientGender();
                if (gender) {
                    const genderEl = container.querySelector(
                        `#${config.autoPopulateGender}`
                    ) as HTMLSelectElement | HTMLInputElement;
                    if (genderEl) {
                        if (genderEl.tagName === 'SELECT') {
                            (genderEl as HTMLSelectElement).value = gender;
                        } else if (genderEl.tagName === 'INPUT') {
                            const radio = container.querySelector(
                                `input[name="${config.autoPopulateGender}"][value="${gender}"]`
                            ) as HTMLInputElement;
                            if (radio) radio.checked = true;
                        }
                    }
                }
            }

            // FHIR 自動填入
            const autoPopulate = async () => {
                // 從 inputs 配置中收集 LOINC 代碼
                const numberInputs = allInputs.filter(
                    (i): i is NumberInputConfig => isNumberInput(i) && !!(i as NumberInputConfig).loincCode
                );

                if (numberInputs.length > 0 && fhirDataService.isReady()) {
                    const requirements: FieldDataRequirement[] = numberInputs.map(i => ({
                        inputId: `#${i.id}`,
                        code: i.loincCode!,
                        label: i.label,
                        targetUnit: (i.unitConfig || i.unitToggle)?.default || i.standardUnit,
                        unitType: (i.unitConfig || i.unitToggle)?.type,
                        decimals: 1
                    }));

                    await fhirDataService.autoPopulateFields(requirements);
                }

                // 從 fhirAutoPopulate 配置中填入
                if (config.fhirAutoPopulate && client && fhirDataService.isReady()) {
                    for (const autoConfig of config.fhirAutoPopulate) {
                        try {
                            const result = await fhirDataService.getObservation(
                                autoConfig.loincCode,
                                {
                                    trackStaleness: true,
                                    stalenessLabel: autoConfig.fieldId,
                                    targetUnit: autoConfig.targetUnit,
                                    unitType: autoConfig.unitType
                                }
                            );
                            if (result.value !== null) {
                                const el = container.querySelector(
                                    `#${autoConfig.fieldId}`
                                ) as HTMLInputElement;
                                if (el) {
                                    el.value = autoConfig.formatter
                                        ? autoConfig.formatter(result.value)
                                        : result.value.toFixed(1);
                                }
                            }
                        } catch (e) {
                            console.warn(`Error auto-populating ${autoConfig.fieldId}:`, e);
                        }
                    }
                }

                calculate();
            };

            autoPopulate();

            // 自定義初始化
            if (config.customInitialize) {
                config.customInitialize(client, patient, container, calculate);
            }
        }
    };
}

// ==========================================
// 向後兼容的別名函數
// ==========================================

// Re-export types
export type {
    FormulaResultItem as FormulaResult,
    ComplexCalculationResult as CalculationResult
};

/** 舊版 FormulaNumberInputConfig 別名 */
export type FormulaNumberInputConfig = NumberInputConfig;
/** 舊版 FormulaRadioInputConfig 別名 */
export type FormulaRadioInputConfig = RadioInputConfig;
/** 舊版 FormulaSelectInputConfig 別名 */
export type FormulaSelectInputConfig = SelectInputConfig;
/** 舊版 FormulaInputConfig 別名 */
export type FormulaInputConfig = InputConfig;
/** 舊版 FormulaConfig 別名 */
export type FormulaConfig = FormulaCalculatorConfig;
/** 舊版 InputFieldConfig 別名 */
export type InputFieldConfig = NumberInputConfig;
/** 舊版 RadioFieldConfig 別名 */
export type RadioFieldConfig = RadioInputConfig;
/** 舊版 InputSection 別名 */
export type InputSection = InputSectionConfig;

/**
 * 創建簡單公式計算器（向後兼容）
 */
export function createFormulaCalculator(
    config: Omit<FormulaCalculatorConfig, 'mode' | 'sections' | 'complexCalculate'> & {
        calculate: SimpleCalculateFn;
    }
): CalculatorModule {
    return createUnifiedFormulaCalculator({ ...config, mode: 'simple' });
}

/**
 * 創建複雜公式計算器（向後兼容）
 */
export function createComplexFormulaCalculator(
    config: Omit<FormulaCalculatorConfig, 'mode' | 'inputs' | 'calculate'> & {
        calculate: ComplexCalculateFn;
    }
): CalculatorModule {
    // Note: The old API used `calculate` for complex functions
    // We need to map it to `complexCalculate`
    const { calculate: complexFn, ...rest } = config;
    return createUnifiedFormulaCalculator({
        ...rest,
        mode: 'complex',
        complexCalculate: complexFn
    });
}
