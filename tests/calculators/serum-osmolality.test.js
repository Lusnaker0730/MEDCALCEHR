import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { serumOsmolality } from '../../js/calculators/serum-osmolality/index.js';

describe('Serum Osmolality Calculator', () => {
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
            expect(serumOsmolality).toBeDefined();
            expect(serumOsmolality.id).toBe('serum-osmolality');
            expect(serumOsmolality.title).toBeDefined();
            expect(typeof serumOsmolality.generateHTML).toBe('function');
            expect(typeof serumOsmolality.initialize).toBe('function');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = serumOsmolality.generateHTML();
            expect(html).toBeDefined();
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include required input fields', () => {
            const html = serumOsmolality.generateHTML();
            container.innerHTML = html;

            const naInput = container.querySelector('#osmo-na');
            const glucoseInput = container.querySelector('#osmo-glucose');
            const bunInput = container.querySelector('#osmo-bun');
            const ethanolInput = container.querySelector('#osmo-ethanol');
            
            expect(naInput).toBeTruthy();
            expect(glucoseInput).toBeTruthy();
            expect(bunInput).toBeTruthy();
            expect(ethanolInput).toBeTruthy();
        });
    });

    describe('Calculation Logic', () => {
        beforeEach(() => {
            const html = serumOsmolality.generateHTML();
            container.innerHTML = html;
            serumOsmolality.initialize(mockClient, null, container);
        });

        test('should calculate osmolality correctly', () => {
            // Na 140, Glucose 90, BUN 14
            // Calc = 2*140 + 90/18 + 14/2.8
            // = 280 + 5 + 5 = 290
            
            const naInput = container.querySelector('#osmo-na');
            const glucoseInput = container.querySelector('#osmo-glucose');
            const bunInput = container.querySelector('#osmo-bun');
            
            naInput.value = '140';
            glucoseInput.value = '90';
            bunInput.value = '14';
            
            naInput.dispatchEvent(new Event('input', { bubbles: true }));

            const scoreEl = container.querySelector('.ui-result-value');
            expect(scoreEl).toBeTruthy();
            const result = parseFloat(scoreEl.textContent);
            expect(result).toBeCloseTo(290.0, 1);
        });

        test('should calculate osmolality with ethanol', () => {
            // Na 140, Glucose 90, BUN 14, Ethanol 46
            // Calc = 290 + 46/4.6 = 290 + 10 = 300
            
            const naInput = container.querySelector('#osmo-na');
            const glucoseInput = container.querySelector('#osmo-glucose');
            const bunInput = container.querySelector('#osmo-bun');
            const ethanolInput = container.querySelector('#osmo-ethanol');
            
            naInput.value = '140';
            glucoseInput.value = '90';
            bunInput.value = '14';
            ethanolInput.value = '46';
            
            ethanolInput.dispatchEvent(new Event('input', { bubbles: true }));

            const scoreEl = container.querySelector('.ui-result-value');
            expect(scoreEl).toBeTruthy();
            const result = parseFloat(scoreEl.textContent);
            expect(result).toBeCloseTo(300.0, 1);
        });
    });

    describe('Initialization', () => {
        test('should work without FHIR client', () => {
            const html = serumOsmolality.generateHTML();
            container.innerHTML = html;
            
            serumOsmolality.initialize(null, null, container);
            
            const resultContainer = container.querySelector('#osmolality-result');
            expect(resultContainer).toBeTruthy();
        });
    });
});
