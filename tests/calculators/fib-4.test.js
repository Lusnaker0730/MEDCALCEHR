import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { cleanupDOM } from './test-helpers.js';
import { fib4 } from '../../js/calculators/fib-4/index.js';

describe('Fib 4 Calculator', () => {
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
            expect(fib4).toBeDefined();
            expect(typeof fib4.generateHTML).toBe('function');
            expect(typeof fib4.initialize).toBe('function');
        });

        test('should have correct calculator ID', () => {
            expect(fib4.id).toBe('fib-4');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = fib4.generateHTML();
            expect(html).toBeDefined();
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include result container', () => {
            const html = fib4.generateHTML();
            container.innerHTML = html;

            const resultContainer = container.querySelector('.result-container, .result, [id$="-result"]');
            expect(resultContainer).toBeTruthy();
        });
    });

    describe('FHIR Integration', () => {
        test('should work without FHIR client', () => {
            const html = fib4.generateHTML();
            container.innerHTML = html;

            expect(() => {
                fib4.initialize(null, null, container);
            }).not.toThrow();
        });
    });

    describe('Basic Functionality', () => {
        beforeEach(() => {
            const html = fib4.generateHTML();
            container.innerHTML = html;
            fib4.initialize(null, null, container);
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
