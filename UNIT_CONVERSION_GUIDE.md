# 单位转换系统使用指南
# Unit Conversion System Guide

## 概述 / Overview

本系统提供了一个通用的单位转换框架，可以轻松为医疗计算器添加自动单位转换功能。支持常见的实验室值、生命体征和测量单位。

This system provides a universal unit conversion framework that makes it easy to add automatic unit conversion to medical calculators. It supports common lab values, vital signs, and measurement units.

## 支持的单位类型 / Supported Unit Types

### 实验室检验 / Laboratory Values
- **胆固醇 Cholesterol**: mg/dL ↔ mmol/L
- **甘油三酯 Triglycerides**: mg/dL ↔ mmol/L  
- **葡萄糖 Glucose**: mg/dL ↔ mmol/L
- **肌酐 Creatinine**: mg/dL ↔ µmol/L
- **钙 Calcium**: mg/dL ↔ mmol/L
- **白蛋白 Albumin**: g/dL ↔ g/L
- **胆红素 Bilirubin**: mg/dL ↔ µmol/L
- **血红蛋白 Hemoglobin**: g/dL ↔ g/L ↔ mmol/L
- **BUN**: mg/dL ↔ mmol/L
- **血小板 Platelet**: ×10⁹/L ↔ ×10³/µL
- **白细胞 WBC**: ×10⁹/L ↔ ×10³/µL
- **D-dimer**: mg/L ↔ µg/mL ↔ ng/mL
- **纤维蛋白原 Fibrinogen**: g/L ↔ mg/dL

### 基本测量 / Basic Measurements
- **体重 Weight**: kg ↔ lbs
- **身高 Height**: cm ↔ in ↔ m ↔ ft
- **体温 Temperature**: °C ↔ °F
- **电解质 Electrolytes**: mEq/L ↔ mmol/L

## 如何使用 / How to Use

### 1. 导入必要的函数 / Import Required Functions

```javascript
import { 
    createUnitSelector,           // 创建单位选择器HTML
    initializeUnitConversion,     // 初始化自动转换
    getValueInStandardUnit        // 获取标准单位值
} from '../../utils.js';
```

### 2. 在 generateHTML 中使用 createUnitSelector / Use createUnitSelector in generateHTML

**之前 / Before:**
```javascript
<div class="input-group">
    <label for="glucose">Glucose (mg/dL):</label>
    <input type="number" id="glucose" placeholder="Enter value">
</div>
```

**之后 / After:**
```javascript
<div class="input-group">
    <label for="glucose">Glucose:</label>
    ${createUnitSelector('glucose', 'glucose', ['mg/dL', 'mmol/L'], 'mg/dL')}
</div>
```

**参数说明 / Parameters:**
- `inputId`: 输入框的ID / Input field ID
- `measurementType`: 测量类型（用于查找转换因子）/ Measurement type (for conversion lookup)
- `units`: 可用单位数组 / Array of available units
- `defaultUnit`: 默认单位 / Default unit

### 3. 在 initialize 中初始化转换 / Initialize Conversion in initialize

```javascript
initialize: function(client, patient, container) {
    // 定义计算函数 / Define calculation function
    const calculateAndUpdate = () => {
        // 获取标准单位的值 / Get value in standard unit
        const glucoseMgDl = getValueInStandardUnit(container, 'glucose', 'mg/dL');
        
        if (glucoseMgDl > 0) {
            // 使用标准单位进行计算 / Perform calculations with standard unit
            const result = someCalculation(glucoseMgDl);
            // 显示结果 / Display results
        }
    };
    
    // 初始化单位转换 / Initialize unit conversion
    initializeUnitConversion(container, 'glucose', calculateAndUpdate);
    
    // 初始计算 / Initial calculation
    calculateAndUpdate();
}
```

## 完整示例 / Complete Examples

### 示例 1: 钙校正计算器 / Example 1: Calcium Correction Calculator

```javascript
import { getMostRecentObservation, createUnitSelector, initializeUnitConversion, getValueInStandardUnit } from '../../utils.js';

export const calciumCorrection = {
    id: 'calcium-correction',
    title: 'Calcium Correction for Albumin',
    
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <div class="input-group">
                <label for="ca-total">Total Calcium:</label>
                ${createUnitSelector('ca-total', 'calcium', ['mg/dL', 'mmol/L'], 'mg/dL')}
            </div>
            <div class="input-group">
                <label for="ca-albumin">Albumin:</label>
                ${createUnitSelector('ca-albumin', 'albumin', ['g/dL', 'g/L'], 'g/dL')}
            </div>
            <div id="ca-result" class="result"></div>
        `;
    },
    
    initialize: function(client, patient, container) {
        const calculateAndUpdate = () => {
            // 总是获取标准单位的值进行计算
            const totalCalciumMgDl = getValueInStandardUnit(container, 'ca-total', 'mg/dL');
            const albuminGdl = getValueInStandardUnit(container, 'ca-albumin', 'g/dL');
            
            if (totalCalciumMgDl > 0 && albuminGdl > 0) {
                const correctedCalcium = totalCalciumMgDl + 0.8 * (4.0 - albuminGdl);
                // 显示结果...
            }
        };
        
        // 初始化两个输入框的单位转换
        initializeUnitConversion(container, 'ca-total', calculateAndUpdate);
        initializeUnitConversion(container, 'ca-albumin', calculateAndUpdate);
        
        // 从FHIR获取数据...
        calculateAndUpdate();
    }
};
```

### 示例 2: BMI 计算器 / Example 2: BMI Calculator

```javascript
import { getMostRecentObservation, createUnitSelector, initializeUnitConversion, getValueInStandardUnit } from '../../utils.js';

