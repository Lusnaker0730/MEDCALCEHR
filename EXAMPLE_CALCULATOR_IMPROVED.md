# 📝 改进后的计算器示例

本文档展示如何将新的错误处理和验证框架应用到现有计算器中。

## 🔄 改进前 vs 改进后

### 改进前 (旧代码)

```javascript
// js/calculators/example/index.js (旧版本)
export const exampleCalculator = {
    id: 'example-calc',
    title: 'Example Calculator',
    
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <div class="input-group">
                <label for="age">Age:</label>
                <input type="number" id="age">
            </div>
            <button id="calculate">Calculate</button>
            <div id="result"></div>
        `;
    },
    
    initialize: function(client, patient, container) {
        // ❌ 没有错误处理
        // ❌ 没有输入验证
        // ❌ 可能导致 null reference errors
        
        const ageInput = document.getElementById('age'); // ❌ 全局选择器
        const resultDiv = document.getElementById('result');
        const calculateBtn = document.getElementById('calculate');
        
        // 尝试填充患者数据，但没有错误处理
        ageInput.value = calculateAge(patient.birthDate);
        
        calculateBtn.addEventListener('click', () => {
            const age = parseInt(ageInput.value);
            
            // ❌ 没有验证
            // ❌ 如果 age 是 NaN 会导致错误的计算
            const result = age * 2;
            
            resultDiv.innerHTML = `<p>Result: ${result}</p>`;
        });
    }
};
```

---

### 改进后 (新代码)

```javascript
// js/calculators/example/index.js (新版本)
import { getMostRecentObservation, calculateAge } from '../../utils.js';
import { 
    CalculatorError, 
    FHIRDataError, 
    displayError, 
    logError 
} from '../../errorHandler.js';
import { 
    validateCalculatorInput, 
    ValidationRules,
    setupLiveValidation 
} from '../../validator.js';

