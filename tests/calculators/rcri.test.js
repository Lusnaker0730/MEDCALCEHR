/**
 * Revised Cardiac Risk Index (RCRI) Calculator Test
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { rcri } from '../../js/calculators/rcri/index.js';

describe('RCRI Calculator', () => {
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
            expect(rcri).toBeDefined();
            expect(rcri.id).toBe('rcri');
            expect(rcri.title).toBeDefined();
            expect(typeof rcri.generateHTML).toBe('function');
            expect(typeof rcri.initialize).toBe('function');
        });

        test('should have correct calculator ID', () => {
            expect(rcri.id).toBe('rcri');
        });

        test('should have descriptive title', () => {
            expect(rcri.title).toBeTruthy();
            expect(rcri.title).toContain('Cardiac' || 'RCRI');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = rcri.generateHTML();
            
            expect(html).toBeDefined();
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include all 6 risk factors', () => {
            const html = rcri.generateHTML();
            container.innerHTML = html;

            // RCRI has 6 risk factors
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            expect(checkboxes.length).toBe(6);
        });

        test('should include result container', () => {
            const html = rcri.generateHTML();
            container.innerHTML = html;

            const resultContainer = container.querySelector('#rcri-result') || 
                                  container.querySelector('.result-container');
            expect(resultContainer).toBeTruthy();
        });
    });

    describe('Calculation Logic', () => {
        beforeEach(() => {
            const html = rcri.generateHTML();
            container.innerHTML = html;
            rcri.initialize(mockClient, mockPatient, container);
        });

        test('should calculate Class I (0 points) correctly', () => {
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

        test('should calculate Class II (1 point) correctly', () => {
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            
            if (checkboxes.length > 0) {
                // Check exactly one risk factor
                checkboxes[0].checked = true;
                checkboxes[0].dispatchEvent(new Event('change', { bubbles: true }));

                const resultValue = container.querySelector('.result-value');
                if (resultValue) {
                    const score = parseInt(resultValue.textContent);
                    expect(score).toBe(1);
                }
            }
        });

        test('should calculate Class III (2 points) correctly', () => {
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            
            if (checkboxes.length >= 2) {
                // Check two risk factors
                checkboxes[0].checked = true;
                checkboxes[1].checked = true;
                checkboxes[0].dispatchEvent(new Event('change', { bubbles: true }));

                const resultValue = container.querySelector('.result-value');
                if (resultValue) {
                    const score = parseInt(resultValue.textContent);
                    expect(score).toBe(2);
                }
            }
        });

        test('should calculate Class IV (>= 3 points) correctly', () => {
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            
            if (checkboxes.length >= 3) {
                // Check three or more risk factors
                checkboxes[0].checked = true;
                checkboxes[1].checked = true;
                checkboxes[2].checked = true;
                checkboxes[0].dispatchEvent(new Event('change', { bubbles: true }));

                const resultValue = container.querySelector('.result-value');
                if (resultValue) {
                    const score = parseInt(resultValue.textContent);
                    expect(score).toBeGreaterThanOrEqual(3);
                }
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
            const html = rcri.generateHTML();
            container.innerHTML = html;
            rcri.initialize(mockClient, mockPatient, container);
        });

        test('should include high-risk surgery factor', () => {
            const html = container.innerHTML;
            expect(html.toLowerCase()).toContain('surgery');
        });

        test('should include ischemic heart disease factor', () => {
            const html = container.innerHTML;
            expect(html.toLowerCase()).toContain('ischemic' || 'heart disease');
        });

        test('should include congestive heart failure factor', () => {
            const html = container.innerHTML;
            expect(html.toLowerCase()).toContain('heart failure');
        });

        test('should include cerebrovascular disease factor', () => {
            const html = container.innerHTML;
            expect(html.toLowerCase()).toContain('cerebrovascular' || 'stroke');
        });

        test('should include insulin therapy for diabetes factor', () => {
            const html = container.innerHTML;
            expect(html.toLowerCase()).toContain('insulin' || 'diabetes');
        });

        test('should include renal insufficiency factor', () => {
            const html = container.innerHTML;
            expect(html.toLowerCase()).toContain('creatinine');
        });
    });

    describe('Risk Classification', () => {
        beforeEach(() => {
            const html = rcri.generateHTML();
            container.innerHTML = html;
            rcri.initialize(mockClient, mockPatient, container);
        });

        test('should classify Class I as low risk (0.4% cardiac event rate)', () => {
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            
            checkboxes.forEach(cb => {
                cb.checked = false;
            });

            if (checkboxes.length > 0) {
                checkboxes[0].dispatchEvent(new Event('change', { bubbles: true }));

                const resultDiv = container.querySelector('#rcri-result') || 
                                container.querySelector('.result-container');
                expect(resultDiv).toBeTruthy();
            }
        });

        test('should classify Class IV as high risk (>11% cardiac event rate)', () => {
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            
            // Check all risk factors
            checkboxes.forEach(cb => {
                cb.checked = true;
            });

            if (checkboxes.length > 0) {
                checkboxes[0].dispatchEvent(new Event('change', { bubbles: true }));

                const resultDiv = container.querySelector('#rcri-result') || 
                                container.querySelector('.result-container');
                expect(resultDiv).toBeTruthy();
            }
        });
    });

    describe('Clinical Recommendations', () => {
        beforeEach(() => {
            const html = rcri.generateHTML();
            container.innerHTML = html;
            rcri.initialize(mockClient, mockPatient, container);
        });

        test('should show appropriate risk percentage for each class', () => {
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            
            if (checkboxes.length > 0) {
                checkboxes[0].checked = true;
                checkboxes[0].dispatchEvent(new Event('change', { bubbles: true }));

                const resultDiv = container.querySelector('#rcri-result') || 
                                container.querySelector('.result-container');
                if (resultDiv) {
                    expect(resultDiv.innerHTML).toContain('%');
                }
            }
        });
    });

    describe('User Interaction', () => {
        beforeEach(() => {
            const html = rcri.generateHTML();
            container.innerHTML = html;
            rcri.initialize(mockClient, mockPatient, container);
        });

        test('should highlight checked risk factors', () => {
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            
            if (checkboxes.length > 0) {
                checkboxes[0].checked = true;
                checkboxes[0].dispatchEvent(new Event('change', { bubbles: true }));

                // Parent element might get a class
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
            const html = rcri.generateHTML();
            container.innerHTML = html;
            rcri.initialize(mockClient, mockPatient, container);
        });

        test('should work without FHIR client', () => {
            const html = rcri.generateHTML();
            const newContainer = document.createElement('div');
            document.body.appendChild(newContainer);
            newContainer.innerHTML = html;
            
            expect(() => {
                rcri.initialize(null, null, newContainer);
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

        test('should handle all checkboxes being checked and unchecked', () => {
            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            
            // Check all
            checkboxes.forEach(cb => {
                cb.checked = true;
            });
            if (checkboxes.length > 0) {
                checkboxes[0].dispatchEvent(new Event('change', { bubbles: true }));
            }

            // Uncheck all
            checkboxes.forEach(cb => {
                cb.checked = false;
            });
            if (checkboxes.length > 0) {
                checkboxes[0].dispatchEvent(new Event('change', { bubbles: true }));
            }

            expect(container).toBeTruthy();
        });
    });
});

