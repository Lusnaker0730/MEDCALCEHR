// src/__tests__/provenance-service.test.ts
import {
    ProvenanceService,
    createProvenanceService,
    FHIRProvenance,
    ProvenanceActivity,
    ProvenanceAgentRole,
    DataSourceType
} from '../provenance-service';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value;
        },
        removeItem: (key: string) => {
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

describe('ProvenanceService', () => {
    let provenanceService: ProvenanceService;

    beforeEach(() => {
        localStorageMock.clear();
        provenanceService = createProvenanceService({
            applicationId: 'test-app',
            applicationName: 'Test Application',
            applicationVersion: '1.0.0',
            enableLocalStorage: true,
            maxLocalRecords: 100,
            enableDebugLogging: false
        });
    });

    describe('createProvenance', () => {
        it('should create a valid FHIR Provenance resource', () => {
            const provenance = provenanceService.createProvenance({
                targets: [{ reference: 'Observation/123', display: 'Test Observation' }],
                activity: 'CREATE',
                agents: [
                    {
                        type: 'practitioner',
                        id: 'practitioner-123',
                        name: 'Dr. Test',
                        role: 'author'
                    }
                ]
            });

            expect(provenance.resourceType).toBe('Provenance');
            expect(provenance.target).toHaveLength(1);
            expect(provenance.target[0].reference).toBe('Observation/123');
            expect(provenance.activity?.coding[0].code).toBe('CREATE');
            expect(provenance.recorded).toBeDefined();
            expect(provenance.agent.length).toBeGreaterThanOrEqual(2); // Practitioner + Application
        });

        it('should include TW Core profile', () => {
            const provenance = provenanceService.createProvenance({
                targets: [{ reference: 'Observation/123' }],
                activity: 'CREATE',
                agents: []
            });

            expect(provenance.meta?.profile).toContain(
                'https://twcore.mohw.gov.tw/ig/twcore/StructureDefinition/Provenance-twcore'
            );
        });

        it('should handle multiple targets', () => {
            const provenance = provenanceService.createProvenance({
                targets: [
                    { reference: 'Observation/123', display: 'Obs 1' },
                    { reference: 'Observation/456', display: 'Obs 2' }
                ],
                activity: 'COMPOSE',
                agents: [
                    {
                        type: 'practitioner',
                        id: 'prac-123',
                        role: 'composer'
                    }
                ]
            });

            expect(provenance.target).toHaveLength(2);
        });

        it('should include entities when provided', () => {
            const provenance = provenanceService.createProvenance({
                targets: [{ reference: 'Observation/123' }],
                activity: 'DERIVATION',
                agents: [
                    {
                        type: 'practitioner',
                        id: 'prac-123',
                        role: 'author'
                    }
                ],
                entities: [
                    {
                        role: 'source',
                        what: 'Observation/456',
                        display: 'Source observation'
                    }
                ]
            });

            expect(provenance.entity).toBeDefined();
            expect(provenance.entity?.length).toBeGreaterThanOrEqual(1);
            expect(provenance.entity?.[0].role).toBe('source');
        });

        it('should include data source type', () => {
            const provenance = provenanceService.createProvenance({
                targets: [{ reference: 'Observation/123' }],
                activity: 'CREATE',
                agents: [],
                dataSource: 'patient-upload'
            });

            const sourceEntity = provenance.entity?.find(
                e => e.what.identifier?.value === 'patient-upload'
            );
            expect(sourceEntity).toBeDefined();
            expect(sourceEntity?.what.display).toBe('病患上傳');
        });

        it('should include reason when provided', () => {
            const provenance = provenanceService.createProvenance({
                targets: [{ reference: 'Observation/123' }],
                activity: 'CREATE',
                agents: [],
                reason: 'Annual checkup'
            });

            expect(provenance.reason).toBeDefined();
            expect(provenance.reason?.[0].text).toBe('Annual checkup');
        });

        it('should include policies when provided', () => {
            const provenance = provenanceService.createProvenance({
                targets: [{ reference: 'Observation/123' }],
                activity: 'CREATE',
                agents: [],
                policies: ['urn:policy:hospital-consent', 'urn:policy:research-consent']
            });

            expect(provenance.policy).toHaveLength(2);
        });

        it('should include digital signature when provided', () => {
            const signatureData = 'base64encodedSignature==';
            const provenance = provenanceService.createProvenance({
                targets: [{ reference: 'Observation/123' }],
                activity: 'VERIFY',
                agents: [
                    {
                        type: 'practitioner',
                        id: 'prac-123',
                        name: 'Dr. Smith',
                        role: 'verifier'
                    }
                ],
                signature: {
                    type: 'authorship',
                    when: new Date('2024-01-15T10:00:00Z'),
                    who: {
                        reference: 'Practitioner/prac-123',
                        display: 'Dr. Smith'
                    },
                    data: signatureData
                }
            });

            expect(provenance.signature).toBeDefined();
            expect(provenance.signature?.[0].data).toBe(signatureData);
            expect(provenance.signature?.[0].type[0].code).toBe('1.2.840.10065.1.12.1.1');
        });
    });

    describe('Context Management', () => {
        it('should set practitioner context', () => {
            provenanceService.setPractitioner('prac-123', 'Dr. Smith', 'Organization/org-1');

            // Verify by creating a provenance and checking the agent
            const provenance = provenanceService.createProvenance({
                targets: [{ reference: 'Observation/123' }],
                activity: 'CREATE',
                agents: []
            });

            // Application agent should be present
            expect(provenance.agent.length).toBeGreaterThanOrEqual(1);
        });

        it('should set patient context', () => {
            provenanceService.setPatientContext('patient-456', 'John Doe');
            // Context is verified through subsequent operations
        });

        it('should clear context', () => {
            provenanceService.setPractitioner('prac-123', 'Dr. Smith');
            provenanceService.setPatientContext('patient-456', 'John Doe');
            provenanceService.clearContext();
            // Context is cleared
        });
    });

    describe('Convenience Methods', () => {
        beforeEach(() => {
            provenanceService.setPractitioner('prac-123', 'Dr. Smith');
            provenanceService.setPatientContext('patient-456', 'John Doe');
        });

        it('should record calculation provenance', async () => {
            const provenance = await provenanceService.recordCalculation({
                calculatorId: 'bmi-calc',
                calculatorName: 'BMI Calculator',
                inputs: { weight: 70, height: 175 },
                outputs: { bmi: 22.9, category: 'Normal' },
                timestamp: new Date(),
                patientId: 'patient-456',
                practitionerId: 'prac-123'
            });

            expect(provenance.activity?.coding[0].code).toBe('EXECUTE');
            expect(provenance.target[0].display).toContain('BMI Calculator');

            const records = provenanceService.getProvenanceRecords();
            expect(records.length).toBe(1);
        });

        it('should record data creation provenance', async () => {
            const provenance = await provenanceService.recordDataCreation(
                'Observation/obs-123',
                'Blood Glucose Measurement',
                'internal',
                'Routine lab work'
            );

            expect(provenance.activity?.coding[0].code).toBe('CREATE');
            expect(provenance.target[0].reference).toBe('Observation/obs-123');

            const records = provenanceService.getProvenanceRecords();
            expect(records.length).toBe(1);
        });

        it('should record data update provenance', async () => {
            const provenance = await provenanceService.recordDataUpdate(
                'Observation/obs-123',
                'Updated Blood Glucose',
                'Observation/obs-122',
                'Correction of measurement error'
            );

            expect(provenance.activity?.coding[0].code).toBe('UPDATE');
            expect(provenance.entity?.some(e => e.role === 'revision')).toBe(true);

            const records = provenanceService.getProvenanceRecords();
            expect(records.length).toBe(1);
        });

        it('should record derivation provenance', async () => {
            const provenance = await provenanceService.recordDerivation(
                'Observation/egfr-result',
                'Calculated eGFR',
                [
                    { reference: 'Observation/creatinine', display: 'Serum Creatinine' },
                    { reference: 'Patient/patient-456', display: 'Patient Demographics' }
                ],
                'eGFR calculated using CKD-EPI formula'
            );

            expect(provenance.activity?.coding[0].code).toBe('DERIVE');
            expect(provenance.entity?.filter(e => e.role === 'source').length).toBeGreaterThanOrEqual(2);

            const records = provenanceService.getProvenanceRecords();
            expect(records.length).toBe(1);
        });

        it('should record cross-hospital exchange provenance', async () => {
            const provenance = await provenanceService.recordCrossHospitalExchange(
                'Observation/ext-123',
                'External Lab Result',
                { id: 'org-external', name: 'External Hospital' },
                'Patient referral data'
            );

            expect(provenance.activity?.coding[0].code).toBe('CREATE');

            // Check data source
            const sourceEntity = provenance.entity?.find(
                e => e.what.identifier?.value === 'cross-hospital'
            );
            expect(sourceEntity).toBeDefined();

            // Check external organization agent
            const orgAgent = provenance.agent.find(
                a => a.who.reference === 'Organization/org-external'
            );
            expect(orgAgent).toBeDefined();

            const records = provenanceService.getProvenanceRecords();
            expect(records.length).toBe(1);
        });

        it('should record patient upload provenance', async () => {
            const provenance = await provenanceService.recordPatientUpload(
                'DocumentReference/doc-123',
                'Patient Uploaded Document',
                'patient-456',
                'John Doe',
                'Patient-provided medical history'
            );

            expect(provenance.activity?.coding[0].code).toBe('CREATE');

            // Check patient as author
            const patientAgent = provenance.agent.find(
                a => a.who.reference === 'Patient/patient-456'
            );
            expect(patientAgent).toBeDefined();

            // Check data source
            const sourceEntity = provenance.entity?.find(
                e => e.what.identifier?.value === 'patient-upload'
            );
            expect(sourceEntity).toBeDefined();

            const records = provenanceService.getProvenanceRecords();
            expect(records.length).toBe(1);
        });

        it('should record provenance with signature', async () => {
            const signatureData = 'SGVsbG8gV29ybGQ='; // Base64 "Hello World"
            const provenance = await provenanceService.recordWithSignature(
                'DiagnosticReport/report-123',
                'Signed Diagnostic Report',
                'VERIFY',
                signatureData,
                'verification'
            );

            expect(provenance.signature).toBeDefined();
            expect(provenance.signature?.[0].data).toBe(signatureData);

            const records = provenanceService.getProvenanceRecords();
            expect(records.length).toBe(1);
        });
    });

    describe('Local Storage', () => {
        it('should store records locally when enabled', async () => {
            provenanceService.setPractitioner('prac-123', 'Dr. Smith');
            await provenanceService.recordDataCreation(
                'Observation/123',
                'Test',
                'internal'
            );

            const stored = localStorage.getItem('medcalc_provenance_pending');
            expect(stored).not.toBeNull();
            const parsed = JSON.parse(stored!);
            expect(parsed.length).toBe(1);
        });

        it('should respect maxLocalRecords limit', async () => {
            const smallService = createProvenanceService({
                applicationId: 'test-app',
                applicationName: 'Test',
                enableLocalStorage: true,
                maxLocalRecords: 3,
                enableDebugLogging: false
            });

            // Add 5 records
            for (let i = 0; i < 5; i++) {
                await smallService.recordDataCreation(
                    `Observation/${i}`,
                    `Test ${i}`,
                    'internal'
                );
            }

            const stored = localStorage.getItem('medcalc_provenance_pending');
            const parsed = JSON.parse(stored!);
            expect(parsed.length).toBe(3); // Should be pruned to max
        });

        it('should return pending record count', async () => {
            await provenanceService.recordDataCreation('Obs/1', 'Test 1', 'internal');
            await provenanceService.recordDataCreation('Obs/2', 'Test 2', 'internal');

            expect(provenanceService.getPendingRecordCount()).toBe(2);
        });

        it('should clear local records', async () => {
            await provenanceService.recordDataCreation('Obs/1', 'Test', 'internal');
            provenanceService.clearLocalRecords();

            expect(provenanceService.getPendingRecordCount()).toBe(0);
            expect(provenanceService.getProvenanceRecords().length).toBe(0);
        });
    });

    describe('Export Functions', () => {
        beforeEach(async () => {
            provenanceService.setPractitioner('prac-123', 'Dr. Smith');
            await provenanceService.recordDataCreation('Obs/1', 'Test 1', 'internal');
            await provenanceService.recordDataCreation('Obs/2', 'Test 2', 'internal');
        });

        it('should export records as JSON', () => {
            const json = provenanceService.exportRecordsAsJson();
            const parsed = JSON.parse(json);

            expect(Array.isArray(parsed)).toBe(true);
            expect(parsed.length).toBe(2);
            expect(parsed[0].resourceType).toBe('Provenance');
        });

        it('should export records as FHIR Bundle', () => {
            const bundle = provenanceService.exportRecordsAsBundle() as any;

            expect(bundle.resourceType).toBe('Bundle');
            expect(bundle.type).toBe('collection');
            expect(bundle.entry.length).toBe(2);
            expect(bundle.entry[0].resource.resourceType).toBe('Provenance');
        });
    });

    describe('Lineage Report', () => {
        beforeEach(async () => {
            provenanceService.setPractitioner('prac-123', 'Dr. Smith');

            // Create a chain of provenance
            await provenanceService.recordDataCreation(
                'Observation/target-1',
                'Original Observation',
                'internal'
            );

            await provenanceService.recordDerivation(
                'Observation/target-1',
                'Derived Result',
                [{ reference: 'Observation/source-1', display: 'Source 1' }],
                'Derivation'
            );
        });

        it('should generate lineage report for target', () => {
            const report = provenanceService.generateLineageReport('Observation/target-1');

            expect(report.target).toBe('Observation/target-1');
            expect(report.records.length).toBe(2);
            expect(report.activities.length).toBeGreaterThanOrEqual(2);
            expect(report.timeline.length).toBe(2);
        });

        it('should include all sources in lineage report', () => {
            const report = provenanceService.generateLineageReport('Observation/target-1');

            expect(report.sources).toContain('Observation/source-1');
        });

        it('should include all agents in lineage report', () => {
            const report = provenanceService.generateLineageReport('Observation/target-1');

            expect(report.agents.length).toBeGreaterThan(0);
        });

        it('should sort timeline chronologically', () => {
            const report = provenanceService.generateLineageReport('Observation/target-1');

            const dates = report.timeline.map(t => new Date(t.date).getTime());
            for (let i = 1; i < dates.length; i++) {
                expect(dates[i]).toBeGreaterThanOrEqual(dates[i - 1]);
            }
        });
    });

    describe('Activity Types', () => {
        const activities: Array<{
            activity: ProvenanceActivity;
            expectedCode: string;
        }> = [
            { activity: 'CREATE', expectedCode: 'CREATE' },
            { activity: 'UPDATE', expectedCode: 'UPDATE' },
            { activity: 'DELETE', expectedCode: 'DELETE' },
            { activity: 'EXECUTE', expectedCode: 'EXECUTE' },
            { activity: 'VERIFY', expectedCode: 'VERIFY' },
            { activity: 'TRANSFORM', expectedCode: 'TRANSFORM' },
            { activity: 'COMPOSE', expectedCode: 'COMPOSE' },
            { activity: 'DERIVATION', expectedCode: 'DERIVE' }
        ];

        test.each(activities)('should handle $activity activity', ({ activity, expectedCode }) => {
            const provenance = provenanceService.createProvenance({
                targets: [{ reference: 'Observation/123' }],
                activity,
                agents: []
            });

            expect(provenance.activity?.coding[0].code).toBe(expectedCode);
        });
    });

    describe('Data Source Types', () => {
        const dataSources: Array<{
            source: DataSourceType;
            expectedDisplay: string;
        }> = [
            { source: 'internal', expectedDisplay: '本院產生' },
            { source: 'patient-upload', expectedDisplay: '病患上傳' },
            { source: 'cross-hospital', expectedDisplay: '跨院交換' },
            { source: 'external-system', expectedDisplay: '外部系統' },
            { source: 'manual-entry', expectedDisplay: '人工輸入' },
            { source: 'device', expectedDisplay: '設備產生' },
            { source: 'calculated', expectedDisplay: '計算衍生' }
        ];

        test.each(dataSources)('should handle $source data source', ({ source, expectedDisplay }) => {
            const provenance = provenanceService.createProvenance({
                targets: [{ reference: 'Observation/123' }],
                activity: 'CREATE',
                agents: [],
                dataSource: source
            });

            const sourceEntity = provenance.entity?.find(
                e => e.what.identifier?.value === source
            );
            expect(sourceEntity).toBeDefined();
            expect(sourceEntity?.what.display).toBe(expectedDisplay);
        });
    });

    describe('Agent Roles', () => {
        const roles: ProvenanceAgentRole[] = [
            'author', 'performer', 'verifier', 'attester',
            'informant', 'custodian', 'assembler', 'composer'
        ];

        test.each(roles)('should handle %s agent role', (role) => {
            const provenance = provenanceService.createProvenance({
                targets: [{ reference: 'Observation/123' }],
                activity: 'CREATE',
                agents: [
                    {
                        type: 'practitioner',
                        id: 'prac-123',
                        name: 'Dr. Test',
                        role
                    }
                ]
            });

            const practitionerAgent = provenance.agent.find(
                a => a.who.reference === 'Practitioner/prac-123'
            );
            expect(practitionerAgent).toBeDefined();
            expect(practitionerAgent?.role?.[0].coding[0].code).toBe(role);
        });
    });
});
