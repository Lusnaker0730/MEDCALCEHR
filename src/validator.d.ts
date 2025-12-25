export interface ValidationRule {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: any, input: any) => boolean | string;
    message?: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

export declare function validateCalculatorInput(
    input: any,
    schema: { [key: string]: ValidationRule }
): ValidationResult;
export declare const ValidationRules: {
    age: ValidationRule;
    temperature: ValidationRule;
    bloodPressure: {
        systolic: ValidationRule;
        diastolic: ValidationRule;
    };
    heartRate: ValidationRule;
    pH: ValidationRule;
    weight: ValidationRule;
    height: ValidationRule;
    gcs: ValidationRule;
    glucose: ValidationRule;
    bun: ValidationRule;
    urineSodium: ValidationRule;
    urineCreatinine: ValidationRule;
    creatinine: ValidationRule;
    sodium: ValidationRule;
    potassium: ValidationRule;
    bilirubin: ValidationRule;
    calcium: ValidationRule;
    inr: ValidationRule;
    albumin: ValidationRule;
    liverEnzyme: ValidationRule;
    platelets: ValidationRule;
    map: ValidationRule;
    respiratoryRate: ValidationRule;
    hematocrit: ValidationRule;
    wbc: ValidationRule;
    qtInterval: ValidationRule;
    arterialGas: {
        paO2: ValidationRule;
        paCO2: ValidationRule;
        fiO2: ValidationRule;
    };
    phenytoin: ValidationRule;
    bicarbonate: ValidationRule;
    chloride: ValidationRule;
    insulin: ValidationRule;
    ethanol: ValidationRule;
    totalCholesterol: ValidationRule;
    hdl: ValidationRule;
    triglycerides: ValidationRule;
    osmolality: ValidationRule;
    hours: ValidationRule;
    volume: ValidationRule;
    abv: ValidationRule;
    hemoglobin: ValidationRule;
    [key: string]: ValidationRule | { [key: string]: ValidationRule };
};
export declare function validateOrThrow(
    input: any,
    schema: { [key: string]: ValidationRule }
): void;
export declare function setupLiveValidation(
    inputElement: HTMLInputElement,
    rule: ValidationRule,
    onError?: (errors: string[]) => void
): void;
export declare function setupFormValidation(
    formElement: HTMLFormElement,
    schema: { [key: string]: ValidationRule }
): void;
