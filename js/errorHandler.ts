/**
 * Custom Calculator Error Class
 */
export class CalculatorError extends Error {
    code: string;
    details: Record<string, any>;
    timestamp: Date;

    /**
     * Create a calculator error instance
     * @param message - Error message
     * @param code - Error code
     * @param details - Error details
     */
    constructor(message: string, code: string, details: Record<string, any> = {}) {
        super(message);
        this.name = 'CalculatorError';
        this.code = code;
        this.details = details;
        this.timestamp = new Date();
    }
}

/**
 * FHIR Data Error Class
 */
export class FHIRDataError extends CalculatorError {
    constructor(message: string, details: Record<string, any> = {}) {
        super(message, 'FHIR_DATA_ERROR', details);
        this.name = 'FHIRDataError';
    }
}

/**
 * Input Validation Error Class
 */
export class ValidationError extends CalculatorError {
    constructor(message: string, details: Record<string, any> = {}) {
        super(message, 'VALIDATION_ERROR', details);
        this.name = 'ValidationError';
    }
}

export interface ErrorLog {
    name: string;
    message: string;
    code: string;
    timestamp: string;
    context: Record<string, any>;
    userAgent: string;
    url: string;
    stack?: string;
}

/**
 * Log error to console and optional logging service
 * @param error - Error object
 * @param context - Error context information
 */
export function logError(error: Error | CalculatorError, context: Record<string, any> = {}): ErrorLog {
    const errorLog: ErrorLog = {
        name: error.name || 'Error',
        message: error.message,
        code: (error as any).code || 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString(),
        context: context,
        userAgent: navigator.userAgent,
        url: window.location.href,
        stack: error.stack
    };

    // Log detailed info in development environment
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.group('🚨 Error Logged');
        console.error('Error:', error);
        console.log('Context:', context);
        console.log('Full Log:', errorLog);
        console.groupEnd();
    } else {
        // Log brief info in production
        console.error(`[${errorLog.code}] ${errorLog.message}`);
    }

    // Optional: Send to logging service (e.g., Sentry, LogRocket)
    // sendToLoggingService(errorLog);

    return errorLog;
}

/**
 * Display user-friendly error message
 * @param container - Container element to display error
 * @param error - Error object
 * @param userMessage - User-friendly error message
 */
export function displayError(container: HTMLElement | null, error: Error, userMessage: string | null = null): void {
    if (!container) {
        console.error('displayError: container element is null');
        return;
    }

    const message = userMessage || getUserFriendlyMessage(error);

    container.innerHTML = `
        <div class="error-message" style="
            background: #fee;
            border-left: 4px solid #d32f2f;
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
        ">
            <div style="font-weight: 600; color: #d32f2f; margin-bottom: 8px;">
                ⚠️ 错误
            </div>
            <div style="color: #555; font-size: 0.9em;">
                ${message}
            </div>
            ${window.location.hostname === 'localhost'
            ? `
                <details style="margin-top: 10px; font-size: 0.85em; color: #666;">
                    <summary style="cursor: pointer;">技术详情</summary>
                    <pre style="margin-top: 8px; padding: 8px; background: #f5f5f5; border-radius: 3px; overflow-x: auto;">
${error.stack || error.message}
                    </pre>
                </details>
            `
            : ''
        }
        </div>
    `;
}

/**
 * Get user-friendly error message
 * @param error - Error object
 * @returns User-friendly error message
 */
function getUserFriendlyMessage(error: Error): string {
    if (error instanceof FHIRDataError) {
        return '无法从电子病历系统获取患者数据。请检查连接或手动输入数据。';
    }

    if (error instanceof ValidationError) {
        return `输入验证失败: ${error.message}`;
    }

    if (error instanceof CalculatorError) {
        return error.message;
    }

    // Generic error message
    return '计算器遇到错误，请刷新页面重试或联系技术支持。';
}

/**
 * Wrap async function to automatically catch and log errors
 * @param fn - Async function to wrap
 * @param context - Error context
 * @returns Wrapped function
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(fn: T, context: Record<string, any> = {}): (...args: Parameters<T>) => Promise<ReturnType<T>> {
    return async function (this: any, ...args: Parameters<T>): Promise<ReturnType<T>> {
        try {
            return await fn.apply(this, args);
        } catch (error) {
            logError(error as Error, context);
            throw error;
        }
    };
}

/**
 * Try to execute function, return default value on failure
 * @param fn - Function to execute
 * @param defaultValue - Default value on failure
 * @param context - Error context
 * @returns Function result or default value
 */
export function tryOrDefault<T>(fn: () => T, defaultValue: T, context: Record<string, any> = {}): T {
    try {
        return fn();
    } catch (error) {
        logError(error as Error, { ...context, defaultValue });
        return defaultValue;
    }
}

/**
 * Global error handler setup
 */
export function setupGlobalErrorHandler(): void {
    window.addEventListener('error', (event: ErrorEvent) => {
        logError(event.error, {
            type: 'uncaught_error',
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
        });
    });

    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
        logError(event.reason, {
            type: 'unhandled_promise_rejection',
            promise: event.promise
        });
    });
}

// Set up global error handling on app start
if (typeof window !== 'undefined') {
    setupGlobalErrorHandler();
}
