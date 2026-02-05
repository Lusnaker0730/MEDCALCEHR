// src/provenance-service.ts
// FHIR Provenance Service for Data Lineage Tracking
// Reference: https://twcore.mohw.gov.tw/ig/twcore/StructureDefinition-Provenance-twcore.html
// Reference: https://build.fhir.org/provenance.html
// ============================================================================
// Constants
// ============================================================================
/**
 * Code systems used in Provenance
 */
const CODE_SYSTEMS = {
    PROVENANCE_ACTIVITY: 'http://terminology.hl7.org/CodeSystem/v3-DataOperation',
    PROVENANCE_AGENT_TYPE: 'http://terminology.hl7.org/CodeSystem/provenance-participant-type',
    PROVENANCE_AGENT_ROLE: 'http://terminology.hl7.org/CodeSystem/contractsignertypecodes',
    PROVENANCE_ENTITY_ROLE: 'http://hl7.org/fhir/provenance-entity-role',
    SIGNATURE_TYPE: 'urn:iso-astm:E1762-95:2013',
    TW_CORE: 'https://twcore.mohw.gov.tw/ig/twcore/CodeSystem/provenance-activity-type',
    ACT_REASON: 'http://terminology.hl7.org/CodeSystem/v3-ActReason',
    DATA_SOURCE: 'https://medcalc-ehr.example.com/CodeSystem/data-source-type'
};
/**
 * TW Core Provenance Profile URL
 */
const TW_CORE_PROVENANCE_PROFILE = 'https://twcore.mohw.gov.tw/ig/twcore/StructureDefinition/Provenance-twcore';
/**
 * Activity type mappings
 */
const ACTIVITY_CODES = {
    CREATE: {
        system: CODE_SYSTEMS.PROVENANCE_ACTIVITY,
        code: 'CREATE',
        display: 'Create'
    },
    UPDATE: {
        system: CODE_SYSTEMS.PROVENANCE_ACTIVITY,
        code: 'UPDATE',
        display: 'Update/Revise'
    },
    DELETE: {
        system: CODE_SYSTEMS.PROVENANCE_ACTIVITY,
        code: 'DELETE',
        display: 'Delete'
    },
    EXECUTE: {
        system: CODE_SYSTEMS.PROVENANCE_ACTIVITY,
        code: 'EXECUTE',
        display: 'Execute'
    },
    VERIFY: {
        system: CODE_SYSTEMS.PROVENANCE_ACTIVITY,
        code: 'VERIFY',
        display: 'Verify'
    },
    TRANSFORM: {
        system: CODE_SYSTEMS.PROVENANCE_ACTIVITY,
        code: 'TRANSFORM',
        display: 'Transform'
    },
    COMPOSE: {
        system: CODE_SYSTEMS.PROVENANCE_ACTIVITY,
        code: 'COMPOSE',
        display: 'Compose'
    },
    DERIVATION: {
        system: CODE_SYSTEMS.PROVENANCE_ACTIVITY,
        code: 'DERIVE',
        display: 'Derivation'
    }
};
/**
 * Agent type mappings
 */
const AGENT_TYPE_CODES = {
    practitioner: {
        system: CODE_SYSTEMS.PROVENANCE_AGENT_TYPE,
        code: 'author',
        display: 'Author'
    },
    patient: {
        system: CODE_SYSTEMS.PROVENANCE_AGENT_TYPE,
        code: 'informant',
        display: 'Informant'
    },
    organization: {
        system: CODE_SYSTEMS.PROVENANCE_AGENT_TYPE,
        code: 'custodian',
        display: 'Custodian'
    },
    device: {
        system: CODE_SYSTEMS.PROVENANCE_AGENT_TYPE,
        code: 'assembler',
        display: 'Assembler'
    },
    relatedPerson: {
        system: CODE_SYSTEMS.PROVENANCE_AGENT_TYPE,
        code: 'informant',
        display: 'Informant'
    }
};
/**
 * Agent role mappings
 */
