# 計算器輸入驗證系統指南

## 概述

本專案實作了類似 MDCalc 的三區驗證系統，提供即時的輸入值驗證與使用者回饋：

| 區域 | 顏色 | 說明 | 行為 |
|------|------|------|------|
| 🟢 綠區 (Green Zone) | 無邊框 | 正常範圍值 | 正常計算 |
| 🟡 黃區 (Yellow Zone) | 橘黃色邊框 | 極端但可計算的值 | 計算並顯示警告訊息 |
| 🔴 紅區 (Red Zone) | 紅色邊框 | 無效值 | 阻止計算並顯示錯誤訊息 |

---

## 如何為計算器套用驗證規則

### 步驟 1：在輸入欄位加入 `validationType`

在計算器的 `NumberInputConfig` 中，加入 `validationType` 屬性來指定使用哪個驗證規則。

**範例：**

```typescript
// src/calculators/your-calculator/index.ts

{
    type: 'number',
    id: 'your-input-id',
    label: 'Your Input Label',
    placeholder: 'e.g., 140',
    unitToggle: {
        type: 'electrolyte',
        units: ['mEq/L', 'mmol/L'],
        default: 'mEq/L'
    },
    validationType: 'sodium',  // ← 加入這行，指定驗證類型
    loincCode: LOINC_CODES.SODIUM,
    standardUnit: 'mEq/L',
    required: true
}
```

### 步驟 2：選擇適當的 validationType

從下方可用的驗證類型列表中選擇最適合的類型。

---

## 可用的驗證類型 (ValidationRules)

以下是 `src/validator.ts` 中定義的所有驗證規則：

### 基本生命徵象

| validationType | 參數 | 紅區 (min-max) | 黃區 (warnMin-warnMax) | 說明 |
|----------------|------|----------------|------------------------|------|
| `temperature` | 體溫 | 25-45 °C | 35-42 °C | 體溫 |
| `heartRate` | 心率 | 20-300 bpm | 50-120 bpm | 心率 |
| `respiratoryRate` | 呼吸速率 | 4-60 /min | 10-30 /min | 呼吸速率 |
| `systolicBP` | 收縮壓 | 40-300 mmHg | 80-180 mmHg | 收縮壓 |
| `diastolicBP` | 舒張壓 | 20-200 mmHg | 50-110 mmHg | 舒張壓 |
| `meanArterialPressure` | MAP | 30-200 mmHg | 60-120 mmHg | 平均動脈壓 |
| `oxygenSaturation` | SpO2 | 50-100 % | 88-100 % | 血氧飽和度 |

### 人體測量

| validationType | 參數 | 紅區 (min-max) | 黃區 (warnMin-warnMax) | 說明 |
|----------------|------|----------------|------------------------|------|
| `age` | 年齡 | 0-130 years | 1-110 years | 年齡 |
| `weight` | 體重 | 0.5-500 kg | 30-200 kg | 體重 |
| `height` | 身高 | 30-280 cm | 100-220 cm | 身高 |

### 血液氣體分析

| validationType | 參數 | 紅區 (min-max) | 黃區 (warnMin-warnMax) | 說明 |
|----------------|------|----------------|------------------------|------|
| `pH` | 動脈血 pH | 6.5-8.0 | 7.25-7.55 | 動脈血 pH |
| `paCO2` | PaCO2 | 5-150 mmHg | 25-60 mmHg | 二氧化碳分壓 |
| `paO2` | PaO2 | 20-700 mmHg | 60-150 mmHg | 氧分壓 |
| `bicarbonate` | HCO3 | 1-60 mEq/L | 18-32 mEq/L | 碳酸氫根 |
| `baseExcess` | BE | -30-30 mEq/L | -5-5 mEq/L | 鹼基過剩 |
| `lactate` | 乳酸 | 0-30 mmol/L | 0-2 mmol/L | 乳酸 |

### 電解質

