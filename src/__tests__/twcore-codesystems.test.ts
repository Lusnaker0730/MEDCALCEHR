/**
 * TW Core CodeSystems Tests
 * Tests for code system URLs, medication routes, and concept map lookups
 */

import { describe, expect, test } from '@jest/globals';
import {
    TW_CODE_SYSTEMS,
    TW_VALUE_SETS,
    TW_OBSERVATION_CATEGORIES,
    TW_MEDICATION_ROUTES,
} from '../twcore/codesystems.js';
import {
    MEDICATION_FREQUENCY_MAP,
    MEDICATION_ROUTE_TO_SNOMED,
    getNHIFrequencyMapping,
    getTWRouteToSNOMED,
} from '../twcore/concept-maps.js';

describe('TW Core CodeSystems', () => {
    describe('TW_CODE_SYSTEMS URL format', () => {
        test('should have valid URL format for all code system URLs', () => {
            for (const [key, url] of Object.entries(TW_CODE_SYSTEMS)) {
                expect(url).toMatch(/^https?:\/\//);
            }
        });

        test('should include NHI medication code system', () => {
            expect(TW_CODE_SYSTEMS.MEDICATION_NHI).toContain('medication-nhi-tw');
        });

        test('should include FDA medication code system', () => {
            expect(TW_CODE_SYSTEMS.MEDICATION_FDA).toContain('medication-fda-tw');
        });

        test('should include frequency code system', () => {
            expect(TW_CODE_SYSTEMS.MEDICATION_FREQUENCY_NHI).toContain('medication-frequency-nhi-tw');
        });

        test('should include medication path code system', () => {
            expect(TW_CODE_SYSTEMS.MEDICATION_PATH_TW).toContain('medication-path-tw');
        });

        test('should include category code system', () => {
            expect(TW_CODE_SYSTEMS.CATEGORY_CODE_TW).toContain('category-code-tw');
        });

        test('should include all ICD-10-CM Taiwan versions', () => {
            expect(TW_CODE_SYSTEMS.ICD_10_CM_TW_2023).toContain('icd-10-cm-2023-tw');
            expect(TW_CODE_SYSTEMS.ICD_10_CM_TW_2021).toContain('icd-10-cm-2021-tw');
            expect(TW_CODE_SYSTEMS.ICD_10_CM_TW_2014).toContain('icd-10-cm-2014-tw');
        });

        test('should include all ICD-10-PCS Taiwan versions', () => {
            expect(TW_CODE_SYSTEMS.ICD_10_PCS_TW_2023).toContain('icd-10-pcs-2023-tw');
            expect(TW_CODE_SYSTEMS.ICD_10_PCS_TW_2021).toContain('icd-10-pcs-2021-tw');
            expect(TW_CODE_SYSTEMS.ICD_10_PCS_TW_2014).toContain('icd-10-pcs-2014-tw');
        });

        test('should include ICD-9-CM Taiwan legacy version', () => {
            expect(TW_CODE_SYSTEMS.ICD_9_CM_TW_2001).toContain('icd-9-cm-2001-tw');
        });
    });

    describe('TW_VALUE_SETS URL format', () => {
        test('should have valid URL format for all value set URLs', () => {
            for (const [key, url] of Object.entries(TW_VALUE_SETS)) {
                expect(url).toMatch(/^https?:\/\//);
            }
        });

        test('should include vital signs value set', () => {
            expect(TW_VALUE_SETS.VITAL_SIGNS).toContain('vital-signs-tw');
        });

        test('should include laboratory code value set', () => {
            expect(TW_VALUE_SETS.LABORATORY_CODE).toContain('laboratory-code-tw');
        });

        test('should include all ICD-10-CM Taiwan ValueSet versions', () => {
            expect(TW_VALUE_SETS.ICD_10_CM_TW_2023).toContain('icd-10-cm-2023-tw');
            expect(TW_VALUE_SETS.ICD_10_CM_TW_2021).toContain('icd-10-cm-2021-tw');
            expect(TW_VALUE_SETS.ICD_10_CM_TW_2014).toContain('icd-10-cm-2014-tw');
        });

        test('should include all ICD-10-PCS Taiwan ValueSet versions', () => {
            expect(TW_VALUE_SETS.ICD_10_PCS_TW_2023).toContain('icd-10-pcs-2023-tw');
            expect(TW_VALUE_SETS.ICD_10_PCS_TW_2021).toContain('icd-10-pcs-2021-tw');
            expect(TW_VALUE_SETS.ICD_10_PCS_TW_2014).toContain('icd-10-pcs-2014-tw');
        });

        test('should include ICD-9-CM Taiwan legacy ValueSet', () => {
            expect(TW_VALUE_SETS.ICD_9_CM_TW_2001).toContain('icd-9-cm-2001-tw');
        });

        test('should include smoking status ValueSets', () => {
            expect(TW_VALUE_SETS.SMOKING_STATUS_COMPREHENSIVE).toContain('smoking-status-comprehensive-code');
            expect(TW_VALUE_SETS.SMOKING_STATUS_TYPE).toContain('smoking-status-type-code');
        });
    });

    describe('TW_OBSERVATION_CATEGORIES', () => {
        test('should have 6 category concepts', () => {
            expect(Object.keys(TW_OBSERVATION_CATEGORIES)).toHaveLength(6);
        });

        test('should include SDOH category', () => {
            expect(TW_OBSERVATION_CATEGORIES.SDOH.code).toBe('sdoh');
        });

        test('should include functional status', () => {
            expect(TW_OBSERVATION_CATEGORIES.FUNCTIONAL_STATUS.code).toBe('functional-status');
        });

        test('should include care experience preference', () => {
            expect(TW_OBSERVATION_CATEGORIES.CARE_EXPERIENCE_PREFERENCE.code).toBe('care-experience-preference');
        });

        test('all categories should have code, display, and definition', () => {
            for (const cat of Object.values(TW_OBSERVATION_CATEGORIES)) {
                expect(cat.code).toBeTruthy();
                expect(cat.display).toBeTruthy();
                expect(cat.definition).toBeTruthy();
            }
        });
    });

    describe('TW_MEDICATION_ROUTES', () => {
        test('should have 42 route entries', () => {
            expect(TW_MEDICATION_ROUTES).toHaveLength(42);
        });

        test('should include common routes', () => {
            const codes = TW_MEDICATION_ROUTES.map(r => r.code);
            expect(codes).toContain('PO');
            expect(codes).toContain('IV');
            expect(codes).toContain('IM');
            expect(codes).toContain('SC');
            expect(codes).toContain('IH');
            expect(codes).toContain('SL');
        });

        test('all routes should have code and display', () => {
            for (const route of TW_MEDICATION_ROUTES) {
                expect(route.code).toBeTruthy();
                expect(route.display).toBeTruthy();
            }
        });

        test('route codes should be unique', () => {
            const codes = TW_MEDICATION_ROUTES.map(r => r.code);
            expect(new Set(codes).size).toBe(codes.length);
        });
    });
});

describe('TW Core ConceptMaps', () => {
    describe('MEDICATION_FREQUENCY_MAP', () => {
        test('should have 9 frequency mappings', () => {
            expect(MEDICATION_FREQUENCY_MAP).toHaveLength(9);
        });

        test('should map QD correctly', () => {
            const qd = MEDICATION_FREQUENCY_MAP.find(m => m.nhiCode === 'QD');
            expect(qd).toBeDefined();
            expect(qd!.hl7Code).toBe('QD');
            expect(qd!.nhiDisplay).toBe('每日一次');
        });

        test('should map BID correctly', () => {
            const bid = MEDICATION_FREQUENCY_MAP.find(m => m.nhiCode === 'BID');
            expect(bid).toBeDefined();
            expect(bid!.hl7Code).toBe('BID');
        });

        test('should map HS to BED correctly', () => {
            const hs = MEDICATION_FREQUENCY_MAP.find(m => m.nhiCode === 'HS');
            expect(hs).toBeDefined();
            expect(hs!.hl7Code).toBe('BED');
        });
    });

    describe('getNHIFrequencyMapping()', () => {
        test('should return mapping for known NHI code', () => {
            const result = getNHIFrequencyMapping('QID');
            expect(result).toBeDefined();
            expect(result!.hl7Code).toBe('QID');
            expect(result!.nhiDisplay).toBe('每日四次');
        });

        test('should return undefined for unknown NHI code', () => {
            expect(getNHIFrequencyMapping('UNKNOWN')).toBeUndefined();
        });
    });

    describe('MEDICATION_ROUTE_TO_SNOMED', () => {
        test('should have 24 route-to-SNOMED mappings', () => {
            expect(MEDICATION_ROUTE_TO_SNOMED).toHaveLength(24);
        });

        test('should map PO to oral route SNOMED code', () => {
            const po = MEDICATION_ROUTE_TO_SNOMED.find(m => m.twCode === 'PO');
            expect(po).toBeDefined();
            expect(po!.snomedCode).toBe('26643006');
            expect(po!.snomedDisplay).toBe('Oral use');
        });

        test('should map IVD to intravenous route SNOMED code', () => {
            const ivd = MEDICATION_ROUTE_TO_SNOMED.find(m => m.twCode === 'IVD');
            expect(ivd).toBeDefined();
            expect(ivd!.snomedCode).toBe('47625008');
        });

        test('should map SC to subcutaneous route SNOMED code', () => {
            const sc = MEDICATION_ROUTE_TO_SNOMED.find(m => m.twCode === 'SC');
            expect(sc).toBeDefined();
            expect(sc!.snomedCode).toBe('34206005');
        });
    });

    describe('getTWRouteToSNOMED()', () => {
        test('should return mapping for known TW route code', () => {
            const result = getTWRouteToSNOMED('IM');
            expect(result).toBeDefined();
            expect(result!.snomedCode).toBe('78421000');
        });

        test('should return undefined for unknown TW route code', () => {
            expect(getTWRouteToSNOMED('UNKNOWN')).toBeUndefined();
        });
    });
});
