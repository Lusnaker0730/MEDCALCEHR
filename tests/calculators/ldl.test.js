import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { ldl } from '../../js/calculators/ldl/index.js';

describe('LDL Cholesterol Calculator', () => {
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
            expect(ldl).toBeDefined();
            expect(typeof ldl.generateHTML).toBe('function');
            expect(typeof ldl.initialize).toBe('function');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = ldl.generateHTML();
            expect(html).toBeDefined();
            expect(html.length).toBeGreaterThan(0);
        });
    });

    describe('Initialization', () => {
        test('should initialize without errors', () => {
            container.innerHTML = ldl.generateHTML();
            expect(() => ldl.initialize(null, null, container)).not.toThrow();
        });
    });
});

