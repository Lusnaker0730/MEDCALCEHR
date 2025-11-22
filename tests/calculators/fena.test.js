import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { cleanupDOM } from './test-helpers.js';
import { fena } from '../../js/calculators/fena/index.js';

describe('FENa (Fractional Excretion of Sodium) Calculator', () => {
    let container;

    beforeEach(() => {
        container = document.createElement('div');
        container.id = 'test-container';
        document.body.appendChild(container);
    });

    afterEach(() => {
        cleanupDOM();
    });

    describe('Module Structure', () => {
        test('should export calculator object with required properties', () => {
            expect(fena).toBeDefined();
            expect(fena.id).toBe('fena');
            expect(fena.title).toBe('Fractional Excretion of Sodium (FENa)');
            expect(typeof fena.generateHTML).toBe('function');
            expect(typeof fena.initialize).toBe('function');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = fena.generateHTML();
            expect(html).toBeDefined();
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include required input fields', () => {
            const html = fena.generateHTML();
            container.innerHTML = html;

            const urineNa = container.querySelector('#fena-urine-na');
            const serumNa = container.querySelector('#fena-serum-na');
            const urineCreat = container.querySelector('#fena-urine-creat');
            const serumCreat = container.querySelector('#fena-serum-creat');

            expect(urineNa).toBeTruthy();
            expect(serumNa).toBeTruthy();
            expect(urineCreat).toBeTruthy();
            expect(serumCreat).toBeTruthy();
        });

        test('should include result container', () => {
            const html = fena.generateHTML();
            container.innerHTML = html;

            const resultContainer = container.querySelector('#fena-result');
            expect(resultContainer).toBeTruthy();
        });
    });

    describe('Calculation Logic', () => {
        beforeEach(() => {
            const html = fena.generateHTML();
            container.innerHTML = html;
            fena.initialize(null, null, container);
        });

        test('should calculate prerenal AKI (FENa < 1%)', () => {
            // FENa = (20 × 1.0) / (140 × 100) × 100 = 0.14%
            const urineNa = container.querySelector('#fena-urine-na');
            const serumNa = container.querySelector('#fena-serum-na');
            const urineCreat = container.querySelector('#fena-urine-creat');
            const serumCreat = container.querySelector('#fena-serum-creat');

            urineNa.value = '20';
            serumNa.value = '140';
            urineCreat.value = '100';
            serumCreat.value = '1.0';

            urineNa.dispatchEvent(new Event('input', { bubbles: true }));

            const result = container.querySelector('#fena-result');
            expect(result.classList.contains('show')).toBe(true);
            
            const resultValue = container.querySelector('.ui-result-value');
            expect(resultValue.textContent).toContain('0.14');
            
            const interpretation = container.querySelector('.ui-result-interpretation');
            expect(interpretation.textContent).toContain('Prerenal');
        });

        test('should calculate intrinsic renal disease (FENa > 2%)', () => {
            // FENa = (80 × 1.0) / (140 × 50) × 100 = 1.14% -> Wait, (80 * 1) / (140 * 50) = 80 / 7000 = 0.0114 * 100 = 1.14% (Indeterminate)
            // Let's use values for > 2%
            // UNa = 100, SNa = 140, UCr = 20, SCr = 1.0 -> (100*1)/(140*20) = 100/2800 = 0.0357 * 100 = 3.57%
            
            const urineNa = container.querySelector('#fena-urine-na');
            const serumNa = container.querySelector('#fena-serum-na');
            const urineCreat = container.querySelector('#fena-urine-creat');
            const serumCreat = container.querySelector('#fena-serum-creat');

            urineNa.value = '100';
            serumNa.value = '140';
            urineCreat.value = '20';
            serumCreat.value = '1.0';

            urineNa.dispatchEvent(new Event('input', { bubbles: true }));

            const result = container.querySelector('#fena-result');
            expect(result.classList.contains('show')).toBe(true);
            
            const resultValue = container.querySelector('.ui-result-value');
            expect(parseFloat(resultValue.textContent)).toBeGreaterThan(2);
            
            const interpretation = container.querySelector('.ui-result-interpretation');
            expect(interpretation.textContent).toContain('Intrinsic');
        });

        test('should not calculate with missing inputs', () => {
            container.querySelector('#fena-urine-na').value = '20';
            container.querySelector('#fena-serum-na').value = '';

            container.querySelector('#fena-urine-na').dispatchEvent(new Event('input', { bubbles: true }));

            const result = container.querySelector('#fena-result');
            expect(result.classList.contains('show')).toBe(false);
        });
    });

    describe('FHIR Integration', () => {
        test('should work without FHIR client', () => {
            const html = fena.generateHTML();
            container.innerHTML = html;

            expect(() => {
                fena.initialize(null, null, container);
            }).not.toThrow();
        });
    });
});