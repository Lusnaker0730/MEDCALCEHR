import { test, expect } from '@playwright/test';

test.describe('APACHE-II Calculator', () => {
    test.setTimeout(60000);

    test.beforeEach(async ({ page }) => {
        // Bypass SMART launch
        await page.addInitScript(() => {
            window.sessionStorage.setItem('SMART_KEY', 'test');
        });

        await page.goto('/');
        // Wait for the calculator list to load
        await page.waitForSelector('.list-item');

        // Navigate to APACHE-II calculator - get href and navigate directly to avoid sticky header issues
        const apacheLink = page.locator('.list-item', { hasText: 'APACHE II Score' });
        const href = await apacheLink.getAttribute('href');
        await page.goto(href);
        await page.waitForLoadState('networkidle');

        // Wait for calculator to load
        await page.waitForSelector('#apache-ii-age');
    });

    test('should calculate score correctly with standard units', async ({ page }) => {
        // Fill in values
        await page.fill('#apache-ii-age', '50');
        await page.fill('#apache-ii-temp', '39.5'); // 3 points
        await page.fill('#apache-ii-map', '60'); // 2 points
        await page.fill('#apache-ii-hr', '150'); // 3 points
        await page.fill('#apache-ii-rr', '40'); // 3 points
        await page.fill('#apache-ii-ph', '7.2'); // 3 points
        await page.fill('#apache-ii-sodium', '125'); // 2 points
        await page.fill('#apache-ii-potassium', '6.5'); // 3 points
        await page.fill('#apache-ii-creatinine', '2.5'); // 3 points (mg/dL assumed default or checked later)
        await page.fill('#apache-ii-hct', '45'); // 0 points
        await page.fill('#apache-ii-wbc', '25'); // 2 points
        await page.fill('#apache-ii-gcs', '10'); // 5 points (15-10)

        // Select Chronic Health
        await page.check('input[name="chronic"][value="5"]'); // 5 points

        // Verify Score
        // Total = 3+2+3+3+3+2+3+3+0+2+5+5 + Age(2) = 33
        // Note: Age 50 gives 2 points.
        // Total = 36

        // Wait for result
        await expect(page.locator('#apache-ii-result')).toBeVisible();
        await expect(page.locator('.result-item-value').first()).toHaveText('36');
    });

    test('should handle unit conversions for Sodium', async ({ page }) => {
        // Default unit is mmol/L. 140 mmol/L = 0 points.
        await page.fill('#apache-ii-sodium', '140');

        // Check points contribution (indirectly via total score)
        // We need to isolate this, so keep other fields 0 or normal
        await page.fill('#apache-ii-age', '30'); // 0 points
        await page.fill('#apache-ii-temp', '37'); // 0 points
        await page.fill('#apache-ii-map', '90'); // 0 points
        await page.fill('#apache-ii-hr', '80'); // 0 points
        await page.fill('#apache-ii-rr', '15'); // 0 points
        await page.fill('#apache-ii-ph', '7.4'); // 0 points
        await page.fill('#apache-ii-potassium', '4.0'); // 0 points
        await page.fill('#apache-ii-creatinine', '1.0'); // 0 points
        await page.fill('#apache-ii-hct', '40'); // 0 points
        await page.fill('#apache-ii-wbc', '10'); // 0 points
        await page.fill('#apache-ii-gcs', '15'); // 0 points
        await page.check('input[name="chronic"][value="0"]'); // 0 points

        await expect(page.locator('.result-item-value').first()).toHaveText('0');

        // Change unit to mEq/L (1:1 conversion for Na)
        // Toggle unit
        const sodiumWrapper = page.locator('#apache-ii-sodium').locator('xpath=..');
        await sodiumWrapper.locator('.unit-toggle-btn').click();

        // Value should remain 140 (since 1 mmol/L = 1 mEq/L)
        await expect(page.locator('#apache-ii-sodium')).toHaveValue('140');

        // Enter a high value in mEq/L
        await page.fill('#apache-ii-sodium', '180'); // 4 points
        await expect(page.locator('.result-item-value').first()).toHaveText('4');
    });
});
