import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { sexShock } from '../../js/calculators/sex-shock/index.js';

describe('SEX Shock Score', () => {
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
            expect(sexShock).toBeDefined();
            expect(typeof sexShock.generateHTML).toBe('function');
            expect(typeof sexShock.initialize).toBe('function');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = sexShock.generateHTML();
            expect(html).toBeDefined();
            expect(html.length).toBeGreaterThan(0);
        });
    });

    describe('Initialization', () => {
        test('should initialize without errors', () => {
            container.innerHTML = sexShock.generateHTML();
            expect(() => sexShock.initialize(null, null, container)).not.toThrow();
        });
    });
});

