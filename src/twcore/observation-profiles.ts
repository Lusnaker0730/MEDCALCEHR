// src/twcore/observation-profiles.ts
// LOINC code → TW Core Observation Profile mapping
// Reference: https://twcore.mohw.gov.tw/ig/twcore/
// Verified against twcore/package.tgz (tw.gov.mohw.twcore v1.0.0, 2025-12-10)

import { TW_CORE_PROFILES } from './profiles.js';

/**
 * TW Core Observation profile URLs for quick reference
 * Covers vital signs, lab results, and clinical result sub-profiles
 */
export const TW_OBSERVATION_PROFILES = {
    laboratoryResult: TW_CORE_PROFILES.ObservationLaboratoryResult,
    clinicalResult: TW_CORE_PROFILES.ObservationClinicalResult,
    vitalSigns: TW_CORE_PROFILES.ObservationVitalSigns,
    bloodPressure: TW_CORE_PROFILES.ObservationBloodPressure,
    bmi: TW_CORE_PROFILES.ObservationBMI,
    bodyHeight: TW_CORE_PROFILES.ObservationBodyHeight,
    bodyWeight: TW_CORE_PROFILES.ObservationBodyWeight,
    bodyTemperature: TW_CORE_PROFILES.ObservationBodyTemperature,
    headCircumference: TW_CORE_PROFILES.ObservationHeadCircumference,
    heartRate: TW_CORE_PROFILES.ObservationHeartRate,
    pulseOximetry: TW_CORE_PROFILES.ObservationPulseOximetry,
    respiratoryRate: TW_CORE_PROFILES.ObservationRespiratoryRate,
    averageBloodPressure: TW_CORE_PROFILES.ObservationAverageBloodPressure,
    pediatricBMIForAge: TW_CORE_PROFILES.ObservationPediatricBMIForAge,
    pediatricWeightForHeight: TW_CORE_PROFILES.ObservationPediatricWeightForHeight,
    pediatricHeadCircumference: TW_CORE_PROFILES.ObservationPediatricHeadCircumference,
    smokingStatus: TW_CORE_PROFILES.ObservationSmokingStatus,
    screeningAssessment: TW_CORE_PROFILES.ObservationScreeningAssessment,
    simple: TW_CORE_PROFILES.ObservationSimple,
} as const;

/**
 * LOINC code → most specific TW Core Observation profile URL
 * Based on TWVitalSigns ValueSet (vital-signs-tw) from the IG
 */
const LOINC_TO_TW_PROFILE_MAP: Record<string, string> = {
    // Blood Pressure (panel and components)
    '85354-9': TW_OBSERVATION_PROFILES.bloodPressure,
    '55284-4': TW_OBSERVATION_PROFILES.bloodPressure,
    '8480-6': TW_OBSERVATION_PROFILES.bloodPressure,   // Systolic (component)
    '8462-4': TW_OBSERVATION_PROFILES.bloodPressure,   // Diastolic (component)
    '8478-0': TW_OBSERVATION_PROFILES.bloodPressure,   // Mean BP (component)

    // BMI
    '39156-5': TW_OBSERVATION_PROFILES.bmi,

    // Body Height
    '8302-2': TW_OBSERVATION_PROFILES.bodyHeight,
    '8306-3': TW_OBSERVATION_PROFILES.bodyHeight,      // Body height lying
    '8308-9': TW_OBSERVATION_PROFILES.bodyHeight,      // Body height standing

    // Body Weight
    '29463-7': TW_OBSERVATION_PROFILES.bodyWeight,
    '3141-9': TW_OBSERVATION_PROFILES.bodyWeight,      // Body weight measured

    // Body Temperature
    '8310-5': TW_OBSERVATION_PROFILES.bodyTemperature,
    '8331-1': TW_OBSERVATION_PROFILES.bodyTemperature,  // Oral temperature

    // Head Circumference
    '9843-4': TW_OBSERVATION_PROFILES.headCircumference,
    '8287-5': TW_OBSERVATION_PROFILES.headCircumference, // Head OFC by Tape measure

    // Heart Rate
    '8867-4': TW_OBSERVATION_PROFILES.heartRate,

    // Oxygen Saturation / Pulse Oximetry
    '59408-5': TW_OBSERVATION_PROFILES.pulseOximetry,
    '2708-6': TW_OBSERVATION_PROFILES.pulseOximetry,    // Arterial O2 Sat

    // Respiratory Rate
    '9279-1': TW_OBSERVATION_PROFILES.respiratoryRate,

    // Vital Signs panel
    '85353-1': TW_OBSERVATION_PROFILES.vitalSigns,

    // Pediatric BMI for Age
    '59576-9': TW_OBSERVATION_PROFILES.pediatricBMIForAge,

    // Pediatric Weight for Height
    '77606-2': TW_OBSERVATION_PROFILES.pediatricWeightForHeight,

    // Pediatric Head Circumference percentile
    '8289-1': TW_OBSERVATION_PROFILES.pediatricHeadCircumference,

    // Smoking Status
    '72166-2': TW_OBSERVATION_PROFILES.smokingStatus,
};

