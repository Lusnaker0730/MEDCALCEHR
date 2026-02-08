import { test, expect } from '@playwright/test';
import { setupAuthenticatedContext } from '../helpers/auth-bypass';
import { navigateToCalculator } from '../helpers/page-helpers';

test.describe('Calculator FHIR Auto-Fill', () => {

    test('BMI-BSA weight and height auto-populate from FHIR', async ({ page }) => {
        await setupAuthenticatedContext(page);
        await navigateToCalculator(page, 'bmi-bsa');

        // Wait for the calculator HTML to render
        await page.waitForSelector('#calculator-container .calculator-card', { timeout: 15000 });

        // Wait for FHIR auto-fill to populate the inputs
        const weightInput = page.locator('#bmi-bsa-weight');
        const heightInput = page.locator('#bmi-bsa-height');

        // The FHIR data service auto-populates these after client.patient.request() resolves
        await expect(weightInput).not.toHaveValue('', { timeout: 15000 });
        await expect(heightInput).not.toHaveValue('', { timeout: 15000 });

        // Verify the values match our fixtures (weight=70, height=165)
        const weightVal = await weightInput.inputValue();
        const heightVal = await heightInput.inputValue();
        expect(parseFloat(weightVal)).toBe(70);
        expect(parseFloat(heightVal)).toBe(165);
    });

    test('BMI result is displayed after auto-fill', async ({ page }) => {
        await setupAuthenticatedContext(page);
        await navigateToCalculator(page, 'bmi-bsa');

        await page.waitForSelector('#calculator-container .calculator-card', { timeout: 15000 });

        // Wait for the result box to contain calculated BMI
        const resultBox = page.locator('#bmi-bsa-result');
        await expect(resultBox).toBeVisible({ timeout: 15000 });

        // BMI = 70 / (1.65^2) = 25.7 — should contain "kg/m" (unit)
        await expect(resultBox).toContainText('kg/m', { timeout: 15000 });
    });

    test('patient info displayed on calculator page', async ({ page }) => {
        await setupAuthenticatedContext(page);
        await navigateToCalculator(page, 'bmi-bsa');

        const patientInfo = page.locator('#patient-info');
        await expect(patientInfo).toContainText('Alice', { timeout: 10000 });
    });

    test('page title reflects calculator name', async ({ page }) => {
        await setupAuthenticatedContext(page);
        await navigateToCalculator(page, 'bmi-bsa');

        await page.waitForSelector('#calculator-container .calculator-card', { timeout: 15000 });

        const pageTitle = page.locator('#page-title');
        // Should contain the calculator title, not the default
        const text = await pageTitle.textContent();
        expect(text).toBeTruthy();
        // BMI-BSA calculator title should include "BMI"
        expect(text!.toLowerCase()).toContain('bmi');
    });
});
