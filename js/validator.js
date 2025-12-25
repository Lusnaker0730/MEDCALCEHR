// js/validator.js
import { ValidationError } from './errorHandler.js';
/**
 * 验证计算器输入
 * @param {Object} input - 输入值对象
 * @param {Object<string, ValidationRule>} schema - 验证规则
 * @returns {{isValid: boolean, errors: Array<string>}} 验证结果
 */
export function validateCalculatorInput(input, schema) {
    const errors = [];
    Object.keys(schema).forEach(key => {
        const value = input[key];
        const rule = schema[key];
        // Required field validation
        if (rule.required &&
            (value === null ||
                value === undefined ||
                value === '' ||
                (typeof value === 'number' && Number.isNaN(value)))) {
            errors.push(rule.message || `${key} is required`);
            return;
        }
        // Skip further validation if value is empty and not required
        if (value === null ||
            value === undefined ||
            value === '' ||
            (typeof value === 'number' && Number.isNaN(value))) {
            return;
        }
        // Minimum value validation
        if (rule.min !== undefined && Number(value) < rule.min) {
            errors.push(rule.message || `${key} must be at least ${rule.min}`);
        }
        // Maximum value validation
        if (rule.max !== undefined && Number(value) > rule.max) {
            errors.push(rule.message || `${key} must be at most ${rule.max}`);
        }
        // Pattern validation
        if (rule.pattern && !rule.pattern.test(String(value))) {
            errors.push(rule.message || `${key} format is incorrect`);
        }
        // Custom validation function
        if (rule.custom && typeof rule.custom === 'function') {
            const customResult = rule.custom(value, input);
            if (customResult !== true) {
                errors.push(customResult || rule.message || `${key} validation failed`);
            }
        }
    });
    return {
        isValid: errors.length === 0,
        errors
    };
}
/**
 * 常用验证规则模板
 */
