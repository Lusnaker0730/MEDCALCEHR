// Universal UI Component Builder for MedCalcEHR Calculators

import { UnitConverter } from './unit-converter.js';

export interface UISectionOptions {
    title?: string;
    subtitle?: string;
    icon?: string;
    content?: string;
}

export interface UIInputOptions {
    id: string;
    label: string;
    type?: string;
    placeholder?: string;
    required?: boolean;
    unit?: string | null;
    unitToggle?: { type: string; units: string[]; default?: string } | null;
    helpText?: string;
    min?: number;
    max?: number;
    step?: number;
    defaultValue?: string | number;
}

export interface UIRadioOption {
    value: string;
    label: string;
    checked?: boolean;
    disabled?: boolean;
    id?: string;
}

export interface UIRadioGroupOptions {
    name: string;
    label?: string;
    options: UIRadioOption[];
    required?: boolean;
    helpText?: string;
}

export interface UICheckboxOption {
    value: string;
    label: string;
    checked?: boolean;
    disabled?: boolean;
    id?: string;
    description?: string;
}

export interface UICheckboxGroupOptions {
    name: string;
    label?: string;
    options: UICheckboxOption[];
    helpText?: string;
}

export interface UICheckboxOptions {
    id: string;
    label: string;
    value?: string;
    checked?: boolean;
    description?: string;
}

export interface UISelectOption {
    value: string;
    label: string;
    selected?: boolean;
}

export interface UISelectOptions {
    id: string;
    label: string;
    options: UISelectOption[];
    required?: boolean;
    helpText?: string;
}

export interface UIRangeOptions {
    id: string;
    label: string;
    min?: number;
    max?: number;
    step?: number;
    defaultValue?: number;
    unit?: string;
    showValue?: boolean;
}

export interface UIResultBoxOptions {
    id: string;
    title?: string;
}

export interface UIResultItemOptions {
    label?: string;
    value: string | number;
    unit?: string;
    interpretation?: string;
    alertClass?: string;
}

export interface UIAlertOptions {
    type?: 'info' | 'warning' | 'danger' | 'success';
    message: string;
    icon?: string;
}

export interface UIFormulaItem {
    label?: string;
    title?: string;
    formula?: string;
    content?: string;
    formulas?: string[];
    notes?: string;
}

export interface UIFormulaSectionOptions {
    items: UIFormulaItem[];
}

export interface UITableOptions {
    id?: string;
    headers: string[];
    rows: string[][];
    className?: string;
    stickyFirstColumn?: boolean;
}

/**
 * UIBuilder - A comprehensive UI component generation system
 * Provides consistent styling and behavior across all calculators
 */
export class UIBuilder {
    constructor() {
        // Styles are now loaded from css/ui-builder.css via index.html
    }

