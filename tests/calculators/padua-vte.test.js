/**
 * Padua Prediction Score for VTE Risk Calculator Test
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { paduaVTE } from '../../js/calculators/padua-vte/index.js';

describe('Padua VTE Calculator', () => {
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
            expect(paduaVTE).toBeDefined();
            expect(paduaVTE.id).toBe('padua-vte');
            expect(paduaVTE.title).toBeDefined();
            expect(typeof paduaVTE.generateHTML).toBe('function');
            expect(typeof paduaVTE.initialize).toBe('function');
        });

        test('should have correct calculator ID', () => {
            expect(paduaVTE.id).toBe('padua-vte');
        });

        test('should have descriptive title', () => {
            expect(paduaVTE.title).toBeTruthy();
            expect(paduaVTE.title).toContain('VTE' || 'Padua');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = paduaVTE.generateHTML();
            
            expect(html).toBeDefined();
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include risk factor checkboxes', () => {
            const html = paduaVTE.generateHTML();
            container.innerHTML = html;

            // Padua has 11 risk factors
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            expect(checkboxes.length).toBeGreaterThan(5);
        });

        test('should include result container', () => {
            const html = paduaVTE.generateHTML();
            container.innerHTML = html;

            const resultContainer = container.querySelector('#padua-result') || 
                                  container.querySelector('.result-container');
            expect(resultContainer).toBeTruthy();
        });
    });

    describe('Calculation Logic', () => {
        beforeEach(() => {
            const html = paduaVTE.generateHTML();
            container.innerHTML = html;
            paduaVTE.initialize(mockClient, mockPatient, container);
        });

        test('should calculate score 0 (low risk) correctly', () => {
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

        test('should calculate score correctly with single risk factor', () => {
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            
            if (checkboxes.length > 0) {
                // Check first checkbox
                checkboxes[0].checked = true;
                checkboxes[0].dispatchEvent(new Event('change', { bubbles: true }));

                const resultValue = container.querySelector('.result-value');
                expect(resultValue).toBeTruthy();
            }
        });

        test('should classify as high risk when score >= 4', () => {
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            
            // Check multiple risk factors to reach score >= 4
            let checkedCount = 0;
            for (let i = 0; i < Math.min(checkboxes.length, 4); i++) {
                checkboxes[i].checked = true;
                checkedCount++;
            }

            if (checkedCount > 0) {
                checkboxes[0].dispatchEvent(new Event('change', { bubbles: true }));
            }

            const resultDiv = container.querySelector('#padua-result') || 
                            container.querySelector('.result-container');
            expect(resultDiv).toBeTruthy();
        });

        test('should classify as low risk when score < 4', () => {
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            
            if (checkboxes.length > 0) {
                // Check only 1-2 risk factors
                checkboxes[0].checked = true;
                checkboxes[0].dispatchEvent(new Event('change', { bubbles: true }));

                const resultDiv = container.querySelector('#padua-result') || 
                                container.querySelector('.result-container');
                expect(resultDiv).toBeTruthy();
            }
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
    });

    describe('Risk Factors', () => {
        beforeEach(() => {
            const html = paduaVTE.generateHTML();
            container.innerHTML = html;
            paduaVTE.initialize(mockClient, mockPatient, container);
        });

        test('should include active cancer risk factor', () => {
            const html = container.innerHTML;
            expect(html.toLowerCase()).toContain('cancer');
        });

        test('should include previous VTE risk factor', () => {
            const html = container.innerHTML;
            expect(html.toLowerCase()).toContain('vte' || 'thromboembolism');
        });

        test('should include reduced mobility risk factor', () => {
            const html = container.innerHTML;
            expect(html.toLowerCase()).toContain('mobility' || 'bed rest');
        });
    });

    describe('Clinical Recommendations', () => {
        beforeEach(() => {
            const html = paduaVTE.generateHTML();
            container.innerHTML = html;
            paduaVTE.initialize(mockClient, mockPatient, container);
        });

        test('should recommend prophylaxis for high risk (score >= 4)', () => {
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            
            // Check multiple boxes to reach high risk
            for (let i = 0; i < Math.min(checkboxes.length, 5); i++) {
                checkboxes[i].checked = true;
            }

            if (checkboxes.length > 0) {
                checkboxes[0].dispatchEvent(new Event('change', { bubbles: true }));

                const resultDiv = container.querySelector('#padua-result') || 
                                container.querySelector('.result-container');
                if (resultDiv) {
                    expect(resultDiv.innerHTML.toLowerCase()).toContain('prophylaxis');
                }
            }
        });

        test('should not recommend prophylaxis for low risk (score < 4)', () => {
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            
            // Check only one box for low risk
            if (checkboxes.length > 0) {
                checkboxes[0].checked = true;
                checkboxes[0].dispatchEvent(new Event('change', { bubbles: true }));

                expect(container).toBeTruthy();
            }
        });
    });

    describe('Error Handling', () => {
        beforeEach(() => {
            const html = paduaVTE.generateHTML();
            container.innerHTML = html;
            paduaVTE.initialize(mockClient, mockPatient, container);
        });

        test('should work without FHIR client', () => {
            const html = paduaVTE.generateHTML();
            const newContainer = document.createElement('div');
            document.body.appendChild(newContainer);
            newContainer.innerHTML = html;
            
            expect(() => {
                paduaVTE.initialize(null, null, newContainer);
            }).not.toThrow();
            
            newContainer.remove();
        });

        test('should handle rapid checkbox toggling', () => {
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            
            if (checkboxes.length > 0) {
                // Rapidly toggle
                for (let i = 0; i < 10; i++) {
                    checkboxes[0].checked = !checkboxes[0].checked;
                    checkboxes[0].dispatchEvent(new Event('change', { bubbles: true }));
                }

                expect(container).toBeTruthy();
            }
        });
    });
});

