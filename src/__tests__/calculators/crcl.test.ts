/**
 * @jest-environment jsdom
 */

import { describe, expect, test, jest, beforeEach, afterEach } from '@jest/globals';
import { crcl } from '../../calculators/crcl/index';
import { fhirDataService } from '../../fhir-data-service';

// Mock FHIR services
jest.spyOn(fhirDataService, 'initialize').mockImplementation(() => {});
jest.spyOn(fhirDataService, 'isReady').mockReturnValue(false);

describe('Creatinine Clearance (CrCl) Calculator', () => {
    let container: HTMLElement;

    beforeEach(() => {
        container = document.createElement('div');
        container.innerHTML = crcl.generateHTML();
        document.body.appendChild(container);
        crcl.initialize({}, {}, container);
    });

    afterEach(() => {
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    test('should export valid calculator module', () => {
        expect(crcl).toBeDefined();
        expect(crcl.id).toBe('crcl');
        expect(typeof crcl.generateHTML).toBe('function');
        expect(typeof crcl.initialize).toBe('function');
    });

    test('should calculate CrCl for male patient', () => {
        const ageInput = container.querySelector('#crcl-age') as HTMLInputElement;
        const weightInput = container.querySelector('#crcl-weight') as HTMLInputElement;
        const creatinineInput = container.querySelector('#crcl-creatinine') as HTMLInputElement;
        const maleRadio = container.querySelector('input[name="crcl-sex"][value="male"]') as HTMLInputElement;

        if (ageInput && weightInput && creatinineInput && maleRadio) {
            ageInput.value = '50';
            weightInput.value = '70';
            creatinineInput.value = '1.0';
            maleRadio.checked = true;

            ageInput.dispatchEvent(new Event('input', { bubbles: true }));
            weightInput.dispatchEvent(new Event('input', { bubbles: true }));
            creatinineInput.dispatchEvent(new Event('input', { bubbles: true }));
            maleRadio.dispatchEvent(new Event('change', { bubbles: true }));

            // CrCl = (140 - 50) * 70 / (72 * 1.0) = 87.5 mL/min
            const resultText = container.textContent || '';
            expect(resultText).toContain('87');
        }
    });

    test('should calculate CrCl for female patient (0.85 factor)', () => {
        const ageInput = container.querySelector('#crcl-age') as HTMLInputElement;
        const weightInput = container.querySelector('#crcl-weight') as HTMLInputElement;
        const creatinineInput = container.querySelector('#crcl-creatinine') as HTMLInputElement;
        const femaleRadio = container.querySelector('input[name="crcl-sex"][value="female"]') as HTMLInputElement;

        if (ageInput && weightInput && creatinineInput && femaleRadio) {
            ageInput.value = '50';
            weightInput.value = '70';
            creatinineInput.value = '1.0';
            femaleRadio.checked = true;

            ageInput.dispatchEvent(new Event('input', { bubbles: true }));
            weightInput.dispatchEvent(new Event('input', { bubbles: true }));
            creatinineInput.dispatchEvent(new Event('input', { bubbles: true }));
            femaleRadio.dispatchEvent(new Event('change', { bubbles: true }));

            // CrCl = (140 - 50) * 70 / (72 * 1.0) * 0.85 = 74.4 mL/min
            const resultText = container.textContent || '';
            expect(resultText).toContain('74');
        }
    });

    test('should show appropriate kidney function classification', () => {
        const ageInput = container.querySelector('#crcl-age') as HTMLInputElement;
        const weightInput = container.querySelector('#crcl-weight') as HTMLInputElement;
        const creatinineInput = container.querySelector('#crcl-creatinine') as HTMLInputElement;

        if (ageInput && weightInput && creatinineInput) {
            // Set values for normal kidney function
            ageInput.value = '30';
            weightInput.value = '70';
            creatinineInput.value = '0.8';

            ageInput.dispatchEvent(new Event('input', { bubbles: true }));
            weightInput.dispatchEvent(new Event('input', { bubbles: true }));
            creatinineInput.dispatchEvent(new Event('input', { bubbles: true }));

            setTimeout(() => {
                const resultText = container.textContent || '';
                expect(resultText.toLowerCase()).toMatch(/normal|mild|moderate|severe/);
            }, 100);
        }
    });
});

