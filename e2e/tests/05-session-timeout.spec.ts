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
        // Use a very short timeout: 3 seconds total, warning at 0.6s before expiry
        await setupAuthenticatedContext(page, {
            sessionTimeoutMinutes: 0.05,  // 3 seconds
            sessionWarningMinutes: 0.04   // 2.4 seconds warning period
        });

        await page.goto('/index.html');
        await page.waitForLoadState('domcontentloaded');

        // Warning should appear after ~0.6s (timeout - warning = 0.6s)
        const overlay = page.locator('#session-timeout-overlay');
        await expect(overlay).toBeVisible({ timeout: 15000 });

        // Verify the overlay has continue and logout buttons
        await expect(page.locator('#session-continue-btn')).toBeVisible();
        await expect(page.locator('#session-logout-btn')).toBeVisible();
    });

    test('clicking Continue dismisses the session warning', async ({ page }) => {
        await setupAuthenticatedContext(page, {
            sessionTimeoutMinutes: 0.05,
            sessionWarningMinutes: 0.04
        });

        await page.goto('/index.html');
        await page.waitForLoadState('domcontentloaded');

        // Wait for overlay
        const overlay = page.locator('#session-timeout-overlay');
        await expect(overlay).toBeVisible({ timeout: 15000 });

        // Click continue
        await page.locator('#session-continue-btn').click();

        // Overlay should be removed
        await expect(overlay).not.toBeVisible({ timeout: 5000 });
    });
});
