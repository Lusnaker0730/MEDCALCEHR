# 快速开始：为计算器添加单位转换

## 三步添加单位转换功能

### 步骤 1: 修改导入语句

```javascript
// 之前
import { getMostRecentObservation } from '../../utils.js';

// 之后
import { 
    getMostRecentObservation,
    createUnitSelector,           // 创建单位选择器
    initializeUnitConversion,     // 初始化转换
    getValueInStandardUnit        // 获取标准单位值
} from '../../utils.js';
```

### 步骤 2: 更新 HTML 生成

```javascript
generateHTML: function() {
    return `
        <h3>${this.title}</h3>
        
        <!-- 之前: 固定单位 -->
        <div class="input-group">
            <label for="glucose">Glucose (mg/dL):</label>
            <input type="number" id="glucose" placeholder="Enter value">
        </div>
        
        <!-- 之后: 可选单位 -->
        <div class="input-group">
            <label for="glucose">Glucose:</label>
            ${createUnitSelector('glucose', 'glucose', ['mg/dL', 'mmol/L'])}
        </div>
    `;
}
```

### 步骤 3: 更新计算逻辑

```javascript
initialize: function(client, patient, container) {
    // 定义计算函数
    const calculateAndUpdate = () => {
        // 之前: 直接读取值
        // const glucose = parseFloat(container.querySelector('#glucose').value);
        
        // 之后: 获取标准单位的值
        const glucoseMgDl = getValueInStandardUnit(container, 'glucose', 'mg/dL');
        
        if (glucoseMgDl > 0) {
            // 使用标准单位进行计算
            const result = someCalculation(glucoseMgDl);
            // 显示结果...
        }
    };
    
    // 初始化自动转换和计算
    initializeUnitConversion(container, 'glucose', calculateAndUpdate);
    
    // 之前的事件监听器可以删除
    // container.querySelector('#glucose').addEventListener('input', calculateAndUpdate);
    
    // 初始计算
    calculateAndUpdate();
}
```

## 常用单位类型速查表

| 测量类型 | measurementType | 可用单位 |
|---------|----------------|---------|
| 葡萄糖 | `'glucose'` | `['mg/dL', 'mmol/L']` |
| 胆固醇 | `'cholesterol'` | `['mg/dL', 'mmol/L']` |
| 甘油三酯 | `'triglycerides'` | `['mg/dL', 'mmol/L']` |
| 肌酐 | `'creatinine'` | `['mg/dL', 'µmol/L']` |
| 钙 | `'calcium'` | `['mg/dL', 'mmol/L']` |
| 白蛋白 | `'albumin'` | `['g/dL', 'g/L']` |
| 胆红素 | `'bilirubin'` | `['mg/dL', 'µmol/L']` |
| 血红蛋白 | `'hemoglobin'` | `['g/dL', 'g/L', 'mmol/L']` |
| BUN | `'bun'` | `['mg/dL', 'mmol/L']` |
| 体重 | `'weight'` | `['kg', 'lbs']` |
| 身高 | `'height'` | `['cm', 'in']` |
| 体温 | `'temperature'` | `['°C', '°F']` |
| 血小板 | `'platelet'` | `['×10⁹/L', 'K/µL']` |
| D-dimer | `'ddimer'` | `['mg/L', 'µg/mL', 'ng/mL']` |
| 纤维蛋白原 | `'fibrinogen'` | `['g/L', 'mg/dL']` |

## 实际效果

用户输入 `100` 并选择 `mg/dL`：
- 输入框下方自动显示: `≈ 5.55 mmol/L`
- 计算使用标准单位 `100 mg/dL`

用户切换到 `mmol/L` 并输入 `5.5`：
- 输入框下方自动显示: `≈ 99.10 mg/dL`
- 计算自动转换并使用 `99.1 mg/dL`

## 已实现的示例

查看以下文件作为参考：

