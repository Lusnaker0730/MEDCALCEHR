import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { cleanupDOM } from './test-helpers.js';
import { 6mwd } from '../../js/calculators/6mwd/index.js';

describe('6mwd Calculator', () => {
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
            expect(6mwd).toBeDefined();
            expect(typeof 6mwd.generateHTML).toBe('function');
            expect(typeof 6mwd.initialize).toBe('function');
        });

        test('should have correct calculator ID', () => {
            expect(6mwd.id).toBe('6mwd');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = 6mwd.generateHTML();
            expect(html).toBeDefined();
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include result container', () => {
            const html = 6mwd.generateHTML();
            container.innerHTML = html;

            const resultContainer = container.querySelector('.result-container, .result, [id$="-result"]');
            expect(resultContainer).toBeTruthy();
        });
    });

    describe('FHIR Integration', () => {
        test('should work without FHIR client', () => {
            const html = 6mwd.generateHTML();
            container.innerHTML = html;

            expect(() => {
                6mwd.initialize(null, null, container);
            }).not.toThrow();
        });
    });

    describe('Basic Functionality', () => {
        beforeEach(() => {
            const html = 6mwd.generateHTML();
            container.innerHTML = html;
            6mwd.initialize(null, null, container);
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
