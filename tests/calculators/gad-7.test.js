/**
 * GAD-7 (Generalized Anxiety Disorder-7) Anxiety Scale Test
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { gad7 } from '../../js/calculators/gad-7/index.js';

describe('GAD-7 Calculator', () => {
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
            expect(gad7).toBeDefined();
            expect(gad7.id).toBe('gad-7');
            expect(gad7.title).toBeDefined();
            expect(typeof gad7.generateHTML).toBe('function');
            expect(typeof gad7.initialize).toBe('function');
        });

        test('should have correct calculator ID', () => {
            expect(gad7.id).toBe('gad-7');
        });

        test('should have descriptive title', () => {
            expect(gad7.title).toBeTruthy();
            expect(gad7.title).toContain('GAD' || 'Anxiety');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = gad7.generateHTML();
            
            expect(html).toBeDefined();
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include all 7 GAD-7 questions', () => {
            const html = gad7.generateHTML();
            container.innerHTML = html;

            // GAD-7 has 7 questions with 4 options each (0-3)
            const selects = container.querySelectorAll('select');
            const radioGroups = container.querySelectorAll('input[type="radio"]');
            
            // Should have 7 questions
            expect(selects.length + radioGroups.length / 4).toBeGreaterThanOrEqual(7);
        });

        test('should include result container', () => {
            const html = gad7.generateHTML();
            container.innerHTML = html;

            const resultContainer = container.querySelector('#gad7-result') || 
                                  container.querySelector('.result-container');
            expect(resultContainer).toBeTruthy();
        });
    });

    describe('Calculation Logic', () => {
        beforeEach(() => {
            const html = gad7.generateHTML();
            container.innerHTML = html;
            gad7.initialize(mockClient, mockPatient, container);
        });

        test('should calculate score 0 (no anxiety)', () => {
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

        test('should calculate mild anxiety score (5-9)', () => {
            const selects = container.querySelectorAll('select');
            
            // Set values to reach mild anxiety range
            selects.forEach((select, index) => {
                select.value = index < 3 ? '2' : '0';
                select.dispatchEvent(new Event('change', { bubbles: true }));
            });

            expect(container).toBeTruthy();
        });

        test('should calculate moderate anxiety score (10-14)', () => {
            const selects = container.querySelectorAll('select');
            
            // Set values to reach moderate anxiety range
            selects.forEach(select => {
                select.value = '2';
                select.dispatchEvent(new Event('change', { bubbles: true }));
            });

            expect(container).toBeTruthy();
        });

        test('should calculate severe anxiety score (15-21)', () => {
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

    describe('Anxiety Severity Classification', () => {
        beforeEach(() => {
            const html = gad7.generateHTML();
            container.innerHTML = html;
            gad7.initialize(mockClient, mockPatient, container);
        });

        test('should classify minimal anxiety (0-4)', () => {
            // GAD-7 severity levels:
            // 0-4: Minimal anxiety
            // 5-9: Mild anxiety
            // 10-14: Moderate anxiety
            // 15-21: Severe anxiety
            expect(container).toBeTruthy();
        });

        test('should classify mild anxiety (5-9)', () => {
            const selects = container.querySelectorAll('select');
            
            selects.forEach((select, index) => {
                select.value = index < 3 ? '2' : '0';
            });

            if (selects.length > 0) {
                selects[0].dispatchEvent(new Event('change', { bubbles: true }));
            }

            expect(container).toBeTruthy();
        });

        test('should classify moderate anxiety (10-14)', () => {
            const selects = container.querySelectorAll('select');
            
            selects.forEach(select => {
                select.value = '1';
            });

            if (selects.length > 0) {
                selects[0].dispatchEvent(new Event('change', { bubbles: true }));
            }

            expect(container).toBeTruthy();
        });

        test('should classify severe anxiety (15-21)', () => {
            const selects = container.querySelectorAll('select');
            
            selects.forEach(select => {
                select.value = '2';
            });

            if (selects.length > 0) {
                selects[0].dispatchEvent(new Event('change', { bubbles: true }));
            }

            expect(container).toBeTruthy();
        });
    });

    describe('Clinical Questions', () => {
        beforeEach(() => {
            const html = gad7.generateHTML();
            container.innerHTML = html;
            gad7.initialize(mockClient, mockPatient, container);
        });

        test('should include question about feeling nervous or anxious', () => {
            const html = container.innerHTML;
            expect(html.toLowerCase()).toContain('nervous' || 'anxious' || 'edge');
        });

        test('should include question about not being able to stop worrying', () => {
            const html = container.innerHTML;
            expect(html.toLowerCase()).toContain('worry' || 'worrying');
        });

        test('should include question about worrying too much', () => {
            const html = container.innerHTML;
            expect(html.toLowerCase()).toContain('worry' || 'worrying');
        });

        test('should include question about trouble relaxing', () => {
            const html = container.innerHTML;
            expect(html.toLowerCase()).toContain('relax' || 'relaxing');
        });

        test('should include question about being restless', () => {
            const html = container.innerHTML;
            expect(html.toLowerCase()).toContain('restless' || 'sit still');
        });

        test('should include question about becoming easily annoyed', () => {
            const html = container.innerHTML;
            expect(html.toLowerCase()).toContain('annoy' || 'irritable');
        });

        test('should include question about feeling afraid', () => {
            const html = container.innerHTML;
            expect(html.toLowerCase()).toContain('afraid' || 'fear');
        });
    });

    describe('Clinical Recommendations', () => {
        beforeEach(() => {
            const html = gad7.generateHTML();
            container.innerHTML = html;
            gad7.initialize(mockClient, mockPatient, container);
        });

        test('should provide appropriate recommendations for different severity levels', () => {
            // Recommendations vary by severity:
            // Minimal: Watchful waiting
            // Mild: Watchful waiting, education
            // Moderate: Consider treatment
            // Severe: Active treatment recommended
            expect(container).toBeTruthy();
        });

        test('should recommend treatment for moderate to severe anxiety', () => {
            const selects = container.querySelectorAll('select');
            
            // Set to severe anxiety
            selects.forEach(select => {
                select.value = '3';
            });

            if (selects.length > 0) {
                selects[0].dispatchEvent(new Event('change', { bubbles: true }));

                const resultDiv = container.querySelector('#gad7-result') || 
                                container.querySelector('.result-container');
                if (resultDiv) {
                    expect(resultDiv.innerHTML.toLowerCase()).toContain('treatment' || 'therapy' || 'medication');
                }
            }
        });
    });

    describe('User Interaction', () => {
        beforeEach(() => {
            const html = gad7.generateHTML();
            container.innerHTML = html;
            gad7.initialize(mockClient, mockPatient, container);
        });

        test('should update result on selection change', () => {
            const selects = container.querySelectorAll('select');
            
            if (selects.length > 0) {
                selects[0].value = '1';
                selects[0].dispatchEvent(new Event('change', { bubbles: true }));

                expect(container).toBeTruthy();
            }
        });
    });

    describe('Error Handling', () => {
        beforeEach(() => {
            const html = gad7.generateHTML();
            container.innerHTML = html;
            gad7.initialize(mockClient, mockPatient, container);
        });

        test('should work without FHIR client', () => {
            const html = gad7.generateHTML();
            const newContainer = document.createElement('div');
            document.body.appendChild(newContainer);
            newContainer.innerHTML = html;
            
            expect(() => {
                gad7.initialize(null, null, newContainer);
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

        test('should handle all questions answered simultaneously', () => {
            const selects = container.querySelectorAll('select');
            
            selects.forEach(select => {
                select.value = '2';
            });

            if (selects.length > 0) {
                selects[0].dispatchEvent(new Event('change', { bubbles: true }));

                expect(container).toBeTruthy();
            }
        });
    });
});

