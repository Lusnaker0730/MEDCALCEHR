export interface Patient {
    id: string;
    resourceType: string;
    birthDate?: string;
    gender?: string;
    name?: Array<{
        family?: string;
        given?: string[];
        text?: string;
    }>;
}

export interface Quantity {
    value: number;
    unit: string;
    system?: string;
    code?: string;
}

export interface CodeableConcept {
    coding?: Array<{
        system?: string;
        code?: string;
        display?: string;
    }>;
    text?: string;
}

export interface Observation {
    resourceType: string;
    id: string;
    status: string;
    code: CodeableConcept;
    subject?: {
        reference: string;
    };
    effectiveDateTime?: string;
    valueQuantity?: Quantity;
    valueCodeableConcept?: CodeableConcept;
    valueString?: string;
    component?: Array<{
        code: CodeableConcept;
        valueQuantity?: Quantity;
    }>;
}

export interface Condition {
    resourceType: string;
    id: string;
    code?: CodeableConcept;
    clinicalStatus?: CodeableConcept;
    verificationStatus?: CodeableConcept;
    onsetDateTime?: string;
}

export interface MedicationRequest {
    resourceType: string;
    id: string;
    status: string;
    intent: string;
    medicationCodeableConcept?: CodeableConcept;
    medicationReference?: {
        reference: string;
    };
    authoredOn?: string;
}

export interface FHIRClient {
    patient: {
        read(): Promise<Patient>;
        id: string | null;
    };
    request(url: string): Promise<any>;
}
