/**
 * TW Core Validation Tests
 * Tests for annotateTWCoreProfile and identifier system helpers
 */

import { describe, expect, test } from '@jest/globals';
import { annotateTWCoreProfile } from '../twcore/validation.js';
import {
    TW_IDENTIFIER_SYSTEMS,
    TW_IDENTIFIER_TYPE_CODES,
    isTWCoreIdentifierSystem,
    getIdentifierTypeLabel,
} from '../twcore/identifier-systems.js';
import { TW_CORE_PROFILES } from '../twcore/profiles.js';

describe('TW Core Validation', () => {
    describe('annotateTWCoreProfile()', () => {
        test('should add profile to resource without meta', () => {
            const resource: Record<string, any> = { resourceType: 'Patient', id: 'p1' };
            const result = annotateTWCoreProfile(resource, TW_CORE_PROFILES.Patient);

            expect(result.meta.profile).toContain(TW_CORE_PROFILES.Patient);
            expect(result.id).toBe('p1');
        });

        test('should add profile to resource with existing meta', () => {
            const resource: Record<string, any> = {
                resourceType: 'Patient',
                id: 'p1',
                meta: { versionId: '1' },
            };
            const result = annotateTWCoreProfile(resource, TW_CORE_PROFILES.Patient);

            expect(result.meta.profile).toContain(TW_CORE_PROFILES.Patient);
            expect(result.meta.versionId).toBe('1');
        });

        test('should not duplicate profile if already present', () => {
            const resource = {
                resourceType: 'Patient',
                id: 'p1',
                meta: { profile: [TW_CORE_PROFILES.Patient] },
            };
            const result = annotateTWCoreProfile(resource, TW_CORE_PROFILES.Patient);

            expect(result.meta.profile).toHaveLength(1);
        });

        test('should append profile to existing profiles array', () => {
            const resource = {
                resourceType: 'Observation',
                id: 'obs1',
                meta: { profile: ['http://example.com/profile/custom'] },
            };
            const result = annotateTWCoreProfile(resource, TW_CORE_PROFILES.ObservationVitalSigns);

            expect(result.meta.profile).toHaveLength(2);
            expect(result.meta.profile).toContain('http://example.com/profile/custom');
            expect(result.meta.profile).toContain(TW_CORE_PROFILES.ObservationVitalSigns);
        });

        test('should NOT mutate the original resource', () => {
            const resource = { resourceType: 'Patient', id: 'p1' };
            const result = annotateTWCoreProfile(resource, TW_CORE_PROFILES.Patient);

            expect(resource).not.toHaveProperty('meta');
            expect(result).not.toBe(resource);
        });

        test('should NOT mutate original meta.profile array', () => {
            const original = ['http://example.com/profile/custom'];
            const resource = {
                resourceType: 'Observation',
                id: 'obs1',
                meta: { profile: original },
            };
            annotateTWCoreProfile(resource, TW_CORE_PROFILES.ObservationVitalSigns);

            expect(original).toHaveLength(1);
        });
    });
});

describe('TW Core Identifier Systems', () => {
    describe('TW_IDENTIFIER_SYSTEMS', () => {
        test('should have 4 identifier systems', () => {
            expect(Object.keys(TW_IDENTIFIER_SYSTEMS)).toHaveLength(4);
        });

        test('should have correct National ID URL', () => {
            expect(TW_IDENTIFIER_SYSTEMS.NATIONAL_ID).toBe('http://www.moi.gov.tw');
        });

        test('should have correct Passport URL', () => {
            expect(TW_IDENTIFIER_SYSTEMS.PASSPORT).toBe('http://www.boca.gov.tw');
        });

        test('should have correct Resident Certificate URL', () => {
            expect(TW_IDENTIFIER_SYSTEMS.RESIDENT_CERTIFICATE).toBe('http://www.immigration.gov.tw');
        });

        test('should have correct Medical Record OID', () => {
            expect(TW_IDENTIFIER_SYSTEMS.MEDICAL_RECORD).toBe('urn:oid:2.16.886.101.20003');
        });
    });

    describe('TW_IDENTIFIER_TYPE_CODES', () => {
        test('should have NNTW code for National ID', () => {
            expect(TW_IDENTIFIER_TYPE_CODES.NATIONAL_ID.code).toBe('NNTW');
        });

        test('should have MR code for Medical Record', () => {
            expect(TW_IDENTIFIER_TYPE_CODES.MEDICAL_RECORD.code).toBe('MR');
        });

        test('should have PPN code for Passport', () => {
            expect(TW_IDENTIFIER_TYPE_CODES.PASSPORT.code).toBe('PPN');
        });

        test('should have PRC code for Resident Certificate', () => {
            expect(TW_IDENTIFIER_TYPE_CODES.RESIDENT_CERTIFICATE.code).toBe('PRC');
        });

        test('all type codes should use v2-0203 system', () => {
            for (const typeCode of Object.values(TW_IDENTIFIER_TYPE_CODES)) {
                expect(typeCode.system).toBe('http://terminology.hl7.org/CodeSystem/v2-0203');
            }
        });
    });

    describe('isTWCoreIdentifierSystem()', () => {
        test('should return true for known TW Core systems', () => {
            expect(isTWCoreIdentifierSystem('http://www.moi.gov.tw')).toBe(true);
            expect(isTWCoreIdentifierSystem('http://www.boca.gov.tw')).toBe(true);
            expect(isTWCoreIdentifierSystem('http://www.immigration.gov.tw')).toBe(true);
            expect(isTWCoreIdentifierSystem('urn:oid:2.16.886.101.20003')).toBe(true);
        });

        test('should return false for unknown systems', () => {
            expect(isTWCoreIdentifierSystem('http://example.com')).toBe(false);
            expect(isTWCoreIdentifierSystem('')).toBe(false);
        });
    });

    describe('getIdentifierTypeLabel()', () => {
        test('should return Chinese label for National ID', () => {
            expect(getIdentifierTypeLabel('http://www.moi.gov.tw')).toBe('國民身分證');
        });

        test('should return Chinese label for Passport', () => {
            expect(getIdentifierTypeLabel('http://www.boca.gov.tw')).toBe('護照');
        });

        test('should return Chinese label for Resident Certificate', () => {
            expect(getIdentifierTypeLabel('http://www.immigration.gov.tw')).toBe('居留證');
        });

        test('should return Chinese label for Medical Record', () => {
            expect(getIdentifierTypeLabel('urn:oid:2.16.886.101.20003')).toBe('病歷號');
        });

        test('should return null for unknown system', () => {
            expect(getIdentifierTypeLabel('http://example.com')).toBeNull();
        });
    });
});
