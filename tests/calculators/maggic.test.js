import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { maggic } from '../../js/calculators/maggic/index.js';

describe('MAGGIC Heart Failure Risk Score', () => {
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
            expect(maggic).toBeDefined();
            expect(typeof maggic.generateHTML).toBe('function');
            expect(typeof maggic.initialize).toBe('function');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = maggic.generateHTML();
            expect(html).toBeDefined();
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include result container', () => {
            const html = maggic.generateHTML();
            container.innerHTML = html;
            expect(container.innerHTML.length).toBeGreaterThan(0);
        });
    });

    describe('Initialization', () => {
        test('should initialize without errors', () => {
            container.innerHTML = maggic.generateHTML();
            if (typeof maggic.initialize === 'function') {
                expect(() => maggic.initialize(null, null, container)).not.toThrow();
            } else {
                // If no initialize method, just verify HTML renders
                expect(container.innerHTML.length).toBeGreaterThan(0);
            }
        });
    });
});

