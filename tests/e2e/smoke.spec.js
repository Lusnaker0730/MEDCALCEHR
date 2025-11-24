import { test, expect } from '@playwright/test';

test('smoke test', async ({ page }) => {
    // Bypass SMART launch
    await page.addInitScript(() => {
        window.sessionStorage.setItem('SMART_KEY', 'test');
    });

    await page.goto('/');
    await expect(page).toHaveTitle(/CGMH EHRCALC/);
    await expect(page.locator('.list-item').first()).toBeVisible();
});
