// src/twcore/identifier-systems.ts
// TW Core IG v1.0.0 Patient Identifier Systems
// Reference: https://twcore.mohw.gov.tw/ig/twcore/StructureDefinition-Patient-twcore.html

/**
 * TW Core Patient identifier system URLs
 * Used in Patient.identifier.system
 */
export const TW_IDENTIFIER_SYSTEMS = {
    /** National ID (國民身分證) - Ministry of the Interior */
    NATIONAL_ID: 'http://www.moi.gov.tw',
    /** Passport (護照) - Bureau of Consular Affairs */
    PASSPORT: 'http://www.boca.gov.tw',
    /** Resident Certificate (居留證) - National Immigration Agency */
    RESIDENT_CERTIFICATE: 'http://www.immigration.gov.tw',
    /** Medical Record Number (病歷號) - Hospital-specific */
    MEDICAL_RECORD: 'urn:oid:2.16.886.101.20003',
} as const;

/**
 * TW Core identifier type codes
 * Used in Patient.identifier.type.coding
 * System: http://terminology.hl7.org/CodeSystem/v2-0203
 */
export const TW_IDENTIFIER_TYPE_CODES = {
    /** National ID — NNTW (國民身分證) */
    NATIONAL_ID: {
        system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
        code: 'NNTW',
        display: 'National ID of Taiwan',
    },
    /** Medical Record Number */
    MEDICAL_RECORD: {
        system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
        code: 'MR',
        display: 'Medical Record Number',
    },
    /** Passport Number */
    PASSPORT: {
        system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
        code: 'PPN',
        display: 'Passport Number',
    },
    /** Resident Certificate Number */
    RESIDENT_CERTIFICATE: {
        system: 'http://terminology.hl7.org/CodeSystem/v2-0203',
        code: 'PRC',
        display: 'Permanent Resident Card Number',
    },
} as const;

/**
 * Check if a system URL is a TW Core identifier system
 */
export function isTWCoreIdentifierSystem(system: string): boolean {
    return Object.values(TW_IDENTIFIER_SYSTEMS).includes(system as any);
}

/**
 * Get the identifier type label for a given system URL
 */
export function getIdentifierTypeLabel(system: string): string | null {
    switch (system) {
        case TW_IDENTIFIER_SYSTEMS.NATIONAL_ID:
            return '國民身分證';
        case TW_IDENTIFIER_SYSTEMS.PASSPORT:
            return '護照';
        case TW_IDENTIFIER_SYSTEMS.RESIDENT_CERTIFICATE:
            return '居留證';
        case TW_IDENTIFIER_SYSTEMS.MEDICAL_RECORD:
            return '病歷號';
        default:
            return null;
    }
}
