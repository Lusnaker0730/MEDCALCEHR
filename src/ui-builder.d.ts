export declare class UIBuilder {
    constructor();
    injectStyles(): void;
    createSection(options: {
        title?: string;
        subtitle?: string;
        icon?: string;
        content?: string;
    }): string;
    createInput(options: {
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
    }): string;
    createRadioGroup(options: {
        name: string;
        label?: string;
        options?: Array<{
            value: string;
            label: string;
            checked?: boolean;
            disabled?: boolean;
            id?: string;
        }>;
        required?: boolean;
        helpText?: string;
    }): string;
    createCheckboxGroup(options: {
        name: string;
        label?: string;
        options?: Array<{
            value: string;
            label: string;
            description?: string;
            checked?: boolean;
            disabled?: boolean;
            id?: string;
        }>;
        helpText?: string;
    }): string;
    createCheckbox(options: {
        id: string;
        label: string;
        value?: string;
        checked?: boolean;
        description?: string;
    }): string;
    createSelect(options: {
        id: string;
        label: string;
        options?: Array<{ value: string; label: string; selected?: boolean }>;
        required?: boolean;
        helpText?: string;
    }): string;
    createRange(options: {
        id: string;
        label: string;
        min?: number;
        max?: number;
        step?: number;
        defaultValue?: number;
        unit?: string;
        showValue?: boolean;
    }): string;
    createResultBox(options: { id: string; title?: string }): string;
    createResultItem(options: {
        label?: string;
        value: string | number;
        unit?: string;
        interpretation?: string;
        alertClass?: string;
    }): string;
    createAlert(options: {
        type?: 'info' | 'warning' | 'danger' | 'success';
        message: string;
        icon?: string;
    }): string;
    createFormulaSection(options: {
        items?: Array<{
            label?: string;
            title?: string;
            formula?: string;
            content?: string;
            formulas?: string[];
            notes?: string;
        }>;
    }): string;
    createTable(options: {
        id?: string;
        headers?: string[];
        rows?: string[][];
        className?: string;
        stickyFirstColumn?: boolean;
    }): string;
    setRadioValue(name: string, value: string): void;
    initializeComponents(container: HTMLElement): void;
    createForm(options: { fields?: any[]; submitLabel?: string; showSubmit?: boolean }): string;
}

export declare const uiBuilder: UIBuilder;
export default UIBuilder;
