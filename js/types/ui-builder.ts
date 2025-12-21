/**
 * UI Builder 類型定義
 * 
 * 這個文件定義了 UI Builder 所有方法的參數和返回類型
 */

// ==========================================
// 通用類型
// ==========================================

/**
 * Alert 類型
 */
export type AlertType = 'info' | 'warning' | 'danger' | 'success';

/**
 * 輸入欄位類型
 */
export type InputFieldType = 'text' | 'number' | 'email' | 'password' | 'date' | 'tel';

// ==========================================
// Section 組件
// ==========================================

/**
 * Section 配置選項
 */
export interface SectionOptions {
    /** 區塊標題 */
    title?: string;
    /** 區塊副標題 */
    subtitle?: string;
    /** 圖示（emoji 或 icon class） */
    icon?: string;
    /** 區塊內容（HTML 字串） */
    content?: string;
}

// ==========================================
// Input 組件
// ==========================================

/**
 * 單位切換配置
 */
export interface UnitToggleConfig {
    /** 單位類型（用於轉換） */
    type: 'weight' | 'height' | 'creatinine' | 'temperature' | 'volume' | 'length';
    /** 可選單位列表 */
    units: string[];
    /** 預設單位 */
    default?: string;
}

/**
 * Input 配置選項
 */
export interface InputOptions {
    /** 輸入框 ID */
    id: string;
    /** 顯示標籤 */
    label: string;
    /** 輸入類型 */
    type?: InputFieldType;
    /** 佔位符文字 */
    placeholder?: string;
    /** 是否必填 */
    required?: boolean;
    /** 固定單位顯示 */
    unit?: string | null;
    /** 單位切換配置 */
    unitToggle?: UnitToggleConfig | null;
    /** 說明文字 */
    helpText?: string;
    /** 最小值 */
    min?: number;
    /** 最大值 */
    max?: number;
    /** 步進值 */
    step?: number;
    /** 預設值 */
    defaultValue?: string | number;
}

// ==========================================
// Radio 組件
// ==========================================

/**
 * Radio 選項
 */
export interface RadioOption {
    /** 選項值 */
    value: string | number;
    /** 顯示標籤 */
    label: string;
    /** 是否預設選中 */
    checked?: boolean;
    /** 是否禁用 */
    disabled?: boolean;
    /** 自定義 ID */
    id?: string;
    /** 分數（用於評分計算器） */
    points?: number;
}

/**
 * RadioGroup 配置選項
 */
export interface RadioGroupOptions {
    /** 群組名稱 */
    name: string;
    /** 群組標籤 */
    label?: string;
    /** 選項列表 */
    options?: RadioOption[];
    /** 是否必填 */
    required?: boolean;
    /** 說明文字 */
    helpText?: string;
}

// ==========================================
// Checkbox 組件
// ==========================================

/**
 * Checkbox 選項
 */
export interface CheckboxOption {
    /** 選項值 */
    value: string | number;
    /** 顯示標籤 */
    label: string;
    /** 額外說明 */
    description?: string;
    /** 是否預設選中 */
    checked?: boolean;
    /** 是否禁用 */
    disabled?: boolean;
    /** 自定義 ID */
    id?: string;
    /** 分數（用於評分計算器） */
    points?: number;
}

/**
 * CheckboxGroup 配置選項
 */
export interface CheckboxGroupOptions {
    /** 群組名稱 */
    name: string;
    /** 群組標籤 */
    label?: string;
    /** 選項列表 */
    options?: CheckboxOption[];
    /** 說明文字 */
    helpText?: string;
}

/**
 * 單一 Checkbox 配置選項
 */
export interface CheckboxOptions {
    /** Checkbox ID */
    id: string;
    /** 顯示標籤 */
    label: string;
    /** 值 */
    value?: string | number;
    /** 是否預設選中 */
    checked?: boolean;
    /** 額外說明 */
    description?: string;
}

// ==========================================
// Select 組件
// ==========================================

/**
 * Select 選項
 */
export interface SelectOption {
    /** 選項值 */
    value: string | number;
    /** 顯示標籤 */
    label: string;
    /** 是否預設選中 */
    selected?: boolean;
}

/**
 * Select 配置選項
 */
