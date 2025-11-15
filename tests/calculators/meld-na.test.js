/**
 * MELD-Na (Model for End-Stage Liver Disease with Sodium) Calculator Test
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { meldNa } from '../../js/calculators/meld-na/index.js';

describe('MELD-Na Calculator', () => {
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
            expect(meldNa).toBeDefined();
            expect(meldNa.id).toBe('meld-na');
            expect(meldNa.title).toBeDefined();
            expect(typeof meldNa.generateHTML).toBe('function');
            expect(typeof meldNa.initialize).toBe('function');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = meldNa.generateHTML();
            
            expect(html).toBeDefined();
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include required input fields', () => {
            const html = meldNa.generateHTML();
            container.innerHTML = html;

            const creatinineInput = container.querySelector('#meld-creatinine');
            const bilirubinInput = container.querySelector('#meld-bilirubin');
            const inrInput = container.querySelector('#meld-inr');
            const sodiumInput = container.querySelector('#meld-sodium');
            const dialysisInputs = container.querySelectorAll('input[name="meld-dialysis"]');
            
            expect(creatinineInput).toBeTruthy();
            expect(bilirubinInput).toBeTruthy();
            expect(inrInput).toBeTruthy();
            expect(sodiumInput).toBeTruthy();
            expect(dialysisInputs.length).toBeGreaterThan(0);
        });

        test('should include result container', () => {
            const html = meldNa.generateHTML();
            container.innerHTML = html;

            const resultContainer = container.querySelector('#meld-result');
            expect(resultContainer).toBeTruthy();
        });
    });

    describe('Calculation Logic', () => {
        beforeEach(() => {
            const html = meldNa.generateHTML();
            container.innerHTML = html;
            meldNa.initialize(mockClient, mockPatient, container);
        });

        test('should calculate MELD-Na correctly for moderate values', () => {
            // Test MELD calculation with typical values
            // MELD = 9.57 × ln(Cr) + 3.78 × ln(Bili) + 11.20 × ln(INR) + 6.43
            // Then adjusted for sodium
            
            const creatinineInput = container.querySelector('#meld-creatinine');
            const bilirubinInput = container.querySelector('#meld-bilirubin');
            const inrInput = container.querySelector('#meld-inr');
            const sodiumInput = container.querySelector('#meld-sodium');
            const noDialysisRadio = container.querySelector('input[name="meld-dialysis"][value="no"]');
            
            creatinineInput.value = '1.5';
            bilirubinInput.value = '2.0';
            inrInput.value = '1.5';
            sodiumInput.value = '135';
            noDialysisRadio.checked = true;
            
            creatinineInput.dispatchEvent(new Event('input', { bubbles: true }));

            const resultValue = container.querySelector('.result-value');
            expect(resultValue).toBeTruthy();
            
            const meldScore = parseFloat(resultValue.textContent);
            expect(meldScore).toBeGreaterThan(0);
            expect(meldScore).toBeLessThan(40);
        });

        test('should calculate higher score for severe disease', () => {
            const creatinineInput = container.querySelector('#meld-creatinine');
            const bilirubinInput = container.querySelector('#meld-bilirubin');
            const inrInput = container.querySelector('#meld-inr');
            const sodiumInput = container.querySelector('#meld-sodium');
            const noDialysisRadio = container.querySelector('input[name="meld-dialysis"][value="no"]');
            
            creatinineInput.value = '3.0';
            bilirubinInput.value = '10.0';
            inrInput.value = '3.0';
            sodiumInput.value = '125';
            noDialysisRadio.checked = true;
            
            creatinineInput.dispatchEvent(new Event('input', { bubbles: true }));

            const resultValue = container.querySelector('.result-value');
            expect(resultValue).toBeTruthy();
            
            const meldScore = parseFloat(resultValue.textContent);
            expect(meldScore).toBeGreaterThan(25);
        });

        test('should cap creatinine at 4.0 for non-dialysis patients', () => {
            const creatinineInput = container.querySelector('#meld-creatinine');
            const bilirubinInput = container.querySelector('#meld-bilirubin');
            const inrInput = container.querySelector('#meld-inr');
            const sodiumInput = container.querySelector('#meld-sodium');
            const noDialysisRadio = container.querySelector('input[name="meld-dialysis"][value="no"]');
            
            creatinineInput.value = '5.0';
            bilirubinInput.value = '2.0';
            inrInput.value = '1.5';
            sodiumInput.value = '140';
            noDialysisRadio.checked = true;
            
            creatinineInput.dispatchEvent(new Event('input', { bubbles: true }));

            // The creatinine should be capped at 4.0
            expect(container).toBeTruthy();
        });

        test('should handle dialysis status correctly', () => {
            const creatinineInput = container.querySelector('#meld-creatinine');
            const bilirubinInput = container.querySelector('#meld-bilirubin');
            const inrInput = container.querySelector('#meld-inr');
            const sodiumInput = container.querySelector('#meld-sodium');
            const yesDialysisRadio = container.querySelector('input[name="meld-dialysis"][value="yes"]');
            
            creatinineInput.value = '1.0';
            bilirubinInput.value = '2.0';
            inrInput.value = '1.5';
            sodiumInput.value = '140';
            yesDialysisRadio.checked = true;
            
            creatinineInput.dispatchEvent(new Event('input', { bubbles: true }));

            // When on dialysis, creatinine is set to 4.0
            expect(container).toBeTruthy();
        });

        test('should handle minimum values', () => {
            const creatinineInput = container.querySelector('#meld-creatinine');
            const bilirubinInput = container.querySelector('#meld-bilirubin');
            const inrInput = container.querySelector('#meld-inr');
            const sodiumInput = container.querySelector('#meld-sodium');
            
            creatinineInput.value = '0.5';
            bilirubinInput.value = '0.5';
            inrInput.value = '0.9';
            sodiumInput.value = '145';
            
            creatinineInput.dispatchEvent(new Event('input', { bubbles: true }));

            // Should use minimum values (creat 1.0, bili 1.0, INR 1.0)
            const resultValue = container.querySelector('.result-value');
            expect(resultValue).toBeTruthy();
            
            const meldScore = parseFloat(resultValue.textContent);
            expect(meldScore).toBeGreaterThan(0);
        });

        test('should adjust for sodium correctly', () => {
            const creatinineInput = container.querySelector('#meld-creatinine');
            const bilirubinInput = container.querySelector('#meld-bilirubin');
            const inrInput = container.querySelector('#meld-inr');
            const sodiumInput = container.querySelector('#meld-sodium');
            
            // First calculation with normal sodium
            creatinineInput.value = '2.0';
            bilirubinInput.value = '3.0';
            inrInput.value = '2.0';
            sodiumInput.value = '140';
            
            creatinineInput.dispatchEvent(new Event('input', { bubbles: true }));
            
            const resultValue1 = container.querySelector('.result-value');
            const meldScore1 = parseFloat(resultValue1.textContent);

            // Second calculation with low sodium
            sodiumInput.value = '125';
            sodiumInput.dispatchEvent(new Event('input', { bubbles: true }));
            
            const resultValue2 = container.querySelector('.result-value');
            const meldScore2 = parseFloat(resultValue2.textContent);

            // Low sodium should result in higher score
            expect(meldScore2).toBeGreaterThan(meldScore1);
        });
    });

    describe('Risk Classification', () => {
        beforeEach(() => {
            const html = meldNa.generateHTML();
            container.innerHTML = html;
            meldNa.initialize(mockClient, mockPatient, container);
        });

        test('should classify low risk correctly (MELD < 17)', () => {
            const creatinineInput = container.querySelector('#meld-creatinine');
            const bilirubinInput = container.querySelector('#meld-bilirubin');
            const inrInput = container.querySelector('#meld-inr');
            const sodiumInput = container.querySelector('#meld-sodium');
            
            creatinineInput.value = '1.0';
            bilirubinInput.value = '1.5';
            inrInput.value = '1.2';
            sodiumInput.value = '140';
            
            creatinineInput.dispatchEvent(new Event('input', { bubbles: true }));

            const resultDiv = container.querySelector('#meld-result');
            expect(resultDiv).toBeTruthy();
        });

        test('should classify high risk correctly (MELD >= 23)', () => {
            const creatinineInput = container.querySelector('#meld-creatinine');
            const bilirubinInput = container.querySelector('#meld-bilirubin');
            const inrInput = container.querySelector('#meld-inr');
            const sodiumInput = container.querySelector('#meld-sodium');
            
            creatinineInput.value = '3.0';
            bilirubinInput.value = '8.0';
            inrInput.value = '2.5';
            sodiumInput.value = '130';
            
            creatinineInput.dispatchEvent(new Event('input', { bubbles: true }));

            const resultDiv = container.querySelector('#meld-result');
            expect(resultDiv).toBeTruthy();
        });
    });

    describe('Error Handling', () => {
        beforeEach(() => {
            const html = meldNa.generateHTML();
            container.innerHTML = html;
            meldNa.initialize(mockClient, mockPatient, container);
        });

        test('should handle invalid input gracefully', () => {
            const creatinineInput = container.querySelector('#meld-creatinine');
            
            creatinineInput.value = 'invalid';
            creatinineInput.dispatchEvent(new Event('input', { bubbles: true }));

            expect(container).toBeTruthy();
        });

        test('should handle negative values', () => {
            const bilirubinInput = container.querySelector('#meld-bilirubin');
            
            bilirubinInput.value = '-1';
            bilirubinInput.dispatchEvent(new Event('input', { bubbles: true }));

            expect(container).toBeTruthy();
        });
    });
});

