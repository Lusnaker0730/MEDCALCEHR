// src/audit-event-service.ts
// FHIR AuditEvent Service following IHE BALP (Basic Audit Log Patterns)
// Reference: https://profiles.ihe.net/ITI/BALP/index.html

import { secureLocalStore, secureLocalRetrieve } from './security.js';
import { logger } from './logger.js';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * AuditEvent action codes (from FHIR spec)
 */
export type AuditEventAction = 'C' | 'R' | 'U' | 'D' | 'E';
// C = Create, R = Read, U = Update, D = Delete, E = Execute

/**
 * AuditEvent outcome codes
 */
export type AuditEventOutcome = '0' | '4' | '8' | '12';
// 0 = Success, 4 = Minor failure, 8 = Serious failure, 12 = Major failure

/**
 * Agent types for audit events
 */
export interface AuditAgent {
    type: 'practitioner' | 'patient' | 'application' | 'device';
    id: string;
    name?: string;
    role?: string;
    requestor: boolean;
}

/**
 * Source information for audit events
 */
export interface AuditSource {
    site?: string;
    observer: string;
    type?: string[];
}

/**
 * Entity (the data being accessed) for audit events
 */
export interface AuditEntity {
    type: 'patient' | 'resource' | 'query';
    what: string; // Reference to the resource (e.g., "Patient/123")
    name?: string;
    description?: string;
    securityLabel?: string[];
    query?: string; // For query-type entities
}

/**
 * Audit event types following IHE BALP patterns
 */
export type AuditEventType =
    | 'rest' // RESTful operation
    | 'login' // User authentication
    | 'logout' // User logout
    | 'patient-record-access' // Accessing patient record
    | 'data-export' // Data export/download
    | 'calculation' // Medical calculation performed
    | 'consent-decision' // Consent-related action
    | 'security-alert'; // Security-related event

/**
 * Configuration for the audit service
 */
export interface AuditServiceConfig {
    /** FHIR server endpoint for sending audit events */
    fhirServerUrl?: string;
    /** Whether to store audit events locally when offline */
    enableLocalStorage: boolean;
    /** Maximum local audit events to store before pruning */
    maxLocalEvents: number;
    /** Application identifier */
    applicationId: string;
    /** Application name */
    applicationName: string;
    /** Application version */
    applicationVersion?: string;
    /** Site identifier */
    siteId?: string;
    /** Enable console logging for debugging */
    enableDebugLogging: boolean;
}

/**
 * FHIR AuditEvent resource structure (simplified)
 */
export interface FHIRAuditEvent {
    resourceType: 'AuditEvent';
    id?: string;
    meta?: {
        profile?: string[];
        lastUpdated?: string;
    };
    type: {
        system: string;
        code: string;
        display?: string;
    };
    subtype?: Array<{
        system: string;
        code: string;
        display?: string;
    }>;
    action: AuditEventAction;
    period?: {
        start: string;
        end?: string;
    };
    recorded: string;
    outcome: AuditEventOutcome;
    outcomeDesc?: string;
    purposeOfEvent?: Array<{
        coding: Array<{
            system: string;
            code: string;
            display?: string;
        }>;
    }>;
    agent: Array<{
        type?: {
            coding: Array<{
                system: string;
                code: string;
                display?: string;
            }>;
        };
        role?: Array<{
            coding: Array<{
                system: string;
                code: string;
                display?: string;
            }>;
        }>;
        who?: {
            reference?: string;
            identifier?: {
                system?: string;
                value: string;
            };
            display?: string;
        };
        altId?: string;
        name?: string;
        requestor: boolean;
        location?: {
            reference: string;
        };
        policy?: string[];
        network?: {
            address?: string;
            type?: string;
        };
    }>;
    source: {
        site?: string;
        observer: {
            reference?: string;
            identifier?: {
                system?: string;
                value: string;
            };
            display?: string;
        };
        type?: Array<{
            system: string;
            code: string;
            display?: string;
        }>;
    };
    entity?: AuditEventEntity[];
}

/**
 * Entity structure for FHIR AuditEvent
 */
