import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { helps2bScore } from '../../js/calculators/2helps2b/index.js';

describe('2HELPS2B Score Calculator', () => {
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
            expect(helps2bScore).toBeDefined();
            expect(helps2bScore.id).toBe('2helps2b');
            expect(helps2bScore.title).toBeDefined();
            expect(typeof helps2bScore.generateHTML).toBe('function');
            expect(typeof helps2bScore.initialize).toBe('function');
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

            const checkboxes = container.querySelectorAll('input[type="checkbox"]');
            expect(checkboxes.length).toBe(6);
        });
    });

    describe('Calculation Logic', () => {
        beforeEach(() => {
            const html = helps2bScore.generateHTML();
            container.innerHTML = html;
            helps2bScore.initialize(mockClient, null, container);
        });

        test('should calculate score correctly', () => {
            // Select 2 items: Frequency > 2Hz (1) + BIRDs (2) = 3 points
            const freqBox = container.querySelector('#freq-gt-2hz');
            const birdsBox = container.querySelector('#birds');
            
            freqBox.checked = true;
            birdsBox.checked = true;
            
            freqBox.dispatchEvent(new Event('change', { bubbles: true }));

            const scoreEl = container.querySelector('.ui-result-value');
            expect(scoreEl).toBeTruthy();
            const result = parseInt(scoreEl.textContent);
            expect(result).toBe(3);
            
            const riskEl = container.querySelectorAll('.ui-result-value')[1];
            expect(riskEl.textContent).toContain('50%'); // Score 3 = 50% risk
        });
    });

    describe('Initialization', () => {
        test('should work without FHIR client', () => {
            const html = helps2bScore.generateHTML();
            container.innerHTML = html;
            
            helps2bScore.initialize(null, null, container);
            
            const resultContainer = container.querySelector('#helps2b-result');
            expect(resultContainer).toBeTruthy();
        });
    });
});
