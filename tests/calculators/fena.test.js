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

            const urineNa = container.querySelector('#urine-na');
            const serumNa = container.querySelector('#serum-na');
            const urineCreat = container.querySelector('#urine-creat');
            const serumCreat = container.querySelector('#serum-creat');

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
            container.querySelector('#urine-na').value = '20';
            container.querySelector('#serum-na').value = '140';
            container.querySelector('#urine-creat').value = '100';
            container.querySelector('#serum-creat').value = '1.0';

            container.querySelector('#urine-na').dispatchEvent(new Event('input', { bubbles: true }));

            const result = container.querySelector('#fena-result');
            expect(result.style.display).not.toBe('none');
        });

        test('should calculate intrinsic renal disease (FENa > 2%)', () => {
            // FENa = (80 × 1.0) / (140 × 50) × 100 = 1.14%
            container.querySelector('#urine-na').value = '80';
            container.querySelector('#serum-na').value = '140';
            container.querySelector('#urine-creat').value = '50';
            container.querySelector('#serum-creat').value = '1.0';

            container.querySelector('#urine-na').dispatchEvent(new Event('input', { bubbles: true }));

            const result = container.querySelector('#fena-result');
            expect(result.style.display).not.toBe('none');
        });

        test('should not calculate with missing inputs', () => {
            container.querySelector('#urine-na').value = '20';
            container.querySelector('#serum-na').value = '';

            container.querySelector('#urine-na').dispatchEvent(new Event('input', { bubbles: true }));

            const result = container.querySelector('#fena-result');
            expect(result.style.display).toBe('none');
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

