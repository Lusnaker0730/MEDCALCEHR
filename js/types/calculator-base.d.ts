/**
 * 計算器基礎類型定義
 *
 * 包含所有計算器共用的基礎類型
 */
/** 嚴重程度等級 */
export type AlertSeverity = 'success' | 'warning' | 'danger' | 'info';
/** 輸入類型 */
export type InputType = 'radio' | 'checkbox' | 'yesno' | 'number' | 'select' | 'text';
/** 計算模式 */
export type CalculationMode = 'simple' | 'complex';
/**
 * 計算器模組介面
 *
 * 所有計算器工廠函數都應該返回此介面
 */
export interface CalculatorModule {
    /** 計算器唯一識別碼 */
    id: string;
    /** 計算器標題 */
    title: string;
    /** 計算器描述 */
    description: string;
    /** 生成 HTML 內容 */
    generateHTML: () => string;
    /**
     * 初始化計算器
     * @param client FHIR 客戶端 (可為 null)
     * @param patient 病患資料 (可為 null)
     * @param container 計算器容器元素
     */
    initialize: (client: FHIRClientType | null, patient: PatientType | null, container: HTMLElement) => void | Promise<void>;
}
/** FHIR 客戶端類型 (簡化) */
export type FHIRClientType = unknown;
/** 病患類型 (簡化) */
export type PatientType = unknown;
/** FHIR 欄位數據需求 */
export interface FieldDataRequirement {
    /** 輸入元素選擇器 (如 "#weight") */
    inputId: string;
    /** LOINC 代碼 */
    code: string;
    /** 欄位標籤 */
    label: string;
    /** 目標單位 */
    targetUnit?: string;
    /** 單位類型 (用於轉換) */
    unitType?: string;
    /** 小數位數 */
    decimals?: number;
}
/** 通用 FHIR 自動填入配置 */
export interface FHIRAutoPopulateConfig {
    /** 欄位 ID */
    fieldId: string;
    /** LOINC 代碼 */
    loincCode: string;
    /** 目標單位 */
    targetUnit?: string;
    /** 單位類型 */
    unitType?: string;
    /** 格式化函數 */
    formatter?: (value: number) => string;
}
/** 基礎風險等級 */
export interface BaseRiskLevel {
    /** 最低分數 */
    minScore: number;
    /** 最高分數 */
    maxScore: number;
    /** 標籤 */
    label?: string;
    /** 嚴重程度 */
    severity: AlertSeverity;
    /** 描述 */
    description?: string;
    /** 建議行動 */
    recommendation?: string;
}
/** 風險等級 (含類別) */
export interface RiskLevel extends BaseRiskLevel {
    /** 風險描述 */
    risk?: string;
    /** 類別 */
    category?: string;
}
/** 單位切換配置 */
export interface UnitToggleConfig {
    /** 單位類型 (如 'weight', 'length', 'temperature') */
    type: string;
    /** 可選單位列表 */
    units: string[];
    /** 預設單位 */
    default: string;
}
/** 基礎計算結果 */
export interface BaseCalculationResult {
    /** 結果解讀 */
    interpretation?: string;
    /** 嚴重程度 */
    severity: AlertSeverity;
}
/** 分數計算結果 */
export interface ScoreCalculationResult extends BaseCalculationResult {
    /** 總分 */
    score: number;
    /** 分項分數 */
    sectionScores?: Record<string, number>;
}
/** 數值計算結果 */
export interface ValueCalculationResult extends BaseCalculationResult {
    /** 計算值 */
    value: number;
    /** 單位 */
    unit?: string;
}
/** 公式參考項目 */
export interface FormulaReferenceItem {
    /** 公式標籤 */
    label: string;
    /** 公式內容 */
    formula: string;
    /** 備註 */
    notes?: string;
}
/** 評分標準項目 */
export interface ScoringCriteriaItem {
    /** 標準內容 */
    criteria: string;
    /** 分數 */
    points?: string;
    /** 是否為標題行 */
    isHeader?: boolean;
}
/** 解釋項目 */
export interface InterpretationItem {
    /** 分數範圍 */
    score: string;
    /** 類別 */
    category?: string;
    /** 解釋內容 */
    interpretation: string;
    /** 嚴重程度 */
    severity?: AlertSeverity;
}
/** 公式區塊配置 */
export interface FormulaSectionConfig {
    /** 是否顯示 */
    show: boolean;
    /** 標題 */
    title?: string;
    /** 計算說明 */
    calculationNote?: string;
    /** 評分標準列表 */
    scoringCriteria?: ScoringCriteriaItem[];
    /** 註腳 */
    footnotes?: string[];
    /** 解釋標題 */
    interpretationTitle?: string;
    /** 表格標頭 */
    tableHeaders?: string[];
    /** 解釋列表 */
    interpretations?: InterpretationItem[];
}
/** 基礎計算器配置 */
export interface BaseCalculatorConfig {
    /** 計算器 ID */
    id: string;
    /** 計算器標題 */
    title: string;
    /** 計算器描述 */
    description: string;
    /** 提示訊息 */
    infoAlert?: string;
    /** 參考文獻 (HTML) */
    reference?: string;
}
//# sourceMappingURL=calculator-base.d.ts.map