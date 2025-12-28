/**
 * 計算器類型定義統一導出
 *
 * 使用方式：
 * import type { CalculatorModule, ScoringCalculatorConfig } from '../types';
 * 或
 * import type { CalculatorModule, ScoringCalculatorConfig } from '../types/index.js';
 */
export type { AlertSeverity, InputType, CalculationMode, CalculatorModule, FHIRClientType, PatientType, FieldDataRequirement, FHIRAutoPopulateConfig, BaseRiskLevel, RiskLevel, UnitToggleConfig, BaseCalculationResult, ScoreCalculationResult, ValueCalculationResult, FormulaReferenceItem, ScoringCriteriaItem, InterpretationItem, FormulaSectionConfig, BaseCalculatorConfig } from './calculator-base.js';
export type { ScoringInputType, ScoringOption, RadioChoice, ScoringSection, YesNoQuestion, YesNoModeConfig, ScoringRiskLevel, ScoringFHIRDataRequirements, ScoringCalculatorConfig, RadioOption, RadioSection, RadioScoreCalculatorConfig, ScoreCalculatorConfig, YesNoCalculatorConfig } from './calculator-scoring.js';
export type { NumberInputConfig, RadioOptionItem, RadioInputConfig, SelectOptionItem, SelectInputConfig, InputConfig, InputSectionConfig, FormulaResultItem, ComplexCalculationResult, GetValueFn, GetStdValueFn, GetRadioValueFn, GetCheckboxValueFn, SimpleCalculateFn, ComplexCalculateFn, FormulaCalculatorConfig, FormulaNumberInputConfig, FormulaRadioInputConfig, FormulaSelectInputConfig, FormulaInputConfig, FormulaConfig, InputFieldConfig, RadioFieldConfig, InputSection, ComplexFormulaCalculatorConfig, CalculationResult } from './calculator-formula.js';
export type { DrugOption, ConversionMatrix, ConversionTableConfig, ConversionResult, ConversionCalculatorConfig, DynamicListItemOption, DynamicListRiskLevel, DynamicListCalculatorConfig, ConditionalScoreOption, ConditionalScoreCriterion, ConditionalScoreCategory, ConditionalScoreInterpretation, ConditionSelectorConfig, ConditionalFHIRAutoPopulate, ConditionalScoreCalculatorConfig, MixedNumberInputConfig, MixedRadioOptionConfig, MixedRadioGroupConfig, MixedSelectOptionConfig, MixedSelectConfig, MixedInputItemConfig, MixedSectionConfig, MixedCalculationResult, MixedRiskLevel, MixedFHIRDataRequirements, MixedInputCalculatorConfig, ItemOption, ScoreOption, ScoreCriterion, ScoreCategory, ScoreInterpretation } from './calculator-specialized.js';
//# sourceMappingURL=index.d.ts.map