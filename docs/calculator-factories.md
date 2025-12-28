# 計算器工廠使用指南

本文件說明如何使用更新版的計算器工廠函數來建立醫學計算器。

## 目錄

- [概覽](#概覽)
- [評分計算器 (Scoring Calculator)](#評分計算器-scoring-calculator)
- [公式計算器 (Formula Calculator)](#公式計算器-formula-calculator)
- [專用工廠](#專用工廠)
- [遷移指南](#遷移指南)
- [最佳實踐](#最佳實踐)

---

## 概覽

計算器工廠系統已整合為兩個主要工廠：

| 工廠 | 用途 | 檔案 |
|------|------|------|
| `createScoringCalculator` | 評分類計算器（Radio、Checkbox、Yes/No） | `scoring-calculator.ts` |
| `createUnifiedFormulaCalculator` | 公式計算器（簡單、複雜） | `unified-formula-calculator.ts` |

### 選擇正確的工廠

```
需要建立計算器
    │
    ├─ 使用者選擇選項來累加分數？
    │   └─ 是 → createScoringCalculator
    │
    ├─ 使用者輸入數值來計算結果？
    │   └─ 是 → createUnifiedFormulaCalculator
    │
    ├─ 藥物劑量換算？
    │   └─ 是 → createConversionCalculator
    │
    ├─ 動態新增/移除項目？
    │   └─ 是 → createDynamicListCalculator
    │
    └─ 混合輸入類型？
        └─ 是 → createMixedInputCalculator
```

---

## 評分計算器 (Scoring Calculator)

### 導入

```typescript
import { createScoringCalculator } from '../shared/scoring-calculator.js';
// 或使用向後兼容的導入
import { createRadioScoreCalculator } from '../shared/radio-score-calculator.js';
```

### 輸入類型

| `inputType` | 說明 | 適用場景 |
|-------------|------|----------|
| `'radio'` | 單選按鈕群組 | 每個項目有多個選項（如 0/1/2 分） |
| `'checkbox'` | 複選框 | 每個項目勾選即得分 |
| `'yesno'` | 是/否按鈕 | 簡單的是/否問題 |

### 基本範例：Radio 類型

```typescript
import { createScoringCalculator } from '../shared/scoring-calculator.js';

export const myCalculator = createScoringCalculator({
    id: 'my-score',
    title: 'My Score Calculator',
    description: 'Calculate risk based on clinical criteria.',
    inputType: 'radio',

    sections: [
        {
            title: 'Clinical Criteria',
            options: [
                {
                    name: 'symptom_a',
                    label: 'Symptom A severity',
                    choices: [
                        { value: '0', label: 'None', points: 0, checked: true },
                        { value: '1', label: 'Mild', points: 1 },
                        { value: '2', label: 'Severe', points: 2 }
                    ]
                },
                {
                    name: 'symptom_b',
                    label: 'Symptom B present',
                    choices: [
                        { value: '0', label: 'No', points: 0, checked: true },
                        { value: '1', label: 'Yes', points: 1 }
                    ]
                }
            ]
        }
    ],

    riskLevels: [
        { minScore: 0, maxScore: 1, label: 'Low Risk', description: 'Low probability', severity: 'success' },
        { minScore: 2, maxScore: 3, label: 'High Risk', description: 'Consider intervention', severity: 'danger' }
    ]
});
```

### 基本範例：Checkbox 類型

```typescript
export const checklistCalculator = createScoringCalculator({
    id: 'checklist-score',
    title: 'Checklist Score',
    description: 'Sum of positive criteria.',
    inputType: 'checkbox',

    sections: [
        {
            title: 'Risk Factors',
            options: [
                { id: 'factor_a', label: 'Factor A present', points: 1 },
                { id: 'factor_b', label: 'Factor B present', points: 2 },
                { id: 'factor_c', label: 'Factor C present', points: 1 }
            ]
        }
    ],

    riskLevels: [
        { minScore: 0, maxScore: 1, label: 'Low', severity: 'success' },
        { minScore: 2, maxScore: 4, label: 'High', severity: 'danger' }
    ]
});
```

### 基本範例：Yes/No 類型

```typescript
export const yesNoCalculator = createScoringCalculator({
    id: 'yesno-score',
    title: 'Yes/No Assessment',
    description: 'Answer yes or no to each question.',
    inputType: 'yesno',

    questions: [
        { id: 'q1', text: 'Is the patient over 65?', yesPoints: 1 },
        { id: 'q2', text: 'Does the patient have diabetes?', yesPoints: 1 },
        { id: 'q3', text: 'Is blood pressure controlled?', yesPoints: -1 }  // 負分也支援
    ],

    riskLevels: [
        { minScore: -1, maxScore: 0, label: 'Low Risk', severity: 'success' },
        { minScore: 1, maxScore: 2, label: 'High Risk', severity: 'danger' }
    ]
});
```

### 進階功能

#### 公式/評分表區塊

```typescript
{
    // ... 基本配置 ...

    formulaSection: {
        show: true,
        title: 'Formula',
        calculationNote: 'Sum of selected points:',
        
        // 評分標準表
        scoringCriteria: [
            { criteria: 'Age', isHeader: true },
            { criteria: '<50 years', points: '0' },
            { criteria: '50-65 years', points: '1' },
            { criteria: '>65 years', points: '2' },
            { criteria: 'Symptoms', isHeader: true },
            { criteria: 'None', points: '0' },
            { criteria: 'Present', points: '1' }
        ],

        // 結果解讀表
        interpretationTitle: 'Interpretation',
        tableHeaders: ['Score', 'Risk Level', 'Recommendation'],
        interpretations: [
            { score: '0-1', category: 'Low', interpretation: 'Outpatient follow-up', severity: 'success' },
            { score: '2-3', category: 'Moderate', interpretation: 'Consider admission', severity: 'warning' },
            { score: '≥4', category: 'High', interpretation: 'Immediate intervention', severity: 'danger' }
        ],

        // 註腳
        footnotes: [
            '* Score validated in adult patients only.',
            '† Consider clinical context.'
        ]
    }
}
```

#### FHIR 自動填入

```typescript
import { LOINC_CODES } from '../../fhir-codes.js';

{
    // ... 基本配置 ...

    fhirDataRequirements: {
        autoSelectByValue: [
            {
                optionName: 'heart_rate',
                loincCode: LOINC_CODES.HEART_RATE,
                valueMapper: (hr: number) => {
                    if (hr < 60) return '0';
                    if (hr <= 100) return '1';
                    return '2';
                }
            }
        ]
    }
}
```

---

## 公式計算器 (Formula Calculator)

### 導入

```typescript
import { createUnifiedFormulaCalculator } from '../shared/unified-formula-calculator.js';
// 或使用向後兼容的導入
import { createFormulaCalculator } from '../shared/formula-calculator.js';
import { createComplexFormulaCalculator } from '../shared/complex-formula-calculator.js';
```

### 模式選擇

| 模式 | 說明 | 適用場景 |
|------|------|----------|
| `'simple'` | 扁平輸入列表，直接取得數值 | BMI、QTc 等簡單公式 |
| `'complex'` | 區塊化輸入，使用輔助函數 | APACHE II、風險評估等複雜計算 |

### Simple 模式範例

```typescript
import { createUnifiedFormulaCalculator } from '../shared/unified-formula-calculator.js';

export const bmiCalculator = createUnifiedFormulaCalculator({
    id: 'bmi',
    title: 'BMI Calculator',
    description: 'Calculate Body Mass Index.',
    mode: 'simple',  // 可省略，會自動判斷

    inputs: [
        {
            type: 'number',
            id: 'weight',
            label: 'Weight',
            standardUnit: 'kg',
            unitConfig: {
                type: 'weight',
                units: ['kg', 'lbs'],
                default: 'kg'
            },
            min: 1,
            max: 500,
            loincCode: '29463-7'  // FHIR 自動填入
        },
        {
            type: 'number',
            id: 'height',
            label: 'Height',
            standardUnit: 'cm',
            unitConfig: {
                type: 'length',
                units: ['cm', 'in'],
                default: 'cm'
            },
            min: 30,
            max: 300,
            loincCode: '8302-2'
        }
    ],

    // 計算函數：接收標準化後的數值
    calculate: (values) => {
        const weight = values.weight as number;
        const height = values.height as number;

        const heightM = height / 100;
        const bmi = weight / (heightM * heightM);

        let interpretation = '';
        let alertClass: 'success' | 'warning' | 'danger' = 'success';

        if (bmi < 18.5) {
            interpretation = 'Underweight';
            alertClass = 'warning';
        } else if (bmi < 25) {
            interpretation = 'Normal';
            alertClass = 'success';
        } else if (bmi < 30) {
            interpretation = 'Overweight';
            alertClass = 'warning';
        } else {
            interpretation = 'Obese';
            alertClass = 'danger';
        }

        return [
            {
                label: 'BMI',
                value: bmi.toFixed(1),
                unit: 'kg/m²',
                interpretation,
                alertClass
            }
        ];
    },

    formulas: [
        {
            label: 'BMI',
            formula: 'weight (kg) / height² (m²)',
            notes: 'Standard WHO classification'
        }
    ]
});
```

### Complex 模式範例

```typescript
import { createUnifiedFormulaCalculator } from '../shared/unified-formula-calculator.js';

export const complexCalculator = createUnifiedFormulaCalculator({
    id: 'complex-score',
    title: 'Complex Risk Score',
    description: 'Multi-section risk assessment.',
    mode: 'complex',

    sections: [
        {
            title: 'Demographics',
            icon: '👤',
            fields: [
                { id: 'age', label: 'Age', unit: 'years', min: 0, max: 120 },
                {
                    name: 'sex',
                    label: 'Sex',
                    options: [
                        { value: 'male', label: 'Male', checked: true },
                        { value: 'female', label: 'Female' }
                    ]
                }
            ]
        },
        {
            title: 'Vital Signs',
            icon: '💓',
            fields: [
                {
                    id: 'sbp',
                    label: 'Systolic BP',
                    unit: 'mmHg',
                    min: 50,
                    max: 300
                },
                {
                    id: 'temp',
                    label: 'Temperature',
                    unitToggle: {
                        type: 'temperature',
                        units: ['°C', '°F'],
                        default: '°C'
                    }
                }
            ]
        }
    ],

    // 使用輔助函數的計算
    complexCalculate: (getValue, getStdValue, getRadioValue, getCheckboxValue) => {
        const age = getValue('age');
        const sex = getRadioValue('sex');
        const sbp = getValue('sbp');
        const tempC = getStdValue('temp', '°C');  // 自動轉換為攝氏

        if (age === null || sbp === null) return null;

        let score = 0;

        // 年齡評分
        if (age >= 65) score += 2;
        else if (age >= 45) score += 1;

        // 性別調整
        if (sex === 'male') score += 1;

        // 血壓評分
        if (sbp > 180) score += 3;
        else if (sbp > 140) score += 1;

        // 結果判斷
        let interpretation = '';
        let severity: 'success' | 'warning' | 'danger' = 'success';

        if (score >= 5) {
            interpretation = 'High Risk';
            severity = 'danger';
        } else if (score >= 3) {
            interpretation = 'Moderate Risk';
            severity = 'warning';
        } else {
            interpretation = 'Low Risk';
            severity = 'success';
        }

        return {
            score,
            interpretation,
            severity,
            breakdown: `Age: ${age >= 65 ? '+2' : age >= 45 ? '+1' : '0'}, Sex: ${sex === 'male' ? '+1' : '0'}, BP: ${sbp > 180 ? '+3' : sbp > 140 ? '+1' : '0'}`,
            additionalResults: [
                { label: 'Age Factor', value: age >= 65 ? 'High' : 'Normal' },
                { label: 'BP Category', value: sbp > 140 ? 'Elevated' : 'Normal' }
            ]
        };
    },

    autoPopulateAge: 'age',
    autoPopulateGender: 'sex'
});
```

### 輔助函數說明

| 函數 | 用途 | 回傳值 |
|------|------|--------|
| `getValue(id)` | 取得原始數值 | `number \| null` |
| `getStdValue(id, unit)` | 取得轉換後的標準單位數值 | `number \| null` |
| `getRadioValue(name)` | 取得選中的 radio 值 | `string \| null` |
| `getCheckboxValue(id)` | 取得 checkbox 是否勾選 | `boolean` |

---

## 專用工廠

### 換算計算器 (Conversion Calculator)

適用於藥物劑量換算、單位換算等。

```typescript
import { createConversionCalculator } from '../shared/conversion-calculator.js';

export const steroidConversion = createConversionCalculator({
    id: 'steroid-conversion',
    title: 'Steroid Conversion',
    description: 'Convert between corticosteroid doses.',

    fromInput: {
        id: 'from-dose',
        label: 'From Dose',
        unit: 'mg'
    },

    fromSelect: {
        id: 'from-drug',
        label: 'From Drug',
        options: [
            { value: 'hydrocortisone', label: 'Hydrocortisone' },
            { value: 'prednisone', label: 'Prednisone' },
            { value: 'dexamethasone', label: 'Dexamethasone' }
        ]
    },

    toSelect: {
        id: 'to-drug',
        label: 'To Drug',
        options: [
            { value: 'hydrocortisone', label: 'Hydrocortisone' },
            { value: 'prednisone', label: 'Prednisone' },
            { value: 'dexamethasone', label: 'Dexamethasone' }
        ]
    },

    conversionFactors: {
        hydrocortisone: 1,
        prednisone: 4,
        dexamethasone: 25
    },

    calculate: (fromDose, fromDrug, toDrug, factors) => {
        const fromFactor = factors[fromDrug];
        const toFactor = factors[toDrug];
        return (fromDose * fromFactor) / toFactor;
    }
});
```

### 動態列表計算器 (Dynamic List Calculator)

適用於需要動態新增/移除項目的計算器。

```typescript
import { createDynamicListCalculator } from '../shared/dynamic-list-calculator.js';

export const mmeCalculator = createDynamicListCalculator({
    id: 'mme',
    title: 'Morphine Milligram Equivalent',
    description: 'Calculate total daily MME.',

    itemConfig: {
        drug: {
            type: 'select',
            label: 'Opioid',
            options: [
                { value: 'morphine', label: 'Morphine' },
                { value: 'oxycodone', label: 'Oxycodone' },
                { value: 'hydrocodone', label: 'Hydrocodone' }
            ]
        },
        dose: {
            type: 'number',
            label: 'Dose',
            unit: 'mg'
        },
        frequency: {
            type: 'select',
            label: 'Frequency',
            options: [
                { value: '1', label: 'Once daily' },
                { value: '2', label: 'Twice daily' },
                { value: '4', label: 'Four times daily' }
            ]
        }
    },

    conversionFactors: {
        morphine: 1,
        oxycodone: 1.5,
        hydrocodone: 1
    },

    calculateTotal: (items, factors) => {
        return items.reduce((total, item) => {
            const factor = factors[item.drug] || 1;
            const freq = parseInt(item.frequency) || 1;
            return total + (item.dose * factor * freq);
        }, 0);
    }
});
```

### 混合輸入計算器 (Mixed Input Calculator)

適用於同時需要數值輸入和選項選擇的計算器。

```typescript
import { createMixedInputCalculator } from '../shared/mixed-input-calculator.js';

export const mixedCalculator = createMixedInputCalculator({
    id: 'mixed-calc',
    title: 'Mixed Input Calculator',
    description: 'Combines numeric inputs with scoring options.',

    numericInputs: [
        { id: 'age', label: 'Age', unit: 'years' },
        { id: 'creatinine', label: 'Creatinine', unit: 'mg/dL' }
    ],

    scoringOptions: [
        {
            name: 'diabetes',
            label: 'Diabetes',
            choices: [
                { value: '0', label: 'No', points: 0 },
                { value: '1', label: 'Yes', points: 2 }
            ]
        }
    ],

    calculate: (values, scores) => {
        // values: { age: number, creatinine: number }
        // scores: { diabetes: number }
        const total = (values.age > 65 ? 1 : 0) + scores.diabetes;
        return { score: total, interpretation: total > 2 ? 'High' : 'Low' };
    }
});
```

---

## 遷移指南

### 從舊版 API 遷移

舊版 API 仍然支援，但建議逐步遷移到新版。

#### Radio Score Calculator

```typescript
// 舊版 (仍支援)
import { createRadioScoreCalculator } from '../shared/radio-score-calculator.js';

// 新版 (推薦)
import { createScoringCalculator } from '../shared/scoring-calculator.js';
const calc = createScoringCalculator({ inputType: 'radio', ... });
```

#### Score Calculator (Checkbox)

```typescript
// 舊版 (仍支援)
import { createScoreCalculator } from '../shared/score-calculator.js';

// 新版 (推薦)
import { createScoringCalculator } from '../shared/scoring-calculator.js';
const calc = createScoringCalculator({ inputType: 'checkbox', ... });
```

#### Yes/No Calculator

```typescript
// 舊版 (仍支援)
import { createYesNoCalculator } from '../shared/yes-no-calculator.js';

// 新版 (推薦)
import { createScoringCalculator } from '../shared/scoring-calculator.js';
const calc = createScoringCalculator({ inputType: 'yesno', ... });
```

#### Formula Calculator

```typescript
// 舊版 (仍支援)
import { createFormulaCalculator } from '../shared/formula-calculator.js';

// 新版 (推薦)
import { createUnifiedFormulaCalculator } from '../shared/unified-formula-calculator.js';
const calc = createUnifiedFormulaCalculator({ mode: 'simple', ... });
```

#### Complex Formula Calculator

```typescript
// 舊版 (仍支援)
import { createComplexFormulaCalculator } from '../shared/complex-formula-calculator.js';
const calc = createComplexFormulaCalculator({
    calculate: (getValue, getStdValue, ...) => { ... }
});

// 新版 (推薦)
import { createUnifiedFormulaCalculator } from '../shared/unified-formula-calculator.js';
const calc = createUnifiedFormulaCalculator({
    mode: 'complex',
    complexCalculate: (getValue, getStdValue, ...) => { ... }
});
```

---

## 最佳實踐

### 1. 選擇正確的工廠

- **評分累加** → `createScoringCalculator`
- **數學公式** → `createUnifiedFormulaCalculator`
- **劑量換算** → `createConversionCalculator`
- **動態項目** → `createDynamicListCalculator`

### 2. 使用 FHIR 自動填入

```typescript
// 在輸入配置中指定 loincCode
{ id: 'weight', label: 'Weight', loincCode: '29463-7' }
```

### 3. 使用單位切換

```typescript
{
    id: 'temp',
    label: 'Temperature',
    unitConfig: {
        type: 'temperature',
        units: ['°C', '°F'],
        default: '°C'
    }
}
```

### 4. 提供公式參考

使用 `formulaSection` 或 `formulas` 屬性提供計算說明。

### 5. 適當的風險分級顏色

| 嚴重度 | 用途 |
|--------|------|
| `'success'` | 低風險、正常 |
| `'info'` | 資訊性結果 |
| `'warning'` | 中等風險、需注意 |
| `'danger'` | 高風險、需立即處理 |

### 6. 檔案結構

```
src/calculators/
├── my-calculator/
│   └── index.ts          # 計算器定義
├── shared/
│   ├── scoring-calculator.ts
│   └── unified-formula-calculator.ts
└── index.ts              # 匯出所有計算器
```

---

## 類型定義參考

完整的類型定義請參考：

- `src/calculators/shared/scoring-calculator.ts`
- `src/calculators/shared/unified-formula-calculator.ts`

---

*文件更新日期：2025-12-28*

