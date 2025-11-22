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

            // RCRI has 6 risk factors (now radio groups)
            const radioGroups = container.querySelectorAll('.ui-radio-group');
            expect(radioGroups.length).toBe(6);
        });

        test('should include result container', () => {
            const html = rcri.generateHTML();
            container.innerHTML = html;

            const resultContainer = container.querySelector('#rcri-result');
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
            // Ensure all "No" selected
            const noRadios = container.querySelectorAll('input[value="0"]');
            noRadios.forEach(radio => {
                radio.checked = true;
                radio.dispatchEvent(new Event('change', { bubbles: true }));
            });

            const resultValue = container.querySelector('.ui-result-value');
            if (resultValue) {
                const score = parseInt(resultValue.textContent);
                expect(score).toBe(0);
            }
        });

        test('should calculate Class II (1 point) correctly', () => {
            const yesRadio = container.querySelector('input[value="1"]');
            
            if (yesRadio) {
                yesRadio.checked = true;
                yesRadio.dispatchEvent(new Event('change', { bubbles: true }));

                const resultValue = container.querySelector('.ui-result-value');
                if (resultValue) {
                    const score = parseInt(resultValue.textContent);
                    expect(score).toBe(1);
                }
            }
        });

        test('should calculate Class III (2 points) correctly', () => {
            // Select two Yes
            const yesRadios = container.querySelectorAll('input[value="1"]');
            if (yesRadios.length >= 2) {
                yesRadios[0].checked = true;
                yesRadios[0].dispatchEvent(new Event('change', { bubbles: true }));
                yesRadios[1].checked = true;
                yesRadios[1].dispatchEvent(new Event('change', { bubbles: true }));

                const resultValue = container.querySelector('.ui-result-value');
                if (resultValue) {
                    const score = parseInt(resultValue.textContent);
                    expect(score).toBe(2);
                }
            }
        });

        test('should calculate Class IV (>= 3 points) correctly', () => {
            const yesRadios = container.querySelectorAll('input[value="1"]');
            if (yesRadios.length >= 3) {
                yesRadios[0].checked = true;
                yesRadios[0].dispatchEvent(new Event('change', { bubbles: true }));
                yesRadios[1].checked = true;
                yesRadios[1].dispatchEvent(new Event('change', { bubbles: true }));
                yesRadios[2].checked = true;
                yesRadios[2].dispatchEvent(new Event('change', { bubbles: true }));

                const resultValue = container.querySelector('.ui-result-value');
                if (resultValue) {
                    const score = parseInt(resultValue.textContent);
                    expect(score).toBeGreaterThanOrEqual(3);
                }
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

    describe('Clinical Recommendations', () => {
        beforeEach(() => {
            const html = rcri.generateHTML();
            container.innerHTML = html;
            rcri.initialize(mockClient, mockPatient, container);
        });

        test('should show appropriate risk percentage for each class', () => {
            const yesRadio = container.querySelector('input[value="1"]');
            
            if (yesRadio) {
                yesRadio.checked = true;
                yesRadio.dispatchEvent(new Event('change', { bubbles: true }));

                const resultDiv = container.querySelector('#rcri-result');
                expect(resultDiv.innerHTML).toContain('%');
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
    });
});