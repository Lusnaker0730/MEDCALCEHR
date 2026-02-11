/**
 * FHIR Codes Module Tests
 * Tests for LOINC/SNOMED/ICD-10 code utilities
 */

import { describe, expect, test } from '@jest/globals';
import {
    LOINC_CODES,
    SNOMED_CODES,
    ICD10_CODES,
    SNOMED_TO_ICD10_MAP,
    RXNORM_CODES,
    FHIR_CODE_SYSTEMS,
    getLoincCode,
    getSnomedCode,
    getIcd10Code,
    getLoincName,
    getSnomedName,
    getIcd10Name,
    isValidLoincCode,
    isValidSnomedCode,
    isValidIcd10Code,
    getDiagnosisCode,
    convertSnomedToIcd10,
    matchDiagnosisCode,
    getVitalSignsCodes,
    getMeasurementType
} from '../fhir-codes.js';
import { getTWCoreObservationProfile } from '../twcore/observation-profiles.js';

describe('FHIR Codes Module', () => {
    // =========================================
    // LOINC_CODES Registry Tests
    // =========================================
    describe('LOINC_CODES Registry', () => {
        test('should contain common vital signs codes', () => {
            expect(LOINC_CODES.SYSTOLIC_BP).toContain('8480-6');
            expect(LOINC_CODES.DIASTOLIC_BP).toContain('8462-4');
            expect(LOINC_CODES.HEART_RATE).toContain('8867-4');
            expect(LOINC_CODES.TEMPERATURE).toContain('8310-5');
            expect(LOINC_CODES.RESPIRATORY_RATE).toContain('9279-1');
            expect(LOINC_CODES.OXYGEN_SATURATION).toContain('59408-5');
        });

        test('should contain common lab codes', () => {
            expect(LOINC_CODES.HEMOGLOBIN).toContain('718-7');
            expect(LOINC_CODES.CREATININE).toContain('2160-0');
            expect(LOINC_CODES.SODIUM).toContain('2951-2');
            expect(LOINC_CODES.POTASSIUM).toContain('2823-3');
            expect(LOINC_CODES.GLUCOSE).toContain('2345-7');
        });

        test('should contain anthropometric codes', () => {
            expect(LOINC_CODES.HEIGHT).toBeDefined();
            expect(LOINC_CODES.WEIGHT).toBeDefined();
            expect(LOINC_CODES.BMI).toBeDefined();
        });
    });

    // =========================================
    // SNOMED_CODES Registry Tests
    // =========================================
    describe('SNOMED_CODES Registry', () => {
        test('should contain cardiovascular conditions', () => {
            expect(SNOMED_CODES.HYPERTENSION).toBe('38341003');
            expect(SNOMED_CODES.HEART_FAILURE).toBe('84114007');
            expect(SNOMED_CODES.ATRIAL_FIBRILLATION).toBe('49436004');
        });

        test('should contain metabolic conditions', () => {
            expect(SNOMED_CODES.DIABETES_TYPE_2).toBeDefined();
            expect(SNOMED_CODES.DIABETES_TYPE_1).toBeDefined();
        });
    });

    // =========================================
    // RXNORM_CODES Registry Tests
    // =========================================
    describe('RXNORM_CODES Registry', () => {
        test('should contain common medications', () => {
            expect(RXNORM_CODES.ASPIRIN).toBe('1191');
            expect(RXNORM_CODES.CLOPIDOGREL).toBe('32968');
            expect(RXNORM_CODES.WARFARIN).toBe('11289');
        });
    });

    // =========================================
    // getLoincCode Function Tests
    // =========================================
    describe('getLoincCode', () => {
        test('should return LOINC code for valid name', () => {
            expect(getLoincCode('SYSTOLIC_BP')).toContain('8480-6');
            expect(getLoincCode('HEMOGLOBIN')).toContain('718-7');
        });

        test('should return null for invalid name', () => {
            expect(getLoincCode('INVALID_CODE')).toBeNull();
            expect(getLoincCode('')).toBeNull();
        });

        test('should be case-insensitive', () => {
            expect(getLoincCode('systolic_bp')).toContain('8480-6');
            expect(getLoincCode('Systolic_BP')).toContain('8480-6');
        });
    });

    // =========================================
    // getSnomedCode Function Tests
    // =========================================
    describe('getSnomedCode', () => {
        test('should return SNOMED code for valid name', () => {
            expect(getSnomedCode('HYPERTENSION')).toBe('38341003');
        });

        test('should return null for invalid name', () => {
            expect(getSnomedCode('INVALID_CONDITION')).toBeNull();
        });
    });

    // =========================================
    // getLoincName Function Tests
    // =========================================
    describe('getLoincName', () => {
        test('should return name for valid LOINC code', () => {
            const name = getLoincName('8480-6');
            expect(name).toBe('systolic bp');
        });

        test('should return null for invalid LOINC code', () => {
            expect(getLoincName('0000-0')).toBeNull();
            expect(getLoincName('')).toBeNull();
        });
    });

    // =========================================
    // getSnomedName Function Tests
    // =========================================
    describe('getSnomedName', () => {
        test('should return name for valid SNOMED code', () => {
            const name = getSnomedName('38341003');
            expect(name).toBe('hypertension');
        });

        test('should return null for invalid SNOMED code', () => {
            expect(getSnomedName('0000000')).toBeNull();
        });
    });

    // =========================================
    // isValidLoincCode Function Tests
    // =========================================
    describe('isValidLoincCode', () => {
        test('should return true for valid LOINC format (4-5 digits)', () => {
            expect(isValidLoincCode('8480-6')).toBe(true);
            expect(isValidLoincCode('2160-0')).toBe(true);
            expect(isValidLoincCode('29463-7')).toBe(true); // 5-digit code
        });

        test('should return false for invalid LOINC format', () => {
            expect(isValidLoincCode('invalid')).toBe(false);
            expect(isValidLoincCode('')).toBe(false);
            expect(isValidLoincCode('12345')).toBe(false);
        });
    });

    // =========================================
    // isValidSnomedCode Function Tests
    // =========================================
    describe('isValidSnomedCode', () => {
        test('should return true for valid SNOMED format', () => {
            expect(isValidSnomedCode('38341003')).toBe(true);
            expect(isValidSnomedCode('84114007')).toBe(true);
        });

        test('should return false for invalid SNOMED format', () => {
            expect(isValidSnomedCode('invalid')).toBe(false);
            expect(isValidSnomedCode('')).toBe(false);
        });
    });

    // =========================================
    // getVitalSignsCodes Function Tests
    // =========================================
    describe('getVitalSignsCodes', () => {
        test('should return object with vital signs codes', () => {
            const vitalCodes = getVitalSignsCodes();
            expect(vitalCodes).toHaveProperty('systolicBP');
            expect(vitalCodes).toHaveProperty('diastolicBP');
            expect(vitalCodes).toHaveProperty('heartRate');
            expect(vitalCodes).toHaveProperty('temperature');
        });
    });

    // =========================================
    // getMeasurementType Function Tests
    // =========================================
    describe('getMeasurementType', () => {
        test('should return correct measurement type for LOINC codes', () => {
            expect(getMeasurementType('2160-0')).toBe('creatinine'); // Creatinine
            expect(getMeasurementType('8302-2')).toBe('height'); // Height
            expect(getMeasurementType('29463-7')).toBe('weight'); // Weight
        });

        test('should return default concentration for unknown LOINC codes', () => {
            expect(getMeasurementType('0000-0')).toBe('concentration');
        });
    });

    // =========================================
    // ICD10_CODES Registry Tests
    // =========================================
    describe('ICD10_CODES Registry', () => {
        test('should contain cardiovascular conditions', () => {
            expect(ICD10_CODES.HYPERTENSION).toBe('I10');
            expect(ICD10_CODES.HEART_FAILURE).toBe('I50.9');
            expect(ICD10_CODES.ATRIAL_FIBRILLATION).toBe('I48.91');
            expect(ICD10_CODES.MYOCARDIAL_INFARCTION).toBe('I21.9');
        });

        test('should contain metabolic conditions', () => {
            expect(ICD10_CODES.DIABETES_TYPE_2).toBe('E11.9');
            expect(ICD10_CODES.DIABETES_TYPE_1).toBe('E10.9');
            expect(ICD10_CODES.HYPERLIPIDEMIA).toBe('E78.5');
        });

        test('should contain renal conditions', () => {
            expect(ICD10_CODES.CHRONIC_KIDNEY_DISEASE).toBe('N18.9');
            expect(ICD10_CODES.CKD_STAGE_3).toBe('N18.3');
            expect(ICD10_CODES.END_STAGE_RENAL_DISEASE).toBe('N18.6');
        });
    });

    // =========================================
    // getIcd10Code Function Tests
    // =========================================
    describe('getIcd10Code', () => {
        test('should return ICD-10 code for valid name', () => {
            expect(getIcd10Code('HYPERTENSION')).toBe('I10');
            expect(getIcd10Code('DIABETES_TYPE_2')).toBe('E11.9');
        });

        test('should return null for invalid name', () => {
            expect(getIcd10Code('INVALID_CONDITION')).toBeNull();
            expect(getIcd10Code('')).toBeNull();
        });

        test('should be case-insensitive', () => {
            expect(getIcd10Code('hypertension')).toBe('I10');
            expect(getIcd10Code('Hypertension')).toBe('I10');
        });
    });

    // =========================================
    // getIcd10Name Function Tests
    // =========================================
    describe('getIcd10Name', () => {
        test('should return name for valid ICD-10 code', () => {
            const name = getIcd10Name('I10');
            expect(name).toBe('hypertension');
        });

        test('should return null for invalid ICD-10 code', () => {
            expect(getIcd10Name('Z99.99')).toBeNull();
            expect(getIcd10Name('')).toBeNull();
        });
    });

    // =========================================
    // isValidIcd10Code Function Tests
    // =========================================
    describe('isValidIcd10Code', () => {
        test('should return true for valid ICD-10 format', () => {
            expect(isValidIcd10Code('I10')).toBe(true);
            expect(isValidIcd10Code('E11.9')).toBe(true);
            expect(isValidIcd10Code('I48.91')).toBe(true);
            expect(isValidIcd10Code('N18.6')).toBe(true);
        });

        test('should return false for invalid ICD-10 format', () => {
            expect(isValidIcd10Code('invalid')).toBe(false);
            expect(isValidIcd10Code('')).toBe(false);
            expect(isValidIcd10Code('38341003')).toBe(false); // SNOMED code
            expect(isValidIcd10Code('8480-6')).toBe(false); // LOINC code
        });
    });

    // =========================================
    // getDiagnosisCode Function Tests
    // =========================================
    describe('getDiagnosisCode', () => {
        test('should return both SNOMED and ICD-10 codes for valid name', () => {
            const result = getDiagnosisCode('HYPERTENSION');
            expect(result.snomed).toBe('38341003');
            expect(result.icd10).toBe('I10');
            expect(result.name).toBe('hypertension');
        });

        test('should return null for codes not found', () => {
            const result = getDiagnosisCode('INVALID_CONDITION');
            expect(result.snomed).toBeNull();
            expect(result.icd10).toBeNull();
        });
    });

    // =========================================
    // convertSnomedToIcd10 Function Tests
    // =========================================
    describe('convertSnomedToIcd10', () => {
        test('should convert SNOMED to ICD-10 for mapped codes', () => {
            expect(convertSnomedToIcd10('38341003')).toBe('I10'); // Hypertension
            expect(convertSnomedToIcd10('84114007')).toBe('I50.9'); // Heart failure
            expect(convertSnomedToIcd10('44054006')).toBe('E11.9'); // Type 2 DM
        });

        test('should return null for unmapped SNOMED codes', () => {
            expect(convertSnomedToIcd10('0000000')).toBeNull();
        });
    });

    // =========================================
    // matchDiagnosisCode Function Tests
    // =========================================
    describe('matchDiagnosisCode', () => {
        test('should match SNOMED code and return diagnosis info', () => {
            const result = matchDiagnosisCode('38341003');
            expect(result).not.toBeNull();
            expect(result?.snomed).toBe('38341003');
            expect(result?.icd10).toBe('I10');
            expect(result?.name).toBe('hypertension');
        });

        test('should match ICD-10 code and return diagnosis info', () => {
            const result = matchDiagnosisCode('I10');
            expect(result).not.toBeNull();
            expect(result?.snomed).toBe('38341003');
            expect(result?.icd10).toBe('I10');
            expect(result?.name).toBe('hypertension');
        });

        test('should return null for unrecognized codes', () => {
            expect(matchDiagnosisCode('INVALID')).toBeNull();
            expect(matchDiagnosisCode('')).toBeNull();
        });
    });

    // =========================================
    // SNOMED_TO_ICD10_MAP Tests
    // =========================================
    describe('SNOMED_TO_ICD10_MAP', () => {
        test('should contain cardiovascular mappings', () => {
            expect(SNOMED_TO_ICD10_MAP['38341003']).toBe('I10'); // Hypertension
            expect(SNOMED_TO_ICD10_MAP['84114007']).toBe('I50.9'); // Heart failure
            expect(SNOMED_TO_ICD10_MAP['49436004']).toBe('I48.91'); // AFib
        });

        test('should contain metabolic mappings', () => {
            expect(SNOMED_TO_ICD10_MAP['44054006']).toBe('E11.9'); // Type 2 DM
            expect(SNOMED_TO_ICD10_MAP['55822004']).toBe('E78.5'); // Hyperlipidemia
        });
    });

    // =========================================
    // FHIR_CODE_SYSTEMS Tests
    // =========================================
    describe('FHIR_CODE_SYSTEMS', () => {
        test('should contain standard FHIR code system URLs', () => {
            expect(FHIR_CODE_SYSTEMS.LOINC).toBe('http://loinc.org');
            expect(FHIR_CODE_SYSTEMS.SNOMED_CT).toBe('http://snomed.info/sct');
            expect(FHIR_CODE_SYSTEMS.ICD10).toBe('http://hl7.org/fhir/sid/icd-10');
            expect(FHIR_CODE_SYSTEMS.ICD10_CM).toBe('http://hl7.org/fhir/sid/icd-10-cm');
            expect(FHIR_CODE_SYSTEMS.RXNORM).toBe('http://www.nlm.nih.gov/research/umls/rxnorm');
            expect(FHIR_CODE_SYSTEMS.OBSERVATION_CATEGORY).toBe('http://terminology.hl7.org/CodeSystem/observation-category');
            expect(FHIR_CODE_SYSTEMS.CONDITION_CLINICAL).toBe('http://terminology.hl7.org/CodeSystem/condition-clinical');
            expect(FHIR_CODE_SYSTEMS.V2_IDENTIFIER_TYPE).toBe('http://terminology.hl7.org/CodeSystem/v2-0203');
        });

        test('should contain Taiwan ICD-10 code system URLs', () => {
            expect(FHIR_CODE_SYSTEMS.ICD10_CM_TW).toBe('https://twcore.mohw.gov.tw/ig/twcore/CodeSystem/icd-10-cm-2023-tw');
            expect(FHIR_CODE_SYSTEMS.ICD10_PCS_TW).toBe('https://twcore.mohw.gov.tw/ig/twcore/CodeSystem/icd-10-pcs-2023-tw');
        });

        test('all URLs should be valid HTTP(S) URIs', () => {
            Object.values(FHIR_CODE_SYSTEMS).forEach(url => {
                expect(url).toMatch(/^https?:\/\//);
            });
        });
    });

    // =========================================
    // TW Core Vital Signs LOINC Codes Tests
    // =========================================
    describe('TW Core Vital Signs LOINC Codes', () => {
        test('should contain vital signs panel code', () => {
            expect(LOINC_CODES.VITAL_SIGNS_PANEL).toBe('85353-1');
        });

        test('should contain mean BP code', () => {
            expect(LOINC_CODES.MEAN_BP).toBe('8478-0');
        });

        test('should contain O2 flow rate code', () => {
            expect(LOINC_CODES.O2_FLOW_RATE).toBe('3151-8');
        });

        test('should contain body height variants', () => {
            expect(LOINC_CODES.BODY_HEIGHT_LYING).toBe('8306-3');
            expect(LOINC_CODES.BODY_HEIGHT_STANDING).toBe('8308-9');
        });

        test('should contain body weight measured', () => {
            expect(LOINC_CODES.BODY_WEIGHT_MEASURED).toBe('3141-9');
        });

        test('should contain head circumference tape', () => {
            expect(LOINC_CODES.HEAD_CIRCUMFERENCE_TAPE).toBe('8287-5');
        });
    });

    // =========================================
    // Average BP + ECG Codes Tests
    // =========================================
    describe('Average BP and ECG Codes', () => {
        test('should contain average blood pressure codes', () => {
            expect(LOINC_CODES.AVG_BP_PANEL).toBe('96607-7');
            expect(LOINC_CODES.AVG_BP_SYSTOLIC).toBe('96608-5');
            expect(LOINC_CODES.AVG_BP_DIASTOLIC).toBe('96609-3');
        });

        test('should contain ECG code', () => {
            expect(LOINC_CODES.ECG).toBe('11524-6');
        });
    });

    // =========================================
    // Comma-Separated Codes + Alternate Entries Tests
    // =========================================
    describe('Comma-Separated Codes and Alternate Entries', () => {
        test('comma-separated values should remain unchanged', () => {
            expect(LOINC_CODES.BP_PANEL).toBe('85354-9,55284-4');
            expect(LOINC_CODES.TEMPERATURE).toBe('8310-5,8331-1');
            expect(LOINC_CODES.URINE_SODIUM).toBe('2828-2,2955-3');
        });

        test('should have individual alternate entries', () => {
            expect(LOINC_CODES.BP_PANEL_ALT).toBe('55284-4');
            expect(LOINC_CODES.TEMPERATURE_ORAL).toBe('8331-1');
            expect(LOINC_CODES.URINE_SODIUM_RANDOM).toBe('2955-3');
        });
    });

    // =========================================
    // Pediatric Codes Tests
    // =========================================
    describe('Pediatric LOINC Codes', () => {
        test('should contain pediatric BMI for age', () => {
            expect(LOINC_CODES.PEDIATRIC_BMI_FOR_AGE).toBe('59576-9');
        });

        test('should contain pediatric weight for height', () => {
            expect(LOINC_CODES.PEDIATRIC_WEIGHT_FOR_HEIGHT).toBe('77606-2');
        });

        test('should contain pediatric head circumference', () => {
            expect(LOINC_CODES.PEDIATRIC_HEAD_CIRCUMFERENCE).toBe('8289-1');
        });
    });

    // =========================================
    // Smoking Status Complete Code Set Tests
    // =========================================
    describe('Smoking Status Complete Code Set', () => {
        test('should contain tobacco history LOINC code', () => {
            expect(LOINC_CODES.TOBACCO_HISTORY).toBe('11367-0');
        });

        test('should contain cigarette pack-years SNOMED codes', () => {
            expect(SNOMED_CODES.CIGARETTE_PACK_YEARS).toBe('401201003');
            expect(SNOMED_CODES.CALCULATED_PACK_YEARS).toBe('782516008');
        });

        test('should contain smoking status result value codes (TW Core comprehensive)', () => {
            expect(SNOMED_CODES.NEVER_SMOKER).toBe('266919005');
            expect(SNOMED_CODES.FORMER_SMOKER).toBe('8517006');
            expect(SNOMED_CODES.CURRENT_EVERY_DAY_SMOKER).toBe('449868002');
            expect(SNOMED_CODES.CURRENT_SOME_DAY_SMOKER).toBe('428041000124106');
            expect(SNOMED_CODES.CURRENT_HEAVY_SMOKER).toBe('428071000124103');
            expect(SNOMED_CODES.CURRENT_LIGHT_SMOKER).toBe('428061000124105');
            expect(SNOMED_CODES.SMOKING_STATUS_UNKNOWN).toBe('266927001');
        });

        test('should contain e-cigarette and exposure codes', () => {
            expect(SNOMED_CODES.E_CIGARETTE_USER).toBe('722499006');
            expect(SNOMED_CODES.SECONDHAND_SMOKE_EXPOSURE).toBe('699009004');
            expect(SNOMED_CODES.SECONDHAND_SMOKE_EVENT).toBe('16090371000119103');
            expect(SNOMED_CODES.OCCUPATIONAL_SMOKE_EXPOSURE).toBe('16090771000119104');
            expect(SNOMED_CODES.SMOKER_IN_FAMILY).toBe('275105001');
        });
    });

    // =========================================
    // Expanded getVitalSignsCodes Tests
    // =========================================
    describe('getVitalSignsCodes (expanded)', () => {
        test('should include new vital signs properties', () => {
            const vitalCodes = getVitalSignsCodes();
            expect(vitalCodes).toHaveProperty('vitalSignsPanel', '85353-1');
            expect(vitalCodes).toHaveProperty('meanBP', '8478-0');
            expect(vitalCodes).toHaveProperty('oxygenSaturationArterial', '2708-6');
            expect(vitalCodes).toHaveProperty('height', '8302-2');
            expect(vitalCodes).toHaveProperty('weight', '29463-7');
            expect(vitalCodes).toHaveProperty('bmi', '39156-5');
            expect(vitalCodes).toHaveProperty('headCircumference', '9843-4');
        });
    });

    // =========================================
    // Expanded getMeasurementType Tests
    // =========================================
    describe('getMeasurementType (expanded)', () => {
        test('should return pressure for BP-related codes', () => {
            expect(getMeasurementType('8478-0')).toBe('pressure');
            expect(getMeasurementType('96607-7')).toBe('pressure');
            expect(getMeasurementType('96608-5')).toBe('pressure');
            expect(getMeasurementType('96609-3')).toBe('pressure');
        });

        test('should return height for height variant codes', () => {
            expect(getMeasurementType('8306-3')).toBe('height');
            expect(getMeasurementType('8308-9')).toBe('height');
        });

        test('should return weight for measured weight code', () => {
            expect(getMeasurementType('3141-9')).toBe('weight');
        });

        test('should return circumference for head circumference tape code', () => {
            expect(getMeasurementType('8287-5')).toBe('circumference');
        });
    });

    // =========================================
    // TW Core Cross-Reference Validation
    // =========================================
    describe('TW Core Cross-Reference', () => {
        // All LOINC codes used in twcore/observation-profiles.ts LOINC_TO_TW_PROFILE_MAP
        const twCoreLoincCodes = [
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
            // Smoking Status
            '72166-2', '11367-0',
            // Average Blood Pressure
            '96607-7', '96608-5', '96609-3',
        ];

        test('every LOINC code in TW Core profile map should exist in LOINC_CODES values', () => {
            // Collect all individual LOINC code values (including comma-separated)
            const allLoincValues = new Set<string>();
            Object.values(LOINC_CODES).forEach(value => {
                value.split(',').forEach(code => allLoincValues.add(code.trim()));
            });

            const missing: string[] = [];
            twCoreLoincCodes.forEach(code => {
                if (!allLoincValues.has(code)) {
                    missing.push(code);
                }
            });

            expect(missing).toEqual([]);
        });

        test('every TW Core LOINC code should resolve to a profile via getTWCoreObservationProfile', () => {
            twCoreLoincCodes.forEach(code => {
                const profile = getTWCoreObservationProfile(code);
                expect(profile).not.toBeNull();
            });
        });
    });
});
