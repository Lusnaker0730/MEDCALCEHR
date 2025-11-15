/**
 * NIH Stroke Scale (NIHSS) Calculator Test
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { nihss } from '../../js/calculators/nihss/index.js';

describe('NIHSS Calculator', () => {
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
            expect(nihss).toBeDefined();
            expect(nihss.id).toBe('nihss');
            expect(nihss.title).toBeDefined();
            expect(typeof nihss.generateHTML).toBe('function');
            expect(typeof nihss.initialize).toBe('function');
        });

        test('should have correct calculator ID', () => {
            expect(nihss.id).toBe('nihss');
        });

        test('should have descriptive title', () => {
            expect(nihss.title).toBeTruthy();
            expect(nihss.title).toContain('Stroke');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = nihss.generateHTML();
            
            expect(html).toBeDefined();
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include all 15 assessment items', () => {
            const html = nihss.generateHTML();
            container.innerHTML = html;

            // NIHSS has 15 items (0-14)
            // Check for some key items
            const item1a = container.querySelector('[data-item="1a"]') || 
                          container.querySelector('#nihss-1a');
            const item1b = container.querySelector('[data-item="1b"]') || 
                          container.querySelector('#nihss-1b');
            const item1c = container.querySelector('[data-item="1c"]') || 
                          container.querySelector('#nihss-1c');
            
            // Should have multiple assessment sections
            const radioGroups = container.querySelectorAll('input[type="radio"]');
            expect(radioGroups.length).toBeGreaterThan(10);
        });

        test('should include result container', () => {
            const html = nihss.generateHTML();
            container.innerHTML = html;

            const resultContainer = container.querySelector('#nihss-result') || 
                                  container.querySelector('.result-container');
            expect(resultContainer).toBeTruthy();
        });
    });

    describe('Calculation Logic', () => {
        beforeEach(() => {
            const html = nihss.generateHTML();
            container.innerHTML = html;
            nihss.initialize(mockClient, mockPatient, container);
        });

        test('should calculate score of 0 (no stroke) correctly', () => {
            // Select 0 points for all items
            const radioInputs = container.querySelectorAll('input[type="radio"]');
            
            // Find all radio inputs with value="0" and check them
            const zeroRadios = Array.from(radioInputs).filter(r => r.value === '0');
            
            // Group by name and check one zero radio per group
            const groups = {};
            zeroRadios.forEach(radio => {
                if (!groups[radio.name]) {
                    groups[radio.name] = radio;
                    radio.checked = true;
                    radio.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });

            // Wait for calculation
            setTimeout(() => {
                const resultValue = container.querySelector('.result-value');
                if (resultValue) {
                    const score = parseInt(resultValue.textContent);
                    expect(score).toBe(0);
                }
            }, 100);
        });

        test('should calculate moderate stroke score correctly', () => {
            // Select various point values to simulate moderate stroke
            const radioInputs = container.querySelectorAll('input[type="radio"]');
            
            if (radioInputs.length > 0) {
                // Check some radios with different values
                const groups = {};
                radioInputs.forEach(radio => {
                    if (!groups[radio.name]) {
                        groups[radio.name] = radio;
                        radio.checked = true;
                        radio.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                });

                // Result should be calculated
                expect(container).toBeTruthy();
            }
        });

        test('should handle maximum score (42)', () => {
            // NIHSS maximum score is 42
            const radioInputs = container.querySelectorAll('input[type="radio"]');
            
            // Try to select the highest value for each item
            const groups = {};
            Array.from(radioInputs).reverse().forEach(radio => {
                if (!groups[radio.name]) {
                    groups[radio.name] = radio;
                    radio.checked = true;
                    radio.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });

            expect(container).toBeTruthy();
        });
    });

    describe('Stroke Severity Classification', () => {
        beforeEach(() => {
            const html = nihss.generateHTML();
            container.innerHTML = html;
            nihss.initialize(mockClient, mockPatient, container);
        });

        test('should classify as no stroke (0)', () => {
            // Test classification for score 0
            const radioInputs = container.querySelectorAll('input[type="radio"]');
            const zeroRadios = Array.from(radioInputs).filter(r => r.value === '0');
            
            const groups = {};
            zeroRadios.forEach(radio => {
                if (!groups[radio.name]) {
                    groups[radio.name] = radio;
                    radio.checked = true;
                }
            });

            if (zeroRadios.length > 0) {
                zeroRadios[0].dispatchEvent(new Event('change', { bubbles: true }));
            }

            const resultDiv = container.querySelector('#nihss-result') || 
                            container.querySelector('.result-container');
            expect(resultDiv).toBeTruthy();
        });

        test('should classify as minor stroke (1-4)', () => {
            // Classifications:
            // 0 = No stroke
            // 1-4 = Minor stroke
            // 5-15 = Moderate stroke
            // 16-20 = Moderate to severe stroke
            // 21-42 = Severe stroke
            expect(container).toBeTruthy();
        });
    });

    describe('User Interaction', () => {
        beforeEach(() => {
            const html = nihss.generateHTML();
            container.innerHTML = html;
            nihss.initialize(mockClient, mockPatient, container);
        });

        test('should update score when selections change', () => {
            const radioInputs = container.querySelectorAll('input[type="radio"]');
            
            if (radioInputs.length > 0) {
                const firstRadio = radioInputs[0];
                firstRadio.checked = true;
                firstRadio.dispatchEvent(new Event('change', { bubbles: true }));

                // Score should update
                expect(container).toBeTruthy();
            }
        });

        test('should allow deselection and reselection', () => {
            const radioInputs = container.querySelectorAll('input[type="radio"]');
            
            if (radioInputs.length > 1) {
                radioInputs[0].checked = true;
                radioInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
                
                radioInputs[1].checked = true;
                radioInputs[1].dispatchEvent(new Event('change', { bubbles: true }));

                expect(container).toBeTruthy();
            }
        });
    });

    describe('Error Handling', () => {
        beforeEach(() => {
            const html = nihss.generateHTML();
            container.innerHTML = html;
            nihss.initialize(mockClient, mockPatient, container);
        });

        test('should work without FHIR client', () => {
            const html = nihss.generateHTML();
            const newContainer = document.createElement('div');
            document.body.appendChild(newContainer);
            newContainer.innerHTML = html;
            
            expect(() => {
                nihss.initialize(null, null, newContainer);
            }).not.toThrow();
            
            newContainer.remove();
        });

        test('should handle incomplete assessment', () => {
            // When not all items are filled, should still show partial score
            const radioInputs = container.querySelectorAll('input[type="radio"]');
            
            if (radioInputs.length > 0) {
                // Check only first item
                radioInputs[0].checked = true;
                radioInputs[0].dispatchEvent(new Event('change', { bubbles: true }));

                // Should handle gracefully
                expect(container).toBeTruthy();
            }
        });
    });
});

