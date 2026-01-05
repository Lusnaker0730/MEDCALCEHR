// FHIR Data Loading Feedback System

/**
 * FHIRFeedback - Provides visual feedback for FHIR data loading status
 * Enhances UX by showing users when data is loaded, missing, or failed
 */
export class FHIRFeedback {
    constructor() {
        this.injectStyles();
    }

    /**
     * Inject CSS styles for feedback components
     */
    injectStyles(): void {
        if (typeof document === 'undefined') return;
        if (document.getElementById('fhir-feedback-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'fhir-feedback-styles';
        style.textContent = `
            /* FHIR Feedback Styles */
            .fhir-feedback-wrapper {
                position: relative;
            }

            .fhir-feedback-indicator {
                position: absolute;
                top: 50%;
                right: -30px;
                transform: translateY(-50%);
                font-size: 18px;
                cursor: help;
                z-index: 10;
                transition: all 0.3s ease;
            }

            .fhir-feedback-indicator:hover {
                transform: translateY(-50%) scale(1.2);
            }

            .fhir-feedback-tooltip {
                position: absolute;
                top: 50%;
                right: -35px;
                transform: translateY(-50%) translateX(100%);
                background: #2c3e50;
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 0.85em;
                white-space: nowrap;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease, transform 0.3s ease;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 1000;
            }

            .fhir-feedback-tooltip::before {
                content: '';
                position: absolute;
                top: 50%;
                left: -6px;
                transform: translateY(-50%);
                width: 0;
                height: 0;
                border-style: solid;
                border-width: 6px 6px 6px 0;
                border-color: transparent #2c3e50 transparent transparent;
            }

            .fhir-feedback-indicator:hover .fhir-feedback-tooltip {
                opacity: 1;
                transform: translateY(-50%) translateX(calc(100% + 5px));
            }

            .fhir-status-loading {
                color: #3498db;
                animation: pulse 1.5s ease-in-out infinite;
            }

            .fhir-status-success {
                color: #27ae60;
            }

            .fhir-status-warning {
                color: #f39c12;
            }

            .fhir-status-error {
                color: #e74c3c;
            }

            .fhir-status-info {
                color: #3498db;
            }

            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }

            /* Loading banner */
            .fhir-loading-banner {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 12px 16px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 8px;
                margin-bottom: 20px;
                font-size: 0.9em;
                box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
            }

            .fhir-loading-banner .spinner {
                width: 16px;
                height: 16px;
                border: 2px solid rgba(255,255,255,0.3);
                border-top-color: white;
                border-radius: 50%;
                animation: spin 0.8s linear infinite;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            /* Summary notification */
            .fhir-data-summary {
                padding: 12px 16px;
                border-radius: 8px;
                margin-bottom: 20px;
                font-size: 0.9em;
                display: flex;
                align-items: flex-start;
                gap: 10px;
            }

            .fhir-data-summary.success {
                background: #d4edda;
                border-left: 4px solid #27ae60;
                color: #155724;
            }

            .fhir-data-summary.warning {
                background: #fff3cd;
                border-left: 4px solid #f39c12;
                color: #856404;
            }

            .fhir-data-summary.error {
                background: #f8d7da;
                border-left: 4px solid #e74c3c;
                color: #721c24;
            }

            .fhir-data-summary .icon {
                font-size: 1.2em;
                flex-shrink: 0;
            }

            .fhir-data-summary .content {
                flex: 1;
            }

            .fhir-data-summary .title {
                font-weight: 600;
                margin-bottom: 4px;
            }

            .fhir-data-summary .details {
                font-size: 0.95em;
                opacity: 0.9;
            }

            .fhir-data-summary .missing-list {
                margin-top: 8px;
                padding-left: 20px;
            }

            .fhir-data-summary .missing-list li {
                margin-bottom: 4px;
            }

            /* Inline field feedback */
            .fhir-field-feedback {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-top: 6px;
                font-size: 0.85em;
                padding: 6px 10px;
                border-radius: 6px;
            }

            .fhir-field-feedback.success {
                background: #d4edda;
                color: #155724;
            }

            .fhir-field-feedback.warning {
                background: #fff3cd;
                color: #856404;
            }

            .fhir-field-feedback.info {
                background: #d1ecf1;
                color: #0c5460;
            }

            .fhir-field-feedback .icon {
                flex-shrink: 0;
            }

            /* Mobile responsive */
            @media (max-width: 768px) {
                .fhir-feedback-indicator {
                    right: -25px;
                    font-size: 16px;
                }

                .fhir-feedback-tooltip {
                    font-size: 0.8em;
                    max-width: 200px;
                    white-space: normal;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Add loading indicator to an input field
     * @param {HTMLElement} inputElement - The input element
     * @param {string} label - Field label for tooltip
     */
    showLoading(inputElement: HTMLElement, label: string = 'data'): void {
        this.removeAllIndicators(inputElement);

        const wrapper = this.ensureWrapper(inputElement);
        const indicator = document.createElement('div');
        indicator.className = 'fhir-feedback-indicator fhir-status-loading';
        indicator.innerHTML = `
            <span>⏳</span>
            <div class="fhir-feedback-tooltip">Loading ${label} from EHR...</div>
        `;
        wrapper.appendChild(indicator);
    }

    /**
     * Show success indicator when data is loaded
     * @param {HTMLElement} inputElement
     * @param {string} label
     * @param {string} value - The loaded value
     */
    showSuccess(inputElement: HTMLElement, label: string = 'data', value: string = ''): void {
        this.removeAllIndicators(inputElement);

        const wrapper = this.ensureWrapper(inputElement);
        const indicator = document.createElement('div');
        indicator.className = 'fhir-feedback-indicator fhir-status-success';
        indicator.innerHTML = `
            <span>✓</span>
            <div class="fhir-feedback-tooltip">✓ ${label} loaded from EHR${value ? `: ${value}` : ''}</div>
        `;
        wrapper.appendChild(indicator);

        // Auto-remove success indicator after 5 seconds
        setTimeout(() => {
            indicator.style.opacity = '0';
            setTimeout(() => indicator.remove(), 300);
        }, 5000);
    }

    /**
     * Show warning when data is missing or unavailable
     * @param {HTMLElement} inputElement
     * @param {string} label
     * @param {string} message - Custom warning message
     */
    showWarning(
        inputElement: HTMLElement,
        label: string = 'data',
        message: string | null = null
    ): void {
        this.removeAllIndicators(inputElement);

        const wrapper = this.ensureWrapper(inputElement);
        const indicator = document.createElement('div');
        indicator.className = 'fhir-feedback-indicator fhir-status-warning';
        const defaultMessage = `⚠️ No ${label} found in EHR. Please enter manually.`;
        indicator.innerHTML = `
            <span>⚠️</span>
            <div class="fhir-feedback-tooltip">${message || defaultMessage}</div>
        `;
        wrapper.appendChild(indicator);

        // Auto-dismiss on user input
        const dismissHandler = () => {
            indicator.remove();

            // Also update summary banner if present
            const fieldId = inputElement.id;
            const summaryItem = document.querySelector(`#fhir-data-summary li[data-field-id="${fieldId}"]`);

            if (summaryItem) {
                summaryItem.remove();

                // Check if list is empty
                const summaryList = document.querySelector('#fhir-data-summary .missing-list');
                if (summaryList && summaryList.children.length === 0) {
                    const summaryBlock = document.querySelector('#fhir-data-summary');
                    if (summaryBlock) summaryBlock.remove();
                }
            } else {
                // Fallback to text matching for legacy/manual calls
                const summaryList = document.querySelector('#fhir-data-summary .missing-list');
                if (summaryList) {
                    const items = Array.from(summaryList.querySelectorAll('li'));
                    const matchedItem = items.find(li => li.textContent?.includes(label) && !li.hasAttribute('data-field-id'));
                    if (matchedItem) {
                        matchedItem.remove();
                        if (summaryList.children.length === 0) {
                            const summaryBlock = document.querySelector('#fhir-data-summary');
                            if (summaryBlock) summaryBlock.remove();
                        }
                    }
                }
            }

            inputElement.removeEventListener('input', dismissHandler);
            inputElement.removeEventListener('change', dismissHandler);
        };

        inputElement.addEventListener('input', dismissHandler);
        inputElement.addEventListener('change', dismissHandler);
    }

    /**
     * Show error indicator when loading fails
     * @param {HTMLElement} inputElement
     * @param {string} label
     * @param {Error} error - The error object
     */
    showError(inputElement: HTMLElement, label: string = 'data', error: Error | null = null): void {
        this.removeAllIndicators(inputElement);

        const wrapper = this.ensureWrapper(inputElement);
        const indicator = document.createElement('div');
        indicator.className = 'fhir-feedback-indicator fhir-status-error';
        const errorMsg = error ? error.message : 'Failed to load from EHR';
        indicator.innerHTML = `
            <span>❌</span>
            <div class="fhir-feedback-tooltip">❌ ${label}: ${errorMsg}</div>
        `;
        wrapper.appendChild(indicator);
    }

    /**
     * Show info indicator
     * @param {HTMLElement} inputElement
     * @param {string} message
     */
    showInfo(inputElement: HTMLElement, message: string): void {
        this.removeAllIndicators(inputElement);

        const wrapper = this.ensureWrapper(inputElement);
        const indicator = document.createElement('div');
        indicator.className = 'fhir-feedback-indicator fhir-status-info';
        indicator.innerHTML = `
            <span>ℹ️</span>
            <div class="fhir-feedback-tooltip">${message}</div>
        `;
        wrapper.appendChild(indicator);
    }

    /**
     * Add inline field-level feedback message
     * @param {HTMLElement} inputElement
     * @param {string} message
     * @param {string} type - 'success', 'warning', 'info'
     */
    addFieldFeedback(
        inputElement: HTMLElement,
        message: string,
        type: 'success' | 'warning' | 'info' = 'info'
    ): void {
        const inputGroup = inputElement.closest('.ui-input-group');
        if (!inputGroup) return;

        // Remove existing feedback
        const existing = inputGroup.querySelector('.fhir-field-feedback');
        if (existing) existing.remove();

        const icons = {
            success: '✓',
            warning: '⚠️',
            info: 'ℹ️'
        };

        const feedback = document.createElement('div');
        feedback.className = `fhir-field-feedback ${type}`;
        feedback.innerHTML = `
            <span class="icon">${icons[type]}</span>
            <span>${message}</span>
        `;

        const wrapper =
            inputElement.closest('.ui-input-wrapper') ||
            inputElement.closest('.fhir-feedback-wrapper');
        if (wrapper && wrapper.parentNode) {
            wrapper.parentNode.insertBefore(feedback, wrapper.nextSibling);
        } else if (inputElement.parentNode) {
            inputElement.parentNode.insertBefore(feedback, inputElement.nextSibling);
        }
    }

    /**
     * Create a loading banner for the entire form
     * @param {HTMLElement} container
     * @param {string} message
     * @returns {HTMLElement} The banner element
     */
    createLoadingBanner(
        container: HTMLElement,
        message: string = 'Loading patient data from EHR...'
    ): HTMLElement {
        const banner = document.createElement('div');
        banner.className = 'fhir-loading-banner';
        banner.id = 'fhir-loading-banner';
        banner.innerHTML = `
            <div class="spinner"></div>
            <span>${message}</span>
        `;

        const firstSection = container.querySelector('.ui-section, .section');
        if (firstSection) {
            container.insertBefore(banner, firstSection);
        } else {
            container.insertBefore(banner, container.firstChild);
        }

        return banner;
    }

    /**
     * Remove loading banner
     * @param {HTMLElement} container
     */
    removeLoadingBanner(container: HTMLElement): void {
        const banner = container.querySelector('#fhir-loading-banner') as HTMLElement;
        if (banner) {
            banner.style.opacity = '0';
            setTimeout(() => banner.remove(), 300);
        }
    }

    /**
     * Create a summary notification showing what data was loaded/missing
     * @param {HTMLElement} container
     * @param {Object} summary - { loaded: [], missing: [], failed: [] }
     */
    createDataSummary(container: HTMLElement, summary: any): HTMLElement {
        const { loaded = [], missing = [], failed = [] } = summary;

        let type = 'success';
        let icon = '✓';
        let title = 'Patient data loaded successfully';

        if (failed.length > 0) {
            type = 'error';
            icon = '❌';
            title = 'Error loading some patient data';
        } else if (missing.length > 0) {
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
            detailsHTML += `
                <div class="details">
                    <strong>Please enter manually:</strong>
                    <ul class="missing-list">

                        ${missing
                    .map((item: string | { id: string; label: string }) => {
                        if (typeof item === 'string') {
                            return `<li>${item}</li>`;
                        }
                        return `<li data-field-id="${item.id}">${item.label}</li>`;
                    })
                    .join('')}
                    </ul>
                </div>
            `;
        }

        if (failed.length > 0) {
            detailsHTML += `
                <div class="details">
                    <strong>Failed to load:</strong>
                    <ul class="missing-list">
                        ${failed.map((item: string) => `<li>${item}</li>`).join('')}
                    </ul>
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
        if (firstSection) {
            container.insertBefore(summaryDiv, firstSection);
        } else {
            container.insertBefore(summaryDiv, container.firstChild);
        }

        return summaryDiv;
    }

    /**
     * Remove data summary
     * @param {HTMLElement} container
     */
    removeDataSummary(container: HTMLElement): void {
        const summary = container.querySelector('#fhir-data-summary');
        if (summary) summary.remove();
    }

    /**
     * Helper: Ensure input is wrapped for positioning indicators
     * @private
     */
    private ensureWrapper(inputElement: HTMLElement): HTMLElement {
        let wrapper = inputElement.closest('.fhir-feedback-wrapper') as HTMLElement;

        if (!wrapper) {
            // Check if already in a ui-input-wrapper
            const existingWrapper = inputElement.closest('.ui-input-wrapper') as HTMLElement;
            if (existingWrapper && !existingWrapper.classList.contains('fhir-feedback-wrapper')) {
                existingWrapper.classList.add('fhir-feedback-wrapper');
                wrapper = existingWrapper;
            } else if (!existingWrapper) {
                // Create new wrapper
                wrapper = document.createElement('div');
                wrapper.className = 'fhir-feedback-wrapper';
                if (inputElement.parentNode) {
                    inputElement.parentNode.insertBefore(wrapper, inputElement);
                }
                wrapper.appendChild(inputElement);
            }
        }

        return wrapper;
    }

    /**
     * Remove all indicators from an input
     * @private
     */
    private removeAllIndicators(inputElement: HTMLElement): void {
        const wrapper = inputElement.closest('.fhir-feedback-wrapper, .ui-input-wrapper');
        if (wrapper) {
            const indicators = wrapper.querySelectorAll('.fhir-feedback-indicator');
            indicators.forEach(ind => ind.remove());
        }
    }

    /**
     * Helper method to track and display FHIR data loading status
     * @param {HTMLElement} container
     * @param {Array} dataFields - Array of { inputId, label, promise }
     * @returns {Promise} Resolves with summary
     */
    async trackDataLoading(container: HTMLElement, dataFields: any[]): Promise<any> {
        // Show loading banner
        this.createLoadingBanner(container);

        const results: { loaded: string[]; missing: (string | { id: string; label: string })[]; failed: string[] } = {
            loaded: [],
            missing: [],
            failed: []
        };

        // Show loading indicators on all fields
        dataFields.forEach(field => {
            const input = container.querySelector(`#${field.inputId}`) as HTMLElement;
            if (input) {
                this.showLoading(input, field.label);
            }
        });

        // Process all promises
        await Promise.allSettled(
            dataFields.map(async field => {
                const input = container.querySelector(`#${field.inputId}`) as HTMLInputElement;
                if (!input) return;

                try {
                    const data = await field.promise;

                    if (data && field.setValue) {
                        field.setValue(input, data);
                        this.showSuccess(input, field.label, input.value);
                        results.loaded.push(field.label);
                    } else {
                        this.showWarning(input, field.label);
                        results.missing.push({
                            id: field.inputId.replace(/^#/, ''),
                            label: field.label
                        });
                    }
                } catch (error: any) {
                    console.error(`Error loading ${field.label}:`, error);
                    this.showError(input, field.label, error);
                    results.failed.push(field.label);
                }
            })
        );

        // Remove loading banner and show summary
        this.removeLoadingBanner(container);
        this.createDataSummary(container, results);

        return results;
    }
}

// Create and export singleton instance
export const fhirFeedback = new FHIRFeedback();

export default FHIRFeedback;
