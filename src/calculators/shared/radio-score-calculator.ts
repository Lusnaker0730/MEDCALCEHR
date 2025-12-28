/**
 * Radio Group 評分計算器工廠函數
 *
 * @deprecated 此檔案已被整合到 scoring-calculator.ts
 * 請使用 createScoringCalculator({ inputType: 'radio', ... }) 代替
 *
 * 此檔案保留以維持向後兼容性
 */

// 從統一工廠重新導出所有內容
export {
    // 主要工廠函數
    createRadioScoreCalculator,
    createScoringCalculator,

    // 類型定義
    ScoringOption as RadioOption,
    ScoringSection as RadioSection,
    ScoringRiskLevel as RiskLevel,
    ScoringFHIRDataRequirements as RadioFHIRDataRequirements,
    FormulaSectionConfig,
    InterpretationItem,
    ScoringCriteriaItem,
    ScoringCalculatorConfig as RadioScoreCalculatorConfig,
    CalculatorModule,

    // 新的統一類型
    InputType,
    ScoringOption,
    ScoringSection,
    ScoringRiskLevel,
    ScoringFHIRDataRequirements,
    ScoringCalculatorConfig,
    YesNoQuestion
} from './scoring-calculator.js';
