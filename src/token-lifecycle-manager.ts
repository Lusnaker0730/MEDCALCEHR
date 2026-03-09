/**
 * Token Lifecycle Manager — monitors EHR token expiry, syncs session timeout
 * with the token TTL, shows proactive warnings, and broadcasts auth state
 * across tabs via BroadcastChannel.
 *
 * This is a singleton. Import `tokenLifecycleManager` and call `.initialize(client)`
 * once the FHIR client is ready.
 *
 * Design notes:
 *  - fhirclient v2.6.3 handles token refresh internally (client.refresh()).
 *    We do NOT duplicate that logic — we only observe and react.
 *  - If `expiresAt` is unavailable (some FHIR servers omit `expires_in`),
 *    the token clock is not started and we fall back to inactivity-only timeout.
 *  - BroadcastChannel is feature-detected; absence is silently tolerated.
 */

import { sessionManager } from './session-manager.js';
import { logger } from './logger.js';
import { t } from './i18n/index.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOKEN_CHECK_INTERVAL_MS = 30_000; // 30 seconds
const CHANNEL_NAME = 'medcalc-auth';
const TOKEN_WARNING_OVERLAY_ID = 'token-warning-overlay';
const AUTH_FAILURE_OVERLAY_ID = 'auth-failure-overlay';
const AUTH_FAILURE_GRACE_SECONDS = 60; // Give user 60s to read current content

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TokenState {
    expiresAt: number | null;   // Unix-ms timestamp when access_token expires
    hasRefreshToken: boolean;
    isExpired: boolean;
}

type AuthBroadcastEvent =
    | { type: 'token-refreshed'; expiresAt: number }
    | { type: 'session-expired' }
    | { type: 'logout' };

// ---------------------------------------------------------------------------
// TokenLifecycleManager
// ---------------------------------------------------------------------------

class TokenLifecycleManager {
    private client: any = null;
    private checkTimer: ReturnType<typeof setInterval> | null = null;
    private warningShown = false;
    private channel: BroadcastChannel | null = null;
    private tokenState: TokenState = { expiresAt: null, hasRefreshToken: false, isExpired: false };
    private visibilityHandler: (() => void) | null = null;
    private warningSeconds: number = 120;
    private disabled = false;
    private authFailureHandled = false;
    private authFailureTimer: ReturnType<typeof setInterval> | null = null;

    // -----------------------------------------------------------------------
    // Public API
    // -----------------------------------------------------------------------

    /**
     * Initialize from a fhirclient Client instance.
     * Safe to call multiple times (idempotent — destroys previous state first).
     */
    initialize(client: any): void {
        // Read config before doing anything
        const sessionConfig = window.MEDCALC_CONFIG?.session;
        if (sessionConfig?.disableTokenLifecycle === true) {
            this.disabled = true;
            return;
        }

        this.destroy();
        this.disabled = false;
        this.client = client;
        this.warningSeconds = (sessionConfig?.tokenWarningSeconds as number | undefined) ?? 120;

        this.tokenState = this.extractTokenState(client);

        if (this.tokenState.expiresAt != null) {
            this.syncSessionTimeout(this.tokenState.expiresAt);
            this.startTokenClock();
        }

        // Listen for tab visibility changes to compensate for timer drift
        this.visibilityHandler = () => {
            if (document.visibilityState === 'visible') {
                this.checkTokenExpiry();
            }
        };
        document.addEventListener('visibilitychange', this.visibilityHandler);

        // BroadcastChannel for cross-tab sync
        this.initBroadcastChannel();

        // Register callback so SessionManager.logout() tears us down
        sessionManager.onLogout(() => {
            this.broadcastEvent({ type: 'logout' });
            this.destroy();
        });

        logger.info('TokenLifecycleManager initialized', {
            expiresAt: this.tokenState.expiresAt
                ? new Date(this.tokenState.expiresAt).toISOString()
                : null,
            hasRefreshToken: this.tokenState.hasRefreshToken,
        });
    }

    /** Seconds remaining until access_token expiry, or null if unknown. */
    getSecondsRemaining(): number | null {
        if (this.tokenState.expiresAt == null) return null;
        return Math.max(0, Math.floor((this.tokenState.expiresAt - Date.now()) / 1000));
    }