| validationType | 參數 | 紅區 (min-max) | 黃區 (warnMin-warnMax) | 說明 |
|----------------|------|----------------|------------------------|------|
| `sodium` | 鈉 | 100-180 mEq/L | 130-150 mEq/L | 血清鈉 |
| `potassium` | 鉀 | 1.5-9.0 mEq/L | 3.3-5.3 mEq/L | 血清鉀 |
| `chloride` | 氯 | 70-130 mEq/L | 95-110 mEq/L | 血清氯 |
| `calcium` | 鈣 | 4-16 mg/dL | 8-11 mg/dL | 總鈣 |
| `magnesium` | 鎂 | 0.5-5 mg/dL | 1.5-2.5 mg/dL | 鎂 |
| `phosphate` | 磷 | 0.5-10 mg/dL | 2.5-5 mg/dL | 磷 |

### 腎功能

| validationType | 參數 | 紅區 (min-max) | 黃區 (warnMin-warnMax) | 說明 |
|----------------|------|----------------|------------------------|------|
| `creatinine` | 肌酐 | 0.1-20 mg/dL | 0.4-10 mg/dL | 血清肌酐 |
| `bun` | BUN | 1-200 mg/dL | 5-50 mg/dL | 血尿素氮 |
| `egfr` | eGFR | 1-200 mL/min/1.73m² | 15-120 mL/min/1.73m² | 估計腎絲球濾過率 |

### 肝功能

| validationType | 參數 | 紅區 (min-max) | 黃區 (warnMin-warnMax) | 說明 |
|----------------|------|----------------|------------------------|------|
| `bilirubin` | 膽紅素 | 0.1-50 mg/dL | 0.2-5 mg/dL | 總膽紅素 |
| `albumin` | 白蛋白 | 0.5-7 g/dL | 2.5-5 g/dL | 血清白蛋白 |
| `liverEnzyme` | AST/ALT | 1-5000 U/L | 5-100 U/L | 肝酵素 |

### 凝血功能

| validationType | 參數 | 紅區 (min-max) | 黃區 (warnMin-warnMax) | 說明 |
|----------------|------|----------------|------------------------|------|
| `inr` | INR | 0.5-15 | 0.9-4 | INR |
| `platelets` | 血小板 | 1-2000 ×10⁹/L | 100-450 ×10⁹/L | 血小板計數 |

### 血液學

| validationType | 參數 | 紅區 (min-max) | 黃區 (warnMin-warnMax) | 說明 |
|----------------|------|----------------|------------------------|------|
| `hemoglobin` | 血紅素 | 2-25 g/dL | 10-17 g/dL | 血紅素 |
| `hematocrit` | 血比容 | 10-75 % | 30-55 % | 血比容 |
| `wbc` | 白血球 | 0.1-100 K/µL | 4-12 K/µL | 白血球計數 |

### 血糖與代謝

| validationType | 參數 | 紅區 (min-max) | 黃區 (warnMin-warnMax) | 說明 |
|----------------|------|----------------|------------------------|------|
| `glucose` | 血糖 | 10-1000 mg/dL | 60-200 mg/dL | 血糖 |
| `hba1c` | HbA1c | 3-20 % | 4-9 % | 糖化血色素 |

### 尿液檢驗

| validationType | 參數 | 紅區 (min-max) | 黃區 (warnMin-warnMax) | 說明 |
|----------------|------|----------------|------------------------|------|
| `urinePotassium` | 尿鉀 | 1-300 mEq/L | 20-100 mEq/L | 尿液鉀 |
| `urineOsmolality` | 尿滲透壓 | 50-1400 mOsm/kg | 300-900 mOsm/kg | 尿液滲透壓 |
| `serumOsmolality` | 血清滲透壓 | 200-400 mOsm/kg | 275-300 mOsm/kg | 血清滲透壓 |

### 呼吸相關

| validationType | 參數 | 紅區 (min-max) | 黃區 (warnMin-warnMax) | 說明 |
|----------------|------|----------------|------------------------|------|
| `fio2` | FiO2 | 21-100 % | 21-100 % | 吸入氧濃度 |
| `tidalVolume` | 潮氣容積 | 50-2000 mL | 300-700 mL | 潮氣容積 |
| `peep` | PEEP | 0-30 cmH2O | 0-15 cmH2O | 呼氣末正壓 |

### 神經評估

