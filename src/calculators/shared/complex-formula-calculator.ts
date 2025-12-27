/**
 * 複雜公式計算器工廠函數
 *
 * 適用於有複雜評分邏輯或特殊公式的計算器，如：
 * - APACHE II（複雜的生理指標評分）
 * - QRISK3（性別特異的風險係數）
 *
 * 特點：
 * - 支援自訂評分函數
 * - 支援多組輸入欄位
 * - 支援 FHIR 自動填入
 * - 支援單位轉換
 */

import { uiBuilder } from '../../ui-builder.js';
import { UnitConverter } from '../../unit-converter.js';
import { fhirDataService } from '../../fhir-data-service.js';

// ==========================================
// 類型定義
// ==========================================

/** 輸入欄位配置 */
export interface InputFieldConfig {
    id: string;
    label: string;
    type?: 'number' | 'text';
    unit?: string;
    placeholder?: string;
    min?: number;
    max?: number;
    step?: number;
    unitToggle?: {
        type: string;
        units: string[];
        default: string;
    };
}

/** Radio 選項配置 */
export interface RadioFieldConfig {
    name: string;
    label: string;
    helpText?: string;
    options: Array<{
        value: string;
        label: string;
        checked?: boolean;
    }>;
}

/** 輸入區塊 */
export interface InputSection {
    title: string;
    subtitle?: string;
    icon?: string;
    fields: Array<InputFieldConfig | RadioFieldConfig | string>;
}

/** FHIR 自動填入配置 */
export interface FHIRAutoPopulateConfig {
    fieldId: string;
    loincCode: string;
    targetUnit?: string;
    unitType?: string;
    formatter?: (value: number) => string;
}

/** 計算結果 */
export interface CalculationResult {
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

/** 複雜公式計算器配置 */
export interface ComplexFormulaCalculatorConfig {
    id: string;
    title: string;
    description: string;

    /** 輸入區塊 */
    sections: InputSection[];

    /** 計算函數 */
    calculate: (
        getValue: (id: string) => number | null,
        getStdValue: (id: string, unit: string) => number | null,
        getRadioValue: (name: string) => string | null,
        getCheckboxValue: (id: string) => boolean
    ) => CalculationResult | null;

    /** 結果標題 */
    resultTitle?: string;

    /** 說明提示 */
    infoAlert?: string;

    /** 參考文獻（HTML） */
    reference?: string;

    /** FHIR 自動填入配置 */
    fhirAutoPopulate?: FHIRAutoPopulateConfig[];

    /** 是否自動填入年齡 */
    autoPopulateAge?: string; // field ID for age

