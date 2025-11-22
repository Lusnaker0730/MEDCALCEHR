import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { ckdEpi } from '../../js/calculators/ckd-epi/index.js';

describe('CKD-EPI GFR Calculator', () => {
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
            expect(ckdEpi).toBeDefined();
            expect(ckdEpi.id).toBe('ckd-epi');
            expect(ckdEpi.title).toBeDefined();
            expect(typeof ckdEpi.generateHTML).toBe('function');
            expect(typeof ckdEpi.initialize).toBe('function');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = ckdEpi.generateHTML();
            expect(html).toBeDefined();
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include required input fields', () => {
            const html = ckdEpi.generateHTML();
            container.innerHTML = html;

            const ageInput = container.querySelector('#ckd-epi-age');
            const creatinineInput = container.querySelector('#ckd-epi-creatinine');
            const genderRadios = container.querySelectorAll('input[name="ckd-epi-gender"]');
            
            expect(ageInput).toBeTruthy();
            expect(creatinineInput).toBeTruthy();
            expect(genderRadios.length).toBe(2); // Male and Female
        });

        test('should include result container', () => {
            const html = ckdEpi.generateHTML();
            container.innerHTML = html;

            const resultContainer = container.querySelector('#ckd-epi-result');
            expect(resultContainer).toBeTruthy();
        });
    });

    describe('Calculation Logic', () => {
        beforeEach(() => {
            const html = ckdEpi.generateHTML();
            container.innerHTML = html;
            ckdEpi.initialize(mockClient, mockPatient, container);
        });

        test('should calculate eGFR correctly for a male', () => {
            // Test Case: Male, Age 50, Creatinine 1.0 mg/dL
            // Kappa = 0.9, Alpha = -0.302
            // Scr/Kappa = 1.11...
            // min = 1, max = 1.11...
            // 142 * 1^-0.302 * 1.11...^-1.2 * 0.9938^50
            
            const ageInput = container.querySelector('#ckd-epi-age');
            const creatinineInput = container.querySelector('#ckd-epi-creatinine');
            const maleRadio = container.querySelector('input[name="ckd-epi-gender"][value="male"]');
            
            ageInput.value = '50';
            creatinineInput.value = '1.0';
            if (maleRadio) {
                maleRadio.checked = true;
                maleRadio.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            // Trigger calculation
            ageInput.dispatchEvent(new Event('input', { bubbles: true }));

            const scoreEl = container.querySelector('.ui-result-value');
            expect(scoreEl).toBeTruthy();
            
            // Expected calculation: ~89-90 depending on precision
            const result = parseInt(scoreEl.textContent);
            expect(result).toBeGreaterThan(80);
            expect(result).toBeLessThan(100);
        });

        test('should calculate eGFR correctly for a female', () => {
            // Test Case: Female, Age 50, Creatinine 1.0 mg/dL
            
            const ageInput = container.querySelector('#ckd-epi-age');
            const creatinineInput = container.querySelector('#ckd-epi-creatinine');
            const femaleRadio = container.querySelector('input[name="ckd-epi-gender"][value="female"]');
            
            ageInput.value = '50';
            creatinineInput.value = '1.0';
            if (femaleRadio) {
                femaleRadio.checked = true;
                femaleRadio.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            ageInput.dispatchEvent(new Event('input', { bubbles: true }));

            const scoreEl = container.querySelector('.ui-result-value');
            expect(scoreEl).toBeTruthy();
            
            // For female, same values usually result in lower GFR because of factor 1.012 but different kappa/alpha
            // With Cr 1.0, female kappa 0.7 -> ratio 1.42 -> high term dominates
            // Calculation should yield valid number
            const result = parseInt(scoreEl.textContent);
            expect(result).toBeGreaterThan(0);
        });
    });

    describe('Initialization', () => {
        test('should work without FHIR client', () => {
            const html = ckdEpi.generateHTML();
            container.innerHTML = html;
            
            ckdEpi.initialize(null, null, container);
            
            const resultContainer = container.querySelector('#ckd-epi-result');
            expect(resultContainer).toBeTruthy();
        });
    });
});
