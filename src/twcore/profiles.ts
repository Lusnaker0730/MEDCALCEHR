// src/twcore/profiles.ts
// TW Core IG v1.0.0 Profile canonical URLs
// Reference: https://twcore.mohw.gov.tw/ig/twcore/
// Verified against twcore/package.tgz (tw.gov.mohw.twcore v1.0.0, 2025-12-10)

const TW_CORE_BASE = 'https://twcore.mohw.gov.tw/ig/twcore/StructureDefinition';

/**
 * TW Core Profile canonical URLs
 * Only stores URL strings — no full StructureDefinition JSON imported
 */
export const TW_CORE_PROFILES = {
    // Core Resources
    Patient: `${TW_CORE_BASE}/Patient-twcore`,
    Practitioner: `${TW_CORE_BASE}/Practitioner-twcore`,
    PractitionerRole: `${TW_CORE_BASE}/PractitionerRole-twcore`,
    Organization: `${TW_CORE_BASE}/Organization-twcore`,

    // Clinical Resources
    Condition: `${TW_CORE_BASE}/Condition-twcore`,
    Procedure: `${TW_CORE_BASE}/Procedure-twcore`,
    Encounter: `${TW_CORE_BASE}/Encounter-twcore`,
    AllergyIntolerance: `${TW_CORE_BASE}/AllergyIntolerance-twcore`,
    DiagnosticReport: `${TW_CORE_BASE}/DiagnosticReport-twcore`,
    DocumentReference: `${TW_CORE_BASE}/DocumentReference-twcore`,
    Composition: `${TW_CORE_BASE}/Composition-twcore`,

    // Medication Resources
    MedicationRequest: `${TW_CORE_BASE}/MedicationRequest-twcore`,
    MedicationDispense: `${TW_CORE_BASE}/MedicationDispense-twcore`,
    MedicationStatement: `${TW_CORE_BASE}/MedicationStatement-twcore`,
    Medication: `${TW_CORE_BASE}/Medication-twcore`,

    // Observation Profiles (canonical URLs from package StructureDefinitions)
    Observation: `${TW_CORE_BASE}/Observation-laboratoryResult-twcore`,
    ObservationLaboratoryResult: `${TW_CORE_BASE}/Observation-laboratoryResult-twcore`,
    ObservationClinicalResult: `${TW_CORE_BASE}/Observation-clinical-result-twcore`,
    ObservationVitalSigns: `${TW_CORE_BASE}/Observation-vitalSigns-twcore`,
    ObservationBloodPressure: `${TW_CORE_BASE}/Observation-bloodPressure-twcore`,
    ObservationBMI: `${TW_CORE_BASE}/Observation-bmi-twcore`,
    ObservationBodyHeight: `${TW_CORE_BASE}/Observation-body-height-twcore`,
    ObservationBodyWeight: `${TW_CORE_BASE}/Observation-body-weight-twcore`,
    ObservationBodyTemperature: `${TW_CORE_BASE}/Observation-body-temperature-twcore`,
    ObservationHeadCircumference: `${TW_CORE_BASE}/Observation-head-circumference-twcore`,
    ObservationHeartRate: `${TW_CORE_BASE}/Observation-heart-rate-twcore`,
    ObservationPulseOximetry: `${TW_CORE_BASE}/Observation-pulse-oximetry-twcore`,
    ObservationRespiratoryRate: `${TW_CORE_BASE}/Observation-respiratory-rate-twcore`,
    ObservationAverageBloodPressure: `${TW_CORE_BASE}/Observation-averageBloodPressure-twcore`,
    ObservationPediatricBMIForAge: `${TW_CORE_BASE}/Observation-pediatric-bmi-age-twcore`,
    ObservationPediatricWeightForHeight: `${TW_CORE_BASE}/Observation-pediatric-weight-height-twcore`,
    ObservationPediatricHeadCircumference: `${TW_CORE_BASE}/Observation-pediatric-head-circumference-twcore`,
    ObservationSmokingStatus: `${TW_CORE_BASE}/Observation-smoking-status-twcore`,
    ObservationScreeningAssessment: `${TW_CORE_BASE}/Observation-screening-assessment-twcore`,
    ObservationSimple: `${TW_CORE_BASE}/Observation-simple-twcore`,

    // Infrastructure Resources
    Provenance: `${TW_CORE_BASE}/Provenance-twcore`,
    Bundle: `${TW_CORE_BASE}/Bundle-twcore`,
    MessageHeader: `${TW_CORE_BASE}/MessageHeader-twcore`,

    // Supporting Resources
    Location: `${TW_CORE_BASE}/Location-twcore`,
    Specimen: `${TW_CORE_BASE}/Specimen-twcore`,
    ImagingStudy: `${TW_CORE_BASE}/ImagingStudy-twcore`,
    Media: `${TW_CORE_BASE}/Media-twcore`,
} as const;

export type TWCoreProfileKey = keyof typeof TW_CORE_PROFILES;
export type TWCoreProfileUrl = typeof TW_CORE_PROFILES[TWCoreProfileKey];
