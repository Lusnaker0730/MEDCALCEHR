import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { cleanupDOM } from './test-helpers.js';
import { apgarScore } from '../../js/calculators/apgar/index.js';

describe('Apgar Calculator', () => {
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
        test('should export calculator object', () => {
            expect(apgarScore).toBeDefined();
            expect(typeof apgarScore.generateHTML).toBe('function');
            expect(typeof apgarScore.initialize).toBe('function');
        });

        test('should have correct calculator ID', () => {
            expect(apgarScore.id).toBe('apgar');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = apgarScore.generateHTML();
            expect(html).toBeDefined();
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include result container', () => {
            const html = apgarScore.generateHTML();
            container.innerHTML = html;

            const resultContainer = container.querySelector('.ui-result-box');
            expect(resultContainer).toBeTruthy();
        });
    });

    describe('FHIR Integration', () => {
        test('should work without FHIR client', () => {
            const html = apgarScore.generateHTML();
            container.innerHTML = html;

            expect(() => {
                apgarScore.initialize(null, null, container);
            }).not.toThrow();
        });
    });

    describe('Basic Functionality', () => {
        beforeEach(() => {
            const html = apgarScore.generateHTML();
            container.innerHTML = html;
            apgarScore.initialize(null, null, container);
        });

        test('should initialize without errors', () => {
            expect(container.innerHTML.length).toBeGreaterThan(0);
        });

        test('should have input fields', () => {
            const inputs = container.querySelectorAll('input');
            expect(inputs.length).toBeGreaterThan(0);
        });
        
        test('should calculate score', () => {
            // Select all '2' options (Total 10)
            const sections = ['appearance', 'pulse', 'grimace', 'activity', 'respiration'];
            sections.forEach(section => {
                const radio = container.querySelector(`input[name="apgar-${section}"][value="2"]`);
                if (radio) {
                    radio.checked = true;
                    radio.dispatchEvent(new Event('change', { bubbles: true }));
                }
            });
            
            const resultValue = container.querySelector('.ui-result-value');
            expect(resultValue).toBeTruthy();
            expect(resultValue.textContent).toContain('10');
        });
    });
});