export interface AuditEventEntity {
    what?: {
        reference?: string;
        identifier?: {
            system?: string;
            value: string;
        };
        display?: string;
    };
    type?: {
        system: string;
        code: string;
        display?: string;
    };
    role?: {
        system: string;
        code: string;
        display?: string;
    };
    lifecycle?: {
        system: string;
        code: string;
        display?: string;
    };
    securityLabel?: Array<{
        system: string;
        code: string;
        display?: string;
    }>;
    name?: string;
    description?: string;
    query?: string; // Base64 encoded
    detail?: Array<{
        type: string;
        valueString?: string;
        valueBase64Binary?: string;
    }>;
}

/**
 * Parameters for creating an audit event
 */
export interface CreateAuditEventParams {
    eventType: AuditEventType;
    action: AuditEventAction;
    outcome: AuditEventOutcome;
    outcomeDescription?: string;
    agents: AuditAgent[];
    entities?: AuditEntity[];
    purposeOfUse?: string;
    subtype?: string;
    startTime?: Date;
    endTime?: Date;
    additionalInfo?: Record<string, string>;
}

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
const EVENT_TYPE_CODES: Record<AuditEventType, { system: string; code: string; display: string }> = {
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
const AGENT_TYPE_CODES: Record<AuditAgent['type'], { system: string; code: string; display: string }> = {
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
const ENTITY_TYPE_CODES: Record<AuditEntity['type'], { system: string; code: string; display: string }> = {
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
const ENTITY_ROLE_CODES: Record<AuditEntity['type'], { system: string; code: string; display: string }> = {
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
    private config: AuditServiceConfig;
    private currentPractitioner: AuditAgent | null = null;
    private currentPatient: AuditEntity | null = null;
    private sessionId: string;
    private eventQueue: FHIRAuditEvent[] = [];
    private isOnline: boolean = navigator.onLine;

    constructor(config: Partial<AuditServiceConfig> = {}) {
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
    private generateSessionId(): string {
        return `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }

    /**
     * Set the current practitioner context
     */
    setPractitioner(id: string, name?: string, role?: string): void {
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
    setPatientContext(patientId: string, patientName?: string): void {
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
    clearContext(): void {
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
    createAuditEvent(params: CreateAuditEventParams): FHIRAuditEvent {
        const now = new Date();
        const eventTypeCode = EVENT_TYPE_CODES[params.eventType];

        const auditEvent: FHIRAuditEvent = {
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

                const entityEntry: AuditEventEntity = {
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

            const detailEntity: AuditEventEntity = {
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
    async logLogin(
        practitionerId: string,
        practitionerName?: string,
        success: boolean = true
    ): Promise<void> {
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
    async logLogout(): Promise<void> {
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
    async logPatientAccess(
        patientId: string,
        patientName?: string,
        resourceType?: string,
        resourceId?: string
    ): Promise<void> {
        this.setPatientContext(patientId, patientName);

        const entities: AuditEntity[] = [
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

        const agents: AuditAgent[] = [];
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
    async logResourceRead(
        resourceType: string,
        resourceId: string,
        query?: string
    ): Promise<void> {
        const entities: AuditEntity[] = [
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

        const agents: AuditAgent[] = [];
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
    async logCalculation(
        calculatorId: string,
        calculatorName: string,
        inputs: Record<string, any>,
        result: Record<string, any>,
        success: boolean = true
    ): Promise<void> {
        const entities: AuditEntity[] = [];

        // Add patient context if available
        if (this.currentPatient) {
            entities.push(this.currentPatient);
        }

        const agents: AuditAgent[] = [];
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
    async logDataExport(
        exportType: string,
        resourceTypes: string[],
        recordCount: number
    ): Promise<void> {
        const entities: AuditEntity[] = [];

        // Add patient context if available
        if (this.currentPatient) {
            entities.push(this.currentPatient);
        }

        const agents: AuditAgent[] = [];
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
    async logSecurityAlert(
        alertType: string,
        description: string,
        severity: 'low' | 'medium' | 'high' | 'critical'
    ): Promise<void> {
        const outcomeMap: Record<string, AuditEventOutcome> = {
            low: '4',
            medium: '4',
            high: '8',
            critical: '12'
        };

        const agents: AuditAgent[] = [];
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
    async recordEvent(event: FHIRAuditEvent): Promise<void> {
        this.log('Recording audit event:', event.type.display);

        // Try to send to server if online and configured
        if (this.isOnline && this.config.fhirServerUrl) {
            try {
                await this.sendToServer(event);
                return;
            } catch (error) {
                this.log('Failed to send audit event to server, storing locally:', error);
            }
        }

        // Store locally if offline or server send failed
        if (this.config.enableLocalStorage) {
            await this.storeLocally(event);
        }

        // Also keep in memory queue
        this.eventQueue.push(event);
    }

    /**
     * Send audit event to FHIR server
     */
    private async sendToServer(event: FHIRAuditEvent): Promise<void> {
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
     * @security Uses AES-GCM encrypted storage to protect audit data containing PHI references
     */
    private async storeLocally(event: FHIRAuditEvent): Promise<void> {
        try {
            const stored = await this.getPendingEvents();
            stored.push(event);

            // Prune if exceeds max
            while (stored.length > this.config.maxLocalEvents) {
                stored.shift();
            }

            // Use secure storage for PHI-containing audit events
            await secureLocalStore(STORAGE_KEYS.PENDING_EVENTS, stored);
            this.log(`Audit event stored locally (${stored.length} pending)`);
        } catch (error) {
            logger.error('Failed to store audit event locally', { error: String(error) });
        }
    }

    /**
     * Load pending events from local storage
     */
    private async loadPendingEvents(): Promise<void> {
        const events = await this.getPendingEvents();
        this.eventQueue = events;
        this.log(`Loaded ${events.length} pending audit events from local storage`);
    }

    /**
     * Get pending events from local storage
     * @security Decrypts AES-GCM encrypted audit events
     */
    private async getPendingEvents(): Promise<FHIRAuditEvent[]> {
        try {
            const stored = await secureLocalRetrieve<FHIRAuditEvent[]>(STORAGE_KEYS.PENDING_EVENTS);
            return stored || [];
        } catch {
            return [];
        }
    }

    /**
     * Flush pending events to server
     */
    async flushPendingEvents(): Promise<void> {
        if (!this.config.fhirServerUrl || !this.isOnline) {
            return;
        }

        const pending = await this.getPendingEvents();
        if (pending.length === 0) {
            return;
        }

        this.log(`Flushing ${pending.length} pending audit events`);

        const failed: FHIRAuditEvent[] = [];

        for (const event of pending) {
            try {
                await this.sendToServer(event);
            } catch {
                failed.push(event);
            }
        }

        // Update secure local storage with only failed events
        await secureLocalStore(STORAGE_KEYS.PENDING_EVENTS, failed);
        this.eventQueue = failed;

        this.log(`Flushed ${pending.length - failed.length} events, ${failed.length} failed`);
    }

    /**
     * Get all audit events (from memory queue)
     */
    getAuditEvents(): FHIRAuditEvent[] {
        return [...this.eventQueue];
    }

    /**
     * Get pending event count
     */
    async getPendingEventCount(): Promise<number> {
        const events = await this.getPendingEvents();
        return events.length;
    }

    /**
     * Clear all local audit events
     */
    clearLocalEvents(): void {
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
    private sanitizeForAudit(data: Record<string, any>): Record<string, any> {
        const sensitiveFields = [
            'ssn', 'socialSecurityNumber', 'password', 'pin',
            'creditCard', 'bankAccount', 'identifier'
        ];

        const sanitized: Record<string, any> = {};

        for (const [key, value] of Object.entries(data)) {
            const lowerKey = key.toLowerCase();
            if (sensitiveFields.some(field => lowerKey.includes(field))) {
                sanitized[key] = '[REDACTED]';
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = this.sanitizeForAudit(value);
            } else {
                sanitized[key] = value;
            }
        }

        return sanitized;
    }

    /**
     * Debug logging
     */
    private log(...args: any[]): void {
        if (this.config.enableDebugLogging) {
            logger.debug('[AuditEvent]', { detail: args.map(String).join(' ') });
        }
    }

    /**
     * Export audit events as JSON for external analysis
     */
    exportEventsAsJson(): string {
        return JSON.stringify(this.eventQueue, null, 2);
    }

    /**
     * Export audit events as FHIR Bundle
     */
    exportEventsAsBundle(): object {
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
    private generateUUID(): string {
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
export function createAuditEventService(config: Partial<AuditServiceConfig>): AuditEventService {
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
