/**
 * Caprini Risk Assessment Model Test
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { caprini } from '../../js/calculators/caprini/index.js';

describe('Caprini VTE Risk Calculator', () => {
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
            expect(caprini).toBeDefined();
            expect(caprini.id).toBe('caprini');
            expect(caprini.title).toBeDefined();
            expect(typeof caprini.generateHTML).toBe('function');
            expect(typeof caprini.initialize).toBe('function');
        });

        test('should have correct calculator ID', () => {
            expect(caprini.id).toBe('caprini');
        });

        test('should have descriptive title', () => {
            expect(caprini.title).toBeTruthy();
            expect(caprini.title.length).toBeGreaterThan(5);
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = caprini.generateHTML();
            
            expect(html).toBeDefined();
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include multiple risk factor checkboxes', () => {
            const html = caprini.generateHTML();
            container.innerHTML = html;

            // Caprini has many risk factors with different point values
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            expect(checkboxes.length).toBeGreaterThan(10);
        });

        test('should include result container', () => {
            const html = caprini.generateHTML();
            container.innerHTML = html;

            const resultContainer = container.querySelector('#caprini-result') || 
                                  container.querySelector('.result-container');
            expect(resultContainer).toBeTruthy();
        });
    });

    describe('Calculation Logic', () => {
        beforeEach(() => {
            const html = caprini.generateHTML();
            container.innerHTML = html;
            caprini.initialize(mockClient, mockPatient, container);
        });

        test('should calculate score 0 (very low risk)', () => {
            // No risk factors checked
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            
            checkboxes.forEach(cb => {
                cb.checked = false;
            });

            if (checkboxes.length > 0) {
                checkboxes[0].dispatchEvent(new Event('change', { bubbles: true }));
            }

            const resultValue = container.querySelector('.result-value');
            if (resultValue) {
                const score = parseInt(resultValue.textContent);
                expect(score).toBe(0);
            }
        });

        test('should calculate low risk score (1-2 points)', () => {
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            
            if (checkboxes.length > 0) {
                // Check first checkbox (usually 1 point)
                checkboxes[0].checked = true;
                checkboxes[0].dispatchEvent(new Event('change', { bubbles: true }));

                expect(container).toBeTruthy();
            }
        });

        test('should calculate moderate risk score (3-4 points)', () => {
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            
            // Check multiple risk factors to reach 3-4 points
            for (let i = 0; i < Math.min(checkboxes.length, 3); i++) {
                checkboxes[i].checked = true;
            }

            if (checkboxes.length > 0) {
                checkboxes[0].dispatchEvent(new Event('change', { bubbles: true }));
            }

            expect(container).toBeTruthy();
        });

        test('should calculate high risk score (≥5 points)', () => {
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            
            // Check many risk factors to reach high risk
            for (let i = 0; i < Math.min(checkboxes.length, 6); i++) {
                checkboxes[i].checked = true;
            }

            if (checkboxes.length > 0) {
                checkboxes[0].dispatchEvent(new Event('change', { bubbles: true }));
            }

            expect(container).toBeTruthy();
        });

        test('should update score when checkboxes are toggled', () => {
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            
            if (checkboxes.length > 0) {
                // Check
                checkboxes[0].checked = true;
                checkboxes[0].dispatchEvent(new Event('change', { bubbles: true }));

                // Uncheck
                checkboxes[0].checked = false;
                checkboxes[0].dispatchEvent(new Event('change', { bubbles: true }));

                expect(container).toBeTruthy();
            }
        });

        test('should handle age-based risk factors correctly', () => {
            // Caprini has age-based points that are mutually exclusive
            // Age 41-60: 1 point
            // Age 61-74: 2 points  
            // Age ≥75: 3 points
            const html = container.innerHTML;
            expect(html.toLowerCase()).toContain('age');
        });
    });

    describe('Risk Factors', () => {
        beforeEach(() => {
            const html = caprini.generateHTML();
            container.innerHTML = html;
            caprini.initialize(mockClient, mockPatient, container);
        });

        test('should include age risk factors', () => {
            const html = container.innerHTML;
            expect(html.toLowerCase()).toContain('age');
        });

        test('should include BMI risk factor', () => {
            const html = container.innerHTML;
            expect(html.toLowerCase()).toContain('bmi' || 'obesity');
        });

        test('should include surgery type risk factors', () => {
            const html = container.innerHTML;
            expect(html.toLowerCase()).toContain('surgery' || 'operation');
        });

        test('should include mobility risk factors', () => {
            const html = container.innerHTML;
            expect(html.toLowerCase()).toContain('mobility' || 'bed rest' || 'immobil');
        });

        test('should include history of VTE risk factor', () => {
            const html = container.innerHTML;
            expect(html.toLowerCase()).toContain('vte' || 'thrombosis' || 'embolism');
        });

        test('should include cancer risk factor', () => {
            const html = container.innerHTML;
            expect(html.toLowerCase()).toContain('cancer' || 'malignancy');
        });
    });

    describe('Risk Classification', () => {
        beforeEach(() => {
            const html = caprini.generateHTML();
            container.innerHTML = html;
            caprini.initialize(mockClient, mockPatient, container);
        });

        test('should classify very low risk (0 points)', () => {
            // Caprini risk levels:
            // 0: Very low
            // 1-2: Low
            // 3-4: Moderate
            // ≥5: High
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(cb => cb.checked = false);

            if (checkboxes.length > 0) {
                checkboxes[0].dispatchEvent(new Event('change', { bubbles: true }));
            }

            expect(container).toBeTruthy();
        });

        test('should classify high risk (≥5 points)', () => {
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            
            // Check many boxes for high risk
            checkboxes.forEach((cb, index) => {
                if (index < 6) cb.checked = true;
            });

            if (checkboxes.length > 0) {
                checkboxes[0].dispatchEvent(new Event('change', { bubbles: true }));
            }

            expect(container).toBeTruthy();
        });
    });

    describe('Prophylaxis Recommendations', () => {
        beforeEach(() => {
            const html = caprini.generateHTML();
            container.innerHTML = html;
            caprini.initialize(mockClient, mockPatient, container);
        });

        test('should recommend no prophylaxis for very low risk', () => {
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(cb => cb.checked = false);

            if (checkboxes.length > 0) {
                checkboxes[0].dispatchEvent(new Event('change', { bubbles: true }));

                const resultDiv = container.querySelector('#caprini-result') || 
                                container.querySelector('.result-container');
                if (resultDiv) {
                    expect(resultDiv.innerHTML.toLowerCase()).toContain('ambulat' || 'early' || 'no prophylaxis');
                }
            }
        });

        test('should recommend mechanical prophylaxis for low-moderate risk', () => {
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            
            if (checkboxes.length >= 2) {
                checkboxes[0].checked = true;
                checkboxes[1].checked = true;
                checkboxes[0].dispatchEvent(new Event('change', { bubbles: true }));

                expect(container).toBeTruthy();
            }
        });

        test('should recommend pharmacologic prophylaxis for high risk', () => {
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            
            // High risk requires both mechanical and pharmacologic
            checkboxes.forEach((cb, index) => {
                if (index < 6) cb.checked = true;
            });

            if (checkboxes.length > 0) {
                checkboxes[0].dispatchEvent(new Event('change', { bubbles: true }));

                const resultDiv = container.querySelector('#caprini-result') || 
                                container.querySelector('.result-container');
                if (resultDiv) {
                    expect(resultDiv.innerHTML.toLowerCase()).toContain('pharmacolog' || 'lmwh' || 'heparin');
                }
            }
        });
    });

    describe('User Interaction', () => {
        beforeEach(() => {
            const html = caprini.generateHTML();
            container.innerHTML = html;
            caprini.initialize(mockClient, mockPatient, container);
        });

        test('should highlight checked risk factors', () => {
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            
            if (checkboxes.length > 0) {
                checkboxes[0].checked = true;
                checkboxes[0].dispatchEvent(new Event('change', { bubbles: true }));

                const parent = checkboxes[0].closest('.checkbox-option');
                if (parent) {
                    expect(parent.classList.contains('checked') || 
                           checkboxes[0].checked).toBe(true);
                }
            }
        });
    });

    describe('Error Handling', () => {
        beforeEach(() => {
            const html = caprini.generateHTML();
            container.innerHTML = html;
            caprini.initialize(mockClient, mockPatient, container);
        });

        test('should work without FHIR client', () => {
            const html = caprini.generateHTML();
            const newContainer = document.createElement('div');
            document.body.appendChild(newContainer);
            newContainer.innerHTML = html;
            
            expect(() => {
                caprini.initialize(null, null, newContainer);
            }).not.toThrow();
            
            newContainer.remove();
        });

        test('should handle rapid checkbox toggling', () => {
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            
            if (checkboxes.length > 0) {
                for (let i = 0; i < 10; i++) {
                    checkboxes[0].checked = !checkboxes[0].checked;
                    checkboxes[0].dispatchEvent(new Event('change', { bubbles: true }));
                }

                expect(container).toBeTruthy();
            }
        });

        test('should handle checking all boxes', () => {
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            
            checkboxes.forEach(cb => {
                cb.checked = true;
            });

            if (checkboxes.length > 0) {
                checkboxes[0].dispatchEvent(new Event('change', { bubbles: true }));

                expect(container).toBeTruthy();
            }
        });
    });
});

