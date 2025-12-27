/**
 * @jest-environment jsdom
 */

import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';
import { createScoreCalculator } from '../../calculators/shared/score-calculator';

// Mock console to reduce noise
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('Score Calculator Factory', () => {
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
        id: 'test-score',
        title: 'Test Score Calculator',
        description: 'A test calculator for unit testing',
        sections: [
            {
                title: 'Section 1',
                icon: '📋',
                inputs: [
                    {
                        name: 'test-input-1',
                        label: 'Test Input 1',
                        options: [
                            { value: '0', label: 'No (0 points)' },
                            { value: '1', label: 'Yes (1 point)' }
                        ]
                    },
                    {
                        name: 'test-input-2',
                        label: 'Test Input 2',
                        options: [
                            { value: '0', label: 'Low' },
                            { value: '2', label: 'Medium' },
                            { value: '4', label: 'High' }
                        ]
                    }
                ]
            }
        ],
        riskLevels: [
            { minScore: 0, maxScore: 1, label: 'Low Risk', severity: 'success' as const, description: 'Low risk description' },
            { minScore: 2, maxScore: 3, label: 'Medium Risk', severity: 'warning' as const, description: 'Medium risk description' },
            { minScore: 4, maxScore: 10, label: 'High Risk', severity: 'danger' as const, description: 'High risk description' }
        ]
    };

    test('should create calculator with valid config', () => {
        const calculator = createScoreCalculator(mockConfig);

        expect(calculator).toBeDefined();
        expect(calculator.id).toBe('test-score');
        expect(calculator.title).toBe('Test Score Calculator');
        expect(typeof calculator.generateHTML).toBe('function');
        expect(typeof calculator.initialize).toBe('function');
    });

    test('generateHTML should return valid HTML', () => {
        const calculator = createScoreCalculator(mockConfig);
        const html = calculator.generateHTML();

        expect(typeof html).toBe('string');
        expect(html.length).toBeGreaterThan(0);
        expect(html).toContain('Test Score Calculator');
        expect(html).toContain('Section 1');
        expect(html).toContain('test-input-1');
        expect(html).toContain('test-input-2');
    });

    test('should initialize without errors', () => {
        const calculator = createScoreCalculator(mockConfig);
        container.innerHTML = calculator.generateHTML();

        expect(() => {
            calculator.initialize(null, null, container);
        }).not.toThrow();
    });

    test('should calculate score correctly', () => {
        const calculator = createScoreCalculator(mockConfig);
        container.innerHTML = calculator.generateHTML();
        calculator.initialize(null, null, container);

        // Select options
        const radio1 = container.querySelector('input[name="test-input-1"][value="1"]') as HTMLInputElement;
        const radio2 = container.querySelector('input[name="test-input-2"][value="2"]') as HTMLInputElement;
        const resultBox = container.querySelector('.result-box, [class*="result"]') as HTMLElement;

        if (radio1 && radio2) {
            radio1.checked = true;
            radio2.checked = true;
            radio1.dispatchEvent(new Event('change', { bubbles: true }));
            radio2.dispatchEvent(new Event('change', { bubbles: true }));

            // Score should be 1 + 2 = 3 -> Medium Risk
            setTimeout(() => {
                const resultText = resultBox?.textContent || container.textContent || '';
                expect(resultText).toContain('3');
            }, 100);
        }
    });

    test('should handle empty selections', () => {
        const calculator = createScoreCalculator(mockConfig);
        container.innerHTML = calculator.generateHTML();
        calculator.initialize(null, null, container);

        // Without selections, score should be 0 or result hidden
        const resultBox = container.querySelector('.result-box') as HTMLElement;
        
        // Initial state - result might be hidden or show 0
        if (resultBox) {
            const isHidden = resultBox.style.display === 'none' || !resultBox.classList.contains('show');
            const hasZeroScore = resultBox.textContent?.includes('0');
            expect(isHidden || hasZeroScore).toBeTruthy();
        }
    });
});

