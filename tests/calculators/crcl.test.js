import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { crcl } from '../../js/calculators/crcl/index.js';

describe('Creatinine Clearance (Cockcroft-Gault) Calculator', () => {
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
            expect(crcl).toBeDefined();
            expect(crcl.id).toBe('crcl');
            expect(crcl.title).toBeDefined();
            expect(typeof crcl.generateHTML).toBe('function');
            expect(typeof crcl.initialize).toBe('function');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = crcl.generateHTML();
            expect(html).toBeDefined();
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include required input fields', () => {
            const html = crcl.generateHTML();
            container.innerHTML = html;

            const ageInput = container.querySelector('#crcl-age');
            const weightInput = container.querySelector('#crcl-weight');
            const scrInput = container.querySelector('#crcl-scr');
            const genderRadios = container.querySelectorAll('input[name="crcl-gender"]');
            
            expect(ageInput).toBeTruthy();
            expect(weightInput).toBeTruthy();
            expect(scrInput).toBeTruthy();
            expect(genderRadios.length).toBe(2);
        });
    });

    describe('Calculation Logic', () => {
        beforeEach(() => {
            const html = crcl.generateHTML();
            container.innerHTML = html;
            crcl.initialize(mockClient, mockPatient, container);
        });

        test('should calculate CrCl correctly for a male', () => {
            // Test Case: Male, Age 60, Weight 70kg, Scr 1.0 mg/dL
            // CrCl = ((140 - 60) * 70) / (72 * 1.0) = 80 * 70 / 72 = 5600 / 72 = 77.77 mL/min
            
            const ageInput = container.querySelector('#crcl-age');
            const weightInput = container.querySelector('#crcl-weight');
            const scrInput = container.querySelector('#crcl-scr');
            const maleRadio = container.querySelector('input[name="crcl-gender"][value="male"]');
            
            ageInput.value = '60';
            weightInput.value = '70';
            scrInput.value = '1.0';
            if (maleRadio) {
                maleRadio.checked = true;
                maleRadio.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            // Trigger calculation
            ageInput.dispatchEvent(new Event('input', { bubbles: true }));

            const scoreEl = container.querySelector('.ui-result-value');
            expect(scoreEl).toBeTruthy();
            const result = parseFloat(scoreEl.textContent);
            expect(result).toBeCloseTo(77.8, 1);
        });

        test('should calculate CrCl correctly for a female', () => {
            // Test Case: Female, Age 60, Weight 70kg, Scr 1.0 mg/dL
            // CrCl = 77.77 * 0.85 = 66.1 mL/min
            
            const ageInput = container.querySelector('#crcl-age');
            const weightInput = container.querySelector('#crcl-weight');
            const scrInput = container.querySelector('#crcl-scr');
            const femaleRadio = container.querySelector('input[name="crcl-gender"][value="female"]');
            
            ageInput.value = '60';
            weightInput.value = '70';
            scrInput.value = '1.0';
            if (femaleRadio) {
                femaleRadio.checked = true;
                femaleRadio.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            // Trigger calculation
            ageInput.dispatchEvent(new Event('input', { bubbles: true }));

            const scoreEl = container.querySelector('.ui-result-value');
            expect(scoreEl).toBeTruthy();
            const result = parseFloat(scoreEl.textContent);
            expect(result).toBeCloseTo(66.1, 1);
        });
    });

    describe('Initialization', () => {
        test('should work without FHIR client', () => {
            const html = crcl.generateHTML();
            container.innerHTML = html;
            
            crcl.initialize(null, null, container);
            
            const resultContainer = container.querySelector('#crcl-result');
            expect(resultContainer).toBeTruthy();
        });
    });
});

