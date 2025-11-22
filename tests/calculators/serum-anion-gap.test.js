import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { serumAnionGap } from '../../js/calculators/serum-anion-gap/index.js';

describe('Serum Anion Gap Calculator', () => {
    let container;
    let mockClient;

    beforeEach(() => {
        container = document.createElement('div');
        container.id = 'test-container';
        document.body.appendChild(container);
        mockClient = setupMockFHIRClient();
    });

    afterEach(() => {
        cleanupDOM();
    });

    describe('Module Structure', () => {
        test('should export calculator object with required properties', () => {
            expect(serumAnionGap).toBeDefined();
            expect(serumAnionGap.id).toBe('serum-anion-gap');
            expect(serumAnionGap.title).toBeDefined();
            expect(typeof serumAnionGap.generateHTML).toBe('function');
            expect(typeof serumAnionGap.initialize).toBe('function');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = serumAnionGap.generateHTML();
            expect(html).toBeDefined();
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include required input fields', () => {
            const html = serumAnionGap.generateHTML();
            container.innerHTML = html;

            const naInput = container.querySelector('#sag-na');
            const clInput = container.querySelector('#sag-cl');
            const hco3Input = container.querySelector('#sag-hco3');
            
            expect(naInput).toBeTruthy();
            expect(clInput).toBeTruthy();
            expect(hco3Input).toBeTruthy();
        });
    });

    describe('Calculation Logic', () => {
        beforeEach(() => {
            const html = serumAnionGap.generateHTML();
            container.innerHTML = html;
            serumAnionGap.initialize(mockClient, null, container);
        });

        test('should calculate anion gap correctly', () => {
            // Na 140, Cl 100, HCO3 24
            // Gap = 140 - (100 + 24) = 140 - 124 = 16
            
            const naInput = container.querySelector('#sag-na');
            const clInput = container.querySelector('#sag-cl');
            const hco3Input = container.querySelector('#sag-hco3');
            
            naInput.value = '140';
            clInput.value = '100';
            hco3Input.value = '24';
            
            naInput.dispatchEvent(new Event('input', { bubbles: true }));

            const scoreEl = container.querySelector('.ui-result-value');
            expect(scoreEl).toBeTruthy();
            const result = parseFloat(scoreEl.textContent);
            expect(result).toBeCloseTo(16.0, 1);
        });
    });

    describe('Initialization', () => {
        test('should work without FHIR client', () => {
            const html = serumAnionGap.generateHTML();
            container.innerHTML = html;
            
            serumAnionGap.initialize(null, null, container);
            
            const resultContainer = container.querySelector('#sag-result');
            expect(resultContainer).toBeTruthy();
        });
    });
});
