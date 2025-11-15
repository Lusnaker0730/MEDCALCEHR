// js/errorHandler.js

/**
 * 自定义计算器错误类
 * @extends Error
 */
export class CalculatorError extends Error {
    /**
     * 创建计算器错误实例
     * @param {string} message - 错误消息
     * @param {string} code - 错误代码
     * @param {Object} details - 错误详情
     */
    constructor(message, code, details = {}) {
        super(message);
        this.name = 'CalculatorError';
        this.code = code;
        this.details = details;
        this.timestamp = new Date();
    }
}

/**
 * FHIR 数据错误类
 * @extends CalculatorError
 */
export class FHIRDataError extends CalculatorError {
    constructor(message, details = {}) {
        super(message, 'FHIR_DATA_ERROR', details);
        this.name = 'FHIRDataError';
    }
}

/**
 * 输入验证错误类
 * @extends CalculatorError
 */
export class ValidationError extends CalculatorError {
    constructor(message, details = {}) {
        super(message, 'VALIDATION_ERROR', details);
        this.name = 'ValidationError';
    }
}

/**
 * 记录错误到控制台和可选的日志服务
 * @param {Error} error - 错误对象
 * @param {Object} context - 错误上下文信息
 */
export function logError(error, context = {}) {
    const errorLog = {
        name: error.name || 'Error',
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString(),
        context: context,
        userAgent: navigator.userAgent,
        url: window.location.href,
        stack: error.stack
    };

    // 在开发环境中详细记录
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.group('🚨 Error Logged');
        console.error('Error:', error);
        console.log('Context:', context);
        console.log('Full Log:', errorLog);
        console.groupEnd();
    } else {
        // 生产环境仅记录简要信息
        console.error(`[${errorLog.code}] ${errorLog.message}`);
    }

    // 可选: 发送到日志服务 (如 Sentry, LogRocket 等)
    // sendToLoggingService(errorLog);

    return errorLog;
}

/**
 * 显示用户友好的错误消息
 * @param {HTMLElement} container - 显示错误的容器元素
 * @param {Error} error - 错误对象
 * @param {string} userMessage - 用户友好的错误消息
 */
export function displayError(container, error, userMessage = null) {
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
            ${
                window.location.hostname === 'localhost'
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
 * 获取用户友好的错误消息
 * @param {Error} error - 错误对象
 * @returns {string} 用户友好的错误消息
 */
function getUserFriendlyMessage(error) {
    if (error instanceof FHIRDataError) {
        return '无法从电子病历系统获取患者数据。请检查连接或手动输入数据。';
    }

    if (error instanceof ValidationError) {
        return `输入验证失败: ${error.message}`;
    }

    if (error instanceof CalculatorError) {
        return error.message;
    }

    // 通用错误消息
    return '计算器遇到错误，请刷新页面重试或联系技术支持。';
}

/**
 * 包装异步函数，自动捕获和记录错误
 * @param {Function} fn - 要包装的异步函数
 * @param {Object} context - 错误上下文
 * @returns {Function} 包装后的函数
 */
export function withErrorHandling(fn, context = {}) {
    return async function (...args) {
        try {
            return await fn.apply(this, args);
        } catch (error) {
            logError(error, context);
            throw error;
        }
    };
}

/**
 * 尝试执行函数，失败时返回默认值
 * @param {Function} fn - 要执行的函数
 * @param {*} defaultValue - 失败时的默认值
 * @param {Object} context - 错误上下文
 * @returns {*} 函数执行结果或默认值
 */
export function tryOrDefault(fn, defaultValue, context = {}) {
    try {
        return fn();
    } catch (error) {
        logError(error, { ...context, defaultValue });
        return defaultValue;
    }
}

/**
 * 全局错误处理器
 */
export function setupGlobalErrorHandler() {
    window.addEventListener('error', event => {
        logError(event.error, {
            type: 'uncaught_error',
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
        });
    });

    window.addEventListener('unhandledrejection', event => {
        logError(event.reason, {
            type: 'unhandled_promise_rejection',
            promise: event.promise
        });
    });
}

// 在应用启动时设置全局错误处理
if (typeof window !== 'undefined') {
    setupGlobalErrorHandler();
}
