/**
 * Session Manager — Inactivity timeout and logout for medical application security.
 *
 * Tracks user activity and automatically logs out after a configurable
 * period of inactivity, with a countdown warning before session expiry.
 * Configuration is read from window.MEDCALC_CONFIG.session.
 */
import { auditEventService } from './audit-event-service.js';
import { clearEncryptionKeyCache } from './security.js';
import { clearFHIRCache } from './sw-register.js';
import { t } from './i18n/index.js';
const DEFAULT_CONFIG = {
    timeoutMinutes: 15,
    warningMinutes: 2
};
const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
const OVERLAY_ID = 'session-timeout-overlay';
class SessionManager {
    constructor() {
        this.effectiveTimeoutMinutes = null;
        this.timeoutTimer = null;
        this.warningTimer = null;
        this.countdownInterval = null;
        this.isWarningVisible = false;
        this.onLogoutCallback = null;
        const userConfig = window.MEDCALC_CONFIG?.session;
        const MIN_TIMEOUT = 1;
        const MAX_TIMEOUT = 120;
        const rawTimeout = userConfig?.timeoutMinutes ?? DEFAULT_CONFIG.timeoutMinutes;
        const rawWarning = userConfig?.warningMinutes ?? DEFAULT_CONFIG.warningMinutes;
        this.config = {
            timeoutMinutes: Math.max(MIN_TIMEOUT, Math.min(MAX_TIMEOUT, rawTimeout)),
            warningMinutes: Math.max(0, Math.min(rawWarning, rawTimeout - 1))
        };
        // Throttle activity handler to avoid excessive resets (max once per 30s)
        let lastActivity = 0;
        this.activityHandler = () => {
            const now = Date.now();
            if (now - lastActivity < 30000)
                return;
            lastActivity = now;
            this.resetTimers();
        };
    }
    /**
     * Start tracking user activity and arm the timeout.
     * Call this once after the page loads.
     */
    start() {
        if (this.config.timeoutMinutes <= 0)
            return;
        ACTIVITY_EVENTS.forEach(event => {
            document.addEventListener(event, this.activityHandler, { passive: true });
        });
        this.resetTimers();
    }
    /**
     * Return the configured inactivity timeout in minutes.
     */
    getTimeoutMinutes() {
        return this.config.timeoutMinutes;
    }
    /**
     * Override the effective timeout (e.g. to match a shorter token TTL).
     * Resets all running timers to use the new value.
     */
    setEffectiveTimeout(minutes) {
        this.effectiveTimeoutMinutes = Math.max(1, minutes);
        // If already started, restart timers with the new timeout
        if (this.timeoutTimer !== null || this.warningTimer !== null) {
            this.resetTimers();
        }
    }
    /**
     * Register a callback that fires at the end of logout().
     * Used by TokenLifecycleManager to avoid circular imports.
     */
    onLogout(callback) {
        this.onLogoutCallback = callback;
    }
    /**
     * Stop tracking and clear all timers.
     */
    stop() {
        ACTIVITY_EVENTS.forEach(event => {
            document.removeEventListener(event, this.activityHandler);
        });
        this.clearTimers();
        this.hideWarning();
    }
    /**
     * Immediately log out: clear session, log audit event, redirect.
     */
    async logout() {
        this.stop();
        // Log logout audit event (best-effort, don't block on failure)
        try {
            await auditEventService.logLogout();
        }
        catch {
            // Audit failure should not prevent logout
        }
        // Clear all session data
        sessionStorage.clear();
        // Clear sensitive localStorage items (keep user preferences like favorites)
        localStorage.removeItem('patientDisplayData');
        // PT-06: Clear all PHI-related localStorage items (including audit events)
        const phiPrefixes = ['medcalc-phi-', 'medcalc-history-', 'medcalc-provenance-', 'medcalc_audit'];
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && phiPrefixes.some(prefix => key.startsWith(prefix))) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        clearEncryptionKeyCache();
        // Clear cached FHIR responses (contain PHI) from Service Worker cache
        try {
            await clearFHIRCache();
        }
        catch {
            // Best-effort: don't block logout if cache clearing fails
        }
        // Notify subscribers (e.g. TokenLifecycleManager)
        if (this.onLogoutCallback) {
            try {
                this.onLogoutCallback();
            }
            catch { /* best-effort */ }
        }
        // Redirect to SMART launch page
        window.location.href = 'launch.html';
    }
    // --- Private methods ---
    resetTimers() {
        this.clearTimers();
        if (this.isWarningVisible) {
            this.hideWarning();
        }
        const activeTimeout = this.effectiveTimeoutMinutes ?? this.config.timeoutMinutes;
        const timeoutMs = activeTimeout * 60 * 1000;
        const warningMs = this.config.warningMinutes * 60 * 1000;
        const warningStartMs = timeoutMs - warningMs;
        // Timer to show warning overlay
        if (warningStartMs > 0) {
            this.warningTimer = setTimeout(() => {
                this.showWarning();
            }, warningStartMs);
        }
        // Timer for actual logout
        this.timeoutTimer = setTimeout(() => {
            this.logout();
        }, timeoutMs);
    }
    clearTimers() {
        if (this.timeoutTimer) {
            clearTimeout(this.timeoutTimer);
            this.timeoutTimer = null;
        }
        if (this.warningTimer) {
            clearTimeout(this.warningTimer);
            this.warningTimer = null;
        }
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
    }
    showWarning() {
        this.isWarningVisible = true;
        const overlay = document.createElement('div');
        overlay.id = OVERLAY_ID;
        overlay.className = 'session-timeout-overlay';
        overlay.setAttribute('role', 'alertdialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', t('session.expiringTitle'));
        let remainingSeconds = this.config.warningMinutes * 60;
        overlay.innerHTML = `
            <div class="session-timeout-dialog">
                <div class="session-timeout-icon">&#9888;</div>
                <h2 class="session-timeout-title">${t('session.expiringTitle')}</h2>
                <p class="session-timeout-message">
                    ${t('session.expiringMessage')}
                </p>
                <p class="session-timeout-countdown">
                    ${t('session.timeRemaining')} <strong id="session-countdown">${this.formatTime(remainingSeconds)}</strong>
                </p>
                <div class="session-timeout-actions">
                    <button id="session-continue-btn" class="session-btn session-btn-primary">
                        ${t('session.continueSession')}
                    </button>
                    <button id="session-logout-btn" class="session-btn session-btn-secondary">
                        ${t('session.logoutNow')}
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        // Focus the continue button for keyboard accessibility
        const continueBtn = document.getElementById('session-continue-btn');
        const logoutBtn = document.getElementById('session-logout-btn');
        continueBtn?.focus();
        continueBtn?.addEventListener('click', () => {
            this.resetTimers();
        });
        logoutBtn?.addEventListener('click', () => {
            this.logout();
        });
        // Trap focus within dialog
        overlay.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.resetTimers();
            }
            if (e.key === 'Tab') {
                const focusable = overlay.querySelectorAll('button');
                const first = focusable[0];
                const last = focusable[focusable.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
                else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        });
        // Start countdown display
        const countdownEl = document.getElementById('session-countdown');
        this.countdownInterval = setInterval(() => {
            remainingSeconds--;
            if (countdownEl) {
                countdownEl.textContent = this.formatTime(remainingSeconds);
            }
            if (remainingSeconds <= 0 && this.countdownInterval) {
                clearInterval(this.countdownInterval);
                this.countdownInterval = null;
            }
        }, 1000);
    }
    hideWarning() {
        this.isWarningVisible = false;
        const overlay = document.getElementById(OVERLAY_ID);
        overlay?.remove();
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
    }
    formatTime(totalSeconds) {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}
/** Singleton instance */
export const sessionManager = new SessionManager();