export interface SelectOptions {
    /** Select ID */
    id: string;
    /** 顯示標籤 */
    label: string;
    /** 選項列表 */
    options?: SelectOption[];
    /** 是否必填 */
    required?: boolean;
    /** 說明文字 */
    helpText?: string;
}

// ==========================================
// Range 組件
// ==========================================

/**
 * Range Slider 配置選項
 */
export interface RangeOptions {
    /** Slider ID */
    id: string;
    /** 顯示標籤 */
    label: string;
    /** 最小值 */
    min?: number;
    /** 最大值 */
    max?: number;
    /** 步進值 */
    step?: number;
    /** 預設值 */
    defaultValue?: number;
    /** 單位 */
    unit?: string;
    /** 是否顯示當前值 */
    showValue?: boolean;
}

// ==========================================
// Result 組件
// ==========================================

/**
 * ResultBox 配置選項
 */
export interface ResultBoxOptions {
    /** 結果框 ID */
    id: string;
    /** 標題 */
    title?: string;
}

/**
 * ResultItem 配置選項
 */
export interface ResultItemOptions {
    /** 結果標籤 */
    label?: string;
    /** 結果值 */
    value: string | number;
    /** 單位 */
    unit?: string;
    /** 解讀說明 */
    interpretation?: string;
    /** Alert 樣式類別 */
    alertClass?: string;
}

// ==========================================
// Alert 組件
// ==========================================

/**
 * Alert 配置選項
 */
export interface AlertOptions {
    /** Alert 類型 */
    type?: AlertType;
    /** 訊息內容（支援 HTML） */
    message: string;
    /** 自定義圖示 */
    icon?: string;
}

// ==========================================
// Formula 組件
// ==========================================

/**
 * Formula 項目
 */
export interface FormulaItem {
    /** 標籤（或使用 title） */
    label?: string;
    /** 標題（或使用 label） */
    title?: string;
    /** 單一公式 */
    formula?: string;
    /** 自定義內容 */
    content?: string;
    /** 多個公式列表 */
    formulas?: string[];
    /** 附註 */
    notes?: string;
}

/**
 * FormulaSection 配置選項
 */
export interface FormulaSectionOptions {
    /** 公式項目列表 */
    items?: FormulaItem[];
}

// ==========================================
// Table 組件
// ==========================================

/**
 * Table 配置選項
 */
export interface TableOptions {
    /** Table ID */
    id?: string;
    /** 表頭 */
    headers?: string[];
    /** 資料行 */
    rows?: (string | number)[][];
    /** 額外 CSS 類別 */
    className?: string;
    /** 是否固定第一欄 */
    stickyFirstColumn?: boolean;
}

// ==========================================
// Form 組件
// ==========================================

/**
 * Form 欄位配置
 */
export interface FormField {
    /** 欄位類型 */
    type: 'input' | 'number' | 'text' | 'radio' | 'checkbox' | 'select' | 'range' | 'section';
    /** 其他配置（根據類型不同） */
    [key: string]: any;
}

/**
 * Form 配置選項
 */
export interface FormOptions {
    /** 欄位列表 */
    fields?: FormField[];
    /** 提交按鈕文字 */
    submitLabel?: string;
    /** 是否顯示提交按鈕 */
    showSubmit?: boolean;
}

// ==========================================
// UIBuilder 類別介面
// ==========================================

/**
 * UIBuilder 介面
 */
export interface IUIBuilder {
    // Section
    createSection(options: SectionOptions): string;
    
    // Input
    createInput(options: InputOptions): string;
    
    // Radio
    createRadioGroup(options: RadioGroupOptions): string;
    
    // Checkbox
    createCheckboxGroup(options: CheckboxGroupOptions): string;
    createCheckbox(options: CheckboxOptions): string;
    
    // Select
    createSelect(options: SelectOptions): string;
    
    // Range
    createRange(options: RangeOptions): string;
    
    // Result
    createResultBox(options: ResultBoxOptions): string;
    createResultItem(options: ResultItemOptions): string;
    
    // Alert
    createAlert(options: AlertOptions): string;
    
    // Formula
    createFormulaSection(options: FormulaSectionOptions): string;
    
    // Table
    createTable(options: TableOptions): string;
    
    // Form
    createForm(options: FormOptions): string;
    
    // Utilities
    setRadioValue(name: string, value: string): void;
    initializeComponents(container: HTMLElement): void;
}

