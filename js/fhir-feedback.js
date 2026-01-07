// FHIR Data Loading Feedback System
// Provides visual feedback for FHIR data loading status
/** Icons for each feedback status */
const STATUS_ICONS = {
    loading: '⏳',
    success: '✓',
    warning: '⚠️',
    error: '❌',
    info: 'ℹ️'
};
/** CSS classes for each feedback status */
const STATUS_CLASSES = {
    loading: 'fhir-status-loading',
    success: 'fhir-status-success',
    warning: 'fhir-status-warning',
    error: 'fhir-status-error',
    info: 'fhir-status-info'
};
// ============================================================================
// FHIRFeedback Class
// ============================================================================
/**
 * FHIRFeedback - Provides visual feedback for FHIR data loading status
 * Enhances UX by showing users when data is loaded, missing, or failed
 */
export class FHIRFeedback {
    constructor() {
        this.stylesInjected = false;
        this.injectStyles();
    }
    /**
     * Inject CSS styles for feedback components
     * Loads external CSS file or injects minimal fallback
     */
    injectStyles() {
        if (typeof document === 'undefined' || this.stylesInjected)
            return;
        if (document.getElementById('fhir-feedback-styles')) {
            this.stylesInjected = true;
            return;
        }
        // Try to load external CSS
        const link = document.createElement('link');
        link.id = 'fhir-feedback-styles';
        link.rel = 'stylesheet';
        link.href = './css/fhir-feedback.css';
        document.head.appendChild(link);
        this.stylesInjected = true;
    }
    // ========================================================================
    // Core Indicator Methods
    // ========================================================================
    /**
     * Create a feedback indicator element
     * @private
     */
    createIndicator(status, tooltip) {
        const indicator = document.createElement('div');
        indicator.className = `fhir-feedback-indicator ${STATUS_CLASSES[status]}`;
        indicator.innerHTML = `
            <span>${STATUS_ICONS[status]}</span>
            <div class="fhir-feedback-tooltip">${tooltip}</div>
        `;
        return indicator;
    }
    /**
     * Show a feedback indicator on an input element
     * @private
     */
    showIndicator(inputElement, status, tooltip, options = {}) {
        this.removeAllIndicators(inputElement);
        const wrapper = this.ensureWrapper(inputElement);
        const indicator = this.createIndicator(status, tooltip);
        wrapper.appendChild(indicator);
        // Auto-remove after timeout
        if (options.autoRemove) {
            setTimeout(() => {
                indicator.style.opacity = '0';
                setTimeout(() => indicator.remove(), 300);
            }, options.autoRemove);
        }
        // Dismiss on user input
        if (options.dismissOnInput) {
            const handler = () => {
                indicator.remove();
                this.updateSummaryOnInput(inputElement);
                inputElement.removeEventListener('input', handler);
                inputElement.removeEventListener('change', handler);
            };
            inputElement.addEventListener('input', handler);
            inputElement.addEventListener('change', handler);
        }
        return indicator;
    }
    // ========================================================================
    // Public Status Methods
    // ========================================================================
    /**
     * Show loading indicator
     */
    showLoading(inputElement, label = 'data') {
        this.showIndicator(inputElement, 'loading', `Loading ${label} from EHR...`);
    }
    /**
     * Show success indicator (auto-removes after 5 seconds)
     */
    showSuccess(inputElement, label = 'data', value = '') {
        const tooltip = `✓ ${label} loaded from EHR${value ? `: ${value}` : ''}`;
        this.showIndicator(inputElement, 'success', tooltip, { autoRemove: 5000 });
    }
    /**
     * Show warning indicator (dismisses on user input)
     */
    showWarning(inputElement, label = 'data', message = null) {
        const tooltip = message || `⚠️ No ${label} found in EHR. Please enter manually.`;
        this.showIndicator(inputElement, 'warning', tooltip, { dismissOnInput: true });
    }
    /**
     * Show error indicator
     */
    showError(inputElement, label = 'data', error = null) {
        const errorMsg = error?.message || 'Failed to load from EHR';
        this.showIndicator(inputElement, 'error', `❌ ${label}: ${errorMsg}`);
    }
    /**
     * Show info indicator
     */
    showInfo(inputElement, message) {
        this.showIndicator(inputElement, 'info', message);
    }
    // ========================================================================
    // Field Feedback
    // ========================================================================
    /**
     * Add inline field-level feedback message
     */
    addFieldFeedback(inputElement, message, type = 'info') {
        const inputGroup = inputElement.closest('.ui-input-group');
        if (!inputGroup)
            return;
        // Remove existing feedback
        inputGroup.querySelector('.fhir-field-feedback')?.remove();
        const icons = { success: '✓', warning: '⚠️', info: 'ℹ️' };
        const feedback = document.createElement('div');
        feedback.className = `fhir-field-feedback ${type}`;
        feedback.innerHTML = `
            <span class="icon">${icons[type]}</span>
            <span>${message}</span>
        `;
        const wrapper = inputElement.closest('.ui-input-wrapper, .fhir-feedback-wrapper');
        if (wrapper?.parentNode) {
            wrapper.parentNode.insertBefore(feedback, wrapper.nextSibling);
        }
        else if (inputElement.parentNode) {
            inputElement.parentNode.insertBefore(feedback, inputElement.nextSibling);
        }
    }
    // ========================================================================
    // Banner Methods
    // ========================================================================
    /**
     * Create a loading banner for the entire form
     */
    createLoadingBanner(container, message = 'Loading patient data from EHR...') {
        const banner = document.createElement('div');
        banner.className = 'fhir-loading-banner';
        banner.id = 'fhir-loading-banner';
        banner.innerHTML = `
            <div class="spinner"></div>
            <span>${message}</span>
        `;
        const firstSection = container.querySelector('.ui-section, .section');
        container.insertBefore(banner, firstSection || container.firstChild);
        return banner;
    }
    /**
     * Remove loading banner
     */
    removeLoadingBanner(container) {
        const banner = container.querySelector('#fhir-loading-banner');
        if (banner) {
            banner.style.opacity = '0';
            setTimeout(() => banner.remove(), 300);
        }
    }
    // ========================================================================
    // Summary Methods
    // ========================================================================
    /**
     * Create a summary notification showing what data was loaded/missing
     */
    createDataSummary(container, summary) {
        const { loaded = [], missing = [], failed = [] } = summary;
        let type = 'success';
        let icon = '✓';
        let title = 'Patient data loaded successfully';
        if (failed.length > 0) {
            type = 'error';
            icon = '❌';
            title = 'Error loading some patient data';
        }
        else if (missing.length > 0) {
            type = 'warning';
            icon = '⚠️';
            title = 'Some patient data is missing';
        }
        const summaryDiv = document.createElement('div');
        summaryDiv.className = `fhir-data-summary ${type}`;
        summaryDiv.id = 'fhir-data-summary';
        let detailsHTML = '';
        if (loaded.length > 0) {
            detailsHTML += `<div class="details">Loaded: ${loaded.join(', ')}</div>`;
        }
        if (missing.length > 0) {
            const listItems = missing.map(item => {
                if (typeof item === 'string')
                    return `<li>${item}</li>`;
                return `<li data-field-id="${item.id}">${item.label}</li>`;
            }).join('');
            detailsHTML += `
                <div class="details">
                    <strong>Please enter manually:</strong>
                    <ul class="missing-list">${listItems}</ul>
                </div>
            `;
        }
        if (failed.length > 0) {
            const listItems = failed.map(item => `<li>${item}</li>`).join('');
            detailsHTML += `
                <div class="details">
                    <strong>Failed to load:</strong>
                    <ul class="missing-list">${listItems}</ul>
                </div>
            `;
        }
        summaryDiv.innerHTML = `
            <div class="icon">${icon}</div>
            <div class="content">
                <div class="title">${title}</div>
                ${detailsHTML}
            </div>
        `;
        const firstSection = container.querySelector('.ui-section, .section');
        container.insertBefore(summaryDiv, firstSection || container.firstChild);
        return summaryDiv;
    }
    /**
     * Remove data summary
     */
    removeDataSummary(container) {
        container.querySelector('#fhir-data-summary')?.remove();
    }
    // ========================================================================
    // Data Loading Tracker
    // ========================================================================
    /**
     * Track and display FHIR data loading status
     */
    async trackDataLoading(container, dataFields) {
        this.createLoadingBanner(container);
        const results = {
            loaded: [],
            missing: [],
            failed: []
        };
        // Show loading indicators
        dataFields.forEach(field => {
            const input = container.querySelector(`#${field.inputId}`);
            if (input)
                this.showLoading(input, field.label);
        });
        // Process all promises
        await Promise.allSettled(dataFields.map(async (field) => {
            const input = container.querySelector(`#${field.inputId}`);
            if (!input)
                return;
            try {
                const data = await field.promise;
                if (data && field.setValue) {
                    field.setValue(input, data);
                    this.showSuccess(input, field.label, input.value);
                    results.loaded.push(field.label);
                }
                else {
                    this.showWarning(input, field.label);
                    results.missing.push({ id: field.inputId.replace(/^#/, ''), label: field.label });
                }
            }
            catch (error) {
                console.error(`Error loading ${field.label}:`, error);
                this.showError(input, field.label, error);
                results.failed.push(field.label);
            }
        }));
        this.removeLoadingBanner(container);
        this.createDataSummary(container, results);
        return results;
    }
    // ========================================================================
    // Private Helpers
    // ========================================================================
    /**
     * Ensure input is wrapped for positioning indicators
     * @private
     */
    ensureWrapper(inputElement) {
        let wrapper = inputElement.closest('.fhir-feedback-wrapper');
        if (!wrapper) {
            const existingWrapper = inputElement.closest('.ui-input-wrapper');
            if (existingWrapper && !existingWrapper.classList.contains('fhir-feedback-wrapper')) {
                existingWrapper.classList.add('fhir-feedback-wrapper');
                wrapper = existingWrapper;
            }
            else if (!existingWrapper) {
                wrapper = document.createElement('div');
                wrapper.className = 'fhir-feedback-wrapper';
                inputElement.parentNode?.insertBefore(wrapper, inputElement);
                wrapper.appendChild(inputElement);
            }
        }
        return wrapper;
    }
    /**
     * Remove all indicators from an input
     * @private
     */
    removeAllIndicators(inputElement) {
        const wrapper = inputElement.closest('.fhir-feedback-wrapper, .ui-input-wrapper');
        wrapper?.querySelectorAll('.fhir-feedback-indicator').forEach(ind => ind.remove());
    }
    /**
     * Update summary when user fills in missing field
     * @private
     */
    updateSummaryOnInput(inputElement) {
        const fieldId = inputElement.id;
        const summaryItem = document.querySelector(`#fhir-data-summary li[data-field-id="${fieldId}"]`);
        if (summaryItem) {
            summaryItem.remove();
            const summaryList = document.querySelector('#fhir-data-summary .missing-list');
            if (summaryList && summaryList.children.length === 0) {
                document.querySelector('#fhir-data-summary')?.remove();
            }
        }
    }
}
// ============================================================================
// Singleton Instance
// ============================================================================
export const fhirFeedback = new FHIRFeedback();
export default FHIRFeedback;
