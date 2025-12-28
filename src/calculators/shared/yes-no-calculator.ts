/**
 * Yes/No Radio 評分計算器工廠函數
 *
 * @deprecated 此檔案已被整合到 scoring-calculator.ts
 * 請使用 createScoringCalculator({ inputType: 'yesno', questions: [...] }) 代替
 *
 * 此檔案保留以維持向後兼容性
 */

import {
    createYesNoCalculator,
    createScoringCalculator,
    YesNoQuestion,
    ScoringRiskLevel,
    ScoringFHIRDataRequirements,
    FormulaSectionConfig,
    InterpretationItem,
    ScoringCriteriaItem,
    ScoringCalculatorConfig,
    CalculatorModule
} from './scoring-calculator.js';

// Re-export with proper types
export {
    createYesNoCalculator,
    createScoringCalculator,
    YesNoQuestion,
    FormulaSectionConfig,
    InterpretationItem,
    ScoringCriteriaItem,
    CalculatorModule
};

// Type aliases
export type YesNoRiskLevel = ScoringRiskLevel;
export type YesNoFHIRDataRequirements = ScoringFHIRDataRequirements;

// YesNoCalculatorConfig: questions is required, sections is not used
export type YesNoCalculatorConfig = Omit<ScoringCalculatorConfig, 'inputType' | 'sections'> & {
    questions: YesNoQuestion[];
    /** 自定義結果渲染函數 (可以只接受 score 參數) */
    customResultRenderer?: (score: number, questionScores?: Record<string, number>) => string;
};
