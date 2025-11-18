import { actionIcu } from '../../js/calculators/action-icu/index.js';
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';

describe('ACTION ICU Score', () => {
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
            expect(actionIcu).toBeDefined();
            expect(typeof actionIcu.generateHTML).toBe('function');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = actionIcu.generateHTML();
            expect(html).toBeDefined();
            expect(html.length).toBeGreaterThan(0);
        });
    });

    describe('Initialization', () => {
        test('should initialize without errors', () => {
            container.innerHTML = actionIcu.generateHTML();
            if (typeof actionIcu.initialize === 'function') {
                expect(() => actionIcu.initialize(null, null, container)).not.toThrow();
            } else {
                expect(container.innerHTML.length).toBeGreaterThan(0);
            }
        });
    });
});