    /** Whether the current access_token is still considered valid. */
    isTokenValid(): boolean {
        if (this.tokenState.expiresAt == null) return true; // unknown → assume valid
        return Date.now() < this.tokenState.expiresAt;
    }

    /**
     * Attempt to refresh the access token via fhirclient.
     * Returns true on success.
     */
    async tryRefresh(): Promise<boolean> {
        if (!this.client || !this.tokenState.hasRefreshToken) return false;

        try {
            const refreshed = await this.client.refresh();
            // Re-extract token state from the refreshed client
            const newState = this.extractTokenState(refreshed ?? this.client);
            const newExpiry = newState.expiresAt;
            if (newExpiry != null && newExpiry > Date.now()) {
                this.tokenState = newState;
                this.client = refreshed ?? this.client;
                this.warningShown = false;
                this.hideTokenWarning();
                this.syncSessionTimeout(newExpiry);
                this.broadcastEvent({ type: 'token-refreshed', expiresAt: newExpiry });
                logger.info('Token refreshed successfully');
                return true;
            }
        } catch (err) {
            logger.warn('Token refresh failed', { error: String(err) });
        }

        return false;
    }

    /**
     * Handle an authentication failure (e.g. 401/403 from a FHIR call).
     * Shows a grace-period overlay so the user can finish reading current content
     * before being redirected to re-authenticate.
     */
    handleAuthFailure(status?: number): void {
        // Prevent multiple overlays from concurrent 401s
        if (this.authFailureHandled) return;
        this.authFailureHandled = true;

        logger.warn('Auth failure detected, showing grace period', { status });
        this.broadcastEvent({ type: 'session-expired' });

        // Stop token clock but don't destroy everything yet
        if (this.checkTimer != null) {
            clearInterval(this.checkTimer);
            this.checkTimer = null;
        }
        this.hideTokenWarning();

        this.showAuthFailureOverlay();
    }

    /** Force logout without grace period (used by overlay countdown). */
    private forceLogout(): void {
        if (this.authFailureTimer) {
            clearInterval(this.authFailureTimer);
            this.authFailureTimer = null;
        }
        this.hideAuthFailureOverlay();
        this.destroy();
        sessionManager.logout();
    }

    /** Clean up all timers, listeners, and the BroadcastChannel. */
    destroy(): void {
        if (this.checkTimer != null) {
            clearInterval(this.checkTimer);
            this.checkTimer = null;
        }

        if (this.authFailureTimer) {
            clearInterval(this.authFailureTimer);
            this.authFailureTimer = null;
        }

        if (this.visibilityHandler) {
            document.removeEventListener('visibilitychange', this.visibilityHandler);
            this.visibilityHandler = null;
        }

        if (this.channel) {
            try { this.channel.close(); } catch { /* ignore */ }
            this.channel = null;
        }

        this.hideTokenWarning();
        this.hideAuthFailureOverlay();
        this.warningShown = false;
        this.authFailureHandled = false;
        this.client = null;
    }

    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------

    /** Read token metadata from the fhirclient state. */
    private extractTokenState(client: any): TokenState {
        const state: TokenState = {
            expiresAt: null,
            hasRefreshToken: false,
            isExpired: false,
        };

        if (!client?.state) return state;

        const s = client.state;

        // fhirclient stores expiresAt as a Unix-ms timestamp
        if (typeof s.expiresAt === 'number' && s.expiresAt > 0) {
            state.expiresAt = s.expiresAt;
        } else if (typeof s.tokenResponse?.expires_in === 'number') {
            // Compute from expires_in (seconds) if expiresAt wasn't set
            state.expiresAt = Date.now() + s.tokenResponse.expires_in * 1000;
        }

        state.hasRefreshToken = !!(
            s.tokenResponse?.refresh_token ??
            s.refresh_token
        );

        state.isExpired = state.expiresAt != null && Date.now() >= state.expiresAt;

        return state;
    }