    /** 是否自動填入性別 */
    autoPopulateGender?: string; // field ID for gender
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

function isRadioField(field: InputFieldConfig | RadioFieldConfig | string): field is RadioFieldConfig {
    return typeof field === 'object' && 'name' in field && 'options' in field;
}

function isInputField(field: InputFieldConfig | RadioFieldConfig | string): field is InputFieldConfig {
    return typeof field === 'object' && 'id' in field && !('options' in field);
}

// ==========================================
// 工廠函數
// ==========================================

/**
 * 創建複雜公式計算器
 */
export function createComplexFormulaCalculator(config: ComplexFormulaCalculatorConfig): CalculatorModule {
    return {
        id: config.id,
        title: config.title,
        description: config.description,

        generateHTML(): string {
            const sectionsHTML = config.sections.map(section => {
                const fieldsHTML = section.fields.map(field => {
                    if (typeof field === 'string') {
                        return field; // Raw HTML
                    }
                    if (isRadioField(field)) {
                        return uiBuilder.createRadioGroup({
                            name: field.name,
                            label: field.label,
                            helpText: field.helpText,
                            options: field.options
                        });
                    }
                    if (isInputField(field)) {
                        return uiBuilder.createInput({
                            id: field.id,
                            label: field.label,
                            type: field.type || 'number',
                            unit: field.unit,
                            placeholder: field.placeholder,
                            min: field.min,
                            max: field.max,
                            step: field.step,
                            unitToggle: field.unitToggle
                        });
                    }
                    return '';
                }).join('');

                return uiBuilder.createSection({
                    title: section.title,
                    subtitle: section.subtitle,
                    icon: section.icon,
                    content: fieldsHTML
                });
            }).join('');

            const infoHTML = config.infoAlert
                ? `<div class="alert info"><span class="alert-icon">ℹ️</span><div class="alert-content"><p>${config.infoAlert}</p></div></div>`
                : '';

            return `
                <div class="calculator-header">
                    <h3>${config.title}</h3>
                    <p class="description">${config.description}</p>
                </div>

                ${infoHTML}
                ${sectionsHTML}

                <div id="${config.id}-error-container"></div>
                ${uiBuilder.createResultBox({ id: `${config.id}-result`, title: config.resultTitle || 'Result' })}

                ${config.reference || ''}
            `;
        },

        initialize(client, patient, container): void {
            uiBuilder.initializeComponents(container);
            fhirDataService.initialize(client, patient, container);

            const resultBox = container.querySelector(`#${config.id}-result`);
            const resultContent = resultBox?.querySelector('.ui-result-content');

            // Helper functions
            const getValue = (id: string): number | null => {
                const el = container.querySelector(`#${id}`) as HTMLInputElement;
                const val = el?.value;
                if (val === '' || val === null || val === undefined) return null;
                const num = parseFloat(val);
                return isNaN(num) ? null : num;
            };

            const getStdValue = (id: string, unit: string): number | null => {
                const el = container.querySelector(`#${id}`) as HTMLInputElement;
                if (!el || el.value === '') return null;
                const val = UnitConverter.getStandardValue(el, unit);
                return val === null || isNaN(val) ? null : val;
            };

            const getRadioValue = (name: string): string | null => {
                const radio = container.querySelector(`input[name="${name}"]:checked`) as HTMLInputElement;
                return radio?.value || null;
            };

            const getCheckboxValue = (id: string): boolean => {
                const checkbox = container.querySelector(`#${id}`) as HTMLInputElement;
                return checkbox?.checked || false;
            };

            const calculate = () => {
                const errorContainer = container.querySelector(`#${config.id}-error-container`);
                if (errorContainer) errorContainer.innerHTML = '';

                try {
                    const result = config.calculate(getValue, getStdValue, getRadioValue, getCheckboxValue);

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

            // Event listeners
            container.addEventListener('change', e => {
                const target = e.target as HTMLInputElement;
                if (target.type === 'radio' || target.type === 'checkbox' || target.tagName === 'SELECT') {
                    calculate();
                }
            });

            container.addEventListener('input', e => {
                const target = e.target as HTMLInputElement;
                if (target.type === 'number' || target.type === 'text') {
                    calculate();
                }
            });

            // Auto-populate age
            if (config.autoPopulateAge) {
                const age = fhirDataService.getPatientAge();
                if (age !== null) {
                    const ageInput = container.querySelector(`#${config.autoPopulateAge}`) as HTMLInputElement;
                    if (ageInput) ageInput.value = age.toString();
                }
            }

            // Auto-populate gender
            if (config.autoPopulateGender) {
                const gender = fhirDataService.getPatientGender();
                if (gender) {
                    const genderSelect = container.querySelector(`#${config.autoPopulateGender}`) as HTMLSelectElement;
                    if (genderSelect) genderSelect.value = gender;
                }
            }

            // FHIR auto-populate
            if (config.fhirAutoPopulate && client) {
                config.fhirAutoPopulate.forEach(autoConfig => {
                    fhirDataService
                        .getObservation(autoConfig.loincCode, {
                            trackStaleness: true,
                            stalenessLabel: autoConfig.fieldId,
                            targetUnit: autoConfig.targetUnit,
                            unitType: autoConfig.unitType
                        })
                        .then(result => {
                            if (result.value !== null) {
                                const el = container.querySelector(`#${autoConfig.fieldId}`) as HTMLInputElement;
                                if (el) {
                                    el.value = autoConfig.formatter
                                        ? autoConfig.formatter(result.value)
                                        : result.value.toFixed(1);
                                    calculate();
                                }
                            }
                        })
                        .catch(e => console.warn(e));
                });
            }

            // Initial calculation
            calculate();
        }
    };
}

