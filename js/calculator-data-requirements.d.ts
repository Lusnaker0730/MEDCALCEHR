import { CalculatorDataRequirements, FieldDataRequirement } from './fhir-data-service.js';
/**
 * Common vital signs field configurations
 */
export declare const VITAL_SIGNS_FIELDS: {
    temperature: (inputId: string) => FieldDataRequirement;
    heartRate: (inputId: string) => FieldDataRequirement;
    respiratoryRate: (inputId: string) => FieldDataRequirement;
    systolicBP: (inputId: string) => FieldDataRequirement;
    diastolicBP: (inputId: string) => FieldDataRequirement;
    oxygenSaturation: (inputId: string) => FieldDataRequirement;
};
/**
 * Common laboratory field configurations
 */
export declare const LAB_FIELDS: {
    sodium: (inputId: string) => FieldDataRequirement;
    potassium: (inputId: string) => FieldDataRequirement;
    creatinine: (inputId: string) => FieldDataRequirement;
    bun: (inputId: string) => FieldDataRequirement;
    glucose: (inputId: string) => FieldDataRequirement;
    hemoglobin: (inputId: string) => FieldDataRequirement;
    hematocrit: (inputId: string) => FieldDataRequirement;
    wbc: (inputId: string) => FieldDataRequirement;
    platelets: (inputId: string) => FieldDataRequirement;
    totalCholesterol: (inputId: string) => FieldDataRequirement;
    hdl: (inputId: string) => FieldDataRequirement;
    ldl: (inputId: string) => FieldDataRequirement;
    triglycerides: (inputId: string) => FieldDataRequirement;
    albumin: (inputId: string) => FieldDataRequirement;
    bilirubinTotal: (inputId: string) => FieldDataRequirement;
    ast: (inputId: string) => FieldDataRequirement;
    alt: (inputId: string) => FieldDataRequirement;
    inr: (inputId: string) => FieldDataRequirement;
    troponin: (inputId: string) => FieldDataRequirement;
    bnp: (inputId: string) => FieldDataRequirement;
    ntProBnp: (inputId: string) => FieldDataRequirement;
};
/**
 * ABG/Blood Gas field configurations
 */
export declare const ABG_FIELDS: {
    ph: (inputId: string) => FieldDataRequirement;
    pao2: (inputId: string) => FieldDataRequirement;
    paco2: (inputId: string) => FieldDataRequirement;
    hco3: (inputId: string) => FieldDataRequirement;
    lactate: (inputId: string) => FieldDataRequirement;
};
/**
 * Registry of calculator data requirements
 */
export declare const CALCULATOR_DATA_REQUIREMENTS: Record<string, CalculatorDataRequirements>;
/**
 * Get data requirements for a specific calculator
 */
export declare function getCalculatorRequirements(calculatorId: string): CalculatorDataRequirements | null;
/**
 * Get all LOINC codes needed by a calculator
 */
export declare function getCalculatorLoincCodes(calculatorId: string): string[];
/**
 * Get all condition SNOMED codes for a calculator
 */
export declare function getCalculatorConditionCodes(calculatorId: string): string[];
declare const _default: {
    CALCULATOR_DATA_REQUIREMENTS: Record<string, CalculatorDataRequirements>;
    VITAL_SIGNS_FIELDS: {
        temperature: (inputId: string) => FieldDataRequirement;
        heartRate: (inputId: string) => FieldDataRequirement;
        respiratoryRate: (inputId: string) => FieldDataRequirement;
        systolicBP: (inputId: string) => FieldDataRequirement;
        diastolicBP: (inputId: string) => FieldDataRequirement;
        oxygenSaturation: (inputId: string) => FieldDataRequirement;
    };
    LAB_FIELDS: {
        sodium: (inputId: string) => FieldDataRequirement;
        potassium: (inputId: string) => FieldDataRequirement;
        creatinine: (inputId: string) => FieldDataRequirement;
        bun: (inputId: string) => FieldDataRequirement;
        glucose: (inputId: string) => FieldDataRequirement;
        hemoglobin: (inputId: string) => FieldDataRequirement;
        hematocrit: (inputId: string) => FieldDataRequirement;
        wbc: (inputId: string) => FieldDataRequirement;
        platelets: (inputId: string) => FieldDataRequirement;
        totalCholesterol: (inputId: string) => FieldDataRequirement;
        hdl: (inputId: string) => FieldDataRequirement;
        ldl: (inputId: string) => FieldDataRequirement;
        triglycerides: (inputId: string) => FieldDataRequirement;
        albumin: (inputId: string) => FieldDataRequirement;
        bilirubinTotal: (inputId: string) => FieldDataRequirement;
        ast: (inputId: string) => FieldDataRequirement;
        alt: (inputId: string) => FieldDataRequirement;
        inr: (inputId: string) => FieldDataRequirement;
        troponin: (inputId: string) => FieldDataRequirement;
        bnp: (inputId: string) => FieldDataRequirement;
        ntProBnp: (inputId: string) => FieldDataRequirement;
    };
    ABG_FIELDS: {
        ph: (inputId: string) => FieldDataRequirement;
        pao2: (inputId: string) => FieldDataRequirement;
        paco2: (inputId: string) => FieldDataRequirement;
        hco3: (inputId: string) => FieldDataRequirement;
        lactate: (inputId: string) => FieldDataRequirement;
    };
    getCalculatorRequirements: typeof getCalculatorRequirements;
    getCalculatorLoincCodes: typeof getCalculatorLoincCodes;
    getCalculatorConditionCodes: typeof getCalculatorConditionCodes;
};
export default _default;
//# sourceMappingURL=calculator-data-requirements.d.ts.map