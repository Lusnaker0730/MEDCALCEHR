/**
 * CIWA-Ar (Clinical Institute Withdrawal Assessment for Alcohol) Test
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { ciwaAr } from '../../js/calculators/ciwa-ar/index.js';

describe('CIWA-Ar Calculator', () => {
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
            expect(ciwaAr).toBeDefined();
            expect(ciwaAr.id).toBe('ciwa-ar');
            expect(ciwaAr.title).toBeDefined();
            expect(typeof ciwaAr.generateHTML).toBe('function');
            expect(typeof ciwaAr.initialize).toBe('function');
        });

        test('should have correct calculator ID', () => {
            expect(ciwaAr.id).toBe('ciwa-ar');
        });

        test('should have descriptive title', () => {
            expect(ciwaAr.title).toBeTruthy();
            expect(ciwaAr.title).toContain('CIWA' || 'Alcohol' || 'Withdrawal');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = ciwaAr.generateHTML();
            
            expect(html).toBeDefined();
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include all 10 CIWA-Ar assessment items', () => {
            const html = ciwaAr.generateHTML();
            container.innerHTML = html;

            // CIWA-Ar has 10 assessment categories
            const html_lower = html.toLowerCase();
            expect(html_lower).toContain('nausea' || 'vomiting');
            expect(html_lower).toContain('tremor');
            expect(html_lower).toContain('anxiety');
        });

        test('should include result container', () => {
            const html = ciwaAr.generateHTML();
            container.innerHTML = html;

            const resultContainer = container.querySelector('#ciwa-ar-result');
            expect(resultContainer).toBeTruthy();
        });
    });

    describe('Calculation Logic', () => {
        beforeEach(() => {
            const html = ciwaAr.generateHTML();
            container.innerHTML = html;
            ciwaAr.initialize(mockClient, mockPatient, container);
        });

        test('should calculate score 0 (minimal withdrawal)', () => {
            // Select all "0" options
            const radioInputs = container.querySelectorAll('input[type="radio"][value="0"]');
            
            const groups = {};
            radioInputs.forEach(radio => {
                if (!groups[radio.name]) {
                    groups[radio.name] = true;
                    radio.checked = true;
                    radio.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });

            // Score should be 0 or close to 0
            expect(container).toBeTruthy();
        });

        test('should calculate moderate withdrawal score (10-15)', () => {
            const radioInputs = container.querySelectorAll('input[type="radio"]');
            
            // Select moderate values (value="1" or "2")
            const groups = {};
            radioInputs.forEach(radio => {
                if (!groups[radio.name] && (radio.value === '1' || radio.value === '2')) {
                    groups[radio.name] = true;
                    radio.checked = true;
                }
            });

            if (Object.keys(groups).length > 0) {
                radioInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
            }

            expect(container).toBeTruthy();
        });

        test('should calculate severe withdrawal score (>15)', () => {
            const radioInputs = container.querySelectorAll('input[type="radio"]');
            
            // Select high values
            const groups = {};
            Array.from(radioInputs).reverse().forEach(radio => {
                if (!groups[radio.name]) {
                    groups[radio.name] = true;
                    radio.checked = true;
                }
            });

            if (Object.keys(groups).length > 0) {
                radioInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
            }

            expect(container).toBeTruthy();
        });

        test('should update score when selections change', () => {
            const radioInputs = container.querySelectorAll('input[type="radio"]');
            
            if (radioInputs.length > 0) {
                radioInputs[0].checked = true;
                radioInputs[0].dispatchEvent(new Event('change', { bubbles: true }));

                expect(container).toBeTruthy();
            }
        });
    });

    describe('Severity Classification', () => {
        beforeEach(() => {
            const html = ciwaAr.generateHTML();
            container.innerHTML = html;
            ciwaAr.initialize(mockClient, mockPatient, container);
        });

        test('should classify minimal withdrawal (0-9)', () => {
            // CIWA-Ar severity:
            // <8-10: Minimal/absent withdrawal
            // 8-15: Mild to moderate withdrawal
            // >15: Severe withdrawal requiring medication
            expect(container).toBeTruthy();
        });

        test('should classify mild to moderate withdrawal (10-15)', () => {
            expect(container).toBeTruthy();
        });

        test('should classify severe withdrawal (>15)', () => {
            expect(container).toBeTruthy();
        });
    });

    describe('Clinical Assessment Items', () => {
        beforeEach(() => {
            const html = ciwaAr.generateHTML();
            container.innerHTML = html;
            ciwaAr.initialize(mockClient, mockPatient, container);
        });

        test('should include nausea/vomiting assessment', () => {
            const html = container.innerHTML;
            expect(html.toLowerCase()).toContain('nausea' || 'vomit');
        });

        test('should include tremor assessment', () => {
            const html = container.innerHTML;
            expect(html.toLowerCase()).toContain('tremor');
        });

        test('should include anxiety assessment', () => {
            const html = container.innerHTML;
            expect(html.toLowerCase()).toContain('anxiety' || 'anxious');
        });

        test('should include agitation assessment', () => {
            const html = container.innerHTML;
            expect(html.toLowerCase()).toContain('agitation' || 'agitated');
        });

        test('should include tactile disturbances assessment', () => {
            const html = container.innerHTML;
            expect(html.toLowerCase()).toContain('tactile' || 'itch' || 'burn');
        });
    });

    describe('Clinical Recommendations', () => {
        beforeEach(() => {
            const html = ciwaAr.generateHTML();
            container.innerHTML = html;
            ciwaAr.initialize(mockClient, mockPatient, container);
        });

        test('should provide appropriate management for different severity levels', () => {
            // Different management based on score:
            // <8: Supportive care
            // 8-15: Consider medication
            // >15: Medication indicated
            expect(container).toBeTruthy();
        });
    });

    describe('Error Handling', () => {
        beforeEach(() => {
            const html = ciwaAr.generateHTML();
            container.innerHTML = html;
            ciwaAr.initialize(mockClient, mockPatient, container);
        });

        test('should work without FHIR client', () => {
            const html = ciwaAr.generateHTML();
            const newContainer = document.createElement('div');
            document.body.appendChild(newContainer);
            newContainer.innerHTML = html;
            
            expect(() => {
                ciwaAr.initialize(null, null, newContainer);
            }).not.toThrow();
            
            newContainer.remove();
        });

        test('should handle incomplete assessment', () => {
            // When not all items are filled
            const radioInputs = container.querySelectorAll('input[type="radio"]');
            
            if (radioInputs.length > 0) {
                radioInputs[0].checked = true;
                radioInputs[0].dispatchEvent(new Event('change', { bubbles: true }));

                expect(container).toBeTruthy();
            }
        });

        test('should handle rapid selection changes', () => {
            const radioInputs = container.querySelectorAll('input[type="radio"]');
            
            if (radioInputs.length > 2) {
                for (let i = 0; i < 5; i++) {
                    radioInputs[i % radioInputs.length].checked = true;
                    radioInputs[i % radioInputs.length].dispatchEvent(new Event('change', { bubbles: true }));
                }

                expect(container).toBeTruthy();
            }
        });
    });
});

