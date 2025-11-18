import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { score2Diabetes } from '../../js/calculators/score2-diabetes/index.js';

describe('SCORE2-Diabetes Risk Score', () => {
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
            expect(score2Diabetes).toBeDefined();
            expect(typeof score2Diabetes.generateHTML).toBe('function');
            expect(typeof score2Diabetes.initialize).toBe('function');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = score2Diabetes.generateHTML();
            expect(html).toBeDefined();
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include result container', () => {
            const html = score2Diabetes.generateHTML();
            container.innerHTML = html;
            expect(container.innerHTML.length).toBeGreaterThan(0);
        });
    });

    describe('Initialization', () => {
        test('should initialize without errors', () => {
            container.innerHTML = score2Diabetes.generateHTML();
            if (typeof score2Diabetes.initialize === 'function') {
                expect(() => score2Diabetes.initialize(null, null, container)).not.toThrow();
            } else {
                // If no initialize method, just verify HTML renders
                expect(container.innerHTML.length).toBeGreaterThan(0);
            }
        });
    });
});

