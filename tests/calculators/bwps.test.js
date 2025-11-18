import { bwps } from '../../js/calculators/bwps/index.js';
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';

describe('BWPS (Burns Warden Perioperative Score)', () => {
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
            expect(bwps).toBeDefined();
            expect(typeof bwps.generateHTML).toBe('function');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = bwps.generateHTML();
            expect(html).toBeDefined();
            expect(html.length).toBeGreaterThan(0);
        });
    });

    describe('Initialization', () => {
        test('should initialize without errors', () => {
            container.innerHTML = bwps.generateHTML();
            if (typeof bwps.initialize === 'function') {
                expect(() => bwps.initialize(null, null, container)).not.toThrow();
            } else {
                expect(container.innerHTML.length).toBeGreaterThan(0);
            }
        });
    });
});