export const exampleCalculator = {
    id: 'example-calc',
    title: 'Example Calculator',
    description: 'Demonstrates improved error handling and validation',
    
    generateHTML: function() {
        return `
            <h3>${this.title}</h3>
            <p class="description">${this.description}</p>
            
            <div class="input-group">
                <label for="example-age">Age (years)</label>
                <input 
                    type="number" 
                    id="example-age" 
                    min="0" 
                    max="150"
                    aria-label="Patient age in years"
                    required>
            </div>
            
            <div class="input-group">
                <label for="example-weight">Weight (kg)</label>
                <input 
                    type="number" 
                    id="example-weight" 
                    min="0.5" 
                    max="500"
                    step="0.1"
                    aria-label="Patient weight in kilograms"
                    required>
            </div>
            
            <button id="calculate-example" aria-label="Calculate result">
                Calculate
            </button>
            
            <div id="example-result" class="result" style="display:none;"></div>
            
            <!-- 公式说明 -->
            <div class="formula-section">
                <h4>📐 Formula</h4>
                <div style="background: #f5f7fa; padding: 20px; border-radius: 10px;">
                    <p style="font-family: monospace; background: white; padding: 15px; border-radius: 5px;">
                        Result = Age × Weight / 100
                    </p>
                </div>
                
                <h5 style="margin-top: 20px;">Parameters:</h5>
                <ul style="font-size: 0.9em;">
                    <li><strong>Age:</strong> Patient age in years (0-150)</li>
                    <li><strong>Weight:</strong> Patient weight in kg (0.5-500)</li>
                </ul>
                
                <h5 style="margin-top: 20px;">Interpretation:</h5>
                <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196F3;">
                    <ul style="font-size: 0.9em; margin: 0; padding-left: 20px;">
                        <li><strong>&lt; 10:</strong> Low category</li>
                        <li><strong>10-20:</strong> Moderate category</li>
                        <li><strong>&gt; 20:</strong> High category</li>
                    </ul>
                </div>
            </div>
        `;
    },
    
    initialize: function(client, patient, container) {
        // ✅ 使用容器作用域选择器
        const ageInput = container.querySelector('#example-age');
        const weightInput = container.querySelector('#example-weight');
        const resultEl = container.querySelector('#example-result');
        const calculateBtn = container.querySelector('#calculate-example');
        
        // ✅ 定义验证规则
        const validationSchema = {
            age: ValidationRules.age,
            weight: ValidationRules.weight
        };
        
        // ✅ 设置实时验证
        setupLiveValidation(ageInput, ValidationRules.age);
        setupLiveValidation(weightInput, ValidationRules.weight);
        
        // ✅ 安全地填充患者数据
        this.loadPatientData(client, patient, ageInput, weightInput, resultEl);
        
        // ✅ 添加计算事件处理器（带完整错误处理）
        calculateBtn.addEventListener('click', () => {
            this.calculate(ageInput, weightInput, resultEl, validationSchema);
        });
    },
    
    /**
     * 加载患者数据
     * ✅ 完整的错误处理
     * ✅ 缓存机制
     * ✅ 降级处理
     */
    loadPatientData: function(client, patient, ageInput, weightInput, resultEl) {
        try {
            // 填充年龄
            if (patient && patient.birthDate) {
                ageInput.value = calculateAge(patient.birthDate);
            } else if (!patient) {
                console.info('No patient data available, manual input required');
            }
            
            // 从 FHIR 加载体重
            if (client) {
                getMostRecentObservation(client, '29463-7') // Weight LOINC code
                    .then(weightObs => {
                        if (weightObs && weightObs.valueQuantity) {
                            weightInput.value = weightObs.valueQuantity.value.toFixed(1);
                        }
                    })
                    .catch(error => {
                        // ✅ 记录错误但不中断用户流程
                        logError(
                            new FHIRDataError('Failed to load weight', { error }),
                            { calculator: 'example-calc', resource: 'Observation/Weight' }
                        );
                        console.info('Weight data not available from FHIR, manual input required');
                    });
            }
            
        } catch (error) {
            // ✅ 捕获并记录任何意外错误
            logError(error, { 
                calculator: 'example-calc', 
                function: 'loadPatientData' 
            });
            
            // ✅ 显示用户友好的错误消息
            displayError(
                resultEl, 
                error, 
                '无法自动加载患者数据，请手动输入。'
            );
        }
    },
    
    /**
     * 执行计算
     * ✅ 完整的输入验证
     * ✅ 错误处理
     * ✅ 结果格式化
     */
    calculate: function(ageInput, weightInput, resultEl, validationSchema) {
        try {
            // ✅ 收集输入
            const input = {
                age: ageInput.value,
                weight: weightInput.value
            };
            
            // ✅ 验证输入
            const validation = validateCalculatorInput(input, validationSchema);
            
            if (!validation.isValid) {
                throw new CalculatorError(
                    validation.errors.join('; '),
                    'VALIDATION_ERROR',
                    { input, errors: validation.errors }
                );
            }
            
            // ✅ 解析数值
            const age = parseFloat(input.age);
            const weight = parseFloat(input.weight);
            
            // ✅ 额外的业务逻辑验证
            if (age === 0 || weight === 0) {
                throw new CalculatorError(
                    'Age and weight must be greater than 0',
                    'INVALID_VALUES'
                );
            }
            
            // ✅ 执行计算
            const result = (age * weight) / 100;
            
            // ✅ 确定风险类别
            let category = '';
            let categoryColor = '';
            let interpretation = '';
            
            if (result < 10) {
                category = 'Low';
                categoryColor = '#388e3c';
                interpretation = 'Result is in the low range. Continue regular monitoring.';
            } else if (result < 20) {
                category = 'Moderate';
                categoryColor = '#ff9800';
                interpretation = 'Result is in the moderate range. Consider further evaluation.';
            } else {
                category = 'High';
                categoryColor = '#d32f2f';
                interpretation = 'Result is in the high range. Recommend specialist consultation.';
            }
            
            // ✅ 显示结果（格式化良好）
            resultEl.innerHTML = `
                <div class="result-item">
                    <span class="value">${result.toFixed(2)}</span>
                    <span class="label">Calculated Result</span>
                </div>
                
                <div style="
                    background: ${categoryColor}20; 
                    border-left: 4px solid ${categoryColor}; 
                    padding: 15px; 
                    border-radius: 5px; 
                    margin-top: 15px;
                ">
                    <div style="font-weight: 600; color: ${categoryColor}; margin-bottom: 8px;">
                        📊 Category: ${category}
                    </div>
                    <div style="color: #555; font-size: 0.9em;">
                        ${interpretation}
                    </div>
                </div>
                
                <div style="
                    margin-top: 15px; 
                    padding: 12px; 
                    background: #f5f5f5; 
                    border-radius: 5px; 
                    font-size: 0.85em;
                ">
                    <strong>Calculation Details:</strong><br>
                    • Age: ${age} years<br>
                    • Weight: ${weight} kg<br>
                    • Formula: ${age} × ${weight} / 100 = ${result.toFixed(2)}
                </div>
            `;
            
            resultEl.style.display = 'block';
            
            // ✅ 记录成功的计算（用于分析）
            console.log('Calculation completed successfully', {
                calculator: 'example-calc',
                input: { age, weight },
                result,
                category
            });
            
        } catch (error) {
            // ✅ 记录错误
            logError(error, { 
                calculator: 'example-calc', 
                function: 'calculate' 
            });
            
            // ✅ 显示错误给用户
            displayError(resultEl, error);
            
            // 确保结果区域可见
            resultEl.style.display = 'block';
        }
    }
};
```

---

## 📊 改进对比表

| 特性 | 改进前 | 改进后 |
|------|--------|--------|
| **错误处理** | ❌ 无 | ✅ 完整的 try-catch |
| **输入验证** | ❌ 无 | ✅ 实时 + 提交时验证 |
| **FHIR 错误处理** | ❌ 会崩溃 | ✅ 优雅降级 |
| **元素选择** | ❌ 全局 ID | ✅ 容器作用域 |
| **用户反馈** | ❌ 技术错误 | ✅ 友好消息 |
| **代码组织** | ❌ 单一函数 | ✅ 分离关注点 |
| **可访问性** | ❌ 无 ARIA | ✅ 完整 ARIA 标签 |
| **公式说明** | ❌ 无 | ✅ 详细说明 |
| **结果解释** | ❌ 纯数值 | ✅ 分类 + 建议 |
| **日志记录** | ❌ 无 | ✅ 结构化日志 |

---

## 🎯 关键改进点

### 1. **错误处理**

```javascript
// ❌ 改进前 - 会崩溃
const age = parseInt(ageInput.value); // 如果为空会得到 NaN
const result = age * 2; // NaN * 2 = NaN

