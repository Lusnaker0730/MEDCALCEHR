import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { benzoConversion } from '../../js/calculators/benzo-conversion/index.js';

describe('Benzodiazepine Conversion Calculator', () => {
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
            expect(benzoConversion).toBeDefined();
            expect(typeof benzoConversion.generateHTML).toBe('function');
            expect(typeof benzoConversion.initialize).toBe('function');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = benzoConversion.generateHTML();
            expect(html).toBeDefined();
            expect(html.length).toBeGreaterThan(0);
        });
    });

    describe('Initialization', () => {
        test('should initialize without errors', () => {
            container.innerHTML = benzoConversion.generateHTML();
            if (typeof benzoConversion.initialize === 'function') {
                expect(() => benzoConversion.initialize(null, null, container)).not.toThrow();
            } else {
                expect(container.innerHTML.length).toBeGreaterThan(0);
            }
        });
    });
});

