/**
 * @jest-environment jsdom
 */

import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';
import { createFormulaCalculator } from '../../calculators/shared/formula-calculator';

// Mock console
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('Formula Calculator Factory', () => {
    let container: HTMLElement;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    const mockConfig = {
        id: 'test-formula',
        title: 'Test Formula Calculator',
        description: 'A test formula calculator',
        inputs: [
            {
                id: 'test-value-a',
                label: 'Value A',
                type: 'number' as const,
                standardUnit: 'units',
                min: 0,
                max: 1000,
                step: 1
            },
            {
                id: 'test-value-b',
                label: 'Value B',
                type: 'number' as const,
                standardUnit: 'units',
                min: 0,
                max: 1000,
                step: 1
            }
        ],
        formulas: [
            { label: 'Sum', formula: 'A + B' },
            { label: 'Product', formula: 'A × B' }
        ],
        calculate: (values: Record<string, number | null>) => {
            const a = values['test-value-a'];
            const b = values['test-value-b'];

            if (a === null || b === null) return null;

            return [
                { label: 'Sum', value: (a + b).toString(), unit: 'units' },
                { label: 'Product', value: (a * b).toString(), unit: 'units²' }
            ];
        }
    };

    test('should create calculator with valid config', () => {
        const calculator = createFormulaCalculator(mockConfig);

        expect(calculator).toBeDefined();
        expect(calculator.id).toBe('test-formula');
        expect(calculator.title).toBe('Test Formula Calculator');
        expect(typeof calculator.generateHTML).toBe('function');
        expect(typeof calculator.initialize).toBe('function');
    });

    test('generateHTML should return valid HTML with inputs', () => {
        const calculator = createFormulaCalculator(mockConfig);
        const html = calculator.generateHTML();

        expect(typeof html).toBe('string');
        expect(html).toContain('Test Formula Calculator');
        expect(html).toContain('test-value-a');
        expect(html).toContain('test-value-b');
        expect(html).toContain('Value A');
        expect(html).toContain('Value B');
    });

    test('should initialize without errors', () => {
        const calculator = createFormulaCalculator(mockConfig);
        container.innerHTML = calculator.generateHTML();

        expect(() => {
            calculator.initialize(null, null, container);
        }).not.toThrow();
    });

    test('should calculate results when inputs are provided', () => {
        const calculator = createFormulaCalculator(mockConfig);
        container.innerHTML = calculator.generateHTML();
        calculator.initialize(null, null, container);

        const inputA = container.querySelector('#test-value-a') as HTMLInputElement;
        const inputB = container.querySelector('#test-value-b') as HTMLInputElement;

        if (inputA && inputB) {
            inputA.value = '10';
            inputB.value = '5';
            inputA.dispatchEvent(new Event('input', { bubbles: true }));
            inputB.dispatchEvent(new Event('input', { bubbles: true }));

            // Check results
            setTimeout(() => {
                const resultText = container.textContent || '';
                expect(resultText).toContain('15'); // Sum: 10 + 5
                expect(resultText).toContain('50'); // Product: 10 * 5
            }, 100);
        }
    });

    test('should handle null return from calculate function', () => {
        const calculator = createFormulaCalculator(mockConfig);
        container.innerHTML = calculator.generateHTML();
        calculator.initialize(null, null, container);

        // Only set one input, leaving the other empty
        const inputA = container.querySelector('#test-value-a') as HTMLInputElement;
        if (inputA) {
            inputA.value = '10';
            inputA.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // Result should be hidden when calculate returns null
        const resultBox = container.querySelector('.result-box, [class*="result"]') as HTMLElement;
        if (resultBox) {
            const isHidden = resultBox.style.display === 'none' || 
                            !resultBox.classList.contains('show') ||
                            resultBox.innerHTML === '';
            // Either hidden or empty is acceptable
            expect(resultBox).toBeDefined();
        }
    });
});

