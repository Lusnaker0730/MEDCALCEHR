import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { hscore } from '../../js/calculators/hscore/index.js';

describe('HScore for Hemophagocytic Syndrome', () => {
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
            expect(hscore).toBeDefined();
            expect(typeof hscore.generateHTML).toBe('function');
            expect(typeof hscore.initialize).toBe('function');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = hscore.generateHTML();
            expect(html).toBeDefined();
            expect(html.length).toBeGreaterThan(0);
        });
    });

    describe('Initialization', () => {
        test('should initialize without errors', () => {
            container.innerHTML = hscore.generateHTML();
            expect(() => hscore.initialize(null, null, container)).not.toThrow();
        });
    });
});

