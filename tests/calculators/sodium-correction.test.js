import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { sodiumCorrection } from '../../js/calculators/sodium-correction/index.js';

describe('Sodium Correction Calculator', () => {
    let container;
    let mockClient;

    beforeEach(() => {
        container = document.createElement('div');
        container.id = 'test-container';
        document.body.appendChild(container);
        mockClient = setupMockFHIRClient();
    });

    afterEach(() => {
        cleanupDOM();
    });

    describe('Module Structure', () => {
        test('should export calculator object with required properties', () => {
            expect(sodiumCorrection).toBeDefined();
            expect(sodiumCorrection.id).toBe('sodium-correction');
            expect(sodiumCorrection.title).toBeDefined();
            expect(typeof sodiumCorrection.generateHTML).toBe('function');
            expect(typeof sodiumCorrection.initialize).toBe('function');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = sodiumCorrection.generateHTML();
            expect(html).toBeDefined();
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include required input fields', () => {
            const html = sodiumCorrection.generateHTML();
            container.innerHTML = html;

            const sodiumInput = container.querySelector('#measured-sodium');
            const glucoseInput = container.querySelector('#glucose');
            const factorRadios = container.querySelectorAll('input[name="correction-factor"]');
            
            expect(sodiumInput).toBeTruthy();
            expect(glucoseInput).toBeTruthy();
            expect(factorRadios.length).toBe(2);
        });
    });

    describe('Calculation Logic', () => {
        beforeEach(() => {
            const html = sodiumCorrection.generateHTML();
            container.innerHTML = html;
            sodiumCorrection.initialize(mockClient, null, container);
        });

        test('should calculate corrected sodium correctly (Factor 1.6)', () => {
            // Na 130, Glucose 400
            // Corrected = 130 + 1.6 * ((400 - 100) / 100) = 130 + 1.6 * 3 = 130 + 4.8 = 134.8
            
            const sodiumInput = container.querySelector('#measured-sodium');
            const glucoseInput = container.querySelector('#glucose');
            
            sodiumInput.value = '130';
            glucoseInput.value = '400';
            
            sodiumInput.dispatchEvent(new Event('input', { bubbles: true }));

            const scoreEl = container.querySelector('.ui-result-value');
            expect(scoreEl).toBeTruthy();
            const result = parseFloat(scoreEl.textContent);
            expect(result).toBeCloseTo(134.8, 1);
        });

        test('should calculate corrected sodium correctly (Factor 2.4)', () => {
            // Na 130, Glucose 400, Factor 2.4
            // Corrected = 130 + 2.4 * 3 = 130 + 7.2 = 137.2
            
            const sodiumInput = container.querySelector('#measured-sodium');
            const glucoseInput = container.querySelector('#glucose');
            const factor24Radio = container.querySelector('input[name="correction-factor"][value="2.4"]');
            
            sodiumInput.value = '130';
            glucoseInput.value = '400';
            if (factor24Radio) {
                factor24Radio.checked = true;
                factor24Radio.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            sodiumInput.dispatchEvent(new Event('input', { bubbles: true }));

            const scoreEl = container.querySelector('.ui-result-value');
            expect(scoreEl).toBeTruthy();
            const result = parseFloat(scoreEl.textContent);
            expect(result).toBeCloseTo(137.2, 1);
        });
    });

    describe('Initialization', () => {
        test('should work without FHIR client', () => {
            const html = sodiumCorrection.generateHTML();
            container.innerHTML = html;
            
            sodiumCorrection.initialize(null, null, container);
            
            const resultContainer = container.querySelector('#sodium-correction-result');
            expect(resultContainer).toBeTruthy();
        });
    });
});