export const ValidationRules = {
    // Age validation
    age: {
        required: true,
        min: 0,
        max: 150,
        message: 'Age must be between 0-150 years'
    },
    // Temperature validation (°C)
    temperature: {
        required: true,
        min: 20,
        max: 45,
        message: 'Temperature must be between 20-45°C'
    },
    // Blood pressure validation
    bloodPressure: {
        systolic: {
            required: true,
            min: 50,
            max: 250,
            message: 'Systolic BP must be between 50-250 mmHg'
        },
        diastolic: {
            required: true,
            min: 30,
            max: 150,
            message: 'Diastolic BP must be between 30-150 mmHg'
        }
    },
    // Heart rate validation
    heartRate: {
        required: true,
        min: 20,
        max: 250,
        message: 'Heart rate must be between 20-250 bpm'
    },
    // pH validation
    pH: {
        required: true,
        min: 6.5,
        max: 8.0,
        message: 'pH must be between 6.5-8.0'
    },
    // Weight validation (kg)
    weight: {
        required: true,
        min: 0.5,
        max: 500,
        message: 'Weight must be between 0.5-500 kg'
    },
    // Height validation (cm)
    height: {
        required: true,
        min: 30,
        max: 250,
        message: 'Height must be between 30-250 cm'
    },
    // GCS validation
    gcs: {
        required: true,
        min: 3,
        max: 15,
        message: 'GCS score must be between 3-15'
    },
    // Glucose validation (mg/dL)
    glucose: {
        required: true,
        min: 10,
        max: 2000,
        message: 'Glucose must be between 10-2000 mg/dL'
    },
    // BUN validation (mg/dL)
    bun: {
        required: true,
        min: 1,
        max: 200,
        message: 'BUN must be between 1-200 mg/dL'
    },
    // Urine sodium validation (mEq/L)
    urineSodium: {
        required: true,
        min: 1,
        max: 1000,
        message: 'Urine sodium must be between 1-1000 mEq/L'
    },
    // Urine creatinine validation (mg/dL)
    urineCreatinine: {
        required: true,
        min: 1,
        max: 2000,
        message: 'Urine creatinine must be between 1-2000 mg/dL'
    },
    // Creatinine validation (mg/dL)
    creatinine: {
        required: true,
        min: 0.1,
        max: 20,
        message: 'Creatinine must be between 0.1-20 mg/dL'
    },
    // Sodium validation (mEq/L)
    sodium: {
        required: true,
        min: 100,
        max: 200,
        message: 'Sodium must be between 100-200 mEq/L'
    },
    // Potassium validation (mEq/L)
    potassium: {
        required: true,
        min: 1.5,
        max: 10,
        message: 'Potassium must be between 1.5-10 mEq/L'
    },
    // Bilirubin validation (mg/dL)
    bilirubin: {
        required: true,
        min: 0.1,
        max: 80,
        message: 'Bilirubin must be between 0.1-80 mg/dL'
    },
    // Calcium validation (Total) (mg/dL)
    calcium: {
        required: true,
        min: 2.0,
        max: 20.0,
        message: 'Calcium must be between 2.0-20.0 mg/dL'
    },
    // INR validation
    inr: {
        required: true,
        min: 0.5,
        max: 20,
        message: 'INR must be between 0.5-20'
    },
    // Albumin validation (g/dL)
    albumin: {
        required: true,
        min: 0.5,
        max: 8.0,
        message: 'Albumin must be between 0.5-8.0 g/dL'
    },
    // Liver enzyme validation (AST/ALT) (U/L)
    liverEnzyme: {
        required: true,
        min: 1,
        max: 5000,
        message: 'Enzyme level must be between 1-5000 U/L'
    },
    // Platelet validation (10^9/L)
    platelets: {
        required: true,
        min: 1,
        max: 2000,
        message: 'Platelets must be between 1-2000 ×10⁹/L'
    },
    // MAP validation (mmHg)
    map: {
        required: true,
        min: 20,
        max: 300,
        message: 'MAP must be between 20-300 mmHg'
    },
    // Respiratory rate (breaths/min)
    respiratoryRate: {
        required: true,
        min: 0, // Allow for intubated patients
        max: 100,
        message: 'Respiratory rate must be between 0-100 breaths/min'
    },
    // Hematocrit (Hct) (%)
    hematocrit: {
        required: true,
        min: 5,
        max: 80,
        message: 'Hematocrit must be between 5-80%'
    },
    // WBC count (10^9/L)
    wbc: {
        required: true,
        min: 0,
        max: 500,
        message: 'WBC must be between 0-500 ×10⁹/L'
    },
    // QT interval validation (ms)
    qtInterval: {
        required: true,
        min: 200,
        max: 800,
        message: 'QT interval must be between 200-800 ms'
    },
    // Arterial blood gas
    arterialGas: {
        paO2: {
            required: true,
            min: 10,
            max: 800,
            message: 'PaO₂ must be between 10-800 mmHg'
        },
        paCO2: {
            required: true,
            min: 5,
            max: 200,
            message: 'PaCO₂ must be between 5-200 mmHg'
        },
        fiO2: {
            required: true,
            min: 0.21,
            max: 1.0,
            message: 'FiO₂ must be between 0.21-1.0'
        }
    },
    // Phenytoin (mcg/mL)
    phenytoin: {
        required: true,
        min: 0,
        max: 100,
        message: 'Phenytoin level must be between 0-100 mcg/mL'
    },
    // Bicarbonate validation (mEq/L)
    bicarbonate: {
        required: true,
        min: 2,
        max: 60,
        message: 'HCO₃⁻ must be between 2-60 mEq/L'
    },
    // Chloride validation (mEq/L)
    chloride: {
        required: true,
        min: 50,
        max: 150,
        message: 'Chloride must be between 50-150 mEq/L'
    },
    // Insulin validation (µU/mL)
    insulin: {
        required: true,
        min: 0.1,
        max: 500,
        message: 'Insulin must be between 0.1-500 µU/mL'
    },
    // Ethanol validation (mg/dL)
    ethanol: {
        required: false,
        min: 0,
        max: 1000,
        message: 'Ethanol concentration must be between 0-1000 mg/dL'
    },
    // Total Cholesterol (mg/dL)
    totalCholesterol: {
        required: true,
        min: 50,
        max: 1000,
        message: 'Total cholesterol must be between 50-1000 mg/dL'
    },
    // HDL (mg/dL)
    hdl: {
        required: true,
        min: 10,
        max: 200,
        message: 'HDL must be between 10-200 mg/dL'
    },
    // Triglycerides (mg/dL)
    triglycerides: {
        required: true,
        min: 10,
        max: 3000,
        message: 'Triglycerides must be between 10-3000 mg/dL'
    },
    // Osmolality (mOsm/kg)
    osmolality: {
        required: true,
        min: 0,
        max: 2000,
        message: 'Osmolality must be between 0-2000 mOsm/kg'
    },
    // Time (hours)
    hours: {
        required: true,
        min: 0,
        max: 168, // 1 week max reasonable cap
        message: 'Time must be between 0-168 hours'
    },
    // Volume (mL)
    volume: {
        required: true,
        min: 0,
        max: 5000,
        message: 'Volume must be between 0-5000 mL'
    },
    // Alcohol by volume (ABV) %
    abv: {
        required: true,
        min: 0,
        max: 100,
        message: 'ABV must be between 0-100%'
    },
    // Hemoglobin (g/dL)
    hemoglobin: {
        required: true,
        min: 1,
        max: 25,
        message: 'Hemoglobin must be between 1-25 g/dL'
    }
};
/**
 * 验证并抛出错误（如果验证失败）
 * @param {Object} input - 输入值
 * @param {Object} schema - 验证规则
 * @throws {ValidationError} 如果验证失败
 */
