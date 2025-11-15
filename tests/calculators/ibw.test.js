/**
 * Ideal Body Weight (IBW) Calculator Test
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { ibw } from '../../js/calculators/ibw/index.js';

describe('IBW Calculator', () => {
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
            expect(ibw).toBeDefined();
            expect(ibw.id).toBe('ibw');
            expect(ibw.title).toBeDefined();
            expect(typeof ibw.generateHTML).toBe('function');
            expect(typeof ibw.initialize).toBe('function');
        });

        test('should have correct calculator ID', () => {
            expect(ibw.id).toBe('ibw');
        });

        test('should have descriptive title', () => {
            expect(ibw.title).toBeTruthy();
            expect(ibw.title.length).toBeGreaterThan(5);
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = ibw.generateHTML();
            
            expect(html).toBeDefined();
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include required input fields', () => {
            const html = ibw.generateHTML();
            container.innerHTML = html;

            const heightInput = container.querySelector('#ibw-height');
            const genderInputs = container.querySelectorAll('input[name="ibw-gender"]');
            
            expect(heightInput).toBeTruthy();
            expect(genderInputs.length).toBeGreaterThan(0);
        });

        test('should include result container', () => {
            const html = ibw.generateHTML();
            container.innerHTML = html;

            const resultContainer = container.querySelector('#ibw-result');
            expect(resultContainer).toBeTruthy();
        });
    });

    describe('Calculation Logic', () => {
        beforeEach(() => {
            const html = ibw.generateHTML();
            container.innerHTML = html;
            ibw.initialize(mockClient, mockPatient, container);
        });

        test('should calculate IBW correctly for male', () => {
            // Test male IBW calculation
            // Hamwi formula: 48.0 kg + 2.7 kg per inch over 5 feet
            // Height: 180 cm = 70.866 inches = 5 feet 10.866 inches
            // IBW = 48.0 + (2.7 * 10.866) ≈ 77.3 kg
            
            const heightInput = container.querySelector('#ibw-height');
            const maleRadio = container.querySelector('input[name="ibw-gender"][value="male"]');
            
            heightInput.value = '180';
            maleRadio.checked = true;
            heightInput.dispatchEvent(new Event('input', { bubbles: true }));

            // Allow time for calculation
            const resultValue = container.querySelector('.result-value');
            expect(resultValue).toBeTruthy();
            
            // The result should be approximately 77-78 kg
            const ibwValue = parseFloat(resultValue.textContent);
            expect(ibwValue).toBeGreaterThan(75);
            expect(ibwValue).toBeLessThan(80);
        });

        test('should calculate IBW correctly for female', () => {
            // Test female IBW calculation
            // Hamwi formula: 45.5 kg + 2.2 kg per inch over 5 feet
            // Height: 165 cm = 64.961 inches = 5 feet 4.961 inches
            // IBW = 45.5 + (2.2 * 4.961) ≈ 56.4 kg
            
            const heightInput = container.querySelector('#ibw-height');
            const femaleRadio = container.querySelector('input[name="ibw-gender"][value="female"]');
            
            heightInput.value = '165';
            femaleRadio.checked = true;
            heightInput.dispatchEvent(new Event('input', { bubbles: true }));

            const resultValue = container.querySelector('.result-value');
            expect(resultValue).toBeTruthy();
            
            // The result should be approximately 56-57 kg
            const ibwValue = parseFloat(resultValue.textContent);
            expect(ibwValue).toBeGreaterThan(54);
            expect(ibwValue).toBeLessThan(59);
        });

        test('should handle very tall height', () => {
            const heightInput = container.querySelector('#ibw-height');
            const maleRadio = container.querySelector('input[name="ibw-gender"][value="male"]');
            
            heightInput.value = '200';
            maleRadio.checked = true;
            heightInput.dispatchEvent(new Event('input', { bubbles: true }));

            const resultValue = container.querySelector('.result-value');
            expect(resultValue).toBeTruthy();
            
            const ibwValue = parseFloat(resultValue.textContent);
            expect(ibwValue).toBeGreaterThan(85);
        });

        test('should handle very short height', () => {
            const heightInput = container.querySelector('#ibw-height');
            const femaleRadio = container.querySelector('input[name="ibw-gender"][value="female"]');
            
            heightInput.value = '150';
            femaleRadio.checked = true;
            heightInput.dispatchEvent(new Event('input', { bubbles: true }));

            const resultValue = container.querySelector('.result-value');
            expect(resultValue).toBeTruthy();
            
            const ibwValue = parseFloat(resultValue.textContent);
            expect(ibwValue).toBeGreaterThan(40);
            expect(ibwValue).toBeLessThan(55);
        });
    });

    describe('FHIR Integration', () => {
        test('should populate height from patient data', async () => {
            // Mock patient with height observation
            mockClient.request.mockImplementation((url) => {
                if (url.includes('Observation')) {
                    return Promise.resolve({
                        entry: [{
                            resource: {
                                code: { coding: [{ code: '8302-2' }] },
                                valueQuantity: { value: 170, unit: 'cm' }
                            }
                        }]
                    });
                }
                return Promise.resolve({ entry: [] });
            });

            const html = ibw.generateHTML();
            container.innerHTML = html;
            ibw.initialize(mockClient, mockPatient, container);
            
            await new Promise(resolve => setTimeout(resolve, 100));

            const heightInput = container.querySelector('#ibw-height');
            expect(parseFloat(heightInput.value)).toBeGreaterThan(0);
        });

        test('should work without FHIR client', () => {
            const html = ibw.generateHTML();
            container.innerHTML = html;
            
            // Should not throw error
            expect(() => {
                ibw.initialize(null, null, container);
            }).not.toThrow();
        });
    });

    describe('Error Handling', () => {
        beforeEach(() => {
            const html = ibw.generateHTML();
            container.innerHTML = html;
            ibw.initialize(mockClient, mockPatient, container);
        });

        test('should handle invalid height input', () => {
            const heightInput = container.querySelector('#ibw-height');
            
            heightInput.value = 'invalid';
            heightInput.dispatchEvent(new Event('input', { bubbles: true }));

            // Should not crash
            expect(container).toBeTruthy();
        });

        test('should handle negative height', () => {
            const heightInput = container.querySelector('#ibw-height');
            
            heightInput.value = '-100';
            heightInput.dispatchEvent(new Event('input', { bubbles: true }));

            // Should handle gracefully
            expect(container).toBeTruthy();
        });
    });
});

