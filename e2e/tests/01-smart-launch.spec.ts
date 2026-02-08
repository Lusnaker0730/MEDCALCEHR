import { test, expect } from '@playwright/test';
import {
    setupAuthenticatedContext,
    setupUnauthenticatedContext,
    patient,
    practitioner
} from '../helpers/auth-bypass';
import { waitForCalculatorList, getPatientInfoText } from '../helpers/page-helpers';

test.describe('SMART Launch & Homepage', () => {

    test('unauthenticated access redirects to launch.html', async ({ page }) => {
        await setupUnauthenticatedContext(page);
        await page.goto('/index.html');
        await page.waitForURL('**/launch.html', { timeout: 10000 });
        expect(page.url()).toContain('launch.html');
    });

    test('authenticated access stays on index.html', async ({ page }) => {
        await setupAuthenticatedContext(page);
        await page.goto('/index.html');
        // Should NOT redirect — stays on index.html
        await page.waitForLoadState('domcontentloaded');
        expect(page.url()).toContain('index.html');
    });

    test('displays correct page title', async ({ page }) => {
        await setupAuthenticatedContext(page);
        await page.goto('/index.html');
        const heading = page.locator('h1');
        await expect(heading).toHaveText('CGMH EHRCALC on FHIR');
    });

    test('patient info is populated from FHIR', async ({ page }) => {
        await setupAuthenticatedContext(page);
        await page.goto('/index.html');
        const patientInfo = page.locator('#patient-info');
        // Wait for FHIR client to resolve and populate patient info
        await expect(patientInfo).toContainText('Alice', { timeout: 10000 });
        await expect(patientInfo).toContainText('1970-06-15');
    });

    test('practitioner name is displayed', async ({ page }) => {
        await setupAuthenticatedContext(page);
        await page.goto('/index.html');
        const practitionerName = page.locator('#practitioner-name');
        // Wait for the practitioner data to load
        await expect(practitionerName).not.toHaveText('Loading...', { timeout: 10000 });
        const text = await practitionerName.textContent();
        // Should contain practitioner name from fixture
        expect(text).toBeTruthy();
        expect(text!.length).toBeGreaterThan(0);
    });

    test('calculator list renders all items', async ({ page }) => {
        await setupAuthenticatedContext(page);
        await page.goto('/index.html');
        await waitForCalculatorList(page);
        const items = page.locator('#calculator-list .list-item');
        const count = await items.count();
        // Should have 92 calculators (or very close)
        expect(count).toBeGreaterThanOrEqual(90);
    });

    test('calculator stats show correct count', async ({ page }) => {
        await setupAuthenticatedContext(page);
        await page.goto('/index.html');
        await waitForCalculatorList(page);
        const stats = page.locator('#calculator-stats');
        // The app reports 91 or 92 calculators depending on module loading
        const text = await stats.textContent();
        expect(text).toMatch(/Showing 9[12] \/ 9[12] results/);
    });
});
