import { test, expect } from '@playwright/test';
import { setupAuthenticatedContext } from '../helpers/auth-bypass';
import { waitForCalculatorList, getCalculatorStats } from '../helpers/page-helpers';

test.describe('Homepage Search/Filter/Sort/Favorites', () => {

    test('search filters calculator list', async ({ page }) => {
        await setupAuthenticatedContext(page);
        await page.goto('/index.html');
        await waitForCalculatorList(page);

        // Type "BMI" in the search bar
        await page.locator('#search-bar').fill('BMI');
        await page.locator('#search-bar').dispatchEvent('input');

        // Wait for filter to apply
        await page.waitForTimeout(500);

        const items = page.locator('#calculator-list .list-item');
        const count = await items.count();
        // Should have fewer items (BMI-related calculators)
        expect(count).toBeGreaterThan(0);
        expect(count).toBeLessThan(92);

        // Stats should update
        const stats = page.locator('#calculator-stats');
        const statsText = await stats.textContent();
        expect(statsText).not.toContain('92 / 92');
    });

    test('category filter narrows results', async ({ page }) => {
        await setupAuthenticatedContext(page);
        await page.goto('/index.html');
        await waitForCalculatorList(page);

        // Select a category
        const categorySelect = page.locator('#category-select');
        // Get available options
        const options = await categorySelect.locator('option').allTextContents();
        expect(options.length).toBeGreaterThan(1); // At least "All" + one category

        // Select the second category (first non-All option)
        const secondOption = await categorySelect.locator('option').nth(1).getAttribute('value');
        await categorySelect.selectOption(secondOption!);

        await page.waitForTimeout(500);

        const items = page.locator('#calculator-list .list-item');
        const count = await items.count();
        // Should have a subset of calculators
        expect(count).toBeGreaterThan(0);
        expect(count).toBeLessThan(92);
    });

    test('sort Z-A reverses list order', async ({ page }) => {
        await setupAuthenticatedContext(page);
        await page.goto('/index.html');
        await waitForCalculatorList(page);

        // Get first item in default A-Z order
        const firstItemAZ = await page.locator('#calculator-list .list-item .list-item-title').first().textContent();

        // Switch to Z-A
        await page.locator('#sort-select').selectOption('z-a');
        await page.waitForTimeout(500);

        const firstItemZA = await page.locator('#calculator-list .list-item .list-item-title').first().textContent();
        const lastItemZA = await page.locator('#calculator-list .list-item .list-item-title').last().textContent();

        // First item in Z-A should be alphabetically after the last item
        expect(firstItemZA!.localeCompare(lastItemZA!)).toBeGreaterThan(0);
        // The first item in Z-A should differ from A-Z first item
        expect(firstItemZA).not.toBe(firstItemAZ);
    });

    test('favorite toggle and filter', async ({ page }) => {
        await setupAuthenticatedContext(page);
        await page.goto('/index.html');
        await waitForCalculatorList(page);

        // Click the first favorite button
        const firstFavoriteBtn = page.locator('.favorite-btn').first();
        const initialText = await firstFavoriteBtn.textContent();

        await firstFavoriteBtn.click();
        await page.waitForTimeout(500);

        // The button text should have changed (star toggled)
        const afterText = await firstFavoriteBtn.textContent();
        expect(afterText).not.toBe(initialText);

        // Filter by favorites
        const favoritesFilter = page.locator('.filter-btn[data-filter="favorites"]');
        await favoritesFilter.click();
        await page.waitForTimeout(500);

        // Should show exactly 1 item (the one we just favorited)
        const items = page.locator('#calculator-list .list-item');
        const count = await items.count();
        expect(count).toBe(1);
    });

    test('calculator links point to correct pages', async ({ page }) => {
        await setupAuthenticatedContext(page);
        await page.goto('/index.html');
        await waitForCalculatorList(page);

        // Verify calculator links have correct href format
        const firstLink = page.locator('#calculator-list .list-item').first();
        const href = await firstLink.getAttribute('href');
        expect(href).toContain('calculator.html?name=');

        // Navigate using the href to verify the page loads
        await page.goto(`/${href}`);
        await page.waitForURL('**/calculator.html?name=*', { timeout: 10000 });
        expect(page.url()).toContain('calculator.html?name=');

        // Verify the calculator page loaded
        const container = page.locator('#calculator-container');
        await expect(container).toBeVisible();
    });

    test('clearing search restores full list', async ({ page }) => {
        await setupAuthenticatedContext(page);
        await page.goto('/index.html');
        await waitForCalculatorList(page);

        // Search for something
        const searchBar = page.locator('#search-bar');
        await searchBar.fill('BMI');
        await searchBar.dispatchEvent('input');
        await page.waitForTimeout(500);

        // Verify filtered
        let stats = await getCalculatorStats(page);
        expect(stats!.showing).toBeLessThan(stats!.total);

        // Clear search
        await searchBar.fill('');
        await searchBar.dispatchEvent('input');
        await page.waitForTimeout(500);

        // All calculators should be back
        stats = await getCalculatorStats(page);
        expect(stats!.showing).toBe(stats!.total);
    });
});
