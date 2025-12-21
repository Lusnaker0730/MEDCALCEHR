/**
 * 計算器類型定義
 * 
 * 這個文件定義了計算器相關的所有 TypeScript 類型
 */

// ==========================================
// 計算器配置類型
// ==========================================

/**
 * 計算器基本配置
 */
export interface CalculatorConfig {
    /** 計算器唯一 ID */
    id: string;
    /** 計算器標題 */
    title: string;
    /** 計算器描述 */
    description: string;
    /** 分類 */
    category: CalculatorCategory;
    /** 關鍵詞（用於搜尋） */
    keywords?: string[];
    /** 參考文獻 */
    references?: Reference[];
}

/**
 * 計算器分類
 */
export type CalculatorCategory =
    | 'Cardiovascular'
    | 'Renal'
    | 'Critical Care'
    | 'Pediatric'
    | 'Drug Conversion'
    | 'Infection'
    | 'Neurology'
    | 'Respiratory'
    | 'Metabolic'
    | 'Hematology'
    | 'Gastroenterology'
    | 'Obstetrics'
    | 'Psychiatry'
    | 'General Medicine';

/**
 * 參考文獻
 */
export interface Reference {
    authors: string;
    title: string;
    journal: string;
    year: number;
    volume?: string;
    pages?: string;
    doi?: string;
    pmid?: string;
}

// ==========================================
// 輸入欄位類型
// ==========================================

/**
 * 計算器輸入欄位配置
 */
export interface CalculatorInput {
    /** 欄位 ID */
    id: string;
    /** 欄位名稱（用於收集數據） */
    name?: string;
    /** 顯示標籤 */
    label: string;
    /** 輸入類型 */
    type: InputType;
    /** 單位 */
    unit?: string;
    /** 單位切換選項 */
    unitToggle?: UnitToggleConfig;
    /** 預設值 */
    defaultValue?: string | number | boolean;
    /** 佔位符文字 */
    placeholder?: string;
    /** 是否必填 */
    required?: boolean;
    /** 驗證規則 */
    validation?: ValidationRule;
    /** FHIR LOINC 代碼（用於自動填充） */
    fhirCode?: string;
    /** Patient 資源欄位（用於自動填充） */
    patientField?: 'birthDate' | 'gender';
    /** Radio/Select 選項 */
    options?: InputOption[];
}

/**
 * 輸入類型
 */
export type InputType = 'text' | 'number' | 'checkbox' | 'radio' | 'select' | 'date';

/**
 * 單位切換配置
 */
export interface UnitToggleConfig {
    /** 轉換類型 */
    type: 'weight' | 'height' | 'creatinine' | 'temperature' | 'volume' | 'length';
    /** 可選單位 */
    units: string[];
    /** 預設單位 */
    default: string;
}

/**
 * 輸入選項
 */
export interface InputOption {
    value: string | number;
    label: string;
    points?: number;
    checked?: boolean;
}

/**
 * 驗證規則
 */
export interface ValidationRule {
    min?: number;
    max?: number;
    pattern?: RegExp;
    message?: string;
}

// ==========================================
// 計算結果類型
// ==========================================

/**
 * 計算結果
 */
export interface CalculatorResult {
    /** 主要數值 */
    value: number;
    /** 單位 */
    unit?: string;
    /** 額外數據 */
    additionalData?: Record<string, any>;
}

/**
 * 結果解讀
 */
export interface ResultInterpretation {
    /** 嚴重程度 */
    severity: 'success' | 'warning' | 'danger' | 'info';
    /** 解讀訊息 */
    message: string;
    /** 詳細說明 */
    details?: string;
    /** 建議行動 */
    recommendations?: string[];
}

/**
 * 評分結果（用於評分類計算器）
 */
export interface ScoreResult extends CalculatorResult {
    score: number;
    category?: string;
    riskLevel?: string;
    probability?: number;
}

/**
 * 腎功能結果
 */
