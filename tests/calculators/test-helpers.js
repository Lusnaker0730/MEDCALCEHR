/**
 * 計算器測試輔助工具
 */

/**
 * 創建模擬的 FHIR 客戶端
 */
export function createMockFHIRClient(patientData = {}, observations = {}) {
    return {
        patient: {
            id: patientData.id || 'test-patient-123',
            read: jest.fn().mockResolvedValue({
                resourceType: 'Patient',
                id: patientData.id || 'test-patient-123',
                name: patientData.name || [{ given: ['John'], family: 'Doe' }],
                birthDate: patientData.birthDate || '1990-01-15',
                gender: patientData.gender || 'male'
            }),
            request: jest.fn((query) => {
                // 解析查詢以返回適當的觀察數據
                const codeMatch = query.match(/code=([^&]+)/);
                if (codeMatch && observations[codeMatch[1]]) {
                    return Promise.resolve({
                        entry: [{
                            resource: observations[codeMatch[1]]
                        }]
                    });
                }
                return Promise.resolve({ entry: [] });
            })
        }
    };
}

/**
 * 創建模擬的容器元素
 */
export function createMockContainer(innerHTML = '') {
    const container = document.createElement('div');
    container.innerHTML = innerHTML;
    document.body.appendChild(container);
    return container;
}

/**
 * 清理測試容器
 */
export function cleanupContainer(container) {
    if (container && container.parentNode) {
        container.parentNode.removeChild(container);
    }
}

/**
 * 模擬用戶輸入
 */
export function setInputValue(container, inputId, value) {
    const input = container.querySelector(`#${inputId}`);
    if (input) {
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    return input;
}

/**
 * 模擬選擇選項
 */
export function selectOption(container, selectId, value) {
    const select = container.querySelector(`#${selectId}`);
    if (select) {
        select.value = value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
    }
    return select;
}

/**
 * 模擬單選按鈕選擇
 */
export function selectRadio(container, name, value) {
    const radio = container.querySelector(`input[name="${name}"][value="${value}"]`);
    if (radio) {
        radio.checked = true;
        radio.dispatchEvent(new Event('change', { bubbles: true }));
    }
    return radio;
}

/**
 * 模擬按鈕點擊
 */
export function clickButton(container, selector) {
    const button = container.querySelector(selector);
    if (button) {
        button.click();
    }
    return button;
}

/**
 * 獲取結果文本
 */
export function getResultText(container, selector) {
    const element = container.querySelector(selector);
    return element ? element.textContent.trim() : null;
}

/**
 * 驗證計算器基本結構
 */
export function validateCalculatorStructure(calculator) {
    expect(calculator).toBeDefined();
    expect(calculator.id).toBeDefined();
    expect(calculator.title).toBeDefined();
    expect(typeof calculator.generateHTML).toBe('function');
    expect(typeof calculator.initialize).toBe('function');
}

/**
 * 創建觀察資源
 */
export function createObservation(code, value, unit) {
    return {
        resourceType: 'Observation',
        code: {
            coding: [{ system: 'http://loinc.org', code: code }]
        },
        valueQuantity: {
            value: value,
            unit: unit
        },
        effectiveDateTime: new Date().toISOString()
    };
}

/**
 * 等待異步操作
 */
export function waitFor(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 驗證輸入驗證錯誤
 */
export function expectValidationError(container, inputId) {
    const input = container.querySelector(`#${inputId}`);
    expect(input).toBeDefined();
    expect(input.classList.contains('invalid') || input.getAttribute('aria-invalid') === 'true').toBe(true);
}

/**
 * 驗證沒有驗證錯誤
 */
export function expectNoValidationError(container, inputId) {
    const input = container.querySelector(`#${inputId}`);
    if (input) {
        expect(input.classList.contains('invalid')).toBe(false);
        expect(input.getAttribute('aria-invalid')).not.toBe('true');
    }
}