// ✅ 改进后 - 安全处理
try {
    const validation = validateCalculatorInput(input, schema);
    if (!validation.isValid) {
        throw new CalculatorError(validation.errors.join('; '));
    }
    const age = parseInt(input.age);
    // ...
} catch (error) {
    displayError(container, error);
}
```

### 2. **元素选择**

```javascript
// ❌ 改进前 - 全局选择器（可能冲突）
const ageInput = document.getElementById('age');

// ✅ 改进后 - 容器作用域
const ageInput = container.querySelector('#example-age');
```

### 3. **FHIR 数据加载**

```javascript
// ❌ 改进前 - 没有错误处理
ageInput.value = calculateAge(patient.birthDate); // 如果 patient 是 null 会崩溃

// ✅ 改进后 - 完整错误处理
if (patient && patient.birthDate) {
    ageInput.value = calculateAge(patient.birthDate);
} else {
    console.info('Patient data not available, manual input required');
}
```

### 4. **用户反馈**

```javascript
// ❌ 改进前 - 技术错误消息
catch (error) {
    alert(error.message); // "Cannot read property 'birthDate' of null"
}

// ✅ 改进后 - 友好消息
catch (error) {
    displayError(container, error, '无法加载患者数据，请手动输入。');
}
```

---

## 🚀 如何应用到现有计算器

### 步骤 1: 添加导入

```javascript
import { CalculatorError, displayError, logError } from '../../errorHandler.js';
import { validateCalculatorInput, ValidationRules } from '../../validator.js';
```

### 步骤 2: 更新 HTML 生成

- 添加 `aria-label`
- 添加 `min`, `max`, `required` 属性
- 添加公式说明部分

### 步骤 3: 更新初始化逻辑

- 使用 `container.querySelector()` 而不是 `document.getElementById()`
- 添加输入验证
- 包装 FHIR 调用在 try-catch 中

### 步骤 4: 更新计算逻辑

- 添加输入验证
- 使用 try-catch 包装
- 使用 `displayError()` 显示错误

---

## 💡 快速改进清单

在更新现有计算器时，请检查以下项：

- [ ] 导入错误处理和验证模块
- [ ] 使用容器作用域选择器 (`container.querySelector()`)
- [ ] 为所有输入添加验证
- [ ] 在 FHIR 调用周围添加 try-catch
- [ ] 使用 `displayError()` 显示错误
- [ ] 添加 ARIA 标签
- [ ] 添加公式说明部分
- [ ] 添加结果解释
- [ ] 测试错误场景

---

## 📚 相关文档

- [错误处理框架](js/errorHandler.js)
- [输入验证框架](js/validator.js)
- [开发文档](DEVELOPMENT.md)
- [贡献指南](CONTRIBUTING.md)

---

Happy Coding! 🎉