export const bmiBsa = {
    id: 'bmi-bsa',
    title: 'BMI Calculator',
    
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <div class="input-group">
                <label for="weight">Weight:</label>
                ${createUnitSelector('weight', 'weight', ['kg', 'lbs'], 'kg')}
            </div>
            <div class="input-group">
                <label for="height">Height:</label>
                ${createUnitSelector('height', 'height', ['cm', 'in'], 'cm')}
            </div>
            <div id="bmi-result" class="result"></div>
        `;
    },
    
    initialize: function(client, patient, container) {
        const calculateAndUpdate = () => {
            // 获取标准单位的值
            const weightKg = getValueInStandardUnit(container, 'weight', 'kg');
            const heightCm = getValueInStandardUnit(container, 'height', 'cm');
            
            if (weightKg > 0 && heightCm > 0) {
                const heightM = heightCm / 100;
                const bmi = weightKg / (heightM * heightM);
                // 显示结果...
            }
        };
        
        initializeUnitConversion(container, 'weight', calculateAndUpdate);
        initializeUnitConversion(container, 'height', calculateAndUpdate);
        
        calculateAndUpdate();
    }
};
```

## 功能特性 / Features

### ✅ 自动转换显示
当用户输入值时，系统会自动显示其他单位的等效值。

例如：输入 100 mg/dL 葡萄糖 → 自动显示 "≈ 5.55 mmol/L"

### ✅ 实时计算
切换单位时，计算结果会自动更新，无需手动重新计算。

### ✅ 标准化计算
所有计算都使用标准单位，避免单位混淆导致的错误。

### ✅ 用户友好
用户可以使用自己熟悉的单位系统（如美制或公制）。

## 添加新的单位转换 / Adding New Unit Conversions

如需添加新的单位类型，在 `utils.js` 的 `UNIT_CONVERSIONS` 对象中添加：

```javascript
export const UNIT_CONVERSIONS = {
    // 现有转换...
    
    // 添加新的转换类型
    newMeasurement: {
        'unit1': { 'unit2': conversionFactor },
        'unit2': { 'unit1': 1/conversionFactor }
    }
};
```

### 函数式转换（用于非线性转换）/ Function-based Conversions

对于非线性转换（如温度），使用函数：

```javascript
temperature: {
    'C': { 'F': (v) => v * 9/5 + 32 },
    'F': { 'C': (v) => (v - 32) * 5/9 }
}
```

## 已更新的计算器 / Updated Calculators

以下计算器已经实现了单位转换功能：

1. ✅ **Calcium Correction** - mg/dL ↔ mmol/L (钙), g/dL ↔ g/L (白蛋白)
2. ✅ **CKD-EPI GFR** - mg/dL ↔ µmol/L (肌酐)
3. ✅ **BMI & BSA** - kg ↔ lbs (体重), cm ↔ in (身高)
4. ✅ **LDL Calculator** - mg/dL ↔ mmol/L (已有实现)
5. ✅ **Free Water Deficit** - kg ↔ lbs (已有实现)

## 待更新的计算器建议 / Suggested Calculators to Update

可以为以下计算器添加单位转换：

- **MDRD GFR** - 肌酐单位转换
- **Cockcroft-Gault CrCl** - 肌酐和体重单位转换
- **Corrected Phenytoin** - 白蛋白单位转换
- **Corrected Sodium** - 葡萄糖单位转换
- **FENa** - 各种电解质单位转换
- **Serum Osmolality** - 葡萄糖和BUN单位转换
- **ISTH DIC** - 血小板、D-dimer、纤维蛋白原单位转换

## 最佳实践 / Best Practices

1. **总是使用标准单位进行计算** - 使用 `getValueInStandardUnit()` 确保计算一致性
2. **选择合适的默认单位** - 根据目标用户群体（美国 vs 其他国家）选择
3. **提供单位转换提示** - 让用户知道可以选择不同单位
4. **测试所有单位组合** - 确保转换在所有情况下都正确工作
5. **保持向后兼容** - 现有的硬编码单位应继续工作

## 技术支持 / Technical Support

如有问题，请参考：
- `js/utils.js` - 核心转换函数
- `js/calculators/calcium-correction/index.js` - 简单示例
- `js/calculators/bmi-bsa/index.js` - 多输入示例
- `js/calculators/ckd-epi/index.js` - FHIR集成示例

---

**注意**: 这个系统设计为渐进式增强 - 即使不更新现有计算器，新的单位转换功能也不会影响它们的运行。

