import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { cleanupDOM } from './test-helpers.js';
import { maintenancefluids } from '../../js/calculators/maintenance-fluids/index.js';

describe('Maintenance Fluids Calculator', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        container.id = 'test-container';
        document.body.appendChild(container);
    });

    afterEach(() => {
        cleanupDOM();
    });

    describe('Module Structure', () => {
        test('should export calculator object', () => {
            expect(maintenancefluids).toBeDefined();
            expect(typeof maintenancefluids.generateHTML).toBe('function');
            expect(typeof maintenancefluids.initialize).toBe('function');
        });

        test('should have correct calculator ID', () => {
            expect(maintenancefluids.id).toBe('maintenance-fluids');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = maintenancefluids.generateHTML();
            expect(html).toBeDefined();
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include result container', () => {
            const html = maintenancefluids.generateHTML();
            container.innerHTML = html;

            const resultContainer = container.querySelector('.result-container, .result, [id$="-result"]');
            expect(resultContainer).toBeTruthy();
        });
    });

    describe('FHIR Integration', () => {
        test('should work without FHIR client', () => {
            const html = maintenancefluids.generateHTML();
            container.innerHTML = html;

            expect(() => {
                maintenancefluids.initialize(null, null, container);
            }).not.toThrow();
        });
    });

    describe('Basic Functionality', () => {
        beforeEach(() => {
            const html = maintenancefluids.generateHTML();
            container.innerHTML = html;
            maintenancefluids.initialize(null, null, container);
        });

        test('should initialize without errors', () => {
            expect(container.innerHTML.length).toBeGreaterThan(0);
        });

        test('should have input fields', () => {
            const inputs = container.querySelectorAll('input');
            expect(inputs.length).toBeGreaterThan(0);
        });
    });
});
