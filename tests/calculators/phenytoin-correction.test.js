import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { phenytoinCorrection } from '../../js/calculators/phenytoin-correction/index.js';

describe('Phenytoin Correction Calculator', () => {
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
            expect(phenytoinCorrection).toBeDefined();
            expect(phenytoinCorrection.id).toBe('phenytoin-correction');
            expect(phenytoinCorrection.title).toBeDefined();
            expect(typeof phenytoinCorrection.generateHTML).toBe('function');
            expect(typeof phenytoinCorrection.initialize).toBe('function');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = phenytoinCorrection.generateHTML();
            expect(html).toBeDefined();
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include required input fields', () => {
            const html = phenytoinCorrection.generateHTML();
            container.innerHTML = html;

            const totalInput = container.querySelector('#pheny-total');
            const albuminInput = container.querySelector('#pheny-albumin');
            const renalRadios = container.querySelectorAll('input[name="pheny-renal"]');
            
            expect(totalInput).toBeTruthy();
            expect(albuminInput).toBeTruthy();
            expect(renalRadios.length).toBe(2);
        });
    });

    describe('Calculation Logic', () => {
        beforeEach(() => {
            const html = phenytoinCorrection.generateHTML();
            container.innerHTML = html;
            phenytoinCorrection.initialize(mockClient, null, container);
        });

        test('should calculate corrected phenytoin correctly (Normal Renal)', () => {
            // Total 8, Albumin 3.0, Normal Renal (K=0.1)
            // Corrected = 8 / [((1-0.1) * 3.0 / 4.4) + 0.1]
            // = 8 / [(0.9 * 0.6818) + 0.1]
            // = 8 / [0.6136 + 0.1]
            // = 8 / 0.7136
            // = 11.21
            
            const totalInput = container.querySelector('#pheny-total');
            const albuminInput = container.querySelector('#pheny-albumin');
            
            totalInput.value = '8.0';
            albuminInput.value = '3.0';
            
            totalInput.dispatchEvent(new Event('input', { bubbles: true }));

            const scoreEl = container.querySelector('.ui-result-value');
            expect(scoreEl).toBeTruthy();
            const result = parseFloat(scoreEl.textContent);
            expect(result).toBeCloseTo(11.2, 1);
        });

        test('should calculate corrected phenytoin correctly (Renal Failure)', () => {
            // Total 8, Albumin 3.0, Renal Failure (K=0.2)
            // Corrected = 8 / [((1-0.2) * 3.0 / 4.4) + 0.2]
            // = 8 / [(0.8 * 0.6818) + 0.2]
            // = 8 / [0.545 + 0.2]
            // = 8 / 0.745
            // = 10.73
            
            const totalInput = container.querySelector('#pheny-total');
            const albuminInput = container.querySelector('#pheny-albumin');
            const renalYesRadio = container.querySelector('input[name="pheny-renal"][value="yes"]');
            
            totalInput.value = '8.0';
            albuminInput.value = '3.0';
            if (renalYesRadio) {
                renalYesRadio.checked = true;
                renalYesRadio.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            totalInput.dispatchEvent(new Event('input', { bubbles: true }));

            const scoreEl = container.querySelector('.ui-result-value');
            expect(scoreEl).toBeTruthy();
            const result = parseFloat(scoreEl.textContent);
            expect(result).toBeCloseTo(10.7, 1);
        });
    });

    describe('Initialization', () => {
        test('should work without FHIR client', () => {
            const html = phenytoinCorrection.generateHTML();
            container.innerHTML = html;
            
            phenytoinCorrection.initialize(null, null, container);
            
            const resultContainer = container.querySelector('#phenytoin-result');
            expect(resultContainer).toBeTruthy();
        });
    });
});
