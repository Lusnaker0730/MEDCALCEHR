import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { fourPeps } from '../../js/calculators/4peps/index.js';

describe('4PEPS Calculator', () => {
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
            expect(fourPeps).toBeDefined();
            expect(fourPeps.id).toBe('4peps');
            expect(fourPeps.title).toBeDefined();
            expect(typeof fourPeps.generateHTML).toBe('function');
            expect(typeof fourPeps.initialize).toBe('function');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = fourPeps.generateHTML();
            expect(html).toBeDefined();
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include required input fields', () => {
            const html = fourPeps.generateHTML();
            container.innerHTML = html;

            const ageInput = container.querySelector('#fourpeps-age');
            const sexRadios = container.querySelectorAll('input[name="4peps-sex"]');
            
            expect(ageInput).toBeTruthy();
            expect(sexRadios.length).toBe(2);
        });
    });

    describe('Calculation Logic', () => {
        beforeEach(() => {
            const html = fourPeps.generateHTML();
            container.innerHTML = html;
            fourPeps.initialize(mockClient, mockPatient, container);
        });

        test('should calculate score correctly (Low CPP)', () => {
            // Female (0), Age 50 (0), No other factors
            const ageInput = container.querySelector('#fourpeps-age');
            const femaleRadio = container.querySelector('input[name="4peps-sex"][value="0"]');
            
            ageInput.value = '50';
            if (femaleRadio) {
                femaleRadio.checked = true;
                femaleRadio.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            ageInput.dispatchEvent(new Event('input', { bubbles: true }));

            const scoreEl = container.querySelector('.ui-result-value');
            expect(scoreEl).toBeTruthy();
            expect(parseInt(scoreEl.textContent)).toBe(0);
            
            const interpretationEl = container.querySelectorAll('.ui-result-value')[1];
            expect(interpretationEl.textContent).toContain('2-7%');
        });

        test('should calculate score correctly (High CPP)', () => {
            // Male (+2), Age 80 (+2), PE likely (+5) = 9
            
            const ageInput = container.querySelector('#fourpeps-age');
            const maleRadio = container.querySelector('input[name="4peps-sex"][value="2"]');
            const peLikelyRadio = container.querySelector('input[name="4peps-pe_likely"][value="5"]');
            
            ageInput.value = '80';
            if (maleRadio) {
                maleRadio.checked = true;
                maleRadio.dispatchEvent(new Event('change', { bubbles: true }));
            }
            if (peLikelyRadio) {
                peLikelyRadio.checked = true;
                peLikelyRadio.dispatchEvent(new Event('change', { bubbles: true }));
            }
            
            ageInput.dispatchEvent(new Event('input', { bubbles: true }));

            const scoreEl = container.querySelector('.ui-result-value');
            const score = parseInt(scoreEl.textContent);
            expect(score).toBe(9);
        });
    });

    describe('Initialization', () => {
        test('should work without FHIR client', () => {
            const html = fourPeps.generateHTML();
            container.innerHTML = html;
            
            fourPeps.initialize(null, null, container);
            
            const resultContainer = container.querySelector('#fourpeps-result');
            expect(resultContainer).toBeTruthy();
        });
    });
});
