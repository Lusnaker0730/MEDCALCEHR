import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { preventCVD } from '../../js/calculators/prevent-cvd/index.js';

describe('PREVENT CVD Risk Score', () => {
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
            expect(preventCVD).toBeDefined();
            expect(typeof preventCVD.generateHTML).toBe('function');
            expect(typeof preventCVD.initialize).toBe('function');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = preventCVD.generateHTML();
            expect(html).toBeDefined();
            expect(html.length).toBeGreaterThan(0);
        });
    });

    describe('Initialization', () => {
        test('should initialize without errors', () => {
            container.innerHTML = preventCVD.generateHTML();
            expect(() => preventCVD.initialize(null, null, container)).not.toThrow();
        });
    });
});