/**
 * LOINC codes recognized as vital signs by TW Core (TWVitalSigns ValueSet)
 * These map to one of the specific vital sign sub-profiles
 */
const VITAL_SIGN_LOINC_CODES = new Set([
    // Blood Pressure
    '85354-9', '55284-4', '8480-6', '8462-4', '8478-0',
    // BMI
    '39156-5',
    // Body Height
    '8302-2', '8306-3', '8308-9',
    // Body Weight
    '29463-7', '3141-9',
    // Body Temperature
    '8310-5', '8331-1',
    // Head Circumference
    '9843-4', '8287-5',
    // Heart Rate
    '8867-4',
    // Oxygen Saturation / Pulse Oximetry
    '59408-5', '2708-6',
    // Respiratory Rate
    '9279-1',
    // Vital Signs panel
    '85353-1',
    // Pediatric
    '59576-9', '77606-2', '8289-1',
]);

/**
 * Common laboratory LOINC codes (non-vital-sign) for fallback detection
 */
const LABORATORY_LOINC_CODES = new Set([
    // Chemistry
    '2951-2', '2823-3', '2075-0', '1963-8', '2028-9', '3094-0', '2160-0',
    '2345-7', '17861-6', '2601-3', '2777-1', '1751-7',
    // Liver
    '1975-2', '1968-7', '1920-8', '1742-6', '6768-6', '2324-2', '2885-2',
    // Lipids
    '2093-3', '2085-9', '2089-1', '2571-8',
    // Hematology
    '718-7', '4544-3', '6690-2', '777-3', '26515-7',
    // Coagulation
    '5902-2', '14979-9', '6301-6', '34714-6', '3255-7', '48065-7',
    // ABG
    '2744-1', '2019-8', '2703-7', '1960-4', '1925-7', '2524-7',
    // Cardiac markers
    '10839-9', '6598-7', '30239-8', '30934-4', '33762-6',
    // Other
    '4548-4', '3016-3', '1988-5', '33914-3', '33959-8',
]);

/**
 * Get the most specific TW Core Observation profile URL for a LOINC code.
 *
 * Resolution order:
 * 1. Exact match in LOINC_TO_TW_PROFILE_MAP (specific vital sign profile)
 * 2. Vital sign LOINC → vitalSigns profile
 * 3. Known lab code → laboratoryResult profile
 * 4. null (unknown)
 */
export function getTWCoreObservationProfile(loincCode: string): string | null {
    // Handle comma-separated codes (take first)
    const primaryCode = loincCode.split(',')[0].trim();

    // 1. Exact match to specific profile
    const exact = LOINC_TO_TW_PROFILE_MAP[primaryCode];
    if (exact) {
        return exact;
    }

    // 2. Known vital sign → generic vital signs profile
    if (VITAL_SIGN_LOINC_CODES.has(primaryCode)) {
        return TW_OBSERVATION_PROFILES.vitalSigns;
    }

    // 3. Known lab code → laboratory result profile
    if (LABORATORY_LOINC_CODES.has(primaryCode)) {
        return TW_OBSERVATION_PROFILES.laboratoryResult;
    }

    return null;
}

/**
 * Check if a LOINC code is classified as a vital sign in TW Core
 */
export function isVitalSignCode(loincCode: string): boolean {
    const primaryCode = loincCode.split(',')[0].trim();
    return VITAL_SIGN_LOINC_CODES.has(primaryCode);
}

/**
 * Get the TW Core observation category for a LOINC code.
 * Returns the HL7 observation-category code.
 */
export function getTWCoreObservationCategory(loincCode: string): string {
    const primaryCode = loincCode.split(',')[0].trim();
    if (VITAL_SIGN_LOINC_CODES.has(primaryCode)) {
        return 'vital-signs';
    }
    if (LABORATORY_LOINC_CODES.has(primaryCode)) {
        return 'laboratory';
    }
    return 'exam';
}