    /**
     * Ensure the session timeout is no larger than the token TTL.
     * This prevents the user session from outliving the access_token.
     */
    private syncSessionTimeout(expiresAtMs: number): void {
        const ttlMinutes = (expiresAtMs - Date.now()) / 60_000;
        const configuredTimeout = sessionManager.getTimeoutMinutes();

        if (ttlMinutes > 0 && ttlMinutes < configuredTimeout) {
            sessionManager.setEffectiveTimeout(Math.floor(ttlMinutes));
        }
    }

    /** Start the periodic token-expiry check (every 30 s). */
    private startTokenClock(): void {
        if (this.checkTimer != null) {
            clearInterval(this.checkTimer);
        }
        this.checkTimer = setInterval(() => this.checkTokenExpiry(), TOKEN_CHECK_INTERVAL_MS);
    }

    /** Check token expiry and take action as needed. */
    private checkTokenExpiry(): void {
        const remaining = this.getSecondsRemaining();
        if (remaining == null) return;

        if (remaining <= 0) {
            // Token has expired — attempt refresh or logout
            if (this.tokenState.hasRefreshToken) {
                this.tryRefresh().then(ok => {
                    if (!ok) this.handleAuthFailure();
                });
            } else {
                this.handleAuthFailure();
            }
            return;
        }

        if (remaining <= this.warningSeconds && !this.warningShown) {
            this.warningShown = true;
            // Attempt proactive refresh first if possible
            if (this.tokenState.hasRefreshToken) {
                this.tryRefresh().then(ok => {
                    if (!ok) this.showTokenWarning(remaining);
                });
            } else {
                this.showTokenWarning(remaining);
            }
        }
    }

