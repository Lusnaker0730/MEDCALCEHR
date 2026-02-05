// src/audit-event-service.ts
// FHIR AuditEvent Service following IHE BALP (Basic Audit Log Patterns)
// Reference: https://profiles.ihe.net/ITI/BALP/index.html
import { secureLocalStore, secureLocalRetrieve } from './security.js';
// ============================================================================
// Constants
// ============================================================================
/**
 * Code systems used in audit events
 */
const CODE_SYSTEMS = {
    AUDIT_EVENT_TYPE: 'http://terminology.hl7.org/CodeSystem/audit-event-type',
    AUDIT_EVENT_SUBTYPE: 'http://hl7.org/fhir/restful-interaction',
    DCM: 'http://dicom.nema.org/resources/ontology/DCM',
    PARTICIPANT_TYPE: 'http://terminology.hl7.org/CodeSystem/v3-ParticipationType',
    ENTITY_TYPE: 'http://terminology.hl7.org/CodeSystem/audit-entity-type',
    ENTITY_ROLE: 'http://terminology.hl7.org/CodeSystem/object-role',
    SECURITY_LABELS: 'http://terminology.hl7.org/CodeSystem/v3-Confidentiality',
    PURPOSE_OF_USE: 'http://terminology.hl7.org/CodeSystem/v3-ActReason',
    IHE_BALP: 'https://profiles.ihe.net/ITI/BALP/CodeSystem/BasicAuditLogPatterns'
};
/**
 * Event type mappings to FHIR codes
 */
const EVENT_TYPE_CODES = {
    rest: {
        system: CODE_SYSTEMS.AUDIT_EVENT_TYPE,
        code: 'rest',
        display: 'RESTful Operation'
    },
    login: {
        system: CODE_SYSTEMS.DCM,
        code: '110122',
        display: 'Login'
    },
    logout: {
        system: CODE_SYSTEMS.DCM,
        code: '110123',
        display: 'Logout'
    },
    'patient-record-access': {
        system: CODE_SYSTEMS.DCM,
        code: '110110',
        display: 'Patient Record'
    },
    'data-export': {
        system: CODE_SYSTEMS.DCM,
        code: '110106',
        display: 'Export'
    },
    calculation: {
        system: CODE_SYSTEMS.IHE_BALP,
        code: 'CALCULATE',
        display: 'Medical Calculation'
    },
    'consent-decision': {
        system: CODE_SYSTEMS.DCM,
        code: '110142',
        display: 'Consent Directive'
    },
    'security-alert': {
        system: CODE_SYSTEMS.DCM,
        code: '110113',
        display: 'Security Alert'
    }
};
/**
 * Agent type mappings to FHIR codes
 */
const AGENT_TYPE_CODES = {
    practitioner: {
        system: CODE_SYSTEMS.PARTICIPANT_TYPE,
        code: 'PROV',
        display: 'Healthcare Provider'
    },
    patient: {
        system: CODE_SYSTEMS.PARTICIPANT_TYPE,
        code: 'PAT',
        display: 'Patient'
    },
    application: {
        system: CODE_SYSTEMS.DCM,
        code: '110150',
        display: 'Application'
    },
    device: {
        system: CODE_SYSTEMS.DCM,
        code: '110153',
        display: 'Source Role ID'
    }
};
/**
 * Entity type mappings to FHIR codes
 */
const ENTITY_TYPE_CODES = {
    patient: {
        system: CODE_SYSTEMS.ENTITY_TYPE,
        code: '1',
        display: 'Person'
    },
    resource: {
        system: CODE_SYSTEMS.ENTITY_TYPE,
        code: '2',
        display: 'System Object'
    },
    query: {
        system: CODE_SYSTEMS.ENTITY_TYPE,
        code: '2',
        display: 'System Object'
    }
};
/**
 * Entity role mappings to FHIR codes
 */
const ENTITY_ROLE_CODES = {
    patient: {
        system: CODE_SYSTEMS.ENTITY_ROLE,
        code: '1',
        display: 'Patient'
    },
    resource: {
        system: CODE_SYSTEMS.ENTITY_ROLE,
        code: '4',
        display: 'Domain Resource'
    },
    query: {
        system: CODE_SYSTEMS.ENTITY_ROLE,
        code: '24',
        display: 'Query'
    }
};
// ============================================================================
// Local Storage Keys
// ============================================================================
const STORAGE_KEYS = {
    PENDING_EVENTS: 'medcalc_audit_pending',
    EVENT_SEQUENCE: 'medcalc_audit_sequence'
};
// ============================================================================
// AuditEventService Class
// ============================================================================
/**
 * FHIR AuditEvent Service
 * Provides comprehensive audit logging following IHE BALP patterns
 */
