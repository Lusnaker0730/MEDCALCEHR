import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { ethanolConcentration } from '../../js/calculators/ethanol-concentration/index.js';

describe('Ethanol Concentration Calculator', () => {
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
            expect(ethanolConcentration).toBeDefined();
            expect(typeof ethanolConcentration.generateHTML).toBe('function');
            expect(typeof ethanolConcentration.initialize).toBe('function');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = ethanolConcentration.generateHTML();
            expect(html).toBeDefined();
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include result container', () => {
            container.innerHTML = ethanolConcentration.generateHTML();
            const resultContainer = container.querySelector('#ethanol-result');
            expect(resultContainer).toBeTruthy();
        });
    });

    describe('Initialization', () => {
        test('should initialize without errors', () => {
            container.innerHTML = ethanolConcentration.generateHTML();
            expect(() => ethanolConcentration.initialize(null, null, container)).not.toThrow();
        });
    });
});

