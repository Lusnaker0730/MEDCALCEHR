import { ValidationError } from './errorHandler';

/**
 * Validation Rule Type Definition
 */
export interface ValidationRule {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: any, input: any) => boolean | string;
    message?: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

/**
 * Validate calculator input
 * @param input - Input value object
 * @param schema - Validation rules
 * @returns Validation result
 */
export function validateCalculatorInput(input: Record<string, any>, schema: Record<string, ValidationRule>): ValidationResult {
    const errors: string[] = [];

    Object.keys(schema).forEach(key => {
        const value = input[key];
        const rule = schema[key];

        // Required field validation
        if (rule.required && (value === null || value === undefined || value === '')) {
            errors.push(rule.message || `${key} 是必需的`);
            return;
        }

        // If value is empty and not required, skip further validation
        if (value === null || value === undefined || value === '') {
            return;
        }

        // Min value validation
        if (rule.min !== undefined && Number(value) < rule.min) {
            errors.push(rule.message || `${key} 必须大于等于 ${rule.min}`);
        }

        // Max value validation
        if (rule.max !== undefined && Number(value) > rule.max) {
            errors.push(rule.message || `${key} 必须小于等于 ${rule.max}`);
        }

        // Regex pattern validation
        if (rule.pattern && !rule.pattern.test(String(value))) {
            errors.push(rule.message || `${key} 格式不正确`);
        }

        // Custom validation function
        if (rule.custom && typeof rule.custom === 'function') {
            const customResult = rule.custom(value, input);
            if (customResult !== true) {
                errors.push((customResult as string) || rule.message || `${key} 验证失败`);
            }
        }
    });

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Common Validation Rules Templates
 */
export const ValidationRules: Record<string, ValidationRule | Record<string, ValidationRule>> = {
    // Age validation
    age: {
        required: true,
        min: 0,
        max: 150,
        message: '年龄必须在 0-150 岁之间'
    },

    // Temperature validation (°C)
    temperature: {
        required: true,
        min: 20,
        max: 45,
        message: '体温必须在 20-45°C 之间'
    },

    // Blood Pressure validation
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

    // Heart Rate validation
    heartRate: {
        required: true,
        min: 20,
        max: 250,
        message: '心率必须在 20-250 bpm 之间'
    },

    // pH validation
    pH: {
        required: true,
        min: 6.5,
        max: 8.0,
        message: 'pH 必须在 6.5-8.0 之间'
    },

    // Weight validation (kg)
    weight: {
        required: true,
        min: 0.5,
        max: 500,
        message: '体重必须在 0.5-500 kg 之间'
    },

    // Height validation (cm)
    height: {
        required: true,
        min: 30,
        max: 250,
        message: '身高必须在 30-250 cm 之间'
    },

    // GCS validation
    gcs: {
        required: true,
        min: 3,
        max: 15,
        message: 'GCS 评分必须在 3-15 之间'
    },

    // Glucose validation (mg/dL)
    glucose: {
        required: true,
        min: 20,
        max: 800,
        message: '血糖必须在 20-800 mg/dL 之间'
    },

    // Creatinine validation (mg/dL)
    creatinine: {
        required: true,
        min: 0.1,
        max: 20,
        message: '肌酐必须在 0.1-20 mg/dL 之间'
    },

    // Sodium validation (mEq/L)
    sodium: {
        required: true,
        min: 100,
        max: 200,
        message: '钠离子必须在 100-200 mEq/L 之间'
    },

    // Potassium validation (mEq/L)
    potassium: {
        required: true,
        min: 1.5,
        max: 10,
        message: '钾离子必须在 1.5-10 mEq/L 之间'
    }
};

/**
 * Validate and throw error if validation fails
 * @param input - Input values
 * @param schema - Validation rules
 * @throws ValidationError if validation fails
 */
export function validateOrThrow(input: Record<string, any>, schema: Record<string, ValidationRule>): void {
    const result = validateCalculatorInput(input, schema);
    if (!result.isValid) {
        throw new ValidationError(result.errors.join('; '), { input, errors: result.errors });
    }
}

/**
 * Setup live validation for an input element
 * @param inputElement - Input element
 * @param rule - Validation rule
 * @param onError - Error callback function
 */
export function setupLiveValidation(inputElement: HTMLInputElement | null, rule: ValidationRule, onError: ((errors: string[]) => void) | null = null): void {
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
            let errorSpan = inputElement.nextElementSibling as HTMLElement;
            if (!errorSpan || !errorSpan.classList.contains('error-text')) {
                errorSpan = document.createElement('span');
                errorSpan.className = 'error-text';
                errorSpan.style.color = '#d32f2f';
                errorSpan.style.fontSize = '0.85em';
                errorSpan.style.marginTop = '4px';
                errorSpan.style.display = 'block';
                inputElement.parentNode?.insertBefore(errorSpan, inputElement.nextSibling);
            }
            errorSpan.textContent = result.errors[0];

            if (onError) {
                onError(result.errors);
            }
        } else {
            inputElement.classList.remove('invalid');
            inputElement.removeAttribute('aria-invalid');

            // Remove error message
            const errorSpan = inputElement.nextElementSibling as HTMLElement;
            if (errorSpan && errorSpan.classList.contains('error-text')) {
                errorSpan.remove();
            }
        }
    };

    inputElement.addEventListener('blur', validate);
    inputElement.addEventListener('input', () => {
        // Remove error state but don't validate immediately
        inputElement.classList.remove('invalid');
        const errorSpan = inputElement.nextElementSibling as HTMLElement;
        if (errorSpan && errorSpan.classList.contains('error-text')) {
            errorSpan.remove();
        }
    });
}

/**
 * Setup validation for all inputs in a form
 * @param formElement - Form element
 * @param schema - Validation rules
 */
export function setupFormValidation(formElement: HTMLFormElement | null, schema: Record<string, ValidationRule>): void {
    if (!formElement) {
        return;
    }

    Object.keys(schema).forEach(key => {
        const inputElement = formElement.querySelector(`#${key}`) as HTMLInputElement;
        if (inputElement) {
            setupLiveValidation(inputElement, schema[key]);
        }
    });
}
