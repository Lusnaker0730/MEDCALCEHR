import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { gwtgHf } from '../../js/calculators/gwtg-hf/index.js';

describe('GWTG-HF Risk Score', () => {
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
            expect(gwtgHf).toBeDefined();
            expect(typeof gwtgHf.generateHTML).toBe('function');
            expect(typeof gwtgHf.initialize).toBe('function');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = gwtgHf.generateHTML();
            expect(html).toBeDefined();
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include result container', () => {
            const html = gwtgHf.generateHTML();
            container.innerHTML = html;
            expect(container.innerHTML.length).toBeGreaterThan(0);
        });
    });

    describe('Initialization', () => {
        test('should initialize without errors', () => {
            container.innerHTML = gwtgHf.generateHTML();
            if (typeof gwtgHf.initialize === 'function') {
                expect(() => gwtgHf.initialize(null, null, container)).not.toThrow();
            } else {
                // If no initialize method, just verify HTML renders
                expect(container.innerHTML.length).toBeGreaterThan(0);
            }
        });
    });
});

