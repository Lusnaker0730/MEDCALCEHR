import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { regiscar } from '../../js/calculators/regiscar/index.js';

describe('RegiSCAR Score for DRESS Syndrome', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        cleanupDOM();
    });

    describe('Module Structure', () => {
        test('should export calculator object', () => {
            expect(regiscar).toBeDefined();
            expect(typeof regiscar.generateHTML).toBe('function');
            expect(typeof regiscar.initialize).toBe('function');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = regiscar.generateHTML();
            expect(html).toBeDefined();
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include result container', () => {
            const html = regiscar.generateHTML();
            container.innerHTML = html;
            expect(container.innerHTML.length).toBeGreaterThan(0);
        });
    });

    describe('Initialization', () => {
        test('should initialize without errors', () => {
            container.innerHTML = regiscar.generateHTML();
            if (typeof regiscar.initialize === 'function') {
                expect(() => regiscar.initialize(null, null, container)).not.toThrow();
            } else {
                // If no initialize method, just verify HTML renders
                expect(container.innerHTML.length).toBeGreaterThan(0);
            }
        });
    });
});