export function validateOrThrow(input, schema) {
    const result = validateCalculatorInput(input, schema);
    if (!result.isValid) {
        throw new ValidationError(result.errors.join('; '), { input, errors: result.errors });
    }
}
/**
 * 创建输入字段的实时验证
 * @param {HTMLInputElement} inputElement - 输入元素
 * @param {ValidationRule} rule - 验证规则
 * @param {Function} onError - 错误回调函数
 */
export function setupLiveValidation(inputElement, rule, onError = null) {
    if (!inputElement) {
        return;
    }
    const validate = () => {
        const value = inputElement.value;
        const result = validateCalculatorInput({ value }, { value: rule });
        if (!result.isValid) {
            inputElement.classList.add('invalid');
            inputElement.setAttribute('aria-invalid', 'true');
            // Display error message
            let errorSpan = inputElement.nextElementSibling;
            if (!errorSpan || !errorSpan.classList.contains('error-text')) {
                errorSpan = document.createElement('span');
                errorSpan.className = 'error-text';
                errorSpan.style.color = '#d32f2f';
                errorSpan.style.fontSize = '1.1rem';
                errorSpan.style.fontWeight = '500';
                errorSpan.style.marginTop = '6px';
                errorSpan.style.display = 'block';
                if (inputElement.parentNode) {
                    inputElement.parentNode.insertBefore(errorSpan, inputElement.nextSibling);
                }
            }
            errorSpan.textContent = result.errors[0];
            if (onError) {
                onError(result.errors);
            }
        }
        else {
            inputElement.classList.remove('invalid');
            inputElement.removeAttribute('aria-invalid');
            // 移除错误消息
            const errorSpan = inputElement.nextElementSibling;
            if (errorSpan && errorSpan.classList.contains('error-text')) {
                errorSpan.remove();
            }
        }
    };
    inputElement.addEventListener('blur', validate);
    inputElement.addEventListener('input', () => {
        // 移除错误状态但不立即验证
        inputElement.classList.remove('invalid');
        const errorSpan = inputElement.nextElementSibling;
        if (errorSpan && errorSpan.classList.contains('error-text')) {
            errorSpan.remove();
        }
    });
}
/**
 * 为表单中的所有输入设置验证
 * @param {HTMLFormElement} formElement - 表单元素
 * @param {Object} schema - 验证规则
 */
export function setupFormValidation(formElement, schema) {
    if (!formElement) {
        return;
    }
    Object.keys(schema).forEach(key => {
        const inputElement = formElement.querySelector(`#${key}`);
        if (inputElement) {
            setupLiveValidation(inputElement, schema[key]);
        }
    });
}
