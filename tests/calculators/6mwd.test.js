import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { cleanupDOM } from './test-helpers.js';
import { sixMwd } from '../../js/calculators/6mwd/index.js';

describe('sixMwd Calculator', () => {
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
            expect(sixMwd).toBeDefined();
            expect(typeof sixMwd.generateHTML).toBe('function');
            expect(typeof sixMwd.initialize).toBe('function');
        });

        test('should have correct calculator ID', () => {
            expect(sixMwd.id).toBe('6mwd');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = sixMwd.generateHTML();
            expect(html).toBeDefined();
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include result container', () => {
            const html = sixMwd.generateHTML();
            container.innerHTML = html;

            const resultContainer = container.querySelector('.result-container, .result, [id$="-result"]');
            expect(resultContainer).toBeTruthy();
        });
    });

    describe('FHIR Integration', () => {
        test('should work without FHIR client', () => {
            const html = sixMwd.generateHTML();
            container.innerHTML = html;

            expect(() => {
                sixMwd.initialize(null, null, container);
            }).not.toThrow();
        });
    });

    describe('Basic Functionality', () => {
        beforeEach(() => {
            const html = sixMwd.generateHTML();
            container.innerHTML = html;
            sixMwd.initialize(null, null, container);
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
