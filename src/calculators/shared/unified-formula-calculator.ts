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
import {
    ValidationRules,
    validateCalculatorInput,
    ValidationSchema,
    ValidationRule
} from '../../validator.js';

// ==========================================
// 從集中類型定義導入並重新導出
// ==========================================

// 重新導出所有類型供外部使用
export type {
    NumberInputConfig,
    RadioInputConfig,
    SelectInputConfig,
    CheckboxInputConfig,
    InputConfig,
    InputSectionConfig,
    FormulaResultItem,
    ComplexCalculationResult,
    FormulaReferenceItem,
    FHIRAutoPopulateConfig,
    GetValueFn,
    GetStdValueFn,
    GetRadioValueFn,
    GetCheckboxValueFn,
    SimpleCalculateFn,
    ComplexCalculateFn,
    FormulaCalculatorConfig,
    CalculatorModule,
    // 向後兼容別名
    FormulaNumberInputConfig,
    FormulaRadioInputConfig,
    FormulaSelectInputConfig,
    FormulaInputConfig,
    FormulaConfig,
    InputFieldConfig,
    RadioFieldConfig,
    InputSection,
    ComplexFormulaCalculatorConfig,
    CalculationResult
} from '../../types/index.js';

// 導入類型供內部使用
import type {
    NumberInputConfig,
    RadioInputConfig,
    SelectInputConfig,
    CheckboxInputConfig,
    InputConfig,
    InputSectionConfig,
    FormulaResultItem,
    ComplexCalculationResult,
    FormulaReferenceItem,
    FHIRAutoPopulateConfig,
    GetValueFn,
    GetStdValueFn,
    GetRadioValueFn,
    GetCheckboxValueFn,
    SimpleCalculateFn,
    ComplexCalculateFn,
    FormulaCalculatorConfig,
    CalculatorModule
} from '../../types/index.js';

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

function isCheckboxInput(input: InputConfig): input is CheckboxInputConfig {
    if (typeof input === 'string') return false;
    if (input.type === 'checkbox') return true;
    return false;
}

/**
 * Get the validation rule for an input configuration
 * Merges explicit config with default rules based on type
 */
function getValidationRuleForInput(input: NumberInputConfig): ValidationRule {
    const unitType =
        input.unitConfig?.type ||
        input.unitToggle?.type ||
        (input.unitConfig && typeof input.unitConfig.type === 'string'
            ? input.unitConfig.type
            : undefined);

    // Get default rule from type
    const defaultRule = unitType && ValidationRules[unitType] ? ValidationRules[unitType] : {};

    // Specific overrides
    // 1. Explicit min/max in input config takes precedence
    // 2. Otherwise fall back to default rule
    return {
        min: input.min !== undefined ? input.min : defaultRule.min,
        max: input.max !== undefined ? input.max : defaultRule.max,
        required: input.required !== false
    };
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

        // Resolve validation rules (min/max) for HTML attributes
        const validationRule = getValidationRuleForInput(input);

        return uiBuilder.createInput({
            id: input.id,
            label: input.label,
            type: 'number',
            placeholder: input.placeholder,
            min: validationRule.min,
            max: validationRule.max,
            step: input.step,
            helpText: input.helpText,
            unit: unitToggle ? undefined : input.unit || input.standardUnit,
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

    if (isCheckboxInput(input)) {
        if (input.options) {
            return uiBuilder.createCheckboxGroup({
                name: input.id,
                label: input.label,
                options: input.options,
                helpText: input.helpText
            });
        } else {
            return uiBuilder.createCheckbox({
                id: input.id,
                label: input.label,
                value: input.value,
                checked: input.checked,
                description: input.description
            });
        }
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
             * 驗證所有輸入
             * 回傳驗證結果物件
             */
            const validateInputs = (): { isValid: boolean; values: Record<string, any> } => {
                const values: Record<string, any> = {};
                const schema: ValidationSchema = {};

                // Helper to check requirements
                let allRequiredPresent = true;

                allInputs.forEach(inputConfig => {
                    if (typeof inputConfig === 'string') return;

                    if (isNumberInput(inputConfig)) {
                        const inputEl = container.querySelector(
                            `#${inputConfig.id}`
                        ) as HTMLInputElement;
                        if (!inputEl) return;

                        let val: number | null = null;

                        if (inputEl.value === '') {
                            if (inputConfig.required !== false) {
                                allRequiredPresent = false;
                            }
                        } else {
                            val = parseFloat(inputEl.value);
                            if (isNaN(val)) {
                                allRequiredPresent = false;
                            } else {
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
                            }
                        }

                        // Add to schema based on resolved rules
                        const rule = getValidationRuleForInput(inputConfig);
                        schema[inputConfig.id] = {
                            required: rule.required,
                            min: rule.min,
                            max: rule.max,
                            message: rule.message
                        };

                        if (val !== null && !isNaN(val)) {
                            values[inputConfig.id] = val;
                        }
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

                if (!allRequiredPresent) {
                    return { isValid: false, values };
                }

                const validation = validateCalculatorInput(values, schema);
                if (!validation.isValid) {
                    if (errorContainer) {
                        displayError(
                            errorContainer,
                            new ValidationError(validation.errors[0], 'VALIDATION_ERROR')
                        );
                    }
                    return { isValid: false, values };
                }

                return { isValid: true, values };
            };


            /**
             * Simple 模式計算
             */
            const performSimpleCalculation = (): void => {
                if (!config.calculate) return;

                if (errorContainer) errorContainer.innerHTML = '';

                const { isValid, values } = validateInputs();

                if (!isValid) {
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
                                        alertClass: r.alertClass ? `ui-alert-${r.alertClass}` : ''
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

                // Also run validation for complex mode
                const { isValid } = validateInputs();
                if (!isValid) {
                    if (resultBox) resultBox.classList.remove('show');
                    return;
                }

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
                    // 清除錯誤（但不一定計算，視需求）
                    // 這裡保持原樣：即時計算
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
                    const genderEl = container.querySelector(`#${config.autoPopulateGender}`) as
                        | HTMLSelectElement
                        | HTMLInputElement;
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
                    (i): i is NumberInputConfig =>
                        isNumberInput(i) && !!(i as NumberInputConfig).loincCode
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
// 向後兼容的工廠函數
// ==========================================

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
