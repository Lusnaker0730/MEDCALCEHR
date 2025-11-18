import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { hepScore } from '../../js/calculators/4ts-hit/index.js';

describe('4Ts Score for HIT', () => {
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
            expect(hepScore).toBeDefined();
            expect(typeof hepScore.generateHTML).toBe('function');
            expect(typeof hepScore.initialize).toBe('function');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = hepScore.generateHTML();
            expect(html).toBeDefined();
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include result container', () => {
            container.innerHTML = hepScore.generateHTML();
            const resultContainer = container.querySelector('.result-container');
            expect(resultContainer).toBeTruthy();
        });
    });

    describe('Initialization', () => {
        test('should initialize without errors', () => {
            container.innerHTML = hepScore.generateHTML();
            expect(() => hepScore.initialize(null, null, container)).not.toThrow();
        });
    });
});

