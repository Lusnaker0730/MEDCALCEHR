import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { cleanupDOM } from './test-helpers.js';
import { bacterialMeningitisScore } from '../../js/calculators/bacterial-meningitis-score/index.js';

describe('Bacterial Meningitis Score Calculator', () => {
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
            expect(bacterialMeningitisScore).toBeDefined();
            expect(typeof bacterialMeningitisScore.generateHTML).toBe('function');
            expect(typeof bacterialMeningitisScore.initialize).toBe('function');
        });

        test('should have correct calculator ID', () => {
            expect(bacterialMeningitisScore.id).toBe('bacterial-meningitis-score');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = bacterialMeningitisScore.generateHTML();
            expect(html).toBeDefined();
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include result container', () => {
            const html = bacterialMeningitisScore.generateHTML();
            container.innerHTML = html;

            const resultContainer = container.querySelector('#bms-result-box');
            expect(resultContainer).toBeTruthy();
        });
    });

    describe('FHIR Integration', () => {
        test('should work without FHIR client', () => {
            const html = bacterialMeningitisScore.generateHTML();
            container.innerHTML = html;

            expect(() => {
                bacterialMeningitisScore.initialize(null, null, container);
            }).not.toThrow();
        });
    });

    describe('Basic Functionality', () => {
        beforeEach(() => {
            const html = bacterialMeningitisScore.generateHTML();
            container.innerHTML = html;
            bacterialMeningitisScore.initialize(null, null, container);
        });

        test('should initialize without errors', () => {
            expect(container.innerHTML.length).toBeGreaterThan(0);
        });

        test('should have input fields', () => {
            const inputs = container.querySelectorAll('input');
            expect(inputs.length).toBeGreaterThan(0);
        });
    });
});
