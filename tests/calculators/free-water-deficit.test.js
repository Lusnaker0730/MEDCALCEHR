import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { freeWaterDeficit } from '../../js/calculators/free-water-deficit/index.js';

describe('Free Water Deficit Calculator', () => {
    let container;
    let mockClient;
    let mockPatient;

    beforeEach(() => {
        container = document.createElement('div');
        container.id = 'test-container';
        document.body.appendChild(container);
        mockClient = setupMockFHIRClient();
        mockPatient = mockPatientData();
    });

    afterEach(() => {
        cleanupDOM();
    });

    describe('Module Structure', () => {
        test('should export calculator object with required properties', () => {
            expect(freeWaterDeficit).toBeDefined();
            expect(freeWaterDeficit.id).toBe('free-water-deficit');
            expect(freeWaterDeficit.title).toBeDefined();
            expect(typeof freeWaterDeficit.generateHTML).toBe('function');
            expect(typeof freeWaterDeficit.initialize).toBe('function');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = freeWaterDeficit.generateHTML();
            expect(html).toBeDefined();
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include required input fields', () => {
            const html = freeWaterDeficit.generateHTML();
            container.innerHTML = html;

            const weightInput = container.querySelector('#fwd-weight');
            const sodiumInput = container.querySelector('#fwd-sodium');
            const genderRadios = container.querySelectorAll('input[name="fwd-gender"]');
            
            expect(weightInput).toBeTruthy();
            expect(sodiumInput).toBeTruthy();
            expect(genderRadios.length).toBeGreaterThan(1);
        });
    });

    describe('Calculation Logic', () => {
        beforeEach(() => {
            const html = freeWaterDeficit.generateHTML();
            container.innerHTML = html;
            freeWaterDeficit.initialize(mockClient, mockPatient, container);
        });

        test('should calculate deficit correctly for Adult Male', () => {
            // Weight 70kg, Na 160
            // TBW = 70 * 0.6 = 42 L
            // Deficit = 42 * ((160/140) - 1) = 42 * (1.1428 - 1) = 42 * 0.1428 = 6.0 L
            
            const weightInput = container.querySelector('#fwd-weight');
            const sodiumInput = container.querySelector('#fwd-sodium');
            const maleRadio = container.querySelector('input[name="fwd-gender"][value="male"]');
            
            weightInput.value = '70';
            sodiumInput.value = '160';
            if (maleRadio) {
                maleRadio.checked = true;
                maleRadio.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            weightInput.dispatchEvent(new Event('input', { bubbles: true }));

            const scoreEl = container.querySelector('.ui-result-value');
            expect(scoreEl).toBeTruthy();
            const result = parseFloat(scoreEl.textContent);
            expect(result).toBeCloseTo(6.0, 1);
        });

        test('should calculate deficit correctly for Adult Female', () => {
            // Weight 70kg, Na 160, Female (Factor 0.5)
            // TBW = 70 * 0.5 = 35 L
            // Deficit = 35 * ((160/140) - 1) = 35 * 0.1428 = 5.0 L
            
            const weightInput = container.querySelector('#fwd-weight');
            const sodiumInput = container.querySelector('#fwd-sodium');
            const femaleRadio = container.querySelector('input[name="fwd-gender"][value="female"]');
            
            weightInput.value = '70';
            sodiumInput.value = '160';
            if (femaleRadio) {
                femaleRadio.checked = true;
                femaleRadio.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            weightInput.dispatchEvent(new Event('input', { bubbles: true }));

            const scoreEl = container.querySelector('.ui-result-value');
            expect(scoreEl).toBeTruthy();
            const result = parseFloat(scoreEl.textContent);
            expect(result).toBeCloseTo(5.0, 1);
        });
    });

    describe('Initialization', () => {
        test('should work without FHIR client', () => {
            const html = freeWaterDeficit.generateHTML();
            container.innerHTML = html;
            
            freeWaterDeficit.initialize(null, null, container);
            
            const resultContainer = container.querySelector('#fwd-result');
            expect(resultContainer).toBeTruthy();
        });
    });
});
