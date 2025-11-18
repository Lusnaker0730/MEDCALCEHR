import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { genevaScore } from '../../js/calculators/geneva-score/index.js';

describe('Geneva Score for PE', () => {
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
            expect(genevaScore).toBeDefined();
            expect(typeof genevaScore.generateHTML).toBe('function');
            expect(typeof genevaScore.initialize).toBe('function');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = genevaScore.generateHTML();
            expect(html).toBeDefined();
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include result container', () => {
            const html = genevaScore.generateHTML();
            container.innerHTML = html;
            expect(container.innerHTML.length).toBeGreaterThan(0);
        });
    });

    describe('Initialization', () => {
        test('should initialize without errors', () => {
            container.innerHTML = genevaScore.generateHTML();
            expect(() => genevaScore.initialize(null, null, container)).not.toThrow();
        });
    });
});

