/**
 * UI Builder 類型聲明文件
 * 
 * 這個文件為 ui-builder.js 提供 TypeScript 類型支援
 */

import type {
    SectionOptions,
    InputOptions,
    RadioGroupOptions,
    CheckboxGroupOptions,
    CheckboxOptions,
    SelectOptions,
    RangeOptions,
    ResultBoxOptions,
    ResultItemOptions,
    AlertOptions,
    FormulaSectionOptions,
    TableOptions,
    FormOptions,
    IUIBuilder
} from './types/ui-builder.js';

/**
 * UIBuilder 類別
 * 提供統一的 UI 組件生成方法
 */
export declare class UIBuilder implements IUIBuilder {
    constructor();

    /**
     * 創建區塊容器
     * @example
     * uiBuilder.createSection({
     *     title: 'Patient Info',
     *     icon: '👤',
     *     content: '<input type="text" />'
     * })
     */
    createSection(options: SectionOptions): string;

    /**
     * 創建輸入框
     * @example
     * uiBuilder.createInput({
     *     id: 'weight',
     *     label: 'Weight',
     *     type: 'number',
     *     unitToggle: { type: 'weight', units: ['kg', 'lbs'], default: 'kg' }
     * })
     */
    createInput(options: InputOptions): string;

    /**
     * 創建 Radio 群組
     * @example
     * uiBuilder.createRadioGroup({
     *     name: 'gender',
     *     label: 'Gender',
     *     options: [
     *         { value: 'male', label: 'Male', checked: true },
     *         { value: 'female', label: 'Female' }
     *     ]
     * })
     */
    createRadioGroup(options: RadioGroupOptions): string;

    /**
     * 創建 Checkbox 群組
     * @example
     * uiBuilder.createCheckboxGroup({
     *     name: 'symptoms',
     *     label: 'Symptoms',
     *     options: [
     *         { value: 'fever', label: 'Fever' },
     *         { value: 'cough', label: 'Cough' }
     *     ]
     * })
     */
    createCheckboxGroup(options: CheckboxGroupOptions): string;

    /**
     * 創建單一 Checkbox
     * @example
     * uiBuilder.createCheckbox({
     *     id: 'diabetes',
     *     label: 'History of Diabetes (+1)',
     *     value: '1'
     * })
     */
    createCheckbox(options: CheckboxOptions): string;

    /**
     * 創建下拉選單
     * @example
     * uiBuilder.createSelect({
     *     id: 'severity',
     *     label: 'Severity',
     *     options: [
     *         { value: 'mild', label: 'Mild' },
     *         { value: 'severe', label: 'Severe' }
     *     ]
     * })
     */
    createSelect(options: SelectOptions): string;

    /**
     * 創建範圍滑桿
     * @example
     * uiBuilder.createRange({
     *     id: 'age',
     *     label: 'Age',
     *     min: 0,
     *     max: 120,
     *     defaultValue: 50,
     *     unit: 'years'
     * })
     */
    createRange(options: RangeOptions): string;

    /**
     * 創建結果顯示框
     * @example
     * uiBuilder.createResultBox({
     *     id: 'gfr-result',
     *     title: 'eGFR Results'
     * })
     */
    createResultBox(options: ResultBoxOptions): string;

    /**
     * 創建結果項目
     * @example
     * uiBuilder.createResultItem({
     *     label: 'eGFR',
     *     value: '85',
     *     unit: 'mL/min/1.73m²',
     *     interpretation: 'Stage 2 (Mild)',
     *     alertClass: 'ui-alert-success'
     * })
     */
    createResultItem(options: ResultItemOptions): string;

    /**
     * 創建提示框
     * @example
     * uiBuilder.createAlert({
     *     type: 'warning',
     *     message: 'Consider nephrology referral.'
     * })
     */
    createAlert(options: AlertOptions): string;

    /**
     * 創建公式區塊
     * @example
     * uiBuilder.createFormulaSection({
     *     items: [
     *         { label: 'BMI', formula: 'Weight (kg) / Height² (m²)' }
     *     ]
     * })
     */
    createFormulaSection(options: FormulaSectionOptions): string;

    /**
     * 創建資料表格
     * @example
     * uiBuilder.createTable({
     *     headers: ['Score', 'Risk'],
     *     rows: [['0', 'Low'], ['1', 'High']]
     * })
     */
    createTable(options: TableOptions): string;

    /**
     * 創建完整表單
     * @example
     * uiBuilder.createForm({
     *     fields: [
     *         { type: 'input', id: 'age', label: 'Age' },
     *         { type: 'radio', name: 'gender', options: [...] }
     *     ]
     * })
     */
    createForm(options: FormOptions): string;

    /**
     * 設定 Radio 群組的值
     * @param name - Radio 群組名稱
     * @param value - 要選中的值
     */
    setRadioValue(name: string, value: string): void;

    /**
     * 初始化動態組件
     * 在 HTML 插入 DOM 後呼叫，用於啟用單位切換等功能
     * @param container - 容器元素
     */
    initializeComponents(container: HTMLElement): void;
}

/**
 * UIBuilder 單例實例
 * 直接使用此實例來創建 UI 組件
 * 
 * @example
 * import { uiBuilder } from './ui-builder.js';
 * 
 * const html = uiBuilder.createInput({
 *     id: 'weight',
 *     label: 'Weight',
 *     type: 'number'
 * });
 */
export declare const uiBuilder: UIBuilder;

/**
 * 預設導出 UIBuilder 類別
 */
export default UIBuilder;

// 重新導出類型以便其他模組使用
export type {
    SectionOptions,
    InputOptions,
    RadioGroupOptions,
    CheckboxGroupOptions,
    CheckboxOptions,
    SelectOptions,
    RangeOptions,
    ResultBoxOptions,
    ResultItemOptions,
    AlertOptions,
    FormulaSectionOptions,
    TableOptions,
    FormOptions,
    IUIBuilder,
    AlertType,
    InputFieldType,
    UnitToggleConfig,
    RadioOption,
    CheckboxOption,
    SelectOption,
    FormulaItem,
    FormField
} from './types/ui-builder.js';
