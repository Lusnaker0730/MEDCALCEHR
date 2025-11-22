import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { fourAsDelirium } from '../../js/calculators/4as-delirium/index.js';

describe('4 A\'s Test for Delirium Screening', () => {
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
            expect(fourAsDelirium).toBeDefined();
            expect(fourAsDelirium.id).toBe('4as-delirium');
            expect(fourAsDelirium.title).toBeDefined();
            expect(typeof fourAsDelirium.generateHTML).toBe('function');
            expect(typeof fourAsDelirium.initialize).toBe('function');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = fourAsDelirium.generateHTML();
            expect(html).toBeDefined();
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include required input sections', () => {
            const html = fourAsDelirium.generateHTML();
            container.innerHTML = html;

            const alertnessInputs = container.querySelectorAll('input[name="alertness"]');
            const amt4Inputs = container.querySelectorAll('input[name="amt4"]');
            const attentionInputs = container.querySelectorAll('input[name="attention"]');
            const acuteInputs = container.querySelectorAll('input[name="acute_change"]');
            
            expect(alertnessInputs.length).toBeGreaterThan(0);
            expect(amt4Inputs.length).toBeGreaterThan(0);
            expect(attentionInputs.length).toBeGreaterThan(0);
            expect(acuteInputs.length).toBeGreaterThan(0);
        });

        test('should include result container', () => {
            const html = fourAsDelirium.generateHTML();
            container.innerHTML = html;

            const resultContainer = container.querySelector('#four-as-result');
            expect(resultContainer).toBeTruthy();
        });
    });

    describe('Calculation Logic', () => {
        beforeEach(() => {
            const html = fourAsDelirium.generateHTML();
            container.innerHTML = html;
            fourAsDelirium.initialize(mockClient, mockPatient, container);
        });

        test('should calculate score correctly with default values', () => {
            // Default selections should trigger calculation
            const resultValue = container.querySelector('.ui-result-value');
            expect(resultValue).toBeTruthy();
            expect(parseInt(resultValue.textContent)).toBeGreaterThanOrEqual(0);
        });

        test('should update score when inputs change', () => {
            const alertnessRadio = container.querySelector('input[name="alertness"][value="4"]');
            alertnessRadio.checked = true;
            alertnessRadio.dispatchEvent(new Event('change', { bubbles: true }));

            const resultValue = container.querySelector('.ui-result-value');
            expect(parseInt(resultValue.textContent)).toBeGreaterThanOrEqual(4);
        });

        test('should show appropriate interpretation', () => {
            const interpretationEl = container.querySelector('.ui-result-interpretation');
            expect(interpretationEl).toBeTruthy();
            expect(interpretationEl.textContent.length).toBeGreaterThan(0);
        });
    });

    describe('Initialization', () => {
        test('should work without FHIR client', () => {
            const html = fourAsDelirium.generateHTML();
            container.innerHTML = html;
            
            fourAsDelirium.initialize(null, null, container);
            
            const resultValue = container.querySelector('.ui-result-value');
            expect(resultValue).toBeTruthy();
        });
    });
});