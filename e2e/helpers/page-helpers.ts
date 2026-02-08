import { Page, expect } from '@playwright/test';

/**
 * Wait for the calculator list to be populated on the homepage.
 */
export async function waitForCalculatorList(page: Page) {
    await page.waitForSelector('#calculator-list .list-item', { timeout: 15000 });
}

/**
 * Navigate to a specific calculator by its ID.
 */
export async function navigateToCalculator(page: Page, calculatorId: string) {
    await page.goto(`/calculator.html?name=${calculatorId}`);
    await page.waitForSelector('#calculator-container', { timeout: 15000 });
}

/**
 * Fill an input field with a value and trigger an input event.
 */
export async function fillInput(page: Page, selector: string, value: string) {
    const input = page.locator(selector);
    await input.fill(value);
    await input.dispatchEvent('input');
    await input.dispatchEvent('change');
}

/**
 * Wait for a result to appear in the result box.
 */
export async function waitForResult(page: Page, selector: string) {
    await page.waitForSelector(selector, { timeout: 10000 });
    return page.locator(selector);
}

/**
 * Get the text content of the patient info section.
 */
export async function getPatientInfoText(page: Page) {
    await page.waitForSelector('#patient-info p', { timeout: 10000 });
    return page.locator('#patient-info').textContent();
}

/**
 * Get the calculator count from the stats display.
 */
export async function getCalculatorStats(page: Page) {
    const text = await page.locator('#calculator-stats').textContent();
    const match = text?.match(/Showing (\d+) \/ (\d+)/);
    return match ? { showing: parseInt(match[1]), total: parseInt(match[2]) } : null;
}
