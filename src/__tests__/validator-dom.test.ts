/**
 * @jest-environment jsdom
 */

import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import {
    setupLiveValidation,
    setupFormValidation,
    ValidationRules,
    ValidationRule,
    ValidationSchema
} from '../validator.js';

describe('setupLiveValidation', () => {
    let container: HTMLDivElement;

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    // -----------------------------------------------------------------------
    // 1. Null inputElement -- should return early without error
    // -----------------------------------------------------------------------
    test('returns early without error when inputElement is null', () => {
        expect(() => {
            setupLiveValidation(null as unknown as HTMLInputElement, ValidationRules.age);
        }).not.toThrow();
    });

    // -----------------------------------------------------------------------
    // 2. Blur event triggers validation -- invalid input gets error state
    // -----------------------------------------------------------------------
    test('blur with invalid value adds "invalid" class, aria-invalid, and error span', () => {
        const input = document.createElement('input');
        input.type = 'number';
        container.appendChild(input);

        const rule: ValidationRule = { required: true, min: 0, max: 150, message: 'Age must be between 0-150 years' };
        setupLiveValidation(input, rule);

        // Set an out-of-range value and blur
        input.value = '-5';
        input.dispatchEvent(new Event('blur'));

        expect(input.classList.contains('invalid')).toBe(true);
        expect(input.getAttribute('aria-invalid')).toBe('true');

        // Error span should be created as the next sibling
        const errorSpan = input.nextElementSibling as HTMLElement;
        expect(errorSpan).not.toBeNull();
        expect(errorSpan.classList.contains('error-text')).toBe(true);
        expect(errorSpan.textContent).toBe('Age must be between 0-150 years');
    });

    // -----------------------------------------------------------------------
    // 3. Blur event with valid input -- removes error state
    // -----------------------------------------------------------------------
    test('blur with valid value removes "invalid" class, aria-invalid, and error span', () => {
        const input = document.createElement('input');
        input.type = 'number';
        container.appendChild(input);

        const rule: ValidationRule = { required: true, min: 0, max: 150, message: 'Age out of range' };
        setupLiveValidation(input, rule);

        // First trigger an error
        input.value = '-5';
        input.dispatchEvent(new Event('blur'));
        expect(input.classList.contains('invalid')).toBe(true);
        expect(input.nextElementSibling).not.toBeNull();

        // Now set a valid value and blur again
        input.value = '30';
        input.dispatchEvent(new Event('blur'));

        expect(input.classList.contains('invalid')).toBe(false);
        expect(input.getAttribute('aria-invalid')).toBeNull();

        // Error span should have been removed
        const errorSpan = input.nextElementSibling;
        // Should be null or at least not an error-text span
        if (errorSpan) {
            expect(errorSpan.classList.contains('error-text')).toBe(false);
        }
    });

    // -----------------------------------------------------------------------
    // 4. Input event clears error state
    // -----------------------------------------------------------------------
    test('input event removes "invalid" class and error span without re-validating', () => {
        const input = document.createElement('input');
        input.type = 'number';
        container.appendChild(input);

        const rule: ValidationRule = { required: true, min: 0, max: 150 };
        setupLiveValidation(input, rule);

        // First produce an error via blur
        input.value = '-5';
        input.dispatchEvent(new Event('blur'));
        expect(input.classList.contains('invalid')).toBe(true);
        expect(input.nextElementSibling).not.toBeNull();

        // Fire input event (user typing)
        input.dispatchEvent(new Event('input'));

        expect(input.classList.contains('invalid')).toBe(false);
        // The error span should be removed
        const maybeSpan = input.nextElementSibling;
        if (maybeSpan) {
            expect(maybeSpan.classList.contains('error-text')).toBe(false);
        }
    });

    // -----------------------------------------------------------------------
    // 5. Error span reuse -- updates text rather than creating duplicates
    // -----------------------------------------------------------------------
    test('reuses existing error-text span instead of creating a duplicate', () => {
        const input = document.createElement('input');
        input.type = 'number';
        container.appendChild(input);

        const rule: ValidationRule = { required: true, min: 0, max: 150, message: 'Out of range' };
        setupLiveValidation(input, rule);

        // First blur with invalid value
        input.value = '-5';
        input.dispatchEvent(new Event('blur'));

        const firstSpan = input.nextElementSibling as HTMLElement;
        expect(firstSpan.classList.contains('error-text')).toBe(true);

        // Blur again with another invalid value (still out of range)
        input.value = '999';
        input.dispatchEvent(new Event('blur'));

        // The error-text span should be the same element (reused), not a duplicate
        const secondSpan = input.nextElementSibling as HTMLElement;
        expect(secondSpan).toBe(firstSpan);
        expect(secondSpan.classList.contains('error-text')).toBe(true);
        expect(secondSpan.textContent).toBe('Out of range');

        // Verify there is only one error-text span in the container
        const allErrorSpans = container.querySelectorAll('.error-text');
        expect(allErrorSpans.length).toBe(1);
    });

    // -----------------------------------------------------------------------
    // 6. Error span creation -- properly inserts after input in the DOM
    // -----------------------------------------------------------------------
    test('error span is inserted immediately after the input element', () => {
        const input = document.createElement('input');
        input.type = 'number';
        const trailingDiv = document.createElement('div');
        trailingDiv.className = 'trailing';
        container.appendChild(input);
        container.appendChild(trailingDiv);

        const rule: ValidationRule = { required: true, min: 0, max: 100, message: 'Invalid' };
        setupLiveValidation(input, rule);

        input.value = '-1';
        input.dispatchEvent(new Event('blur'));

        // Error span should be between input and trailingDiv
        const errorSpan = input.nextElementSibling as HTMLElement;
        expect(errorSpan.classList.contains('error-text')).toBe(true);
        expect(errorSpan.style.color).toBe('rgb(211, 47, 47)');
        expect(errorSpan.style.fontSize).toBe('1.1rem');
        expect(errorSpan.style.fontWeight).toBe('500');
        expect(errorSpan.style.marginTop).toBe('6px');
        expect(errorSpan.style.display).toBe('block');
        expect(errorSpan.tagName.toLowerCase()).toBe('span');

        // Trailing div should still be after the error span
        expect(errorSpan.nextElementSibling).toBe(trailingDiv);
    });

    // -----------------------------------------------------------------------
    // 7. onError callback is called with errors array when validation fails
    // -----------------------------------------------------------------------
    test('onError callback is invoked with errors array on validation failure', () => {
        const input = document.createElement('input');
        input.type = 'number';
        container.appendChild(input);

        const rule: ValidationRule = { required: true, min: 0, max: 150, message: 'Out of range' };
        const onError = jest.fn() as jest.Mock<any>;
        setupLiveValidation(input, rule, onError);

        input.value = '-5';
        input.dispatchEvent(new Event('blur'));

        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError).toHaveBeenCalledWith(['Out of range']);
    });

    // -----------------------------------------------------------------------
    // 8. onError callback null/undefined does not throw
    // -----------------------------------------------------------------------
    test('does not throw when onError is null and validation fails', () => {
        const input = document.createElement('input');
        input.type = 'number';
        container.appendChild(input);

        const rule: ValidationRule = { required: true, min: 0, max: 150, message: 'Out of range' };
        setupLiveValidation(input, rule, null);

        expect(() => {
            input.value = '-5';
            input.dispatchEvent(new Event('blur'));
        }).not.toThrow();

        // Error state should still be applied
        expect(input.classList.contains('invalid')).toBe(true);
    });

    test('does not throw when onError is undefined (default) and validation fails', () => {
        const input = document.createElement('input');
        input.type = 'number';
        container.appendChild(input);

        const rule: ValidationRule = { required: true, min: 0, max: 150 };
        setupLiveValidation(input, rule);

        expect(() => {
            input.value = '999';
            input.dispatchEvent(new Event('blur'));
        }).not.toThrow();

        expect(input.classList.contains('invalid')).toBe(true);
    });

    // -----------------------------------------------------------------------
    // Additional: onError is NOT called on valid input
    // -----------------------------------------------------------------------
    test('onError callback is NOT invoked when input is valid', () => {
        const input = document.createElement('input');
        input.type = 'number';
        container.appendChild(input);

        const rule: ValidationRule = { required: true, min: 0, max: 150 };
        const onError = jest.fn() as jest.Mock<any>;
        setupLiveValidation(input, rule, onError);

        input.value = '30';
        input.dispatchEvent(new Event('blur'));

        expect(onError).not.toHaveBeenCalled();
    });

    // -----------------------------------------------------------------------
    // Additional: empty required field triggers validation error on blur
    // -----------------------------------------------------------------------
    test('empty required field triggers error on blur', () => {
        const input = document.createElement('input');
        input.type = 'number';
        container.appendChild(input);

        const rule: ValidationRule = { required: true, message: 'Field is required' };
        setupLiveValidation(input, rule);

        input.value = '';
        input.dispatchEvent(new Event('blur'));

        expect(input.classList.contains('invalid')).toBe(true);
        const errorSpan = input.nextElementSibling as HTMLElement;
        expect(errorSpan).not.toBeNull();
        expect(errorSpan.textContent).toBe('Field is required');
    });
});

