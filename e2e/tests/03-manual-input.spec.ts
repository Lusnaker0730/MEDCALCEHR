import { test, expect } from '@playwright/test';
import { setupAuthenticatedEmptyFhir } from '../helpers/auth-bypass';
import { navigateToCalculator, fillInput } from '../helpers/page-helpers';

test.describe('Manual Input & Validation', () => {

    test('BMI-BSA with empty FHIR data — inputs start empty', async ({ page }) => {
        await setupAuthenticatedEmptyFhir(page);
        await navigateToCalculator(page, 'bmi-bsa');

        await page.waitForSelector('#calculator-container .calculator-card', { timeout: 15000 });

        const weightInput = page.locator('#bmi-bsa-weight');
        const heightInput = page.locator('#bmi-bsa-height');

        // With empty FHIR, inputs should be empty (no auto-fill)
        // Wait a moment for any async operations to settle
        await page.waitForTimeout(2000);
        const weightVal = await weightInput.inputValue();
        const heightVal = await heightInput.inputValue();
        expect(weightVal).toBe('');
        expect(heightVal).toBe('');
    });

    test('entering both weight and height produces result', async ({ page }) => {
        await setupAuthenticatedEmptyFhir(page);
        await navigateToCalculator(page, 'bmi-bsa');

        await page.waitForSelector('#calculator-container .calculator-card', { timeout: 15000 });

        // Use type() which dispatches keydown/keypress/keyup/input events per character
        const weightInput = page.locator('#bmi-bsa-weight');
        const heightInput = page.locator('#bmi-bsa-height');

        await weightInput.click();
        await weightInput.pressSequentially('80', { delay: 50 });
        await heightInput.click();
        await heightInput.pressSequentially('175', { delay: 50 });

        // Result should appear with BMI value
        const resultBox = page.locator('#bmi-bsa-result');
        await expect(resultBox).toContainText('kg/m', { timeout: 10000 });
    });

    test('entering only weight — result does not calculate BMI', async ({ page }) => {
        await setupAuthenticatedEmptyFhir(page);
        await navigateToCalculator(page, 'bmi-bsa');

        await page.waitForSelector('#calculator-container .calculator-card', { timeout: 15000 });

        // Enter weight only
        await page.locator('#bmi-bsa-weight').click();
        await page.locator('#bmi-bsa-weight').pressSequentially('80', { delay: 50 });

        // Wait for any calculation attempt
        await page.waitForTimeout(1000);

        // Result box should not show a BMI value (no "kg/m²")
        const resultBox = page.locator('#bmi-bsa-result');
        const resultText = await resultBox.textContent();
        // The calculator shows "fill out required fields" when height is missing
        expect(resultText).not.toMatch(/\d+\.\d+.*kg\/m/);
    });

    test('correcting an empty field produces result', async ({ page }) => {
        await setupAuthenticatedEmptyFhir(page);
        await navigateToCalculator(page, 'bmi-bsa');

        await page.waitForSelector('#calculator-container .calculator-card', { timeout: 15000 });

        // Start with just weight
        await page.locator('#bmi-bsa-weight').click();
        await page.locator('#bmi-bsa-weight').pressSequentially('70', { delay: 50 });
        await page.waitForTimeout(500);

        // Now add height — result should appear
        await page.locator('#bmi-bsa-height').click();
        await page.locator('#bmi-bsa-height').pressSequentially('170', { delay: 50 });

        const resultBox = page.locator('#bmi-bsa-result');
        // BMI = 70 / (1.70^2) = 24.2
        await expect(resultBox).toContainText('kg/m', { timeout: 10000 });
    });
});
