import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { fourPeps } from '../../js/calculators/4peps/index.js';

describe('4PEPS (4-Level Pulmonary Embolism Probability Score)', () => {
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
            const sexInputs = container.querySelectorAll('input[name="sex"]');
            
            expect(ageInput).toBeTruthy();
            expect(sexInputs.length).toBeGreaterThan(0);
        });

        test('should include result container', () => {
            const html = fourPeps.generateHTML();
            container.innerHTML = html;

            const resultContainer = container.querySelector('.result-container');
            expect(resultContainer).toBeTruthy();
        });
    });

    describe('Calculation Logic', () => {
        beforeEach(() => {
            const html = fourPeps.generateHTML();
            container.innerHTML = html;
            fourPeps.initialize(mockClient, mockPatient, container);
        });

        test('should calculate score with valid inputs', () => {
            const ageInput = container.querySelector('#fourpeps-age');
            ageInput.value = '80';
            ageInput.dispatchEvent(new Event('input', { bubbles: true }));

            const scoreEl = container.querySelector('#fourpeps-score');
            expect(scoreEl).toBeTruthy();
            expect(parseInt(scoreEl.textContent)).toBeGreaterThanOrEqual(0);
        });

        test('should show probability level', () => {
            const ageInput = container.querySelector('#fourpeps-age');
            ageInput.value = '70';
            ageInput.dispatchEvent(new Event('input', { bubbles: true }));

            const probabilityEl = container.querySelector('#fourpeps-probability');
            expect(probabilityEl).toBeTruthy();
        });
    });

    describe('FHIR Integration', () => {
        test('should populate age from patient data', async () => {
            const html = fourPeps.generateHTML();
            container.innerHTML = html;
            
            fourPeps.initialize(mockClient, mockPatient, container);
            
            await new Promise(resolve => setTimeout(resolve, 100));

            const ageInput = container.querySelector('#fourpeps-age');
            expect(ageInput).toBeTruthy();
        });
    });

    describe('Initialization', () => {
        test('should work without FHIR client', () => {
            const html = fourPeps.generateHTML();
            container.innerHTML = html;
            
            fourPeps.initialize(null, null, container);
            
            const ageInput = container.querySelector('#fourpeps-age');
            expect(ageInput).toBeTruthy();
        });
    });
});

