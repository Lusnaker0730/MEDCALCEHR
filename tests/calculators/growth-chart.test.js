import { growthChart } from '../../js/calculators/growth-chart/index.js';
import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';

describe('Growth Chart (Pediatric)', () => {
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
            expect(growthChart).toBeDefined();
            expect(typeof growthChart.generateHTML).toBe('function');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = growthChart.generateHTML();
            expect(html).toBeDefined();
            expect(html.length).toBeGreaterThan(0);
        });
    });

    describe('Initialization', () => {
        test('should initialize without errors', () => {
            container.innerHTML = growthChart.generateHTML();
            if (typeof growthChart.initialize === 'function') {
                expect(() => growthChart.initialize(null, null, container)).not.toThrow();
            } else {
                expect(container.innerHTML.length).toBeGreaterThan(0);
            }
        });
    });
});
