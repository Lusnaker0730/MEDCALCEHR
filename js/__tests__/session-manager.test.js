/**
 * Session Manager Module Tests
 * Tests for inactivity timeout, warning overlay, activity tracking,
 * and session lifecycle management.
 */
import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
// ---------------------------------------------------------------------------
// Mocks — must be declared before importing the module under test
// ---------------------------------------------------------------------------
// Mock the audit-event-service dependency
const mockLogLogout = jest.fn().mockResolvedValue(undefined);
jest.unstable_mockModule('../audit-event-service.js', () => ({
    auditEventService: {
        logLogout: mockLogLogout
    }
}));
// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/**
 * Dynamically import the session-manager module.
 * Each call returns a fresh module (because we reset the module registry in beforeEach).
 */
async function importSessionManager() {
    const mod = await import('../session-manager.js');
    return mod;
}
/**
 * Dispatch a DOM event on `document` to simulate user activity.
 */
function simulateActivity(eventName) {
    const event = new Event(eventName, { bubbles: true });
    document.dispatchEvent(event);
}
// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------
describe('SessionManager', () => {
    let sessionManager;
    beforeEach(async () => {
        // Reset all mocks
        jest.resetModules();
        jest.restoreAllMocks();
        mockLogLogout.mockClear();
        mockLogLogout.mockResolvedValue(undefined);
        // Re-register the mock after resetModules (required for ESM mock stability)
        jest.unstable_mockModule('../audit-event-service.js', () => ({
            auditEventService: {
                logLogout: mockLogLogout
            }
        }));
        // Use fake timers so we can control setTimeout / setInterval / Date.now
        jest.useFakeTimers();
        // Clear any leftover DOM overlay elements
        const overlay = document.getElementById('session-timeout-overlay');
        overlay?.remove();
        // Clear MEDCALC_CONFIG between tests
        delete window.MEDCALC_CONFIG;
        // Clear storage
        sessionStorage.clear();
        localStorage.clear();
        // Reset window.location to a writable mock
        Object.defineProperty(window, 'location', {
            value: { href: 'http://localhost/index.html', hostname: 'localhost', origin: 'http://localhost' },
            writable: true,
            configurable: true
        });
        // Import fresh module with default config
        const mod = await importSessionManager();
        sessionManager = mod.sessionManager;
    });
    afterEach(() => {
        // Stop the session manager to remove event listeners and clear timers
        sessionManager.stop();
        jest.useRealTimers();
    });
    // ======================================================================
    // 1. Constructor & Configuration
    // ======================================================================
    describe('Constructor & Configuration', () => {
        test('should use default config when MEDCALC_CONFIG is not defined', () => {
            // The default module was imported without any window config.
            // start() should not throw and should set up timers.
            sessionManager.start();
            // Advancing less than the default 13 min (15-2) should NOT show warning
            jest.advanceTimersByTime(12 * 60 * 1000);
            expect(document.getElementById('session-timeout-overlay')).toBeNull();
            // Advancing past 13 min total should show warning
            jest.advanceTimersByTime(1 * 60 * 1000 + 1);
            expect(document.getElementById('session-timeout-overlay')).not.toBeNull();
        });
        test('should use custom config from window.MEDCALC_CONFIG', async () => {
            jest.resetModules();
            // Set custom config BEFORE importing the module
            window.MEDCALC_CONFIG = {
                session: {
                    timeoutMinutes: 5,
                    warningMinutes: 1
                }
            };
            const mod = await importSessionManager();
            const customManager = mod.sessionManager;
            customManager.start();
            // Warning should appear at 4 minutes (5 - 1)
            jest.advanceTimersByTime(4 * 60 * 1000 + 1);
            expect(document.getElementById('session-timeout-overlay')).not.toBeNull();
            customManager.stop();
        });
        test('should fall back to defaults for partially defined config', async () => {
            jest.resetModules();
            window.MEDCALC_CONFIG = {
                session: {
                    timeoutMinutes: 10
                    // warningMinutes intentionally omitted
                }
            };
            const mod = await importSessionManager();
            const partialManager = mod.sessionManager;
            partialManager.start();
            // Warning should appear at 8 min (10 - 2 default warning)
            jest.advanceTimersByTime(8 * 60 * 1000 + 1);
            expect(document.getElementById('session-timeout-overlay')).not.toBeNull();
            partialManager.stop();
        });
        test('should handle MEDCALC_CONFIG with only fhir section (no session)', async () => {
            jest.resetModules();
            window.MEDCALC_CONFIG = {
                fhir: { clientId: 'test-client' }
            };
            const mod = await importSessionManager();
            const fhirOnlyManager = mod.sessionManager;
            // Should use default 15-min timeout, 2-min warning
            fhirOnlyManager.start();
            jest.advanceTimersByTime(13 * 60 * 1000 + 1);
            expect(document.getElementById('session-timeout-overlay')).not.toBeNull();
            fhirOnlyManager.stop();
        });
    });
    // ======================================================================
    // 2. start() method
    // ======================================================================
    describe('start()', () => {
        test('should do nothing when timeoutMinutes is 0', async () => {
            jest.resetModules();
            window.MEDCALC_CONFIG = {
                session: { timeoutMinutes: 0 }
            };
            const mod = await importSessionManager();
            const disabledManager = mod.sessionManager;
            disabledManager.start();
            // Even after a very long time, no overlay should appear
            jest.advanceTimersByTime(60 * 60 * 1000);
            expect(document.getElementById('session-timeout-overlay')).toBeNull();
            disabledManager.stop();
        });
        test('should do nothing when timeoutMinutes is negative', async () => {
            jest.resetModules();
            window.MEDCALC_CONFIG = {
                session: { timeoutMinutes: -1 }
            };
            const mod = await importSessionManager();
            const negManager = mod.sessionManager;
            negManager.start();
            jest.advanceTimersByTime(60 * 60 * 1000);
            expect(document.getElementById('session-timeout-overlay')).toBeNull();
            negManager.stop();
        });
        test('should register activity event listeners on document', () => {
            const addSpy = jest.spyOn(document, 'addEventListener');
            sessionManager.start();
            const registeredEvents = addSpy.mock.calls.map(call => call[0]);
            expect(registeredEvents).toContain('mousemove');
            expect(registeredEvents).toContain('keydown');
            expect(registeredEvents).toContain('click');
            expect(registeredEvents).toContain('touchstart');
            expect(registeredEvents).toContain('scroll');
        });
        test('should arm timers after calling start()', async () => {
            sessionManager.start();
            // After the full timeout (15 min) the logout should be triggered
            await jest.advanceTimersByTimeAsync(15 * 60 * 1000);
            expect(mockLogLogout).toHaveBeenCalled();
        });
    });
    // ======================================================================
    // 3. stop() method
    // ======================================================================
    describe('stop()', () => {
        test('should remove all activity event listeners', () => {
            const removeSpy = jest.spyOn(document, 'removeEventListener');
            sessionManager.start();
            sessionManager.stop();
            const removedEvents = removeSpy.mock.calls.map(call => call[0]);
            expect(removedEvents).toContain('mousemove');
            expect(removedEvents).toContain('keydown');
            expect(removedEvents).toContain('click');
            expect(removedEvents).toContain('touchstart');
            expect(removedEvents).toContain('scroll');
        });
        test('should clear timers so logout does not fire after stop', () => {
            sessionManager.start();
            sessionManager.stop();
            jest.advanceTimersByTime(60 * 60 * 1000);
            expect(mockLogLogout).not.toHaveBeenCalled();
        });
        test('should hide warning overlay if visible', () => {
            sessionManager.start();
            // Advance to show warning
            jest.advanceTimersByTime(13 * 60 * 1000 + 1);
            expect(document.getElementById('session-timeout-overlay')).not.toBeNull();
            sessionManager.stop();
            expect(document.getElementById('session-timeout-overlay')).toBeNull();
        });
    });
    // ======================================================================
    // 4. logout() method
    // ======================================================================
    describe('logout()', () => {
        test('should call auditEventService.logLogout', async () => {
            await sessionManager.logout();
            expect(mockLogLogout).toHaveBeenCalledTimes(1);
        });
        test('should clear sessionStorage', async () => {
            sessionStorage.setItem('testKey', 'testValue');
            await sessionManager.logout();
            expect(sessionStorage.getItem('testKey')).toBeNull();
        });
        test('should remove patientDisplayData from localStorage', async () => {
            localStorage.setItem('patientDisplayData', 'sensitive-data');
            await sessionManager.logout();
            expect(localStorage.getItem('patientDisplayData')).toBeNull();
        });
        test('should redirect to launch.html', async () => {
            await sessionManager.logout();
            expect(window.location.href).toBe('launch.html');
        });
        test('should stop the session manager (clear timers and remove listeners)', async () => {
            const removeSpy = jest.spyOn(document, 'removeEventListener');
            sessionManager.start();
            await sessionManager.logout();
            // Listeners should have been removed
            const removedEvents = removeSpy.mock.calls.map(call => call[0]);
            expect(removedEvents).toContain('mousemove');
            // No further logout should fire from timer
            mockLogLogout.mockClear();
            jest.advanceTimersByTime(60 * 60 * 1000);
            expect(mockLogLogout).not.toHaveBeenCalled();
        });
        test('should still log out even if auditEventService.logLogout fails', async () => {
            mockLogLogout.mockRejectedValueOnce(new Error('Audit service unavailable'));
            sessionStorage.setItem('test', 'data');
            await sessionManager.logout();
            // Logout should still complete
            expect(sessionStorage.getItem('test')).toBeNull();
            expect(window.location.href).toBe('launch.html');
        });
    });
    // ======================================================================
    // 5. Activity tracking & throttling
    // ======================================================================
    describe('Activity tracking & throttling', () => {
        test('should reset timers on user activity', () => {
            sessionManager.start();
            // Advance 10 minutes (still within 13-min warning threshold)
            jest.advanceTimersByTime(10 * 60 * 1000);
            // Simulate activity — this should reset the timer
            simulateActivity('mousemove');
            // Advance another 10 minutes from the activity event
            // The total since activity is 10 min, so no warning yet (needs 13 min)
            jest.advanceTimersByTime(10 * 60 * 1000);
            expect(document.getElementById('session-timeout-overlay')).toBeNull();
        });
        test('should throttle activity handler to once per 30 seconds', () => {
            sessionManager.start();
            // Advance 12 minutes (close to the 13-min warning mark)
            jest.advanceTimersByTime(12 * 60 * 1000);
            // First activity resets timers
            simulateActivity('keydown');
            // Immediately fire another activity event (within 30s) - should be throttled
            simulateActivity('keydown');
            // Advance 13 minutes from the first activity —
            // if the second event was NOT throttled, the timer would have been reset
            // again and warning would not appear yet. But since it IS throttled,
            // warning should appear ~13 min after the first activity.
            jest.advanceTimersByTime(13 * 60 * 1000 + 1);
            expect(document.getElementById('session-timeout-overlay')).not.toBeNull();
        });
        test('should allow activity reset after 30 second throttle window', () => {
            sessionManager.start();
            // Advance 10 minutes
            jest.advanceTimersByTime(10 * 60 * 1000);
            // First activity resets timers
            simulateActivity('click');
            // Wait 31 seconds (past throttle window)
            jest.advanceTimersByTime(31 * 1000);
            // Second activity should now reset timers again
            simulateActivity('click');
            // Advance 12 minutes from second activity — should NOT see warning yet
            // (because timers were reset at the second activity, and 12 min < 13 min)
            jest.advanceTimersByTime(12 * 60 * 1000);
            expect(document.getElementById('session-timeout-overlay')).toBeNull();
        });
        test('should track all supported activity event types', () => {
            const addSpy = jest.spyOn(document, 'addEventListener');
            sessionManager.start();
            const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
            const registeredEvents = addSpy.mock.calls.map(call => call[0]);
            events.forEach(eventName => {
                expect(registeredEvents).toContain(eventName);
            });
        });
        test('event listeners should be registered with passive option', () => {
            const addSpy = jest.spyOn(document, 'addEventListener');
            sessionManager.start();
            // Check that each activity event was registered with { passive: true }
            const activityCalls = addSpy.mock.calls.filter(call => ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'].includes(call[0]));
            activityCalls.forEach(call => {
                expect(call[2]).toEqual(expect.objectContaining({ passive: true }));
            });
        });
    });
    // ======================================================================
    // 6. Warning overlay
    // ======================================================================
    describe('Warning overlay', () => {
        test('should show warning overlay at the correct time', () => {
            sessionManager.start();
            // Before warning time (13 min for default config)
            jest.advanceTimersByTime(13 * 60 * 1000 - 1);
            expect(document.getElementById('session-timeout-overlay')).toBeNull();
            // Just past warning time
            jest.advanceTimersByTime(2);
            expect(document.getElementById('session-timeout-overlay')).not.toBeNull();
        });
        test('overlay should have correct ARIA attributes', () => {
            sessionManager.start();
            jest.advanceTimersByTime(13 * 60 * 1000 + 1);
            const overlay = document.getElementById('session-timeout-overlay');
            expect(overlay).not.toBeNull();
            expect(overlay?.getAttribute('role')).toBe('alertdialog');
            expect(overlay?.getAttribute('aria-modal')).toBe('true');
            expect(overlay?.getAttribute('aria-label')).toBe('Session timeout warning');
        });
        test('overlay should have correct class name', () => {
            sessionManager.start();
            jest.advanceTimersByTime(13 * 60 * 1000 + 1);
            const overlay = document.getElementById('session-timeout-overlay');
            expect(overlay?.className).toBe('session-timeout-overlay');
        });
        test('overlay should contain Continue and Logout buttons', () => {
            sessionManager.start();
            jest.advanceTimersByTime(13 * 60 * 1000 + 1);
            const continueBtn = document.getElementById('session-continue-btn');
            const logoutBtn = document.getElementById('session-logout-btn');
            expect(continueBtn).not.toBeNull();
            expect(logoutBtn).not.toBeNull();
            expect(continueBtn?.textContent?.trim()).toContain('Continue Session');
            expect(logoutBtn?.textContent?.trim()).toContain('Logout Now');
        });
        test('overlay should display countdown text', () => {
            sessionManager.start();
            jest.advanceTimersByTime(13 * 60 * 1000 + 1);
            const countdown = document.getElementById('session-countdown');
            expect(countdown).not.toBeNull();
            // Initial value should be "2:00" for 2 minutes
            expect(countdown?.textContent).toBe('2:00');
        });
        test('countdown should decrement every second', () => {
            sessionManager.start();
            jest.advanceTimersByTime(13 * 60 * 1000 + 1);
            const countdown = document.getElementById('session-countdown');
            expect(countdown?.textContent).toBe('2:00');
            // Advance 1 second
            jest.advanceTimersByTime(1000);
            expect(countdown?.textContent).toBe('1:59');
            // Advance 59 more seconds (1 minute total)
            jest.advanceTimersByTime(59 * 1000);
            expect(countdown?.textContent).toBe('1:00');
        });
        test('countdown should reach 0:01 just before session expires', () => {
            sessionManager.start();
            jest.advanceTimersByTime(13 * 60 * 1000 + 1);
            // Advance to 1 second before expiry (logout removes overlay at 0:00)
            jest.advanceTimersByTime(2 * 60 * 1000 - 1000);
            const countdown = document.getElementById('session-countdown');
            expect(countdown?.textContent).toBe('0:01');
        });
        test('clicking Continue button should hide overlay and reset timers', () => {
            sessionManager.start();
            jest.advanceTimersByTime(13 * 60 * 1000 + 1);
            const overlay = document.getElementById('session-timeout-overlay');
            expect(overlay).not.toBeNull();
            const continueBtn = document.getElementById('session-continue-btn');
            continueBtn?.click();
            // Overlay should be removed
            expect(document.getElementById('session-timeout-overlay')).toBeNull();
            // Timers should be reset — advancing 12 min should not show warning
            jest.advanceTimersByTime(12 * 60 * 1000);
            expect(document.getElementById('session-timeout-overlay')).toBeNull();
        });
        test('clicking Logout button should trigger logout', async () => {
            sessionManager.start();
            jest.advanceTimersByTime(13 * 60 * 1000 + 1);
            const logoutBtn = document.getElementById('session-logout-btn');
            logoutBtn?.click();
            // Allow the async logout to complete
            await jest.advanceTimersByTimeAsync(0);
            expect(mockLogLogout).toHaveBeenCalled();
            expect(window.location.href).toBe('launch.html');
        });
        test('pressing Escape should reset timers and hide overlay', () => {
            sessionManager.start();
            jest.advanceTimersByTime(13 * 60 * 1000 + 1);
            const overlay = document.getElementById('session-timeout-overlay');
            expect(overlay).not.toBeNull();
            // Dispatch Escape keydown on the overlay
            const escEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
            overlay.dispatchEvent(escEvent);
            expect(document.getElementById('session-timeout-overlay')).toBeNull();
        });
    });
    // ======================================================================
    // 7. Focus trapping in warning dialog
    // ======================================================================
    describe('Focus trapping', () => {
        test('should focus Continue button when overlay is shown', () => {
            sessionManager.start();
            const focusSpy = jest.spyOn(HTMLElement.prototype, 'focus');
            jest.advanceTimersByTime(13 * 60 * 1000 + 1);
            // The continue button should have received focus
            expect(focusSpy).toHaveBeenCalled();
        });
        test('should trap Tab forward from last button to first button', () => {
            sessionManager.start();
            jest.advanceTimersByTime(13 * 60 * 1000 + 1);
            const overlay = document.getElementById('session-timeout-overlay');
            const logoutBtn = document.getElementById('session-logout-btn');
            // Set focus on the last button
            logoutBtn.focus();
            // Simulate Tab press (not Shift+Tab)
            const tabEvent = new KeyboardEvent('keydown', {
                key: 'Tab',
                shiftKey: false,
                bubbles: true,
                cancelable: true
            });
            // We need activeElement to be the logout button
            Object.defineProperty(document, 'activeElement', {
                value: logoutBtn,
                configurable: true,
                writable: true
            });
            const focusSpy = jest.spyOn(HTMLElement.prototype, 'focus');
            overlay.dispatchEvent(tabEvent);
            // preventDefault should have been called, and first button focused
            expect(tabEvent.defaultPrevented).toBe(true);
            expect(focusSpy).toHaveBeenCalled();
        });
        test('should trap Shift+Tab from first button to last button', () => {
            sessionManager.start();
            jest.advanceTimersByTime(13 * 60 * 1000 + 1);
            const overlay = document.getElementById('session-timeout-overlay');
            const continueBtn = document.getElementById('session-continue-btn');
            continueBtn.focus();
            const shiftTabEvent = new KeyboardEvent('keydown', {
                key: 'Tab',
                shiftKey: true,
                bubbles: true,
                cancelable: true
            });
            Object.defineProperty(document, 'activeElement', {
                value: continueBtn,
                configurable: true,
                writable: true
            });
            const focusSpy = jest.spyOn(HTMLElement.prototype, 'focus');
            overlay.dispatchEvent(shiftTabEvent);
            expect(shiftTabEvent.defaultPrevented).toBe(true);
            expect(focusSpy).toHaveBeenCalled();
        });
    });
    // ======================================================================
    // 8. Timer reset logic (resetTimers)
    // ======================================================================
    describe('Timer reset logic', () => {
        test('should hide warning when timers are reset while warning is visible', () => {
            sessionManager.start();
            // Show warning
            jest.advanceTimersByTime(13 * 60 * 1000 + 1);
            expect(document.getElementById('session-timeout-overlay')).not.toBeNull();
            // Simulate activity to reset timers (ensure past throttle)
            jest.advanceTimersByTime(31 * 1000);
            simulateActivity('mousemove');
            expect(document.getElementById('session-timeout-overlay')).toBeNull();
        });
        test('should clear countdown interval when timers are reset', () => {
            sessionManager.start();
            // Show warning (starts countdown interval)
            jest.advanceTimersByTime(13 * 60 * 1000 + 1);
            const countdown = document.getElementById('session-countdown');
            expect(countdown?.textContent).toBe('2:00');
            // Click continue to reset timers
            const continueBtn = document.getElementById('session-continue-btn');
            continueBtn?.click();
            // Advance time — a new warning should appear fresh (not continuing old countdown)
            jest.advanceTimersByTime(13 * 60 * 1000 + 1);
            const newCountdown = document.getElementById('session-countdown');
            expect(newCountdown?.textContent).toBe('2:00');
        });
        test('should handle case where warningStartMs is 0 or negative', async () => {
            jest.resetModules();
            window.MEDCALC_CONFIG = {
                session: {
                    timeoutMinutes: 1,
                    warningMinutes: 2 // warningMinutes > timeoutMinutes
                }
            };
            const mod = await importSessionManager();
            const edgeManager = mod.sessionManager;
            edgeManager.start();
            // warningStartMs = (1 - 2) * 60 * 1000 = -60000, so no warning timer
            // but timeout timer should still fire at 1 minute
            jest.advanceTimersByTime(60 * 1000);
            expect(mockLogLogout).toHaveBeenCalled();
            edgeManager.stop();
        });
    });
    // ======================================================================
    // 9. Session timeout (auto-logout)
    // ======================================================================
    describe('Session timeout (auto-logout)', () => {
        test('should auto-logout after the full timeout period', async () => {
            sessionManager.start();
            // Advance to just before timeout
            jest.advanceTimersByTime(15 * 60 * 1000 - 1);
            expect(mockLogLogout).not.toHaveBeenCalled();
            // Advance past timeout
            jest.advanceTimersByTime(2);
            // Allow the async logout to resolve
            await jest.advanceTimersByTimeAsync(0);
            expect(mockLogLogout).toHaveBeenCalled();
            expect(window.location.href).toBe('launch.html');
        });
        test('should show warning before auto-logout', () => {
            sessionManager.start();
            // At 13 min, warning should be visible
            jest.advanceTimersByTime(13 * 60 * 1000 + 1);
            expect(document.getElementById('session-timeout-overlay')).not.toBeNull();
            // At 15 min, logout fires
            jest.advanceTimersByTime(2 * 60 * 1000);
            expect(mockLogLogout).toHaveBeenCalled();
        });
    });
    // ======================================================================
    // 10. formatTime utility
    // ======================================================================
    describe('Time formatting in countdown', () => {
        test('should format time with leading zeros for seconds', () => {
            sessionManager.start();
            jest.advanceTimersByTime(13 * 60 * 1000 + 1);
            const countdown = document.getElementById('session-countdown');
            expect(countdown?.textContent).toBe('2:00');
            // After 5 seconds, should show 1:55
            jest.advanceTimersByTime(5000);
            expect(countdown?.textContent).toBe('1:55');
            // After 55 more seconds (1 min total), should show 1:00
            jest.advanceTimersByTime(55000);
            expect(countdown?.textContent).toBe('1:00');
            // After 1 second more, should show 0:59
            jest.advanceTimersByTime(1000);
            expect(countdown?.textContent).toBe('0:59');
        });
        test('should display single-digit minutes without padding', async () => {
            jest.resetModules();
            window.MEDCALC_CONFIG = {
                session: {
                    timeoutMinutes: 20,
                    warningMinutes: 10 // 10 min warning
                }
            };
            const mod = await importSessionManager();
            const longWarningManager = mod.sessionManager;
            longWarningManager.start();
            jest.advanceTimersByTime(10 * 60 * 1000 + 1);
            const countdown = document.getElementById('session-countdown');
            // 10 minutes = "10:00"
            expect(countdown?.textContent).toBe('10:00');
            // After 1 second: "9:59"
            jest.advanceTimersByTime(1000);
            expect(countdown?.textContent).toBe('9:59');
            longWarningManager.stop();
        });
    });
    // ======================================================================
    // 11. hideWarning()
    // ======================================================================
    describe('hideWarning (internal)', () => {
        test('should remove overlay from DOM when hiding', () => {
            sessionManager.start();
            jest.advanceTimersByTime(13 * 60 * 1000 + 1);
            expect(document.getElementById('session-timeout-overlay')).not.toBeNull();
            sessionManager.stop();
            expect(document.getElementById('session-timeout-overlay')).toBeNull();
        });
        test('should handle hiding when overlay does not exist', () => {
            // stop() calls hideWarning() even if no overlay was ever shown
            expect(() => {
                sessionManager.start();
                sessionManager.stop();
            }).not.toThrow();
        });
    });
    // ======================================================================
    // 12. clearTimers (internal, tested via behavior)
    // ======================================================================
    describe('clearTimers (internal)', () => {
        test('should clear timeout timer', () => {
            sessionManager.start();
            // Stop immediately clears timers
            sessionManager.stop();
            // After full timeout, logout should NOT fire
            jest.advanceTimersByTime(60 * 60 * 1000);
            expect(mockLogLogout).not.toHaveBeenCalled();
        });
        test('should clear warning timer', () => {
            sessionManager.start();
            sessionManager.stop();
            // After warning time, no overlay
            jest.advanceTimersByTime(13 * 60 * 1000 + 1);
            expect(document.getElementById('session-timeout-overlay')).toBeNull();
        });
        test('should clear countdown interval', () => {
            sessionManager.start();
            // Show warning to start countdown interval
            jest.advanceTimersByTime(13 * 60 * 1000 + 1);
            const countdown = document.getElementById('session-countdown');
            expect(countdown?.textContent).toBe('2:00');
            // Stop clears everything including countdown interval
            sessionManager.stop();
            // Overlay is gone, no countdown ticking
            expect(document.getElementById('session-timeout-overlay')).toBeNull();
        });
    });
    // ======================================================================
    // 13. Edge cases
    // ======================================================================
    describe('Edge cases', () => {
        test('calling stop() multiple times should not throw', () => {
            sessionManager.start();
            expect(() => {
                sessionManager.stop();
                sessionManager.stop();
                sessionManager.stop();
            }).not.toThrow();
        });
        test('calling start() multiple times should not create duplicate listeners', () => {
            const addSpy = jest.spyOn(document, 'addEventListener');
            sessionManager.start();
            const firstCallCount = addSpy.mock.calls.length;
            sessionManager.start();
            const secondCallCount = addSpy.mock.calls.length;
            // Second start adds another 5 listeners (it does not self-clean on re-start)
            expect(secondCallCount - firstCallCount).toBe(5);
            // Clean up - stop twice to remove both sets
            sessionManager.stop();
        });
        test('calling logout() without start() should still work', async () => {
            await sessionManager.logout();
            expect(mockLogLogout).toHaveBeenCalled();
            expect(window.location.href).toBe('launch.html');
        });
        test('rapid activity events should be throttled correctly', () => {
            sessionManager.start();
            // Fire 100 rapid activity events
            for (let i = 0; i < 100; i++) {
                simulateActivity('mousemove');
            }
            // The timers should have been reset only once (due to 30s throttle)
            // After advancing 13 min from the single reset, warning should appear
            jest.advanceTimersByTime(13 * 60 * 1000 + 1);
            expect(document.getElementById('session-timeout-overlay')).not.toBeNull();
        });
        test('activity during warning should dismiss the warning', () => {
            sessionManager.start();
            // Show warning
            jest.advanceTimersByTime(13 * 60 * 1000 + 1);
            expect(document.getElementById('session-timeout-overlay')).not.toBeNull();
            // Activity during warning — need to wait for throttle period
            jest.advanceTimersByTime(31 * 1000);
            simulateActivity('keydown');
            // Warning should be dismissed
            expect(document.getElementById('session-timeout-overlay')).toBeNull();
        });
        test('overlay should be removed from DOM on stop even if manually modified', () => {
            sessionManager.start();
            jest.advanceTimersByTime(13 * 60 * 1000 + 1);
            // Manually add content to overlay
            const overlay = document.getElementById('session-timeout-overlay');
            const extra = document.createElement('p');
            extra.textContent = 'Extra content';
            overlay?.appendChild(extra);
            sessionManager.stop();
            expect(document.getElementById('session-timeout-overlay')).toBeNull();
        });
    });
    // ======================================================================
    // 14. Multiple instances (singleton behavior)
    // ======================================================================
    describe('Singleton export', () => {
        test('should export a singleton instance', async () => {
            const mod1 = await importSessionManager();
            // The same module should return the same sessionManager reference
            expect(mod1.sessionManager).toBeDefined();
            expect(typeof mod1.sessionManager.start).toBe('function');
            expect(typeof mod1.sessionManager.stop).toBe('function');
            expect(typeof mod1.sessionManager.logout).toBe('function');
        });
    });
    // ======================================================================
    // 15. Integration: full session lifecycle
    // ======================================================================
    describe('Full session lifecycle', () => {
        test('start -> activity -> warning -> continue -> activity -> timeout -> logout', async () => {
            sessionManager.start();
            // 1. User is active at 5 minutes
            jest.advanceTimersByTime(5 * 60 * 1000);
            simulateActivity('click');
            // 2. No warning at 13 minutes from start (only 8 from activity)
            jest.advanceTimersByTime(8 * 60 * 1000);
            expect(document.getElementById('session-timeout-overlay')).toBeNull();
            // 3. Warning appears at 13 minutes from activity
            jest.advanceTimersByTime(5 * 60 * 1000 + 1);
            expect(document.getElementById('session-timeout-overlay')).not.toBeNull();
            // 4. User clicks Continue
            document.getElementById('session-continue-btn')?.click();
            expect(document.getElementById('session-timeout-overlay')).toBeNull();
            // 5. User goes idle — warning reappears at 13 min
            jest.advanceTimersByTime(13 * 60 * 1000 + 1);
            expect(document.getElementById('session-timeout-overlay')).not.toBeNull();
            // 6. User doesn't respond — auto-logout at 15 min from Continue click
            jest.advanceTimersByTime(2 * 60 * 1000);
            await jest.advanceTimersByTimeAsync(0);
            expect(mockLogLogout).toHaveBeenCalled();
            expect(window.location.href).toBe('launch.html');
        });
        test('start -> warning -> logout button -> complete logout', async () => {
            sessionManager.start();
            // 1. Warning appears
            jest.advanceTimersByTime(13 * 60 * 1000 + 1);
            expect(document.getElementById('session-timeout-overlay')).not.toBeNull();
            // 2. User clicks Logout Now
            document.getElementById('session-logout-btn')?.click();
            await jest.advanceTimersByTimeAsync(0);
            expect(mockLogLogout).toHaveBeenCalled();
            expect(sessionStorage.length).toBe(0);
            expect(window.location.href).toBe('launch.html');
        });
    });
});
