import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { cleanupDOM } from './test-helpers.js';
import { pecarn } from '../../js/calculators/pecarn/index.js';

describe('Pecarn Calculator', () => {
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
            expect(pecarn).toBeDefined();
            expect(typeof pecarn.generateHTML).toBe('function');
            expect(typeof pecarn.initialize).toBe('function');
        });

        test('should have correct calculator ID', () => {
            expect(pecarn.id).toBe('pecarn');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = pecarn.generateHTML();
            expect(html).toBeDefined();
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include result container', () => {
            const html = pecarn.generateHTML();
            container.innerHTML = html;

            const resultContainer = container.querySelector('.result-container, .result, [id$="-result"]');
            expect(resultContainer).toBeTruthy();
        });
    });

    describe('FHIR Integration', () => {
        test('should work without FHIR client', () => {
            const html = pecarn.generateHTML();
            container.innerHTML = html;

            expect(() => {
                pecarn.initialize(null, null, container);
            }).not.toThrow();
        });
    });

    describe('Basic Functionality', () => {
        beforeEach(() => {
            const html = pecarn.generateHTML();
            container.innerHTML = html;
            pecarn.initialize(null, null, container);
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
