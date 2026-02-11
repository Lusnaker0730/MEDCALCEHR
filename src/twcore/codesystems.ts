// src/twcore/codesystems.ts
// TW Core IG v1.0.0 CodeSystem and ValueSet URLs + small code tables
// Reference: https://twcore.mohw.gov.tw/ig/twcore/

const TW_CORE_CS_BASE = 'https://twcore.mohw.gov.tw/ig/twcore/CodeSystem';
const TW_CORE_VS_BASE = 'https://twcore.mohw.gov.tw/ig/twcore/ValueSet';

/**
 * TW-specific CodeSystem URLs
 */
export const TW_CODE_SYSTEMS = {
    // Diagnosis codes — ICD-10-CM (Clinical Modification)
    ICD_10_CM_TW_2023: `${TW_CORE_CS_BASE}/icd-10-cm-2023-tw`,
    ICD_10_CM_TW_2021: `${TW_CORE_CS_BASE}/icd-10-cm-2021-tw`,
    ICD_10_CM_TW_2014: `${TW_CORE_CS_BASE}/icd-10-cm-2014-tw`,

    // Diagnosis codes — ICD-10-PCS (Procedure Coding System)
    ICD_10_PCS_TW_2023: `${TW_CORE_CS_BASE}/icd-10-pcs-2023-tw`,
    ICD_10_PCS_TW_2021: `${TW_CORE_CS_BASE}/icd-10-pcs-2021-tw`,
    ICD_10_PCS_TW_2014: `${TW_CORE_CS_BASE}/icd-10-pcs-2014-tw`,

    // Diagnosis codes — ICD-9-CM (legacy)
    ICD_9_CM_TW_2001: `${TW_CORE_CS_BASE}/icd-9-cm-2001-tw`,

    // Medication codes
    MEDICATION_NHI: `${TW_CORE_CS_BASE}/medication-nhi-tw`,
    MEDICATION_FDA: `${TW_CORE_CS_BASE}/medication-fda-tw`,

    // Medication administration
    MEDICATION_FREQUENCY_NHI: `${TW_CORE_CS_BASE}/medication-frequency-nhi-tw`,
    MEDICATION_PATH_TW: `${TW_CORE_CS_BASE}/medication-path-tw`,

    // Healthcare provider codes
    HEALTHCARE_PROVIDER: `${TW_CORE_CS_BASE}/health-professional-tw`,

    // Observation categories
    CATEGORY_CODE_TW: `${TW_CORE_CS_BASE}/category-code-tw`,

    // Provenance
    PROVENANCE_PARTICIPANT_TYPE: 'http://terminology.hl7.org/CodeSystem/provenance-participant-type',
} as const;

/**
 * TW-specific ValueSet URLs
 */
export const TW_VALUE_SETS = {
    // Observation
    VITAL_SIGNS: `${TW_CORE_VS_BASE}/vital-signs-tw`,
    LABORATORY_CODE: `${TW_CORE_VS_BASE}/laboratory-code-tw`,

    // Medication
    MEDICATION_NHI: `${TW_CORE_VS_BASE}/medication-nhi-tw`,
    MEDICATION_FDA: `${TW_CORE_VS_BASE}/medication-fda-tw`,
    MEDICATION_FREQUENCY_NHI: `${TW_CORE_VS_BASE}/medication-frequency-nhi-tw`,
    MEDICATION_PATH: `${TW_CORE_VS_BASE}/medication-path-tw`,

    // Diagnosis — ICD-10-CM
    ICD_10_CM_TW_2023: `${TW_CORE_VS_BASE}/icd-10-cm-2023-tw`,
    ICD_10_CM_TW_2021: `${TW_CORE_VS_BASE}/icd-10-cm-2021-tw`,
    ICD_10_CM_TW_2014: `${TW_CORE_VS_BASE}/icd-10-cm-2014-tw`,

    // Diagnosis — ICD-10-PCS
    ICD_10_PCS_TW_2023: `${TW_CORE_VS_BASE}/icd-10-pcs-2023-tw`,
    ICD_10_PCS_TW_2021: `${TW_CORE_VS_BASE}/icd-10-pcs-2021-tw`,
    ICD_10_PCS_TW_2014: `${TW_CORE_VS_BASE}/icd-10-pcs-2014-tw`,

    // Diagnosis — ICD-9-CM (legacy)
    ICD_9_CM_TW_2001: `${TW_CORE_VS_BASE}/icd-9-cm-2001-tw`,

    // Smoking Status
    SMOKING_STATUS_COMPREHENSIVE: `${TW_CORE_VS_BASE}/smoking-status-comprehensive-code`,
    SMOKING_STATUS_TYPE: `${TW_CORE_VS_BASE}/smoking-status-type-code`,

    // Healthcare provider
    HEALTHCARE_PROVIDER: `${TW_CORE_VS_BASE}/health-professional-tw`,

    // Condition
    CONDITION_CODE: `${TW_CORE_VS_BASE}/condition-code-tw`,

    // Category
    CATEGORY_CODE: `${TW_CORE_VS_BASE}/category-code-tw`,
} as const;