    /** Show a warning overlay reusing the session-timeout-overlay CSS. */
    private showTokenWarning(remainingSeconds: number): void {
        // Don't show if one already exists
        if (document.getElementById(TOKEN_WARNING_OVERLAY_ID)) return;

        const overlay = document.createElement('div');
        overlay.id = TOKEN_WARNING_OVERLAY_ID;
        overlay.className = 'session-timeout-overlay';
        overlay.setAttribute('role', 'alertdialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', t('session.tokenExpiringTitle'));

        let seconds = remainingSeconds;

        const formatTime = (s: number) => {
            const m = Math.floor(s / 60);
            const sec = s % 60;
            return `${m}:${sec.toString().padStart(2, '0')}`;
        };

        overlay.innerHTML = `
            <div class="session-timeout-dialog">
                <div class="session-timeout-icon">&#9888;</div>
                <h2 class="session-timeout-title">${t('session.tokenExpiringTitle')}</h2>
                <p class="session-timeout-message">
                    ${t('session.tokenExpiringMessage')}
                </p>
                <p class="session-timeout-countdown">
                    ${t('session.timeRemaining')} <strong id="token-countdown">${formatTime(seconds)}</strong>
                </p>
                <div class="session-timeout-actions">
                    <button id="token-continue-btn" class="session-btn session-btn-primary">
                        ${t('session.extend')}
                    </button>
                    <button id="token-logout-btn" class="session-btn session-btn-secondary">
                        ${t('session.logoutNow')}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const continueBtn = document.getElementById('token-continue-btn');
        const logoutBtn = document.getElementById('token-logout-btn');
        continueBtn?.focus();

        continueBtn?.addEventListener('click', () => {
            this.tryRefresh().then(ok => {
                if (!ok) {
                    // Refresh failed — cannot extend
                    this.handleAuthFailure();
                }
            });
        });

        logoutBtn?.addEventListener('click', () => {
            sessionManager.logout();
        });

        // Countdown timer
        const countdownEl = document.getElementById('token-countdown');
        const countdownInterval = setInterval(() => {
            seconds--;
            if (countdownEl) countdownEl.textContent = formatTime(Math.max(0, seconds));
            if (seconds <= 0) clearInterval(countdownInterval);
        }, 1000);

        // Focus trap
        overlay.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                this.hideTokenWarning();
                this.warningShown = false;
            }
            if (e.key === 'Tab') {
                const btns = overlay.querySelectorAll('button');
                const first = btns[0] as HTMLElement;
                const last = btns[btns.length - 1] as HTMLElement;
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        });
    }

    /** Remove the token warning overlay if it exists. */
    private hideTokenWarning(): void {
        document.getElementById(TOKEN_WARNING_OVERLAY_ID)?.remove();
    }

    /** Show overlay giving user time to read current content before re-auth. */
    private showAuthFailureOverlay(): void {
        if (document.getElementById(AUTH_FAILURE_OVERLAY_ID)) return;

        const overlay = document.createElement('div');
        overlay.id = AUTH_FAILURE_OVERLAY_ID;
        overlay.className = 'session-timeout-overlay';
        overlay.setAttribute('role', 'alertdialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', t('session.tokenExpiredTitle'));

        let seconds = AUTH_FAILURE_GRACE_SECONDS;

        const formatTime = (s: number) => {
            const m = Math.floor(s / 60);
            const sec = s % 60;
            return `${m}:${sec.toString().padStart(2, '0')}`;
        };

        overlay.innerHTML = `
            <div class="session-timeout-dialog">
                <div class="session-timeout-icon">&#128274;</div>
                <h2 class="session-timeout-title">${t('session.tokenExpiredTitle')}</h2>
                <p class="session-timeout-message">
                    ${t('session.tokenExpiredMessage')}
                </p>
                <p class="session-timeout-countdown">
                    ${t('session.redirectingIn')} <strong id="auth-failure-countdown">${formatTime(seconds)}</strong>
                </p>
                <div class="session-timeout-actions">
                    <button id="auth-reauth-btn" class="session-btn session-btn-primary">
                        ${t('session.reauthenticate')}
                    </button>
                    <button id="auth-dismiss-btn" class="session-btn session-btn-secondary">
                        ${t('session.continueReading')}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const reauthBtn = document.getElementById('auth-reauth-btn');
        const dismissBtn = document.getElementById('auth-dismiss-btn');
        reauthBtn?.focus();

        reauthBtn?.addEventListener('click', () => {
            this.forceLogout();
        });

        dismissBtn?.addEventListener('click', () => {
            // Hide overlay but keep countdown running — auto-logout when time is up
            overlay.style.display = 'none';
        });

        // Countdown timer
        const countdownEl = document.getElementById('auth-failure-countdown');
        this.authFailureTimer = setInterval(() => {
            seconds--;
            if (countdownEl) countdownEl.textContent = formatTime(Math.max(0, seconds));
            if (seconds <= 0) {
                this.forceLogout();
            }
        }, 1000);

        // Focus trap
        overlay.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                overlay.style.display = 'none';
            }
            if (e.key === 'Tab') {
                const btns = overlay.querySelectorAll('button');
                const first = btns[0] as HTMLElement;
                const last = btns[btns.length - 1] as HTMLElement;
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        });
    }

    /** Remove the auth failure overlay if it exists. */
    private hideAuthFailureOverlay(): void {
        document.getElementById(AUTH_FAILURE_OVERLAY_ID)?.remove();
    }

    // -----------------------------------------------------------------------
    // BroadcastChannel
    // -----------------------------------------------------------------------

    private initBroadcastChannel(): void {
        if (typeof BroadcastChannel === 'undefined') return;

        try {
            this.channel = new BroadcastChannel(CHANNEL_NAME);
            this.channel.onmessage = (ev: MessageEvent<AuthBroadcastEvent>) => {
                this.handleBroadcastMessage(ev);
            };
        } catch {
            // Feature not available — degrade gracefully
            this.channel = null;
        }
    }

    private broadcastEvent(event: AuthBroadcastEvent): void {
        try {
            this.channel?.postMessage(event);
        } catch {
            // Ignore — channel may be closed
        }
    }

    private handleBroadcastMessage(ev: MessageEvent<AuthBroadcastEvent>): void {
        const data = ev.data;
        if (!data?.type) return;

        switch (data.type) {
            case 'session-expired':
            case 'logout':
                // Another tab logged out — follow suit
                this.destroy();
                sessionManager.logout();
                break;

            case 'token-refreshed':
                // Another tab refreshed — update our state
                if (typeof data.expiresAt === 'number') {
                    this.tokenState.expiresAt = data.expiresAt;
                    this.tokenState.isExpired = false;
                    this.warningShown = false;
                    this.hideTokenWarning();
                    this.syncSessionTimeout(data.expiresAt);
                }
                break;
        }
    }
}

/** Singleton instance */
export const tokenLifecycleManager = new TokenLifecycleManager();