| validationType | 參數 | 紅區 (min-max) | 黃區 (warnMin-warnMax) | 說明 |
|----------------|------|----------------|------------------------|------|
| `gcs` | GCS | 3-15 | 9-15 | 格拉斯哥昏迷指數 |

### 藥物濃度

| validationType | 參數 | 紅區 (min-max) | 黃區 (warnMin-warnMax) | 說明 |
|----------------|------|----------------|------------------------|------|
| `phenytoin` | Phenytoin | 0-60 mcg/mL | 5-25 mcg/mL | 苯妥英濃度 |
| `ethanol` | Ethanol | 0-600 mg/dL | 0-100 mg/dL | 乙醇濃度 |

---

## 完整範例：新增計算器並套用驗證

假設要建立一個新的計算器，包含 Age、Creatinine、Weight 三個輸入：

```typescript
// src/calculators/my-new-calculator/index.ts

import { LOINC_CODES } from '../../fhir-codes.js';
import { createUnifiedFormulaCalculator } from '../shared/unified-formula-calculator.js';
import { myCalculation } from './calculation.js';

export const myNewCalculator = createUnifiedFormulaCalculator({
    id: 'my-new-calculator',
    title: 'My New Calculator',
    description: 'Description of the calculator.',
    sections: [
        {
            title: 'Patient Data',
            icon: '👤',
            fields: [
                {
                    type: 'number',
                    id: 'patient-age',
                    label: 'Age',
                    unit: 'years',
                    placeholder: 'e.g., 65',
                    validationType: 'age',        // ← 使用 'age' 驗證規則
                    required: true
                },
                {
                    type: 'number',
                    id: 'patient-weight',
                    label: 'Weight',
                    placeholder: 'e.g., 70',
                    unitToggle: {
                        type: 'weight',
                        units: ['kg', 'lbs'],
                        default: 'kg'
                    },
                    validationType: 'weight',     // ← 使用 'weight' 驗證規則
                    loincCode: LOINC_CODES.WEIGHT,
                    standardUnit: 'kg',
                    required: true
                }
            ]
        },
        {
            title: 'Lab Values',
            icon: '🧪',
            fields: [
                {
                    type: 'number',
                    id: 'serum-creatinine',
                    label: 'Creatinine',
                    placeholder: 'e.g., 1.2',
                    unitToggle: {
                        type: 'creatinine',
                        units: ['mg/dL', 'µmol/L'],
                        default: 'mg/dL'
                    },
                    validationType: 'creatinine', // ← 使用 'creatinine' 驗證規則
                    loincCode: LOINC_CODES.CREATININE,
                    standardUnit: 'mg/dL',
                    required: true
                }
            ]
        }
    ],
    formulas: [
        {
            label: 'Formula',
            formula: 'Your formula here'
        }
    ],
    calculate: myCalculation
});
```

---

## 新增自訂驗證規則

如果現有的驗證類型不符合需求，可以在 `src/validator.ts` 中新增：

```typescript
// src/validator.ts

export const ValidationRules: Record<string, ValidationRule> = {
    // ... 現有規則 ...

    // 新增自訂規則
    myCustomType: {
        required: true,
        min: 0,           // 紅區最小值 (低於此值顯示錯誤)
        max: 100,         // 紅區最大值 (高於此值顯示錯誤)
        warnMin: 20,      // 黃區最小值 (低於此值但高於 min，顯示警告)
        warnMax: 80,      // 黃區最大值 (高於此值但低於 max，顯示警告)
        message: 'Value must be between 0-100',           // 紅區錯誤訊息
        warningMessage: 'Value is extreme; please verify' // 黃區警告訊息
    }
};
```

---

## 驗證邏輯流程

```
輸入值
   │
   ▼
┌─────────────────────────────────────┐
│ 檢查是否為空或非數字                 │
│ (如果 required: true)               │
└─────────────────────────────────────┘
   │
   ▼
┌─────────────────────────────────────┐
│ 檢查 min / max (紅區)               │
│ value < min OR value > max ?        │
│ → 是：顯示紅色錯誤，阻止計算         │
└─────────────────────────────────────┘
   │ 否
   ▼
┌─────────────────────────────────────┐
│ 檢查 warnMin / warnMax (黃區)       │
│ value < warnMin OR value > warnMax ?│
│ → 是：顯示黃色警告，繼續計算         │
└─────────────────────────────────────┘
   │ 否
   ▼
┌─────────────────────────────────────┐
│ 綠區：無提示，正常計算               │
└─────────────────────────────────────┘
```

