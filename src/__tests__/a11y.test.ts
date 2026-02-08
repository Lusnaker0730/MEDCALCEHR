/**
 * Accessibility tests using jest-axe
 * Validates UIBuilder output HTML for WCAG 2.1 AA violations
 */

import { axe, toHaveNoViolations } from 'jest-axe';
import { UIBuilder } from '../ui-builder';

expect.extend(toHaveNoViolations);

const ui = new UIBuilder();

function renderInDocument(html: string): HTMLElement {
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);
    return container;
}

afterEach(() => {
    document.body.innerHTML = '';
});

describe('UIBuilder Accessibility', () => {
    test('createInput generates accessible HTML', async () => {
        const html = ui.createInput({
            id: 'test-weight',
            label: 'Weight',
            type: 'number',
            required: true,
            helpText: 'Enter weight in kg',
            min: 0,
            max: 500,
        });
        const container = renderInDocument(html);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    test('createRadioGroup generates accessible HTML with fieldset/legend', async () => {
        const html = ui.createRadioGroup({
            name: 'gender',
            label: 'Gender',
            required: true,
            options: [
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
            ],
        });
        const container = renderInDocument(html);
        const results = await axe(container);
        expect(results).toHaveNoViolations();

        // Verify fieldset/legend structure
        expect(container.querySelector('fieldset')).toBeTruthy();
        expect(container.querySelector('legend')).toBeTruthy();
    });

    test('createCheckboxGroup generates accessible HTML with fieldset/legend', async () => {
        const html = ui.createCheckboxGroup({
            name: 'symptoms',
            label: 'Symptoms',
            options: [
                { value: 'fever', label: 'Fever' },
                { value: 'cough', label: 'Cough' },
            ],
        });
        const container = renderInDocument(html);
        const results = await axe(container);
        expect(results).toHaveNoViolations();

        expect(container.querySelector('fieldset')).toBeTruthy();
        expect(container.querySelector('legend')).toBeTruthy();
    });

    test('createSelect generates accessible HTML', async () => {
        const html = ui.createSelect({
            id: 'test-unit',
            label: 'Unit',
            required: true,
            helpText: 'Choose a unit',
            options: [
                { value: 'kg', label: 'Kilograms' },
                { value: 'lbs', label: 'Pounds' },
            ],
        });
        const container = renderInDocument(html);
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    test('createAlert generates accessible HTML with role="alert"', async () => {
        const html = ui.createAlert({
            type: 'danger',
            message: 'Critical value detected',
        });
        const container = renderInDocument(html);
        const results = await axe(container);
        expect(results).toHaveNoViolations();

        const alert = container.querySelector('[role="alert"]');
        expect(alert).toBeTruthy();
        expect(alert?.getAttribute('aria-live')).toBe('assertive');
    });

    test('createResultBox generates accessible HTML with aria-live', async () => {
        const html = ui.createResultBox({
            id: 'test-result',
            title: 'Results',
        });
        const container = renderInDocument(html);
        const results = await axe(container);
        expect(results).toHaveNoViolations();

        const resultContent = container.querySelector('.ui-result-content');
        expect(resultContent?.getAttribute('aria-live')).toBe('polite');
        expect(resultContent?.getAttribute('role')).toBe('region');
    });

    test('createResultItem includes non-color state indicators', () => {
        const html = ui.createResultItem({
            label: 'Score',
            value: 5,
            interpretation: 'Low risk',
            alertClass: 'success',
        });
        const container = document.createElement('div');
        container.innerHTML = html;

        // Should have state icon
        expect(container.querySelector('.state-icon')).toBeTruthy();
        // Should have sr-only text
        expect(container.querySelector('.sr-only')).toBeTruthy();
    });
});
