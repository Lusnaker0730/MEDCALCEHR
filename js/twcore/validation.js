// src/twcore/validation.ts
// Lightweight TW Core conformance checks (NOT a full FHIR Validator)
// Reference: https://twcore.mohw.gov.tw/ig/twcore/
/**
 * Check Patient resource against TW Core Patient profile constraints.
 *
 * Checks:
 * - identifier (min=1, TW Core requirement)
 * - gender (required by base FHIR)
 * - birthDate (recommended by TW Core)
 */
export function checkPatientConformance(patient) {
    const issues = [];
    if (!patient) {
        issues.push({
            severity: 'error',
            path: 'Patient',
            message: 'Patient resource is null or undefined',
        });
        return { isConformant: false, issues };
    }
    // TW Core: Patient.identifier min=1
    if (!patient.identifier || !Array.isArray(patient.identifier) || patient.identifier.length === 0) {
        issues.push({
            severity: 'error',
            path: 'Patient.identifier',
            message: 'TW Core requires at least one identifier (identifier min=1)',
        });
    }
    // FHIR base: gender is required in many contexts
    if (!patient.gender) {
        issues.push({
            severity: 'warning',
            path: 'Patient.gender',
            message: 'Patient.gender is recommended',
        });
    }
    // TW Core: birthDate is recommended
    if (!patient.birthDate) {
        issues.push({
            severity: 'warning',
            path: 'Patient.birthDate',
            message: 'Patient.birthDate is recommended by TW Core',
        });
    }
    return {
        isConformant: issues.filter(i => i.severity === 'error').length === 0,
        issues,
    };
}
/**
 * Check Observation resource against TW Core Observation profile constraints.
 *
 * Checks:
 * - status (required)
 * - code.coding (required, at least one)
 * - subject (required reference)
 * - category (lab observations require effective[x])
 */
export function checkObservationConformance(observation, loincCode) {
    const issues = [];
    if (!observation) {
        issues.push({
            severity: 'error',
            path: 'Observation',
            message: 'Observation resource is null or undefined',
        });
        return { isConformant: false, issues };
    }
    // status is required
    if (!observation.status) {
        issues.push({
            severity: 'error',
            path: 'Observation.status',
            message: 'Observation.status is required',
        });
    }
    // code.coding is required
    if (!observation.code?.coding || !Array.isArray(observation.code.coding) || observation.code.coding.length === 0) {
        issues.push({
            severity: 'error',
            path: 'Observation.code.coding',
            message: 'Observation.code.coding is required with at least one coding',
        });
    }
    // subject is required
    if (!observation.subject?.reference && !observation.subject?.identifier) {
        issues.push({
            severity: 'error',
            path: 'Observation.subject',
            message: 'Observation.subject is required',
        });
    }
    // For laboratory results: effective[x] is required
    const isLab = observation.category?.some?.((cat) => cat.coding?.some?.((c) => c.code === 'laboratory'));
    if (isLab) {
        if (!observation.effectiveDateTime && !observation.effectivePeriod && !observation.effectiveInstant) {
            issues.push({
                severity: 'warning',
                path: 'Observation.effective[x]',
                message: 'Laboratory observations should include effective[x]',
            });
        }
    }
    return {
        isConformant: issues.filter(i => i.severity === 'error').length === 0,
        issues,
    };
}
/**
 * Non-destructively annotate a resource with a TW Core profile URL.
 * Adds the profile to meta.profile if not already present.
 * Returns a new object (does not mutate the input).
 */
export function annotateTWCoreProfile(resource, profileUrl) {
    const meta = resource.meta ? { ...resource.meta } : {};
    const profiles = Array.isArray(meta.profile) ? [...meta.profile] : [];
    if (!profiles.includes(profileUrl)) {
        profiles.push(profileUrl);
    }
    return {
        ...resource,
        meta: {
            ...meta,
            profile: profiles,
        },
    };
}
