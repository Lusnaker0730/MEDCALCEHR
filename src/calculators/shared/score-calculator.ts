/**
 * 評分計算器工廠函數（Checkbox 類型）
 *
 * @deprecated 此檔案已被整合到 scoring-calculator.ts
 * 請使用 createScoringCalculator({ inputType: 'checkbox', ... }) 代替
 *
 * 此檔案保留以維持向後兼容性
 */

// 從統一工廠重新導出
export {
    createScoreCalculator,
    createScoringCalculator,
    ScoringOption as ScoreOption,
    ScoringSection as ScoreSection,
    ScoringRiskLevel as RiskLevel,
    ScoringFHIRDataRequirements as ScoreFHIRDataRequirements,
    FormulaSectionConfig,
    InterpretationItem,
    ScoringCriteriaItem,
    ScoringCalculatorConfig as ScoreCalculatorConfig,
    CalculatorModule
} from './scoring-calculator.js';
