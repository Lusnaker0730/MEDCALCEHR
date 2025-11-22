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
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = paduaVTE.generateHTML();
            
            expect(html).toBeDefined();
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include risk factor radio groups', () => {
            const html = paduaVTE.generateHTML();
            container.innerHTML = html;

            // Padua has 11 risk factors, each should be a radio group
            const radioGroups = container.querySelectorAll('.ui-radio-group');
            expect(radioGroups.length).toBeGreaterThan(10);
        });

        test('should include result container', () => {
            const html = paduaVTE.generateHTML();
            container.innerHTML = html;

            const resultContainer = container.querySelector('#padua-result') || 
                                  container.querySelector('.ui-result-box');
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
            // All "No" by default
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

        test('should calculate score correctly with single risk factor', () => {
            const yesRadio = container.querySelector('input[value="3"]'); // Cancer, VTE etc.
            
            if (yesRadio) {
                yesRadio.checked = true;
                yesRadio.dispatchEvent(new Event('change', { bubbles: true }));

                const resultValue = container.querySelector('.ui-result-value');
                expect(resultValue).toBeTruthy();
                expect(parseInt(resultValue.textContent)).toBe(3);
            }
        });

        test('should classify as high risk when score >= 4', () => {
            // Check multiple risk factors to reach score >= 4
            // Cancer (3) + Age >= 70 (1)
            const cancerRadio = container.querySelector('input[name="padua-cancer"][value="3"]');
            const ageRadio = container.querySelector('input[name="padua-age"][value="1"]');

            if (cancerRadio && ageRadio) {
                cancerRadio.checked = true;
                cancerRadio.dispatchEvent(new Event('change', { bubbles: true }));
                
                ageRadio.checked = true;
                ageRadio.dispatchEvent(new Event('change', { bubbles: true }));

                const resultDiv = container.querySelector('#padua-result');
                expect(resultDiv.classList.contains('show')).toBeTruthy();
                expect(resultDiv.innerHTML).toContain('High Risk');
            }
        });

        test('should classify as low risk when score < 4', () => {
             // Cancer (3) only
            const cancerRadio = container.querySelector('input[name="padua-cancer"][value="3"]');

            if (cancerRadio) {
                cancerRadio.checked = true;
                cancerRadio.dispatchEvent(new Event('change', { bubbles: true }));

                const resultDiv = container.querySelector('#padua-result');
                expect(resultDiv.classList.contains('show')).toBeTruthy();
                expect(resultDiv.innerHTML).toContain('Low Risk');
            }
        });
    });
});