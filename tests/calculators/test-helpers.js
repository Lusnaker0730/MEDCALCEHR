/**
 * Calculator Test Helpers
 */

/**
 * Create a mock FHIR client
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
                // Parse query to return appropriate observation details
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
 * Setup mock FHIR client (alias for createMockFHIRClient)
 */
export function setupMockFHIRClient(patientData = {}, observations = {}) {
    return {
        request: jest.fn().mockResolvedValue({ entry: [] }),
        patient: {
            id: patientData.id || 'test-patient-123',
            read: jest.fn().mockResolvedValue({
                resourceType: 'Patient',
                id: patientData.id || 'test-patient-123',
                name: patientData.name || [{ given: ['John'], family: 'Doe' }],
                birthDate: patientData.birthDate || '1990-01-15',
                gender: patientData.gender || 'male'
            }),
            request: jest.fn().mockResolvedValue({ entry: [] })
        }
    };
}

/**
 * Create mock patient data
 */
export function mockPatientData() {
    return {
        resourceType: 'Patient',
        id: 'test-patient-123',
        name: [{ given: ['John'], family: 'Doe' }],
        birthDate: '1980-01-15',
        gender: 'male'
    };
}

/**
 * Clean up DOM (alias for cleanupContainer)
 */
export function cleanupDOM() {
    // Clean up all test containers
    const containers = document.querySelectorAll('#test-container');
    containers.forEach(container => {
        if (container.parentNode) {
            container.parentNode.removeChild(container);
        }
    });
    // Also clean up document body children except scripts
    Array.from(document.body.children).forEach(child => {
        if (child.tagName !== 'SCRIPT') {
            document.body.removeChild(child);
        }
    });
}

/**
 * Create mock container element
 */
export function createMockContainer(innerHTML = '') {
    const container = document.createElement('div');
    container.innerHTML = innerHTML;
    document.body.appendChild(container);
    return container;
}

/**
 * Clean up test container
 */
export function cleanupContainer(container) {
    if (container && container.parentNode) {
        container.parentNode.removeChild(container);
    }
}

/**
 * Mock user input
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
 * Mock option selection
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
 * Mock radio button selection
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
 * Mock button click
 */
export function clickButton(container, selector) {
    const button = container.querySelector(selector);
    if (button) {
        button.click();
    }
    return button;
}

/**
 * Get result text
 */
export function getResultText(container, selector) {
    const element = container.querySelector(selector);
    return element ? element.textContent.trim() : null;
}

/**
 * Validate basic calculator structure
 */
export function validateCalculatorStructure(calculator) {
    expect(calculator).toBeDefined();
    expect(calculator.id).toBeDefined();
    expect(calculator.title).toBeDefined();
    expect(typeof calculator.generateHTML).toBe('function');
    expect(typeof calculator.initialize).toBe('function');
}

/**
 * Create observation resource
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
 * Wait for async operation
 */
export function waitFor(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Validate input error
 */
export function expectValidationError(container, inputId) {
    const input = container.querySelector(`#${inputId}`);
    expect(input).toBeDefined();
    expect(input.classList.contains('invalid') || input.getAttribute('aria-invalid') === 'true').toBe(true);
}

/**
 * Validate no input error
 */
export function expectNoValidationError(container, inputId) {
    const input = container.querySelector(`#${inputId}`);
    if (input) {
        expect(input.classList.contains('invalid')).toBe(false);
        expect(input.getAttribute('aria-invalid')).not.toBe('true');
    }
}

