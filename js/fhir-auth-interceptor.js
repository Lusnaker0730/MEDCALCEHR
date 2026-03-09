/**
 * FHIR Auth Interceptor — detects authentication errors from fhirclient responses
 * and notifies the token lifecycle manager.
 *
 * Exported utilities:
 *  - isAuthError(error)        — returns true for 401/403 / "Session expired" shapes
 *  - withAuthInterception(op)  — wraps an async FHIR call, triggering handleAuthFailure on auth errors
 */
import { tokenLifecycleManager } from './token-lifecycle-manager.js';
const AUTH_STATUS_CODES = new Set([401, 403]);
const AUTH_MESSAGE_PATTERNS = [
    /session expired/i,
    /token expired/i,
    /unauthorized/i,
    /invalid.*token/i,
    /login required/i,
];
/**
 * Determine whether an error represents an authentication / authorization failure.
 * Works with fhirclient HttpError, plain Error, OperationOutcome, or raw objects.
 */
export function isAuthError(error) {
    if (error == null)
        return false;
    // --- numeric status code --------------------------------------------------
    const status = error?.statusCode ??
        error?.status ??
        error?.response?.status;
    if (typeof status === 'number' && AUTH_STATUS_CODES.has(status)) {
        return true;
    }
    // --- error message string -------------------------------------------------
    const message = error?.message ??
        error?.statusText ??
        (typeof error === 'string' ? error : '');
    if (message && AUTH_MESSAGE_PATTERNS.some(p => p.test(message))) {
        return true;
    }
    // --- FHIR OperationOutcome inside error -----------------------------------
    const outcome = error?.outcome ??
        error?.body ??
        error?.data;
    if (outcome?.resourceType === 'OperationOutcome') {
        const issues = outcome.issue ?? [];
        for (const issue of issues) {
            const code = issue?.code;
            if (code === 'login' || code === 'expired') {
                return true;
            }
            const diag = issue?.diagnostics ?? '';
            if (AUTH_MESSAGE_PATTERNS.some(p => p.test(diag))) {
                return true;
            }
        }
    }
    return false;
}
/**
 * Execute an async FHIR operation.  If it throws an auth error, notify the
 * token lifecycle manager and re-throw. Non-auth errors are re-thrown as-is.
 *
 * @param operation  Async function that performs a FHIR call
 * @param _context    Optional label for logging (currently unused, reserved)
 */
export async function withAuthInterception(operation, _context) {
    try {
        return await operation();
    }
    catch (error) {
        if (isAuthError(error)) {
            const status = error?.statusCode ??
                error?.status ??
                error?.response?.status;
            tokenLifecycleManager.handleAuthFailure(status);
        }
        throw error;
    }
}
