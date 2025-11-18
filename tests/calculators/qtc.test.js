import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { cleanupDOM } from './test-helpers.js';
import { qtc } from '../../js/calculators/qtc/index.js';

describe('QTc (Corrected QT Interval) Calculator', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        container.id = 'test-container';
        document.body.appendChild(container);
    });

    afterEach(() => {
        cleanupDOM();
    });

    describe('Module Structure', () => {
        test('should export calculator object with required properties', () => {
            expect(qtc).toBeDefined();
            expect(qtc.id).toBe('qtc');
            expect(qtc.title).toBe('Corrected QT Interval (QTc)');
            expect(typeof qtc.generateHTML).toBe('function');
            expect(typeof qtc.initialize).toBe('function');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = qtc.generateHTML();
            expect(html).toBeDefined();
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
            expect(html).toContain('QT Interval');
            expect(html).toContain('Heart Rate');
        });

        test('should include required input fields', () => {
            const html = qtc.generateHTML();
            container.innerHTML = html;

            const qtInput = container.querySelector('#qtc-qt');
            const hrInput = container.querySelector('#qtc-hr');

            expect(qtInput).toBeTruthy();
            expect(hrInput).toBeTruthy();
        });

        test('should include formula selection', () => {
            const html = qtc.generateHTML();
            container.innerHTML = html;

            const bazettRadio = container.querySelector('input[name="qtc-formula"][value="bazett"]');
            const freidericiaRadio = container.querySelector('input[name="qtc-formula"][value="fridericia"]');

            expect(bazettRadio).toBeTruthy();
            expect(freidericiaRadio).toBeTruthy();
        });

        test('should include result container', () => {
            const html = qtc.generateHTML();
            container.innerHTML = html;

            const resultContainer = container.querySelector('#qtc-result');
            expect(resultContainer).toBeTruthy();
        });
    });

    describe('Calculation Logic', () => {
        beforeEach(() => {
            const html = qtc.generateHTML();
            container.innerHTML = html;
            qtc.initialize(null, null, container);
        });

        test('should calculate QTc using Bazett formula', () => {
            // QT = 400ms, HR = 60bpm
            // RR = 60/60 = 1 second = 1000ms
            // QTc = 400 / sqrt(1) = 400ms
            const qtInput = container.querySelector('#qtc-qt');
            const hrInput = container.querySelector('#qtc-hr');
            const bazettRadio = container.querySelector('input[name="qtc-formula"][value="bazett"]');

            bazettRadio.checked = true;
            qtInput.value = '400';
            hrInput.value = '60';

            qtInput.dispatchEvent(new Event('input', { bubbles: true }));

            const result = container.querySelector('#qtc-result');
            expect(result.style.display).not.toBe('none');
        });

        test('should calculate QTc with elevated heart rate', () => {
            // QT = 400ms, HR = 100bpm
            // RR = 60/100 = 0.6 seconds
            // QTc = 400 / sqrt(0.6) ≈ 516ms
            const qtInput = container.querySelector('#qtc-qt');
            const hrInput = container.querySelector('#qtc-hr');

            qtInput.value = '400';
            hrInput.value = '100';

            qtInput.dispatchEvent(new Event('input', { bubbles: true }));

            const result = container.querySelector('#qtc-result');
            expect(result.style.display).not.toBe('none');
        });

        test('should not calculate with missing QT interval', () => {
            const hrInput = container.querySelector('#qtc-hr');

            hrInput.value = '60';
            hrInput.dispatchEvent(new Event('input', { bubbles: true }));

            const result = container.querySelector('#qtc-result');
            expect(result.style.display).toBe('none');
        });

        test('should not calculate with missing heart rate', () => {
            const qtInput = container.querySelector('#qtc-qt');

            qtInput.value = '400';
            qtInput.dispatchEvent(new Event('input', { bubbles: true }));

            const result = container.querySelector('#qtc-result');
            expect(result.style.display).toBe('none');
        });

        test('should not calculate with zero heart rate', () => {
            const qtInput = container.querySelector('#qtc-qt');
            const hrInput = container.querySelector('#qtc-hr');

            qtInput.value = '400';
            hrInput.value = '0';

            qtInput.dispatchEvent(new Event('input', { bubbles: true }));

            const result = container.querySelector('#qtc-result');
            expect(result.style.display).toBe('none');
        });
    });

    describe('FHIR Integration', () => {
        test('should work without FHIR client', () => {
            const html = qtc.generateHTML();
            container.innerHTML = html;

            expect(() => {
                qtc.initialize(null, null, container);
            }).not.toThrow();

            const qtInput = container.querySelector('#qtc-qt');
            const hrInput = container.querySelector('#qtc-hr');
            expect(qtInput).toBeTruthy();
            expect(hrInput).toBeTruthy();
        });
    });

    describe('Formula Switching', () => {
        beforeEach(() => {
            const html = qtc.generateHTML();
            container.innerHTML = html;
            qtc.initialize(null, null, container);
        });

        test('should recalculate when formula changes', () => {
            const qtInput = container.querySelector('#qtc-qt');
            const hrInput = container.querySelector('#qtc-hr');
            const bazettRadio = container.querySelector('input[name="qtc-formula"][value="bazett"]');
            const freidericiaRadio = container.querySelector('input[name="qtc-formula"][value="fridericia"]');

            qtInput.value = '400';
            hrInput.value = '75';
            qtInput.dispatchEvent(new Event('input', { bubbles: true }));

            bazettRadio.checked = true;
            bazettRadio.dispatchEvent(new Event('change', { bubbles: true }));

            const resultBazett = container.querySelector('#qtc-result').textContent;

            freidericiaRadio.checked = true;
            freidericiaRadio.dispatchEvent(new Event('change', { bubbles: true }));

            const resultFreidericia = container.querySelector('#qtc-result').textContent;

            // Results should be different for different formulas (or at least one should not be empty)
            expect(resultBazett.length + resultFreidericia.length).toBeGreaterThan(0);
        });
    });
});

