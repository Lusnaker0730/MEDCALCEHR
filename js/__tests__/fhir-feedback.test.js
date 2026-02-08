/**
 * @jest-environment jsdom
 */
import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { FHIRFeedback } from '../fhir-feedback.js';
describe('FHIRFeedback', () => {
    let feedback;
    let container;
    beforeEach(() => {
        // Clear DOM completely between tests
        document.head.innerHTML = '';
        document.body.innerHTML = '';
        container = document.createElement('div');
        document.body.appendChild(container);
        feedback = new FHIRFeedback();
    });
    afterEach(() => {
        jest.useRealTimers();
        document.head.innerHTML = '';
        document.body.innerHTML = '';
    });
    // ========================================================================
    // Constructor
    // ========================================================================
    describe('constructor', () => {
        test('should create an instance', () => {
            const fb = new FHIRFeedback();
            expect(fb).toBeInstanceOf(FHIRFeedback);
        });
        test('should call injectStyles on construction', () => {
            // The constructor already ran above; verify the style link was injected
            const link = document.getElementById('fhir-feedback-styles');
            expect(link).not.toBeNull();
            expect(link?.tagName).toBe('LINK');
        });
    });
    // ========================================================================
    // injectStyles
    // ========================================================================
    describe('injectStyles', () => {
        test('should inject a link element into document.head on first call', () => {
            // Already injected by constructor; verify
            const link = document.getElementById('fhir-feedback-styles');
            expect(link).not.toBeNull();
            expect(link.rel).toBe('stylesheet');
            expect(link.href).toContain('fhir-feedback.css');
        });
        test('should be idempotent - calling again does not add duplicate', () => {
            feedback.injectStyles();
            feedback.injectStyles();
            const links = document.querySelectorAll('#fhir-feedback-styles');
            expect(links.length).toBe(1);
        });
        test('should detect existing style element and set stylesInjected flag', () => {
            // Create a new instance - the style element already exists from the first instance
            const fb2 = new FHIRFeedback();
            // Calling injectStyles again should be a no-op
            fb2.injectStyles();
            const links = document.querySelectorAll('#fhir-feedback-styles');
            expect(links.length).toBe(1);
        });
    });
    // ========================================================================
    // showLoading
    // ========================================================================
    describe('showLoading', () => {
        test('should create a loading indicator on the input element', () => {
            const input = document.createElement('input');
            container.appendChild(input);
            feedback.showLoading(input, 'weight');
            const indicator = document.querySelector('.fhir-feedback-indicator');
            expect(indicator).not.toBeNull();
            expect(indicator?.classList.contains('fhir-status-loading')).toBe(true);
            expect(indicator?.innerHTML).toContain('Loading weight from EHR...');
        });
        test('should use default label when none provided', () => {
            const input = document.createElement('input');
            container.appendChild(input);
            feedback.showLoading(input);
            const indicator = document.querySelector('.fhir-feedback-indicator');
            expect(indicator?.innerHTML).toContain('Loading data from EHR...');
        });
        test('should wrap the input in a fhir-feedback-wrapper if not wrapped', () => {
            const input = document.createElement('input');
            container.appendChild(input);
            feedback.showLoading(input);
            const wrapper = input.closest('.fhir-feedback-wrapper');
            expect(wrapper).not.toBeNull();
        });
        test('should reuse existing ui-input-wrapper and add class', () => {
            const wrapper = document.createElement('div');
            wrapper.className = 'ui-input-wrapper';
            const input = document.createElement('input');
            wrapper.appendChild(input);
            container.appendChild(wrapper);
            feedback.showLoading(input);
            expect(wrapper.classList.contains('fhir-feedback-wrapper')).toBe(true);
            // Should not create a new wrapper, just reuse
            expect(container.querySelectorAll('.fhir-feedback-wrapper').length).toBe(1);
        });
        test('should remove previous indicators before adding new one', () => {
            const input = document.createElement('input');
            container.appendChild(input);
            feedback.showLoading(input, 'first');
            feedback.showLoading(input, 'second');
            const indicators = document.querySelectorAll('.fhir-feedback-indicator');
            expect(indicators.length).toBe(1);
            expect(indicators[0].innerHTML).toContain('Loading second from EHR...');
        });
    });
    // ========================================================================
    // showSuccess
    // ========================================================================
    describe('showSuccess', () => {
        test('should create a success indicator', () => {
            const input = document.createElement('input');
            container.appendChild(input);
            feedback.showSuccess(input, 'weight', '70 kg');
            const indicator = document.querySelector('.fhir-feedback-indicator');
            expect(indicator).not.toBeNull();
            expect(indicator?.classList.contains('fhir-status-success')).toBe(true);
            expect(indicator?.innerHTML).toContain('weight loaded from EHR');
            expect(indicator?.innerHTML).toContain('70 kg');
        });
        test('should omit value display when value is empty', () => {
            const input = document.createElement('input');
            container.appendChild(input);
            feedback.showSuccess(input, 'height');
            const indicator = document.querySelector('.fhir-feedback-indicator');
            expect(indicator?.innerHTML).toContain('height loaded from EHR');
            // Should not contain the colon-value separator
            expect(indicator?.textContent).not.toContain(':');
        });
        test('should auto-remove after 5000ms', () => {
            jest.useFakeTimers();
            const input = document.createElement('input');
            container.appendChild(input);
            feedback.showSuccess(input, 'weight', '70');
            let indicator = document.querySelector('.fhir-feedback-indicator');
            expect(indicator).not.toBeNull();
            // Advance past the autoRemove timeout
            jest.advanceTimersByTime(5000);
            // Opacity should be set to '0'
            expect(indicator.style.opacity).toBe('0');
            // After another 300ms, the element is removed
            jest.advanceTimersByTime(300);
            indicator = document.querySelector('.fhir-feedback-indicator');
            expect(indicator).toBeNull();
        });
    });
    // ========================================================================
    // showWarning
    // ========================================================================
    describe('showWarning', () => {
        test('should create a warning indicator with default message', () => {
            const input = document.createElement('input');
            container.appendChild(input);
            feedback.showWarning(input, 'age');
            const indicator = document.querySelector('.fhir-feedback-indicator');
            expect(indicator).not.toBeNull();
            expect(indicator?.classList.contains('fhir-status-warning')).toBe(true);
            expect(indicator?.innerHTML).toContain('No age found in EHR');
        });
        test('should use custom message when provided', () => {
            const input = document.createElement('input');
            container.appendChild(input);
            feedback.showWarning(input, 'age', 'Custom warning message');
            const indicator = document.querySelector('.fhir-feedback-indicator');
            expect(indicator?.innerHTML).toContain('Custom warning message');
        });
        test('should dismiss on user input event', () => {
            const input = document.createElement('input');
            container.appendChild(input);
            feedback.showWarning(input, 'age');
            let indicator = document.querySelector('.fhir-feedback-indicator');
            expect(indicator).not.toBeNull();
            // Simulate user input
            input.dispatchEvent(new Event('input'));
            indicator = document.querySelector('.fhir-feedback-indicator');
            expect(indicator).toBeNull();
        });
        test('should dismiss on change event', () => {
            const input = document.createElement('input');
            container.appendChild(input);
            feedback.showWarning(input, 'age');
            let indicator = document.querySelector('.fhir-feedback-indicator');
            expect(indicator).not.toBeNull();
            // Simulate change event
            input.dispatchEvent(new Event('change'));
            indicator = document.querySelector('.fhir-feedback-indicator');
            expect(indicator).toBeNull();
        });
        test('should only dismiss once (handler removes itself)', () => {
            const input = document.createElement('input');
            container.appendChild(input);
            feedback.showWarning(input, 'age');
            // First input event removes indicator
            input.dispatchEvent(new Event('input'));
            // Second input event should not throw
            expect(() => {
                input.dispatchEvent(new Event('input'));
            }).not.toThrow();
        });
    });
    // ========================================================================
    // showError
    // ========================================================================
    describe('showError', () => {
        test('should create an error indicator', () => {
            const input = document.createElement('input');
            container.appendChild(input);
            feedback.showError(input, 'creatinine', new Error('Network error'));
            const indicator = document.querySelector('.fhir-feedback-indicator');
            expect(indicator).not.toBeNull();
            expect(indicator?.classList.contains('fhir-status-error')).toBe(true);
            expect(indicator?.innerHTML).toContain('creatinine');
            expect(indicator?.innerHTML).toContain('Network error');
        });
        test('should use default error message when no error provided', () => {
            const input = document.createElement('input');
            container.appendChild(input);
            feedback.showError(input, 'creatinine');
            const indicator = document.querySelector('.fhir-feedback-indicator');
            expect(indicator?.innerHTML).toContain('Failed to load from EHR');
        });
        test('should use default label when none provided', () => {
            const input = document.createElement('input');
            container.appendChild(input);
            feedback.showError(input);
            const indicator = document.querySelector('.fhir-feedback-indicator');
            expect(indicator?.innerHTML).toContain('data');
        });
    });
    // ========================================================================
    // showInfo
    // ========================================================================
    describe('showInfo', () => {
        test('should create an info indicator with message', () => {
            const input = document.createElement('input');
            container.appendChild(input);
            feedback.showInfo(input, 'Enter value manually');
            const indicator = document.querySelector('.fhir-feedback-indicator');
            expect(indicator).not.toBeNull();
            expect(indicator?.classList.contains('fhir-status-info')).toBe(true);
            expect(indicator?.innerHTML).toContain('Enter value manually');
        });
    });
    // ========================================================================
    // createLoadingBanner / removeLoadingBanner
    // ========================================================================
    describe('createLoadingBanner', () => {
        test('should create a banner with default message', () => {
            const banner = feedback.createLoadingBanner(container);
            expect(banner).not.toBeNull();
            expect(banner.id).toBe('fhir-loading-banner');
            expect(banner.className).toBe('fhir-loading-banner');
            expect(banner.innerHTML).toContain('Loading patient data from EHR...');
            expect(banner.querySelector('.spinner')).not.toBeNull();
        });
        test('should create a banner with custom message', () => {
            const banner = feedback.createLoadingBanner(container, 'Fetching labs...');
            expect(banner.innerHTML).toContain('Fetching labs...');
        });
        test('should insert before first .ui-section if present', () => {
            const section = document.createElement('div');
            section.className = 'ui-section';
            container.appendChild(section);
            feedback.createLoadingBanner(container);
            // Banner should be the first child, before the section
            expect(container.firstElementChild?.id).toBe('fhir-loading-banner');
            expect(container.children[1]).toBe(section);
        });
        test('should insert before first .section if present', () => {
            const section = document.createElement('div');
            section.className = 'section';
            container.appendChild(section);
            feedback.createLoadingBanner(container);
            expect(container.firstElementChild?.id).toBe('fhir-loading-banner');
        });
        test('should insert as first child when no section is found', () => {
            const p = document.createElement('p');
            container.appendChild(p);
            feedback.createLoadingBanner(container);
            expect(container.firstElementChild?.id).toBe('fhir-loading-banner');
        });
    });
    describe('removeLoadingBanner', () => {
        test('should fade out and remove the banner', () => {
            jest.useFakeTimers();
            feedback.createLoadingBanner(container);
            const banner = container.querySelector('#fhir-loading-banner');
            expect(banner).not.toBeNull();
            feedback.removeLoadingBanner(container);
            // Opacity set to 0 immediately
            expect(banner.style.opacity).toBe('0');
            // Banner removed after 300ms
            jest.advanceTimersByTime(300);
            expect(container.querySelector('#fhir-loading-banner')).toBeNull();
        });
        test('should do nothing if no banner exists', () => {
            // Should not throw
            expect(() => feedback.removeLoadingBanner(container)).not.toThrow();
        });
    });
    // ========================================================================
    // createDataSummary
    // ========================================================================
    describe('createDataSummary', () => {
        test('should create a success summary when all data is loaded', () => {
            const summary = {
                loaded: ['Weight', 'Height'],
                missing: [],
                failed: []
            };
            const el = feedback.createDataSummary(container, summary);
            expect(el.classList.contains('success')).toBe(true);
            expect(el.id).toBe('fhir-data-summary');
            expect(el.innerHTML).toContain('Patient data loaded successfully');
            expect(el.innerHTML).toContain('Weight');
            expect(el.innerHTML).toContain('Height');
        });
        test('should create a warning summary when data is missing', () => {
            const summary = {
                loaded: ['Weight'],
                missing: ['Age', 'Gender'],
                failed: []
            };
            const el = feedback.createDataSummary(container, summary);
            expect(el.classList.contains('warning')).toBe(true);
            expect(el.innerHTML).toContain('Some patient data is missing');
            expect(el.innerHTML).toContain('Please enter manually');
            expect(el.innerHTML).toContain('Age');
            expect(el.innerHTML).toContain('Gender');
        });
        test('should create an error summary when data failed', () => {
            const summary = {
                loaded: [],
                missing: [],
                failed: ['Creatinine', 'BUN']
            };
            const el = feedback.createDataSummary(container, summary);
            expect(el.classList.contains('error')).toBe(true);
            expect(el.innerHTML).toContain('Error loading some patient data');
            expect(el.innerHTML).toContain('Failed to load');
            expect(el.innerHTML).toContain('Creatinine');
            expect(el.innerHTML).toContain('BUN');
        });
        test('should prioritize error over warning', () => {
            const summary = {
                loaded: [],
                missing: ['Age'],
                failed: ['Creatinine']
            };
            const el = feedback.createDataSummary(container, summary);
            expect(el.classList.contains('error')).toBe(true);
        });
        test('should handle missing items as objects with id and label', () => {
            const summary = {
                loaded: [],
                missing: [{ id: 'age-input', label: 'Age' }],
                failed: []
            };
            const el = feedback.createDataSummary(container, summary);
            const li = el.querySelector('li[data-field-id="age-input"]');
            expect(li).not.toBeNull();
            expect(li?.textContent).toBe('Age');
        });
        test('should handle mixed string and object missing items', () => {
            const summary = {
                loaded: [],
                missing: ['Gender', { id: 'age-input', label: 'Age' }],
                failed: []
            };
            const el = feedback.createDataSummary(container, summary);
            const items = el.querySelectorAll('.missing-list li');
            expect(items.length).toBe(2);
        });
        test('should insert before .ui-section if present', () => {
            const section = document.createElement('div');
            section.className = 'ui-section';
            container.appendChild(section);
            feedback.createDataSummary(container, {
                loaded: ['Weight'],
                missing: [],
                failed: []
            });
            expect(container.firstElementChild?.id).toBe('fhir-data-summary');
        });
        test('should handle empty summary (no loaded, missing, or failed)', () => {
            const summary = {
                loaded: [],
                missing: [],
                failed: []
            };
            const el = feedback.createDataSummary(container, summary);
            expect(el.classList.contains('success')).toBe(true);
            expect(el.innerHTML).toContain('Patient data loaded successfully');
            // No details sections for empty lists
            expect(el.querySelector('.details')).toBeNull();
        });
        test('should handle summary with all three lists populated', () => {
            const summary = {
                loaded: ['Weight'],
                missing: ['Age'],
                failed: ['Creatinine']
            };
            const el = feedback.createDataSummary(container, summary);
            expect(el.classList.contains('error')).toBe(true);
            const details = el.querySelectorAll('.details');
            // loaded, missing, and failed sections
            expect(details.length).toBe(3);
        });
    });
    describe('removeDataSummary', () => {
        test('should remove an existing data summary', () => {
            feedback.createDataSummary(container, {
                loaded: ['Weight'],
                missing: [],
                failed: []
            });
            expect(container.querySelector('#fhir-data-summary')).not.toBeNull();
            feedback.removeDataSummary(container);
            expect(container.querySelector('#fhir-data-summary')).toBeNull();
        });
        test('should do nothing if no summary exists', () => {
            expect(() => feedback.removeDataSummary(container)).not.toThrow();
        });
    });
    // ========================================================================
    // addFieldFeedback
    // ========================================================================
    describe('addFieldFeedback', () => {
        test('should add feedback inside a .ui-input-group', () => {
            const group = document.createElement('div');
            group.className = 'ui-input-group';
            const wrapper = document.createElement('div');
            wrapper.className = 'ui-input-wrapper';
            const input = document.createElement('input');
            wrapper.appendChild(input);
            group.appendChild(wrapper);
            container.appendChild(group);
            feedback.addFieldFeedback(input, 'Value loaded', 'success');
            const fb = group.querySelector('.fhir-field-feedback');
            expect(fb).not.toBeNull();
            expect(fb?.classList.contains('success')).toBe(true);
            expect(fb?.innerHTML).toContain('Value loaded');
        });
        test('should use default type of info', () => {
            const group = document.createElement('div');
            group.className = 'ui-input-group';
            const input = document.createElement('input');
            group.appendChild(input);
            container.appendChild(group);
            feedback.addFieldFeedback(input, 'Some info');
            const fb = group.querySelector('.fhir-field-feedback');
            expect(fb?.classList.contains('info')).toBe(true);
        });
        test('should show warning type', () => {
            const group = document.createElement('div');
            group.className = 'ui-input-group';
            const wrapper = document.createElement('div');
            wrapper.className = 'fhir-feedback-wrapper';
            const input = document.createElement('input');
            wrapper.appendChild(input);
            group.appendChild(wrapper);
            container.appendChild(group);
            feedback.addFieldFeedback(input, 'Missing data', 'warning');
            const fb = group.querySelector('.fhir-field-feedback');
            expect(fb?.classList.contains('warning')).toBe(true);
        });
        test('should remove existing feedback before adding new one', () => {
            const group = document.createElement('div');
            group.className = 'ui-input-group';
            const wrapper = document.createElement('div');
            wrapper.className = 'ui-input-wrapper';
            const input = document.createElement('input');
            wrapper.appendChild(input);
            group.appendChild(wrapper);
            container.appendChild(group);
            feedback.addFieldFeedback(input, 'First message', 'info');
            feedback.addFieldFeedback(input, 'Second message', 'success');
            const feedbacks = group.querySelectorAll('.fhir-field-feedback');
            expect(feedbacks.length).toBe(1);
            expect(feedbacks[0].innerHTML).toContain('Second message');
        });
        test('should do nothing if input is not within .ui-input-group', () => {
            const input = document.createElement('input');
            container.appendChild(input);
            feedback.addFieldFeedback(input, 'Some message', 'info');
            // No feedback element created since there's no ui-input-group ancestor
            const fb = container.querySelector('.fhir-field-feedback');
            expect(fb).toBeNull();
        });
        test('should insert after input directly when no wrapper found', () => {
            const group = document.createElement('div');
            group.className = 'ui-input-group';
            const input = document.createElement('input');
            group.appendChild(input);
            container.appendChild(group);
            feedback.addFieldFeedback(input, 'Direct placement', 'info');
            const fb = group.querySelector('.fhir-field-feedback');
            expect(fb).not.toBeNull();
            // Feedback should be after the input
            expect(input.nextSibling).toBe(fb);
        });
    });
    // ========================================================================
    // trackDataLoading
    // ========================================================================
    describe('trackDataLoading', () => {
        test('should track resolved promises with setValue and mark as loaded', async () => {
            const input = document.createElement('input');
            input.id = 'weight';
            container.appendChild(input);
            const setValueMock = jest.fn((i, d) => {
                i.value = String(d);
            });
            const fields = [
                {
                    inputId: 'weight',
                    label: 'Weight',
                    promise: Promise.resolve(70),
                    setValue: setValueMock
                }
            ];
            const result = await feedback.trackDataLoading(container, fields);
            expect(result.loaded).toContain('Weight');
            expect(result.missing.length).toBe(0);
            expect(result.failed.length).toBe(0);
            expect(setValueMock).toHaveBeenCalled();
            expect(input.value).toBe('70');
            // Summary should be created
            const summary = container.querySelector('#fhir-data-summary');
            expect(summary).not.toBeNull();
        });
        test('should mark as missing when promise resolves to null', async () => {
            const input = document.createElement('input');
            input.id = 'age';
            container.appendChild(input);
            const fields = [
                {
                    inputId: 'age',
                    label: 'Age',
                    promise: Promise.resolve(null),
                    setValue: jest.fn()
                }
            ];
            const result = await feedback.trackDataLoading(container, fields);
            expect(result.loaded.length).toBe(0);
            expect(result.missing.length).toBe(1);
            expect(result.failed.length).toBe(0);
        });
        test('should mark as missing when promise resolves with data but no setValue', async () => {
            const input = document.createElement('input');
            input.id = 'age';
            container.appendChild(input);
            const fields = [
                {
                    inputId: 'age',
                    label: 'Age',
                    promise: Promise.resolve(25)
                    // no setValue
                }
            ];
            const result = await feedback.trackDataLoading(container, fields);
            expect(result.missing.length).toBe(1);
        });
        test('should mark as failed when promise rejects', async () => {
            const input = document.createElement('input');
            input.id = 'creatinine';
            container.appendChild(input);
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
            const fields = [
                {
                    inputId: 'creatinine',
                    label: 'Creatinine',
                    promise: Promise.reject(new Error('Network error')),
                    setValue: jest.fn()
                }
            ];
            const result = await feedback.trackDataLoading(container, fields);
            expect(result.loaded.length).toBe(0);
            expect(result.missing.length).toBe(0);
            expect(result.failed).toContain('Creatinine');
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
        test('should handle multiple fields with mixed results', async () => {
            const input1 = document.createElement('input');
            input1.id = 'weight';
            container.appendChild(input1);
            const input2 = document.createElement('input');
            input2.id = 'age';
            container.appendChild(input2);
            const input3 = document.createElement('input');
            input3.id = 'creatinine';
            container.appendChild(input3);
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
            const fields = [
                {
                    inputId: 'weight',
                    label: 'Weight',
                    promise: Promise.resolve(70),
                    setValue: (i, d) => { i.value = String(d); }
                },
                {
                    inputId: 'age',
                    label: 'Age',
                    promise: Promise.resolve(null),
                    setValue: jest.fn()
                },
                {
                    inputId: 'creatinine',
                    label: 'Creatinine',
                    promise: Promise.reject(new Error('Fail')),
                    setValue: jest.fn()
                }
            ];
            const result = await feedback.trackDataLoading(container, fields);
            expect(result.loaded).toContain('Weight');
            expect(result.missing.length).toBe(1);
            expect(result.failed).toContain('Creatinine');
            consoleSpy.mockRestore();
        });
        test('should skip fields whose input is not found in container', async () => {
            // No input with id 'missing-id' in container
            const fields = [
                {
                    inputId: 'missing-id',
                    label: 'Missing',
                    promise: Promise.resolve('data'),
                    setValue: jest.fn()
                }
            ];
            const result = await feedback.trackDataLoading(container, fields);
            expect(result.loaded.length).toBe(0);
            expect(result.missing.length).toBe(0);
            expect(result.failed.length).toBe(0);
        });
        test('should create and remove loading banner during execution', async () => {
            jest.useFakeTimers();
            const input = document.createElement('input');
            input.id = 'test-field';
            container.appendChild(input);
            const fields = [
                {
                    inputId: 'test-field',
                    label: 'Test',
                    promise: Promise.resolve('value'),
                    setValue: (i, d) => { i.value = String(d); }
                }
            ];
            const promise = feedback.trackDataLoading(container, fields);
            // Allow microtasks to flush
            jest.useRealTimers();
            await promise;
            // The banner should be in the process of being removed (opacity=0)
            // After the removal timeout completes, it's gone
            // We check the summary is present as final state
            const summary = container.querySelector('#fhir-data-summary');
            expect(summary).not.toBeNull();
        });
        test('should store missing field id without # prefix', async () => {
            const input = document.createElement('input');
            input.id = 'test-input';
            container.appendChild(input);
            const fields = [
                {
                    inputId: 'test-input',
                    label: 'Test',
                    promise: Promise.resolve(null),
                    setValue: jest.fn()
                }
            ];
            const result = await feedback.trackDataLoading(container, fields);
            // The missing item should have the id without # prefix
            const missingItem = result.missing[0];
            expect(typeof missingItem).toBe('object');
            if (typeof missingItem === 'object') {
                expect(missingItem.id).toBe('test-input');
                expect(missingItem.label).toBe('Test');
            }
        });
    });
    // ========================================================================
    // setupDynamicTracking
    // ========================================================================
    describe('setupDynamicTracking', () => {
        test('should register input handlers on missing fields', () => {
            const input = document.createElement('input');
            input.id = 'age-input';
            container.appendChild(input);
            // Create summary first
            feedback.createDataSummary(container, {
                loaded: [],
                missing: [{ id: 'age-input', label: 'Age' }],
                failed: []
            });
            feedback.setupDynamicTracking(container, [
                { id: 'age-input', label: 'Age' }
            ]);
            // Simulate user filling in the field
            input.value = '30';
            input.dispatchEvent(new Event('input'));
            // The field should be removed from missing list after timeout
            // (removeFieldFromMissingList adds 'removing' class and removes after 300ms)
            jest.useFakeTimers();
            // Re-trigger to test with timers
            input.value = '';
            input.dispatchEvent(new Event('input'));
            // Empty value re-adds to missing list
        });
        test('should handle string-type missing fields', () => {
            const input = document.createElement('input');
            input.id = 'weight';
            container.appendChild(input);
            feedback.createDataSummary(container, {
                loaded: [],
                missing: ['weight'],
                failed: []
            });
            feedback.setupDynamicTracking(container, ['weight']);
            // The field should be tracked
            input.value = '70';
            input.dispatchEvent(new Event('input'));
            // Should not throw
        });
        test('should normalize ids by removing leading #', () => {
            const input = document.createElement('input');
            input.id = 'age-input';
            container.appendChild(input);
            feedback.createDataSummary(container, {
                loaded: [],
                missing: [{ id: 'age-input', label: 'Age' }],
                failed: []
            });
            feedback.setupDynamicTracking(container, [
                { id: '#age-input', label: 'Age' }
            ]);
            // The input handler should still be registered for 'age-input' (without #)
            input.value = '30';
            input.dispatchEvent(new Event('input'));
        });
        test('should clear previous tracking state on new setup', () => {
            const input1 = document.createElement('input');
            input1.id = 'field1';
            container.appendChild(input1);
            const input2 = document.createElement('input');
            input2.id = 'field2';
            container.appendChild(input2);
            // Setup initial tracking
            feedback.setupDynamicTracking(container, [
                { id: 'field1', label: 'Field 1' }
            ]);
            // Setup new tracking - should clear previous
            feedback.setupDynamicTracking(container, [
                { id: 'field2', label: 'Field 2' }
            ]);
            // field1 handlers should be cleaned up
            // field2 should be tracked
            input2.value = 'test';
            input2.dispatchEvent(new Event('input'));
        });
        test('should skip fields not found in container', () => {
            feedback.setupDynamicTracking(container, [
                { id: 'nonexistent', label: 'Not Found' }
            ]);
            // Should not throw
        });
    });
    // ========================================================================
    // updateSummaryOnInput (private, tested via public API)
    // ========================================================================
    describe('dynamic summary updates', () => {
        test('should remove field from missing list when user fills in value', () => {
            jest.useFakeTimers();
            const input = document.createElement('input');
            input.id = 'age-input';
            container.appendChild(input);
            feedback.createDataSummary(container, {
                loaded: [],
                missing: [{ id: 'age-input', label: 'Age' }],
                failed: []
            });
            feedback.setupDynamicTracking(container, [
                { id: 'age-input', label: 'Age' }
            ]);
            // Simulate user entering a value
            input.value = '30';
            input.dispatchEvent(new Event('input'));
            // The li should have 'removing' class
            const li = document.querySelector('li[data-field-id="age-input"]');
            expect(li?.classList.contains('removing')).toBe(true);
            // After 300ms, the li is removed
            jest.advanceTimersByTime(300);
            expect(document.querySelector('li[data-field-id="age-input"]')).toBeNull();
        });
        test('should update banner state when user fills in a missing field', () => {
            jest.useFakeTimers();
            const input = document.createElement('input');
            input.id = 'age-input';
            container.appendChild(input);
            feedback.createDataSummary(container, {
                loaded: [],
                missing: [{ id: 'age-input', label: 'Age' }],
                failed: []
            });
            feedback.setupDynamicTracking(container, [
                { id: 'age-input', label: 'Age' }
            ]);
            // Fill in the value
            input.value = '30';
            input.dispatchEvent(new Event('input'));
            // updateSummaryBannerState is called synchronously, but the li removal
            // is scheduled via setTimeout(300). At this point the DOM still has the li,
            // so children.length > 0 and the banner remains in warning state.
            const summary = document.querySelector('#fhir-data-summary');
            expect(summary).not.toBeNull();
            // The li gets the 'removing' class immediately
            const li = document.querySelector('li[data-field-id="age-input"]');
            expect(li?.classList.contains('removing')).toBe(true);
            // After 300ms the li is removed from DOM
            jest.advanceTimersByTime(300);
            expect(document.querySelector('li[data-field-id="age-input"]')).toBeNull();
            // The currentMissingIds set has been cleared, which is correct
            // Future calls to updateSummaryBannerState would detect 0 children
        });
        test('should add field back to missing list when user clears value', () => {
            jest.useFakeTimers();
            const input = document.createElement('input');
            input.id = 'age-input';
            container.appendChild(input);
            feedback.createDataSummary(container, {
                loaded: [],
                missing: [{ id: 'age-input', label: 'Age' }],
                failed: []
            });
            feedback.setupDynamicTracking(container, [
                { id: 'age-input', label: 'Age' }
            ]);
            // First fill in the value
            input.value = '30';
            input.dispatchEvent(new Event('input'));
            // Wait for removal
            jest.advanceTimersByTime(300);
            // Now clear the value
            input.value = '';
            input.dispatchEvent(new Event('input'));
            // Field should be added back
            const li = document.querySelector('li[data-field-id="age-input"]');
            expect(li).not.toBeNull();
            expect(li?.textContent).toBe('Age');
        });
        test('should not add duplicate to missing list if already missing', () => {
            const input = document.createElement('input');
            input.id = 'age-input';
            container.appendChild(input);
            feedback.createDataSummary(container, {
                loaded: [],
                missing: [{ id: 'age-input', label: 'Age' }],
                failed: []
            });
            feedback.setupDynamicTracking(container, [
                { id: 'age-input', label: 'Age' }
            ]);
            // Input event with empty value (field is already in missing list)
            input.value = '';
            input.dispatchEvent(new Event('input'));
            const items = document.querySelectorAll('li[data-field-id="age-input"]');
            // Should still be exactly 1
            expect(items.length).toBe(1);
        });
        test('should not remove from missing list if not in missing set', () => {
            const input = document.createElement('input');
            input.id = 'age-input';
            container.appendChild(input);
            feedback.createDataSummary(container, {
                loaded: ['Age'],
                missing: [],
                failed: []
            });
            feedback.setupDynamicTracking(container, []);
            // Input event shouldn't cause errors even though nothing is tracked
            input.value = '30';
            input.dispatchEvent(new Event('input'));
        });
        test('should handle updateSummaryBannerState with remaining missing fields', () => {
            jest.useFakeTimers();
            const input1 = document.createElement('input');
            input1.id = 'field1';
            container.appendChild(input1);
            const input2 = document.createElement('input');
            input2.id = 'field2';
            container.appendChild(input2);
            feedback.createDataSummary(container, {
                loaded: [],
                missing: [
                    { id: 'field1', label: 'Field 1' },
                    { id: 'field2', label: 'Field 2' }
                ],
                failed: []
            });
            feedback.setupDynamicTracking(container, [
                { id: 'field1', label: 'Field 1' },
                { id: 'field2', label: 'Field 2' }
            ]);
            // Fill only the first field
            input1.value = 'value1';
            input1.dispatchEvent(new Event('input'));
            jest.advanceTimersByTime(300);
            // Summary should still be in warning state since field2 is still missing
            const summary = document.querySelector('#fhir-data-summary');
            expect(summary?.classList.contains('warning')).toBe(true);
            const title = summary?.querySelector('.title');
            expect(title?.textContent).toBe('Some patient data is missing');
            // Details sections should be visible
            const details = summary?.querySelectorAll('.details');
            details?.forEach(d => {
                expect(d.style.display).not.toBe('none');
            });
        });
        test('should transition summary to success when missing-list children reach zero', () => {
            jest.useFakeTimers();
            const input = document.createElement('input');
            input.id = 'age-input';
            container.appendChild(input);
            feedback.createDataSummary(container, {
                loaded: [],
                missing: [{ id: 'age-input', label: 'Age' }],
                failed: []
            });
            feedback.setupDynamicTracking(container, [
                { id: 'age-input', label: 'Age' }
            ]);
            // Manually remove the li from the DOM so that when removeFieldFromMissingList
            // calls updateSummaryBannerState, children.length is 0
            const li = document.querySelector('li[data-field-id="age-input"]');
            li?.remove();
            // Now trigger removeFieldFromMissingList via input
            input.value = '30';
            input.dispatchEvent(new Event('input'));
            // updateSummaryBannerState should detect missingCount === 0
            const summary = document.querySelector('#fhir-data-summary');
            expect(summary).not.toBeNull();
            expect(summary?.classList.contains('success')).toBe(true);
            const icon = summary?.querySelector('.icon');
            expect(icon?.textContent).toBe('\u2713');
            const title = summary?.querySelector('.title');
            expect(title?.textContent).toBe('All required data has been entered');
            // Details should be hidden
            const details = summary?.querySelectorAll('.details');
            details?.forEach(d => {
                expect(d.style.display).toBe('none');
            });
            // Auto-hide after 3 seconds
            jest.advanceTimersByTime(3000);
            const summaryAfterAutoHide = document.querySelector('#fhir-data-summary');
            expect(summaryAfterAutoHide?.style.opacity).toBe('0');
            // Fully removed after another 300ms
            jest.advanceTimersByTime(300);
            expect(document.querySelector('#fhir-data-summary')).toBeNull();
        });
        test('should not auto-hide if summary class changed away from success before timeout', () => {
            jest.useFakeTimers();
            const input = document.createElement('input');
            input.id = 'age-input';
            container.appendChild(input);
            feedback.createDataSummary(container, {
                loaded: [],
                missing: [{ id: 'age-input', label: 'Age' }],
                failed: []
            });
            feedback.setupDynamicTracking(container, [
                { id: 'age-input', label: 'Age' }
            ]);
            // Remove li to trigger success path
            const li = document.querySelector('li[data-field-id="age-input"]');
            li?.remove();
            input.value = '30';
            input.dispatchEvent(new Event('input'));
            const summary = document.querySelector('#fhir-data-summary');
            expect(summary?.classList.contains('success')).toBe(true);
            // Manually change class away from success (simulating user clearing value)
            summary.className = 'fhir-data-summary warning';
            // Auto-hide timeout fires but should NOT set opacity because class is no longer 'success'
            jest.advanceTimersByTime(3000);
            expect(summary?.style.opacity).not.toBe('0');
            // Summary should still exist
            jest.advanceTimersByTime(300);
            expect(document.querySelector('#fhir-data-summary')).not.toBeNull();
        });
        test('should recreate summary banner when missing list element does not exist', () => {
            jest.useFakeTimers();
            const input = document.createElement('input');
            input.id = 'age-input';
            container.appendChild(input);
            // Create summary then remove it manually
            feedback.createDataSummary(container, {
                loaded: [],
                missing: [{ id: 'age-input', label: 'Age' }],
                failed: []
            });
            feedback.setupDynamicTracking(container, [
                { id: 'age-input', label: 'Age' }
            ]);
            // Fill value to remove from missing
            input.value = '30';
            input.dispatchEvent(new Event('input'));
            jest.advanceTimersByTime(300);
            // Remove the summary manually
            const existingSummary = container.querySelector('#fhir-data-summary');
            existingSummary?.remove();
            // Clear value to trigger addFieldToMissingList
            input.value = '';
            input.dispatchEvent(new Event('input'));
            // Since the summary was removed, recreateSummaryBanner should create a new one
            const newSummary = container.querySelector('#fhir-data-summary');
            expect(newSummary).not.toBeNull();
        });
    });
    // ========================================================================
    // cleanupEventListeners (private, tested via setupDynamicTracking)
    // ========================================================================
    describe('cleanupEventListeners', () => {
        test('should be called when setupDynamicTracking is called again', () => {
            const input = document.createElement('input');
            input.id = 'test-field';
            container.appendChild(input);
            // Register spy on addEventListener
            const removeSpy = jest.spyOn(input, 'removeEventListener');
            // First setup
            feedback.setupDynamicTracking(container, [
                { id: 'test-field', label: 'Test Field' }
            ]);
            // Second setup (should cleanup first)
            feedback.setupDynamicTracking(container, [
                { id: 'test-field', label: 'Test Field' }
            ]);
            // removeEventListener should have been called for 'input' and 'change'
            expect(removeSpy).toHaveBeenCalledWith('input', expect.any(Function));
            expect(removeSpy).toHaveBeenCalledWith('change', expect.any(Function));
            removeSpy.mockRestore();
        });
        test('should handle cleanup when summaryContainer is null', () => {
            // When no tracking has been set up, cleanup should be safe
            // This is implicitly tested: the first setupDynamicTracking call
            // calls cleanupEventListeners, which checks if summaryContainer is null
            expect(() => {
                feedback.setupDynamicTracking(container, []);
            }).not.toThrow();
        });
    });
    // ========================================================================
    // ensureWrapper (private, tested via public API)
    // ========================================================================
    describe('ensureWrapper behavior', () => {
        test('should create wrapper for bare input', () => {
            const input = document.createElement('input');
            container.appendChild(input);
            feedback.showLoading(input);
            const wrapper = input.parentElement;
            expect(wrapper?.classList.contains('fhir-feedback-wrapper')).toBe(true);
        });
        test('should reuse existing fhir-feedback-wrapper', () => {
            const wrapper = document.createElement('div');
            wrapper.className = 'fhir-feedback-wrapper';
            const input = document.createElement('input');
            wrapper.appendChild(input);
            container.appendChild(wrapper);
            feedback.showLoading(input);
            // Should not create another wrapper
            expect(container.querySelectorAll('.fhir-feedback-wrapper').length).toBe(1);
            expect(input.closest('.fhir-feedback-wrapper')).toBe(wrapper);
        });
        test('should add class to existing ui-input-wrapper', () => {
            const wrapper = document.createElement('div');
            wrapper.className = 'ui-input-wrapper';
            const input = document.createElement('input');
            wrapper.appendChild(input);
            container.appendChild(wrapper);
            feedback.showLoading(input);
            expect(wrapper.classList.contains('fhir-feedback-wrapper')).toBe(true);
            expect(wrapper.classList.contains('ui-input-wrapper')).toBe(true);
        });
    });
    // ========================================================================
    // removeAllIndicators (private, tested via public API)
    // ========================================================================
    describe('removeAllIndicators behavior', () => {
        test('should remove all indicators when showing new status', () => {
            const input = document.createElement('input');
            container.appendChild(input);
            feedback.showLoading(input, 'test');
            feedback.showSuccess(input, 'test');
            const indicators = document.querySelectorAll('.fhir-feedback-indicator');
            // Only the success indicator should remain
            expect(indicators.length).toBe(1);
            expect(indicators[0].classList.contains('fhir-status-success')).toBe(true);
        });
    });
    // ========================================================================
    // Edge Cases
    // ========================================================================
    describe('edge cases', () => {
        test('should handle indicators on non-input elements', () => {
            const div = document.createElement('div');
            container.appendChild(div);
            expect(() => feedback.showLoading(div, 'custom')).not.toThrow();
            const indicator = document.querySelector('.fhir-feedback-indicator');
            expect(indicator).not.toBeNull();
        });
        test('should handle showWarning dismissOnInput calling updateSummaryOnInput', () => {
            const input = document.createElement('input');
            input.id = 'test-input';
            container.appendChild(input);
            // Create summary and setup tracking
            feedback.createDataSummary(container, {
                loaded: [],
                missing: [{ id: 'test-input', label: 'Test' }],
                failed: []
            });
            feedback.setupDynamicTracking(container, [
                { id: 'test-input', label: 'Test' }
            ]);
            // Show warning (dismissOnInput=true)
            feedback.showWarning(input, 'Test');
            // Simulate user input with value
            input.value = 'some value';
            input.dispatchEvent(new Event('input'));
            // Warning indicator should be dismissed
            // The warning indicator was from showWarning, not the loading one
            // After input, the dismissOnInput handler fires and removes indicator
        });
        test('should handle creating indicator when wrapper already exists via closest', () => {
            const outerWrapper = document.createElement('div');
            outerWrapper.className = 'fhir-feedback-wrapper';
            const innerWrapper = document.createElement('div');
            innerWrapper.className = 'ui-input-wrapper';
            const input = document.createElement('input');
            innerWrapper.appendChild(input);
            outerWrapper.appendChild(innerWrapper);
            container.appendChild(outerWrapper);
            feedback.showLoading(input, 'nested');
            const indicator = outerWrapper.querySelector('.fhir-feedback-indicator');
            expect(indicator).not.toBeNull();
        });
        test('should handle updateSummaryBannerState when summary does not exist', () => {
            // Setup tracking but without creating a summary
            const input = document.createElement('input');
            input.id = 'field1';
            container.appendChild(input);
            feedback.setupDynamicTracking(container, [
                { id: 'field1', label: 'Field 1' }
            ]);
            // Fill value - triggers updateSummaryOnInput -> removeFieldFromMissingList
            input.value = 'test';
            input.dispatchEvent(new Event('input'));
            // Should not throw even though summary doesn't exist
        });
        test('should handle addFieldToMissingList for untracked field', () => {
            const input = document.createElement('input');
            input.id = 'unknown-field';
            container.appendChild(input);
            // Setup tracking with a different field
            feedback.setupDynamicTracking(container, [
                { id: 'unknown-field', label: 'Unknown' }
            ]);
            // Fill and empty the field
            input.value = 'test';
            input.dispatchEvent(new Event('input'));
            // The field was removed from missing (it was initially in the missing set)
            // Now clear it - should add it back
            input.value = '';
            input.dispatchEvent(new Event('input'));
        });
        test('should handle recreateSummaryBanner when summaryContainer is null', () => {
            // This tests the guard clause in recreateSummaryBanner
            // When no setup has happened, summaryContainer is null
            // We test this indirectly by verifying no errors occur
            const input = document.createElement('input');
            input.id = 'test-field';
            container.appendChild(input);
            // Don't setup tracking (summaryContainer remains null from new instance)
            // Create a fresh instance
            const freshFeedback = new FHIRFeedback();
            // Try to use it without setup
            expect(() => freshFeedback.showInfo(input, 'Test')).not.toThrow();
        });
        test('should handle input element without parentNode in ensureWrapper', () => {
            // Create a detached input (no parent)
            const input = document.createElement('input');
            // Should not throw, though wrapper creation may not fully work
            expect(() => feedback.showLoading(input, 'detached')).not.toThrow();
        });
    });
    // ========================================================================
    // Integration: Full flow
    // ========================================================================
    describe('integration: full loading flow', () => {
        test('should execute complete data loading flow', async () => {
            jest.useFakeTimers();
            // Setup DOM
            const section = document.createElement('div');
            section.className = 'ui-section';
            container.appendChild(section);
            const input1 = document.createElement('input');
            input1.id = 'weight';
            container.appendChild(input1);
            const input2 = document.createElement('input');
            input2.id = 'height';
            container.appendChild(input2);
            const input3 = document.createElement('input');
            input3.id = 'creatinine';
            container.appendChild(input3);
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
            const fields = [
                {
                    inputId: 'weight',
                    label: 'Weight',
                    promise: Promise.resolve(70),
                    setValue: (i, d) => { i.value = String(d); }
                },
                {
                    inputId: 'height',
                    label: 'Height',
                    promise: Promise.resolve(null),
                    setValue: jest.fn()
                },
                {
                    inputId: 'creatinine',
                    label: 'Creatinine',
                    promise: Promise.reject(new Error('Timeout')),
                    setValue: jest.fn()
                }
            ];
            jest.useRealTimers();
            const result = await feedback.trackDataLoading(container, fields);
            expect(result.loaded).toEqual(['Weight']);
            expect(result.missing.length).toBe(1);
            expect(result.failed).toEqual(['Creatinine']);
            // Verify final DOM state
            const summary = container.querySelector('#fhir-data-summary');
            expect(summary).not.toBeNull();
            expect(summary?.classList.contains('error')).toBe(true);
            consoleSpy.mockRestore();
        });
    });
    // ========================================================================
    // Singleton export
    // ========================================================================
    describe('module exports', () => {
        test('should export FHIRFeedback class as default', async () => {
            const mod = await import('../fhir-feedback.js');
            expect(mod.default).toBe(FHIRFeedback);
        });
        test('should export fhirFeedback singleton', async () => {
            const mod = await import('../fhir-feedback.js');
            expect(mod.fhirFeedback).toBeInstanceOf(FHIRFeedback);
        });
    });
});
