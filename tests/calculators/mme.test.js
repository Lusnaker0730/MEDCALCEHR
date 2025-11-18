import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { mme } from '../../js/calculators/mme/index.js';

describe('MME (Morphine Milligram Equivalents) Calculator', () => {
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
            expect(mme).toBeDefined();
            expect(typeof mme.generateHTML).toBe('function');
            expect(typeof mme.initialize).toBe('function');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = mme.generateHTML();
            expect(html).toBeDefined();
            expect(html.length).toBeGreaterThan(0);
        });
    });

    describe('Initialization', () => {
        test('should initialize without errors', () => {
            container.innerHTML = mme.generateHTML();
            expect(() => mme.initialize(null, null, container)).not.toThrow();
        });
    });
});

