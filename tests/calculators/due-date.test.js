import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { cleanupDOM } from './test-helpers.js';
import { duedate } from '../../js/calculators/due-date/index.js';

describe('Due Date Calculator', () => {
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
            expect(duedate).toBeDefined();
            expect(typeof duedate.generateHTML).toBe('function');
            expect(typeof duedate.initialize).toBe('function');
        });

        test('should have correct calculator ID', () => {
            expect(duedate.id).toBe('due-date');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = duedate.generateHTML();
            expect(html).toBeDefined();
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include result container', () => {
            const html = duedate.generateHTML();
            container.innerHTML = html;

            const resultContainer = container.querySelector('.result-container, .result, [id$="-result"]');
            expect(resultContainer).toBeTruthy();
        });
    });

    describe('FHIR Integration', () => {
        test('should work without FHIR client', () => {
            const html = duedate.generateHTML();
            container.innerHTML = html;

            expect(() => {
                duedate.initialize(null, null, container);
            }).not.toThrow();
        });
    });

    describe('Basic Functionality', () => {
        beforeEach(() => {
            const html = duedate.generateHTML();
            container.innerHTML = html;
            duedate.initialize(null, null, container);
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
