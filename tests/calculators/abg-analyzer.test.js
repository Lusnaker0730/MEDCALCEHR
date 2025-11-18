import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { abgAnalyzer } from '../../js/calculators/abg-analyzer/index.js';

describe('ABG Analyzer', () => {
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
            expect(abgAnalyzer).toBeDefined();
            expect(typeof abgAnalyzer.generateHTML).toBe('function');
            expect(typeof abgAnalyzer.initialize).toBe('function');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = abgAnalyzer.generateHTML();
            expect(html).toBeDefined();
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include result container', () => {
            container.innerHTML = abgAnalyzer.generateHTML();
            const resultContainer = container.querySelector('.result-container');
            expect(resultContainer).toBeTruthy();
        });
    });

    describe('Initialization', () => {
        test('should initialize without errors', () => {
            container.innerHTML = abgAnalyzer.generateHTML();
            expect(() => abgAnalyzer.initialize(null, null, container)).not.toThrow();
        });
    });
});

