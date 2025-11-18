import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { ttkg } from '../../js/calculators/ttkg/index.js';

describe('TTKG (Transtubular Potassium Gradient) Calculator', () => {
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
            expect(ttkg).toBeDefined();
            expect(typeof ttkg.generateHTML).toBe('function');
            expect(typeof ttkg.initialize).toBe('function');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = ttkg.generateHTML();
            expect(html).toBeDefined();
            expect(html.length).toBeGreaterThan(0);
        });
    });

    describe('Initialization', () => {
        test('should initialize without errors', () => {
            container.innerHTML = ttkg.generateHTML();
            expect(() => ttkg.initialize(null, null, container)).not.toThrow();
        });
    });
});

