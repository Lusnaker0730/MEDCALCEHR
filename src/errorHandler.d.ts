export declare class CalculatorError extends Error {
    code: string;
    details: any;
    timestamp: Date;
    constructor(message: string, code: string, details?: any);
}
export declare class FHIRDataError extends CalculatorError {
    constructor(message: string, details?: any);
}
export declare class ValidationError extends CalculatorError {
    constructor(message: string, details?: any);
}
export declare function logError(error: Error, context?: any): any;
export declare function displayError(container: HTMLElement, error: Error, userMessage?: string | null): void;
export declare function withErrorHandling<T extends (...args: any[]) => Promise<any>>(fn: T, context?: any): T;
export declare function tryOrDefault<T>(fn: () => T, defaultValue: T, context?: any): T;
export declare function setupGlobalErrorHandler(): void;
