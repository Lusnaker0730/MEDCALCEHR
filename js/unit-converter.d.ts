export declare const UnitConverter: {
    conversions: any;
    convert(value: number, fromUnit: string, toUnit: string, type: string): number | null;
    createUnitToggle(inputElement: HTMLElement, type: string, units?: string[], defaultUnit?: string): HTMLElement;
    getDecimalPlaces(type: string, unit: string): number;
    enhanceInput(inputElement: HTMLElement, type: string, units: string[], defaultUnit?: string): HTMLElement;
    autoEnhance(container: HTMLElement, config?: any): void;
    getCurrentUnit(inputElement: HTMLElement): string | null;
    setInputValue(inputElement: HTMLElement, value: number, unit: string): void;
    getStandardValue(inputElement: HTMLElement, standardUnit: string): number | null;
};
export default UnitConverter;