export class AuditEventService {
    constructor(config = {}) {
        this.currentPractitioner = null;
        this.currentPatient = null;
        this.eventQueue = [];
        this.isOnline = navigator.onLine;
        this.config = {
            enableLocalStorage: true,
            maxLocalEvents: 1000,
            applicationId: 'medcalc-ehr',
            applicationName: 'MedCalc EHR',
            applicationVersion: '1.0.0',
            enableDebugLogging: false,
            ...config
        };
        this.sessionId = this.generateSessionId();
        // Monitor online/offline status
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.flushPendingEvents();
        });
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
        // Load pending events from local storage
        this.loadPendingEvents();
    }
    // ========================================================================
    // Session Management
    // ========================================================================
    /**
     * Generate a unique session ID
     */
    generateSessionId() {
        return `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }
    /**
     * Set the current practitioner context
     */
    setPractitioner(id, name, role) {
        this.currentPractitioner = {
            type: 'practitioner',
            id,
            name,
            role,
            requestor: true
        };
        this.log('Practitioner context set:', this.currentPractitioner);
    }
    /**
     * Set the current patient context
     */
    setPatientContext(patientId, patientName) {
        this.currentPatient = {
            type: 'patient',
            what: `Patient/${patientId}`,
            name: patientName
        };
        this.log('Patient context set:', this.currentPatient);
    }
    /**
     * Clear the current session context
     */
    clearContext() {
        this.currentPractitioner = null;
        this.currentPatient = null;
        this.sessionId = this.generateSessionId();
        this.log('Session context cleared');
    }
    // ========================================================================
    // Audit Event Creation
    // ========================================================================
    /**
     * Create a FHIR AuditEvent resource
     */
    createAuditEvent(params) {
        const now = new Date();
        const eventTypeCode = EVENT_TYPE_CODES[params.eventType];
        const auditEvent = {
            resourceType: 'AuditEvent',
            meta: {
                profile: ['https://profiles.ihe.net/ITI/BALP/StructureDefinition/IHE.BasicAudit.PatientRead'],
                lastUpdated: now.toISOString()
            },
            type: eventTypeCode,
            action: params.action,
            recorded: now.toISOString(),
            outcome: params.outcome,
            agent: [],
            source: {
                site: this.config.siteId,
                observer: {
                    identifier: {
                        system: 'urn:ietf:rfc:3986',
                        value: `urn:oid:${this.config.applicationId}`
                    },
                    display: this.config.applicationName
                },
                type: [
                    {
                        system: CODE_SYSTEMS.DCM,
                        code: '110150',
                        display: 'Application'
                    }
                ]
            }
        };
        // Add subtype if provided
        if (params.subtype) {
            auditEvent.subtype = [
                {
                    system: CODE_SYSTEMS.AUDIT_EVENT_SUBTYPE,
                    code: params.subtype,
                    display: params.subtype
                }
            ];
        }
        // Add period if provided
        if (params.startTime) {
            auditEvent.period = {
                start: params.startTime.toISOString(),
                end: params.endTime?.toISOString()
            };
        }
        // Add outcome description if provided
        if (params.outcomeDescription) {
            auditEvent.outcomeDesc = params.outcomeDescription;
        }
        // Add purpose of use if provided
        if (params.purposeOfUse) {
            auditEvent.purposeOfEvent = [
                {
                    coding: [
                        {
                            system: CODE_SYSTEMS.PURPOSE_OF_USE,
                            code: params.purposeOfUse,
                            display: params.purposeOfUse
                        }
                    ]
                }
            ];
        }
        // Add agents
        for (const agent of params.agents) {
            const agentTypeCode = AGENT_TYPE_CODES[agent.type];
            auditEvent.agent.push({
                type: {
                    coding: [agentTypeCode]
                },
                who: {
                    reference: agent.type === 'practitioner' ? `Practitioner/${agent.id}` :
                        agent.type === 'patient' ? `Patient/${agent.id}` :
                            undefined,
                    identifier: agent.type === 'application' ? {
                        system: 'urn:ietf:rfc:3986',
                        value: agent.id
                    } : undefined,
                    display: agent.name
                },
                name: agent.name,
                requestor: agent.requestor,
                network: {
                    address: window.location.hostname,
                    type: '1' // Machine name
                }
            });
        }
        // Always add the application as an agent
        auditEvent.agent.push({
            type: {
                coding: [AGENT_TYPE_CODES.application]
            },
            who: {
                identifier: {
                    system: 'urn:ietf:rfc:3986',
                    value: `urn:oid:${this.config.applicationId}`
                },
                display: this.config.applicationName
            },
            name: this.config.applicationName,
            requestor: false,
            network: {
                address: window.location.origin,
                type: '5' // URI
            }
        });
        // Add entities
        if (params.entities && params.entities.length > 0) {
            auditEvent.entity = [];
            for (const entity of params.entities) {
                const entityTypeCode = ENTITY_TYPE_CODES[entity.type];
                const entityRoleCode = ENTITY_ROLE_CODES[entity.type];
                const entityEntry = {
                    what: {
                        reference: entity.what,
                        display: entity.name
                    },
                    type: entityTypeCode,
                    role: entityRoleCode,
                    name: entity.name,
                    description: entity.description
                };
                // Add security labels if provided
                if (entity.securityLabel && entity.securityLabel.length > 0) {
                    entityEntry.securityLabel = entity.securityLabel.map(label => ({
                        system: CODE_SYSTEMS.SECURITY_LABELS,
                        code: label,
                        display: label
                    }));
                }
                // Add query if this is a query entity
                if (entity.type === 'query' && entity.query) {
                    entityEntry.query = btoa(entity.query); // Base64 encode
                }
                auditEvent.entity.push(entityEntry);
            }
        }
        // Add additional info as entity details
        if (params.additionalInfo) {
            if (!auditEvent.entity) {
                auditEvent.entity = [];
            }
            const detailEntity = {
                type: {
                    system: CODE_SYSTEMS.ENTITY_TYPE,
                    code: '2',
                    display: 'System Object'
                },
                detail: Object.entries(params.additionalInfo).map(([key, value]) => ({
                    type: key,
                    valueString: value
                }))
            };
            auditEvent.entity.push(detailEntity);
        }
        return auditEvent;
    }
    // ========================================================================
    // Convenience Methods for Common Audit Events
    // ========================================================================
    /**
     * Record a login event
     */
    async logLogin(practitionerId, practitionerName, success = true) {
        this.setPractitioner(practitionerId, practitionerName);
        const event = this.createAuditEvent({
            eventType: 'login',
            action: 'E',
            outcome: success ? '0' : '4',
            outcomeDescription: success ? 'Login successful' : 'Login failed',
            agents: [
                {
                    type: 'practitioner',
                    id: practitionerId,
                    name: practitionerName,
                    requestor: true
                }
            ],
            additionalInfo: {
                sessionId: this.sessionId,
                userAgent: navigator.userAgent
            }
        });
        await this.recordEvent(event);
    }
    /**
     * Record a logout event
     */
    async logLogout() {
        if (!this.currentPractitioner) {
            this.log('No practitioner context for logout event');
            return;
        }
        const event = this.createAuditEvent({
            eventType: 'logout',
            action: 'E',
            outcome: '0',
            agents: [this.currentPractitioner],
            additionalInfo: {
                sessionId: this.sessionId
            }
        });
        await this.recordEvent(event);
        this.clearContext();
    }
    /**
     * Record a patient record access event
     */
    async logPatientAccess(patientId, patientName, resourceType, resourceId) {
        this.setPatientContext(patientId, patientName);
        const entities = [
            {
                type: 'patient',
                what: `Patient/${patientId}`,
                name: patientName
            }
        ];
        // Add specific resource if provided
        if (resourceType && resourceId) {
            entities.push({
                type: 'resource',
                what: `${resourceType}/${resourceId}`,
                description: `${resourceType} resource access`
            });
        }
        const agents = [];
        if (this.currentPractitioner) {
            agents.push(this.currentPractitioner);
        }
        const event = this.createAuditEvent({
            eventType: 'patient-record-access',
            action: 'R',
            outcome: '0',
            purposeOfUse: 'TREAT', // Treatment
            agents,
            entities
        });
        await this.recordEvent(event);
    }
    /**
     * Record a FHIR resource read event
     */
    async logResourceRead(resourceType, resourceId, query) {
        const entities = [
            {
                type: 'resource',
                what: `${resourceType}/${resourceId}`,
                description: `Read ${resourceType}`
            }
        ];
        // Add patient context if available
        if (this.currentPatient) {
            entities.unshift(this.currentPatient);
        }
        // Add query if provided
        if (query) {
            entities.push({
                type: 'query',
                what: `${resourceType}`,
                query,
                description: 'FHIR Search Query'
            });
        }
        const agents = [];
        if (this.currentPractitioner) {
            agents.push(this.currentPractitioner);
        }
        const event = this.createAuditEvent({
            eventType: 'rest',
            action: 'R',
            outcome: '0',
            subtype: 'read',
            agents,
            entities
        });
        await this.recordEvent(event);
    }
    /**
     * Record a medical calculation event
     */
    async logCalculation(calculatorId, calculatorName, inputs, result, success = true) {
        const entities = [];
        // Add patient context if available
        if (this.currentPatient) {
            entities.push(this.currentPatient);
        }
        const agents = [];
        if (this.currentPractitioner) {
            agents.push(this.currentPractitioner);
        }
        // Sanitize inputs and results (remove any PHI that shouldn't be logged)
        const sanitizedInputs = this.sanitizeForAudit(inputs);
        const sanitizedResult = this.sanitizeForAudit(result);
        const event = this.createAuditEvent({
            eventType: 'calculation',
            action: 'E',
            outcome: success ? '0' : '4',
            outcomeDescription: success
                ? `${calculatorName} calculation completed`
                : `${calculatorName} calculation failed`,
            agents,
            entities,
            additionalInfo: {
                calculatorId,
                calculatorName,
                inputs: JSON.stringify(sanitizedInputs),
                result: JSON.stringify(sanitizedResult),
                timestamp: new Date().toISOString()
            }
        });
        await this.recordEvent(event);
    }
    /**
     * Record a data export event
     */
    async logDataExport(exportType, resourceTypes, recordCount) {
        const entities = [];
        // Add patient context if available
        if (this.currentPatient) {
            entities.push(this.currentPatient);
        }
        const agents = [];
        if (this.currentPractitioner) {
            agents.push(this.currentPractitioner);
        }
        const event = this.createAuditEvent({
            eventType: 'data-export',
            action: 'R',
            outcome: '0',
            agents,
            entities,
            additionalInfo: {
                exportType,
                resourceTypes: resourceTypes.join(','),
                recordCount: recordCount.toString()
            }
        });
        await this.recordEvent(event);
    }
    /**
     * Record a security alert event
     */
    async logSecurityAlert(alertType, description, severity) {
        const outcomeMap = {
            low: '4',
            medium: '4',
            high: '8',
            critical: '12'
        };
        const agents = [];
        if (this.currentPractitioner) {
            agents.push(this.currentPractitioner);
        }
        const event = this.createAuditEvent({
            eventType: 'security-alert',
            action: 'E',
            outcome: outcomeMap[severity],
            outcomeDescription: description,
            agents,
            additionalInfo: {
                alertType,
                severity,
                url: window.location.href,
                userAgent: navigator.userAgent
            }
        });
        await this.recordEvent(event);
    }
    // ========================================================================
    // Event Recording and Storage
    // ========================================================================
    /**
     * Record an audit event (send to server or store locally)
     */
    async recordEvent(event) {
        this.log('Recording audit event:', event.type.display);
        // Try to send to server if online and configured
        if (this.isOnline && this.config.fhirServerUrl) {
            try {
                await this.sendToServer(event);
                return;
            }
            catch (error) {
                this.log('Failed to send audit event to server, storing locally:', error);
            }
        }
        // Store locally if offline or server send failed
        if (this.config.enableLocalStorage) {
            this.storeLocally(event);
        }
        // Also keep in memory queue
        this.eventQueue.push(event);
    }
    /**
     * Send audit event to FHIR server
     */
    async sendToServer(event) {
        if (!this.config.fhirServerUrl) {
            throw new Error('No FHIR server URL configured');
        }
        const response = await fetch(`${this.config.fhirServerUrl}/AuditEvent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/fhir+json',
                Accept: 'application/fhir+json'
            },
            body: JSON.stringify(event)
        });
        if (!response.ok) {
            throw new Error(`Failed to send audit event: ${response.status} ${response.statusText}`);
        }
        this.log('Audit event sent to server successfully');
    }
    /**
     * Store audit event locally
     * @security Uses encrypted storage to protect audit data containing PHI references
     */
    storeLocally(event) {
        try {
            const stored = this.getPendingEvents();
            stored.push(event);
            // Prune if exceeds max
            while (stored.length > this.config.maxLocalEvents) {
                stored.shift();
            }
            // Use secure storage for PHI-containing audit events
            secureLocalStore(STORAGE_KEYS.PENDING_EVENTS, stored);
            this.log(`Audit event stored locally (${stored.length} pending)`);
        }
        catch (error) {
            console.error('Failed to store audit event locally:', error);
        }
    }
    /**
     * Load pending events from local storage
     */
    loadPendingEvents() {
        const events = this.getPendingEvents();
        this.eventQueue = events;
        this.log(`Loaded ${events.length} pending audit events from local storage`);
    }
    /**
     * Get pending events from local storage
     * @security Decrypts securely stored audit events
     */
    getPendingEvents() {
        try {
            const stored = secureLocalRetrieve(STORAGE_KEYS.PENDING_EVENTS);
            return stored || [];
        }
        catch {
            return [];
        }
    }
    /**
     * Flush pending events to server
     */
    async flushPendingEvents() {
        if (!this.config.fhirServerUrl || !this.isOnline) {
            return;
        }
        const pending = this.getPendingEvents();
        if (pending.length === 0) {
            return;
        }
        this.log(`Flushing ${pending.length} pending audit events`);
        const failed = [];
        for (const event of pending) {
            try {
                await this.sendToServer(event);
            }
            catch {
                failed.push(event);
            }
        }
        // Update secure local storage with only failed events
        secureLocalStore(STORAGE_KEYS.PENDING_EVENTS, failed);
        this.eventQueue = failed;
        this.log(`Flushed ${pending.length - failed.length} events, ${failed.length} failed`);
    }
    /**
     * Get all audit events (from memory queue)
     */
    getAuditEvents() {
        return [...this.eventQueue];
    }
    /**
     * Get pending event count
     */
    getPendingEventCount() {
        return this.getPendingEvents().length;
    }
    /**
     * Clear all local audit events
     */
    clearLocalEvents() {
        localStorage.removeItem(STORAGE_KEYS.PENDING_EVENTS); // Clear both encrypted and legacy
        this.eventQueue = [];
        this.log('Local audit events cleared');
    }
    // ========================================================================
    // Utility Methods
    // ========================================================================
    /**
     * Sanitize data for audit logging (remove sensitive PHI)
     */
    sanitizeForAudit(data) {
        const sensitiveFields = [
            'ssn', 'socialSecurityNumber', 'password', 'pin',
            'creditCard', 'bankAccount', 'identifier'
        ];
        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            const lowerKey = key.toLowerCase();
            if (sensitiveFields.some(field => lowerKey.includes(field))) {
                sanitized[key] = '[REDACTED]';
            }
            else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeForAudit(value);
            }
            else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
    /**
     * Debug logging
     */
    log(...args) {
        if (this.config.enableDebugLogging) {
            console.log('[AuditEvent]', ...args);
        }
    }
    /**
     * Export audit events as JSON for external analysis
     */
    exportEventsAsJson() {
        return JSON.stringify(this.eventQueue, null, 2);
    }
    /**
     * Export audit events as FHIR Bundle
     */
    exportEventsAsBundle() {
        return {
            resourceType: 'Bundle',
            type: 'collection',
            timestamp: new Date().toISOString(),
            entry: this.eventQueue.map(event => ({
                fullUrl: `urn:uuid:${this.generateUUID()}`,
                resource: event
            }))
        };
    }
    /**
     * Generate a UUID v4
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }
}
// ============================================================================
// Singleton Instance
// ============================================================================
/**
 * Default singleton instance
 */
export const auditEventService = new AuditEventService({
    applicationId: 'medcalc-ehr',
    applicationName: 'MedCalc EHR Clinical Calculators',
    applicationVersion: '1.0.0',
    enableLocalStorage: true,
    maxLocalEvents: 1000,
    enableDebugLogging: false
});
// ============================================================================
// Factory Function
// ============================================================================
/**
 * Create a new AuditEventService instance with custom configuration
 */
export function createAuditEventService(config) {
    return new AuditEventService(config);
}
// ============================================================================
// Exports
// ============================================================================
export default {
    AuditEventService,
    auditEventService,
    createAuditEventService
};
