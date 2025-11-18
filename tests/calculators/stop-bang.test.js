import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { cleanupDOM } from './test-helpers.js';
import { stopBang } from '../../js/calculators/stop-bang/index.js';

describe('Stop Bang Calculator', () => {
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
            expect(stopBang).toBeDefined();
            expect(typeof stopBang.generateHTML).toBe('function');
            expect(typeof stopBang.initialize).toBe('function');
        });

        test('should have correct calculator ID', () => {
            expect(stopBang.id).toBe('stop-bang');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = stopBang.generateHTML();
            expect(html).toBeDefined();
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include result container', () => {
            const html = stopBang.generateHTML();
            container.innerHTML = html;

            const resultContainer = container.querySelector('.stop-bang-result-container');
            expect(resultContainer).toBeTruthy();
        });
    });

    describe('FHIR Integration', () => {
        test('should work without FHIR client', () => {
            const html = stopBang.generateHTML();
            container.innerHTML = html;

            expect(() => {
                stopBang.initialize(null, null, container);
            }).not.toThrow();
        });
    });

    describe('Basic Functionality', () => {
        beforeEach(() => {
            const html = stopBang.generateHTML();
            container.innerHTML = html;
            stopBang.initialize(null, null, container);
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
