import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { abl } from '../../js/calculators/abl/index.js';

describe('ABL (Adjusted Body Weight for Liver Disease)', () => {
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
            expect(abl).toBeDefined();
            expect(typeof abl.generateHTML).toBe('function');
            expect(typeof abl.initialize).toBe('function');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = abl.generateHTML();
            expect(html).toBeDefined();
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include result container', () => {
            container.innerHTML = abl.generateHTML();
            const resultContainer = container.querySelector('.result-container');
            expect(resultContainer).toBeTruthy();
        });
    });

    describe('Initialization', () => {
        test('should initialize without errors', () => {
            container.innerHTML = abl.generateHTML();
            expect(() => abl.initialize(null, null, container)).not.toThrow();
        });
    });
});

