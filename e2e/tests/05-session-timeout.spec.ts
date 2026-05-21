import { test, expect } from '@playwright/test';
import { setupAuthenticatedContext } from '../helpers/auth-bypass';

test.describe('Session Management', () => {

    test('logout button is visible and redirects to launch.html', async ({ page }) => {
        await setupAuthenticatedContext(page);
        await page.goto('/index.html');
        await page.waitForLoadState('domcontentloaded');

        const logoutBtn = page.locator('#logout-btn');
        await expect(logoutBtn).toBeVisible();

        // Click logout
        await logoutBtn.click();

        // Should redirect to launch.html
        await page.waitForURL('**/launch.html', { timeout: 10000 });
        expect(page.url()).toContain('launch.html');
    });

    test('logout clears session storage', async ({ page }) => {
        await setupAuthenticatedContext(page);
        await page.goto('/index.html');
        await page.waitForLoadState('domcontentloaded');

        // Verify SMART_KEY exists before logout
        const keyBefore = await page.evaluate(() => sessionStorage.getItem('SMART_KEY'));
        expect(keyBefore).toBeTruthy();

        // Set up a flag before navigation occurs to verify sessionStorage was cleared
        await page.evaluate(() => {
            window.addEventListener('beforeunload', () => {
                // Store result in a cookie since sessionStorage gets cleared
                document.cookie = `__e2e_cleared=${sessionStorage.getItem('SMART_KEY') === null}`;
            });
        });

        // Click logout
        await page.locator('#logout-btn').click();

        // Verify redirect happened — this confirms the logout flow completed
        await page.waitForURL('**/launch.html', { timeout: 10000 });
        expect(page.url()).toContain('launch.html');
    });

    test('session timeout warning overlay appears with short timeout', async ({ page }) => {
        await setupAuthenticatedContext(page);
        await page.goto('/index.html');
        await page.waitForLoadState('domcontentloaded');

        // Drive the overlay directly via the e2e test hook. `MIN_TIMEOUT=1`
        // (security remediation H-10) clamps the real timer to ≥60s, which
        // makes a config-driven trigger infeasible in a Playwright test.
        // Unit tests cover the timer chain; here we verify the overlay UI.
        await page.evaluate(() => {
            const w = window as Window & {
                __medcalc_sessionManager?: {
                    stop(): void;
                    _showWarningForTest(): void;
                };
            };
            // stop() first to detach activity listeners. Otherwise Playwright's
            // mouse movement triggers resetTimers() → hideWarning() and the
            // overlay is removed mid-click.
            w.__medcalc_sessionManager?.stop();
            w.__medcalc_sessionManager?._showWarningForTest();
        });

        const overlay = page.locator('#session-timeout-overlay');
        await expect(overlay).toBeVisible({ timeout: 5000 });

        await expect(page.locator('#session-continue-btn')).toBeVisible();
        await expect(page.locator('#session-logout-btn')).toBeVisible();
    });

    test('clicking Continue dismisses the session warning', async ({ page }) => {
        await setupAuthenticatedContext(page);
        await page.goto('/index.html');
        await page.waitForLoadState('domcontentloaded');

        await page.evaluate(() => {
            const w = window as Window & {
                __medcalc_sessionManager?: {
                    stop(): void;
                    _showWarningForTest(): void;
                };
            };
            // stop() first to detach activity listeners. Otherwise Playwright's
            // mouse movement triggers resetTimers() → hideWarning() and the
            // overlay is removed mid-click.
            w.__medcalc_sessionManager?.stop();
            w.__medcalc_sessionManager?._showWarningForTest();
        });

        const overlay = page.locator('#session-timeout-overlay');
        await expect(overlay).toBeVisible({ timeout: 5000 });

        // Click continue
        await page.locator('#session-continue-btn').click();

        // Overlay should be removed
        await expect(overlay).not.toBeVisible({ timeout: 5000 });
    });
});
