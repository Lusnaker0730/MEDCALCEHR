export declare const LOINC_CODES: {
    [key: string]: string;
};
export declare const SNOMED_CODES: {
    [key: string]: string;
};
export declare function getLoincCode(name: string): string | null;
export declare function getSnomedCode(name: string): string | null;
export declare function getLoincName(code: string): string | null;
export declare function getSnomedName(code: string): string | null;
export declare function isValidLoincCode(code: string): boolean;
export declare function isValidSnomedCode(code: string): boolean;
export declare function getVitalSignsCodes(): {
    systolicBP: string;
    diastolicBP: string;
    heartRate: string;
    respiratoryRate: string;
    temperature: string;
    oxygenSaturation: string;
};
export declare function getLabCodesByCategory(category: string): {
    [key: string]: string;
} | null;
declare const _default: {
    LOINC: {
        [key: string]: string;
    };
    SNOMED: {
        [key: string]: string;
    };
    getLoincCode: typeof getLoincCode;
    getSnomedCode: typeof getSnomedCode;
    getLoincName: typeof getLoincName;
    getSnomedName: typeof getSnomedName;
    isValidLoincCode: typeof isValidLoincCode;
    isValidSnomedCode: typeof isValidSnomedCode;
    getVitalSignsCodes: typeof getVitalSignsCodes;
    getLabCodesByCategory: typeof getLabCodesByCategory;
};
export default _default;
