import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { setupMockFHIRClient, mockPatientData, cleanupDOM } from './test-helpers.js';
import { map } from '../../js/calculators/map/index.js';

describe('MAP (Mean Arterial Pressure) Calculator', () => {
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
            expect(map).toBeDefined();
            expect(map.id).toBe('map');
            expect(map.title).toBe('Mean Arterial Pressure (MAP)');
            expect(typeof map.generateHTML).toBe('function');
            expect(typeof map.initialize).toBe('function');
        });
    });

    describe('HTML Generation', () => {
        test('should generate valid HTML', () => {
            const html = map.generateHTML();
            expect(html).toBeDefined();
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
        });

        test('should include required input fields', () => {
            const html = map.generateHTML();
            container.innerHTML = html;

            const sbpInput = container.querySelector('#map-sbp');
            const dbpInput = container.querySelector('#map-dbp');

            expect(sbpInput).toBeTruthy();
            expect(dbpInput).toBeTruthy();
        });

        test('should include result container', () => {
            const html = map.generateHTML();
            container.innerHTML = html;

            const resultContainer = container.querySelector('#map-result');
            expect(resultContainer).toBeTruthy();
        });
    });

    describe('Calculation Logic', () => {
        beforeEach(() => {
            const html = map.generateHTML();
            container.innerHTML = html;
            map.initialize(null, null, container);
        });

        test('should calculate correctly with normal BP (120/80)', () => {
            const sbpInput = container.querySelector('#map-sbp');
            const dbpInput = container.querySelector('#map-dbp');

            sbpInput.value = '120';
            dbpInput.value = '80';
            sbpInput.dispatchEvent(new Event('input', { bubbles: true }));

            const result = container.querySelector('#map-result');
            expect(result.style.display).not.toBe('none');
            
            const mapValue = container.querySelector('.result-score-value');
            expect(mapValue.textContent).toBe('93.3'); // (120 + 2*80) / 3 = 93.3
        });

        test('should calculate correctly with elevated BP (160/90)', () => {
            const sbpInput = container.querySelector('#map-sbp');
            const dbpInput = container.querySelector('#map-dbp');

            sbpInput.value = '160';
            dbpInput.value = '90';
            sbpInput.dispatchEvent(new Event('input', { bubbles: true }));

            const mapValue = container.querySelector('.result-score-value');
            expect(mapValue.textContent).toBe('113.3'); // (160 + 2*90) / 3 = 113.3
        });

        test('should calculate correctly with low BP (100/60)', () => {
            const sbpInput = container.querySelector('#map-sbp');
            const dbpInput = container.querySelector('#map-dbp');

            sbpInput.value = '100';
            dbpInput.value = '60';
            sbpInput.dispatchEvent(new Event('input', { bubbles: true }));

            const mapValue = container.querySelector('.result-score-value');
            expect(mapValue.textContent).toBe('73.3'); // (100 + 2*60) / 3 = 73.3
        });

        test('should show error when SBP < DBP', () => {
            const sbpInput = container.querySelector('#map-sbp');
            const dbpInput = container.querySelector('#map-dbp');

            sbpInput.value = '80';
            dbpInput.value = '120';
            sbpInput.dispatchEvent(new Event('input', { bubbles: true }));

            const result = container.querySelector('#map-result');
            expect(result.innerHTML).toContain('Error');
            expect(result.innerHTML).toContain('Systolic BP must be ≥ Diastolic BP');
        });

        test('should not calculate with missing inputs', () => {
            const sbpInput = container.querySelector('#map-sbp');
            const dbpInput = container.querySelector('#map-dbp');

            sbpInput.value = '120';
            dbpInput.value = '';
            sbpInput.dispatchEvent(new Event('input', { bubbles: true }));

            const result = container.querySelector('#map-result');
            expect(result.style.display).toBe('none');
        });

        test('should not calculate with negative values', () => {
            const sbpInput = container.querySelector('#map-sbp');
            const dbpInput = container.querySelector('#map-dbp');

            sbpInput.value = '-120';
            dbpInput.value = '80';
            sbpInput.dispatchEvent(new Event('input', { bubbles: true }));

            const result = container.querySelector('#map-result');
            expect(result.style.display).toBe('none');
        });
    });

    describe('Clinical Interpretation', () => {
        beforeEach(() => {
            const html = map.generateHTML();
            container.innerHTML = html;
            map.initialize(null, null, container);
        });

        test('should indicate critically low MAP (<60)', () => {
            const sbpInput = container.querySelector('#map-sbp');
            const dbpInput = container.querySelector('#map-dbp');

            sbpInput.value = '90';
            dbpInput.value = '40';
            sbpInput.dispatchEvent(new Event('input', { bubbles: true }));

            // MAP = 40 + (90-40)/3 = 56.7
            const severityIndicator = container.querySelector('.severity-indicator');
            expect(severityIndicator).toBeTruthy();
            expect(severityIndicator.classList.contains('high')).toBe(true);
            expect(severityIndicator.textContent).toContain('Critically Low');
        });

        test('should indicate normal MAP (70-100)', () => {
            const sbpInput = container.querySelector('#map-sbp');
            const dbpInput = container.querySelector('#map-dbp');

            sbpInput.value = '120';
            dbpInput.value = '80';
            sbpInput.dispatchEvent(new Event('input', { bubbles: true }));

            const severityIndicator = container.querySelector('.severity-indicator');
            expect(severityIndicator).toBeTruthy();
            expect(severityIndicator.classList.contains('low')).toBe(true);
            expect(severityIndicator.textContent).toContain('Normal');
        });

        test('should indicate elevated MAP (>100)', () => {
            const sbpInput = container.querySelector('#map-sbp');
            const dbpInput = container.querySelector('#map-dbp');

            sbpInput.value = '180';
            dbpInput.value = '100';
            sbpInput.dispatchEvent(new Event('input', { bubbles: true }));

            // MAP = 100 + (180-100)/3 = 126.7
            const severityIndicator = container.querySelector('.severity-indicator');
            expect(severityIndicator).toBeTruthy();
            expect(severityIndicator.classList.contains('high')).toBe(true);
            expect(severityIndicator.textContent).toContain('Elevated');
        });
    });

    describe('FHIR Integration', () => {
        test('should work without FHIR client', () => {
            const html = map.generateHTML();
            container.innerHTML = html;

            expect(() => {
                map.initialize(null, null, container);
            }).not.toThrow();

            const sbpInput = container.querySelector('#map-sbp');
            const dbpInput = container.querySelector('#map-dbp');
            expect(sbpInput).toBeTruthy();
            expect(dbpInput).toBeTruthy();
        });
    });

    describe('User Interaction', () => {
        beforeEach(() => {
            const html = map.generateHTML();
            container.innerHTML = html;
            map.initialize(null, null, container);
        });

        test('should update result on SBP input change', () => {
            const sbpInput = container.querySelector('#map-sbp');
            const dbpInput = container.querySelector('#map-dbp');

            dbpInput.value = '80';
            sbpInput.value = '120';
            sbpInput.dispatchEvent(new Event('input', { bubbles: true }));

            const result = container.querySelector('#map-result');
            expect(result.style.display).not.toBe('none');
        });

        test('should update result on DBP input change', () => {
            const sbpInput = container.querySelector('#map-sbp');
            const dbpInput = container.querySelector('#map-dbp');

            sbpInput.value = '120';
            dbpInput.value = '80';
            dbpInput.dispatchEvent(new Event('input', { bubbles: true }));

            const result = container.querySelector('#map-result');
            expect(result.style.display).not.toBe('none');
        });
    });
});

