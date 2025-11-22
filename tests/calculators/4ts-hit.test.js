import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { hepScore } from '../../js/calculators/4ts-hit/index.js';

describe('HEP Score (4Ts HIT) Calculator', () => {
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
            expect(hepScore).toBeDefined();
            expect(hepScore.id).toBe('4ts-hit');
            expect(hepScore.title).toBeDefined();
            expect(typeof hepScore.generateHTML).toBe('function');
            expect(typeof hepScore.initialize).toBe('function');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = hepScore.generateHTML();
            expect(html).toBeDefined();
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include onset type selector', () => {
            const html = hepScore.generateHTML();
            container.innerHTML = html;

            const onsetRadios = container.querySelectorAll('input[name="hit_onset_type"]');
            expect(onsetRadios.length).toBe(2);
        });
    });

    describe('Calculation Logic', () => {
        beforeEach(() => {
            const html = hepScore.generateHTML();
            container.innerHTML = html;
            hepScore.initialize(mockClient, null, container);
        });

        test('should render criteria for typical onset by default', () => {
            const timingGroup = container.querySelector('input[name="timing_typical"]');
            expect(timingGroup).toBeTruthy();
            
            const timingRapidGroup = container.querySelector('input[name="timing_rapid"]');
            expect(timingRapidGroup).toBeFalsy();
        });

        test('should calculate score correctly (High Probability)', () => {
            // Typical onset
            // Platelet fall >50% (+3)
            // Fall 5-10 days (+3)
            // Nadir >= 20 (+2)
            // No thrombosis (0) - others 0 by default
            
            const fallMagRadio = container.querySelector('input[name="platelet_fall_magnitude"][value="3"]');
            const timingRadio = container.querySelector('input[name="timing_typical"][value="3"]');
            const nadirRadio = container.querySelector('input[name="nadir_platelet"][value="2"]');
            
            if (fallMagRadio) {
                fallMagRadio.checked = true;
                fallMagRadio.dispatchEvent(new Event('change', { bubbles: true }));
            }
            if (timingRadio) {
                timingRadio.checked = true;
                timingRadio.dispatchEvent(new Event('change', { bubbles: true }));
            }
            if (nadirRadio) {
                nadirRadio.checked = true;
                nadirRadio.dispatchEvent(new Event('change', { bubbles: true }));
            }

            const scoreEl = container.querySelector('.ui-result-value');
            expect(scoreEl).toBeTruthy();
            const score = parseInt(scoreEl.textContent);
            // 3 + 3 + 2 = 8
            expect(score).toBe(8);
            
            const interpretationEl = container.querySelector('.ui-result-interpretation');
            expect(interpretationEl.textContent).toContain('High');
        });
    });

    describe('Initialization', () => {
        test('should work without FHIR client', () => {
            const html = hepScore.generateHTML();
            container.innerHTML = html;
            
            hepScore.initialize(null, null, container);
            
            const resultContainer = container.querySelector('#hep-score-result');
            expect(resultContainer).toBeTruthy();
        });
    });
});