    /**
     * Create a section container
     * @param {Object} options - { title, subtitle, content }
     */
    createSection({ title, subtitle, icon, content = '' }: UISectionOptions): string {
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
    }: UIInputOptions): string {
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
    }: UIRadioGroupOptions): string {
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
    }: UICheckboxGroupOptions): string {
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
    }: UICheckboxOptions): string {
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
    }: UISelectOptions): string {
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
    }: UIRangeOptions): string {
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
    createResultBox({ id, title = 'Results' }: UIResultBoxOptions): string {
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
    createResultItem({ label, value, unit = '', interpretation = '', alertClass = '' }: UIResultItemOptions): string {
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
    createAlert({ type = 'info', message, icon }: UIAlertOptions): string {
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
    createFormulaSection({ items = [] }: UIFormulaSectionOptions): string {
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
    setRadioValue(name: string, value: string): void {
        const radio = document.querySelector(`input[name="${name}"][value="${value}"]`) as HTMLInputElement;
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
    initializeComponents(container: HTMLElement): void {
        // Initialize unit toggles
        const inputsWithToggle = container.querySelectorAll('[data-unit-toggle]');
        inputsWithToggle.forEach(wrapper => {
            const input = wrapper.querySelector('.ui-input') as HTMLInputElement;
            let config: any = null;
            try {
                config = JSON.parse((wrapper as HTMLElement).dataset.unitToggle || 'null');
            } catch (e) { /* ignore */ }

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
                    const unit = valueDisplay.textContent?.replace(/[0-9.-]/g, '') || '';
                    valueDisplay.textContent = (e.target as HTMLInputElement).value + unit;
                });
            }
        });

        // Add visual feedback for radio selections
        const radioInputs = container.querySelectorAll('.ui-radio-option input[type="radio"]');
        radioInputs.forEach(radio => {
            radio.addEventListener('change', () => {
                // Remove 'selected' class from all options in the same group
                const group = container.querySelectorAll(`input[name="${(radio as HTMLInputElement).name}"]`);
                group.forEach(r => {
                    if (r.parentElement) r.parentElement.classList.remove('selected');
                });
                // Add 'selected' class to checked option
                if ((radio as HTMLInputElement).checked && radio.parentElement) {
                    radio.parentElement.classList.add('selected');
                }
            });
        });

        // Add visual feedback for checkbox selections
        const checkboxInputs = container.querySelectorAll('.ui-checkbox-option input[type="checkbox"]');
        checkboxInputs.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                if ((checkbox as HTMLInputElement).checked && checkbox.parentElement) {
                    checkbox.parentElement.classList.add('selected');
                } else if (checkbox.parentElement) {
                    checkbox.parentElement.classList.remove('selected');
                }
            });
            // Initialize state
            if ((checkbox as HTMLInputElement).checked && checkbox.parentElement) {
                checkbox.parentElement.classList.add('selected');
            }
        });
    }

    /**
     * Create a complete form with multiple fields
     * @param {Object} options - { fields: [], onSubmit }
     */
    createForm({ fields = [], submitLabel = 'Calculate', showSubmit = false }: { fields: any[], submitLabel?: string, showSubmit?: boolean }): string {
        const fieldsHTML = fields.map(field => {
            switch (field.type) {
                case 'input':
                case 'number':
                case 'text':
                    return this.createInput(field as UIInputOptions);
                case 'radio':
                    return this.createRadioGroup(field as UIRadioGroupOptions);
                case 'checkbox':
                    if ((field as any).options) {
                        return this.createCheckboxGroup(field as UICheckboxGroupOptions);
                    } else {
                        return this.createCheckbox(field as UICheckboxOptions);
                    }
                case 'select':
                    return this.createSelect(field as UISelectOptions);
                case 'range':
                    return this.createRange(field as UIRangeOptions);
                case 'section':
                    return this.createSection(field as UISectionOptions);
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

    /**
     * Create a data table
     * @param {Object} options - Configuration object
     */
    createTable({
        id,
        headers = [], // ['Col 1', 'Col 2']
        rows = [],    // [['r1c1', 'r1c2'], ['r2c1', 'r2c2']]
        className = '',
        stickyFirstColumn = false
    }: UITableOptions): string {
        const headerHTML = headers.map((h, i) => {
            const stickyClass = (stickyFirstColumn && i === 0) ? 'sticky-col' : '';
            return `<th class="${stickyClass}">${h}</th>`;
        }).join('');

        const rowsHTML = rows.map(row => {
            const cellsHTML = row.map((cell, i) => {
                const stickyClass = (stickyFirstColumn && i === 0) ? 'sticky-col' : '';
                return `<td class="${stickyClass}">${cell}</td>`;
            }).join('');
            return `<tr>${cellsHTML}</tr>`;
        }).join('');

        const tableClass = `ui-table ${className} ${stickyFirstColumn ? 'has-sticky-col' : ''}`;
        const wrapperId = id ? `id="${id}"` : '';

        return `
            <div class="ui-table-container" ${wrapperId}>
                <table class="${tableClass}">
                    <thead>
                        <tr>${headerHTML}</tr>
                    </thead>
                    <tbody>
                        ${rowsHTML}
                    </tbody>
                </table>
            </div>
        `;
    }
}

// Create and export a singleton instance
export const uiBuilder = new UIBuilder();

// Export class for custom instances
export default UIBuilder;