export interface GFRResult extends CalculatorResult {
    stage: string;
    stageNumber: number;
}

// ==========================================
// FHIR 類型
// ==========================================

/**
 * FHIR Client（簡化版）
 */
export interface FHIRClient {
    patient: {
        id: string;
        read: () => Promise<Patient>;
    };
    request: (url: string) => Promise<any>;
}

/**
 * Patient 資源
 */
export interface Patient {
    id: string;
    birthDate?: string;
    gender?: 'male' | 'female' | 'other' | 'unknown';
    name?: PatientName[];
}

/**
 * 病人姓名
 */
export interface PatientName {
    use?: string;
    family?: string;
    given?: string[];
    text?: string;
}

/**
 * Observation 資源
 */
export interface Observation {
    id: string;
    status: string;
    code: {
        coding: Coding[];
        text?: string;
    };
    valueQuantity?: {
        value: number;
        unit?: string;
        system?: string;
        code?: string;
    };
    effectiveDateTime?: string;
    issued?: string;
}

/**
 * Coding
 */
export interface Coding {
    system?: string;
    code?: string;
    display?: string;
}

// ==========================================
// 數據過期追蹤器類型
// ==========================================

/**
 * 數據過期追蹤器
 */
export interface StalenessTracker {
    setContainer: (container: HTMLElement) => void;
    trackObservation: (selector: string, observation: Observation, code: string, label: string) => void;
    getStatus: () => Map<string, StalenessInfo>;
}

/**
 * 數據過期資訊
 */
export interface StalenessInfo {
    isStale: boolean;
    ageInDays: number;
    lastUpdated: Date;
    label: string;
}

// ==========================================
// UI Builder 類型
// ==========================================

/**
 * 區塊配置
 */
export interface SectionConfig {
    title?: string;
    icon?: string;
    content: string | string[];
    collapsible?: boolean;
    defaultOpen?: boolean;
}

/**
 * 輸入框配置
 */
export interface InputConfig {
    id: string;
    label: string;
    type?: 'text' | 'number' | 'date';
    placeholder?: string;
    unit?: string;
    unitToggle?: UnitToggleConfig;
    required?: boolean;
    helpText?: string;
}

/**
 * Radio Group 配置
 */
export interface RadioGroupConfig {
    name: string;
    label: string;
    options: InputOption[];
    layout?: 'horizontal' | 'vertical';
}

/**
 * Checkbox 配置
 */
export interface CheckboxConfig {
    id: string;
    label: string;
    value?: string | number;
    checked?: boolean;
}

/**
 * Alert 配置
 */
export interface AlertConfig {
    type: 'info' | 'success' | 'warning' | 'danger';
    message: string;
    dismissible?: boolean;
}

/**
 * 結果框配置
 */
export interface ResultBoxConfig {
    id: string;
    title?: string;
}

/**
 * 結果項目配置
 */
export interface ResultItemConfig {
    label: string;
    value: string;
    unit?: string;
    interpretation?: string;
    alertClass?: string;
}

/**
 * 公式區塊配置
 */
export interface FormulaSectionConfig {
    items: FormulaItem[];
}

/**
 * 公式項目
 */
export interface FormulaItem {
    label?: string;
    title?: string;
    formula?: string;
    formulas?: string[];
    content?: string;
}

// ==========================================
// 計算器模組類型
// ==========================================

/**
 * 計算器模組介面
 * 所有計算器都必須實現這個介面
 */
export interface CalculatorModule {
    /** 計算器 ID */
    id: string;
    /** 計算器標題 */
    title: string;
    /** 計算器描述 */
    description: string;
    /** 生成 HTML */
    generateHTML: () => string;
    /** 初始化計算器 */
    initialize: (client: FHIRClient | null, patient: Patient | null, container: HTMLElement) => void;
}

/**
 * 計算器註冊資訊
 */
export interface CalculatorRegistration {
    id: string;
    title: string;
    category: CalculatorCategory;
    keywords?: string[];
}

