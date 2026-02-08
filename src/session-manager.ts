/**
 * Session Manager — Inactivity timeout and logout for medical application security.
 *
 * Tracks user activity and automatically logs out after a configurable
 * period of inactivity, with a countdown warning before session expiry.
 * Configuration is read from window.MEDCALC_CONFIG.session.
 */

import { auditEventService } from './audit-event-service.js';

declare global {
    interface Window {
        MEDCALC_CONFIG?: {
            fhir?: {
                clientId?: string;
                scope?: string;
                redirectUri?: string;
            };
            session?: {
                timeoutMinutes?: number;
                warningMinutes?: number;
            };
        };
    }
}

interface SessionManagerConfig {
    /** Minutes of inactivity before auto-logout. 0 to disable. */
    timeoutMinutes: number;
    /** Minutes before timeout to show warning overlay. */
    warningMinutes: number;
}

const DEFAULT_CONFIG: SessionManagerConfig = {
    timeoutMinutes: 15,
    warningMinutes: 2
};

const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'] as const;
const OVERLAY_ID = 'session-timeout-overlay';

class SessionManager {
    private config: SessionManagerConfig;
    private timeoutTimer: ReturnType<typeof setTimeout> | null = null;
    private warningTimer: ReturnType<typeof setTimeout> | null = null;
    private countdownInterval: ReturnType<typeof setInterval> | null = null;
    private isWarningVisible = false;
    private activityHandler: () => void;

    constructor() {
        const userConfig = window.MEDCALC_CONFIG?.session;
        this.config = {
            timeoutMinutes: userConfig?.timeoutMinutes ?? DEFAULT_CONFIG.timeoutMinutes,
            warningMinutes: userConfig?.warningMinutes ?? DEFAULT_CONFIG.warningMinutes
        };

        // Throttle activity handler to avoid excessive resets (max once per 30s)
        let lastActivity = 0;
        this.activityHandler = () => {
            const now = Date.now();
            if (now - lastActivity < 30_000) return;
            lastActivity = now;
            this.resetTimers();
        };
    }

    /**
     * Start tracking user activity and arm the timeout.
     * Call this once after the page loads.
     */
    start(): void {
        if (this.config.timeoutMinutes <= 0) return;

        ACTIVITY_EVENTS.forEach(event => {
            document.addEventListener(event, this.activityHandler, { passive: true });
        });

        this.resetTimers();
    }

    /**
     * Stop tracking and clear all timers.
     */
    stop(): void {
        ACTIVITY_EVENTS.forEach(event => {
            document.removeEventListener(event, this.activityHandler);
        });
        this.clearTimers();
        this.hideWarning();
    }

    /**
     * Immediately log out: clear session, log audit event, redirect.
     */
    async logout(): Promise<void> {
        this.stop();

        // Log logout audit event (best-effort, don't block on failure)
        try {
            await auditEventService.logLogout();
        } catch {
            // Audit failure should not prevent logout
        }

        // Clear all session data
        sessionStorage.clear();

        // Clear sensitive localStorage items (keep user preferences like favorites)
        localStorage.removeItem('patientDisplayData');

        // Redirect to SMART launch page
        window.location.href = 'launch.html';
    }

    // --- Private methods ---

    private resetTimers(): void {
        this.clearTimers();

        if (this.isWarningVisible) {
            this.hideWarning();
        }

        const timeoutMs = this.config.timeoutMinutes * 60 * 1000;
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

    private clearTimers(): void {
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

    private showWarning(): void {
        this.isWarningVisible = true;

        const overlay = document.createElement('div');
        overlay.id = OVERLAY_ID;
        overlay.className = 'session-timeout-overlay';
        overlay.setAttribute('role', 'alertdialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', 'Session timeout warning');

        let remainingSeconds = this.config.warningMinutes * 60;

        overlay.innerHTML = `
            <div class="session-timeout-dialog">
                <div class="session-timeout-icon">&#9888;</div>
                <h2 class="session-timeout-title">Session Expiring</h2>
                <p class="session-timeout-message">
                    Your session will expire due to inactivity.
                </p>
                <p class="session-timeout-countdown">
                    Time remaining: <strong id="session-countdown">${this.formatTime(remainingSeconds)}</strong>
                </p>
                <div class="session-timeout-actions">
                    <button id="session-continue-btn" class="session-btn session-btn-primary">
                        Continue Session
                    </button>
                    <button id="session-logout-btn" class="session-btn session-btn-secondary">
                        Logout Now
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
        overlay.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                this.resetTimers();
            }
            if (e.key === 'Tab') {
                const focusable = overlay.querySelectorAll('button');
                const first = focusable[0] as HTMLElement;
                const last = focusable[focusable.length - 1] as HTMLElement;
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
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

    private hideWarning(): void {
        this.isWarningVisible = false;
        const overlay = document.getElementById(OVERLAY_ID);
        overlay?.remove();

        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
    }

    private formatTime(totalSeconds: number): string {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

/** Singleton instance */
export const sessionManager = new SessionManager();
