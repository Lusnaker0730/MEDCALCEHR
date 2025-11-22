import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { abgAnalyzer } from '../../js/calculators/abg-analyzer/index.js';

describe('ABG Analyzer', () => {
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
            expect(abgAnalyzer).toBeDefined();
            expect(abgAnalyzer.id).toBe('abg-analyzer');
            expect(abgAnalyzer.title).toBeDefined();
            expect(typeof abgAnalyzer.generateHTML).toBe('function');
            expect(typeof abgAnalyzer.initialize).toBe('function');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = abgAnalyzer.generateHTML();
            expect(html).toBeDefined();
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include required input fields', () => {
            const html = abgAnalyzer.generateHTML();
            container.innerHTML = html;

            expect(container.querySelector('#abg-ph')).toBeTruthy();
            expect(container.querySelector('#abg-pco2')).toBeTruthy();
            expect(container.querySelector('#abg-hco3')).toBeTruthy();
            expect(container.querySelector('#abg-sodium')).toBeTruthy();
            expect(container.querySelector('#abg-chloride')).toBeTruthy();
            expect(container.querySelector('#abg-albumin')).toBeTruthy();
        });
    });

    describe('Interpretation Logic', () => {
        beforeEach(() => {
            const html = abgAnalyzer.generateHTML();
            container.innerHTML = html;
            abgAnalyzer.initialize(mockClient, null, container);
        });

        test('should identify Metabolic Acidosis', () => {
            const ph = container.querySelector('#abg-ph');
            const pco2 = container.querySelector('#abg-pco2');
            const hco3 = container.querySelector('#abg-hco3');
            
            ph.value = '7.20';
            pco2.value = '30';
            hco3.value = '12';
            
            ph.dispatchEvent(new Event('input', { bubbles: true }));

            const resultEl = container.querySelector('.ui-result-value');
            expect(resultEl).toBeTruthy();
            expect(resultEl.textContent).toContain('Metabolic Acidosis');
        });

        test('should identify Respiratory Acidosis', () => {
            const ph = container.querySelector('#abg-ph');
            const pco2 = container.querySelector('#abg-pco2');
            const hco3 = container.querySelector('#abg-hco3');
            
            ph.value = '7.25';
            pco2.value = '60';
            hco3.value = '26';
            
            ph.dispatchEvent(new Event('input', { bubbles: true }));

            const resultEl = container.querySelector('.ui-result-value');
            expect(resultEl.textContent).toContain('Respiratory Acidosis');
        });
        
        test('should calculate Anion Gap if electrolytes provided', () => {
            const ph = container.querySelector('#abg-ph');
            const pco2 = container.querySelector('#abg-pco2');
            const hco3 = container.querySelector('#abg-hco3');
            const na = container.querySelector('#abg-sodium');
            const cl = container.querySelector('#abg-chloride');
            
            // Set required fields
            ph.value = '7.2';
            pco2.value = '30';
            hco3.value = '12';
            
            // Set electrolytes
            na.value = '140';
            cl.value = '100';
            
            // Dispatch events on ALL inputs
            [ph, pco2, hco3, na, cl].forEach(input => {
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            });

            const resultContainer = container.querySelector('#abg-result');
            expect(resultContainer.classList.contains('show')).toBe(true);

            // Check full text content of result box
            const fullText = resultContainer.textContent;
            
            expect(fullText).toContain('Anion Gap');
            expect(fullText).toContain('28.0');
        });
    });

    describe('Initialization', () => {
        test('should work without FHIR client', () => {
            const html = abgAnalyzer.generateHTML();
            container.innerHTML = html;
            
            abgAnalyzer.initialize(null, null, container);
            
            const resultContainer = container.querySelector('#abg-result');
            expect(resultContainer).toBeTruthy();
        });
    });
});
