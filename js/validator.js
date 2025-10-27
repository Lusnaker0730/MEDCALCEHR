// js/validator.js
import { ValidationError } from './errorHandler.js';

/**
 * 验证规则类型定义
 * @typedef {Object} ValidationRule
 * @property {boolean} [required] - 是否必需
 * @property {number} [min] - 最小值
 * @property {number} [max] - 最大值
 * @property {RegExp} [pattern] - 正则表达式模式
 * @property {Function} [custom] - 自定义验证函数
 * @property {string} [message] - 自定义错误消息
 */

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

        // 必需字段验证
        if (rule.required && (value === null || value === undefined || value === '')) {
            errors.push(rule.message || `${key} 是必需的`);
            return;
        }

        // 如果值为空且非必需，跳过后续验证
        if (value === null || value === undefined || value === '') {
            return;
        }

        // 最小值验证
        if (rule.min !== undefined && Number(value) < rule.min) {
            errors.push(rule.message || `${key} 必须大于等于 ${rule.min}`);
        }

        // 最大值验证
        if (rule.max !== undefined && Number(value) > rule.max) {
            errors.push(rule.message || `${key} 必须小于等于 ${rule.max}`);
        }

        // 正则表达式验证
        if (rule.pattern && !rule.pattern.test(String(value))) {
            errors.push(rule.message || `${key} 格式不正确`);
        }

        // 自定义验证函数
        if (rule.custom && typeof rule.custom === 'function') {
            const customResult = rule.custom(value, input);
            if (customResult !== true) {
                errors.push(customResult || rule.message || `${key} 验证失败`);
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
    // 年龄验证
    age: {
        required: true,
        min: 0,
        max: 150,
        message: '年龄必须在 0-150 岁之间'
    },

    // 体温验证 (°C)
    temperature: {
        required: true,
        min: 20,
        max: 45,
        message: '体温必须在 20-45°C 之间'
    },

    // 血压验证
    bloodPressure: {
        systolic: {
            required: true,
            min: 50,
            max: 250,
            message: '收缩压必须在 50-250 mmHg 之间'
        },
        diastolic: {
            required: true,
            min: 30,
            max: 150,
            message: '舒张压必须在 30-150 mmHg 之间'
        }
    },

    // 心率验证
    heartRate: {
        required: true,
        min: 20,
        max: 250,
        message: '心率必须在 20-250 bpm 之间'
    },

    // pH 验证
    pH: {
        required: true,
        min: 6.5,
        max: 8.0,
        message: 'pH 必须在 6.5-8.0 之间'
    },

    // 体重验证 (kg)
    weight: {
        required: true,
        min: 0.5,
        max: 500,
        message: '体重必须在 0.5-500 kg 之间'
    },

    // 身高验证 (cm)
    height: {
        required: true,
        min: 30,
        max: 250,
        message: '身高必须在 30-250 cm 之间'
    },

    // GCS 验证
    gcs: {
        required: true,
        min: 3,
        max: 15,
        message: 'GCS 评分必须在 3-15 之间'
    },

    // 血糖验证 (mg/dL)
    glucose: {
        required: true,
        min: 20,
        max: 800,
        message: '血糖必须在 20-800 mg/dL 之间'
    },

    // 肌酐验证 (mg/dL)
    creatinine: {
        required: true,
        min: 0.1,
        max: 20,
        message: '肌酐必须在 0.1-20 mg/dL 之间'
    },

    // 钠离子验证 (mEq/L)
    sodium: {
        required: true,
        min: 100,
        max: 200,
        message: '钠离子必须在 100-200 mEq/L 之间'
    },

    // 钾离子验证 (mEq/L)
    potassium: {
        required: true,
        min: 1.5,
        max: 10,
        message: '钾离子必须在 1.5-10 mEq/L 之间'
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

            // 显示错误消息
            let errorSpan = inputElement.nextElementSibling;
            if (!errorSpan || !errorSpan.classList.contains('error-text')) {
                errorSpan = document.createElement('span');
                errorSpan.className = 'error-text';
                errorSpan.style.color = '#d32f2f';
                errorSpan.style.fontSize = '0.85em';
                errorSpan.style.marginTop = '4px';
                errorSpan.style.display = 'block';
                inputElement.parentNode.insertBefore(errorSpan, inputElement.nextSibling);
            }
            errorSpan.textContent = result.errors[0];

            if (onError) {
                onError(result.errors);
            }
        } else {
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