/**
 * TW Core Observation category codes (category-code-tw CodeSystem)
 * These extend the standard HL7 observation-category codes
 */
export const TW_OBSERVATION_CATEGORIES = {
    SDOH: {
        code: 'sdoh',
        display: 'SDOH',
        definition: 'Social Determinants of Health',
    },
    FUNCTIONAL_STATUS: {
        code: 'functional-status',
        display: 'Functional Status',
        definition: 'Functional Status',
    },
    DISABILITY_STATUS: {
        code: 'disability-status',
        display: 'Disability Status',
        definition: 'Disability Status',
    },
    COGNITIVE_STATUS: {
        code: 'cognitive-status',
        display: 'Cognitive Status',
        definition: 'Cognitive Status',
    },
    TREATMENT_INTERVENTION_PREFERENCE: {
        code: 'treatment-intervention-preference',
        display: 'Treatment Intervention Preference',
        definition: 'Treatment Intervention Preference',
    },
    CARE_EXPERIENCE_PREFERENCE: {
        code: 'care-experience-preference',
        display: 'Care Experience Preference',
        definition: 'Care Experience Preference',
    },
} as const;

/**
 * TW Core medication routes (medication-path-tw CodeSystem)
 * 42 routes of administration used in Taiwan NHI system
 */
export const TW_MEDICATION_ROUTES: ReadonlyArray<{ code: string; display: string }> = [
    { code: 'PO', display: '口服' },
    { code: 'SL', display: '舌下' },
    { code: 'RE', display: '肛門' },
    { code: 'VA', display: '陰道' },
    { code: 'SC', display: '皮下注射' },
    { code: 'IM', display: '肌肉注射' },
    { code: 'IV', display: '靜脈注射' },
    { code: 'IVD', display: '靜脈滴注' },
    { code: 'IVP', display: '靜脈推注' },
    { code: 'IA', display: '動脈注射' },
    { code: 'IC', display: '心臟內注射' },
    { code: 'IT', display: '椎管內注射' },
    { code: 'IP', display: '腹腔內注射' },
    { code: 'IMP', display: '植入' },
    { code: 'EP', display: '硬腦膜外注射' },
    { code: 'IS', display: '關節內注射' },
    { code: 'EX', display: '外用' },
    { code: 'LA', display: '局部麻醉' },
    { code: 'TP', display: '局部塗敷' },
    { code: 'ET', display: '氣管內管' },
    { code: 'IH', display: '吸入' },
    { code: 'NA', display: '鼻用' },
    { code: 'OT', display: '耳用' },
    { code: 'OP', display: '眼用' },
    { code: 'NB', display: '霧化吸入' },
    { code: 'GA', display: '含漱' },
    { code: 'TD', display: '經皮' },
    { code: 'HD', display: '血液透析' },
    { code: 'PD', display: '腹膜透析' },
    { code: 'IB', display: '黏膜下注射' },
    { code: 'ID', display: '皮內注射' },
    { code: 'IL', display: '病灶內注射' },
    { code: 'IVCI', display: '靜脈連續輸注' },
    { code: 'LI', display: '局部注射' },
    { code: 'OR', display: '口腔' },
    { code: 'SP', display: '脊椎' },
    { code: 'SS', display: '點滴靜注(生理食鹽水)' },
    { code: 'DS', display: '點滴靜注(葡萄糖)' },
    { code: 'IRR', display: '灌洗' },
    { code: 'WD', display: '溼敷' },
    { code: 'OTH', display: '其他' },
    { code: 'XX', display: '未指定' },
] as const;