const AGENT_ROLE_CODES = {
    author: {
        system: CODE_SYSTEMS.PROVENANCE_AGENT_TYPE,
        code: 'author',
        display: 'Author'
    },
    performer: {
        system: CODE_SYSTEMS.PROVENANCE_AGENT_TYPE,
        code: 'performer',
        display: 'Performer'
    },
    verifier: {
        system: CODE_SYSTEMS.PROVENANCE_AGENT_TYPE,
        code: 'verifier',
        display: 'Verifier'
    },
    attester: {
        system: CODE_SYSTEMS.PROVENANCE_AGENT_TYPE,
        code: 'attester',
        display: 'Attester'
    },
    informant: {
        system: CODE_SYSTEMS.PROVENANCE_AGENT_TYPE,
        code: 'informant',
        display: 'Informant'
    },
    custodian: {
        system: CODE_SYSTEMS.PROVENANCE_AGENT_TYPE,
        code: 'custodian',
        display: 'Custodian'
    },
    assembler: {
        system: CODE_SYSTEMS.PROVENANCE_AGENT_TYPE,
        code: 'assembler',
        display: 'Assembler'
    },
    composer: {
        system: CODE_SYSTEMS.PROVENANCE_AGENT_TYPE,
        code: 'composer',
        display: 'Composer'
    }
};
/**
 * Entity role mappings
 */
const ENTITY_ROLE_CODES = {
    derivation: 'derivation',
    revision: 'revision',
    quotation: 'quotation',
    source: 'source',
    removal: 'removal'
};
/**
 * Signature type mappings
 */
const SIGNATURE_TYPE_CODES = {
    authorship: {
        system: CODE_SYSTEMS.SIGNATURE_TYPE,
        code: '1.2.840.10065.1.12.1.1',
        display: 'Author\'s Signature'
    },
    witness: {
        system: CODE_SYSTEMS.SIGNATURE_TYPE,
        code: '1.2.840.10065.1.12.1.5',
        display: 'Witness Signature'
    },
    verification: {
        system: CODE_SYSTEMS.SIGNATURE_TYPE,
        code: '1.2.840.10065.1.12.1.5',
        display: 'Verification Signature'
    },
    validation: {
        system: CODE_SYSTEMS.SIGNATURE_TYPE,
        code: '1.2.840.10065.1.12.1.6',
        display: 'Validation Signature'
    },
    consent: {
        system: CODE_SYSTEMS.SIGNATURE_TYPE,
        code: '1.2.840.10065.1.12.1.7',
        display: 'Consent Signature'
    }
};
/**
 * Data source type display names
 */
const DATA_SOURCE_DISPLAY = {
    'internal': '本院產生',
    'patient-upload': '病患上傳',
    'cross-hospital': '跨院交換',
    'external-system': '外部系統',
    'manual-entry': '人工輸入',
    'device': '設備產生',
    'calculated': '計算衍生'
};
// ============================================================================
// Local Storage Keys
// ============================================================================
const STORAGE_KEYS = {
    PENDING_RECORDS: 'medcalc_provenance_pending',
    RECORD_SEQUENCE: 'medcalc_provenance_sequence'
};
// ============================================================================
// ProvenanceService Class
// ============================================================================
/**
 * FHIR Provenance Service
 * Provides comprehensive data lineage tracking following TW Core IG
 */
