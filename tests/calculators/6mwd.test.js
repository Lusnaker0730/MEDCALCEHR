import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { sixMwd } from '../../js/calculators/6mwd/index.js';

describe('6 Minute Walk Distance Calculator', () => {
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
            expect(sixMwd).toBeDefined();
            expect(sixMwd.id).toBe('6mwd');
            expect(sixMwd.title).toBeDefined();
            expect(typeof sixMwd.generateHTML).toBe('function');
            expect(typeof sixMwd.initialize).toBe('function');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = sixMwd.generateHTML();
            expect(html).toBeDefined();
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include required input fields', () => {
            const html = sixMwd.generateHTML();
            container.innerHTML = html;

            const ageInput = container.querySelector('#mwd6-age');
            const heightInput = container.querySelector('#mwd6-height');
            const weightInput = container.querySelector('#mwd6-weight');
            const genderRadios = container.querySelectorAll('input[name="mwd6-gender"]');
            
            expect(ageInput).toBeTruthy();
            expect(heightInput).toBeTruthy();
            expect(weightInput).toBeTruthy();
            expect(genderRadios.length).toBe(2);
        });
    });

    describe('Calculation Logic', () => {
        beforeEach(() => {
            const html = sixMwd.generateHTML();
            container.innerHTML = html;
            sixMwd.initialize(mockClient, mockPatient, container);
        });

        test('should calculate expected distance for Male', () => {
            // Male: 7.57 * Ht - 5.02 * Age - 1.76 * Wt - 309
            // Ht 175, Age 60, Wt 80
            // 7.57*175 - 5.02*60 - 1.76*80 - 309
            // 1324.75 - 301.2 - 140.8 - 309 = 573.75
            
            const ageInput = container.querySelector('#mwd6-age');
            const heightInput = container.querySelector('#mwd6-height');
            const weightInput = container.querySelector('#mwd6-weight');
            const maleRadio = container.querySelector('input[name="mwd6-gender"][value="male"]');
            
            ageInput.value = '60';
            heightInput.value = '175';
            weightInput.value = '80';
            if (maleRadio) {
                maleRadio.checked = true;
                maleRadio.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            ageInput.dispatchEvent(new Event('input', { bubbles: true }));

            const scoreEl = container.querySelector('.ui-result-value');
            expect(scoreEl).toBeTruthy();
            const result = parseFloat(scoreEl.textContent);
            expect(result).toBeCloseTo(574, 0);
        });

        test('should calculate expected distance for Female', () => {
            // Female: 2.11 * Ht - 2.29 * Wt - 5.78 * Age + 667
            // Ht 160, Age 60, Wt 70
            // 2.11*160 - 2.29*70 - 5.78*60 + 667
            // 337.6 - 160.3 - 346.8 + 667 = 497.5
            
            const ageInput = container.querySelector('#mwd6-age');
            const heightInput = container.querySelector('#mwd6-height');
            const weightInput = container.querySelector('#mwd6-weight');
            const femaleRadio = container.querySelector('input[name="mwd6-gender"][value="female"]');
            
            ageInput.value = '60';
            heightInput.value = '160';
            weightInput.value = '70';
            if (femaleRadio) {
                femaleRadio.checked = true;
                femaleRadio.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            ageInput.dispatchEvent(new Event('input', { bubbles: true }));

            const scoreEl = container.querySelector('.ui-result-value');
            expect(scoreEl).toBeTruthy();
            const result = parseFloat(scoreEl.textContent);
            expect(result).toBeCloseTo(497, 0);
        });
    });

    describe('Initialization', () => {
        test('should work without FHIR client', () => {
            const html = sixMwd.generateHTML();
            container.innerHTML = html;
            
            sixMwd.initialize(null, null, container);
            
            const resultContainer = container.querySelector('#mwd6-result');
            expect(resultContainer).toBeTruthy();
        });
    });
});
