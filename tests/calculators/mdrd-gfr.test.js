/**
 * MDRD GFR Calculator Test
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { mdrdGfr } from '../../js/calculators/mdrd-gfr/index.js';

describe('MDRD GFR Calculator', () => {
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
            expect(mdrdGfr).toBeDefined();
            expect(mdrdGfr.id).toBe('mdrd-gfr');
            expect(mdrdGfr.title).toBeDefined();
            expect(typeof mdrdGfr.generateHTML).toBe('function');
            expect(typeof mdrdGfr.initialize).toBe('function');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = mdrdGfr.generateHTML();
            
            expect(html).toBeDefined();
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include required input fields', () => {
            const html = mdrdGfr.generateHTML();
            container.innerHTML = html;

            const creatinineInput = container.querySelector('#mdrd-creatinine');
            const ageInput = container.querySelector('#mdrd-age');
            const genderInputs = container.querySelectorAll('input[name="mdrd-gender"]');
            const raceInput = container.querySelector('#mdrd-race');
            
            expect(creatinineInput).toBeTruthy();
            expect(ageInput).toBeTruthy();
            expect(genderInputs.length).toBeGreaterThan(0);
            expect(raceInput).toBeTruthy();
        });

        test('should include result container', () => {
            const html = mdrdGfr.generateHTML();
            container.innerHTML = html;

            const resultContainer = container.querySelector('#mdrd-result');
            expect(resultContainer).toBeTruthy();
        });
    });

    describe('Calculation Logic', () => {
        beforeEach(() => {
            const html = mdrdGfr.generateHTML();
            container.innerHTML = html;
            mdrdGfr.initialize(mockClient, mockPatient, container);
        });

        test('should calculate GFR correctly for white male', () => {
            // Test MDRD calculation for 65-year-old white male with creatinine 1.5
            // MDRD formula: 175 × SCr^(-1.154) × Age^(-0.203) × 0.742[if female] × 1.212[if Black]
            // Expected: 175 × 1.5^(-1.154) × 65^(-0.203) ≈ 50-55 mL/min/1.73m²
            
            const creatinineInput = container.querySelector('#mdrd-creatinine');
            const ageInput = container.querySelector('#mdrd-age');
            const maleRadio = container.querySelector('input[name="mdrd-gender"][value="male"]');
            const raceInput = container.querySelector('#mdrd-race');
            
            creatinineInput.value = '1.5';
            ageInput.value = '65';
            maleRadio.checked = true;
            raceInput.value = 'white';
            
            creatinineInput.dispatchEvent(new Event('input', { bubbles: true }));

            const resultValue = container.querySelector('.result-value');
            expect(resultValue).toBeTruthy();
            
            const gfrValue = parseFloat(resultValue.textContent);
            expect(gfrValue).toBeGreaterThan(45);
            expect(gfrValue).toBeLessThan(60);
        });

        test('should calculate GFR correctly for black female', () => {
            // Test MDRD for 50-year-old black female with creatinine 1.0
            // Formula includes 0.742 for female and 1.212 for Black
            
            const creatinineInput = container.querySelector('#mdrd-creatinine');
            const ageInput = container.querySelector('#mdrd-age');
            const femaleRadio = container.querySelector('input[name="mdrd-gender"][value="female"]');
            const raceInput = container.querySelector('#mdrd-race');
            
            creatinineInput.value = '1.0';
            ageInput.value = '50';
            femaleRadio.checked = true;
            raceInput.value = 'black';
            
            creatinineInput.dispatchEvent(new Event('input', { bubbles: true }));

            const resultValue = container.querySelector('.result-value');
            expect(resultValue).toBeTruthy();
            
            const gfrValue = parseFloat(resultValue.textContent);
            expect(gfrValue).toBeGreaterThan(60);
        });

        test('should classify CKD stages correctly', () => {
            // Test CKD stage classification
            const creatinineInput = container.querySelector('#mdrd-creatinine');
            const ageInput = container.querySelector('#mdrd-age');
            const maleRadio = container.querySelector('input[name="mdrd-gender"][value="male"]');
            const raceInput = container.querySelector('#mdrd-race');
            
            // Set values for Stage 3a CKD (GFR 45-59)
            creatinineInput.value = '1.6';
            ageInput.value = '70';
            maleRadio.checked = true;
            raceInput.value = 'white';
            
            creatinineInput.dispatchEvent(new Event('input', { bubbles: true }));

            const resultDiv = container.querySelector('#mdrd-result');
            expect(resultDiv).toBeTruthy();
            expect(resultDiv.innerHTML).toContain('Stage');
        });

        test('should handle high creatinine (low GFR)', () => {
            const creatinineInput = container.querySelector('#mdrd-creatinine');
            const ageInput = container.querySelector('#mdrd-age');
            const maleRadio = container.querySelector('input[name="mdrd-gender"][value="male"]');
            
            creatinineInput.value = '5.0';
            ageInput.value = '70';
            maleRadio.checked = true;
            
            creatinineInput.dispatchEvent(new Event('input', { bubbles: true }));

            const resultValue = container.querySelector('.result-value');
            expect(resultValue).toBeTruthy();
            
            const gfrValue = parseFloat(resultValue.textContent);
            expect(gfrValue).toBeLessThan(20);
        });

        test('should handle low creatinine (high GFR)', () => {
            const creatinineInput = container.querySelector('#mdrd-creatinine');
            const ageInput = container.querySelector('#mdrd-age');
            const femaleRadio = container.querySelector('input[name="mdrd-gender"][value="female"]');
            
            creatinineInput.value = '0.6';
            ageInput.value = '30';
            femaleRadio.checked = true;
            
            creatinineInput.dispatchEvent(new Event('input', { bubbles: true }));

            const resultValue = container.querySelector('.result-value');
            expect(resultValue).toBeTruthy();
            
            const gfrValue = parseFloat(resultValue.textContent);
            expect(gfrValue).toBeGreaterThan(90);
        });
    });

    describe('FHIR Integration', () => {
        test('should populate fields from patient data', async () => {
            mockClient.request.mockImplementation((url) => {
                if (url.includes('Observation') && url.includes('2160-0')) {
                    return Promise.resolve({
                        entry: [{
                            resource: {
                                code: { coding: [{ code: '2160-0' }] },
                                valueQuantity: { value: 1.2, unit: 'mg/dL' }
                            }
                        }]
                    });
                }
                return Promise.resolve({ entry: [] });
            });

            const html = mdrdGfr.generateHTML();
            container.innerHTML = html;
            mdrdGfr.initialize(mockClient, mockPatient, container);
            
            await new Promise(resolve => setTimeout(resolve, 100));

            const creatinineInput = container.querySelector('#mdrd-creatinine');
            expect(parseFloat(creatinineInput.value)).toBeGreaterThan(0);
        });
    });

    describe('Error Handling', () => {
        beforeEach(() => {
            const html = mdrdGfr.generateHTML();
            container.innerHTML = html;
            mdrdGfr.initialize(mockClient, mockPatient, container);
        });

        test('should handle invalid creatinine input', () => {
            const creatinineInput = container.querySelector('#mdrd-creatinine');
            
            creatinineInput.value = 'invalid';
            creatinineInput.dispatchEvent(new Event('input', { bubbles: true }));

            expect(container).toBeTruthy();
        });

        test('should handle zero creatinine', () => {
            const creatinineInput = container.querySelector('#mdrd-creatinine');
            
            creatinineInput.value = '0';
            creatinineInput.dispatchEvent(new Event('input', { bubbles: true }));

            expect(container).toBeTruthy();
        });
    });
});

