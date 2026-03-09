/**
 * Tests for token-lifecycle-manager.ts
 * Validates token state extraction, session sync, token clock, refresh,
 * BroadcastChannel, and graceful degradation.
 */
import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockGetTimeoutMinutes = jest.fn().mockReturnValue(15);
const mockSetEffectiveTimeout = jest.fn();
const mockOnLogout = jest.fn();
const mockLogout = jest.fn().mockResolvedValue(undefined);
jest.mock('../session-manager', () => ({
    sessionManager: {
        getTimeoutMinutes: mockGetTimeoutMinutes,
        setEffectiveTimeout: mockSetEffectiveTimeout,
        onLogout: mockOnLogout,
        logout: mockLogout,
        start: jest.fn(),
        stop: jest.fn(),
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
jest.mock('../audit-event-service', () => ({
    auditEventService: { logLogout: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('../security', () => ({
    clearEncryptionKeyCache: jest.fn(),
}));
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function createMockClient(overrides = {}) {
    return {
        state: {
            expiresAt: Date.now() + 600000, // 10 minutes from now
            tokenResponse: {
                refresh_token: 'mock-refresh-token',
            },
            ...overrides,
        },
        refresh: jest.fn(),
    };
}
async function importModule() {
    const mod = await import('../token-lifecycle-manager.js');
    return mod;
}
// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------
describe('TokenLifecycleManager', () => {
    let tokenLifecycleManager;
    beforeEach(async () => {
        jest.resetModules();
        jest.restoreAllMocks();
        jest.useFakeTimers();
        mockGetTimeoutMinutes.mockReturnValue(15);
        mockSetEffectiveTimeout.mockClear();
        mockOnLogout.mockClear();
        mockLogout.mockClear();
        delete window.MEDCALC_CONFIG;
        // Remove any leftover overlays
        document.getElementById('token-warning-overlay')?.remove();
        Object.defineProperty(window, 'location', {
            value: { href: 'http://localhost/index.html', hostname: 'localhost', origin: 'http://localhost' },
            writable: true,
            configurable: true,
        });
        const mod = await importModule();
        tokenLifecycleManager = mod.tokenLifecycleManager;
    });
    afterEach(() => {
        tokenLifecycleManager.destroy();
        jest.useRealTimers();
    });
    // ======================================================================
    // 1. Token state extraction
    // ======================================================================
    describe('Token state extraction', () => {
        test('should extract expiresAt when present in client state', () => {
            const client = createMockClient({ expiresAt: Date.now() + 300000 });
            tokenLifecycleManager.initialize(client);
            const remaining = tokenLifecycleManager.getSecondsRemaining();
            expect(remaining).not.toBeNull();
            expect(remaining).toBeGreaterThan(290);
            expect(remaining).toBeLessThanOrEqual(300);
        });
        test('should compute expiresAt from expires_in when expiresAt is absent', () => {
            const client = createMockClient({
                expiresAt: undefined,
                tokenResponse: { expires_in: 600, refresh_token: 'rt' },
            });
            tokenLifecycleManager.initialize(client);
            const remaining = tokenLifecycleManager.getSecondsRemaining();
            expect(remaining).not.toBeNull();
            expect(remaining).toBeGreaterThan(590);
        });
        test('should return null remaining when no token info available', () => {
            const client = createMockClient({
                expiresAt: undefined,
                tokenResponse: {},
            });
            tokenLifecycleManager.initialize(client);
            expect(tokenLifecycleManager.getSecondsRemaining()).toBeNull();
        });
        test('should detect hasRefreshToken', () => {
            const client = createMockClient();
            tokenLifecycleManager.initialize(client);
            expect(tokenLifecycleManager.isTokenValid()).toBe(true);
        });
        test('should detect expired token', () => {
            const client = createMockClient({ expiresAt: Date.now() - 1000 });
            tokenLifecycleManager.initialize(client);
            expect(tokenLifecycleManager.isTokenValid()).toBe(false);
        });
    });
    // ======================================================================
    // 2. Session timeout sync
    // ======================================================================
    describe('Session timeout sync', () => {
        test('should set effective timeout when token TTL < session timeout', () => {
            // Token expires in 5 minutes, session timeout is 15 minutes
            const client = createMockClient({ expiresAt: Date.now() + 5 * 60000 });
            tokenLifecycleManager.initialize(client);
            expect(mockSetEffectiveTimeout).toHaveBeenCalledWith(5);
        });
        test('should not change timeout when token TTL > session timeout', () => {
            // Token expires in 20 minutes, session timeout is 15 minutes
            const client = createMockClient({ expiresAt: Date.now() + 20 * 60000 });
            tokenLifecycleManager.initialize(client);
            expect(mockSetEffectiveTimeout).not.toHaveBeenCalled();
        });
        test('should not call setEffectiveTimeout when expiresAt is unknown', () => {
            const client = createMockClient({
                expiresAt: undefined,
                tokenResponse: {},
            });
            tokenLifecycleManager.initialize(client);
            expect(mockSetEffectiveTimeout).not.toHaveBeenCalled();
        });
    });
    // ======================================================================
    // 3. Token clock & warning
    // ======================================================================
    describe('Token clock', () => {
        test('should show warning when token is within warningSeconds of expiry', () => {
            // Token expires in 90 seconds (< default 120s warning threshold)
            const client = createMockClient({
                expiresAt: Date.now() + 90000,
                tokenResponse: {}, // no refresh token
            });
            tokenLifecycleManager.initialize(client);
            // Advance past one check interval
            jest.advanceTimersByTime(30000);
            expect(document.getElementById('token-warning-overlay')).not.toBeNull();
        });
        test('should not show warning when token has plenty of time', () => {
            const client = createMockClient({ expiresAt: Date.now() + 600000 });
            tokenLifecycleManager.initialize(client);
            jest.advanceTimersByTime(30000);
            expect(document.getElementById('token-warning-overlay')).toBeNull();
        });
        test('should call handleAuthFailure when token expires and no refresh token', () => {
            const client = createMockClient({
                expiresAt: Date.now() + 15000, // 15 seconds
                tokenResponse: {}, // no refresh token
            });
            tokenLifecycleManager.initialize(client);
            // Advance past expiry
            jest.advanceTimersByTime(30000);
            expect(mockLogout).toHaveBeenCalled();
        });
        test('should respect custom tokenWarningSeconds config', async () => {
            jest.resetModules();
            window.MEDCALC_CONFIG = {
                session: { tokenWarningSeconds: 60 },
            };
            const mod = await importModule();
            const manager = mod.tokenLifecycleManager;
            // Token expires in 120 seconds — after 30s remaining=90s > 60s threshold
            const client = createMockClient({
                expiresAt: Date.now() + 120000,
                tokenResponse: {},
            });
            manager.initialize(client);
            jest.advanceTimersByTime(30000);
            expect(document.getElementById('token-warning-overlay')).toBeNull();
            // Advance more — now remaining ≈ 60s, should warn
            jest.advanceTimersByTime(30000);
            expect(document.getElementById('token-warning-overlay')).not.toBeNull();
            manager.destroy();
        });
    });
    // ======================================================================
    // 4. Token refresh
    // ======================================================================
    describe('Token refresh', () => {
        test('should update state on successful refresh', async () => {
            const newExpiry = Date.now() + 3600000;
            const client = createMockClient({ expiresAt: Date.now() + 100000 });
            client.refresh.mockResolvedValue({
                state: {
                    expiresAt: newExpiry,
                    tokenResponse: { refresh_token: 'new-rt' },
                },
            });
            tokenLifecycleManager.initialize(client);
            const ok = await tokenLifecycleManager.tryRefresh();
            expect(ok).toBe(true);
            const remaining = tokenLifecycleManager.getSecondsRemaining();
            expect(remaining).toBeGreaterThan(3500);
        });
        test('should return false when no refresh token', async () => {
            const client = createMockClient({
                tokenResponse: {}, // no refresh token
            });
            tokenLifecycleManager.initialize(client);
            const ok = await tokenLifecycleManager.tryRefresh();
            expect(ok).toBe(false);
        });
        test('should return false when refresh throws', async () => {
            const client = createMockClient();
            client.refresh.mockRejectedValue(new Error('refresh failed'));
            tokenLifecycleManager.initialize(client);
            const ok = await tokenLifecycleManager.tryRefresh();
            expect(ok).toBe(false);
        });
    });
    // ======================================================================
    // 5. BroadcastChannel
    // ======================================================================
    describe('BroadcastChannel', () => {
        test('should register onLogout callback with session manager', () => {
            const client = createMockClient();
            tokenLifecycleManager.initialize(client);
            expect(mockOnLogout).toHaveBeenCalledWith(expect.any(Function));
        });
        test('should handle missing BroadcastChannel gracefully', async () => {
            const originalBC = globalThis.BroadcastChannel;
            // @ts-ignore
            delete globalThis.BroadcastChannel;
            jest.resetModules();
            const mod = await importModule();
            const manager = mod.tokenLifecycleManager;
            expect(() => {
                manager.initialize(createMockClient());
            }).not.toThrow();
            manager.destroy();
            globalThis.BroadcastChannel = originalBC;
        });
    });
    // ======================================================================
    // 6. Visibility change
    // ======================================================================
    describe('Visibility change', () => {
        test('should check token expiry when tab becomes visible', () => {
            const client = createMockClient({ expiresAt: Date.now() + 60000 });
            tokenLifecycleManager.initialize(client);
            // Simulate tab coming back to foreground
            Object.defineProperty(document, 'visibilityState', {
                value: 'visible',
                configurable: true,
            });
            document.dispatchEvent(new Event('visibilitychange'));
            // No crash, method executed (we can't easily assert internal state
            // but we can verify no error thrown)
            expect(tokenLifecycleManager.isTokenValid()).toBe(true);
        });
    });
    // ======================================================================
    // 7. Disable via config
    // ======================================================================
    describe('Disable via config', () => {
        test('should not start token clock when disableTokenLifecycle is true', async () => {
            jest.resetModules();
            window.MEDCALC_CONFIG = {
                session: { disableTokenLifecycle: true },
            };
            const mod = await importModule();
            const manager = mod.tokenLifecycleManager;
            const client = createMockClient({ expiresAt: Date.now() + 30000 });
            manager.initialize(client);
            // Even after enough time, no warning should appear
            jest.advanceTimersByTime(60000);
            expect(document.getElementById('token-warning-overlay')).toBeNull();
            // Remaining should be null because manager is disabled
            expect(manager.getSecondsRemaining()).toBeNull();
            manager.destroy();
        });
    });
    // ======================================================================
    // 8. Backwards compatibility
    // ======================================================================
    describe('Backwards compatibility', () => {
        test('should work with no token info (inactivity-only)', () => {
            const client = createMockClient({
                expiresAt: undefined,
                tokenResponse: {},
            });
            tokenLifecycleManager.initialize(client);
            expect(tokenLifecycleManager.getSecondsRemaining()).toBeNull();
            expect(tokenLifecycleManager.isTokenValid()).toBe(true);
            // Advancing time should not cause errors
            jest.advanceTimersByTime(60000);
            expect(document.getElementById('token-warning-overlay')).toBeNull();
        });
        test('should work with no client state at all', () => {
            const client = { state: undefined };
            tokenLifecycleManager.initialize(client);
            expect(tokenLifecycleManager.getSecondsRemaining()).toBeNull();
            expect(tokenLifecycleManager.isTokenValid()).toBe(true);
        });
    });
    // ======================================================================
    // 9. destroy()
    // ======================================================================
    describe('destroy()', () => {
        test('should clear timers and remove visibility listener', () => {
            const removeSpy = jest.spyOn(document, 'removeEventListener');
            const client = createMockClient();
            tokenLifecycleManager.initialize(client);
            tokenLifecycleManager.destroy();
            const removedEvents = removeSpy.mock.calls.map(c => c[0]);
            expect(removedEvents).toContain('visibilitychange');
        });
        test('should remove token warning overlay on destroy', () => {
            const client = createMockClient({
                expiresAt: Date.now() + 90000,
                tokenResponse: {},
            });
            tokenLifecycleManager.initialize(client);
            jest.advanceTimersByTime(30000);
            expect(document.getElementById('token-warning-overlay')).not.toBeNull();
            tokenLifecycleManager.destroy();
            expect(document.getElementById('token-warning-overlay')).toBeNull();
        });
        test('calling destroy() multiple times should not throw', () => {
            tokenLifecycleManager.initialize(createMockClient());
            expect(() => {
                tokenLifecycleManager.destroy();
                tokenLifecycleManager.destroy();
            }).not.toThrow();
        });
    });
    // ======================================================================
    // 10. handleAuthFailure()
    // ======================================================================
    describe('handleAuthFailure()', () => {
        test('should call sessionManager.logout()', () => {
            tokenLifecycleManager.initialize(createMockClient());
            tokenLifecycleManager.handleAuthFailure(401);
            expect(mockLogout).toHaveBeenCalled();
        });
    });
});
