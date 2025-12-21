/**
 * 類型定義索引文件
 * 
 * 從這裡導入所有需要的類型
 * 
 * @example
 * import type { CalculatorConfig, InputOptions, Patient } from './types/index.js';
 */

// 計算器相關類型
export type {
    // 配置類型
    CalculatorConfig,
    CalculatorCategory,
    Reference,
    
    // 輸入類型
    CalculatorInput,
    InputType,
    UnitToggleConfig as CalculatorUnitToggle,
    InputOption,
    ValidationRule,
    
    // 結果類型
    CalculatorResult,
    ResultInterpretation,
    ScoreResult,
    GFRResult,
    
    // FHIR 類型
    FHIRClient,
    Patient,
    PatientName,
    Observation,
    Coding,
    
    // 數據追蹤類型
    StalenessTracker,
    StalenessInfo,
    
    // 模組類型
    CalculatorModule,
    CalculatorRegistration
} from './calculator.js';

// UI Builder 相關類型
export type {
    // 組件配置類型
    SectionOptions,
    InputOptions,
    RadioGroupOptions,
    RadioOption,
    CheckboxGroupOptions,
    CheckboxOption,
    CheckboxOptions,
    SelectOptions,
    SelectOption,
    RangeOptions,
    ResultBoxOptions,
    ResultItemOptions,
    AlertOptions,
    FormulaSectionOptions,
    FormulaItem,
    TableOptions,
    FormOptions,
    FormField,
    
    // 通用類型
    AlertType,
    InputFieldType,
    UnitToggleConfig,
    
    // 介面類型
    IUIBuilder
} from './ui-builder.js';