---

## UI 樣式參考

驗證訊息的樣式定義在 `css/components/_inputs.css`：

```css
/* 驗證訊息容器 */
.validation-message {
    margin-top: 4px;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 0.9rem;
}

/* 紅區錯誤樣式 */
.validation-message.error {
    background: #ffebee;
    border: 1px solid #ef5350;
    color: #c62828;
}

/* 黃區警告樣式 */
.validation-message.warning {
    background: #fff8e1;
    border: 1px solid #ffb74d;
    color: #e65100;
}

/* 輸入框邊框顏色 */
input.validation-error {
    border-color: #ef5350 !important;
}

input.validation-warning {
    border-color: #ffb74d !important;
}
```

---

## 已套用驗證規則的計算器

以下計算器已套用此驗證系統：

| 計算器 | 檔案路徑 |
|--------|----------|
| APACHE-II | `src/calculators/apache-ii/index.ts` |
| ASCVD Risk | `src/calculators/ascvd/index.ts` |
| BMI/BSA | `src/calculators/bmi-bsa/index.ts` |
| Calcium Correction | `src/calculators/calcium-correction/index.ts` |
| Child-Pugh | `src/calculators/child-pugh/index.ts` |
| CKD-EPI GFR | `src/calculators/ckd-epi/index.ts` |
| CrCl | `src/calculators/crcl/index.ts` |
| ETT Depth | `src/calculators/ett/index.ts` |
| FIB-4 | `src/calculators/fib-4/index.ts` |
| IBW/ABW | `src/calculators/ibw/index.ts` |
| LDL Calculated | `src/calculators/ldl/index.ts` |
| Maintenance Fluids | `src/calculators/maintenance-fluids/index.ts` |
| MAP | `src/calculators/map/index.ts` |
| MDRD GFR | `src/calculators/mdrd-gfr/index.ts` |
| MELD-Na | `src/calculators/meld-na/index.ts` |
| Phenytoin Correction | `src/calculators/phenytoin-correction/index.ts` |
| PRECISE-HBR | `src/calculators/precise-hbr/index.ts` |
| PREVENT-CVD (QRISK3) | `src/calculators/prevent-cvd/index.ts` |
| qSOFA | `src/calculators/qsofa/index.ts` |
| QTc | `src/calculators/qtc/index.ts` |
| Serum Anion Gap | `src/calculators/serum-anion-gap/index.ts` |
| Serum Osmolality | `src/calculators/serum-osmolality/index.ts` |
| SIRS | `src/calculators/sirs/index.ts` |
| Sodium Correction | `src/calculators/sodium-correction/index.ts` |
| tPA Dosing | `src/calculators/tpa-dosing/index.ts` |
| tPA Dosing (Stroke) | `src/calculators/tpa-dosing-stroke/index.ts` |
| TTKG | `src/calculators/ttkg/index.ts` |

---

## 注意事項

1. **validationType 優先於 unitToggle.type**：如果同時指定了 `validationType` 和 `unitToggle.type`，系統會優先使用 `validationType` 來查找驗證規則。

2. **數值單位**：驗證規則中的 min/max/warnMin/warnMax 是基於標準單位（standardUnit）的值。如果使用 unitToggle，系統會先將輸入值轉換為標準單位後再進行驗證。

3. **required 欄位**：如果 `required: true`，空值會被視為紅區錯誤。

4. **自訂 min/max**：如果在輸入欄位中直接指定了 `min` 或 `max`，這些值會覆蓋 ValidationRules 中的預設值。

---

## 相關檔案

- `src/validator.ts` - 驗證規則定義
- `src/calculators/shared/unified-formula-calculator.ts` - 統一計算器工廠函數
- `src/types/calculator-formula.ts` - NumberInputConfig 類型定義
- `css/components/_inputs.css` - 驗證樣式

