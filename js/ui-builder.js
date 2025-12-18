// js/ui-builder.js
// Universal UI Component Builder for MedCalcEHR Calculators

import { UnitConverter } from './unit-converter.js';

/**
 * UIBuilder - A comprehensive UI component generation system
 * Provides consistent styling and behavior across all calculators
 */
export class UIBuilder {
    constructor() {
        this.defaultStyles = this.injectStyles();
    }

    /**
     * Inject default styles for UI components
     */
    injectStyles() {
        if (document.getElementById('ui-builder-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'ui-builder-styles';
        style.textContent = `
            /* UI Builder - Base Styles */
            .ui-section {
                background: #ffffff;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 20px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            }

            .ui-section-title {
                font-size: 1.1em;
                font-weight: 600;
                color: #2c3e50;
                margin-bottom: 15px;
                padding-bottom: 10px;
                border-bottom: 2px solid #e8f4f8;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .ui-section-subtitle {
                font-size: 0.95em;
                font-weight: 600;
                color: #5a6c7d;
                margin: 15px 0 10px 0;
            }

            /* Result Box */
            .ui-result-box {
                margin-top: 20px;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                background: #ffffff;
                display: none;
            }

            .ui-result-box.show {
                display: block;
                animation: slideDown 0.3s ease-out;
            }

            .ui-result-header {
                padding: 15px 20px;
                background: #f8f9fa;
                border-bottom: 1px solid #e9ecef;
                font-weight: 600;
                color: #2c3e50;
            }

            .ui-result-content {
                padding: 20px;
            }

            .ui-result-score {
                text-align: center;
                margin-bottom: 15px;
            }

            .ui-result-value {
                font-size: 2.5em;
                font-weight: 700;
                color: #2c3e50;
                line-height: 1;
            }

            .ui-result-unit {
                font-size: 1em;
                color: #7f8c8d;
                margin-left: 5px;
            }

            .ui-result-interpretation {
                text-align: center;
                font-size: 1.1em;
                margin-top: 10px;
                padding: 10px;
                background: #f8f9fa;
                border-radius: 8px;
            }

            /* Alerts */
            .ui-alert {
                display: flex;
                gap: 12px;
                padding: 15px;
                border-radius: 8px;
                margin-top: 15px;
                border-left: 4px solid transparent;
            }

            .ui-alert-info {
                background: #e8f4f8;
                border-left-color: #3498db;
                color: #2980b9;
            }

            .ui-alert-warning {
                background: #fef9e7;
                border-left-color: #f1c40f;
                color: #f39c12;
            }

            .ui-alert-danger {
                background: #fdedec;
                border-left-color: #e74c3c;
                color: #c0392b;
            }

            .ui-alert-icon {
                font-size: 1.2em;
            }

            /* Formula Section */
            .ui-formula-section {
                margin-top: 25px;
                padding: 20px;
                background: #f8f9fa;
                border-radius: 12px;
                border: 1px solid #e9ecef;
            }

            .ui-formula-title {
                font-weight: 600;
                color: #2c3e50;
                margin-bottom: 12px;
                font-size: 0.95em;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .ui-formula-item {
                margin-bottom: 10px;
                font-size: 0.9em;
                color: #34495e;
            }

            .ui-formula-math {
                font-family: 'Courier New', monospace;
                background: #ffffff;
                padding: 8px 12px;
                border-radius: 6px;
                border: 1px solid #e9ecef;
                margin-top: 4px;
                display: block;
            }

            @keyframes slideDown {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            /* Input Group */
            .ui-input-group {
                margin-bottom: 15px;
            }

            .ui-input-group label {
                display: block;
                font-weight: 500;
                color: #34495e;
                margin-bottom: 6px;
                font-size: 0.9em;
            }

            .ui-input-group label .required {
                color: #e74c3c;
                margin-left: 2px;
            }

            .ui-input-group .help-text {
                font-size: 0.85em;
                color: #7f8c8d;
                margin-top: 4px;
                font-style: italic;
            }

            /* Text Input */
            .ui-input-wrapper {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .ui-input {
                flex: 1;
                padding: 10px 12px;
                border: 2px solid #e0e6ed;
                border-radius: 8px;
                font-size: 1em;
                transition: all 0.3s ease;
                background: #fafbfc;
            }

            .ui-input:focus {
                outline: none;
                border-color: #3498db;
                background: #ffffff;
                box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
            }

            .ui-input:disabled {
                background: #ecf0f1;
                cursor: not-allowed;
            }

            .ui-input.error {
                border-color: #e74c3c;
            }

            .ui-input-unit {
                padding: 8px 12px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border-radius: 6px;
                font-weight: 600;
                font-size: 0.9em;
                min-width: 50px;
                text-align: center;
            }

            /* Radio Group */
            .ui-radio-group {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                margin-top: 8px;
            }

            .ui-radio-option {
                position: relative;
                flex: 1;
                min-width: 120px;
            }

            .ui-radio-option input[type="radio"] {
                position: absolute;
                opacity: 0;
                pointer-events: none;
            }

            .ui-radio-option .radio-label {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 12px 16px;
                border: 2px solid #dfe6e9;
                border-radius: 10px;
                background: #ffffff;
                cursor: pointer;
                transition: all 0.3s ease;
                font-weight: 500;
                color: #2d3436;
                text-align: center;
                user-select: none;
            }

            .ui-radio-option input[type="radio"]:checked + .radio-label {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-color: #667eea;
                color: white;
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                transform: translateY(-2px);
            }

            .ui-radio-option .radio-label:hover {
                border-color: #667eea;
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }

            .ui-radio-option input[type="radio"]:disabled + .radio-label {
                opacity: 0.5;
                cursor: not-allowed;
            }

            /* Checkbox Group */
            .ui-checkbox-group {
                display: flex;
                flex-direction: column;
                gap: 10px;
                margin-top: 8px;
            }

            .ui-checkbox-option {
                position: relative;
            }

            .ui-checkbox-option input[type="checkbox"] {
                position: absolute;
                opacity: 0;
                pointer-events: none;
            }

            .ui-checkbox-option .checkbox-label {
                display: flex;
                align-items: center;
                padding: 12px 16px;
                border: 2px solid #dfe6e9;
                border-radius: 10px;
                background: #ffffff;
                cursor: pointer;
                transition: all 0.3s ease;
                color: #2d3436;
                user-select: none;
            }

            .ui-checkbox-option .checkbox-label::before {
                content: '';
                display: inline-block;
                width: 22px;
                height: 22px;
                border: 2px solid #bdc3c7;
                border-radius: 6px;
                margin-right: 12px;
                transition: all 0.3s ease;
                background: #ffffff;
            }

            .ui-checkbox-option input[type="checkbox"]:checked + .checkbox-label {
                background: #e8f4f8;
                border-color: #3498db;
            }

            .ui-checkbox-option input[type="checkbox"]:checked + .checkbox-label::before {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-color: #667eea;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z'/%3E%3C/svg%3E");
                background-size: 18px;
                background-position: center;
                background-repeat: no-repeat;
            }

            .ui-checkbox-option .checkbox-label:hover {
                border-color: #3498db;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }

            .ui-checkbox-option .checkbox-description {
                font-size: 0.85em;
                color: #7f8c8d;
                margin-top: 4px;
                padding-left: 34px;
            }

            /* Select Dropdown */
            .ui-select {
                width: 100%;
                padding: 10px 12px;
                border: 2px solid #e0e6ed;
                border-radius: 8px;
                font-size: 1em;
                background: #fafbfc;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .ui-select:focus {
                outline: none;
                border-color: #3498db;
                background: #ffffff;
                box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
            }

            /* Button Group */
            .ui-button-group {
                display: flex;
                gap: 10px;
                margin-top: 20px;
            }

            .ui-button {
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                font-size: 1em;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .ui-button-primary {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            }

            .ui-button-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
            }

            .ui-button-secondary {
                background: #ecf0f1;
                color: #2c3e50;
            }

            .ui-button-secondary:hover {
                background: #bdc3c7;
            }

            /* Range Slider */
            .ui-range-group {
                margin-top: 8px;
            }

            .ui-range-slider {
                width: 100%;
                height: 8px;
                border-radius: 4px;
                background: #dfe6e9;
                outline: none;
                -webkit-appearance: none;
            }

            .ui-range-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                cursor: pointer;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            }

            .ui-range-slider::-moz-range-thumb {
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                cursor: pointer;
                border: none;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            }

            .ui-range-value {
                display: inline-block;
                margin-top: 8px;
                padding: 4px 12px;
                background: #e8f4f8;
                border-radius: 6px;
                font-weight: 600;
                color: #2c3e50;
            }

            /* Responsive Design */
            @media (max-width: 768px) {
                .ui-radio-group {
                    flex-direction: column;
                }

                .ui-radio-option {
                    min-width: 100%;
                }

                .ui-section {
                    padding: 15px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Create a section container
     * @param {Object} options - { title, subtitle, content }
     */
    createSection({ title, subtitle, icon, content = '' }) {
        const iconHTML = icon ? `<span class="section-icon">${icon}</span>` : '';
        return `
            <div class="ui-section">
                ${title ? `<div class="ui-section-title">${iconHTML}${title}</div>` : ''}
                ${subtitle ? `<div class="ui-section-subtitle">${subtitle}</div>` : ''}
                ${content}
            </div>
        `;
    }

    /**
     * Create a text input field
     * @param {Object} options - Configuration object
     */
    createInput({
        id,
        label,
        type = 'number',
        placeholder = '',
        required = false,
        unit = null,
        unitToggle = null, // { type: 'weight', units: ['kg', 'lbs'] }
        helpText = '',
        min,
        max,
        step,
        defaultValue = ''
    }) {
        const requiredMark = required ? '<span class="required">*</span>' : '';
        const unitHTML = unit ? `<span class="ui-input-unit">${unit}</span>` : '';
        const helpHTML = helpText ? `<div class="help-text">${helpText}</div>` : '';

        let attrs = `id="${id}" type="${type}" placeholder="${placeholder}"`;
        if (min !== undefined) attrs += ` min="${min}"`;
        if (max !== undefined) attrs += ` max="${max}"`;
        if (step !== undefined) attrs += ` step="${step}"`;
        if (defaultValue) attrs += ` value="${defaultValue}"`;
        if (required) attrs += ` required`;

        // Add data attribute for unit toggle if specified
        const toggleData = unitToggle ? `data-unit-toggle='${JSON.stringify(unitToggle)}'` : '';

        return `
            <div class="ui-input-group">
                <label for="${id}">${label}${requiredMark}</label>
                <div class="ui-input-wrapper" ${toggleData}>
                    <input class="ui-input" ${attrs}>
                    ${unitHTML}
                </div>
                ${helpHTML}
            </div>
        `;
    }

    /**
     * Create a radio button group
     * @param {Object} options - Configuration object
     */
    createRadioGroup({
        name,
        label,
        options = [], // [{ value, label, checked }]
        required = false,
        helpText = ''
    }) {
        const requiredMark = required ? '<span class="required">*</span>' : '';
        const helpHTML = helpText ? `<div class="help-text">${helpText}</div>` : '';

        const optionsHTML = options.map((opt, index) => {
            const checked = opt.checked ? 'checked' : '';
            const disabled = opt.disabled ? 'disabled' : '';
            const id = opt.id || `${name}-${opt.value}-${index}`;
            return `
                <div class="ui-radio-option">
                    <input type="radio" 
                           id="${id}" 
                           name="${name}" 
                           value="${opt.value}" 
                           ${checked} 
                           ${disabled}>
                    <label for="${id}" class="radio-label">
                        ${opt.label}
                    </label>
                </div>
            `;
        }).join('');

        return `
            <div class="ui-input-group">
                ${label ? `<label>${label}${requiredMark}</label>` : ''}
                <div class="ui-radio-group">
                    ${optionsHTML}
                </div>
                ${helpHTML}
            </div>
        `;
    }

    /**
     * Create a checkbox group
     * @param {Object} options - Configuration object
     */
    createCheckboxGroup({
        name,
        label,
        options = [], // [{ value, label, description, checked }]
        helpText = ''
    }) {
        const helpHTML = helpText ? `<div class="help-text">${helpText}</div>` : '';

        const optionsHTML = options.map((opt, index) => {
            const checked = opt.checked ? 'checked' : '';
            const disabled = opt.disabled ? 'disabled' : '';
            const id = opt.id || `${name}-${index}`;
            const descHTML = opt.description ? `<div class="checkbox-description">${opt.description}</div>` : '';

            return `
                <div class="ui-checkbox-option">
                    <input type="checkbox" 
                           id="${id}" 
                           name="${name}" 
                           value="${opt.value}" 
                           ${checked} 
                           ${disabled}>
                    <label for="${id}" class="checkbox-label">
                        ${opt.label}
                    </label>
                    ${descHTML}
                </div>
            `;
        }).join('');

        return `
            <div class="ui-input-group">
                ${label ? `<label>${label}</label>` : ''}
                <div class="ui-checkbox-group">
                    ${optionsHTML}
                </div>
                ${helpHTML}
            </div>
        `;
    }

    /**
     * Create a single checkbox
     * @param {Object} options - Configuration object
     */
    createCheckbox({
        id,
        label,
        value = '1',
        checked = false,
        description = ''
    }) {
        const checkedAttr = checked ? 'checked' : '';
        const descHTML = description ? `<div class="checkbox-description">${description}</div>` : '';

        return `
            <div class="ui-checkbox-option">
                <input type="checkbox" 
                       id="${id}" 
                       value="${value}" 
                       ${checkedAttr}>
                <label for="${id}" class="checkbox-label">
                    ${label}
                </label>
                ${descHTML}
            </div>
        `;
    }

    /**
     * Create a select dropdown
     * @param {Object} options - Configuration object
     */
    createSelect({
        id,
        label,
        options = [], // [{ value, label, selected }]
        required = false,
        helpText = ''
    }) {
        const requiredMark = required ? '<span class="required">*</span>' : '';
        const helpHTML = helpText ? `<div class="help-text">${helpText}</div>` : '';

        const optionsHTML = options.map(opt => {
            const selected = opt.selected ? 'selected' : '';
            return `<option value="${opt.value}" ${selected}>${opt.label}</option>`;
        }).join('');

        return `
            <div class="ui-input-group">
                <label for="${id}">${label}${requiredMark}</label>
                <select class="ui-select" id="${id}">
                    ${optionsHTML}
                </select>
                ${helpHTML}
            </div>
        `;
    }

    /**
     * Create a range slider
     * @param {Object} options - Configuration object
     */
    createRange({
        id,
        label,
        min = 0,
        max = 100,
        step = 1,
        defaultValue = 50,
        unit = '',
        showValue = true
    }) {
        return `
            <div class="ui-input-group">
                <label for="${id}">${label}</label>
                <div class="ui-range-group">
                    <input type="range" 
                           class="ui-range-slider" 
                           id="${id}" 
                           min="${min}" 
                           max="${max}" 
                           step="${step}" 
                           value="${defaultValue}">
                    ${showValue ? `<span class="ui-range-value" id="${id}-value">${defaultValue}${unit}</span>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Create a result box container
     * @param {Object} options - { id, title, content }
     */
    createResultBox({ id, title = 'Results' }) {
        return `
            <div id="${id}" class="ui-result-box">
                <div class="ui-result-header">${title}</div>
                <div class="ui-result-content"></div>
            </div>
        `;
    }

    /**
     * Helper to create result item HTML
     */
    createResultItem({ label, value, unit = '', interpretation = '', alertClass = '' }) {
        let html = `
            <div class="ui-result-score">
                ${label ? `<div class="ui-section-subtitle" style="text-align:center; margin-top:0;">${label}</div>` : ''}
                <div class="ui-result-value">${value}<span class="ui-result-unit">${unit}</span></div>
            </div>
        `;

        if (interpretation) {
            html += `<div class="ui-result-interpretation ${alertClass}">${interpretation}</div>`;
        }

        return html;
    }

    /**
     * Helper to create alert HTML
     */
    createAlert({ type = 'info', message, icon }) {
        const icons = {
            info: 'ℹ️',
            warning: '⚠️',
            danger: '🚫',
            success: '✅'
        };
        const alertIcon = icon || icons[type] || icons.info;

        return `
            <div class="ui-alert ui-alert-${type}">
                <span class="ui-alert-icon">${alertIcon}</span>
                <div class="ui-alert-content">${message}</div>
            </div>
        `;
    }

    /**
     * Create a formula section
     * @param {Object} options - { items: [{ label, formula, notes }] }
     */
    createFormulaSection({ items = [] }) {
        const itemsHTML = items.map(item => {
            const label = item.label || item.title || 'Formula';
            const formulaText = item.formula || item.content || '';
            const formulaContent = Array.isArray(item.formulas)
                ? item.formulas.map(f => `<div>${f}</div>`).join('')
                : formulaText;

            const notesHTML = item.notes ? `<div style="margin-top:5px; font-style:italic; color:#666;">${item.notes}</div>` : '';

            return `
            <div class="ui-formula-item">
                <strong>${label}:</strong>
                <div class="ui-formula-math">${formulaContent}</div>
                ${notesHTML}
            </div>
        `}).join('');

        return `
            <div class="ui-formula-section">
                <div class="ui-formula-title">Formulas</div>
                ${itemsHTML}
            </div>
        `;
    }

    /**
     * Helper to set radio group value programmatically
     * @param {string} name - The name of the radio group
     * @param {string} value - The value to select
     */
    setRadioValue(name, value) {
        const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
        if (radio) {
            radio.checked = true;
            radio.dispatchEvent(new Event('change', { bubbles: true }));
            // Trigger visual update if needed (handled by initializeComponents listeners usually)
        }
    }

    /**
     * Initialize event listeners for dynamic components
     * Should be called after HTML is inserted into DOM
     * @param {HTMLElement} container - The container element
     */
    initializeComponents(container) {
        // Initialize unit toggles
        const inputsWithToggle = container.querySelectorAll('[data-unit-toggle]');
        inputsWithToggle.forEach(wrapper => {
            const input = wrapper.querySelector('.ui-input');
            const config = JSON.parse(wrapper.dataset.unitToggle);

            // Ensure config is a proper object with units before attempting to enhance
            if (input && config && typeof config === 'object' && Array.isArray(config.units)) {
                UnitConverter.enhanceInput(
                    input,
                    config.type,
                    config.units,
                    config.default || config.units[0]
                );
            }
        });

        // Initialize range sliders with value display
        const rangeSliders = container.querySelectorAll('.ui-range-slider');
        rangeSliders.forEach(slider => {
            const valueDisplay = container.querySelector(`#${slider.id}-value`);
            if (valueDisplay) {
                slider.addEventListener('input', (e) => {
                    const unit = valueDisplay.textContent.replace(/[0-9.-]/g, '');
                    valueDisplay.textContent = e.target.value + unit;
                });
            }
        });

        // Add visual feedback for radio selections
        const radioInputs = container.querySelectorAll('.ui-radio-option input[type="radio"]');
        radioInputs.forEach(radio => {
            radio.addEventListener('change', () => {
                // Remove 'selected' class from all options in the same group
                const group = container.querySelectorAll(`input[name="${radio.name}"]`);
                group.forEach(r => {
                    r.parentElement.classList.remove('selected');
                });
                // Add 'selected' class to checked option
                if (radio.checked) {
                    radio.parentElement.classList.add('selected');
                }
            });
        });

        // Add visual feedback for checkbox selections
        const checkboxInputs = container.querySelectorAll('.ui-checkbox-option input[type="checkbox"]');
        checkboxInputs.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    checkbox.parentElement.classList.add('selected');
                } else {
                    checkbox.parentElement.classList.remove('selected');
                }
            });
            // Initialize state
            if (checkbox.checked) {
                checkbox.parentElement.classList.add('selected');
            }
        });
    }

    /**
     * Create a complete form with multiple fields
     * @param {Object} options - { fields: [], onSubmit }
     */
    createForm({ fields = [], submitLabel = 'Calculate', showSubmit = false }) {
        const fieldsHTML = fields.map(field => {
            switch (field.type) {
                case 'input':
                case 'number':
                case 'text':
                    return this.createInput(field);
                case 'radio':
                    return this.createRadioGroup(field);
                case 'checkbox':
                    return field.options ? this.createCheckboxGroup(field) : this.createCheckbox(field);
                case 'select':
                    return this.createSelect(field);
                case 'range':
                    return this.createRange(field);
                case 'section':
                    return this.createSection(field);
                default:
                    return '';
            }
        }).join('');

        const submitHTML = showSubmit ? `
            <div class="ui-button-group">
                <button type="submit" class="ui-button ui-button-primary">${submitLabel}</button>
            </div>
        ` : '';

        return `
            <form class="ui-form">
                ${fieldsHTML}
                ${submitHTML}
            </form>
        `;
    }
}

// Create and export a singleton instance
export const uiBuilder = new UIBuilder();

// Export class for custom instances
export default UIBuilder;

