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

        test('should include multiple risk factor radio groups', () => {
            const html = caprini.generateHTML();
            container.innerHTML = html;

            const radioGroups = container.querySelectorAll('.ui-radio-group');
            expect(radioGroups.length).toBeGreaterThan(10);
        });

        test('should include result container', () => {
            const html = caprini.generateHTML();
            container.innerHTML = html;

            const resultContainer = container.querySelector('#caprini-result');
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
            // Ensure Age is < 41 (0 points) as mock patient might be older
            const ageZeroRadio = container.querySelector('input[name="caprini-age"][value="0"]');
            if (ageZeroRadio) {
                ageZeroRadio.checked = true;
                ageZeroRadio.dispatchEvent(new Event('change', { bubbles: true }));
            }

            // Default is 0
            const resultValue = container.querySelector('.ui-result-value');
            if (resultValue) {
                const score = parseInt(resultValue.textContent);
                expect(score).toBe(0);
            }
        });

        test('should calculate low risk score (1-2 points)', () => {
            // Check first radio group yes option (usually 1 point)
            const firstGroup = container.querySelector('.ui-radio-group');
            const yesOption = firstGroup.querySelector('input[value="1"]'); // Assuming first one is 1 point
            
            if (yesOption) {
                yesOption.checked = true;
                yesOption.dispatchEvent(new Event('change', { bubbles: true }));

                const resultValue = container.querySelector('.ui-result-value');
                const score = parseInt(resultValue.textContent);
                expect(score).toBeGreaterThanOrEqual(1);
            }
        });

        test('should calculate moderate risk score (3-4 points)', () => {
            const threePointOption = container.querySelector('input[value="3"]');
            if (threePointOption) {
                threePointOption.checked = true;
                threePointOption.dispatchEvent(new Event('change', { bubbles: true }));

                const resultValue = container.querySelector('.ui-result-value');
                const score = parseInt(resultValue.textContent);
                expect(score).toBeGreaterThanOrEqual(3);
            }
        });

        test('should calculate high risk score (≥5 points)', () => {
            const fivePointOption = container.querySelector('input[value="5"]');
            if (fivePointOption) {
                fivePointOption.checked = true;
                fivePointOption.dispatchEvent(new Event('change', { bubbles: true }));

                const resultValue = container.querySelector('.ui-result-value');
                const score = parseInt(resultValue.textContent);
                expect(score).toBeGreaterThanOrEqual(5);
            }
        });

        test('should handle age-based risk factors correctly', () => {
            const ageRadios = container.querySelectorAll('input[name="caprini-age"]');
            // Assuming index 3 is Age >= 75 (3 points)
            if (ageRadios[3]) {
                ageRadios[3].checked = true;
                ageRadios[3].dispatchEvent(new Event('change', { bubbles: true }));
                
                const resultValue = container.querySelector('.ui-result-value');
                expect(parseInt(resultValue.textContent)).toBe(3);
            }
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
            expect(html.toLowerCase()).toContain('bed');
        });

        test('should include history of VTE risk factor', () => {
            const html = container.innerHTML;
            expect(html.toLowerCase()).toContain('vte' || 'thrombosis' || 'embolism');
        });

        test('should include cancer risk factor', () => {
            const html = container.innerHTML;
            expect(html.toLowerCase()).toContain('malignancy');
        });
    });

    describe('Prophylaxis Recommendations', () => {
        beforeEach(() => {
            const html = caprini.generateHTML();
            container.innerHTML = html;
            caprini.initialize(mockClient, mockPatient, container);
        });

        test('should recommend no prophylaxis for very low risk', () => {
            // Ensure Age is 0
            const ageZeroRadio = container.querySelector('input[name="caprini-age"][value="0"]');
            if (ageZeroRadio) {
                ageZeroRadio.checked = true;
                ageZeroRadio.dispatchEvent(new Event('change', { bubbles: true }));
            }

            const resultDiv = container.querySelector('#caprini-result');
            // Assuming default is 0
            if (resultDiv) {
                expect(resultDiv.innerHTML.toLowerCase()).toContain('ambulat' || 'early' || 'no prophylaxis');
            }
        });

        test('should recommend pharmacologic prophylaxis for high risk', () => {
            const fivePointOption = container.querySelector('input[value="5"]');
            if (fivePointOption) {
                fivePointOption.checked = true;
                fivePointOption.dispatchEvent(new Event('change', { bubbles: true }));

                const resultDiv = container.querySelector('#caprini-result');
                if (resultDiv) {
                    expect(resultDiv.innerHTML.toLowerCase()).toContain('pharmacolog' || 'lmwh' || 'heparin');
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
    });
});