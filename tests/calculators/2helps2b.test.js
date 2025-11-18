import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { helps2bScore } from '../../js/calculators/2helps2b/index.js';

describe('2HELPS2B Score Calculator', () => {
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
            expect(helps2bScore).toBeDefined();
            expect(helps2bScore.id).toBe('2helps2b-score');
            expect(helps2bScore.title).toBeDefined();
            expect(typeof helps2bScore.generateHTML).toBe('function');
            expect(typeof helps2bScore.initialize).toBe('function');
        });

        test('should have correct calculator ID', () => {
            expect(helps2bScore.id).toBe('2helps2b-score');
        });

        test('should have descriptive title', () => {
            expect(helps2bScore.title).toBeTruthy();
            expect(helps2bScore.title.length).toBeGreaterThan(5);
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = helps2bScore.generateHTML();
            
            expect(html).toBeDefined();
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include required input fields', () => {
            const html = helps2bScore.generateHTML();
            container.innerHTML = html;

            const checkboxes = container.querySelectorAll('.checkbox-option input[type="checkbox"]');
            expect(checkboxes.length).toBe(6);
        });

        test('should include result container', () => {
            const html = helps2bScore.generateHTML();
            container.innerHTML = html;

            const resultContainer = container.querySelector('.result-container');
            expect(resultContainer).toBeTruthy();
        });

        test('should include score display elements', () => {
            const html = helps2bScore.generateHTML();
            container.innerHTML = html;

            const scoreEl = container.querySelector('#helps2b-score');
            const riskEl = container.querySelector('#helps2b-risk');
            const categoryEl = container.querySelector('#helps2b-category');
            
            expect(scoreEl).toBeTruthy();
            expect(riskEl).toBeTruthy();
            expect(categoryEl).toBeTruthy();
        });
    });

    describe('Calculation Logic', () => {
        beforeEach(() => {
            const html = helps2bScore.generateHTML();
            container.innerHTML = html;
            helps2bScore.initialize(mockClient, mockPatient, container);
        });

        test('should calculate score 0 with no checkboxes selected', () => {
            const scoreEl = container.querySelector('#helps2b-score');
            expect(scoreEl.textContent).toBe('0');
        });

        test('should calculate score correctly with single checkbox', () => {
            const checkboxes = container.querySelectorAll('.checkbox-option input[type="checkbox"]');
            checkboxes[0].checked = true;
            checkboxes[0].dispatchEvent(new Event('change', { bubbles: true }));

            const scoreEl = container.querySelector('#helps2b-score');
            expect(parseInt(scoreEl.textContent)).toBe(1);
        });

        test('should calculate score correctly with multiple checkboxes', () => {
            const checkboxes = container.querySelectorAll('.checkbox-option input[type="checkbox"]');
            // Select first 3 checkboxes (1+1+1 = 3 points)
            checkboxes[0].checked = true;
            checkboxes[1].checked = true;
            checkboxes[2].checked = true;
            checkboxes[0].dispatchEvent(new Event('change', { bubbles: true }));

            const scoreEl = container.querySelector('#helps2b-score');
            expect(parseInt(scoreEl.textContent)).toBe(3);
        });

        test('should calculate score with BIRDs checkbox (2 points)', () => {
            const checkboxes = container.querySelectorAll('.checkbox-option input[type="checkbox"]');
            // Last checkbox is BIRDs with 2 points
            checkboxes[5].checked = true;
            checkboxes[5].dispatchEvent(new Event('change', { bubbles: true }));

            const scoreEl = container.querySelector('#helps2b-score');
            expect(parseInt(scoreEl.textContent)).toBe(2);
        });

        test('should show correct risk category for score 0', () => {
            const categoryEl = container.querySelector('#helps2b-category');
            expect(categoryEl.textContent).toBe('Very Low');
        });

        test('should show correct risk category for score 2', () => {
            const checkboxes = container.querySelectorAll('.checkbox-option input[type="checkbox"]');
            checkboxes[0].checked = true;
            checkboxes[1].checked = true;
            checkboxes[0].dispatchEvent(new Event('change', { bubbles: true }));

            const categoryEl = container.querySelector('#helps2b-category');
            expect(categoryEl.textContent).toBe('Moderate');
        });

        test('should show correct risk category for high score', () => {
            const checkboxes = container.querySelectorAll('.checkbox-option input[type="checkbox"]');
            // Select all checkboxes for maximum score
            checkboxes.forEach(cb => {
                cb.checked = true;
            });
            checkboxes[0].dispatchEvent(new Event('change', { bubbles: true }));

            const categoryEl = container.querySelector('#helps2b-category');
            expect(categoryEl.textContent).toBe('Extremely High');
        });

        test('should add selected class to checked items', () => {
            const checkbox = container.querySelector('.checkbox-option input[type="checkbox"]');
            const parent = checkbox.closest('.checkbox-option');
            
            checkbox.checked = true;
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));

            expect(parent.classList.contains('selected')).toBe(true);
        });

        test('should remove selected class when unchecked', () => {
            const checkbox = container.querySelector('.checkbox-option input[type="checkbox"]');
            const parent = checkbox.closest('.checkbox-option');
            
            checkbox.checked = true;
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
            checkbox.checked = false;
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));

            expect(parent.classList.contains('selected')).toBe(false);
        });
    });

    describe('Risk Display', () => {
        beforeEach(() => {
            const html = helps2bScore.generateHTML();
            container.innerHTML = html;
            helps2bScore.initialize(mockClient, mockPatient, container);
        });

        test('should display correct risk percentage for each score level', () => {
            const riskEl = container.querySelector('#helps2b-risk');
            const checkboxes = container.querySelectorAll('.checkbox-option input[type="checkbox"]');

            // Test score 0
            expect(riskEl.textContent).toBe('< 5%');

            // Test score 1
            checkboxes[0].checked = true;
            checkboxes[0].dispatchEvent(new Event('change', { bubbles: true }));
            expect(riskEl.textContent).toBe('12%');
        });

        test('should apply correct risk level CSS class', () => {
            const categoryEl = container.querySelector('#helps2b-category');
            const checkboxes = container.querySelectorAll('.checkbox-option input[type="checkbox"]');

            // High score should have high risk class
            checkboxes[0].checked = true;
            checkboxes[1].checked = true;
            checkboxes[2].checked = true;
            checkboxes[3].checked = true;
            checkboxes[0].dispatchEvent(new Event('change', { bubbles: true }));

            expect(categoryEl.classList.contains('risk-high')).toBe(true);
        });
    });

    describe('Initialization', () => {
        test('should work without FHIR client', () => {
            const html = helps2bScore.generateHTML();
            container.innerHTML = html;
            
            helps2bScore.initialize(null, null, container);
            
            const scoreEl = container.querySelector('#helps2b-score');
            expect(scoreEl.textContent).toBe('0');
        });

        test('should show result container', () => {
            const html = helps2bScore.generateHTML();
            container.innerHTML = html;
            helps2bScore.initialize(mockClient, mockPatient, container);

            const resultContainer = container.querySelector('.result-container');
            expect(resultContainer.classList.contains('show')).toBe(true);
        });
    });
});

