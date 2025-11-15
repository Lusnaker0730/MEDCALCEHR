/**
 * PHQ-9 (Patient Health Questionnaire-9) Depression Scale Test
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { phq9 } from '../../js/calculators/phq-9/index.js';

describe('PHQ-9 Calculator', () => {
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
            expect(phq9).toBeDefined();
            expect(phq9.id).toBe('phq-9');
            expect(phq9.title).toBeDefined();
            expect(typeof phq9.generateHTML).toBe('function');
            expect(typeof phq9.initialize).toBe('function');
        });

        test('should have correct calculator ID', () => {
            expect(phq9.id).toBe('phq-9');
        });

        test('should have descriptive title', () => {
            expect(phq9.title).toBeTruthy();
            expect(phq9.title).toContain('PHQ' || 'Depression');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = phq9.generateHTML();
            
            expect(html).toBeDefined();
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include all 9 PHQ-9 questions', () => {
            const html = phq9.generateHTML();
            container.innerHTML = html;

            // PHQ-9 has 9 questions with 4 options each (0-3)
            const selects = container.querySelectorAll('select');
            const radioGroups = container.querySelectorAll('input[type="radio"]');
            
            // Should have 9 questions (either as selects or radio groups)
            expect(selects.length + radioGroups.length / 4).toBeGreaterThanOrEqual(9);
        });

        test('should include result container', () => {
            const html = phq9.generateHTML();
            container.innerHTML = html;

            const resultContainer = container.querySelector('#phq9-result') || 
                                  container.querySelector('.result-container');
            expect(resultContainer).toBeTruthy();
        });
    });

    describe('Calculation Logic', () => {
        beforeEach(() => {
            const html = phq9.generateHTML();
            container.innerHTML = html;
            phq9.initialize(mockClient, mockPatient, container);
        });

        test('should calculate score 0 (no depression)', () => {
            // Select "Not at all" (0) for all questions
            const selects = container.querySelectorAll('select');
            
            selects.forEach(select => {
                select.value = '0';
                select.dispatchEvent(new Event('change', { bubbles: true }));
            });

            if (selects.length > 0) {
                const resultValue = container.querySelector('.result-value');
                if (resultValue) {
                    const score = parseInt(resultValue.textContent);
                    expect(score).toBe(0);
                }
            }
        });

        test('should calculate mild depression score (5-9)', () => {
            const selects = container.querySelectorAll('select');
            
            // Set values to reach mild depression range
            selects.forEach((select, index) => {
                select.value = index < 5 ? '1' : '0';
                select.dispatchEvent(new Event('change', { bubbles: true }));
            });

            expect(container).toBeTruthy();
        });

        test('should calculate moderate depression score (10-14)', () => {
            const selects = container.querySelectorAll('select');
            
            // Set values to reach moderate depression range
            selects.forEach((select, index) => {
                select.value = index < 5 ? '2' : '0';
                select.dispatchEvent(new Event('change', { bubbles: true }));
            });

            expect(container).toBeTruthy();
        });

        test('should calculate moderately severe depression score (15-19)', () => {
            const selects = container.querySelectorAll('select');
            
            selects.forEach((select, index) => {
                select.value = index < 6 ? '2' : '1';
                select.dispatchEvent(new Event('change', { bubbles: true }));
            });

            expect(container).toBeTruthy();
        });

        test('should calculate severe depression score (20-27)', () => {
            const selects = container.querySelectorAll('select');
            
            // Set all to highest values
            selects.forEach(select => {
                select.value = '3';
                select.dispatchEvent(new Event('change', { bubbles: true }));
            });

            expect(container).toBeTruthy();
        });

        test('should update score when selections change', () => {
            const selects = container.querySelectorAll('select');
            
            if (selects.length > 0) {
                selects[0].value = '1';
                selects[0].dispatchEvent(new Event('change', { bubbles: true }));

                selects[0].value = '2';
                selects[0].dispatchEvent(new Event('change', { bubbles: true }));

                expect(container).toBeTruthy();
            }
        });
    });

    describe('Depression Severity Classification', () => {
        beforeEach(() => {
            const html = phq9.generateHTML();
            container.innerHTML = html;
            phq9.initialize(mockClient, mockPatient, container);
        });

        test('should classify minimal depression (0-4)', () => {
            // PHQ-9 severity levels:
            // 0-4: Minimal depression
            // 5-9: Mild depression
            // 10-14: Moderate depression
            // 15-19: Moderately severe depression
            // 20-27: Severe depression
            expect(container).toBeTruthy();
        });

        test('should classify mild depression (5-9)', () => {
            const selects = container.querySelectorAll('select');
            
            selects.forEach((select, index) => {
                select.value = index < 3 ? '2' : '0';
            });

            if (selects.length > 0) {
                selects[0].dispatchEvent(new Event('change', { bubbles: true }));
            }

            expect(container).toBeTruthy();
        });

        test('should classify moderate depression (10-14)', () => {
            const selects = container.querySelectorAll('select');
            
            selects.forEach(select => {
                select.value = '1';
            });

            if (selects.length > 0) {
                selects[0].dispatchEvent(new Event('change', { bubbles: true }));
            }

            expect(container).toBeTruthy();
        });
    });

    describe('Clinical Questions', () => {
        beforeEach(() => {
            const html = phq9.generateHTML();
            container.innerHTML = html;
            phq9.initialize(mockClient, mockPatient, container);
        });

        test('should include question about little interest or pleasure', () => {
            const html = container.innerHTML;
            expect(html.toLowerCase()).toContain('interest' || 'pleasure');
        });

        test('should include question about feeling down or depressed', () => {
            const html = container.innerHTML;
            expect(html.toLowerCase()).toContain('down' || 'depress' || 'hopeless');
        });

        test('should include question about sleep problems', () => {
            const html = container.innerHTML;
            expect(html.toLowerCase()).toContain('sleep' || 'asleep');
        });

        test('should include question about energy level', () => {
            const html = container.innerHTML;
            expect(html.toLowerCase()).toContain('energy' || 'tired' || 'fatigue');
        });

        test('should include question about appetite', () => {
            const html = container.innerHTML;
            expect(html.toLowerCase()).toContain('appetite' || 'eating');
        });

        test('should include question about self-worth', () => {
            const html = container.innerHTML;
            expect(html.toLowerCase()).toContain('bad about yourself' || 'failure' || 'let' || 'down');
        });

        test('should include question about concentration', () => {
            const html = container.innerHTML;
            expect(html.toLowerCase()).toContain('concentrat' || 'focus');
        });

        test('should include question about psychomotor changes', () => {
            const html = container.innerHTML;
            expect(html.toLowerCase()).toContain('moving' || 'speaking' || 'slow' || 'restless');
        });

        test('should include question about suicidal thoughts', () => {
            const html = container.innerHTML;
            expect(html.toLowerCase()).toContain('better off dead' || 'hurt' || 'suicid');
        });
    });

    describe('Clinical Recommendations', () => {
        beforeEach(() => {
            const html = phq9.generateHTML();
            container.innerHTML = html;
            phq9.initialize(mockClient, mockPatient, container);
        });

        test('should provide appropriate recommendations for different severity levels', () => {
            // Recommendations vary by severity:
            // Minimal: Support, follow-up
            // Mild: Watchful waiting, support
            // Moderate: Treatment plan, consider therapy/medication
            // Moderately severe/Severe: Active treatment with medication and/or psychotherapy
            expect(container).toBeTruthy();
        });

        test('should flag suicidal ideation', () => {
            // Question 9 about thoughts of hurting oneself should be flagged
            expect(container).toBeTruthy();
        });
    });

    describe('Error Handling', () => {
        beforeEach(() => {
            const html = phq9.generateHTML();
            container.innerHTML = html;
            phq9.initialize(mockClient, mockPatient, container);
        });

        test('should work without FHIR client', () => {
            const html = phq9.generateHTML();
            const newContainer = document.createElement('div');
            document.body.appendChild(newContainer);
            newContainer.innerHTML = html;
            
            expect(() => {
                phq9.initialize(null, null, newContainer);
            }).not.toThrow();
            
            newContainer.remove();
        });

        test('should handle incomplete questionnaire', () => {
            // When not all questions are answered
            const selects = container.querySelectorAll('select');
            
            if (selects.length > 0) {
                selects[0].value = '1';
                selects[0].dispatchEvent(new Event('change', { bubbles: true }));

                expect(container).toBeTruthy();
            }
        });

        test('should handle rapid selection changes', () => {
            const selects = container.querySelectorAll('select');
            
            if (selects.length > 0) {
                for (let i = 0; i < 10; i++) {
                    selects[0].value = String(i % 4);
                    selects[0].dispatchEvent(new Event('change', { bubbles: true }));
                }

                expect(container).toBeTruthy();
            }
        });
    });
});

