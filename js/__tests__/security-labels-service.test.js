// src/__tests__/security-labels-service.test.ts
import { createSecurityLabelsService } from '../security-labels-service';
// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => {
            store[key] = value;
        },
        removeItem: (key) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        }
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });
// Mock audit service
jest.mock('../audit-event-service', () => ({
    auditEventService: {
        logSecurityAlert: jest.fn().mockResolvedValue(undefined)
    }
}));
describe('SecurityLabelsService', () => {
    let service;
    beforeEach(() => {
        service = createSecurityLabelsService({
            enableMasking: true,
            enableWarnings: true,
            defaultConfidentiality: 'N',
            logSensitiveAccess: true,
            enableBreakTheGlass: true,
            enableDebugLogging: false
        });
    });
    describe('extractSecurityLabels', () => {
        it('should extract security labels from resource meta', () => {
            const resource = {
                resourceType: 'Patient',
                id: 'test-123',
                meta: {
                    security: [
                        { system: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality', code: 'R', display: 'Restricted' }
                    ]
                }
            };
            const labels = service.extractSecurityLabels(resource);
            expect(labels).toHaveLength(1);
            expect(labels[0].code).toBe('R');
        });
        it('should return empty array if no security labels', () => {
            const resource = {
                resourceType: 'Patient',
                id: 'test-123'
            };
            const labels = service.extractSecurityLabels(resource);
            expect(labels).toHaveLength(0);
        });
    });
    describe('getConfidentiality', () => {
        it('should get confidentiality from security labels', () => {
            const resource = {
                resourceType: 'Observation',
                meta: {
                    security: [
                        { system: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality', code: 'V' }
                    ]
                }
            };
            expect(service.getConfidentiality(resource)).toBe('V');
        });
        it('should return default confidentiality if not specified', () => {
            const resource = {
                resourceType: 'Observation'
            };
            expect(service.getConfidentiality(resource)).toBe('N');
        });
        it('should detect restricted label from other sources', () => {
            const resource = {
                resourceType: 'Observation',
                meta: {
                    security: [
                        { system: 'other-system', code: 'R' }
                    ]
                }
            };
            expect(service.getConfidentiality(resource)).toBe('R');
        });
    });
    describe('detectSensitivities', () => {
        it('should detect HIV sensitivity from condition codes', () => {
            const resource = {
                resourceType: 'Condition',
                code: {
                    coding: [
                        { system: 'http://snomed.info/sct', code: '86406008' } // HIV
                    ]
                }
            };
            const sensitivities = service.detectSensitivities(resource);
            expect(sensitivities).toContain('HIV');
        });
        it('should detect psychiatric sensitivity', () => {
            const resource = {
                resourceType: 'Condition',
                code: {
                    coding: [
                        { system: 'http://hl7.org/fhir/sid/icd-10', code: 'F20.0' } // Schizophrenia
                    ]
                }
            };
            const sensitivities = service.detectSensitivities(resource);
            expect(sensitivities).toContain('PSY');
        });
        it('should detect multiple sensitivities', () => {
            const resource = {
                resourceType: 'Condition',
                meta: {
                    security: [
                        { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'HIV' },
                        { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'PSY' }
                    ]
                }
            };
            const sensitivities = service.detectSensitivities(resource);
            expect(sensitivities).toContain('HIV');
            expect(sensitivities).toContain('PSY');
        });
        it('should detect minor patient', () => {
            const today = new Date();
            const minorBirthDate = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
            const resource = {
                resourceType: 'Patient',
                birthDate: minorBirthDate.toISOString().split('T')[0]
            };
            const sensitivities = service.detectSensitivities(resource);
            expect(sensitivities).toContain('MINOR');
        });
        it('should detect VIP patient from tags', () => {
            const resource = {
                resourceType: 'Patient',
                meta: {
                    tag: [
                        { system: 'http://example.com/tags', code: 'VIP' }
                    ]
                }
            };
            const sensitivities = service.detectSensitivities(resource);
            expect(sensitivities).toContain('CELEBRITY');
        });
    });
    describe('assessSecurity', () => {
        it('should return ALLOW for normal confidentiality', () => {
            const resource = {
                resourceType: 'Observation',
                meta: {
                    security: [
                        { system: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality', code: 'N' }
                    ]
                }
            };
            const assessment = service.assessSecurity(resource);
            expect(assessment.decision).toBe('ALLOW');
            expect(assessment.confidentiality).toBe('N');
        });
        it('should return MASK for restricted without user context', () => {
            const resource = {
                resourceType: 'Observation',
                meta: {
                    security: [
                        { system: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality', code: 'R' }
                    ]
                }
            };
            const assessment = service.assessSecurity(resource);
            expect(assessment.decision).toBe('MASK');
        });
        it('should return DENY for very restricted without user context', () => {
            const resource = {
                resourceType: 'Observation',
                meta: {
                    security: [
                        { system: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality', code: 'V' }
                    ]
                }
            };
            const assessment = service.assessSecurity(resource);
            expect(assessment.decision).toBe('DENY');
        });
        it('should include warning message for restricted data', () => {
            const resource = {
                resourceType: 'Condition',
                meta: {
                    security: [
                        { system: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality', code: 'R' },
                        { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'HIV' }
                    ]
                }
            };
            const assessment = service.assessSecurity(resource);
            expect(assessment.warningMessage).toBeDefined();
            expect(assessment.warningMessage).toContain('限制級');
        });
        it('should identify masked fields', () => {
            const resource = {
                resourceType: 'Patient',
                meta: {
                    security: [
                        { system: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality', code: 'V' }
                    ]
                }
            };
            const assessment = service.assessSecurity(resource);
            expect(assessment.maskedFields).toContain('name');
            expect(assessment.maskedFields).toContain('identifier');
        });
    });
    describe('User Authorization', () => {
        const authorizedUser = {
            userId: 'user-123',
            roles: ['physician', 'hiv-care-provider'],
            authorizedCategories: ['HIV', 'PSY', 'GENERAL'],
            permissions: ['access:HIV', 'access:PSY']
        };
        it('should allow authorized user to access restricted data', () => {
            service.setUserContext(authorizedUser);
            const resource = {
                resourceType: 'Condition',
                meta: {
                    security: [
                        { system: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality', code: 'R' },
                        { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'HIV' }
                    ]
                }
            };
            const assessment = service.assessSecurity(resource);
            expect(assessment.decision).toBe('WARN'); // Allowed but with warning
        });
        it('should mask data for unauthorized user', () => {
            const unauthorizedUser = {
                userId: 'user-456',
                roles: ['nurse'],
                authorizedCategories: ['GENERAL'],
                permissions: []
            };
            service.setUserContext(unauthorizedUser);
            const resource = {
                resourceType: 'Condition',
                meta: {
                    security: [
                        { system: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality', code: 'R' },
                        { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'HIV' }
                    ]
                }
            };
            const assessment = service.assessSecurity(resource);
            expect(assessment.decision).toBe('MASK');
        });
        it('should clear user context', () => {
            service.setUserContext(authorizedUser);
            service.clearUserContext();
            expect(service.getUserContext()).toBeNull();
        });
    });
    describe('maskResource', () => {
        it('should mask patient name fields', () => {
            const resource = {
                resourceType: 'Patient',
                id: 'patient-123',
                meta: {
                    security: [
                        { system: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality', code: 'R' }
                    ]
                },
                name: [
                    { text: 'John Doe', family: 'Doe', given: ['John'] }
                ]
            };
            const masked = service.maskResource(resource);
            expect(masked.name[0].text).not.toBe('John Doe');
            expect(masked.name[0].family).not.toBe('Doe');
        });
        it('should add MASKED tag to meta', () => {
            const resource = {
                resourceType: 'Patient',
                meta: {
                    security: [
                        { system: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality', code: 'R' }
                    ]
                },
                name: [{ text: 'Test' }]
            };
            const masked = service.maskResource(resource);
            expect(masked.meta?.tag).toBeDefined();
            expect(masked.meta?.tag?.some(t => t.code === 'MASKED')).toBe(true);
        });
        it('should not mask data with ALLOW decision', () => {
            const resource = {
                resourceType: 'Patient',
                meta: {
                    security: [
                        { system: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality', code: 'N' }
                    ]
                },
                name: [{ text: 'John Doe' }]
            };
            const masked = service.maskResource(resource);
            expect(masked.name[0].text).toBe('John Doe');
        });
    });
    describe('maskString', () => {
        it('should fully mask string', () => {
            const masked = service.maskString('Hello World', { style: 'full' });
            expect(masked).toBe('●●●●●●●●●●●');
            expect(masked.length).toBe('Hello World'.length);
        });
        it('should partially mask string', () => {
            const masked = service.maskString('Hello World', { style: 'partial', visibleChars: 2 });
            expect(masked).toMatch(/^He●+$/);
        });
        it('should redact string', () => {
            const masked = service.maskString('Hello World', { style: 'redact', maskText: '[REDACTED]' });
            expect(masked).toBe('[REDACTED]');
        });
    });
    describe('addSecurityLabel', () => {
        it('should add confidentiality label to resource', () => {
            const resource = {
                resourceType: 'Observation',
                id: 'obs-123'
            };
            const updated = service.addSecurityLabel(resource, 'R');
            expect(updated.meta?.security).toBeDefined();
            expect(updated.meta?.security?.some(l => l.code === 'R')).toBe(true);
        });
        it('should add sensitivity labels', () => {
            const resource = {
                resourceType: 'Observation'
            };
            const updated = service.addSecurityLabel(resource, 'R', ['HIV', 'PSY']);
            expect(updated.meta?.security?.length).toBeGreaterThanOrEqual(3);
        });
        it('should replace existing confidentiality label', () => {
            const resource = {
                resourceType: 'Observation',
                meta: {
                    security: [
                        { system: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality', code: 'N' }
                    ]
                }
            };
            const updated = service.addSecurityLabel(resource, 'V');
            const confLabels = updated.meta?.security?.filter(l => l.system === 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality');
            expect(confLabels?.length).toBe(1);
            expect(confLabels?.[0].code).toBe('V');
        });
    });
    describe('compareConfidentiality', () => {
        it('should correctly compare confidentiality levels', () => {
            expect(service.compareConfidentiality('U', 'V')).toBeLessThan(0);
            expect(service.compareConfidentiality('V', 'U')).toBeGreaterThan(0);
            expect(service.compareConfidentiality('R', 'R')).toBe(0);
            expect(service.compareConfidentiality('N', 'R')).toBeLessThan(0);
        });
    });
    describe('getHighestConfidentiality', () => {
        it('should return highest confidentiality from resources', () => {
            const resources = [
                {
                    resourceType: 'Observation',
                    meta: { security: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality', code: 'N' }] }
                },
                {
                    resourceType: 'Observation',
                    meta: { security: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality', code: 'V' }] }
                },
                {
                    resourceType: 'Observation',
                    meta: { security: [{ system: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality', code: 'R' }] }
                }
            ];
            expect(service.getHighestConfidentiality(resources)).toBe('V');
        });
        it('should return default for empty array', () => {
            expect(service.getHighestConfidentiality([])).toBe('N');
        });
    });
    describe('UI Components', () => {
        it('should create security badge element', () => {
            const assessment = {
                confidentiality: 'R',
                sensitivities: ['HIV'],
                decision: 'WARN',
                maskedFields: ['name'],
                warningMessage: 'Test warning',
                requiresAuthorization: false,
                labels: []
            };
            const badge = service.createSecurityBadge(assessment);
            expect(badge.tagName).toBe('SPAN');
            expect(badge.className).toContain('security-badge');
            expect(badge.className).toContain('security-r');
        });
        it('should get CSS styles', () => {
            const styles = service.getStyles();
            expect(styles).toContain('.security-badge');
            expect(styles).toContain('.security-warning-dialog');
        });
    });
    describe('Access Log', () => {
        it('should log access to sensitive data', () => {
            const resource = {
                resourceType: 'Condition',
                id: 'cond-123',
                meta: {
                    security: [
                        { system: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality', code: 'R' }
                    ]
                }
            };
            service.assessSecurity(resource);
            const log = service.getAccessLog();
            expect(log.length).toBeGreaterThan(0);
            expect(log[0].resourceId).toBe('cond-123');
        });
        it('should clear access log', () => {
            const resource = {
                resourceType: 'Condition',
                id: 'cond-123',
                meta: {
                    security: [
                        { system: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality', code: 'R' }
                    ]
                }
            };
            service.assessSecurity(resource);
            service.clearAccessLog();
            expect(service.getAccessLog().length).toBe(0);
        });
    });
    describe('Confidentiality Codes', () => {
        const codes = ['U', 'L', 'M', 'N', 'R', 'V'];
        test.each(codes)('should handle confidentiality code %s', (code) => {
            const resource = {
                resourceType: 'Observation',
                meta: {
                    security: [
                        { system: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality', code }
                    ]
                }
            };
            expect(service.getConfidentiality(resource)).toBe(code);
        });
    });
    describe('Sensitivity Categories', () => {
        const categories = [
            { code: '86406008', expected: 'HIV' }, // HIV SNOMED
            { code: 'B20', expected: 'HIV' }, // HIV ICD-10
            { code: 'F20', expected: 'PSY' }, // Schizophrenia
            { code: 'F10', expected: 'ETH' }, // Alcohol use
            { code: 'T74', expected: 'SDV' }, // Maltreatment
            { code: 'A50', expected: 'SEX' } // Syphilis
        ];
        test.each(categories)('should detect $expected from code $code', ({ code, expected }) => {
            const resource = {
                resourceType: 'Condition',
                code: {
                    coding: [{ code }]
                }
            };
            const sensitivities = service.detectSensitivities(resource);
            expect(sensitivities).toContain(expected);
        });
    });
});
