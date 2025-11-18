import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { cleanupDOM } from './test-helpers.js';
import { calciumCorrection } from '../../js/calculators/calcium-correction/index.js';

describe('Calcium Correction Calculator', () => {
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
            expect(calciumCorrection).toBeDefined();
            expect(typeof calciumCorrection.generateHTML).toBe('function');
            expect(typeof calciumCorrection.initialize).toBe('function');
        });

        test('should have correct calculator ID', () => {
            expect(calciumCorrection.id).toBe('calcium-correction');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = calciumCorrection.generateHTML();
            expect(html).toBeDefined();
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include result container', () => {
            const html = calciumCorrection.generateHTML();
            container.innerHTML = html;

            const resultContainer = container.querySelector('.result-container, .result, [id$="-result"]');
            expect(resultContainer).toBeTruthy();
        });
    });

    describe('FHIR Integration', () => {
        test('should work without FHIR client', () => {
            const html = calciumCorrection.generateHTML();
            container.innerHTML = html;

            expect(() => {
                calciumCorrection.initialize(null, null, container);
            }).not.toThrow();
        });
    });

    describe('Basic Functionality', () => {
        beforeEach(() => {
            const html = calciumCorrection.generateHTML();
            container.innerHTML = html;
            calciumCorrection.initialize(null, null, container);
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
