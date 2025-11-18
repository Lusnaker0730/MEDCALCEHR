import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { tpaDosing } from '../../js/calculators/tpa-dosing-stroke/index.js';

describe('tPA Dosing for Stroke Calculator', () => {
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
            expect(tpaDosing).toBeDefined();
            expect(typeof tpaDosing.generateHTML).toBe('function');
            expect(typeof tpaDosing.initialize).toBe('function');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = tpaDosing.generateHTML();
            expect(html).toBeDefined();
            expect(html.length).toBeGreaterThan(0);
        });
    });

    describe('Initialization', () => {
        test('should initialize without errors', () => {
            container.innerHTML = tpaDosing.generateHTML();
            expect(() => tpaDosing.initialize(null, null, container)).not.toThrow();
        });
    });
});

