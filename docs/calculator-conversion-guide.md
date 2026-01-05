# 計算器轉換指南：統一公式計算器框架

本指南說明如何將現有計算器轉換為使用 `createUnifiedFormulaCalculator` 工廠函數，並撰寫符合 SaMD 標準的驗證測試。

---

## 快速參考：找不到對應規則？

| 情況 | 解決方案 |
|------|----------|
| 找不到 `validationType` | 到 `src/validator.ts` 新增 `ValidationRules` |
| 找不到 `LOINC_CODES` | 到 `src/fhir-codes.ts` 新增 LOINC 代碼 |
| 找不到 `unitConfig.type` | 到 `src/unit-converter.ts` 新增單位轉換 |

---

## 目錄

1. [概述](#概述)
2. [轉換步驟](#轉換步驟)
3. [檔案結構](#檔案結構)
4. [Step 1: 建立 calculation.ts](#step-1-建立-calculationts)
5. [Step 2: 建立 index.ts](#step-2-建立-indexts)
6. [Step 3: 加入驗證規則](#step-3-加入驗證規則)
7. [Step 4: 撰寫 SaMD 驗證測試](#step-4-撰寫-samd-驗證測試)
8. [完整範例](#完整範例)
9. [常見問題](#常見問題)

---

## 概述

### 為什麼要轉換？

使用 `createUnifiedFormulaCalculator` 的優點：

| 功能 | 說明 |
|------|------|
| 🔄 **統一介面** | 所有計算器使用相同的配置格式 |
| ✅ **自動驗證** | 內建三區驗證系統（紅/黃/綠） |
| 🏥 **FHIR 整合** | 自動從病歷系統填入資料 |
| 🎨 **一致的 UI** | 使用 uiBuilder 生成統一樣式 |
| 🧪 **易於測試** | 計算邏輯獨立，方便單元測試 |

### 架構圖

```
┌─────────────────────────────────────────────────────────────┐
│                    Calculator Module                         │
├─────────────────────────────────────────────────────────────┤
│  index.ts                                                    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ FormulaCalculatorConfig                                 ││
│  │  - id, title, description                               ││
│  │  - sections (UI 配置)                                   ││
│  │  - formulas (公式參考)                                  ││
│  │  - validationType (驗證規則)                            ││
│  │  - calculate → calculation.ts                           ││
│  └─────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────┤
│  calculation.ts                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 純計算邏輯                                              ││
│  │  - 接收 values 物件                                     ││
│  │  - 回傳 FormulaResultItem[]                            ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              createUnifiedFormulaCalculator                  │
│  - 生成 HTML                                                │
│  - 處理事件監聽                                              │
│  - 執行驗證                                                  │
│  - 呼叫 calculate 函數                                       │
│  - 渲染結果                                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 轉換步驟

```
1. 分析現有計算器
       │
       ▼
2. 建立 calculation.ts（抽離計算邏輯）
       │
       ▼
3. 建立 index.ts（配置 FormulaCalculatorConfig）
       │
       ▼
4. 加入 validationType（對應 ValidationRules）
       │
       ▼
5. 使用 uiBuilder 建立 infoAlert
       │
       ▼
6. 撰寫 SaMD 驗證測試
       │
       ▼
7. 執行測試並驗證
```

---

## 檔案結構

轉換後的計算器應有以下結構：

```
src/calculators/your-calculator/
├── index.ts          # 計算器配置與導出
└── calculation.ts    # 純計算邏輯

src/__tests__/calculators/
└── your-calculator.test.ts  # SaMD 驗證測試
```

---

## Step 1: 建立 calculation.ts

### 目標

將計算邏輯抽離為純函數，方便測試和維護。

### 模板

```typescript
import type { SimpleCalculateFn, FormulaResultItem } from '../../types/calculator-formula.js';

/**
 * 計算器名稱 - 計算函數
 * 
 * 公式：[在此描述公式]
 * 
 * @param values - 輸入值物件，key 對應 input id
 * @returns FormulaResultItem[] | null
 */
export const calculateYourCalculator: SimpleCalculateFn = (values) => {
    // 1. 取得輸入值
    const input1 = Number(values['your-input-1']);
    const input2 = Number(values['your-input-2']);
    const radioValue = values['your-radio'] as string;

    // 2. 驗證輸入
    if (!input1 || !input2 || isNaN(input1) || isNaN(input2)) {
        return null;
    }

    // 3. 執行計算
    const result = input1 * input2;  // 你的計算邏輯

    // 4. 判斷嚴重度（如果適用）
    let interpretation = '';
    let alertClass: 'success' | 'warning' | 'danger' | 'info' = 'info';

    if (result > 100) {
        interpretation = 'High';
        alertClass = 'danger';
    } else if (result > 50) {
        interpretation = 'Moderate';
        alertClass = 'warning';
    } else {
        interpretation = 'Normal';
        alertClass = 'success';
    }

    // 5. 回傳結果陣列
    const results: FormulaResultItem[] = [
        {
            label: 'Result',
            value: result.toFixed(1),
            unit: 'units',
            interpretation: interpretation,
            alertClass: alertClass
        }
    ];

    return results;
};
```

### 注意事項

1. **使用 `SimpleCalculateFn` 類型**：確保函數簽名正確
2. **使用 `FormulaResultItem[]` 類型**：明確指定結果陣列類型，避免 TypeScript 錯誤
3. **輸入 ID 必須對應 index.ts 中的配置**
4. **回傳 `null` 表示無法計算**（缺少必要輸入）

---

## Step 2: 建立 index.ts

### 模板

```typescript
import { uiBuilder } from '../../ui-builder.js';
import { createUnifiedFormulaCalculator } from '../shared/unified-formula-calculator.js';
import { calculateYourCalculator } from './calculation.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import type { FormulaCalculatorConfig } from '../../types/calculator-formula.js';

export const yourCalculatorConfig: FormulaCalculatorConfig = {
    // ========================================
    // 基本資訊
    // ========================================
    id: 'your-calculator',
    title: 'Your Calculator Title',
    description: 'Brief description of what this calculator does.',

    // ========================================
    // 資訊提示（使用 uiBuilder）
    // ========================================
    infoAlert: '<h4>Clinical Applications</h4>' + uiBuilder.createList({
        items: [
            '<strong>Point 1:</strong> Description',
            '<strong>Point 2:</strong> Description'
        ]
    }),

    // ========================================
    // 輸入區塊配置
    // ========================================
    sections: [
        {
            title: 'Patient Data',
            icon: '👤',
            fields: [
                // 數字輸入（帶單位切換）
                {
                    type: 'number',
                    id: 'your-weight',
                    label: 'Weight',
                    placeholder: 'e.g., 70',
                    unitConfig: { 
                        type: 'weight', 
                        units: ['kg', 'lbs'], 
                        default: 'kg' 
                    },
                    validationType: 'weight',  // ← 對應 ValidationRules
                    loincCode: LOINC_CODES.WEIGHT,  // ← FHIR 自動填入
                    standardUnit: 'kg',
                    required: true
                },
                // 數字輸入（無單位切換）
                {
                    type: 'number',
                    id: 'your-age',
                    label: 'Age',
                    unit: 'years',
                    placeholder: 'e.g., 65',
                    validationType: 'age',
                    required: true
                },
                // Radio 輸入
                {
                    type: 'radio',
                    id: 'your-gender',
                    label: 'Gender',
                    options: [
                        { label: 'Male', value: 'male', checked: true },
                        { label: 'Female', value: 'female' }
                    ]
                },
                // Select 輸入
                {
                    type: 'select',
                    id: 'your-category',
                    label: 'Category',
                    options: [
                        { value: 'option1', label: 'Option 1' },
                        { value: 'option2', label: 'Option 2' }
                    ]
                }
            ]
        },
        {
            title: 'Lab Values',
            icon: '🧪',
            fields: [
                {
                    type: 'number',
                    id: 'your-creatinine',
                    label: 'Creatinine',
                    placeholder: 'e.g., 1.2',
                    unitConfig: { 
                        type: 'creatinine', 
                        units: ['mg/dL', 'µmol/L'], 
                        default: 'mg/dL' 
                    },
                    validationType: 'creatinine',
                    loincCode: LOINC_CODES.CREATININE,
                    standardUnit: 'mg/dL',
                    required: true
                }
            ]
        }
    ],

    // ========================================
    // 公式參考
    // ========================================
    formulas: [
        { label: 'Formula Name', formula: 'A × B / C' },
        { label: 'Note', formula: 'Additional notes about the formula' }
    ],

    // ========================================
    // 自動填入配置
    // ========================================
    autoPopulateAge: 'your-age',      // 自動填入年齡的 input ID
    autoPopulateGender: 'your-gender', // 自動填入性別的 input ID

    // ========================================
    // 計算函數
    // ========================================
    calculate: calculateYourCalculator
};

// 導出計算器模組
export const yourCalculator = createUnifiedFormulaCalculator(yourCalculatorConfig);
```

---

## Step 3: 加入驗證規則

### validationType 對照表

在 `NumberInputConfig` 中加入 `validationType` 屬性，系統會自動套用對應的驗證規則：

| validationType | 紅區 (min-max) | 黃區 (warnMin-warnMax) | 說明 |
|----------------|----------------|------------------------|------|
| `age` | 0-130 | 1-110 | 年齡 |
| `weight` | 0.5-500 kg | 30-200 kg | 體重 |
| `height` | 30-280 cm | 100-220 cm | 身高 |
| `temperature` | 25-45 °C | 35-42 °C | 體溫 |
| `heartRate` | 20-300 bpm | 50-120 bpm | 心率 |
| `systolicBP` | 40-300 mmHg | 80-180 mmHg | 收縮壓 |
| `diastolicBP` | 20-200 mmHg | 50-110 mmHg | 舒張壓 |
| `pH` | 6.5-8.0 | 7.25-7.55 | 動脈血 pH |
| `sodium` | 100-180 mEq/L | 130-150 mEq/L | 血清鈉 |
| `potassium` | 1.5-9.0 mEq/L | 3.3-5.3 mEq/L | 血清鉀 |
| `creatinine` | 0.1-20 mg/dL | 0.4-10 mg/dL | 血清肌酐 |
| `hemoglobin` | 2-25 g/dL | 10-17 g/dL | 血紅素 |
| `platelets` | 1-2000 ×10⁹/L | 100-450 ×10⁹/L | 血小板 |
| `bilirubin` | 0.1-50 mg/dL | 0.2-5 mg/dL | 總膽紅素 |
| `albumin` | 0.5-7 g/dL | 2.5-5 g/dL | 白蛋白 |
| `inr` | 0.5-15 | 0.9-4 | INR |

完整列表請參考 `docs/validation-system-guide.md`。

### ⚠️ 找不到對應的 validationType？

如果需要的驗證類型不存在，請到 `src/validator.ts` 新增規則：

```typescript
// src/validator.ts

export const ValidationRules: Record<string, ValidationRule> = {
    // ... 現有規則 ...

    // 新增你的驗證規則
    yourNewType: {
        required: true,
        min: 0,           // 紅區下限（低於此值顯示錯誤，阻止計算）
        max: 100,         // 紅區上限（高於此值顯示錯誤，阻止計算）
        warnMin: 10,      // 黃區下限（低於此值但高於 min，顯示警告）
        warnMax: 90,      // 黃區上限（高於此值但低於 max，顯示警告）
        message: 'Value must be between 0-100',           // 紅區錯誤訊息
        warningMessage: 'Value is unusual; double-check.' // 黃區警告訊息
    }
};
```

### 驗證行為

```
輸入值
   │
   ▼
┌─────────────────────────────────────┐
│ value < min OR value > max ?        │ → 紅色邊框 + 錯誤訊息，阻止計算
└─────────────────────────────────────┘
   │ 否
   ▼
┌─────────────────────────────────────┐
│ value < warnMin OR value > warnMax ?│ → 黃色邊框 + 警告訊息，允許計算
└─────────────────────────────────────┘
   │ 否
   ▼
┌─────────────────────────────────────┐
│ 綠區：正常計算，無提示              │
└─────────────────────────────────────┘
```

---

## Step 4: 撰寫 SaMD 驗證測試

### SaMD 測試框架

根據 FDA SaMD / IEC 62304 標準，測試應包含：

| 測試類別 | 說明 |
|----------|------|
| **TC-001** | Standard Calculations - 標準計算驗證 |
| **TC-002** | Severity Classification - 嚴重度分類 |
| **TC-003** | Boundary Values - 邊界值測試 |
| **TC-004** | Invalid Inputs - 無效輸入處理 |
| **TC-005** | Golden Dataset - 黃金數據集驗證 |
| **TC-006+** | Formula-specific - 公式特定測試 |

### 測試模板

```typescript
/**
 * Your Calculator - SaMD Verification Tests
 * 
 * Formula: [描述公式]
 * 
 * Clinical Thresholds:
 *   - [閾值說明]
 * 
 * Reference: [參考文獻]
 */

import { calculateYourCalculator } from '../../calculators/your-calculator/calculation.js';

describe('Your Calculator', () => {
    // ===========================================
    // TC-001: Standard Calculation Tests
    // ===========================================
    
    describe('Standard Calculations', () => {
        test('Should calculate correct result for standard case', () => {
            // 手動計算預期值並註解
            // Formula: input1 * input2 = 70 * 1.0 = 70
            const result = calculateYourCalculator({
                'your-input-1': 70,
                'your-input-2': 1.0
            });

            expect(result).not.toBeNull();
            expect(result).toHaveLength(1);
            expect(result![0].value).toBe('70.0');
        });
    });

    // ===========================================
    // TC-002: Severity Classification Tests
    // ===========================================
    
    describe('Severity Classification', () => {
        test('Should identify "Danger" level', () => {
            const result = calculateYourCalculator({
                'your-input-1': 100,
                'your-input-2': 2.0
            });

            expect(result).not.toBeNull();
            expect(result![0].alertClass).toBe('danger');
            expect(result![0].interpretation).toContain('High');
        });

        test('Should identify "Warning" level', () => {
            // ...
        });

        test('Should identify "Normal" level', () => {
            // ...
        });
    });

    // ===========================================
    // TC-003: Boundary Value Tests
    // ===========================================
    
    describe('Boundary Values', () => {
        test('Should handle minimum valid inputs', () => {
            const result = calculateYourCalculator({
                'your-input-1': 0.1,
                'your-input-2': 0.1
            });

            expect(result).not.toBeNull();
        });

        test('Should handle maximum valid inputs', () => {
            // ...
        });

        test('Should handle boundary at clinical threshold', () => {
            // ...
        });
    });

    // ===========================================
    // TC-004: Invalid Input Tests
    // ===========================================
    
    describe('Invalid Inputs', () => {
        test('Should return null for zero input', () => {
            const result = calculateYourCalculator({
                'your-input-1': 0,
                'your-input-2': 1.0
            });

            expect(result).toBeNull();
        });

        test('Should return null for negative input', () => {
            const result = calculateYourCalculator({
                'your-input-1': -10,
                'your-input-2': 1.0
            });

            expect(result).toBeNull();
        });

        test('Should return null for missing inputs', () => {
            const result = calculateYourCalculator({
                'your-input-1': 70
                // missing input-2
            });

            expect(result).toBeNull();
        });
    });

    // ===========================================
    // TC-005: Golden Dataset Verification
    // ===========================================
    
    describe('Golden Dataset', () => {
        // 手動計算的參考值
        const goldenDataset = [
            { i1: 70, i2: 1.0, expected: 70 },
            { i1: 60, i2: 1.5, expected: 90 },
            { i1: 80, i2: 0.8, expected: 64 },
        ];

        goldenDataset.forEach((data, index) => {
            test(`Golden Dataset Case ${index + 1}`, () => {
                const result = calculateYourCalculator({
                    'your-input-1': data.i1,
                    'your-input-2': data.i2
                });

                expect(result).not.toBeNull();
                expect(parseFloat(result![0].value as string)).toBeCloseTo(data.expected, 0);
            });
        });
    });
});
```

### 執行測試

```bash
# 執行單一測試檔案
npx jest src/__tests__/calculators/your-calculator.test.ts

# 執行所有計算器測試
npx jest src/__tests__/calculators/

# 執行並顯示覆蓋率
npx jest --coverage src/__tests__/calculators/your-calculator.test.ts
```

---

## 完整範例

以 **Ethanol Concentration Calculator** 為例：

### calculation.ts

```typescript
import type { SimpleCalculateFn, FormulaResultItem } from '../../types/calculator-formula.js';

export const calculateEthanolConcentration: SimpleCalculateFn = (values) => {
    const volumeMl = Number(values['eth-amount']);
    const abv = Number(values['eth-abv']);
    const weightKg = Number(values['eth-weight']);
    const gender = values['eth-gender'] as string;

    if (!volumeMl || !abv || !weightKg || isNaN(volumeMl) || isNaN(abv) || isNaN(weightKg)) {
        return null;
    }

    if (weightKg <= 0) {
        return null;
    }

    // Vd (Volume of Distribution): Male = 0.68, Female = 0.55
    const volumeDistribution = gender === 'male' ? 0.68 : 0.55;

    // Grams of Alcohol = Volume(mL) × (ABV%/100) × 0.789
    const gramsAlcohol = volumeMl * (abv / 100) * 0.789;

    // Concentration (mg/dL) = (Grams × 1000) / (Weight × Vd × 10)
    const concentrationMgDl = (gramsAlcohol * 1000) / (weightKg * volumeDistribution * 10);

    let severityText = 'Below Legal Limit';
    let alertClass: 'success' | 'warning' | 'danger' = 'success';

    if (concentrationMgDl >= 400) {
        severityText = 'Potentially Fatal Level';
        alertClass = 'danger';
    } else if (concentrationMgDl >= 300) {
        severityText = 'Severe Intoxication';
        alertClass = 'danger';
    } else if (concentrationMgDl >= 80) {
        severityText = 'Above Legal Limit (0.08%)';
        alertClass = 'warning';
    }

    const results: FormulaResultItem[] = [
        {
            label: 'Estimated Concentration',
            value: concentrationMgDl.toFixed(0),
            unit: 'mg/dL',
            interpretation: severityText,
            alertClass: alertClass
        }
    ];

    return results;
};
```

### index.ts

```typescript
import { uiBuilder } from '../../ui-builder.js';
import { createUnifiedFormulaCalculator } from '../shared/unified-formula-calculator.js';
import { calculateEthanolConcentration } from './calculation.js';
import { LOINC_CODES } from '../../fhir-codes.js';
import type { FormulaCalculatorConfig } from '../../types/calculator-formula.js';

export const ethanolConcentrationConfig: FormulaCalculatorConfig = {
    id: 'ethanol-concentration',
    title: 'Estimated Ethanol Serum Concentration',
    description: 'Predicts ethanol concentration based on ingestion.',
    
    infoAlert: '<h4>Clinical Reference</h4>' + uiBuilder.createList({
        items: [
            '<strong>Legal limit:</strong> 80 mg/dL (0.08%)',
            '<strong>Severe intoxication:</strong> >300 mg/dL',
            '<strong>Potentially fatal:</strong> >400 mg/dL'
        ]
    }),
    
    sections: [
        {
            title: 'Ingestion Details',
            fields: [
                {
                    type: 'number',
                    id: 'eth-amount',
                    label: 'Amount Ingested',
                    placeholder: 'e.g., 1.5',
                    unitConfig: { type: 'volume', units: ['fl oz', 'mL'], default: 'fl oz' },
                    validationType: 'volume',
                    standardUnit: 'mL',
                    required: true
                },
                {
                    type: 'number',
                    id: 'eth-abv',
                    label: 'Alcohol by Volume',
                    unit: '%',
                    placeholder: '40',
                    validationType: 'abv',
                    required: true
                }
            ]
        },
        {
            title: 'Patient Information',
            icon: '👤',
            fields: [
                {
                    type: 'number',
                    id: 'eth-weight',
                    label: 'Weight',
                    placeholder: '70',
                    unitConfig: { type: 'weight', units: ['kg', 'lbs'], default: 'kg' },
                    validationType: 'weight',
                    loincCode: LOINC_CODES.WEIGHT,
                    standardUnit: 'kg',
                    required: true
                },
                {
                    type: 'radio',
                    id: 'eth-gender',
                    label: 'Gender',
                    options: [
                        { label: 'Male (Vd = 0.68)', value: 'male', checked: true },
                        { label: 'Female (Vd = 0.55)', value: 'female' }
                    ]
                }
            ]
        }
    ],
    
    formulas: [
        { label: 'Grams of Alcohol', formula: 'Volume (mL) × (ABV% / 100) × 0.789' },
        { label: 'Concentration', formula: '(Grams × 1000) / (Weight × Vd × 10)' }
    ],
    
    autoPopulateGender: 'eth-gender',
    calculate: calculateEthanolConcentration
};

export const ethanolConcentration = createUnifiedFormulaCalculator(ethanolConcentrationConfig);
```

---

## 常見問題

### Q1: TypeScript 錯誤 `alertClass does not exist`

**問題**：`Object literal may only specify known properties, and 'alertClass' does not exist`

**原因**：結果陣列沒有明確指定類型，TypeScript 從第一個元素推斷類型

**解決**：
```typescript
// ❌ 錯誤
const results = [
    { label: 'Result', value: '10', unit: 'mg' }
];

// ✅ 正確
const results: FormulaResultItem[] = [
    { label: 'Result', value: '10', unit: 'mg' }
];
```

### Q2: 驗證不生效

**問題**：輸入極端值但沒有顯示錯誤

**原因**：可能沒有設定 `validationType`

**解決**：確認 input 配置中有加入 `validationType`：
```typescript
{
    type: 'number',
    id: 'your-input',
    label: 'Your Input',
    validationType: 'sodium',  // ← 加入這行
    required: true
}
```

### Q3: FHIR 自動填入不運作

**問題**：欄位沒有自動填入病歷資料

**解決**：確認配置包含 `loincCode` 和 `standardUnit`：
```typescript
{
    type: 'number',
    id: 'your-input',
    label: 'Your Input',
    unitConfig: { type: 'weight', units: ['kg', 'lbs'], default: 'kg' },
    loincCode: LOINC_CODES.WEIGHT,  // ← LOINC 代碼
    standardUnit: 'kg',              // ← 標準單位
    required: true
}
```

### Q3.1: 找不到對應的 LOINC_CODES？

**問題**：需要的 LOINC 代碼不存在於 `LOINC_CODES`

**解決**：到 `src/fhir-codes.ts` 新增 LOINC 代碼：

```typescript
// src/fhir-codes.ts

export const LOINC_CODES = {
    // ... 現有代碼 ...

    // 新增你的 LOINC 代碼
    YOUR_NEW_CODE: '12345-6',  // 從 https://loinc.org 查詢正確的代碼
};
```

**查詢 LOINC 代碼**：
1. 前往 [LOINC 官網](https://loinc.org/search/)
2. 搜尋你需要的檢驗項目
3. 複製正確的 LOINC 代碼（格式：`XXXXX-X`）

### Q4: 結果不消失（驗證失敗時）

**問題**：輸入錯誤值後，舊的結果還是顯示

**原因**：這是舊版本的 bug，已在 `unified-formula-calculator.ts` 中修復

**解決**：確保使用最新版本的 `unified-formula-calculator.ts`

---

## 相關文件

| 文件 | 說明 |
|------|------|
| `docs/validation-system-guide.md` | 驗證系統完整指南 |
| `src/types/calculator-formula.ts` | 類型定義 |
| `src/validator.ts` | 驗證規則定義 |
| `src/calculators/shared/unified-formula-calculator.ts` | 工廠函數實作 |
| `.agent/workflows/Medical Calculator Verification & Validation Protocol (SaMD Framework).md` | SaMD 驗證協議 |

---

## Checklist

轉換計算器時，請確認以下項目：

### 檔案建立
- [ ] 建立 `calculation.ts`，使用 `SimpleCalculateFn` 類型
- [ ] 建立 `index.ts`，配置 `FormulaCalculatorConfig`
- [ ] 建立 SaMD 測試檔案，包含所有測試類別

### 驗證規則
- [ ] 所有數字輸入都有 `validationType`
- [ ] 如果 `validationType` 不存在 → 到 `src/validator.ts` 新增規則

### FHIR 整合
- [ ] 需要 FHIR 填入的欄位有 `loincCode` 和 `standardUnit`
- [ ] 如果 `LOINC_CODES` 不存在 → 到 `src/fhir-codes.ts` 新增代碼

### UI 與測試
- [ ] 使用 `uiBuilder` 建立 `infoAlert`
- [ ] 所有測試通過
- [ ] TypeScript 編譯無錯誤

---

## uiBuilder 常用方法

| 方法 | 用途 | 範例 |
|------|------|------|
| `createAlert()` | 建立警告/提示框 | `uiBuilder.createAlert({ type: 'warning', message: '...' })` |
| `createList()` | 建立項目列表 | `uiBuilder.createList({ items: ['Item 1', 'Item 2'] })` |
| `createTable()` | 建立表格 | `uiBuilder.createTable({ headers: [...], rows: [...] })` |
| `createSection()` | 建立區塊 | `uiBuilder.createSection({ title: '...', content: '...' })` |
| `createFormulaSection()` | 建立公式區塊 | `uiBuilder.createFormulaSection({ items: [...] })` |
| `createReference()` | 建立參考文獻 | `uiBuilder.createReference({ citations: ['...'] })` |

### createReference 範例

```typescript
reference: uiBuilder.createReference({
    citations: [
        'Author A, et al. Title of the paper. <em>Journal Name</em>. Year;Vol(Issue):Pages.',
        'Author B, et al. Another reference. <em>J Abbrev</em>. Year.'
    ]
})
```

---

## 新增規則的檔案位置

| 需要新增 | 檔案位置 | 說明 |
|----------|----------|------|
| 驗證規則 (validationType) | `src/validator.ts` | `ValidationRules` 物件 |
| LOINC 代碼 (loincCode) | `src/fhir-codes.ts` | `LOINC_CODES` 物件 |
| 單位轉換 (unitConfig.type) | `src/unit-converter.ts` | `UnitConverter` 類別 |

