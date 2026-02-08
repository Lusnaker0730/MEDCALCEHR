/**
 * @jest-environment jsdom
 */

/**
 * Error Handler Module Tests
 * Tests for error handling utilities
 */

import { describe, expect, test, beforeEach, afterEach, jest } from '@jest/globals';
import {
    CalculatorError,
    FHIRDataError,
    ValidationError,
    logError,
    displayError,
    setupGlobalErrorHandler,
    withErrorHandling,
    tryOrDefault
} from '../errorHandler.js';

describe('Error Handler Module', () => {
    // =========================================
    // CalculatorError Class Tests
    // =========================================
    describe('CalculatorError', () => {
        test('should create error with message, code, and details', () => {
            const error = new CalculatorError('Test error', 'TEST_ERROR', { field: 'test' });

            expect(error.message).toBe('Test error');
            expect(error.code).toBe('TEST_ERROR');
            expect(error.details).toEqual({ field: 'test' });
            expect(error.name).toBe('CalculatorError');
            expect(error.timestamp).toBeInstanceOf(Date);
        });

        test('should default details to empty object', () => {
            const error = new CalculatorError('Test error', 'TEST_ERROR');
            expect(error.details).toEqual({});
        });

        test('should be instance of Error', () => {
            const error = new CalculatorError('Test', 'CODE');
            expect(error).toBeInstanceOf(Error);
        });
    });

    // =========================================
    // FHIRDataError Class Tests
    // =========================================
    describe('FHIRDataError', () => {
        test('should create error with FHIR_DATA_ERROR code', () => {
            const error = new FHIRDataError('FHIR fetch failed', { resource: 'Patient' });

            expect(error.message).toBe('FHIR fetch failed');
            expect(error.code).toBe('FHIR_DATA_ERROR');
            expect(error.name).toBe('FHIRDataError');
            expect(error.details).toEqual({ resource: 'Patient' });
        });

        test('should be instance of CalculatorError', () => {
            const error = new FHIRDataError('Test');
            expect(error).toBeInstanceOf(CalculatorError);
        });
    });

    // =========================================
    // ValidationError Class Tests
    // =========================================
    describe('ValidationError', () => {
        test('should create error with VALIDATION_ERROR code', () => {
            const error = new ValidationError('Invalid input', { field: 'age', value: -5 });

            expect(error.message).toBe('Invalid input');
            expect(error.code).toBe('VALIDATION_ERROR');
            expect(error.name).toBe('ValidationError');
            expect(error.details).toEqual({ field: 'age', value: -5 });
        });

        test('should be instance of CalculatorError', () => {
            const error = new ValidationError('Test');
            expect(error).toBeInstanceOf(CalculatorError);
        });
    });

    // =========================================
    // logError Function Tests
    // =========================================
    describe('logError', () => {
        beforeEach(() => {
            jest.spyOn(console, 'error').mockImplementation(() => {});
            jest.spyOn(console, 'log').mockImplementation(() => {});
            jest.spyOn(console, 'group').mockImplementation(() => {});
            jest.spyOn(console, 'groupEnd').mockImplementation(() => {});
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        test('should return error log object', () => {
            const error = new Error('Test error');
            const result = logError(error, { calculator: 'test' });

            expect(result).toHaveProperty('name', 'Error');
            expect(result).toHaveProperty('message', 'Test error');
            expect(result).toHaveProperty('timestamp');
            expect(result).toHaveProperty('context');
            expect(result.context).toEqual({ calculator: 'test' });
        });

        test('should include code for CalculatorError', () => {
            const error = new CalculatorError('Test', 'CUSTOM_CODE');
            const result = logError(error);

            expect(result.code).toBe('CUSTOM_CODE');
        });

        test('should default code to UNKNOWN_ERROR', () => {
            const error = new Error('Generic error');
            const result = logError(error);

            expect(result.code).toBe('UNKNOWN_ERROR');
        });
    });

    // =========================================
    // withErrorHandling Function Tests
    // =========================================
    describe('withErrorHandling', () => {
        beforeEach(() => {
            jest.spyOn(console, 'error').mockImplementation(() => {});
            jest.spyOn(console, 'log').mockImplementation(() => {});
            jest.spyOn(console, 'group').mockImplementation(() => {});
            jest.spyOn(console, 'groupEnd').mockImplementation(() => {});
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        test('should return result on success', async () => {
            const successFn = async () => 'success';
            const wrapped = withErrorHandling(successFn);

            const result = await wrapped();
            expect(result).toBe('success');
        });

        test('should log and rethrow on error', async () => {
            const failFn = async () => {
                throw new Error('Failure');
            };
            const wrapped = withErrorHandling(failFn, { action: 'test' });

            await expect(wrapped()).rejects.toThrow('Failure');
            expect(console.error).toHaveBeenCalled();
        });

        test('should preserve function arguments', async () => {
            const addFn = async (a: number, b: number) => a + b;
            const wrapped = withErrorHandling(addFn);

            const result = await wrapped(2, 3);
            expect(result).toBe(5);
        });
    });

    // =========================================
    // tryOrDefault Function Tests
    // =========================================
    describe('tryOrDefault', () => {
        beforeEach(() => {
            jest.spyOn(console, 'error').mockImplementation(() => {});
            jest.spyOn(console, 'log').mockImplementation(() => {});
            jest.spyOn(console, 'group').mockImplementation(() => {});
            jest.spyOn(console, 'groupEnd').mockImplementation(() => {});
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        test('should return function result on success', () => {
            const result = tryOrDefault(() => 'value', 'default');
            expect(result).toBe('value');
        });

        test('should return default value on error', () => {
            const result = tryOrDefault(() => {
                throw new Error('Fail');
            }, 'default');
            expect(result).toBe('default');
        });

        test('should work with complex default values', () => {
            const defaultObj = { key: 'value', count: 0 };
            const result = tryOrDefault(() => {
                throw new Error('Fail');
            }, defaultObj);
            expect(result).toEqual(defaultObj);
        });

        test('should log error when exception occurs', () => {
            tryOrDefault(() => {
                throw new Error('Test');
            }, null);
            expect(console.error).toHaveBeenCalled();
        });
    });

    // =========================================
    // logError - Production Branch (line 74)
    // =========================================
    describe('logError production branch', () => {
        let originalHostname: PropertyDescriptor | undefined;

        beforeEach(() => {
            jest.spyOn(console, 'error').mockImplementation(() => {});
            jest.spyOn(console, 'log').mockImplementation(() => {});
            jest.spyOn(console, 'group').mockImplementation(() => {});
            jest.spyOn(console, 'groupEnd').mockImplementation(() => {});
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        test('should log brief error in production (non-localhost)', () => {
            // jsdom defaults to "localhost", so we need to override
            Object.defineProperty(window, 'location', {
                value: { hostname: 'production.example.com', href: 'https://production.example.com/app' },
                writable: true,
                configurable: true
            });

            const error = new CalculatorError('Something broke', 'CALC_ERROR');
            const result = logError(error, {});

            // In production, should only call console.error with the brief format
            expect(console.error).toHaveBeenCalledWith('[CALC_ERROR] Something broke');
            // Should NOT call console.group in production
            expect(console.group).not.toHaveBeenCalled();

            expect(result).toHaveProperty('code', 'CALC_ERROR');
            expect(result).toHaveProperty('message', 'Something broke');

            // Restore localhost for other tests
            Object.defineProperty(window, 'location', {
                value: { hostname: 'localhost', href: 'http://localhost/' },
                writable: true,
                configurable: true
            });
        });
    });

    // =========================================
    // displayError Function Tests (lines 94-124)
    // =========================================
    describe('displayError', () => {
        let container: HTMLDivElement;

        beforeEach(() => {
            container = document.createElement('div');
            document.body.appendChild(container);
            jest.spyOn(console, 'error').mockImplementation(() => {});
            jest.spyOn(console, 'log').mockImplementation(() => {});
            jest.spyOn(console, 'group').mockImplementation(() => {});
            jest.spyOn(console, 'groupEnd').mockImplementation(() => {});
        });

        afterEach(() => {
            document.body.innerHTML = '';
            // Remove any injected style links
            const styleLink = document.getElementById('error-handler-styles');
            if (styleLink) styleLink.remove();
            jest.restoreAllMocks();
        });

        test('should render error message in container', () => {
            const error = new Error('Something went wrong');
            displayError(container, error, 'A friendly message');

            expect(container.querySelector('.error-message')).not.toBeNull();
            expect(container.querySelector('.error-title')).not.toBeNull();
            expect(container.querySelector('.error-content')?.textContent?.trim()).toBe(
                'A friendly message'
            );
        });

        test('should handle null container gracefully (line 94-96)', () => {
            const error = new Error('Test');
            // Should not throw; should log an error
            displayError(null as unknown as HTMLElement, error);
            expect(console.error).toHaveBeenCalledWith('displayError: container element is null');
        });

        test('should use getUserFriendlyMessage for FHIRDataError', () => {
            const error = new FHIRDataError('FHIR connection lost');
            displayError(container, error);

            const content = container.querySelector('.error-content')?.textContent?.trim();
            expect(content).toBe(
                'Unable to retrieve patient data from EHR system. Please check connection or enter data manually.'
            );
        });

        test('should use getUserFriendlyMessage for ValidationError', () => {
            const error = new ValidationError('Age must be positive');
            displayError(container, error);

            const content = container.querySelector('.error-content')?.textContent?.trim();
            expect(content).toBe('Input validation failed: Age must be positive');
        });

        test('should use getUserFriendlyMessage for generic CalculatorError', () => {
            const error = new CalculatorError('Division by zero', 'CALC_DIV_ZERO');
            displayError(container, error);

            const content = container.querySelector('.error-content')?.textContent?.trim();
            expect(content).toBe('Division by zero');
        });

        test('should use generic message for unknown Error type', () => {
            const error = new Error('some internal failure');
            displayError(container, error);

            const content = container.querySelector('.error-content')?.textContent?.trim();
            expect(content).toBe(
                'Calculator encountered an error. Please refresh the page and try again or contact support.'
            );
        });

        test('should show technical details on localhost', () => {
            // jsdom defaults hostname to localhost
            Object.defineProperty(window, 'location', {
                value: { hostname: 'localhost', href: 'http://localhost/' },
                writable: true,
                configurable: true
            });

            const error = new Error('Stack trace error');
            error.stack = 'Error: Stack trace error\n    at Object.<anonymous>';
            displayError(container, error);

            const details = container.querySelector('details');
            expect(details).not.toBeNull();
            const pre = container.querySelector('pre');
            expect(pre?.textContent).toContain('Stack trace error');
        });

        test('should NOT show technical details in production', () => {
            Object.defineProperty(window, 'location', {
                value: { hostname: 'production.example.com', href: 'https://production.example.com/' },
                writable: true,
                configurable: true
            });

            const error = new Error('Stack trace error');
            displayError(container, error);

            const details = container.querySelector('details');
            expect(details).toBeNull();

            // Restore for other tests
            Object.defineProperty(window, 'location', {
                value: { hostname: 'localhost', href: 'http://localhost/' },
                writable: true,
                configurable: true
            });
        });

        test('should load error-handler CSS stylesheet', () => {
            const error = new Error('test');
            displayError(container, error);

            const link = document.getElementById('error-handler-styles');
            expect(link).not.toBeNull();
            expect(link?.getAttribute('rel')).toBe('stylesheet');
            expect(link?.getAttribute('href')).toBe('./css/error-handler.css');
        });

        test('should not duplicate CSS stylesheet on multiple calls', () => {
            const error = new Error('test');
            displayError(container, error);
            displayError(container, error);

            const links = document.querySelectorAll('#error-handler-styles');
            expect(links.length).toBe(1);
        });

        test('should display error.message when error has no stack (fallback in template)', () => {
            // Test the template branch: error.stack || error.message
            Object.defineProperty(window, 'location', {
                value: { hostname: 'localhost', href: 'http://localhost/' },
                writable: true,
                configurable: true
            });

            const error = { message: 'no stack available', name: 'CustomError' };
            displayError(container, error);

            const pre = container.querySelector('pre');
            expect(pre?.textContent).toContain('no stack available');
        });

        test('should override getUserFriendlyMessage when userMessage is provided', () => {
            const error = new FHIRDataError('technical details');
            displayError(container, error, 'Custom override message');

            const content = container.querySelector('.error-content')?.textContent?.trim();
            expect(content).toBe('Custom override message');
        });
    });

    // =========================================
    // setupGlobalErrorHandler Tests (lines 201-219)
    // =========================================
    describe('setupGlobalErrorHandler', () => {
        beforeEach(() => {
            jest.spyOn(console, 'error').mockImplementation(() => {});
            jest.spyOn(console, 'log').mockImplementation(() => {});
            jest.spyOn(console, 'group').mockImplementation(() => {});
            jest.spyOn(console, 'groupEnd').mockImplementation(() => {});
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        test('should register error event listener (line 205)', () => {
            const addEventSpy = jest.spyOn(window, 'addEventListener');
            setupGlobalErrorHandler();

            const errorCalls = addEventSpy.mock.calls.filter(
                call => call[0] === 'error'
            );
            expect(errorCalls.length).toBeGreaterThanOrEqual(1);
        });

        test('should register unhandledrejection event listener (line 214)', () => {
            const addEventSpy = jest.spyOn(window, 'addEventListener');
            setupGlobalErrorHandler();

            const rejectionCalls = addEventSpy.mock.calls.filter(
                call => call[0] === 'unhandledrejection'
            );
            expect(rejectionCalls.length).toBeGreaterThanOrEqual(1);
        });

        test('error event handler should call logError with context', () => {
            // Capture the handler by spying on addEventListener
            let errorHandler: ((event: any) => void) | null = null;
            const addEventSpy = jest.spyOn(window, 'addEventListener').mockImplementation(
                ((event: string, handler: any) => {
                    if (event === 'error') {
                        errorHandler = handler;
                    }
                }) as any
            );

            setupGlobalErrorHandler();
            expect(errorHandler).not.toBeNull();

            // Simulate the error event callback
            const fakeError = new Error('uncaught!');
            errorHandler!({
                error: fakeError,
                filename: 'test.js',
                lineno: 42,
                colno: 10
            });

            // logError calls console.error (or console.group), so check it was invoked
            expect(console.error).toHaveBeenCalled();
        });

        test('unhandledrejection handler should call logError with context', () => {
            let rejectionHandler: ((event: any) => void) | null = null;
            jest.spyOn(window, 'addEventListener').mockImplementation(
                ((event: string, handler: any) => {
                    if (event === 'unhandledrejection') {
                        rejectionHandler = handler;
                    }
                }) as any
            );

            setupGlobalErrorHandler();
            expect(rejectionHandler).not.toBeNull();

            // Simulate unhandled rejection callback
            const fakeReason = new Error('unhandled rejection');
            rejectionHandler!({
                reason: fakeReason,
                promise: Promise.resolve()
            });

            expect(console.error).toHaveBeenCalled();
        });
    });
});