export class ProvenanceService {
    constructor(config = {}) {
        this.currentPractitioner = null;
        this.currentPatient = null;
        this.recordQueue = [];
        this.isOnline = navigator.onLine;
        this.config = {
            enableLocalStorage: true,
            maxLocalRecords: 500,
            applicationId: 'medcalc-ehr',
            applicationName: 'MedCalc EHR',
            applicationVersion: '1.0.0',
            enableDebugLogging: false,
            ...config
        };
        // Monitor online/offline status
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.flushPendingRecords();
        });
        window.addEventListener('offline', () => {
            this.isOnline = false;
        });
        // Load pending records from local storage
        this.loadPendingRecords();
    }
    // ========================================================================
    // Context Management
    // ========================================================================
    /**
     * Set the current practitioner context
     */
    setPractitioner(id, name, organizationRef) {
        this.currentPractitioner = {
            type: 'practitioner',
            id,
            name,
            role: 'author',
            onBehalfOf: organizationRef ? {
                reference: organizationRef,
                display: this.config.organizationName
            } : undefined
        };
        this.log('Practitioner context set:', this.currentPractitioner);
    }
    /**
     * Set the current patient context
     */
    setPatientContext(patientId, patientName) {
        this.currentPatient = {
            id: patientId,
            name: patientName
        };
        this.log('Patient context set:', this.currentPatient);
    }
    /**
     * Clear the current context
     */
    clearContext() {
        this.currentPractitioner = null;
        this.currentPatient = null;
        this.log('Context cleared');
    }
    // ========================================================================
    // Provenance Creation
    // ========================================================================
    /**
     * Create a FHIR Provenance resource
     */
    createProvenance(params) {
        const now = new Date();
        const occurredAt = params.occurredAt || now;
        const activityCode = ACTIVITY_CODES[params.activity];
        const provenance = {
            resourceType: 'Provenance',
            id: this.generateId(),
            meta: {
                profile: [TW_CORE_PROVENANCE_PROFILE],
                lastUpdated: now.toISOString(),
                versionId: '1'
            },
            target: params.targets,
            occurredDateTime: occurredAt.toISOString(),
            recorded: now.toISOString(),
            activity: {
                coding: [activityCode],
                text: activityCode.display
            },
            agent: []
        };
        // Add location if configured
        if (this.config.locationRef) {
            provenance.location = {
                reference: this.config.locationRef,
                display: this.config.locationName
            };
        }
        // Add reason if provided
        if (params.reason) {
            provenance.reason = [
                {
                    coding: [
                        {
                            system: CODE_SYSTEMS.ACT_REASON,
                            code: 'TREAT',
                            display: 'Treatment'
                        }
                    ],
                    text: params.reason
                }
            ];
        }
        // Add policies if provided
        if (params.policies && params.policies.length > 0) {
            provenance.policy = params.policies;
        }
        // Add agents
        for (const agent of params.agents) {
            const agentTypeCode = AGENT_TYPE_CODES[agent.type];
            const agentRoleCode = AGENT_ROLE_CODES[agent.role];
            const fhirAgent = {
                type: {
                    coding: [agentTypeCode]
                },
                role: [
                    {
                        coding: [agentRoleCode]
                    }
                ],
                who: {
                    reference: this.getAgentReference(agent),
                    display: agent.name
                }
            };
            if (agent.onBehalfOf) {
                fhirAgent.onBehalfOf = agent.onBehalfOf;
            }
            provenance.agent.push(fhirAgent);
        }
        // Always add the application as an agent (assembler)
        provenance.agent.push({
            type: {
                coding: [AGENT_TYPE_CODES.device]
            },
            role: [
                {
                    coding: [AGENT_ROLE_CODES.assembler]
                }
            ],
            who: {
                identifier: {
                    system: 'urn:ietf:rfc:3986',
                    value: `urn:oid:${this.config.applicationId}`
                },
                display: `${this.config.applicationName} v${this.config.applicationVersion}`
            }
        });
        // Add entities (sources)
        if (params.entities && params.entities.length > 0) {
            provenance.entity = [];
            for (const entity of params.entities) {
                const fhirEntity = {
                    role: ENTITY_ROLE_CODES[entity.role],
                    what: {
                        reference: entity.what,
                        display: entity.display
                    }
                };
                if (entity.agent) {
                    fhirEntity.agent = [
                        {
                            type: {
                                coding: [AGENT_TYPE_CODES[entity.agent.type]]
                            },
                            who: {
                                reference: this.getAgentReference(entity.agent),
                                display: entity.agent.name
                            }
                        }
                    ];
                }
                provenance.entity.push(fhirEntity);
            }
        }
        // Add data source as an entity if specified
        if (params.dataSource) {
            if (!provenance.entity) {
                provenance.entity = [];
            }
            provenance.entity.push({
                role: 'source',
                what: {
                    identifier: {
                        system: CODE_SYSTEMS.DATA_SOURCE,
                        value: params.dataSource
                    },
                    display: DATA_SOURCE_DISPLAY[params.dataSource]
                }
            });
        }
        // Add signature if provided
        if (params.signature) {
            const sigTypeCode = SIGNATURE_TYPE_CODES[params.signature.type];
            provenance.signature = [
                {
                    type: [sigTypeCode],
                    when: params.signature.when.toISOString(),
                    who: params.signature.who,
                    targetFormat: params.signature.targetFormat || 'application/fhir+json',
                    sigFormat: params.signature.sigFormat || 'application/signature+xml',
                    data: params.signature.data
                }
            ];
        }
        return provenance;
    }
    /**
     * Get reference string for an agent
     */
    getAgentReference(agent) {
        switch (agent.type) {
            case 'practitioner':
                return `Practitioner/${agent.id}`;
            case 'patient':
                return `Patient/${agent.id}`;
            case 'organization':
                return `Organization/${agent.id}`;
            case 'device':
                return `Device/${agent.id}`;
            case 'relatedPerson':
                return `RelatedPerson/${agent.id}`;
            default:
                return agent.id;
        }
    }
    // ========================================================================
    // Convenience Methods
    // ========================================================================
    /**
     * Record provenance for a medical calculation
     */
    async recordCalculation(result) {
        const agents = [];
        // Add practitioner if available
        if (result.practitionerId || this.currentPractitioner) {
            const practitioner = this.currentPractitioner || {
                type: 'practitioner',
                id: result.practitionerId,
                role: 'author'
            };
            agents.push(practitioner);
        }
        // Create a virtual target for the calculation result
        const targetRef = `#calculation-${result.calculatorId}-${result.timestamp.getTime()}`;
        const provenance = this.createProvenance({
            targets: [
                {
                    reference: targetRef,
                    display: `${result.calculatorName} Calculation Result`
                }
            ],
            activity: 'EXECUTE',
            occurredAt: result.timestamp,
            agents,
            dataSource: 'calculated',
            reason: `Medical calculation: ${result.calculatorName}`,
            metadata: {
                calculatorId: result.calculatorId,
                calculatorName: result.calculatorName,
                inputs: JSON.stringify(this.sanitizeData(result.inputs)),
                outputs: JSON.stringify(this.sanitizeData(result.outputs))
            }
        });
        // Add patient as entity if available
        if (result.patientId || this.currentPatient) {
            const patientId = result.patientId || this.currentPatient?.id;
            if (patientId) {
                if (!provenance.entity) {
                    provenance.entity = [];
                }
                provenance.entity.push({
                    role: 'source',
                    what: {
                        reference: `Patient/${patientId}`,
                        display: this.currentPatient?.name || 'Patient'
                    }
                });
            }
        }
        await this.recordProvenance(provenance);
        return provenance;
    }
    /**
     * Record provenance for data creation
     */
    async recordDataCreation(targetRef, targetDisplay, dataSource = 'internal', reason) {
        const agents = [];
        if (this.currentPractitioner) {
            agents.push(this.currentPractitioner);
        }
        const provenance = this.createProvenance({
            targets: [{ reference: targetRef, display: targetDisplay }],
            activity: 'CREATE',
            agents,
            dataSource,
            reason
        });
        await this.recordProvenance(provenance);
        return provenance;
    }
    /**
     * Record provenance for data update
     */
    async recordDataUpdate(targetRef, targetDisplay, previousVersionRef, reason) {
        const agents = [];
        if (this.currentPractitioner) {
            agents.push(this.currentPractitioner);
        }
        const entities = [];
        if (previousVersionRef) {
            entities.push({
                role: 'revision',
                what: previousVersionRef,
                display: 'Previous version'
            });
        }
        const provenance = this.createProvenance({
            targets: [{ reference: targetRef, display: targetDisplay }],
            activity: 'UPDATE',
            agents,
            entities: entities.length > 0 ? entities : undefined,
            reason
        });
        await this.recordProvenance(provenance);
        return provenance;
    }
    /**
     * Record provenance for data derivation (e.g., from FHIR data)
     */
    async recordDerivation(targetRef, targetDisplay, sources, reason) {
        const agents = [];
        if (this.currentPractitioner) {
            agents.push(this.currentPractitioner);
        }
        const entities = sources.map(source => ({
            role: 'source',
            what: source.reference,
            display: source.display
        }));
        const provenance = this.createProvenance({
            targets: [{ reference: targetRef, display: targetDisplay }],
            activity: 'DERIVATION',
            agents,
            entities,
            dataSource: 'calculated',
            reason
        });
        await this.recordProvenance(provenance);
        return provenance;
    }
    /**
     * Record provenance for cross-hospital data exchange
     */
    async recordCrossHospitalExchange(targetRef, targetDisplay, sourceOrganization, reason) {
        const agents = [];
        if (this.currentPractitioner) {
            agents.push(this.currentPractitioner);
        }
        // Add source organization as agent
        agents.push({
            type: 'organization',
            id: sourceOrganization.id,
            name: sourceOrganization.name,
            role: 'informant'
        });
        const provenance = this.createProvenance({
            targets: [{ reference: targetRef, display: targetDisplay }],
            activity: 'CREATE',
            agents,
            dataSource: 'cross-hospital',
            reason: reason || `Cross-hospital data exchange from ${sourceOrganization.name}`
        });
        await this.recordProvenance(provenance);
        return provenance;
    }
    /**
     * Record provenance for patient-uploaded data
     */
    async recordPatientUpload(targetRef, targetDisplay, patientId, patientName, reason) {
        const agents = [
            {
                type: 'patient',
                id: patientId,
                name: patientName,
                role: 'author'
            }
        ];
        // Add practitioner as verifier if available
        if (this.currentPractitioner) {
            agents.push({
                ...this.currentPractitioner,
                role: 'verifier'
            });
        }
        const provenance = this.createProvenance({
            targets: [{ reference: targetRef, display: targetDisplay }],
            activity: 'CREATE',
            agents,
            dataSource: 'patient-upload',
            reason: reason || 'Patient uploaded data'
        });
        await this.recordProvenance(provenance);
        return provenance;
    }
    /**
     * Record provenance with digital signature
     */
    async recordWithSignature(targetRef, targetDisplay, activity, signatureData, signatureType = 'authorship') {
        const agents = [];
        if (this.currentPractitioner) {
            agents.push(this.currentPractitioner);
        }
        const signature = {
            type: signatureType,
            when: new Date(),
            who: {
                reference: this.currentPractitioner
                    ? `Practitioner/${this.currentPractitioner.id}`
                    : undefined,
                display: this.currentPractitioner?.name
            },
            data: signatureData
        };
        const provenance = this.createProvenance({
            targets: [{ reference: targetRef, display: targetDisplay }],
            activity,
            agents,
            signature,
            dataSource: 'internal'
        });
        await this.recordProvenance(provenance);
        return provenance;
    }
    // ========================================================================
    // Record Storage and Management
    // ========================================================================
    /**
     * Record a provenance (send to server or store locally)
     */
    async recordProvenance(provenance) {
        this.log('Recording provenance:', provenance.activity?.text);
        // Try to send to server if online and configured
        if (this.isOnline && this.config.fhirServerUrl) {
            try {
                await this.sendToServer(provenance);
                return;
            }
            catch (error) {
                this.log('Failed to send provenance to server, storing locally:', error);
            }
        }
        // Store locally if offline or server send failed
        if (this.config.enableLocalStorage) {
            this.storeLocally(provenance);
        }
        // Also keep in memory queue
        this.recordQueue.push(provenance);
    }
    /**
     * Send provenance to FHIR server
     */
    async sendToServer(provenance) {
        if (!this.config.fhirServerUrl) {
            throw new Error('No FHIR server URL configured');
        }
        const response = await fetch(`${this.config.fhirServerUrl}/Provenance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/fhir+json',
                Accept: 'application/fhir+json'
            },
            body: JSON.stringify(provenance)
        });
        if (!response.ok) {
            throw new Error(`Failed to send provenance: ${response.status} ${response.statusText}`);
        }
        this.log('Provenance sent to server successfully');
    }
    /**
     * Store provenance locally
     */
    storeLocally(provenance) {
        try {
            const stored = this.getPendingRecords();
            stored.push(provenance);
            // Prune if exceeds max
            while (stored.length > this.config.maxLocalRecords) {
                stored.shift();
            }
            localStorage.setItem(STORAGE_KEYS.PENDING_RECORDS, JSON.stringify(stored));
            this.log(`Provenance stored locally (${stored.length} pending)`);
        }
        catch (error) {
            console.error('Failed to store provenance locally:', error);
        }
    }
    /**
     * Load pending records from local storage
     */
    loadPendingRecords() {
        const records = this.getPendingRecords();
        this.recordQueue = records;
        this.log(`Loaded ${records.length} pending provenance records from local storage`);
    }
    /**
     * Get pending records from local storage
     */
    getPendingRecords() {
        try {
            const stored = localStorage.getItem(STORAGE_KEYS.PENDING_RECORDS);
            return stored ? JSON.parse(stored) : [];
        }
        catch {
            return [];
        }
    }
    /**
     * Flush pending records to server
     */
    async flushPendingRecords() {
        if (!this.config.fhirServerUrl || !this.isOnline) {
            return;
        }
        const pending = this.getPendingRecords();
        if (pending.length === 0) {
            return;
        }
        this.log(`Flushing ${pending.length} pending provenance records`);
        const failed = [];
        for (const record of pending) {
            try {
                await this.sendToServer(record);
            }
            catch {
                failed.push(record);
            }
        }
        // Update local storage with only failed records
        localStorage.setItem(STORAGE_KEYS.PENDING_RECORDS, JSON.stringify(failed));
        this.recordQueue = failed;
        this.log(`Flushed ${pending.length - failed.length} records, ${failed.length} failed`);
    }
    /**
     * Get all provenance records (from memory queue)
     */
    getProvenanceRecords() {
        return [...this.recordQueue];
    }
    /**
     * Get pending record count
     */
    getPendingRecordCount() {
        return this.getPendingRecords().length;
    }
    /**
     * Clear all local provenance records
     */
    clearLocalRecords() {
        localStorage.removeItem(STORAGE_KEYS.PENDING_RECORDS);
        this.recordQueue = [];
        this.log('Local provenance records cleared');
    }
    /**
     * Get provenance records for a specific target
     */
    getProvenanceForTarget(targetRef) {
        return this.recordQueue.filter(p => p.target.some(t => t.reference === targetRef));
    }
    // ========================================================================
    // Utility Methods
    // ========================================================================
    /**
     * Generate a unique ID
     */
    generateId() {
        return `prov-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    /**
     * Sanitize data for storage (remove sensitive PHI)
     */
    sanitizeData(data) {
        const sensitiveFields = [
            'ssn', 'socialSecurityNumber', 'password', 'pin',
            'creditCard', 'bankAccount'
        ];
        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            const lowerKey = key.toLowerCase();
            if (sensitiveFields.some(field => lowerKey.includes(field))) {
                sanitized[key] = '[REDACTED]';
            }
            else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                sanitized[key] = this.sanitizeData(value);
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
            console.log('[Provenance]', ...args);
        }
    }
    /**
     * Export provenance records as JSON
     */
    exportRecordsAsJson() {
        return JSON.stringify(this.recordQueue, null, 2);
    }
    /**
     * Export provenance records as FHIR Bundle
     */
    exportRecordsAsBundle() {
        return {
            resourceType: 'Bundle',
            type: 'collection',
            timestamp: new Date().toISOString(),
            entry: this.recordQueue.map(record => ({
                fullUrl: `urn:uuid:${this.generateUUID()}`,
                resource: record
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
    /**
     * Create a data lineage report for a resource
     */
    generateLineageReport(targetRef) {
        const records = this.getProvenanceForTarget(targetRef);
        const sources = new Set();
        const agents = new Set();
        const activities = new Set();
        const timeline = [];
        for (const record of records) {
            // Collect sources
            if (record.entity) {
                for (const entity of record.entity) {
                    if (entity.what.reference) {
                        sources.add(entity.what.reference);
                    }
                }
            }
            // Collect agents
            for (const agent of record.agent) {
                if (agent.who.display) {
                    agents.add(agent.who.display);
                }
                else if (agent.who.reference) {
                    agents.add(agent.who.reference);
                }
            }
            // Collect activities
            if (record.activity?.text) {
                activities.add(record.activity.text);
            }
            // Build timeline
            timeline.push({
                date: record.recorded,
                activity: record.activity?.text || 'Unknown',
                agent: record.agent[0]?.who.display || record.agent[0]?.who.reference || 'Unknown'
            });
        }
        // Sort timeline by date
        timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        return {
            target: targetRef,
            records,
            sources: Array.from(sources),
            agents: Array.from(agents),
            activities: Array.from(activities),
            timeline
        };
    }
}
// ============================================================================
// Singleton Instance
// ============================================================================
/**
 * Default singleton instance
 */
export const provenanceService = new ProvenanceService({
    applicationId: 'medcalc-ehr',
    applicationName: 'MedCalc EHR Clinical Calculators',
    applicationVersion: '1.0.0',
    enableLocalStorage: true,
    maxLocalRecords: 500,
    enableDebugLogging: false
});
// ============================================================================
// Factory Function
// ============================================================================
/**
 * Create a new ProvenanceService instance with custom configuration
 */
export function createProvenanceService(config) {
    return new ProvenanceService(config);
}
// ============================================================================
// Exports
// ============================================================================
export default {
    ProvenanceService,
    provenanceService,
    createProvenanceService
};
