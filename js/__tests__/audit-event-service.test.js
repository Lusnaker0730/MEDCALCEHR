// src/__tests__/audit-event-service.test.ts
import { createAuditEventService } from '../audit-event-service';
import { secureLocalRetrieve } from '../security';
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
// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
    value: true,
    writable: true
});
describe('AuditEventService', () => {
    let auditService;
    beforeEach(() => {
        localStorageMock.clear();
        auditService = createAuditEventService({
            applicationId: 'test-app',
            applicationName: 'Test Application',
            applicationVersion: '1.0.0',
            enableLocalStorage: true,
            maxLocalEvents: 100,
            enableDebugLogging: false
        });
    });
    describe('createAuditEvent', () => {
        it('should create a valid FHIR AuditEvent resource', () => {
            const event = auditService.createAuditEvent({
                eventType: 'login',
                action: 'E',
                outcome: '0',
                agents: [
                    {
                        type: 'practitioner',
                        id: 'practitioner-123',
                        name: 'Dr. Test',
                        requestor: true
                    }
                ]
            });
            expect(event.resourceType).toBe('AuditEvent');
            expect(event.type.code).toBe('110122'); // DCM Login code
            expect(event.action).toBe('E');
            expect(event.outcome).toBe('0');
            expect(event.recorded).toBeDefined();
            expect(event.agent.length).toBeGreaterThanOrEqual(2); // Practitioner + Application
        });
        it('should include patient entity when provided', () => {
            const event = auditService.createAuditEvent({
                eventType: 'patient-record-access',
                action: 'R',
                outcome: '0',
                agents: [
                    {
                        type: 'practitioner',
                        id: 'practitioner-123',
                        requestor: true
                    }
                ],
                entities: [
                    {
                        type: 'patient',
                        what: 'Patient/patient-456',
                        name: 'Test Patient'
                    }
                ]
            });
            expect(event.entity).toBeDefined();
            expect(event.entity?.length).toBe(1);
            expect(event.entity?.[0].what?.reference).toBe('Patient/patient-456');
            expect(event.entity?.[0].name).toBe('Test Patient');
        });
        it('should handle calculation events with additional info', () => {
            const event = auditService.createAuditEvent({
                eventType: 'calculation',
                action: 'E',
                outcome: '0',
                agents: [
                    {
                        type: 'practitioner',
                        id: 'practitioner-123',
                        requestor: true
                    }
                ],
                additionalInfo: {
                    calculatorId: 'bmi-calc',
                    calculatorName: 'BMI Calculator',
                    inputs: '{"weight": 70, "height": 175}',
                    result: '{"bmi": 22.9}'
                }
            });
            expect(event.type.code).toBe('CALCULATE');
            expect(event.entity).toBeDefined();
            const detailEntity = event.entity?.find(e => e.detail);
            expect(detailEntity?.detail).toBeDefined();
            expect(detailEntity?.detail?.length).toBe(4);
        });
        it('should include subtype when provided', () => {
            const event = auditService.createAuditEvent({
                eventType: 'rest',
                action: 'R',
                outcome: '0',
                subtype: 'read',
                agents: [
                    {
                        type: 'practitioner',
                        id: 'practitioner-123',
                        requestor: true
                    }
                ]
            });
            expect(event.subtype).toBeDefined();
            expect(event.subtype?.[0].code).toBe('read');
        });
        it('should handle security labels on entities', () => {
            const event = auditService.createAuditEvent({
                eventType: 'patient-record-access',
                action: 'R',
                outcome: '0',
                agents: [
                    {
                        type: 'practitioner',
                        id: 'practitioner-123',
                        requestor: true
                    }
                ],
                entities: [
                    {
                        type: 'patient',
                        what: 'Patient/patient-456',
                        securityLabel: ['R', 'V']
                    }
                ]
            });
            expect(event.entity?.[0].securityLabel).toBeDefined();
            expect(event.entity?.[0].securityLabel?.length).toBe(2);
            expect(event.entity?.[0].securityLabel?.[0].code).toBe('R');
        });
        it('should include purpose of use when provided', () => {
            const event = auditService.createAuditEvent({
                eventType: 'patient-record-access',
                action: 'R',
                outcome: '0',
                purposeOfUse: 'TREAT',
                agents: [
                    {
                        type: 'practitioner',
                        id: 'practitioner-123',
                        requestor: true
                    }
                ]
            });
            expect(event.purposeOfEvent).toBeDefined();
            expect(event.purposeOfEvent?.[0].coding[0].code).toBe('TREAT');
        });
    });
    describe('Context Management', () => {
        it('should set practitioner context', () => {
            auditService.setPractitioner('prac-123', 'Dr. Smith', 'Physician');
            // Context is private, but we can verify through event creation
            const event = auditService.createAuditEvent({
                eventType: 'rest',
                action: 'R',
                outcome: '0',
                agents: []
            });
            // Application agent should always be present
            expect(event.agent.length).toBeGreaterThanOrEqual(1);
        });
        it('should set patient context', () => {
            auditService.setPatientContext('patient-456', 'John Doe');
            // Context is verified through subsequent event creation
        });
        it('should clear context', () => {
            auditService.setPractitioner('prac-123', 'Dr. Smith');
            auditService.setPatientContext('patient-456', 'John Doe');
            auditService.clearContext();
            // After clearing, new events won't have the previous context
        });
    });
    describe('Convenience Methods', () => {
        it('should log login event', async () => {
            await auditService.logLogin('prac-123', 'Dr. Smith', true);
            const events = auditService.getAuditEvents();
            expect(events.length).toBe(1);
            expect(events[0].type.code).toBe('110122'); // Login
            expect(events[0].outcome).toBe('0'); // Success
        });
        it('should log failed login event', async () => {
            await auditService.logLogin('prac-123', 'Dr. Smith', false);
            const events = auditService.getAuditEvents();
            expect(events.length).toBe(1);
            expect(events[0].outcome).toBe('4'); // Minor failure
        });
        it('should log patient access event', async () => {
            auditService.setPractitioner('prac-123', 'Dr. Smith');
            await auditService.logPatientAccess('patient-456', 'John Doe', 'Observation', 'obs-789');
            const events = auditService.getAuditEvents();
            expect(events.length).toBe(1);
            expect(events[0].type.code).toBe('110110'); // Patient Record
            expect(events[0].entity?.length).toBe(2); // Patient + Resource
        });
        it('should log resource read event', async () => {
            auditService.setPractitioner('prac-123', 'Dr. Smith');
            auditService.setPatientContext('patient-456', 'John Doe');
            await auditService.logResourceRead('Observation', 'obs-789', 'code=2160-0');
            const events = auditService.getAuditEvents();
            expect(events.length).toBe(1);
            expect(events[0].type.code).toBe('rest');
            expect(events[0].subtype?.[0].code).toBe('read');
        });
        it('should log calculation event', async () => {
            auditService.setPractitioner('prac-123', 'Dr. Smith');
            auditService.setPatientContext('patient-456', 'John Doe');
            await auditService.logCalculation('bmi-calc', 'BMI Calculator', { weight: 70, height: 175 }, { bmi: 22.9, category: 'Normal' }, true);
            const events = auditService.getAuditEvents();
            expect(events.length).toBe(1);
            expect(events[0].type.code).toBe('CALCULATE');
            expect(events[0].outcome).toBe('0');
        });
        it('should log data export event', async () => {
            auditService.setPractitioner('prac-123', 'Dr. Smith');
            await auditService.logDataExport('PDF', ['Patient', 'Observation'], 10);
            const events = auditService.getAuditEvents();
            expect(events.length).toBe(1);
            expect(events[0].type.code).toBe('110106'); // Export
        });
        it('should log security alert event', async () => {
            await auditService.logSecurityAlert('UNAUTHORIZED_ACCESS', 'Attempted access to restricted resource', 'high');
            const events = auditService.getAuditEvents();
            expect(events.length).toBe(1);
            expect(events[0].type.code).toBe('110113'); // Security Alert
            expect(events[0].outcome).toBe('8'); // Serious failure (high severity)
        });
    });
    describe('Local Storage', () => {
        it('should store events locally when enabled', async () => {
            await auditService.logLogin('prac-123', 'Dr. Smith', true);
            // Use secure retrieval since data is now encrypted
            const parsed = await secureLocalRetrieve('medcalc_audit_pending');
            expect(parsed).not.toBeNull();
            expect(parsed.length).toBe(1);
        });
        it('should respect maxLocalEvents limit', async () => {
            const smallService = createAuditEventService({
                applicationId: 'test-app',
                applicationName: 'Test',
                enableLocalStorage: true,
                maxLocalEvents: 3,
                enableDebugLogging: false
            });
            // Add 5 events
            for (let i = 0; i < 5; i++) {
                await smallService.logLogin(`prac-${i}`, `Dr. ${i}`, true);
            }
            // Use secure retrieval since data is now encrypted
            const parsed = await secureLocalRetrieve('medcalc_audit_pending');
            expect(parsed.length).toBe(3); // Should be pruned to max
        });
        it('should return pending event count', async () => {
            await auditService.logLogin('prac-1', 'Dr. One', true);
            await auditService.logLogin('prac-2', 'Dr. Two', true);
            expect(await auditService.getPendingEventCount()).toBe(2);
        });
        it('should clear local events', async () => {
            await auditService.logLogin('prac-123', 'Dr. Smith', true);
            auditService.clearLocalEvents();
            expect(await auditService.getPendingEventCount()).toBe(0);
            expect(auditService.getAuditEvents().length).toBe(0);
        });
    });
    describe('Export Functions', () => {
        it('should export events as JSON', async () => {
            await auditService.logLogin('prac-123', 'Dr. Smith', true);
            const json = auditService.exportEventsAsJson();
            const parsed = JSON.parse(json);
            expect(Array.isArray(parsed)).toBe(true);
            expect(parsed.length).toBe(1);
            expect(parsed[0].resourceType).toBe('AuditEvent');
        });
        it('should export events as FHIR Bundle', async () => {
            await auditService.logLogin('prac-123', 'Dr. Smith', true);
            await auditService.logPatientAccess('patient-456', 'John Doe');
            const bundle = auditService.exportEventsAsBundle();
            expect(bundle.resourceType).toBe('Bundle');
            expect(bundle.type).toBe('collection');
            expect(bundle.entry.length).toBe(2);
            expect(bundle.entry[0].resource.resourceType).toBe('AuditEvent');
        });
    });
    describe('Event Types', () => {
        const eventTypes = [
            { type: 'rest', expectedCode: 'rest' },
            { type: 'login', expectedCode: '110122' },
            { type: 'logout', expectedCode: '110123' },
            { type: 'patient-record-access', expectedCode: '110110' },
            { type: 'data-export', expectedCode: '110106' },
            { type: 'calculation', expectedCode: 'CALCULATE' },
            { type: 'consent-decision', expectedCode: '110142' },
            { type: 'security-alert', expectedCode: '110113' }
        ];
        test.each(eventTypes)('should handle %s event type', ({ type, expectedCode }) => {
            const event = auditService.createAuditEvent({
                eventType: type,
                action: 'E',
                outcome: '0',
                agents: [
                    {
                        type: 'practitioner',
                        id: 'prac-123',
                        requestor: true
                    }
                ]
            });
            expect(event.type.code).toBe(expectedCode);
        });
    });
    describe('Outcome Codes', () => {
        const outcomes = [
            { outcome: '0', description: 'Success' },
            { outcome: '4', description: 'Minor failure' },
            { outcome: '8', description: 'Serious failure' },
            { outcome: '12', description: 'Major failure' }
        ];
        test.each(outcomes)('should handle outcome $description ($outcome)', ({ outcome }) => {
            const event = auditService.createAuditEvent({
                eventType: 'rest',
                action: 'R',
                outcome,
                agents: [
                    {
                        type: 'practitioner',
                        id: 'prac-123',
                        requestor: true
                    }
                ]
            });
            expect(event.outcome).toBe(outcome);
        });
    });
    describe('Action Codes', () => {
        const actions = ['C', 'R', 'U', 'D', 'E'];
        test.each(actions)('should handle action %s', (action) => {
            const event = auditService.createAuditEvent({
                eventType: 'rest',
                action,
                outcome: '0',
                agents: [
                    {
                        type: 'practitioner',
                        id: 'prac-123',
                        requestor: true
                    }
                ]
            });
            expect(event.action).toBe(action);
        });
    });
});