describe('setupFormValidation', () => {
    let form: HTMLFormElement;

    beforeEach(() => {
        form = document.createElement('form');
        document.body.appendChild(form);
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    // -----------------------------------------------------------------------
    // 1. Null formElement -- should return early without error
    // -----------------------------------------------------------------------
    test('returns early without error when formElement is null', () => {
        expect(() => {
            setupFormValidation(null as unknown as HTMLFormElement, { age: ValidationRules.age });
        }).not.toThrow();
    });

    // -----------------------------------------------------------------------
    // 2. Iterates schema keys, finds input by ID, calls setupLiveValidation
    // -----------------------------------------------------------------------
    test('sets up live validation for each input found by schema key as ID', () => {
        const ageInput = document.createElement('input');
        ageInput.type = 'number';
        ageInput.id = 'age';
        form.appendChild(ageInput);

        const weightInput = document.createElement('input');
        weightInput.type = 'number';
        weightInput.id = 'weight';
        form.appendChild(weightInput);

        const schema: ValidationSchema = {
            age: { required: true, min: 0, max: 150, message: 'Age out of range' },
            weight: { required: true, min: 0.5, max: 500, message: 'Weight out of range' }
        };

        setupFormValidation(form, schema);

        // Verify that blur events on each input trigger validation
        ageInput.value = '-5';
        ageInput.dispatchEvent(new Event('blur'));
        expect(ageInput.classList.contains('invalid')).toBe(true);
        expect((ageInput.nextElementSibling as HTMLElement).textContent).toBe('Age out of range');

        weightInput.value = '0';
        weightInput.dispatchEvent(new Event('blur'));
        expect(weightInput.classList.contains('invalid')).toBe(true);
        expect((weightInput.nextElementSibling as HTMLElement).textContent).toBe('Weight out of range');
    });

    // -----------------------------------------------------------------------
    // 3. Missing input elements in form are silently skipped
    // -----------------------------------------------------------------------
    test('silently skips schema keys with no matching input element in the form', () => {
        // Only add 'age' input, but schema has both 'age' and 'height'
        const ageInput = document.createElement('input');
        ageInput.type = 'number';
        ageInput.id = 'age';
        form.appendChild(ageInput);

        const schema: ValidationSchema = {
            age: { required: true, min: 0, max: 150, message: 'Age out of range' },
            height: { required: true, min: 30, max: 250, message: 'Height out of range' }
        };

        // Should not throw even though #height does not exist
        expect(() => {
            setupFormValidation(form, schema);
        }).not.toThrow();

        // Verify that existing 'age' input still got validation wired up
        ageInput.value = '999';
        ageInput.dispatchEvent(new Event('blur'));
        expect(ageInput.classList.contains('invalid')).toBe(true);
    });

    // -----------------------------------------------------------------------
    // Additional: empty schema does not throw
    // -----------------------------------------------------------------------
    test('does not throw with an empty schema', () => {
        expect(() => {
            setupFormValidation(form, {});
        }).not.toThrow();
    });
});
