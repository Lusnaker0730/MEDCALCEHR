export interface InputOptions {
    id: string;
    label: string;
    type?: string;
    placeholder?: string;
    required?: boolean;
    unit?: string;
    unitToggle?: {
        type: string;
        units: string[];
        default?: string;
    };
    helpText?: string;
    min?: number;
    max?: number;
    step?: number;
    defaultValue?: string | number;
}

export interface RadioOption {
    value: string;
    label: string;
    checked?: boolean;
    disabled?: boolean;
}

export interface RadioGroupOptions {
    name: string;
    label?: string;
    options: RadioOption[];
    required?: boolean;
    helpText?: string;
}

export interface CheckboxOption {
    value: string;
    label: string;
    description?: string;
    checked?: boolean;
    disabled?: boolean;
    id?: string;
}

export interface CheckboxGroupOptions {
    name: string;
    label?: string;
    options: CheckboxOption[];
    helpText?: string;
}

export interface SelectOption {
    value: string;
    label: string;
    selected?: boolean;
}

export interface SelectOptions {
    id: string;
    label: string;
    options: SelectOption[];
    required?: boolean;
    helpText?: string;
}

export interface RangeOptions {
    id: string;
    label: string;
    min?: number;
    max?: number;
    step?: number;
    defaultValue?: number;
    unit?: string;
    showValue?: boolean;
}

export interface SectionOptions {
    title?: string;
    subtitle?: string;
    icon?: string;
    content: string;
}

export interface ResultBoxOptions {
    id: string;
    title?: string;
}

export interface ResultItemOptions {
    label?: string;
    value: string | number;
    unit?: string;
    interpretation?: string;
    alertClass?: string;
}

export interface AlertOptions {
    type?: 'info' | 'warning' | 'danger' | 'success';
    message: string;
    icon?: string;
}

export interface FormulaItem {
    label?: string;
    title?: string;
    formula?: string;
    formulas?: string[];
    notes?: string;
}

export interface FormulaSectionOptions {
    items: FormulaItem[];
}