### 基础示例
1. **简单示例**: `js/calculators/calcium-correction/index.js`
   - 两个输入框，不同单位类型（钙、白蛋白）
   - 清晰的转换和计算逻辑

2. **完整示例**: `js/calculators/bmi-bsa/index.js`
   - 体重和身高的单位转换
   - BMI分类和结果美化

### 肾功能计算器
3. **CKD-EPI GFR**: `js/calculators/ckd-epi/index.js`
   - 肌酐单位转换 (mg/dL ↔ µmol/L)
   - CKD分期显示
   - FHIR数据集成

4. **MDRD GFR**: `js/calculators/mdrd-gfr/index.js`
   - 肌酐单位转换
   - CKD分期自动判断

5. **Cockcroft-Gault CrCl**: `js/calculators/crcl/index.js`
   - 肌酐和体重双单位转换
   - 肾功能分级

### 电解质/代谢计算器
6. **Sodium Correction**: `js/calculators/sodium-correction/index.js`
   - 葡萄糖单位转换
   - 自动计算校正钠

7. **Serum Osmolality**: `js/calculators/serum-osmolality/index.js`
   - 葡萄糖和BUN双单位转换
   - 渗透压间隙计算

### 凝血功能
8. **ISTH DIC**: `js/calculators/isth-dic/index.js`
   - 血小板、D-dimer、纤维蛋白原多单位转换
   - 自动选择评分选项
   - 复杂表单示例

## 已完成的计算器 ✅

以下计算器已成功添加单位转换功能：

### 第一批（基础）
1. ✅ **Calcium Correction** - mg/dL ↔ mmol/L (钙), g/dL ↔ g/L (白蛋白)
2. ✅ **CKD-EPI GFR** - mg/dL ↔ µmol/L (肌酐)
3. ✅ **BMI & BSA** - kg ↔ lbs (体重), cm ↔ in (身高)

### 第二批（常用临床计算器）
4. ✅ **MDRD GFR** - mg/dL ↔ µmol/L (肌酐) + CKD分期
5. ✅ **Cockcroft-Gault CrCl** - mg/dL ↔ µmol/L (肌酐), kg ↔ lbs (体重)
6. ✅ **Sodium Correction** - mg/dL ↔ mmol/L (葡萄糖)
7. ✅ **Serum Osmolality** - mg/dL ↔ mmol/L (葡萄糖和BUN)
8. ✅ **ISTH DIC** - 多单位（血小板、D-dimer、纤维蛋白原）

## 可继续更新的计算器建议

### 高优先级（常用且需要转换）
- 🔄 **Corrected Phenytoin** - 白蛋白单位转换
- 🔄 **FENa** - 电解质单位
- 🔄 **FIB-4** - 血小板和转氨酶
- 🔄 **Free Water Deficit** - 体重和钠单位（已有部分）

### 中优先级（有益但不紧急）
- 🔄 **ASCVD Risk** - 胆固醇单位
- 🔄 **PREVENT CVD** - 胆固醇单位
- 🔄 **HOMA-IR** - 葡萄糖单位
- 🔄 **ABG Analyzer** - 各种血气单位

## 测试清单

添加单位转换后，请测试：

- [ ] 默认单位正确显示
- [ ] 切换单位后计算结果正确
- [ ] 自动转换提示正确显示
- [ ] FHIR数据导入后单位正确
- [ ] 边界值测试（0, 负数, 很大的数）
- [ ] 切换单位多次不会出错

## 注意事项

1. **标准单位**: 所有计算必须使用标准单位（通常是美国惯用单位）
2. **回调函数**: `initializeUnitConversion` 的第三个参数是可选的回调函数
3. **容器参数**: 使用 `container` 而不是 `document` 以支持多个计算器实例
4. **精度**: 转换显示默认保留2位小数，可以根据需要调整

## 需要帮助？

- 查看 `UNIT_CONVERSION_GUIDE.md` 获取详细文档
- 参考已完成的计算器代码
- 检查 `js/utils.js` 中的 `UNIT_CONVERSIONS` 对象

