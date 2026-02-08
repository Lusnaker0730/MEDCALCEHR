/**
 * E2E Accessibility tests using @axe-core/playwright
 * Validates WCAG 2.1 AA compliance on live pages
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { setupAuthenticated } from '../helpers/auth-bypass';

test.describe('Accessibility Audit', () => {
    test('index page has no WCAG 2.1 AA violations', async ({ page }) => {
        await setupAuthenticated(page);
        await page.goto('/');
        await page.waitForSelector('#calculator-list');

        const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();

        expect(results.violations).toEqual([]);
    });

    test('calculator page has no WCAG 2.1 AA violations', async ({ page }) => {
        await setupAuthenticated(page);
        await page.goto('/calculator.html?name=bmi-bsa');
        await page.waitForSelector('#calculator-container');

        const results = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa'])
            .analyze();

        expect(results.violations).toEqual([]);
    });

    test('skip link is visible on focus', async ({ page }) => {
        await setupAuthenticated(page);
        await page.goto('/');

        // Tab to focus the skip link
        await page.keyboard.press('Tab');

        const skipLink = page.locator('.skip-link');
        await expect(skipLink).toBeVisible();
    });

    test('landmark structure is correct on index page', async ({ page }) => {
        await setupAuthenticated(page);
        await page.goto('/');

        // Check header landmark
        await expect(page.locator('header[role="banner"]')).toBeVisible();

        // Check main landmark
        await expect(page.locator('main#main-content')).toBeVisible();

        // Check nav landmark for filters
        await expect(page.locator('nav[aria-label="Calculator filters"]')).toBeVisible();
    });
});
