import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { steroidConversion } from '../../js/calculators/steroid-conversion/index.js';

describe('Steroid Conversion Calculator', () => {
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
            expect(steroidConversion).toBeDefined();
            expect(typeof steroidConversion.generateHTML).toBe('function');
            expect(typeof steroidConversion.initialize).toBe('function');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = steroidConversion.generateHTML();
            expect(html).toBeDefined();
            expect(html.length).toBeGreaterThan(0);
        });
    });

    describe('Initialization', () => {
        test('should initialize without errors', () => {
            container.innerHTML = steroidConversion.generateHTML();
            expect(() => steroidConversion.initialize(null, null, container)).not.toThrow();
        });
    });
});

