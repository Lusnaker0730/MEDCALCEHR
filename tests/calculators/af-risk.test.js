import { afRisk } from '../../js/calculators/af-risk/index.js';
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';

describe('AF Risk Score', () => {
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
            expect(afRisk).toBeDefined();
            expect(typeof afRisk.generateHTML).toBe('function');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = afRisk.generateHTML();
            expect(html).toBeDefined();
            expect(html.length).toBeGreaterThan(0);
        });
    });

    describe('Initialization', () => {
        test('should initialize without errors', () => {
            container.innerHTML = afRisk.generateHTML();
            if (typeof afRisk.initialize === 'function') {
                expect(() => afRisk.initialize(null, null, container)).not.toThrow();
            } else {
                expect(container.innerHTML.length).toBeGreaterThan(0);
            }
        });
    });
});
