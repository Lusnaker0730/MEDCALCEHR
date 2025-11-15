import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { cleanupDOM } from './test-helpers.js';
import { kawasaki } from '../../js/calculators/kawasaki/index.js';

describe('Kawasaki Calculator', () => {
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
            expect(kawasaki).toBeDefined();
            expect(typeof kawasaki.generateHTML).toBe('function');
            expect(typeof kawasaki.initialize).toBe('function');
        });

        test('should have correct calculator ID', () => {
            expect(kawasaki.id).toBe('kawasaki');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = kawasaki.generateHTML();
            expect(html).toBeDefined();
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include result container', () => {
            const html = kawasaki.generateHTML();
            container.innerHTML = html;

            const resultContainer = container.querySelector('.result-container, .result, [id$="-result"]');
            expect(resultContainer).toBeTruthy();
        });
    });

    describe('FHIR Integration', () => {
        test('should work without FHIR client', () => {
            const html = kawasaki.generateHTML();
            container.innerHTML = html;

            expect(() => {
                kawasaki.initialize(null, null, container);
            }).not.toThrow();
        });
    });

    describe('Basic Functionality', () => {
        beforeEach(() => {
            const html = kawasaki.generateHTML();
            container.innerHTML = html;
            kawasaki.initialize(null, null, container);
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
