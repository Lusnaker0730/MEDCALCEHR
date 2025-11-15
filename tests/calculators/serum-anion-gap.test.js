import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { cleanupDOM } from './test-helpers.js';
import { serumaniongap } from '../../js/calculators/serum-anion-gap/index.js';

describe('Serum Anion Gap Calculator', () => {
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
        test('should export calculator object', () => {
            expect(serumaniongap).toBeDefined();
            expect(typeof serumaniongap.generateHTML).toBe('function');
            expect(typeof serumaniongap.initialize).toBe('function');
        });

        test('should have correct calculator ID', () => {
            expect(serumaniongap.id).toBe('serum-anion-gap');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = serumaniongap.generateHTML();
            expect(html).toBeDefined();
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include result container', () => {
            const html = serumaniongap.generateHTML();
            container.innerHTML = html;

            const resultContainer = container.querySelector('.result-container, .result, [id$="-result"]');
            expect(resultContainer).toBeTruthy();
        });
    });

    describe('FHIR Integration', () => {
        test('should work without FHIR client', () => {
            const html = serumaniongap.generateHTML();
            container.innerHTML = html;

            expect(() => {
                serumaniongap.initialize(null, null, container);
            }).not.toThrow();
        });
    });

    describe('Basic Functionality', () => {
        beforeEach(() => {
            const html = serumaniongap.generateHTML();
            container.innerHTML = html;
            serumaniongap.initialize(null, null, container);
        });

        test('should initialize without errors', () => {
            expect(container.innerHTML.length).toBeGreaterThan(0);
        });

        test('should have input fields', () => {
            const inputs = container.querySelectorAll('input');
            expect(inputs.length).toBeGreaterThan(0);
        });
    });
});
