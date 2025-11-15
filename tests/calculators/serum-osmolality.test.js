import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { cleanupDOM } from './test-helpers.js';
import { serumosmolality } from '../../js/calculators/serum-osmolality/index.js';

describe('Serum Osmolality Calculator', () => {
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
            expect(serumosmolality).toBeDefined();
            expect(typeof serumosmolality.generateHTML).toBe('function');
            expect(typeof serumosmolality.initialize).toBe('function');
        });

        test('should have correct calculator ID', () => {
            expect(serumosmolality.id).toBe('serum-osmolality');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = serumosmolality.generateHTML();
            expect(html).toBeDefined();
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include result container', () => {
            const html = serumosmolality.generateHTML();
            container.innerHTML = html;

            const resultContainer = container.querySelector('.result-container, .result, [id$="-result"]');
            expect(resultContainer).toBeTruthy();
        });
    });

    describe('FHIR Integration', () => {
        test('should work without FHIR client', () => {
            const html = serumosmolality.generateHTML();
            container.innerHTML = html;

            expect(() => {
                serumosmolality.initialize(null, null, container);
            }).not.toThrow();
        });
    });

    describe('Basic Functionality', () => {
        beforeEach(() => {
            const html = serumosmolality.generateHTML();
            container.innerHTML = html;
            serumosmolality.initialize(null, null, container);
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
