import { test, expect } from '@playwright/test';

test.describe('BMI & BSA Calculator', () => {
    test.setTimeout(60000);

    test.beforeEach(async ({ page }) => {
        // Bypass SMART launch
        await page.addInitScript(() => {
            window.sessionStorage.setItem('SMART_KEY', 'test');
        });

        await page.goto('/');
        await page.waitForSelector('.list-item');

        // Navigate to BMI & BSA calculator - get href and navigate directly to avoid sticky header issues
        const bmiLink = page.locator('.list-item', { hasText: 'BMI and BSA Calculator' });
        const href = await bmiLink.getAttribute('href');
        await page.goto(href);
        await page.waitForLoadState('networkidle');

        // Wait for calculator to load
        await page.waitForSelector('#bmi-bsa-weight');
    });

    test('should calculate BMI and BSA correctly', async ({ page }) => {
        await page.fill('#bmi-bsa-weight', '80'); // kg
        await page.fill('#bmi-bsa-height', '180'); // cm

        // BMI = 80 / (1.8 * 1.8) = 24.69
        // BSA (DuBois) = 0.007184 * 180^0.725 * 80^0.425 = 1.99 (approx)

        // Wait for result to appear
        await expect(page.locator('#bmi-bsa-result')).toBeVisible();
        await expect(page.locator('#bmi-bsa-result')).toContainText('24.7');
        await expect(page.locator('#bmi-bsa-result')).toContainText('2.00');
    });

    test('should handle unit conversions', async ({ page }) => {
        // Switch Height to meters
        const heightWrapper = page.locator('#bmi-bsa-height').locator('xpath=..');
        await heightWrapper.locator('.unit-toggle-btn').click(); // cm -> m

        await page.fill('#bmi-bsa-height', '1.8');
        await page.fill('#bmi-bsa-weight', '80');

        await expect(page.locator('#bmi-bsa-result')).toBeVisible();
        await expect(page.locator('#bmi-bsa-result')).toContainText('24.7');
    });
});
