/**
 * Tests for fhir-auth-interceptor.ts
 * Validates isAuthError() detection and withAuthInterception() wrapper.
 */
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockHandleAuthFailure = jest.fn();
jest.mock('../token-lifecycle-manager', () => ({
    tokenLifecycleManager: {
        handleAuthFailure: mockHandleAuthFailure,
    },
}));
jest.mock('../logger', () => ({
    logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        fatal: jest.fn(),
    },
}));
jest.mock('../session-manager', () => ({
    sessionManager: {
        getTimeoutMinutes: jest.fn().mockReturnValue(15),
        setEffectiveTimeout: jest.fn(),
        onLogout: jest.fn(),
        logout: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
    },
}));
// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------
import { isAuthError, withAuthInterception } from '../fhir-auth-interceptor.js';
// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('isAuthError', () => {
    test('should return false for null / undefined', () => {
        expect(isAuthError(null)).toBe(false);
        expect(isAuthError(undefined)).toBe(false);
    });
    test('should detect 401 status code', () => {
        expect(isAuthError({ status: 401 })).toBe(true);
        expect(isAuthError({ statusCode: 401 })).toBe(true);
        expect(isAuthError({ response: { status: 401 } })).toBe(true);
    });
    test('should detect 403 status code', () => {
        expect(isAuthError({ status: 403 })).toBe(true);
        expect(isAuthError({ statusCode: 403 })).toBe(true);
    });
    test('should not detect non-auth status codes', () => {
        expect(isAuthError({ status: 404 })).toBe(false);
        expect(isAuthError({ status: 500 })).toBe(false);
        expect(isAuthError({ status: 200 })).toBe(false);
    });
    test('should detect "Session expired" message', () => {
        expect(isAuthError({ message: 'Session expired' })).toBe(true);
        expect(isAuthError({ message: 'Your session expired, please log in again' })).toBe(true);
    });
    test('should detect "Token expired" message', () => {
        expect(isAuthError({ message: 'Token expired' })).toBe(true);
    });
    test('should detect "Unauthorized" message', () => {
        expect(isAuthError({ message: 'Unauthorized' })).toBe(true);
        expect(isAuthError({ statusText: 'Unauthorized' })).toBe(true);
    });
    test('should detect "invalid token" message', () => {
        expect(isAuthError({ message: 'Invalid access token' })).toBe(true);
    });
    test('should detect string errors', () => {
        expect(isAuthError('Session expired')).toBe(true);
        expect(isAuthError('unauthorized')).toBe(true);
    });
    test('should not detect network errors', () => {
        expect(isAuthError({ message: 'Network Error' })).toBe(false);
        expect(isAuthError({ message: 'Failed to fetch' })).toBe(false);
        expect(isAuthError(new TypeError('Failed to fetch'))).toBe(false);
    });
    test('should detect OperationOutcome with login issue code', () => {
        expect(isAuthError({
            outcome: {
                resourceType: 'OperationOutcome',
                issue: [{ severity: 'error', code: 'login' }],
            },
        })).toBe(true);
    });
    test('should detect OperationOutcome with expired issue code', () => {
        expect(isAuthError({
            outcome: {
                resourceType: 'OperationOutcome',
                issue: [{ severity: 'error', code: 'expired' }],
            },
        })).toBe(true);
    });
    test('should detect OperationOutcome with auth-related diagnostics', () => {
        expect(isAuthError({
            body: {
                resourceType: 'OperationOutcome',
                issue: [{ severity: 'error', code: 'security', diagnostics: 'Token expired for this session' }],
            },
        })).toBe(true);
    });
    test('should not detect OperationOutcome with unrelated issues', () => {
        expect(isAuthError({
            outcome: {
                resourceType: 'OperationOutcome',
                issue: [{ severity: 'error', code: 'not-found' }],
            },
        })).toBe(false);
    });
    test('should handle empty / malformed objects gracefully', () => {
        expect(isAuthError({})).toBe(false);
        expect(isAuthError({ outcome: {} })).toBe(false);
        expect(isAuthError({ outcome: { resourceType: 'Patient' } })).toBe(false);
    });
});
describe('withAuthInterception', () => {
    beforeEach(() => {
        mockHandleAuthFailure.mockClear();
    });
    test('should return the operation result on success', async () => {
        const result = await withAuthInterception(() => Promise.resolve('data'));
        expect(result).toBe('data');
        expect(mockHandleAuthFailure).not.toHaveBeenCalled();
    });
    test('should call handleAuthFailure and re-throw on auth error', async () => {
        const authErr = { status: 401, message: 'Unauthorized' };
        await expect(withAuthInterception(() => Promise.reject(authErr))).rejects.toEqual(authErr);
        expect(mockHandleAuthFailure).toHaveBeenCalledWith(401);
    });
    test('should re-throw non-auth errors without calling handleAuthFailure', async () => {
        const err = new Error('Network Error');
        await expect(withAuthInterception(() => Promise.reject(err))).rejects.toThrow('Network Error');
        expect(mockHandleAuthFailure).not.toHaveBeenCalled();
    });
    test('should extract status from statusCode property', async () => {
        const authErr = { statusCode: 403, message: 'Forbidden' };
        await expect(withAuthInterception(() => Promise.reject(authErr))).rejects.toEqual(authErr);
        expect(mockHandleAuthFailure).toHaveBeenCalledWith(403);
    });
    test('should pass undefined status when none is available', async () => {
        const authErr = { message: 'Session expired' };
        await expect(withAuthInterception(() => Promise.reject(authErr))).rejects.toEqual(authErr);
        expect(mockHandleAuthFailure).toHaveBeenCalledWith(undefined);
    });
});
